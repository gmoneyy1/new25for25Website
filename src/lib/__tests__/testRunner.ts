#!/usr/bin/env tsx

/**
 * Test runner for improved hybrid optimization
 * Run with: npx tsx src/lib/__tests__/testRunner.ts
 */

import { runAllTests, quickSmokeTest } from './improvedHybridOptimization.spec';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    console.log('Running quick smoke test only...\n');
    const success = await quickSmokeTest();
    process.exit(success ? 0 : 1);
  } else {
    console.log('Running full test suite...\n');
    await runAllTests();
  }
}

main().catch(error => {
  console.error('Test runner crashed:', error);
  process.exit(1);
});
