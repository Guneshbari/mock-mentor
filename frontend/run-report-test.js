const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npx playwright test tests/report.spec.ts --project=chromium', { encoding: 'utf8', stdio: 'pipe' });
    fs.writeFileSync('report-out.txt', output);
} catch (error) {
    fs.writeFileSync('report-out.txt', error.stdout + '\n' + error.stderr);
}
console.log("Done running report generation test.");
