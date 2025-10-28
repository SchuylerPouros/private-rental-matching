const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

console.log("========================================");
console.log("Security Audit Report");
console.log("========================================\n");

async function runSecurityAudit() {
  const checks = [];

  // 1. npm audit
  console.log("1️⃣  Running npm audit...");
  console.log("------------------------------------------");
  try {
    const { stdout } = await execPromise("npm audit --json");
    const auditReport = JSON.parse(stdout);

    console.log(`Total vulnerabilities found: ${auditReport.metadata.vulnerabilities.total}`);
    console.log(`  - Critical: ${auditReport.metadata.vulnerabilities.critical}`);
    console.log(`  - High: ${auditReport.metadata.vulnerabilities.high}`);
    console.log(`  - Moderate: ${auditReport.metadata.vulnerabilities.moderate}`);
    console.log(`  - Low: ${auditReport.metadata.vulnerabilities.low}`);

    checks.push({
      name: "npm audit",
      passed: auditReport.metadata.vulnerabilities.critical === 0 &&
              auditReport.metadata.vulnerabilities.high === 0,
      critical: auditReport.metadata.vulnerabilities.critical,
      high: auditReport.metadata.vulnerabilities.high
    });
  } catch (error) {
    console.log("⚠️  npm audit found vulnerabilities");
    checks.push({ name: "npm audit", passed: false });
  }
  console.log("------------------------------------------\n");

  // 2. Solhint check
  console.log("2️⃣  Running Solhint security checks...");
  console.log("------------------------------------------");
  try {
    await execPromise("npm run lint:sol");
    console.log("✅ No Solidity linting issues found");
    checks.push({ name: "Solhint", passed: true });
  } catch (error) {
    console.log("❌ Solidity linting issues found");
    checks.push({ name: "Solhint", passed: false });
  }
  console.log("------------------------------------------\n");

  // 3. ESLint check
  console.log("3️⃣  Running ESLint security checks...");
  console.log("------------------------------------------");
  try {
    await execPromise("npm run lint");
    console.log("✅ No TypeScript linting issues found");
    checks.push({ name: "ESLint", passed: true });
  } catch (error) {
    console.log("❌ TypeScript linting issues found");
    checks.push({ name: "ESLint", passed: false });
  }
  console.log("------------------------------------------\n");

  // 4. Contract compilation
  console.log("4️⃣  Checking contract compilation...");
  console.log("------------------------------------------");
  try {
    await execPromise("npm run compile");
    console.log("✅ Contracts compiled successfully");
    checks.push({ name: "Compilation", passed: true });
  } catch (error) {
    console.log("❌ Contract compilation failed");
    checks.push({ name: "Compilation", passed: false });
  }
  console.log("------------------------------------------\n");

  // Summary
  console.log("========================================");
  console.log("Security Audit Summary");
  console.log("========================================\n");

  const passedChecks = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;

  checks.forEach(check => {
    const status = check.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${check.name}`);
  });

  console.log(`\nTotal: ${passedChecks}/${totalChecks} checks passed\n`);

  if (passedChecks === totalChecks) {
    console.log("🎉 All security checks passed!");
    console.log("========================================\n");
    process.exit(0);
  } else {
    console.log("⚠️  Some security checks failed. Please review and fix.");
    console.log("========================================\n");
    process.exit(1);
  }
}

runSecurityAudit().catch(error => {
  console.error("Error running security audit:", error);
  process.exit(1);
});
