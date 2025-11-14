const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Cypress Test Stability Audit...');

// Configuration
const config = {
  runs: 5, // Number of times to run each test
  specPattern: 'cypress/e2e/**/*.cy.{js,ts,jsx,tsx}',
  headless: true,
  browser: 'electron'
};

// Test results storage
const results = {
  specs: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Run Cypress tests multiple times
async function runTests(specFile) {
  const specResults = {
    runs: 0,
    passes: 0,
    failures: 0
  };

  console.log(`\n🧪 Running stability test for: ${specFile}`);

  for (let i = 1; i <= config.runs; i++) {
    console.log(`\n🔄 Run ${i}/${config.runs}`);
    
    try {
      const result = await runSingleTest(specFile);
      specResults.runs++;
      
      if (result.success) {
        specResults.passes++;
        console.log(`✅ Run ${i} passed`);
      } else {
        specResults.failures++;
        console.log(`❌ Run ${i} failed`);
      }
    } catch (error) {
      specResults.runs++;
      specResults.failures++;
      console.log(`❌ Run ${i} failed with error: ${error.message}`);
    }
  }

  // Calculate flakiness percentage
  const flakiness = ((specResults.failures / specResults.runs) * 100).toFixed(2);
  
  return {
    ...specResults,
    flakiness: `${flakiness}%`
  };
}

function runSingleTest(specFile) {
  return new Promise((resolve) => {
    const cypressArgs = [
      'cypress', 'run',
      '--spec', specFile,
      '--browser', config.browser
    ];

    if (config.headless) {
      cypressArgs.push('--headless');
    }

    const testProcess = spawn('npx', cypressArgs, {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    let success = false;

    testProcess.on('close', (code) => {
      success = code === 0;
      resolve({ success });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      testProcess.kill();
      resolve({ success: false });
    }, 300000);
  });
}

// Find all spec files
function findSpecFiles() {
  const specFiles = [];
  const cypressDir = path.join(process.cwd(), 'cypress', 'e2e');
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.cy.js') || file.endsWith('.cy.ts')) {
        specFiles.push(filePath);
      }
    });
  }
  
  if (fs.existsSync(cypressDir)) {
    walkDir(cypressDir);
  }
  
  return specFiles;
}

// Generate report
function generateReport() {
  console.log('\n📊 Test Stability Report');
  console.log('======================');
  
  Object.keys(results.specs).forEach(spec => {
    const specResult = results.specs[spec];
    console.log(`\n📄 ${spec}`);
    console.log(`   Runs: ${specResult.runs}`);
    console.log(`   Passes: ${specResult.passes}`);
    console.log(`   Failures: ${specResult.failures}`);
    console.log(`   Flakiness: ${specResult.flakiness}`);
  });
  
  console.log('\n📈 Summary');
  console.log(`   Total Runs: ${results.summary.total}`);
  console.log(`   Passed: ${results.summary.passed}`);
  console.log(`   Failed: ${results.summary.failed}`);
  console.log(`   Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(2)}%`);
  
  // Save to file
  const reportPath = path.join(process.cwd(), 'stability-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    const specFiles = findSpecFiles();
    
    if (specFiles.length === 0) {
      console.log('No spec files found!');
      process.exit(1);
    }
    
    console.log(`Found ${specFiles.length} spec files`);
    
    // Run tests for each spec file
    for (const specFile of specFiles) {
      const relativePath = path.relative(process.cwd(), specFile);
      const specResults = await runTests(specFile);
      
      results.specs[relativePath] = specResults;
      results.summary.total += specResults.runs;
      results.summary.passed += specResults.passes;
      results.summary.failed += specResults.failures;
    }
    
    // Generate final report
    generateReport();
    
    // Exit with appropriate code
    const successRate = results.summary.passed / results.summary.total;
    process.exit(successRate >= 0.8 ? 0 : 1);
  } catch (error) {
    console.error('💥 Stability audit failed:', error.message);
    process.exit(1);
  }
}

// Run the audit
main();