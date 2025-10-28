const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
const execPromise = util.promisify(exec);

console.log("========================================");
console.log("Gas Optimization Analysis");
console.log("========================================\n");

async function runGasAnalysis() {
  console.log("1️⃣  Running tests with gas reporting...");
  console.log("------------------------------------------");

  try {
    const { stdout, stderr } = await execPromise("REPORT_GAS=true npm test", {
      env: { ...process.env, REPORT_GAS: "true" }
    });

    // Parse gas report from output
    console.log("Gas usage report generated\n");

    // Check for gas report file
    const gasReportPath = path.join(__dirname, "..", "gas-report.txt");
    if (fs.existsSync(gasReportPath)) {
      const gasReport = fs.readFileSync(gasReportPath, "utf8");
      console.log(gasReport);
    }

  } catch (error) {
    console.log("Some tests failed, but gas report may still be available");
  }
  console.log("------------------------------------------\n");

  console.log("2️⃣  Gas Optimization Recommendations");
  console.log("------------------------------------------");
  console.log("✅ Use `uint256` instead of smaller uints when possible");
  console.log("✅ Pack storage variables to save gas");
  console.log("✅ Use `calldata` instead of `memory` for external functions");
  console.log("✅ Cache array length in loops");
  console.log("✅ Use `unchecked` for safe arithmetic operations");
  console.log("✅ Avoid unnecessary storage reads");
  console.log("✅ Use events instead of storage for historical data");
  console.log("------------------------------------------\n");

  console.log("3️⃣  Compiler Optimization Settings");
  console.log("------------------------------------------");
  console.log("Current optimizer runs: 200");
  console.log("Recommended for production: 800+");
  console.log("Higher runs = More optimized code, Longer compilation");
  console.log("------------------------------------------\n");

  console.log("========================================");
  console.log("Analysis Complete");
  console.log("========================================\n");
}

runGasAnalysis().catch(error => {
  console.error("Error running gas analysis:", error);
  process.exit(1);
});
