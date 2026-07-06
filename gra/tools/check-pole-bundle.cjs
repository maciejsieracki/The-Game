const fs = require('fs');
const crypto = require('crypto');
const paths = [
  'gra-robocza/Gra-podglad-POLE-BITWY.html',
  'Gra-podglad-POLE-BITWY.html',
  'gra-kanon/Gra-podglad-POLE-BITWY.html',
];
for (const p of paths) {
  const full = require('path').join(__dirname, '..', '..', p);
  if (!fs.existsSync(full)) { console.log(p, 'MISSING'); continue; }
  const s = fs.readFileSync(full, 'utf8');
  const md5 = crypto.createHash('md5').update(s).digest('hex');
  console.log('\n===', p, '===');
  console.log('bytes', s.length, 'md5', md5);
  console.log('weaponDamage', s.includes('weaponDamage'));
  console.log('unitRowStat', s.includes('unitRowStat'));
  console.log('legacy Atak dystansowy', /Atak dystansowy/.test(s));
  console.log('_singleBlow cuA.Atak', s.includes('cuA.Atak'));
}
