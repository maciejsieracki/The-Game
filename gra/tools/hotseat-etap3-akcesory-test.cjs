'use strict';
/**
 * hotseat-etap3-akcesory-test.cjs — bramka R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1.
 *
 * Dowodzi MATEMATYCZNIE (nie "zwykle tak samo"), że dla stanu single-human
 * (dzisiejszy, jedyny obowiązujący stan gry -- `humanSeats = { humanOwnerIds: [0],
 * activeHumanOwnerId: 0 }`) podmiana `ownerId === 0` -> `isHuman(ownerId)`
 * (alias na `isHumanOwner(humanSeats, ownerId)`) razem z podmianą bezpośredniego
 * odczytu/zapisu `player.X`/`playerPracaPool` na scaffold
 * `playerStateByHuman`/`pracaPoolByHuman` jest behawioralnym no-opem — dla
 * KAŻDEJ z ośmiu funkcji-akcesorów z main.ts, dla ownerId=0 (gracz) i co
 * najmniej dwóch dodatnich ownerId (AI).
 *
 * Metoda: odtwarza WERSJĘ SPRZED (kod dosłownie skopiowany z main.ts przed tą
 * rundą) i WERSJĘ PO (kod dosłownie skopiowany z main.ts po tej rundzie) jako
 * dwie niezależne implementacje nad tym samym stanem startowym, woła obie z
 * identycznymi argumentami, porównuje wyniki i efekty uboczne (mutacje).
 * To samo podejście co `hotseat-etap1-ownerid-test.cjs` (dowód równoważności
 * WYNIKOWEJ, nie identyczności tekstu kodu main.ts).
 *
 * Run: node tools/hotseat-etap3-akcesory-test.cjs (z katalogu gra/)
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hotseat-etap3-akcesory-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.hotseat-etap3-akcesory-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hotseat-etap3-akcesory-bundle.cjs');

const ENTRY_TS = `
export { HUMAN_OWNER_PRIMARY, isHumanOwner } from '../src/game/human-owners';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hotseat-etap3-akcesory-test] esbuild bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* best-effort */ }
}

let mod;
try {
  delete require.cache[require.resolve(BUNDLE_FILE)];
  mod = require(BUNDLE_FILE);
} catch (e) {
  console.error('[hotseat-etap3-akcesory-test] require bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(BUNDLE_FILE); } catch { /* best-effort */ }
}

const { HUMAN_OWNER_PRIMARY, isHumanOwner } = mod;

let pass = 0;
let fail = 0;

function assertEq(actual, expected, label) {
  const a = actual instanceof Set ? [...actual].sort().join(',') : actual;
  const e = expected instanceof Set ? [...expected].sort().join(',') : expected;
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${label} -- oczekiwano ${JSON.stringify(e)}, otrzymano ${JSON.stringify(a)}`);
  }
}

// --- dzisiejszy jedyny stan gry: dokladnie jeden fotel czlowieka (ownerId 0) ---
const humanSeats = { humanOwnerIds: [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY };
const AI_IDS = [1, 2, 42]; // >=2 dodatnie ownerId (AI), zgodnie z regułą anty-halucynacyjną

// =====================================================================
// Fabryki dwóch niezależnych implementacji (PRZED / PO) nad świeżym stanem
// startowym -- każdy test buduje swój własny `state`, żeby mutacje jednego
// testu nie wyciekały do następnego.
// =====================================================================

function freshState() {
  return {
    player: { skarbiec: 100, nauka: 50, era: 3, zbadane: new Set(['A', 'B']) },
    playerPracaPool: 77,
    _lastPraca: 0,
    aiSkarbiecByOwner: new Map([[1, 10], [2, 20], [42, 42]]),
    aiPracaPoolByOwner: new Map([[1, 11], [2, 22], [42, 44]]),
    aiNaukaPoolByOwner: new Map([[1, 5], [2, 6], [42, 7]]),
    aiResearchDone: new Map([[1, new Set(['X'])], [2, new Set()], [42, new Set(['Y', 'Z'])]]),
    ownerEraByOwner: new Map([[1, 2], [2, 4], [42, 1]]),
    ownerStartEraByOwner: new Map(),
  };
}

// --- PRZED: dosłownie main.ts sprzed tej rundy (ownerId === 0) ---
const before = {
  empireEpochForOwner(s, ownerId) {
    if (ownerId === 0) return s.player.era;
    return s.ownerEraByOwner.get(ownerId) ?? 1;
  },
  initOwnerEra(s, ownerId, era = 1) {
    if (ownerId === 0) return;
    const e = Math.max(1, Math.min(10, era));
    s.ownerEraByOwner.set(ownerId, e);
    s.ownerStartEraByOwner.set(ownerId, e);
  },
  ownerTreasury(s, ownerId) {
    return ownerId === 0 ? s.player.skarbiec : (s.aiSkarbiecByOwner.get(ownerId) ?? 0);
  },
  setOwnerTreasury(s, ownerId, value) {
    const v = Math.max(0, value);
    if (ownerId === 0) s.player.skarbiec = v;
    else s.aiSkarbiecByOwner.set(ownerId, v);
  },
  ownerPracaPool(s, ownerId) {
    return ownerId === 0 ? s.playerPracaPool : (s.aiPracaPoolByOwner.get(ownerId) ?? 0);
  },
  setOwnerPracaPool(s, ownerId, value) {
    const v = Math.max(0, value);
    if (ownerId === 0) { s.playerPracaPool = v; s._lastPraca = s.playerPracaPool; }
    else s.aiPracaPoolByOwner.set(ownerId, v);
  },
  ownerNaukaPool(s, ownerId) {
    return ownerId === 0 ? s.player.nauka : (s.aiNaukaPoolByOwner.get(ownerId) ?? 0);
  },
  setOwnerNaukaPool(s, ownerId, value) {
    const v = Math.max(0, value);
    if (ownerId === 0) { s.player.nauka = v; return; }
    s.aiNaukaPoolByOwner.set(ownerId, v);
  },
  ownerResearchedTechs(s, ownerId) {
    return ownerId === 0 ? s.player.zbadane : (s.aiResearchDone.get(ownerId) ?? new Set());
  },
  addOwnerResearchedTechs(s, ownerId, ids) {
    if (ownerId === 0) { for (const id of ids) s.player.zbadane.add(id); return; }
    if (!s.aiResearchDone.has(ownerId)) s.aiResearchDone.set(ownerId, new Set());
    const set = s.aiResearchDone.get(ownerId);
    for (const id of ids) set.add(id);
  },
};

// --- PO: dosłownie main.ts po tej rundzie (isHuman(ownerId) + scaffold) ---
function afterImpl(s) {
  const isHuman = (ownerId) => isHumanOwner(humanSeats, ownerId);
  const playerStateByHuman = new Map([[HUMAN_OWNER_PRIMARY, s.player]]);
  const pracaCell = {
    get praca() { return s.playerPracaPool; },
    set praca(v) { s.playerPracaPool = v; },
  };
  const pracaPoolByHuman = new Map([[HUMAN_OWNER_PRIMARY, pracaCell]]);
  return {
    empireEpochForOwner(ownerId) {
      if (isHuman(ownerId)) return playerStateByHuman.get(ownerId).era;
      return s.ownerEraByOwner.get(ownerId) ?? 1;
    },
    initOwnerEra(ownerId, era = 1) {
      if (isHuman(ownerId)) return;
      const e = Math.max(1, Math.min(10, era));
      s.ownerEraByOwner.set(ownerId, e);
      s.ownerStartEraByOwner.set(ownerId, e);
    },
    ownerTreasury(ownerId) {
      return isHuman(ownerId) ? playerStateByHuman.get(ownerId).skarbiec : (s.aiSkarbiecByOwner.get(ownerId) ?? 0);
    },
    setOwnerTreasury(ownerId, value) {
      const v = Math.max(0, value);
      if (isHuman(ownerId)) playerStateByHuman.get(ownerId).skarbiec = v;
      else s.aiSkarbiecByOwner.set(ownerId, v);
    },
    ownerPracaPool(ownerId) {
      return isHuman(ownerId) ? pracaPoolByHuman.get(ownerId).praca : (s.aiPracaPoolByOwner.get(ownerId) ?? 0);
    },
    setOwnerPracaPool(ownerId, value) {
      const v = Math.max(0, value);
      if (isHuman(ownerId)) { pracaPoolByHuman.get(ownerId).praca = v; s._lastPraca = s.playerPracaPool; }
      else s.aiPracaPoolByOwner.set(ownerId, v);
    },
    ownerNaukaPool(ownerId) {
      return isHuman(ownerId) ? playerStateByHuman.get(ownerId).nauka : (s.aiNaukaPoolByOwner.get(ownerId) ?? 0);
    },
    setOwnerNaukaPool(ownerId, value) {
      const v = Math.max(0, value);
      if (isHuman(ownerId)) { playerStateByHuman.get(ownerId).nauka = v; return; }
      s.aiNaukaPoolByOwner.set(ownerId, v);
    },
    ownerResearchedTechs(ownerId) {
      return isHuman(ownerId) ? playerStateByHuman.get(ownerId).zbadane : (s.aiResearchDone.get(ownerId) ?? new Set());
    },
    addOwnerResearchedTechs(ownerId, ids) {
      if (isHuman(ownerId)) { for (const id of ids) playerStateByHuman.get(ownerId).zbadane.add(id); return; }
      if (!s.aiResearchDone.has(ownerId)) s.aiResearchDone.set(ownerId, new Set());
      const set = s.aiResearchDone.get(ownerId);
      for (const id of ids) set.add(id);
    },
  };
}

const ALL_IDS = [0, ...AI_IDS];

// 1) empireEpochForOwner -- odczyt, brak mutacji
{
  const sB = freshState(); const sA = freshState(); const A = afterImpl(sA);
  for (const id of ALL_IDS) {
    assertEq(A.empireEpochForOwner(id), before.empireEpochForOwner(sB, id), `empireEpochForOwner(${id}) PRZED===PO`);
  }
}

// 2) initOwnerEra -- zapis (no-op dla gracza w OBU wersjach), porownaj stan mapy
{
  for (const id of ALL_IDS) {
    const sB = freshState(); before.initOwnerEra(sB, id, 7);
    const sA = freshState(); afterImpl(sA).initOwnerEra(id, 7);
    assertEq(sA.ownerEraByOwner.get(id), sB.ownerEraByOwner.get(id), `initOwnerEra(${id},7) ownerEraByOwner PRZED===PO`);
    assertEq(sA.player.era, sB.player.era, `initOwnerEra(${id},7) player.era niezmieniony identycznie PRZED/PO`);
  }
}

// 3) ownerTreasury / setOwnerTreasury
{
  const sB = freshState(); const sA = freshState(); const A = afterImpl(sA);
  for (const id of ALL_IDS) {
    assertEq(A.ownerTreasury(id), before.ownerTreasury(sB, id), `ownerTreasury(${id}) odczyt PRZED===PO`);
  }
  for (const id of ALL_IDS) {
    const sB2 = freshState(); before.setOwnerTreasury(sB2, id, 999);
    const sA2 = freshState(); afterImpl(sA2).setOwnerTreasury(id, 999);
    assertEq(afterImpl(sA2).ownerTreasury(id), before.ownerTreasury(sB2, id), `setOwnerTreasury(${id},999)->ownerTreasury PRZED===PO`);
  }
}

// 4) ownerPracaPool / setOwnerPracaPool (w tym _lastPraca dla gracza)
{
  const sB = freshState(); const sA = freshState(); const A = afterImpl(sA);
  for (const id of ALL_IDS) {
    assertEq(A.ownerPracaPool(id), before.ownerPracaPool(sB, id), `ownerPracaPool(${id}) odczyt PRZED===PO`);
  }
  for (const id of ALL_IDS) {
    const sB2 = freshState(); before.setOwnerPracaPool(sB2, id, 555);
    const sA2 = freshState(); afterImpl(sA2).setOwnerPracaPool(id, 555);
    assertEq(afterImpl(sA2).ownerPracaPool(id), before.ownerPracaPool(sB2, id), `setOwnerPracaPool(${id},555)->ownerPracaPool PRZED===PO`);
    assertEq(sA2._lastPraca, sB2._lastPraca, `setOwnerPracaPool(${id},555) _lastPraca PRZED===PO`);
    assertEq(sA2.playerPracaPool, sB2.playerPracaPool, `setOwnerPracaPool(${id},555) playerPracaPool (żywa zmienna) PRZED===PO`);
  }
}

// 5) ownerNaukaPool / setOwnerNaukaPool
{
  const sB = freshState(); const sA = freshState(); const A = afterImpl(sA);
  for (const id of ALL_IDS) {
    assertEq(A.ownerNaukaPool(id), before.ownerNaukaPool(sB, id), `ownerNaukaPool(${id}) odczyt PRZED===PO`);
  }
  for (const id of ALL_IDS) {
    const sB2 = freshState(); before.setOwnerNaukaPool(sB2, id, 321);
    const sA2 = freshState(); afterImpl(sA2).setOwnerNaukaPool(id, 321);
    assertEq(afterImpl(sA2).ownerNaukaPool(id), before.ownerNaukaPool(sB2, id), `setOwnerNaukaPool(${id},321)->ownerNaukaPool PRZED===PO`);
  }
}

// 6) ownerResearchedTechs / addOwnerResearchedTechs
{
  const sB = freshState(); const sA = freshState(); const A = afterImpl(sA);
  for (const id of ALL_IDS) {
    assertEq(A.ownerResearchedTechs(id), before.ownerResearchedTechs(sB, id), `ownerResearchedTechs(${id}) odczyt PRZED===PO`);
  }
  for (const id of ALL_IDS) {
    const sB2 = freshState(); before.addOwnerResearchedTechs(sB2, id, ['Q', 'R']);
    const sA2 = freshState(); afterImpl(sA2).addOwnerResearchedTechs(id, ['Q', 'R']);
    assertEq(afterImpl(sA2).ownerResearchedTechs(id), before.ownerResearchedTechs(sB2, id), `addOwnerResearchedTechs(${id},[Q,R])->ownerResearchedTechs PRZED===PO`);
  }
}

console.log(`hotseat-etap3-akcesory-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
