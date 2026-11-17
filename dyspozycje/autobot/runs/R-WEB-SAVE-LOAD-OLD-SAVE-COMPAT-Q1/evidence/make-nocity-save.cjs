'use strict';
// SYMULACJA scenariusza 0 miast (R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1, zarzut 3 Evaluatora).
// Bierze STARY zapis z fazy old (6 tur, miasto gracza istnieje, bez flagi playerEverOwnedCityByOwner)
// i usuwa z niego WSZYSTKIE miasta gracza (ownerId === ludzki wlasciciel 0). Jednostki zostaja.
// Efekt: gracz z 0 miast, a w zapisie brak flagi — stan defektu #433.
// Uzycie: node make-nocity-save.cjs <wejscie.json> <wyjscie.json>
const fs = require('fs');
const [inP, outP] = process.argv.slice(2);
if (!inP || !outP) { console.error('uzycie: node make-nocity-save.cjs <in.json> <out.json>'); process.exit(2); }
const obj = JSON.parse(fs.readFileSync(inP, 'utf8'));
const before = obj.cities.length;
const owned = obj.cities.filter((c) => c.ownerId === 0).length;
obj.cities = obj.cities.filter((c) => c.ownerId !== 0);
fs.writeFileSync(outP, JSON.stringify(obj));
console.log(JSON.stringify({ miastaPrzed: before, miastGraczaUsunieto: owned, miastaPo: obj.cities.length, flagaWZapisie: !!(obj.meta && 'playerEverOwnedCityByOwner' in obj.meta), symulacja: true }));
