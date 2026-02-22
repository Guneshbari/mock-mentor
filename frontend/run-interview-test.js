const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npx playwright test tests/interview.spec.ts --project=chromium', { encoding: 'utf8', stdio: 'pipe' });
    fs.writeFileSync('interview-out.txt', output);
} catch (error) {
    fs.writeFileSync('interview-out.txt', error.stdout + '\n' + error.stderr);
}
console.log("Done running interview test.");
