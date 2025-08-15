#!/usr/bin/env node

/**
 * COMPREHENSIVE CRITICAL TEST SUITE
 * Testing every aspect of the JetBlue 25for25 website
 * Acting as a very demanding, critical user
 */

const fs = require('fs').promises;
const path = require('path');

// Test configurations - from simple to extremely complex
const TEST_SCENARIOS = [
  {
    name: "🚨 CRITICAL: Basic NYC to Boston",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00", 
      endDate: "2025-08-15",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "BOS",
      visitedAirports: " ",
      minConnectionTime: 60
    },
    expectation: "Should find direct or 1-stop route same day",
    critical: true
  },

  {
    name: "🔥 STRESS TEST: Cross-country multi-day",
    config: {
      startDate: "2025-08-15",
      startTime: "05:00",
      endDate: "2025-08-18", 
      endTime: "23:59",
      startAirports: "JFK,LGA,EWR",
      endAirports: "LAX,SFO,SAN,LAS",
      visitedAirports: " ",
      minConnectionTime: 45
    },
    expectation: "Should maximize new airports across 4 days",
    critical: true
  },

  {
    name: "🏝️ CARIBBEAN ISLAND HOPPING",
    config: {
      startDate: "2025-08-16",
      startTime: "06:00",
      endDate: "2025-08-19",
      endTime: "23:59", 
      startAirports: "FLL,MIA",
      endAirports: "FLL,MIA",
      visitedAirports: " ",
      minConnectionTime: 90
    },
    expectation: "Should visit multiple Caribbean destinations",
    critical: true
  },

  {
    name: "⚡ TIGHT CONNECTIONS",
    config: {
      startDate: "2025-08-15",
      startTime: "14:00",
      endDate: "2025-08-15", 
      endTime: "22:00",
      startAirports: "DCA",
      endAirports: "BOS",
      visitedAirports: " ",
      minConnectionTime: 30
    },
    expectation: "Should respect tight timing constraints",
    critical: false
  },

  {
    name: "🚫 EXCLUSION TEST: Many visited airports",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-17",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK", 
      visitedAirports: "BOS,DCA,BWI,PHL,PIT,ATL,ORD,DEN,LAX,SFO,MIA,FLL,MCO,TPA,MSY",
      minConnectionTime: 60
    },
    expectation: "Should find new airports avoiding 15 visited ones",
    critical: true
  },

  {
    name: "🌙 RED-EYE ROUTE",
    config: {
      startDate: "2025-08-15", 
      startTime: "22:00",
      endDate: "2025-08-16",
      endTime: "08:00", 
      startAirports: "LAS",
      endAirports: "JFK,LGA,EWR",
      visitedAirports: " ",
      minConnectionTime: 60
    },
    expectation: "Should handle overnight flights properly",
    critical: false
  },

  {
    name: "🏔️ MOUNTAIN WEST LOOP",
    config: {
      startDate: "2025-08-15",
      startTime: "08:00",
      endDate: "2025-08-16",
      endTime: "20:00",
      startAirports: "DEN", 
      endAirports: "DEN",
      visitedAirports: " ",
      minConnectionTime: 120
    },
    expectation: "Should create efficient loop from Denver",
    critical: false
  },

  {
    name: "📍 SINGLE AIRPORT START/END",
    config: {
      startDate: "2025-08-20", 
      startTime: "06:00",
      endDate: "2025-08-22",
      endTime: "23:59",
      startAirports: "BOS",
      endAirports: "BOS",
      visitedAirports: " ", 
      minConnectionTime: 75
    },
    expectation: "Should loop from Boston visiting max new airports",
    critical: true
  },

  {
    name: "⚠️ EDGE CASE: Very short time window",
    config: {
      startDate: "2025-08-15",
      startTime: "23:45",
      endDate: "2025-08-15",
      endTime: "23:59", 
      startAirports: "JFK",
      endAirports: "LGA",
      visitedAirports: " ",
      minConnectionTime: 30
    },
    expectation: "Should gracefully return no valid route",
    critical: false
  },

  {
    name: "🎯 PERFORMANCE TEST: Week-long optimization",
    config: {
      startDate: "2025-08-15",
      startTime: "00:01", 
      endDate: "2025-08-22",
      endTime: "23:59",
      startAirports: "JFK,LGA,EWR,HPN",
      endAirports: "LAX,SFO,SAN,LAS,DEN,SEA",
      visitedAirports: " ",
      minConnectionTime: 90
    },
    expectation: "Should handle 7-day optimization without timeout",
    critical: true
  }
];

class CriticalTester {
  constructor() {
    this.results = [];
    this.criticalFailures = [];
    this.warnings = [];
    this.baseUrl = 'http://localhost:3000';
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testServerHealth() {
    await this.log("Testing server health and responsiveness...");
    
    try {
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/api/schedule`);
      const duration = Date.now() - start;
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      if (duration > 10000) {
        this.warnings.push(`Slow server response: ${duration}ms`);
        await this.log(`Server responded in ${duration}ms (SLOW)`, 'warning');
      } else {
        await this.log(`Server healthy, responded in ${duration}ms`, 'success');
      }
      
      return true;
    } catch (error) {
      this.criticalFailures.push(`Server health check failed: ${error.message}`);
      await this.log(`Server health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testOptimizationAPI(scenario) {
    await this.log(`Testing: ${scenario.name}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: scenario.config })
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        if (scenario.critical) {
          this.criticalFailures.push(`${scenario.name}: ${response.status} - ${errorText}`);
          await this.log(`CRITICAL FAILURE: ${errorText}`, 'error');
        } else {
          await this.log(`Expected failure: ${errorText}`, 'info');
        }
        return { success: false, error: errorText, duration };
      }

      const result = await response.json();
      
      if (result.error) {
        if (scenario.critical && !scenario.name.includes('EDGE CASE')) {
          this.criticalFailures.push(`${scenario.name}: ${result.error}`);
          await this.log(`CRITICAL: Algorithm failed - ${result.error}`, 'error');
        } else {
          await this.log(`Expected algorithm limitation: ${result.error}`, 'info');
        }
        return { success: false, error: result.error, duration };
      }

      // Analyze results critically
      const analysis = this.analyzeResults(result, scenario);
      
      await this.log(`SUCCESS: ${result.totalFlights} flights, ${result.newAirportsVisited.length} new airports, ${duration}ms`, 'success');
      
      if (analysis.warnings.length > 0) {
        analysis.warnings.forEach(warning => this.warnings.push(`${scenario.name}: ${warning}`));
      }
      
      if (analysis.critical.length > 0) {
        analysis.critical.forEach(critical => this.criticalFailures.push(`${scenario.name}: ${critical}`));
      }

      return {
        success: true,
        result,
        duration,
        analysis
      };

    } catch (error) {
      this.criticalFailures.push(`${scenario.name}: Network error - ${error.message}`);
      await this.log(`Network error: ${error.message}`, 'error');
      return { success: false, error: error.message, duration: Date.now() - startTime };
    }
  }

  analyzeResults(result, scenario) {
    const warnings = [];
    const critical = [];
    
    // Check for duplicate airports (CRITICAL)
    if (result.path && result.path.length > 0) {
      const routePath = [result.path[0].Origin];
      for (const flight of result.path) {
        routePath.push(flight.Destination);
      }
      
      const uniqueInRoute = [...new Set(routePath)];
      if (routePath.length !== uniqueInRoute.length) {
        const duplicates = routePath.filter((airport, index) => routePath.indexOf(airport) !== index);
        critical.push(`DUPLICATE AIRPORTS VISITED: ${duplicates.join(', ')}`);
      }
    }

    // Performance checks
    if (result.totalDuration > 2880) { // > 48 hours
      warnings.push(`Very long route duration: ${result.totalDuration} minutes`);
    }
    
    if (result.totalFlights > 20) {
      warnings.push(`High number of flights: ${result.totalFlights}`);
    }

    // Efficiency checks
    if (result.newAirportsVisited && result.newAirportsVisited.length === 0) {
      warnings.push(`No new airports visited`);
    }

    // Route logic checks
    if (result.path && result.path.length > 0) {
      const startAirports = scenario.config.startAirports.split(',').map(s => s.trim());
      const endAirports = scenario.config.endAirports.split(',').map(s => s.trim());
      
      if (!startAirports.includes(result.path[0].Origin)) {
        critical.push(`Route starts from wrong airport: ${result.path[0].Origin}`);
      }
      
      if (!endAirports.includes(result.path[result.path.length - 1].Destination)) {
        critical.push(`Route ends at wrong airport: ${result.path[result.path.length - 1].Destination}`);
      }
    }

    return { warnings, critical };
  }

  async testPricingAPI() {
    await this.log("Testing pricing API integration...");
    
    try {
      const response = await fetch(`${this.baseUrl}/api/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: [
            { Origin: 'JFK', Destination: 'BOS', 'Departure Datetime': '2025-08-15T08:00:00', 'Flight Number': 'B61018' }
          ]
        })
      });

      if (response.ok) {
        const pricing = await response.json();
        await this.log(`Pricing API working: ${pricing.totalCost ? '$' + pricing.totalCost : 'Fallback pricing'}`, 'success');
      } else {
        this.warnings.push('Pricing API not responding properly');
        await this.log('Pricing API issues (non-critical)', 'warning');
      }
    } catch (error) {
      this.warnings.push(`Pricing API error: ${error.message}`);
      await this.log(`Pricing API error: ${error.message}`, 'warning');
    }
  }

  async checkFileIntegrity() {
    await this.log("Checking critical file integrity...");
    
    const criticalFiles = [
      'data/jetblue_schedule.csv',
      'src/lib/server/optimizationEngine.ts',
      'src/components/RouteMapWithTiles.tsx',
      'src/components/SimpleSavedRoutes.tsx',
      '.env.local'
    ];

    for (const file of criticalFiles) {
      try {
        const filePath = path.join(process.cwd(), file);
        const stats = await fs.stat(filePath);
        
        if (file.endsWith('.csv') && stats.size < 1000) {
          this.criticalFailures.push(`${file} appears to be empty or corrupted`);
        } else {
          await this.log(`✓ ${file} exists (${Math.round(stats.size / 1024)}KB)`, 'success');
        }
      } catch (error) {
        if (file === '.env.local') {
          this.warnings.push(`${file} missing - Maps might not work`);
        } else {
          this.criticalFailures.push(`${file} missing or inaccessible`);
        }
      }
    }
  }

  async runComprehensiveTests() {
    console.log('🔥 COMPREHENSIVE CRITICAL TEST SUITE STARTING 🔥');
    console.log('='.repeat(60));
    
    // 1. Server Health
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      console.log('❌ CRITICAL: Server not healthy, aborting tests');
      return this.generateReport();
    }

    // 2. File Integrity
    await this.checkFileIntegrity();

    // 3. Pricing API Test
    await this.testPricingAPI();

    // 4. Optimization Tests
    await this.log(`Running ${TEST_SCENARIOS.length} optimization scenarios...`);
    
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      await this.log(`\n--- Test ${i + 1}/${TEST_SCENARIOS.length} ---`);
      
      const result = await this.testOptimizationAPI(scenario);
      this.results.push({ scenario: scenario.name, ...result });
      
      // Small delay between tests to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRITICAL TEST RESULTS REPORT');
    console.log('='.repeat(60));

    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.length - successCount;
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Successes: ${successCount}`);
    console.log(`   Failures: ${failureCount}`);
    console.log(`   Critical Failures: ${this.criticalFailures.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    if (this.criticalFailures.length > 0) {
      console.log(`\n🚨 CRITICAL FAILURES (MUST FIX):`);
      this.criticalFailures.forEach((failure, i) => {
        console.log(`   ${i + 1}. ${failure}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (SHOULD FIX):`);
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    // Performance Analysis
    const durations = this.results.filter(r => r.success).map(r => r.duration);
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      console.log(`\n⚡ PERFORMANCE:`);
      console.log(`   Average optimization time: ${Math.round(avgDuration)}ms`);
      console.log(`   Slowest optimization: ${maxDuration}ms`);
      
      if (maxDuration > 5000) {
        console.log(`   🐌 SLOW: Some optimizations taking >5 seconds`);
      }
    }

    // Route Analysis
    const successfulResults = this.results.filter(r => r.success && r.result);
    if (successfulResults.length > 0) {
      const totalNewAirports = successfulResults.reduce((sum, r) => 
        sum + (r.result.newAirportsVisited ? r.result.newAirportsVisited.length : 0), 0);
      const avgNewAirports = totalNewAirports / successfulResults.length;
      
      console.log(`\n✈️  ROUTE QUALITY:`);
      console.log(`   Average new airports per route: ${avgNewAirports.toFixed(1)}`);
      console.log(`   Total unique airports discovered: ${totalNewAirports}`);
    }

    console.log(`\n🏁 FINAL VERDICT:`);
    if (this.criticalFailures.length === 0) {
      console.log(`   ✅ WEBSITE IS PRODUCTION READY!`);
      console.log(`   🎉 All critical functionality working correctly`);
    } else {
      console.log(`   ❌ WEBSITE HAS CRITICAL ISSUES`);
      console.log(`   🔧 ${this.criticalFailures.length} critical issues must be fixed`);
    }

    return {
      success: this.criticalFailures.length === 0,
      criticalFailures: this.criticalFailures,
      warnings: this.warnings,
      results: this.results
    };
  }
}

// Run the comprehensive test suite
const tester = new CriticalTester();
tester.runComprehensiveTests()
  .then(report => {
    process.exit(report.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 TEST SUITE CRASHED:', error);
    process.exit(1);
  });