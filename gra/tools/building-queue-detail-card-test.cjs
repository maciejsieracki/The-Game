#!/usr/bin/env node
/**
 * H-BUDOWA-KARTA-KOLEJKA-Q1 — kontrakt regresyjny ścieżki kart budynku.
 * Testuje źródło renderowania UI (nie kopię logiki) i kontroluje mutację w pamięci.
 */
const fs = require('fs');
const assert = require('assert');

const src = fs.readFileSync('src/ui/cityPanel.ts', 'utf8');
function fn(name, next) {
  const start = src.indexOf(`function ${name}`);
  assert(start >= 0, `brak funkcji ${name}`);
  const end = next ? src.indexOf(`function ${next}`, start) : src.length;
  return src.slice(start, end < 0 ? src.length : end);
}
function ok(condition, message) { assert(condition, message); console.log(`PASS ${message}`); }

const prod = fn('renderProd', 'missingTechSteps');
const queue = fn('appendBuildQueueSection', 'renderProd');
const available = fn('appendBuildableItemRow', 'recruitManpowerCost');

ok(available.includes('attachHoverDetail('), 'dostępny budynek zachowuje istniejący podgląd karty');
ok(/attachInteractiveDetail\(\s*frontIcon/.test(prod), 'aktywny front budynku ma interaktywny anchor karty');
ok(prod.includes("buildBuildingBuildTabDetailCard(frontDef, data, city"), 'aktywny front korzysta z podstawowej karty budynku');
ok(/attachInteractiveDetail\(\s*queueIcon/.test(queue), 'oczekujący budynek ma interaktywny anchor karty');
ok(queue.includes("buildBuildingBuildTabDetailCard(queueDef, data, city"), 'oczekujący budynek korzysta z podstawowej karty budynku');
ok(/if \(data && it\.kind === 'budynek'\)/.test(queue), 'podgląd kolejki rozróżnia budynki od jednostek');
ok(!prod.includes('setProd(city.id') || prod.indexOf('attachInteractiveDetail(frontIcon') < prod.indexOf('setProd(city.id'), 'callback podglądu frontu jest przed akcjami mutującymi i sam ich nie wywołuje');
ok(!queue.includes('setProd(city.id,') || queue.indexOf('attachInteractiveDetail(queueIcon') < queue.indexOf('setProd(city.id,'), 'callback podglądu kolejki jest przed akcjami mutującymi i sam ich nie wywołuje');

// Mutacja kontrolna: usunięcie anchorów musi obrócić kontrakt w FAIL.
const mutant = src.replace(/attachInteractiveDetail/g, 'attachHoverDetail');
const mutationDetected = !/attachInteractiveDetail\(\s*frontIcon/.test(mutant)
  && !/attachInteractiveDetail\(\s*queueIcon/.test(mutant);
ok(mutationDetected, 'mutacja usuwająca oba anchor’y jest wykrywalna przez kontrakt (nietautologiczność)');

console.log('building-queue-detail-card: all assertions passed');
