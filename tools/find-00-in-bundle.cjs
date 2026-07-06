const fs = require('fs');
const s = fs.readFileSync(process.argv[2] || 'gra-robocza/Gra-podglad.html', 'utf8');

// Search for literal "0/0" as UI text (not base64)
const re = /[^A-Za-z0-9+/=]0\/0[^A-Za-z0-9+/=]/g;
let m, n = 0;
while ((m = re.exec(s)) !== null && n < 20) {
  console.log('---', m.index);
  console.log(s.slice(Math.max(0, m.index - 120), m.index + 120).replace(/\n/g, ' '));
  n++;
}
console.log('total literal 0/0 UI matches:', n);
