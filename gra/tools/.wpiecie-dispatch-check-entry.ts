/**
 * .wpiecie-dispatch-check-entry.ts — sprawdzenie END-TO-END, że buildUnitModel()
 * wywołane REALNĄ nazwą jednostki z gra/data/units.json zwraca model Opus 5,
 * a nie stary model kategorii. Nie jest częścią gry.
 *
 * Porównuje "odcisk palca" (liczba meshy + trójkątów + bbox) modelu z dispatchu
 * z modelem zbudowanym bezpośrednio przez builder Opus 5. Zgodność = wpięte.
 * Sprawdza też, że warianty kulturowe (np. „Włócznik sumeryjski") NIE zostały
 * przechwycone przez nowe wpisy.
 */
import * as THREE from 'three';
import { buildUnitModel } from '../src/render/units';
import { buildWlocznikBrazOpus5 } from '../src/render/braz-wlocznik-opus5';
import { buildMiecznikBrazOpus5 } from '../src/render/braz-miecznik-opus5';
import { buildProcarzBrazOpus5 } from '../src/render/braz-procarz-opus5';
import { buildRydwanWolyBrazOpus5 } from '../src/render/braz-rydwan-woly-opus5';
import { buildHastatiOpus5 } from '../src/render/hastati-opus5';

function fingerprint(g: THREE.Group): string {
  g.updateMatrixWorld(true);
  let mesh = 0, tri = 0;
  const box = new THREE.Box3().setFromObject(g);
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    mesh++;
    const pos = m.geometry.attributes['position'];
    if (pos) tri += Math.round(m.geometry.index ? m.geometry.index.count / 3 : pos.count / 3);
  });
  const f = (x: number): string => x.toFixed(4);
  return `${mesh}/${tri}/${f(box.min.x)},${f(box.min.y)},${f(box.min.z)},${f(box.max.x)},${f(box.max.y)},${f(box.max.z)}`;
}

type Case = { name: string; category: string; expect: () => THREE.Group; same: boolean };

const CASES: Case[] = [
  // PL i EN nazwy dokładnie jak w gra/data/units.json
  { name: 'Włócznik', category: 'wlocznik', expect: buildWlocznikBrazOpus5, same: true },
  { name: 'Spearman', category: 'wlocznik', expect: buildWlocznikBrazOpus5, same: true },
  { name: 'Wojownik z mieczem i tarczą', category: 'miecznik', expect: buildMiecznikBrazOpus5, same: true },
  { name: 'Swordsman', category: 'miecznik', expect: buildMiecznikBrazOpus5, same: true },
  { name: 'Procarz', category: 'procarz', expect: buildProcarzBrazOpus5, same: true },
  { name: 'Slinger', category: 'procarz', expect: buildProcarzBrazOpus5, same: true },
  { name: 'Rydwan (woły)', category: 'rydwan', expect: buildRydwanWolyBrazOpus5, same: true },
  { name: 'Ox Chariot', category: 'rydwan', expect: buildRydwanWolyBrazOpus5, same: true },
  { name: 'Hastati', category: 'miecznik', expect: buildHastatiOpus5, same: true },
  // NEGATYWNE: warianty kulturowe muszą zachować SWOJE modele
  { name: 'Włócznik sumeryjski', category: 'wlocznik', expect: buildWlocznikBrazOpus5, same: false },
  { name: 'Procarz (Huaracoc)', category: 'procarz', expect: buildProcarzBrazOpus5, same: false },
  { name: 'Rydwan egipski', category: 'rydwan', expect: buildRydwanWolyBrazOpus5, same: false },
  { name: 'Tyrski miecznik', category: 'miecznik', expect: buildMiecznikBrazOpus5, same: false },
  { name: 'Miecznik galijski', category: 'miecznik', expect: buildMiecznikBrazOpus5, same: false },
];

function run(): { ok: boolean; rows: string[] } {
  const rows: string[] = [];
  let ok = true;
  for (const c of CASES) {
    const got = fingerprint(buildUnitModel(c.category, 0x2f6fd0, c.name));
    const exp = fingerprint(c.expect(0x2f6fd0));
    const equal = got === exp;
    const pass = equal === c.same;
    if (!pass) ok = false;
    rows.push(`${pass ? 'PASS' : 'FAIL'}  ${c.name}  (oczekiwano ${c.same ? 'model Opus 5' : 'INNY model'})`);
  }
  return { ok, rows };
}

(window as unknown as { __check: unknown }).__check = run;
