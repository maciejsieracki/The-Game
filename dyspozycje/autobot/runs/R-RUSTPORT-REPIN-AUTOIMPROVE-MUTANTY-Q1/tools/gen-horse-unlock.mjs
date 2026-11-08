// Generuje wektory `isLivestockUnlockedForPlacement` (hex-wariant: zloze konia przez hexHasHorseDeposit)
// z uruchomionego WEBA (origin/main). Wynik = wartosc zwrocona przez web dla kazdego wejscia.
import { writeFileSync } from 'node:fs';
const base = process.env.WEB_DIR;
const outPath = process.argv[2];
const LU = await import(`${base}/gra/src/game/livestock-unlock.ts`);
const HX = await import(`${base}/gra/src/types/hex.ts`);
const NK = Object.values(HX.Nakladka);
const ZL = [undefined, 'konie', ' Konie ', 'KONIE', 'kon', 'miedz', '', 'konie '];
const KEYS = ['stadnina', 'farma'];
const TRADE = [false, true];
const STOCK = [0, 1e9];
const cases = [];
for (const key of KEYS) for (const nakladka of NK) for (const zloze of ZL) for (const trade of TRADE) for (const stock of STOCK) {
  const hex = { nakladka, zloze };
  const out = LU.isLivestockUnlockedForPlacement(key, hex, trade, stock);
  cases.push({ key, hex: { nakladka, zloze: zloze === undefined ? null : zloze }, trade, stock, out });
}
const yes = cases.filter((c) => c.out).length;
writeFileSync(outPath, JSON.stringify({ pin: '180c08305', source: 'gra/src/game/livestock-unlock.ts isLivestockUnlockedForPlacement', cases }) + '\n');
console.log(JSON.stringify({ total: cases.length, yes, nakladki: NK }));
