'use strict';
/**
 * hotseat-etap6f-start-migracja-test.cjs — bramka R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1.
 *
 * Dowodzi, że `restoreAiRosterFromSave` (ścieżka legacy-save bez zapisanego
 * rosteru) wyklucza z puli AI WSZYSTKICH `humanSeats.humanOwnerIds`, nie tylko
 * `ownerId === 0` — dla symulowanego dwu-osobowego hot-seatu
 * `humanOwnerIds=[0,1]`, nie tylko dla tautologicznego `[0]`.
 *
 * Metoda: odtwarza WERSJĘ SPRZED (`.filter(id => id !== 0)`, kod main.ts przed
 * tą rundą) i WERSJĘ PO (`.filter(id => isAiOwner(humanSeats, id))`, kod
 * main.ts po tej rundzie) jako dwie niezależne funkcje nad tym samym stanem
 * wejściowym, porównuje wyniki. To samo podejście co
 * `hotseat-etap3-akcesory-test.cjs` / `hotseat-etap1-ownerid-test.cjs`.
 *
 * Run: node tools/hotseat-etap6f-start-migracja-test.cjs (z katalogu gra/)
 */

const BARBARIAN_OWNER_ID = -1;
const REBEL_FACTION_OWNER_ID = -99;

/** Kopia 1:1 game/human-owners.ts:isHumanOwner/isAiOwner. */
function isHumanOwner(seats, ownerId) {
  return seats.humanOwnerIds.includes(ownerId);
}
function isAiOwner(seats, ownerId) {
  if (isHumanOwner(seats, ownerId)) return false;
  if (ownerId === BARBARIAN_OWNER_ID) return false;
  if (ownerId === REBEL_FACTION_OWNER_ID) return false;
  return true;
}

/** WERSJA SPRZED (main.ts:7557 przed migracją). */
function ownerIdsPre(cities, units) {
  return [...new Set([
    ...cities.map(c => c.ownerId),
    ...units.map(u => u.ownerId),
  ].filter(id => id !== 0))].sort((a, b) => a - b);
}

/** WERSJA PO (main.ts:7557 po migracji). */
function ownerIdsPost(cities, units, humanSeats) {
  return [...new Set([
    ...cities.map(c => c.ownerId),
    ...units.map(u => u.ownerId),
  ].filter(id => isAiOwner(humanSeats, id)))].sort((a, b) => a - b);
}

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`OK: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures++;
  }
}

// --- Scenariusz A: single-human (dzisiejszy stan produkcyjny) — no-op check ---
{
  const humanSeats = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
  const cities = [{ ownerId: 0 }, { ownerId: 1 }, { ownerId: 2 }];
  const units = [{ ownerId: 0 }, { ownerId: 3 }];
  const pre = ownerIdsPre(cities, units);
  const post = ownerIdsPost(cities, units, humanSeats);
  check('single-human [0]: PRE==POST (no-op zachowany)', JSON.stringify(pre) === JSON.stringify(post));
  check('single-human [0]: 0 wykluczone z puli AI', !post.includes(0));
  check('single-human [0]: AI 1,2,3 obecne', post.length === 3 && [1, 2, 3].every(x => post.includes(x)));
}

// --- Scenariusz B (KLUCZOWY, PRZECIW SAMOOSZUKIWANIU): humanOwnerIds=[0,1] ---
{
  const humanSeats = { humanOwnerIds: [0, 1], activeHumanOwnerId: 0 };
  const cities = [{ ownerId: 0 }, { ownerId: 1 }, { ownerId: 2 }, { ownerId: 3 }];
  const units = [{ ownerId: 1 }, { ownerId: 4 }];
  const pre = ownerIdsPre(cities, units);
  const post = ownerIdsPost(cities, units, humanSeats);

  // Dowód REGRESJI wersji SPRZED: drugi human (ownerId=1) BŁĘDNIE ląduje w puli AI.
  check('SPRZED (regresja): ownerId=1 (drugi human) BYŁ w puli AI', pre.includes(1));

  // Dowód FIX wersji PO: oba humanOwnerIds (0 i 1) wykluczone z puli AI.
  check('PO: ownerId=0 (human) wykluczony z puli AI', !post.includes(0));
  check('PO: ownerId=1 (drugi human) wykluczony z puli AI', !post.includes(1));
  check('PO: AI 2,3,4 obecne w puli', post.length === 3 && [2, 3, 4].every(x => post.includes(x)));
  check('PO != SPRZED dla [0,1] (migracja realnie coś zmienia)', JSON.stringify(pre) !== JSON.stringify(post));
}

// --- Scenariusz C: sentinel barbarzyńca/rebeliant nie trafiają do puli AI (PO) ---
{
  const humanSeats = { humanOwnerIds: [0, 1], activeHumanOwnerId: 0 };
  const cities = [{ ownerId: 0 }, { ownerId: BARBARIAN_OWNER_ID }, { ownerId: REBEL_FACTION_OWNER_ID }, { ownerId: 5 }];
  const units = [{ ownerId: 1 }];
  const post = ownerIdsPost(cities, units, humanSeats);
  check('PO: barbarzyńca (-1) wykluczony z puli AI', !post.includes(BARBARIAN_OWNER_ID));
  check('PO: rebeliant (-99) wykluczony z puli AI', !post.includes(REBEL_FACTION_OWNER_ID));
  check('PO: AI 5 obecne', post.includes(5));
}

if (failures > 0) {
  console.error(`\n${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('\nWSZYSTKIE TESTY PASS');
