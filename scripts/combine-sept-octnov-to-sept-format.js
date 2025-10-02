/*
 Combines September and October/November CSVs into a single CSV in a
 unified, normalized header used by our standard parser:

   Flight Number,Origin,Destination,Departure Datetime,Arrival Datetime,Elapsed Minutes,Cheapest Price,Search URL,Error Status,Equipment,Distance (MI)

 The September file (sept_data_dist.csv) has columns:
   Flight Number,Origin,Destination,Departure Date,Arrival Time,Duration,Price,Stops,Distance (MI)

 Mapping September -> Normalized:
   Departure Datetime = Departure Date
   Arrival Datetime   = Arrival Time
   Elapsed Minutes    = Duration
   Cheapest Price     = Price
   Search URL         = Stops
   Error Status       = OK
   Equipment          = ''

 The Oct/Nov file (octnov_data_with_distances.csv) is already in the
 normalized header; we append rows as-is.

 OUTPUT FILE:
   sept_octnov_combined_dist.csv (in project root)
*/

const fs = require('fs');
const path = require('path');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function toAmPm(hours24, minutes) {
  let period = 'am';
  let hours12 = hours24;
  if (hours24 === 0) {
    hours12 = 12;
  } else if (hours24 === 12) {
    period = 'pm';
  } else if (hours24 > 12) {
    hours12 = hours24 - 12;
    period = 'pm';
  }
  const mm = String(minutes).padStart(2, '0');
  return `${hours12}:${mm}${period}`;
}

function formatDateTime(dt) {
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const y = dt.getFullYear();
  const time = toAmPm(dt.getHours(), dt.getMinutes());
  return `${m}/${d}/${y} ${time}`;
}

function combineFiles() {
  const root = __dirname.replace(/\/scripts$/, '');
  const septPath = path.join(root, 'sept_data_dist.csv');
  const octNovPath = path.join(root, 'octnov_data_with_distances.csv');
  const outPath = path.join(root, 'sept_octnov_combined_dist.csv');

  if (!fs.existsSync(septPath)) {
    console.error(`❌ Missing file: ${septPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(octNovPath)) {
    console.error(`❌ Missing file: ${octNovPath}`);
    process.exit(1);
  }

  const headerNormalized = 'Flight Number,Origin,Destination,Departure Datetime,Arrival Datetime,Elapsed Minutes,Cheapest Price,Search URL,Error Status,Equipment,Distance (MI)';
  const output = [headerNormalized];

  // Append September data as-is (already in desired format)
  const septText = fs.readFileSync(septPath, 'utf8');
  const septLines = septText.split('\n').filter(Boolean);
  const septHeader = parseCsvLine(septLines[0]);
  const idxSept = {
    flight: septHeader.indexOf('Flight Number'),
    origin: septHeader.indexOf('Origin'),
    dest: septHeader.indexOf('Destination'),
    dep: septHeader.indexOf('Departure Date'), // contains datetime
    arr: septHeader.indexOf('Arrival Time'),   // contains datetime
    dur: septHeader.indexOf('Duration'),
    price: septHeader.indexOf('Price'),
    stops: septHeader.indexOf('Stops'),
    dist: septHeader.indexOf('Distance (MI)')
  };
  for (let i = 1; i < septLines.length; i++) {
    const values = parseCsvLine(septLines[i]);
    if (!values.length) continue;
    if (values.length < septHeader.length) continue;
    // Map to normalized row
    output.push([
      values[idxSept.flight],
      values[idxSept.origin],
      values[idxSept.dest],
      values[idxSept.dep],                // Departure Datetime
      values[idxSept.arr],                // Arrival Datetime
      values[idxSept.dur],                // Elapsed Minutes
      values[idxSept.price],              // Cheapest Price
      values[idxSept.stops],              // Search URL
      'OK',                               // Error Status
      '',                                 // Equipment
      values[idxSept.dist]
    ].join(','));
  }

  // Append Oct/Nov rows (already normalized) OR map if older format is present
  const octText = fs.readFileSync(octNovPath, 'utf8');
  const octLines = octText.split('\n').filter(Boolean);
  const octHeader = parseCsvLine(octLines[0]);
  const idxOct = {
    flight: octHeader.indexOf('Flight Number'),
    origin: octHeader.indexOf('Origin'),
    dest: octHeader.indexOf('Destination'),
    depDate: octHeader.indexOf('Departure Date'),
    arrTime: octHeader.indexOf('Arrival Time'),
    duration: octHeader.indexOf('Duration'),
    price: octHeader.indexOf('Price'),
    stops: octHeader.indexOf('Stops'), // URL
    dist: octHeader.indexOf('Distance (MI)'),
    depDt: octHeader.indexOf('Departure Datetime'),
    arrDt: octHeader.indexOf('Arrival Datetime'),
    elapsed: octHeader.indexOf('Elapsed Minutes'),
    cheapest: octHeader.indexOf('Cheapest Price'),
    url: octHeader.indexOf('Search URL'),
    status: octHeader.indexOf('Error Status'),
    equip: octHeader.indexOf('Equipment')
  };

  let transformed = 0;
  for (let i = 1; i < octLines.length; i++) {
    const values = parseCsvLine(octLines[i]);
    if (!values.length) continue;
    if (values.length < octHeader.length) continue;

    if (idxOct.depDt !== -1 && idxOct.arrDt !== -1) {
      // Already normalized header → append mapped row
      output.push([
        values[idxOct.flight],
        values[idxOct.origin],
        values[idxOct.dest],
        values[idxOct.depDt],
        values[idxOct.arrDt],
        values[idxOct.elapsed],
        values[idxOct.cheapest],
        values[idxOct.url],
        values[idxOct.status] || 'OK',
        values[idxOct.equip] || '',
        values[idxOct.dist]
      ].join(','));
      transformed++;
      continue;
    }

    // Older Oct/Nov header variant → map like September
    const dep = idxOct.depDate !== -1 ? values[idxOct.depDate] : '';
    const arr = idxOct.arrTime !== -1 ? values[idxOct.arrTime] : '';
    const dur = idxOct.duration !== -1 ? values[idxOct.duration] : '';
    const price = idxOct.price !== -1 ? values[idxOct.price] : '';
    const stops = idxOct.stops !== -1 ? values[idxOct.stops] : '';
    const dist = idxOct.dist !== -1 ? values[idxOct.dist] : '';
    if (!dep || !arr || !dur) continue;

    output.push([
      values[idxOct.flight],
      values[idxOct.origin],
      values[idxOct.dest],
      dep,
      arr,
      dur,
      price,
      stops,
      'OK',
      '',
      dist
    ].join(','));
    transformed++;
  }

  fs.writeFileSync(outPath, output.join('\n'));
  console.log(`✅ Combined CSV written: ${outPath}`);
  console.log(`   September rows: ${septLines.length - 1}`);
  console.log(`   Oct/Nov transformed rows: ${transformed}`);
  console.log(`   Total rows: ${output.length - 1}`);
}

if (require.main === module) {
  combineFiles();
}

module.exports = { combineFiles };


