const fs = require('fs');
let raw = fs.readFileSync('test-results.json');
if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
    raw = raw.slice(3);
} else if (raw[0] === 0xFF && raw[1] === 0xFE) {
    // UTF-16LE BOM
    raw = Buffer.from(raw.toString('utf16le'));
}
const data = JSON.parse(raw.toString('utf8'));

data.suites.forEach(suite => {
    suite.suites.forEach(s => {
        s.specs.forEach(spec => {
            spec.tests.forEach(test => {
                test.results.forEach(result => {
                    if (result.stderr) {
                        result.stderr.forEach(err => console.error("STDERR:", err.text));
                    }
                    if (result.stdout) {
                        result.stdout.forEach(out => {
                            if (out.text && out.text.includes('DOM EXCEPTION ERROR')) {
                                console.log("STDOUT:", out.text);
                            }
                        });
                    }
                });
            });
        });
    });
});
