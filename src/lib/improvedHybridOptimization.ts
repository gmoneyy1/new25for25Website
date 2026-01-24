// src/lib/improvedHybridOptimization.ts
// Clean Beam + Pareto + Seeded determinism + Adaptive convergence
// Works with any graph as long as you provide a neighbor-expander.

export type AirportId = number | string;

export type Neighbor = {
  next: AirportId;
  legTime: number;   // minutes or seconds — consistent with constraints
  departureTimestamp: number; // departure time (Unix ms)
  arrivalTimestamp: number;   // arrival time (Unix ms)
  meta?: any;        // carrier/flightNo/etc. if you want to keep it
};

export type ExpansionProvider = (state: Readonly<Node>) => Neighbor[];

export type Params = {
  // Determinism / exploration
  seed?: number;                 // default 42
  randomRestarts?: number;       // default 0 (deterministic single run)

  // Beam / pruning
  beamWidth?: number;            // default 96
  maxBeam?: number;              // default 224
  maxParetoPerAirport?: number;  // default 64

  // Convergence
  stagnationLayers?: number;     // default 5
  minBeamToContinue?: number;    // default 12
  maxMillis?: number;            // default 7000

  // Heuristic hint
  minLegTimeHint?: number;       // if omitted, we infer a coarse value

  // Constraints
  maxTotalTime?: number;         // required — total budget
  minConnectionTimeMinutes?: number; // minimum connection time in minutes
};

export type StartConfig = {
  startAirport: AirportId;
  startTimestamp: number;        // initial departure time (Unix ms)
  // If you have an initial time budget different from params.maxTotalTime, set here; else omit.
  timeBudget?: number;
};

export type Result = {
  visitedOrder: AirportId[];
  uniqueCount: number;
  totalLegs: number;
  timeUsed: number;
  timeLeft: number;
  debug?: {
    layers: number;
    bestProgressByLayer: number[];
    seed: number;
    beamStats: { initial: number; max: number };
  };
};

// ===== Internal state =====

type Node = {
  current: AirportId;
  path: AirportId[];       // visit order
  timeLeft: number;        // remaining budget
  gCost: number;           // time used so far
  fScore: number;          // A* style secondary score
  uniqueCount: number;     // unique airports in path
  visitedBits: Uint32Array;// bitset of visited airports (via index map)
  arrivalTimestamp: number; // last flight arrival time (Unix ms)
  // hint for sorting:
  _uniqueUpperBound: number;
};

type Indexer = {
  toIdx(a: AirportId): number;
  fromIdx(i: number): AirportId;
  size: number;
};

// ===== Bitset helpers =====

function bitsetSet(bits: Uint32Array, idx: number) {
  bits[idx >>> 5] |= (1 << (idx & 31));
}
function bitsetHas(bits: Uint32Array, idx: number) {
  return (bits[idx >>> 5] & (1 << (idx & 31))) !== 0;
}
function bitsetIsSuperset(a: Uint32Array, b: Uint32Array) {
  for (let i = 0; i < a.length; i++) if ((a[i] & b[i]) !== b[i]) return false;
  return true;
}
function cloneBits(bits: Uint32Array) { return new Uint32Array(bits); }

// ===== RNG (deterministic by default) =====

function createSeededRng(seedInit: number) {
  let seed = (seedInit >>> 0) || 123456789;
  return () => {
    seed = (1103515245 * seed + 12345) >>> 0;
    return seed / 0x100000000; // [0,1)
  };
}

// ===== Small utilities =====

function makeIndexer(allAirports: AirportId[]): Indexer {
  const map = new Map<AirportId, number>();
  allAirports.forEach((a, i) => map.set(a, i));
  return {
    toIdx: (a: AirportId) => {
      const idx = map.get(a);
      if (idx === undefined) throw new Error(`Unknown airport in indexer: ${String(a)}`);
      return idx;
    },
    fromIdx: (i: number) => allAirports[i],
    size: allAirports.length,
  };
}

function makeEmptyBits(n: number) {
  return new Uint32Array(((n + 31) / 32) | 0);
}

function inferMinLegTime(provider: ExpansionProvider, seedNode: Node, samples = 64) {
  // Very coarse estimation by sampling neighbors from the seed frontier.
  let sum = 0, c = 0, best = Infinity;
  const queue = [seedNode];
  for (let k = 0; k < samples && queue.length; k++) {
    const n = queue.shift()!;
    const neigh = provider(n);
    for (const e of neigh) {
      if (e.legTime > 0 && e.legTime < Infinity) {
        sum += e.legTime; c++;
        if (e.legTime < best) best = e.legTime;
        // push shallowly to spread samples a bit
        if (queue.length < 16) {
          const dummy = { ...n };
          queue.push(dummy as Node);
        }
      }
    }
  }
  if (!c) return 1;
  // Use a conservative lower-quantile-ish value
  return Math.max(1, Math.min(best * 1.0, (sum / c) * 0.7));
}

// ===== Pareto pruning per-airport =====

function isDominated(node: Node, list: Node[]): boolean {
  for (const s of list) {
    if (s.timeLeft >= node.timeLeft && bitsetIsSuperset(s.visitedBits, node.visitedBits)) {
      return true;
    }
  }
  return false;
}
function insertPareto(node: Node, list: Node[], cap: number) {
  if (isDominated(node, list)) return false;
  const filtered = list.filter(s =>
    !(node.timeLeft >= s.timeLeft && bitsetIsSuperset(node.visitedBits, s.visitedBits))
  );
  filtered.push(node);
  // Bound memory
  if (filtered.length > cap) {
    filtered.sort((a, b) =>
      (b.uniqueCount - a.uniqueCount) ||
      (b.timeLeft - a.timeLeft) ||
      (a.fScore - b.fScore)
    );
    filtered.length = cap;
  }
  list.splice(0, list.length, ...filtered);
  return true;
}

// ===== Main engine =====

export function improvedHybridOptimizeRoute(
  allAirports: AirportId[],
  start: StartConfig,
  params: Params,
  expand: ExpansionProvider
): Result {
  const {
    seed = 42,
    randomRestarts = 0,
    beamWidth: beam0 = 96,
    maxBeam = 224,
    maxParetoPerAirport = 64,
    stagnationLayers = 5,
    minBeamToContinue = 12,
    maxMillis = 7000,
    minLegTimeHint,
    maxTotalTime,
  } = params;

  if (maxTotalTime == null) {
    throw new Error("params.maxTotalTime is required");
  }

  const rng = createSeededRng(seed);
  const indexer = makeIndexer(allAirports);
  const startIdx = indexer.toIdx(start.startAirport);
  const bits0 = makeEmptyBits(indexer.size);
  bitsetSet(bits0, startIdx);

  const mkNode = (): Node => ({
    current: start.startAirport,
    path: [start.startAirport],
    timeLeft: start.timeBudget ?? maxTotalTime,
    gCost: 0,
    fScore: 0,
    uniqueCount: 1,
    visitedBits: cloneBits(bits0),
    arrivalTimestamp: start.startTimestamp, // Initial departure time
    _uniqueUpperBound: 1,
  });

  const runOnce = (seedBump: number) => {
    const runSeed = seed + seedBump;
    const rnd = createSeededRng(runSeed);

    const t0 = Date.now();
    let beamWidth = beam0;
    let frontier: Node[] = [mkNode()];
    let best: Node = frontier[0];
    const bestProgress: number[] = [];
    let bestUnique = 1;
    let lastImproveLayer = 0;
    let maxBeamSeen = beamWidth;

    // Heuristic calibration
    const minLegTime = minLegTimeHint ?? inferMinLegTime(expand, frontier[0], 64);

    // airport -> pareto set
    const pareto = new Map<AirportId, Node[]>();

    const scoreNode = (n: Node) => {
      // admissible-ish upper bound of extra uniques we can still add
      const extraUB = Math.floor(n.timeLeft / Math.max(1, minLegTime));
      n._uniqueUpperBound = n.uniqueCount + Math.max(0, extraUB);

      // A*-style time heuristic can be refined if you have an ETA-to-go;
      // keep 0 for now to let lexicographic keys dominate.
      const hTime = 0;
      n.fScore = n.gCost + hTime;
    };

    // initial scoring
    scoreNode(frontier[0]);

    let layer = 0;
    while (true) {
      if (Date.now() - t0 > maxMillis) break;
      if (!frontier.length) break;

      // Expand current layer
      const candidates: Node[] = [];
      const seenThisLayer = new Set<string>();

      for (const base of frontier) {
        const neighbors = expand(base);
        for (const e of neighbors) {
          if (e.legTime <= 0 || e.legTime === Infinity) continue;
          if (base.timeLeft < e.legTime) continue;

          // CRITICAL: Check connection time constraint
          const minConnectionMs = (params.minConnectionTimeMinutes ?? 60) * 60 * 1000;
          if (e.departureTimestamp < base.arrivalTimestamp + minConnectionMs) {
            continue; // Skip this flight - insufficient connection time
          }

          const nextIdx = indexer.toIdx(e.next);
          const visited = cloneBits(base.visitedBits);
          const wasVisited = bitsetHas(visited, nextIdx);
          if (!wasVisited) bitsetSet(visited, nextIdx);

          const n: Node = {
            current: e.next,
            path: base.path.concat(e.next),
            timeLeft: base.timeLeft - e.legTime,
            gCost: base.gCost + e.legTime,
            uniqueCount: base.uniqueCount + (wasVisited ? 0 : 1),
            visitedBits: visited,
            arrivalTimestamp: e.arrivalTimestamp, // Store arrival time for next connection check
            fScore: 0,
            _uniqueUpperBound: 0,
          };
          scoreNode(n);

          // Layer-level de-dup (tabu-lite)
          const key = `${n.current}:${Array.from(n.visitedBits).join(",")}`;
          if (seenThisLayer.has(key)) continue;
          seenThisLayer.add(key);

          // Pareto dominance per current airport
          const list = pareto.get(n.current) ?? [];
          if (!insertPareto(n, list, maxParetoPerAirport)) continue;
          pareto.set(n.current, list);

          candidates.push(n);
        }
      }

      if (!candidates.length) break;

      // Sort lexicographically: more unique, higher UB, then lower fScore, then smaller gCost
      candidates.sort((a, b) =>
        (b.uniqueCount - a.uniqueCount) ||
        (b._uniqueUpperBound - a._uniqueUpperBound) ||
        (a.fScore - b.fScore) ||
        (a.gCost - b.gCost)
      );

      // Track best
      if (candidates[0].uniqueCount > bestUnique) {
        bestUnique = candidates[0].uniqueCount;
        best = candidates[0];
        lastImproveLayer = layer;
      }
      bestProgress.push(bestUnique);

      // Adaptive beam
      if (best.uniqueCount > (frontier[0]?.uniqueCount ?? 0)) {
        beamWidth = Math.min(Math.floor(beamWidth * 1.5), maxBeam);
      } else if (beamWidth > beam0) {
        beamWidth = Math.max(beam0, Math.floor(beamWidth * 0.75));
      }
      maxBeamSeen = Math.max(maxBeamSeen, beamWidth);

      frontier = candidates.slice(0, beamWidth);

      // Convergence test (no progress for N layers AND frontier too narrow)
      const stagnating = (layer - lastImproveLayer) >= stagnationLayers;
      if (stagnating && frontier.length <= minBeamToContinue) break;

      layer += 1;

      // Small random shuffle inside tie groups (only if you enabled restarts)
      if (randomRestarts > 0) {
        // keep stability mostly — only perturb deep ties
        for (let i = 1; i < Math.min(frontier.length, 32); i++) {
          if (frontier[i].uniqueCount === frontier[i - 1].uniqueCount &&
              frontier[i]._uniqueUpperBound === frontier[i - 1]._uniqueUpperBound) {
            if (rnd() < 0.1) {
              const j = Math.floor(rnd() * i);
              const tmp = frontier[i]; frontier[i] = frontier[j]; frontier[j] = tmp;
            }
          }
        }
      }
    }

    const timeUsed = (start.timeBudget ?? maxTotalTime) - best.timeLeft;
    return <Result>{
      visitedOrder: best.path,
      uniqueCount: best.uniqueCount,
      totalLegs: best.path.length - 1,
      timeUsed,
      timeLeft: best.timeLeft,
      debug: {
        layers: layer + 1,
        bestProgressByLayer: bestProgress,
        seed: runSeed,
        beamStats: { initial: beam0, max: maxBeamSeen },
      }
    };
  };

  // Deterministic by default; if you want diversity, do k restarts with different seeds.
  let finalBest: Result | null = null;
  const runs = Math.max(1, (randomRestarts ?? 0) + 1);
  for (let k = 0; k < runs; k++) {
    const r = runOnce(k);
    if (!finalBest || r.uniqueCount > finalBest.uniqueCount ||
        (r.uniqueCount === finalBest.uniqueCount && r.timeUsed < finalBest.timeUsed)) {
      finalBest = r;
    }
  }
  return finalBest!;
}