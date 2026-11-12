'use strict';
/**
 * copper-income-audit-hook.cjs -- R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1.
 * Instrumentacja WYLACZNIE w KOPII gra/ poza repo (zero zmian w kodzie gry w repo).
 * Uzycie: node tools/copper-income-audit-hook.cjs <kopia-gra>   (po `ai-city-live-measure.cjs --prepare <kopia-gra>`)
 *
 * Patchuje w kopii:
 *  - src/game/building-stock-cost.ts: creditOwnerResourceStock / deductBuildingStockCostAcrossCities /
 *    assignOwnerResourceStockFromPool zapisuja do globalThis.__cuLedger wpisy {o,k,amt,src} dla sledzonych
 *    kluczy (ruda, braz, ruda_cyny, ruda_zelaza, zelazo). `src` = 3 najblizsze nazwy funkcji ze stosu
 *    (bundle budowany z --minify false, wiec nazwy sa czytelne). assignOwner... zapisuje DELTE puli (konwertery).
 *  - src/game/diplomacy-basket-transfer.ts: transferSurowiecIlosc -> +moved odbiorcy, -moved dawcy.
 *  - src/game/economy-upkeep.ts: reconcileOwnerResourceCaps -> ujemny wpis 'cap-trim'.
 *  - src/main.ts: window.__cuDump.dump() -> {turn, owners[{o,civ,era,cs,cities,stock{...},cap,mines}], ledger[...]}
 *    (ledger zagregowany po (o,k,src) i wyczyszczony po odczycie). Reszta (delta zapasu - suma ledgera) = przeplyw
 *    NIEOPISANY (np. zmiana wlasciciela miasta razem z jego City.surowce, bezposrednie przypisania).
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2]);
const TRACK = "['ruda','braz','ruda_cyny','ruda_zelaza','zelazo']";
const LEDGER_FN = `
const __CU_TRACK: ReadonlySet<string> = new Set(${TRACK});
function __cuSrc(): string {
  const st = String(new Error().stack ?? '').split('\\n').slice(3, 7)
    .map(l => { const m = /at (?:Object\\.)?([A-Za-z0-9_$.<>]+) /.exec(l); return m ? m[1] : '?'; });
  return st.join('<');
}
function __cuLog(o: number, k: string, amt: number, src?: string): void {
  if (!__CU_TRACK.has(k) || !Number.isFinite(amt) || amt === 0) return;
  const g = globalThis as any;
  if (g.__cuMute) return;
  (g.__cuLedger ??= []).push({ o, k, amt, src: src ?? __cuSrc() });
}
`;

function patch(rel, fn) {
  const f = path.join(root, rel);
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('__cuLog') || s.includes('__cuDump')) { console.log('juz zapatchowany', rel); return; }
  s = fn(s);
  fs.writeFileSync(f, s);
  console.log('zapatchowano', rel);
}
function rep1(s, from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`oczekiwano 1 wystapienia (${n}): ${from.slice(0, 80)}`);
  return s.replace(from, () => to);
}

// --- building-stock-cost.ts ---
patch('src/game/building-stock-cost.ts', (s) => {
  s = rep1(s, 'export function ownerResourceStockAll(', LEDGER_FN + '\nexport function ownerResourceStockAll(');
  // credit: zapisz faktycznie dodane toAdd
  s = rep1(s, '  target.surowce[key] = (target.surowce[key] ?? 0) + toAdd;\n  return toAdd;',
    '  target.surowce[key] = (target.surowce[key] ?? 0) + toAdd;\n  __cuLog(ownerId, key, toAdd);\n  return toAdd;');
  // deduct: zapisz faktycznie pobrane
  s = rep1(s, '      c.surowce[key] = have - take;\n      need -= take;\n    }\n  }\n}',
    '      c.surowce[key] = have - take;\n      need -= take;\n      __cuLog(ownerId, key, -take);\n    }\n  }\n}');
  // assign: delta puli, wewnetrzne kredyty wyciszone
  s = rep1(s, `  pool: Readonly<Record<string, number>>,
): void {
  for (const c of cities) {`, `  pool: Readonly<Record<string, number>>,
): void {
  const __before = ownerResourceStockAll(cities, ownerId);
  const __src = __cuSrc() + ':assign';
  (globalThis as any).__cuMute = true;
  try { __cuAssignInner(cities, ownerId, pool); } finally { (globalThis as any).__cuMute = false; }
  const __after = ownerResourceStockAll(cities, ownerId);
  for (const k of __CU_TRACK) __cuLog(ownerId, k, (__after[k] ?? 0) - (__before[k] ?? 0), __src);
}
function __cuAssignInner<T extends StockCitySource>(
  cities: ReadonlyArray<T>,
  ownerId: number,
  pool: Readonly<Record<string, number>>,
): void {
  for (const c of cities) {`);
  return s;
});

// --- diplomacy-basket-transfer.ts ---
patch('src/game/diplomacy-basket-transfer.ts', (s) => {
  s = rep1(s, '  nowySurowiec.set(recipient.id, (recipient.surowce[key] ?? 0) + moved);',
    "  nowySurowiec.set(recipient.id, (recipient.surowce[key] ?? 0) + moved);\n"
    + "  { const g = globalThis as any; if (['ruda','braz','ruda_cyny','ruda_zelaza','zelazo'].includes(key)) {\n"
    + "    const st = String(new Error().stack ?? '').split('\\n').slice(2, 5).map(l => { const m = /at (?:Object\\.)?([A-Za-z0-9_$.<>]+) /.exec(l); return m ? m[1] : '?'; }).join('<');\n"
    + "    (g.__cuLedger ??= []).push({ o: toOwnerId, k: key, amt: moved, src: 'transferSurowiecIlosc<' + st }, { o: fromOwnerId, k: key, amt: -moved, src: 'transferSurowiecIlosc<' + st }); } }");
  return s;
});

// --- economy-upkeep.ts ---
patch('src/game/economy-upkeep.ts', (s) => {
  s = rep1(s, '        c.surowce![key] = have - take;\n        excess -= take;',
    "        c.surowce![key] = have - take;\n        excess -= take;\n"
    + "        if (['ruda','braz','ruda_cyny','ruda_zelaza','zelazo'].includes(key) && take > 0) ((globalThis as any).__cuLedger ??= []).push({ o: ownerId, k: key, amt: -take, src: 'cap-trim' });");
  return s;
});

// --- main.ts ---
patch('src/main.ts', (s) => {
  const marker = '(window as any).__aiBuildingsTestDebug = {';
  if (s.split(marker).length !== 2) throw new Error('marker main.ts');
  const hook = `(window as any).__cuDump = { dump: () => {
      const keys = ['ruda', 'braz', 'ruda_cyny', 'ruda_zelaza', 'zelazo', 'drewno'];
      const owners = [...new Set(cities.map((c: any) => c.ownerId))].filter((o: any) => !isBarbarian(o)).sort((x: any, y: any) => x - y);
      const tn = buildAllTerritoryNodes();
      const mines = new Map<number, Record<string, number>>();
      for (const hk of Object.keys((map as any).hexes)) {
        const hx: any = (map as any).hexes[hk];
        const ks = improvementKeysForHex(hx);
        if (!ks.length) continue;
        const ow = territoryOwnerAt(hx.coords.q, hx.coords.r, tn);
        if (ow == null) continue;
        for (const k of ks) if (k === 'kopalnia_miedzi' || k === 'kopalnia_cyny' || k === 'kopalnia_zelaza') {
          const rec = mines.get(ow) ?? {}; rec[k] = (rec[k] ?? 0) + 1; mines.set(ow, rec);
        }
      }
      const out = owners.map((o: any) => {
        const stock: Record<string, number> = {};
        for (const k of keys) stock[k] = Math.round(ownerResourceStock(o, k) * 100) / 100;
        const built: Record<string, number> = {};
        for (const c of cities) if (c.ownerId === o) for (const b of (cityBuilt.get(c.id) ?? [])) if (/odlewnia|huta|kuznia|magazyn/.test(b)) built[b] = (built[b] ?? 0) + 1;
        return { o, civ: civKeyForOwnerId(o), era: empireEpochForOwner(o), cs: isCityStateOwner(o), me: o === 0,
          cities: cities.filter((c: any) => c.ownerId === o).length, stock,
          cap: ownerResourceCap(cities, cityBuilt, o, data, _menuDifficulty, empireEpochForOwner(o)),
          mines: mines.get(o) ?? {}, built };
      });
      const g = globalThis as any; const raw: any[] = g.__cuLedger ?? []; g.__cuLedger = [];
      const agg = new Map<string, any>();
      for (const e of raw) { const kk = e.o + '|' + e.k + '|' + e.src; const a = agg.get(kk) ?? { o: e.o, k: e.k, src: e.src, sum: 0, n: 0 }; a.sum += e.amt; a.n++; agg.set(kk, a); }
      return { turn, owners: out, ledger: [...agg.values()].map((a: any) => ({ ...a, sum: Math.round(a.sum * 100) / 100 })),
        cityOwners: cities.map((c: any) => [c.id, c.ownerId, Math.round((c.surowce?.ruda ?? 0)), Math.round((c.surowce?.braz ?? 0))]) };
    } };
    `;
  s = s.replace(marker, () => hook + marker);
  if (!/import \{[^}]*\bimprovementKeysForHex\b/.test(s)) {
    s = "import { improvementKeysForHex as improvementKeysForHex } from './game/terrain-improvements';\n" + s;
  }
  if (!/import \{[^}]*\bterritoryOwnerAt\b/.test(s)) {
    s = "import { territoryOwnerAt as territoryOwnerAt } from './map/territory';\n" + s;
  }
  return s;
});
