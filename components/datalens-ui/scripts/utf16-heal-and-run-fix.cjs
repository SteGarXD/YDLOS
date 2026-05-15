const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const fixPath = path.join(__dirname, 'fix-utf16-flat-tree-files.cjs');
const buf = fs.readFileSync(fixPath);
let text = null;
if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.subarray(2).toString('utf16le');
} else if (buf.length >= 8 && buf[1] === 0 && buf[3] === 0 && buf[0] === 0x23) {
    text = buf.toString('utf16le');
}
if (text != null) {
    if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
    }
    fs.writeFileSync(fixPath, text, 'utf8');
}
execFileSync(process.execPath, [fixPath], {stdio: 'inherit'});
