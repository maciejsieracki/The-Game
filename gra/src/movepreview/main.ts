/**
 * movepreview/main.ts — Prototyp ruchu jednostek po mapie (lane Civ-MAPA)
 *
 * Funkcje:
 *  - Select jednostki gracza (klik)
 *  - Pathfinding Dijkstra z kosztami terenu (terrain-movement.json)
 *  - Zasada MIN.1 POLE: ruchLeft>=1 => moze wejsc na sasiednie pole (koszt>ruchLeft => ruchLeft->0)
 *  - Podglad sciezki (hover) z numerami TUR na heksach konca tury + celu
 *  - Animacja ruchu po kliknieciu docelowego heksa (lerp) — wewnatrz jednej petli
 *  - Stacking: wielokrotne jednostki na heksie — licznik billboard
 *  - Hook reakcji ZoC: wejscie na hex sasiadujacy z wrogiem = HUD + stub flee/fight
 *  - Wejscie na hex wroga = stub "atak/bitwa"
 *  - Zakoncz ture: reset ruchLeft
 *  - Mgla: odslaniana wokol jednostek gracza (promien ~3)
 *  - Sterowanie kamera: drag=obrot, kolo=zoom, WASD=przesuw
 *
 * [NOWE] TEST OBLEZENIA:
 *  - Miasto przeciwnika z MUREM na heksie ladowym (buildBronzeCity grecja, poziom 6, withWalls=true)
 *  - Obronca (wroga jednostka) = garnizon w miescie
 *  - Atakujacy (jednostka gracza) = na sasiednim heksie
 *  - Detekcja ataku: klik gracza na heks MIASTA z wrogiem
 *  - Klasyfikacja: OBLEZENIE (mur+obronca) / zdobycie z marszu (bez muru) / bitwa polowa
 *  - Kontekst oblezenia: atakujacy, obronca, miasto, teren, struktury_obronne, posilki 1-heks, pozycje
 *  - Overlay przejscia do UNITS (stub)
 *
 * TODO: droga 0.5 / rzeka konczy ture (map.riverPaths) — pominiety stub
 */

import * as THREE from 'three';
import { generateMap } from '../map/generator';
import { buildScene } from '../render/scene';
import { buildUnitModel } from '../render/units';
import { buildBronzeCity } from '../render/bronzeCity';
import { axialToWorld, worldToAxial, HEX_R } from '../render/hexutil';
import { TerenBazowy, Nakladka } from '../types/hex';
import type { Hex } from '../types/hex';
import mvData from '../../data/terrain-movement.json';

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

interface UnitState {
  id: number;
  q: number;
  r: number;
  owner: 'gracz' | 'wrog';
  nazwa: string;
  kategoria: string;
  ruchMax: number;
  ruchLeft: number;
  group: THREE.Group;
  isGarrison?: boolean; // obronca w miescie
}

interface CityState {
  q: number;
  r: number;
  owner: 'wrog';
  civ: string;
  poziom: number;
  mur: boolean;
  fort: boolean;
  posterunek: boolean;
  group: THREE.Group;
}

interface MapRef {
  hexes: Record<string, Hex>;
  riverPaths: unknown[];
}

// Kierunki aksjalne 6-kier
const HEX_DIRS: [number, number][] = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

// ---------------------------------------------------------------------------
// Stale
// ---------------------------------------------------------------------------

const TERR_TOP: Partial<Record<TerenBazowy, number>> = {
  [TerenBazowy.Morze]:     0.30,
  [TerenBazowy.Wybrzeze]:  0.40,
  [TerenBazowy.Laka]:      0.45,
  [TerenBazowy.Rownina]:   0.53,
  [TerenBazowy.Pustynia]:  0.45,
  [TerenBazowy.Wzgorza]:   0.65,
  [TerenBazowy.Gory]:      0.80,
};

// Mapowanie TerenBazowy enum value -> klucz w terrain-movement.json
const TEREN_TO_MV_KEY: Partial<Record<TerenBazowy, string>> = {
  [TerenBazowy.Laka]:     'Laka',
  [TerenBazowy.Rownina]:  'Rownina',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Wybrzeze]: 'Wybrzeze',
  [TerenBazowy.Wzgorza]:  'Wzgorza',
  [TerenBazowy.Gory]:     'Gory',
  [TerenBazowy.Morze]:    'Morze',
};

// Czytelna nazwa terenu po polsku
const TEREN_NAZWY: Partial<Record<TerenBazowy, string>> = {
  [TerenBazowy.Laka]:     'Laka',
  [TerenBazowy.Rownina]:  'Rownina',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Wybrzeze]: 'Wybrzeze',
  [TerenBazowy.Wzgorza]:  'Wzgorza',
  [TerenBazowy.Gory]:     'Gory',
  [TerenBazowy.Morze]:    'Morze',
};

const OWNER_COLOR_GRACZ = 0xffd54a;
const OWNER_COLOR_WROG  = 0xe53935;

// Kolor podswietlenia sciezki
const COL_PATH_OK   = 0xffee44;
const COL_PATH_NEXT = 0x4499ff; // nastepna tura
const COL_SELECTED  = 0x00ff88;
const COL_CITY_ENEMY = 0xff4444; // podswietlenie wrogiego miasta

// ---------------------------------------------------------------------------
// Dane jednostek — 5 gracza + 3 wroga (w tym 1 garnizon)
// ---------------------------------------------------------------------------
const GRACZ_UNITS_DEF = [
  { nazwa: 'Wojownik',   kategoria: 'wlocznik',   ruchMax: 2 },
  { nazwa: 'Zwiadowca',  kategoria: 'zwiadowca',  ruchMax: 3 },
  { nazwa: 'Procarz',    kategoria: 'procarz',     ruchMax: 2 },
  { nazwa: 'Osadnik',    kategoria: 'osadnik',     ruchMax: 2 },
  { nazwa: 'Lucznik',    kategoria: 'lucznik',     ruchMax: 2 },
];
const WROG_UNITS_DEF = [
  { nazwa: 'Wlocznik (W)',  kategoria: 'wlocznik',  ruchMax: 2 },
  { nazwa: 'Wojownik (W)',  kategoria: 'maczuga',   ruchMax: 2 },
  { nazwa: 'Zwiadowca (W)', kategoria: 'zwiadowca', ruchMax: 3 },
];

// Garnizon (obronca w miescie) — osobna definicja
const GARRISON_DEF = { nazwa: 'Hoplita (garnizon)', kategoria: 'wlocznik', ruchMax: 2 };

// ---------------------------------------------------------------------------
// Pathfinding (Dijkstra)
// ---------------------------------------------------------------------------

function moveCost(hex: Hex): number {
  const key = TEREN_TO_MV_KEY[hex.terenBazowy] ?? 'Morze';
  const costs = mvData.costs as Record<string, number>;
  let base = costs[key] ?? 99;
  if (base >= 99) return 99;
  // Las: +forestExtra
  if (hex.nakladka === Nakladka.Las) base += (mvData.forestExtra ?? 1);
  // TODO: droga 0.5 / rzeka konczy ture (map.riverPaths)
  return base;
}

interface DijkNode {
  cost: number;
  prev: string | null;
  prevDir?: [number, number];
}

function dijkstra(
  startQ: number, startR: number,
  map: MapRef
): Map<string, DijkNode> {
  const dist = new Map<string, DijkNode>();
  const queue: Array<{ q: number; r: number; cost: number }> = [];

  const startKey = `${startQ},${startR}`;
  dist.set(startKey, { cost: 0, prev: null });
  queue.push({ q: startQ, r: startR, cost: 0 });

  while (queue.length > 0) {
    // prosty priorytet — sort bo mapa mala
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift()!;
    const currKey = `${curr.q},${curr.r}`;
    const currDist = dist.get(currKey)!;
    if (curr.cost > currDist.cost) continue;

    for (const [dq, dr] of HEX_DIRS) {
      const nq = curr.q + dq;
      const nr = curr.r + dr;
      const nKey = `${nq},${nr}`;
      const nhex = map.hexes[nKey];
      if (!nhex) continue;
      const c = moveCost(nhex);
      if (c >= 99) continue; // nieprzejezdne
      const newCost = curr.cost + c;
      const existing = dist.get(nKey);
      if (!existing || newCost < existing.cost) {
        dist.set(nKey, { cost: newCost, prev: currKey, prevDir: [dq, dr] });
        queue.push({ q: nq, r: nr, cost: newCost });
      }
    }
  }
  return dist;
}

function reconstructPath(
  fromKey: string, toKey: string,
  dist: Map<string, DijkNode>
): string[] {
  const path: string[] = [];
  let cur: string | null = toKey;
  while (cur && cur !== fromKey) {
    path.unshift(cur);
    cur = dist.get(cur)?.prev ?? null;
  }
  return path;
}

// ---------------------------------------------------------------------------
// Stacking — licznik billboard (Sprite + canvas texture)
// ---------------------------------------------------------------------------

function makeCounterSprite(count: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(20,20,40,0.85)';
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

// ---------------------------------------------------------------------------
// Billboard z numerem tury (biala cyfra na ciemnym kole)
// ---------------------------------------------------------------------------

function makeTurnLabel(turn: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  // ciemne tlo
  ctx.fillStyle = 'rgba(10,10,30,0.88)';
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  // obramowanie — pomaranczowe
  ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.stroke();
  // cyfra
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(turn), 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.65, 0.65, 1);
  return sprite;
}

// ---------------------------------------------------------------------------
// Podswietlenie heksow (path preview / selected)
// ---------------------------------------------------------------------------

function hexWorldPos(q: number, r: number, hexes: Record<string, Hex>): [number, number, number] {
  const { x, z } = axialToWorld(q, r, HEX_R);
  const hex = hexes[`${q},${r}`];
  const y = (TERR_TOP[hex?.terenBazowy ?? TerenBazowy.Laka] ?? 0.45);
  return [x, y, z];
}

function makeHexMarker(color: number, opacity: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(HEX_R * 0.80, HEX_R * 0.80, 0.06, 6);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

// ---------------------------------------------------------------------------
// Symulacja tur na sciezce — zwraca mape hexKey -> numer tury konca tury
// Tylko heksy gdzie KONCZY SIE TURA lub heks CELU dostaja numer.
// ---------------------------------------------------------------------------

interface TurnSimResult {
  /** klucz hex -> numer tury (tylko heksy konca tury + cel) */
  turnLabels: Map<string, number>;
  /** calkowita liczba tur do celu */
  totalTurns: number;
}

function simulateTurns(
  path: string[],
  ruchLeft: number,
  ruchMax: number,
  hexes: Record<string, Hex>
): TurnSimResult {
  const turnLabels = new Map<string, number>();
  if (path.length === 0) return { turnLabels, totalTurns: 0 };

  let rem = ruchLeft;
  let turn = 1;
  let prevKey: string | null = null;

  for (let i = 0; i < path.length; i++) {
    const key = path[i]!;
    const hex = hexes[key];
    if (!hex) { prevKey = key; continue; }
    const c = moveCost(hex);

    const isFirst = (i === 0);

    if (rem >= c) {
      // Jednostka wchodzi w tej turze
      rem -= c;
      prevKey = key;
    } else if (isFirst && rem >= 1) {
      // MIN.1 POLE: pierwszy krok tej tury — wchodzi mimo ze za drogi
      rem = 0;
      prevKey = key;
    } else {
      // Brakuje ruchu — TURA KONCZY SIE NA POPRZEDNIM HEKSIE
      if (prevKey !== null) {
        turnLabels.set(prevKey, turn);
      }
      turn++;
      rem = ruchMax;
      // Teraz wchodzimy na biezacy heks w nowej turze (MIN.1 POLE dla i>0 tez)
      if (rem >= c) {
        rem -= c;
      } else {
        // MIN.1 POLE: drogi hex w nowej turze
        rem = 0;
      }
      prevKey = key;
    }
  }

  // Cel (ostatni heks sciezki) dostaje numer aktualnej tury
  const destKey = path[path.length - 1]!;
  // Jesli destKey nie ma jeszcze etykiety (nie byl koncem tury) — dodaj
  if (!turnLabels.has(destKey)) {
    turnLabels.set(destKey, turn);
  }
  // Jesli destKey mial juz etykiete (byl koncem tury bo nie doszlo sie dalej) — zostaje

  return { turnLabels, totalTurns: turn };
}

// ---------------------------------------------------------------------------
// KONTEKST OBLEZENIA
// ---------------------------------------------------------------------------

type StarcieTryb = 'oblezenie' | 'zdobycie_z_marszu' | 'bitwa_polowa';

interface KontekstOblezenia {
  tryb: StarcieTryb;
  atakujacy: { nazwa: string; owner: string; q: number; r: number; kategoria: string };
  obronca: { nazwa: string; owner: string; q: number; r: number; kategoria: string } | null;
  miasto: { civ: string; poziom: number; q: number; r: number } | null;
  teren: string;
  struktury_obronne: { mur: boolean; fort: boolean; posterunek: boolean };
  posilki: {
    atakujacy: Array<{ nazwa: string; owner: string; q: number; r: number }>;
    obronca: Array<{ nazwa: string; owner: string; q: number; r: number }>;
  };
  pozycje: Array<{ nazwa: string; owner: string; q: number; r: number }>;
}

function getNeighborUnits(
  cq: number, cr: number,
  excludeId: number,
  units: UnitState[]
): UnitState[] {
  const result: UnitState[] = [];
  for (const [dq, dr] of HEX_DIRS) {
    const nq = cq + dq, nr = cr + dr;
    for (const u of units) {
      if (u.id !== excludeId && u.q === nq && u.r === nr) {
        result.push(u);
      }
    }
  }
  return result;
}

function buildKontekst(
  atakujacy: UnitState,
  targetQ: number, targetR: number,
  city: CityState | null,
  obronca: UnitState | null,
  units: UnitState[],
  hexes: Record<string, Hex>
): KontekstOblezenia {
  // Typ starcia
  let tryb: StarcieTryb;
  if (city && city.mur && obronca) {
    tryb = 'oblezenie';
  } else if (city && !city.mur && obronca) {
    tryb = 'zdobycie_z_marszu';
  } else {
    tryb = 'bitwa_polowa';
  }

  // Teren heksa celu
  const targetHex = hexes[`${targetQ},${targetR}`];
  const terenNazwa = targetHex
    ? (TEREN_NAZWY[targetHex.terenBazowy] ?? 'Nieznany')
    : 'Nieznany';
  const las = targetHex?.nakladka === Nakladka.Las ? '+Las' : '';

  // Posilki atakujacego: jednostki w promieniu 1 heksa od atakujacego (obie strony?)
  // Zasada: posilki atakujacego = jednostki GRACZA w zasięgu 1 heksa od ATAKUJACEGO
  const posilkiAtakujacyUnits = getNeighborUnits(atakujacy.q, atakujacy.r, atakujacy.id, units)
    .filter(u => u.owner === 'gracz');
  // Posilki obroncy: jednostki WROGA w zasięgu 1 heksa od MIASTA/OBRONCY
  const refQ = city ? city.q : (obronca?.q ?? targetQ);
  const refR = city ? city.r : (obronca?.r ?? targetR);
  const refId = obronca?.id ?? -1;
  const posilkiObroncyUnits = getNeighborUnits(refQ, refR, refId, units)
    .filter(u => u.owner === 'wrog');

  // Wszystkie jednostki wokol (kontekst pozycji)
  const allNearby: UnitState[] = [];
  const seen = new Set<number>();
  for (const u of units) {
    if (seen.has(u.id)) continue;
    // Czy jest w poblizu (2 heksy od celu lub od atakujacego)?
    const dqC = Math.abs(u.q - targetQ), drC = Math.abs(u.r - targetR), dsC = Math.abs(u.q + u.r - targetQ - targetR);
    const distC = Math.max(dqC, drC, dsC);
    const dqA = Math.abs(u.q - atakujacy.q), drA = Math.abs(u.r - atakujacy.r), dsA = Math.abs(u.q + u.r - atakujacy.q - atakujacy.r);
    const distA = Math.max(dqA, drA, dsA);
    if (distC <= 2 || distA <= 2) { allNearby.push(u); seen.add(u.id); }
  }

  return {
    tryb,
    atakujacy: {
      nazwa: atakujacy.nazwa,
      owner: atakujacy.owner,
      q: atakujacy.q,
      r: atakujacy.r,
      kategoria: atakujacy.kategoria,
    },
    obronca: obronca ? {
      nazwa: obronca.nazwa,
      owner: obronca.owner,
      q: obronca.q,
      r: obronca.r,
      kategoria: obronca.kategoria,
    } : null,
    miasto: city ? {
      civ: city.civ,
      poziom: city.poziom,
      q: city.q,
      r: city.r,
    } : null,
    teren: `${terenNazwa}${las}`,
    struktury_obronne: {
      mur: city?.mur ?? false,
      fort: city?.fort ?? false,
      posterunek: city?.posterunek ?? false,
    },
    posilki: {
      atakujacy: posilkiAtakujacyUnits.map(u => ({ nazwa: u.nazwa, owner: u.owner, q: u.q, r: u.r })),
      obronca: posilkiObroncyUnits.map(u => ({ nazwa: u.nazwa, owner: u.owner, q: u.q, r: u.r })),
    },
    pozycje: allNearby.map(u => ({ nazwa: u.nazwa, owner: u.owner, q: u.q, r: u.r })),
  };
}

// ---------------------------------------------------------------------------
// OVERLAY OBLEZENIA — panel HTML
// ---------------------------------------------------------------------------

function showSiegeOverlay(ctx: KontekstOblezenia): void {
  // Usun stary overlay jesli istnieje
  const old = document.getElementById('siege-overlay');
  if (old) old.remove();

  const trybLabels: Record<StarcieTryb, string> = {
    oblezenie: '⚔️ OBLEZENIE',
    zdobycie_z_marszu: '⚡ ZDOBYCIE Z MARSZU',
    bitwa_polowa: '⚔️ BITWA POLOWA',
  };
  const trybColors: Record<StarcieTryb, string> = {
    oblezenie: '#c0392b',
    zdobycie_z_marszu: '#e67e22',
    bitwa_polowa: '#8e44ad',
  };

  function boolIcon(v: boolean): string {
    return v ? '<span style="color:#27ae60">✓ TAK</span>' : '<span style="color:#888">✗ nie</span>';
  }

  function unitRow(u: {nazwa:string;owner:string;q:number;r:number}, extraStyle='') {
    const col = u.owner === 'gracz' ? '#ffd54a' : '#e53935';
    return `<span style="color:${col};${extraStyle}">${u.nazwa}</span> <small style="color:#888">(${u.owner}, q=${u.q},r=${u.r})</small>`;
  }

  const posilkiAtStr = ctx.posilki.atakujacy.length > 0
    ? ctx.posilki.atakujacy.map(u => unitRow(u)).join('<br>')
    : '<span style="color:#666">brak</span>';
  const posilkiObStr = ctx.posilki.obronca.length > 0
    ? ctx.posilki.obronca.map(u => unitRow(u)).join('<br>')
    : '<span style="color:#666">brak</span>';

  const pozycjeStr = ctx.pozycje.length > 0
    ? ctx.pozycje.map(u => unitRow(u)).join('<br>')
    : '<span style="color:#666">brak</span>';

  const struktury = ctx.struktury_obronne;
  const miastoStr = ctx.miasto
    ? `${ctx.miasto.civ.toUpperCase()} poz.${ctx.miasto.poziom} (q=${ctx.miasto.q},r=${ctx.miasto.r})`
    : '<span style="color:#666">brak</span>';

  let kontekstNote = '';
  if (ctx.tryb === 'oblezenie') {
    kontekstNote = `
      <div style="margin:10px 0 0 0;padding:8px;background:rgba(192,57,43,0.18);border-radius:6px;border:1px solid rgba(192,57,43,0.4);">
        <b style="color:#e74c3c">Tryb OBLEZENIE</b> — miasto z MUREM + obronca w garnizonie.<br>
        <small style="color:#aaa">Bonusy obronne (+mur) i mechanika szturmu = odpowiedzialnosc UNITS/EKONOMIA.<br>
        MAPA przekazuje tylko OBECNOSC struktur (mur, fort, posterunek) — nie wartosci liczbowe.</small>
      </div>`;
  } else if (ctx.tryb === 'zdobycie_z_marszu') {
    kontekstNote = `
      <div style="margin:10px 0 0 0;padding:8px;background:rgba(230,126,34,0.18);border-radius:6px;border:1px solid rgba(230,126,34,0.4);">
        <b style="color:#e67e22">Tryb ZDOBYCIE Z MARSZU</b> — miasto BEZ muru + obronca.<br>
        <small style="color:#aaa">Uproszczona walka bez szturmu przez brame.</small>
      </div>`;
  } else {
    kontekstNote = `
      <div style="margin:10px 0 0 0;padding:8px;background:rgba(142,68,173,0.18);border-radius:6px;border:1px solid rgba(142,68,173,0.4);">
        <b style="color:#9b59b6">Tryb BITWA POLOWA</b> — wroga jednostka na otwartym terenie.<br>
        <small style="color:#aaa">Bez modyfikatorow miejskich.</small>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.id = 'siege-overlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(8,10,18,0.82);backdrop-filter:blur(3px);
    z-index:1000;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,"Segoe UI",Arial,sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      background:#111622;border:2px solid ${trybColors[ctx.tryb]};border-radius:14px;
      padding:22px 28px;max-width:560px;width:92%;max-height:90vh;overflow-y:auto;
      box-shadow:0 8px 40px rgba(0,0,0,0.8),0 0 40px rgba(192,57,43,0.2);
      color:#e8eef8;
    ">
      <div style="text-align:center;margin-bottom:14px;">
        <div style="font-size:20px;font-weight:900;color:${trybColors[ctx.tryb]};letter-spacing:1px;">
          ${trybLabels[ctx.tryb]}
        </div>
        <div style="font-size:11px;color:#8a9ab8;margin-top:3px;">
          TRYB PRZEJSCIA — MAPA przekazuje kontekst do UNITS
        </div>
      </div>

      ${kontekstNote}

      <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:12px;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8;width:42%">Atakujacy</td>
          <td style="padding:6px 0">${unitRow(ctx.atakujacy, 'font-weight:700')}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8">Obronca</td>
          <td style="padding:6px 0">${ctx.obronca ? unitRow(ctx.obronca, 'font-weight:700') : '<span style="color:#666">brak</span>'}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8">Miasto</td>
          <td style="padding:6px 0">${miastoStr}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8">Teren</td>
          <td style="padding:6px 0">${ctx.teren}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8">Struktury obronne</td>
          <td style="padding:6px 0">
            Mur: ${boolIcon(struktury.mur)}&nbsp;&nbsp;
            Fort: ${boolIcon(struktury.fort)}&nbsp;&nbsp;
            Posterunek: ${boolIcon(struktury.posterunek)}
          </td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8;vertical-align:top">Posilki — atakujacy<br><small style="color:#666">(1 heks od atakujacego)</small></td>
          <td style="padding:6px 0">${posilkiAtStr}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:6px 0;color:#8a9ab8;vertical-align:top">Posilki — obronca<br><small style="color:#666">(1 heks od miasta)</small></td>
          <td style="padding:6px 0">${posilkiObStr}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8a9ab8;vertical-align:top">Pozycje w poblizu</td>
          <td style="padding:6px 0">${pozycjeStr}</td>
        </tr>
      </table>

      <div style="
        margin-top:16px;padding:10px 14px;
        background:rgba(39,174,96,0.12);border:1px solid rgba(39,174,96,0.3);border-radius:7px;
        font-size:11px;color:#8a9ab8;text-align:center;
      ">
        <b style="color:#27ae60">→ START sceny bitwy oblezniczej (UNITS)</b><br>
        <span style="color:#666">[stub — scena taktyczna = odpowiedzialnosc lane UNITS]</span><br>
        <small style="color:#555;display:block;margin-top:5px;">
          Modele miast z murami: Gra-podglad-OBLEZENIE.html (UNITS/MAPA)
        </small>
      </div>

      <div style="
        margin-top:10px;padding:8px 12px;
        background:rgba(255,165,0,0.08);border:1px solid rgba(255,165,0,0.2);border-radius:6px;
        font-size:10px;color:#7a8090;
      ">
        <b style="color:#e67e22">CO MUSI DOROIC UNITS/SILNIK:</b><br>
        — Mechanika szturmu przez brame (Taran/Wieza/Katapulta)<br>
        — HP muru / bramy (z siegeWall.ts)<br>
        — Bonusy obronne per struktura (+mur +fort +posterunek) w liczbach<br>
        — Inicjatywa / runda walki taktycznej<br>
        — Wynik oblezenia: kto wygrywa, stan miasta po walce<br>
        — Przekazanie wyniku z powrotem do MAPA (miasto zdobyte / obronione)
      </div>

      <div style="text-align:center;margin-top:14px;">
        <button id="siege-close" style="
          background:#ffd54a;color:#1a1a10;border:none;border-radius:8px;
          padding:9px 26px;font-size:13px;font-weight:800;cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">Zamknij — wróć do mapy</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('siege-close')?.addEventListener('click', () => {
    overlay.remove();
  });
  // Klik poza panelem = zamknij
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ---------------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------------

function clampInt(v: string | null, def: number, lo: number, hi: number): number {
  if (v === null) return def;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(hi, Math.max(lo, n));
}

function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('movepreview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);
  const W    = clampInt(params.get('w'), 38, 12, 100);
  const H    = clampInt(params.get('h'), 26, 10, 80);
  const SEED = params.get('seed') !== null ? (parseInt(params.get('seed')!, 10) || 0) : 42;

  const map = generateMap(W, H, SEED) as MapRef;
  const { scene, camera, renderer, center, setFog } = buildScene(map as Parameters<typeof buildScene>[0], canvas);

  // --- MGLA: startujemy od zupelnie ciemnej, potem odslaniana wokol gracza ---
  const allKeys = new Set<string>(Object.keys(map.hexes));
  const revealedKeys = new Set<string>();
  setFog(allKeys, revealedKeys);

  // --- Znajdz heksy ladowe do postawienia jednostek ---
  function isLand(hex: Hex): boolean {
    return hex.terenBazowy !== TerenBazowy.Morze &&
           hex.terenBazowy !== TerenBazowy.Gory &&
           hex.terenBazowy !== TerenBazowy.Wybrzeze;
  }

  const landHexes = Object.values(map.hexes).filter(isLand);
  if (landHexes.length < 10) {
    console.error('Za mala mapa — brak heksow ladowych'); return;
  }

  // Wybierz rozrzucone startowe heksy
  function pickSpread(n: number, avoidKeys: Set<string>, minDist = 4): Hex[] {
    const picked: Hex[] = [];
    const shuffled = [...landHexes].sort(() => Math.random() - 0.5);
    for (const hex of shuffled) {
      const key = `${hex.coords.q},${hex.coords.r}`;
      if (avoidKeys.has(key)) continue;
      // sprawdz min odleglosc od juz wybranych
      let ok = true;
      for (const p of picked) {
        const dq = Math.abs(hex.coords.q - p.coords.q);
        const dr = Math.abs(hex.coords.r - p.coords.r);
        const ds = Math.abs(hex.coords.q + hex.coords.r - p.coords.q - p.coords.r);
        const d = Math.max(dq, dr, ds);
        if (d < minDist) { ok = false; break; }
      }
      if (ok) { picked.push(hex); avoidKeys.add(key); if (picked.length >= n) break; }
    }
    return picked;
  }

  const usedKeys = new Set<string>();

  // ---------------------------------------------------------------------------
  // SCENARIUSZ OBLEZENIA: Postaw miasto wroga Z MUREM
  // ---------------------------------------------------------------------------

  // Wybierz heks ladowy dla miasta — szukamy centralnego (blisko srodka mapy)
  const centerQ = Math.floor(W / 2);
  const centerR = Math.floor(H / 4);
  let cityHex: Hex | null = null;
  // Szukaj najblizszego ladowego heksa do centrum mapy
  let bestDist = Infinity;
  for (const hex of landHexes) {
    const dq = hex.coords.q - centerQ, dr = hex.coords.r - centerR;
    const d = Math.sqrt(dq * dq + dr * dr);
    if (d < bestDist) { bestDist = d; cityHex = hex; }
  }
  if (!cityHex) { cityHex = landHexes[0]!; }
  const cityQ = cityHex.coords.q;
  const cityR = cityHex.coords.r;
  const cityKey = `${cityQ},${cityR}`;
  usedKeys.add(cityKey);

  // Postaw model miasta
  const cityGroup = buildBronzeCity('grecja', 6, 0xe53935, true); // withWalls=true
  const [cx, cy, cz] = hexWorldPos(cityQ, cityR, map.hexes);
  cityGroup.position.set(cx, cy, cz);
  cityGroup.scale.setScalar(HEX_R);
  scene.add(cityGroup);

  // Stan miasta
  const siegeCity: CityState = {
    q: cityQ, r: cityR,
    owner: 'wrog',
    civ: 'grecja',
    poziom: 6,
    mur: true,
    fort: false,
    posterunek: false,
    group: cityGroup,
  };

  // Podswietl heks miasta (czerwony marker)
  const cityMarker = makeHexMarker(COL_CITY_ENEMY, 0.5);
  cityMarker.position.set(cx, cy + 0.05, cz);
  scene.add(cityMarker);

  // Oznacz miasto jako odkryte w mgle
  revealedKeys.add(cityKey);

  // ---------------------------------------------------------------------------
  // JEDNOSTKI
  // ---------------------------------------------------------------------------
  let nextId = 1;
  const units: UnitState[] = [];

  function placeUnit(
    def: { nazwa: string; kategoria: string; ruchMax: number },
    owner: 'gracz' | 'wrog',
    hex: Hex,
    isGarrison = false
  ): UnitState {
    const color = owner === 'gracz' ? OWNER_COLOR_GRACZ : OWNER_COLOR_WROG;
    let group: THREE.Group;
    try {
      group = buildUnitModel(def.kategoria, color, def.nazwa);
    } catch (e) {
      console.warn(`buildUnitModel fallback dla ${def.nazwa}:`, e);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.55, 8),
        new THREE.MeshStandardMaterial({ color })
      );
      group = new THREE.Group(); group.add(cyl);
    }
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
    const y = TERR_TOP[hex.terenBazowy] ?? 0.45;
    group.position.set(x, y + 0.02, z);
    group.scale.setScalar(0.38);
    scene.add(group);

    const unit: UnitState = {
      id: nextId++,
      q: hex.coords.q, r: hex.coords.r,
      owner, nazwa: def.nazwa, kategoria: def.kategoria,
      ruchMax: def.ruchMax, ruchLeft: def.ruchMax,
      group,
      isGarrison,
    };
    units.push(unit);
    return unit;
  }

  // Garnizon (obronca) — na heksie miasta
  placeUnit(GARRISON_DEF, 'wrog', cityHex, true);

  // Atakujacy (gracz) — na SASIEDNIM heksie miasta
  // Szukaj pierwszego sasiednego ladowego heksa
  let attackerHex: Hex | null = null;
  for (const [dq, dr] of HEX_DIRS) {
    const nq = cityQ + dq, nr = cityR + dr;
    const nk = `${nq},${nr}`;
    const nh = map.hexes[nk];
    if (nh && isLand(nh)) {
      attackerHex = nh;
      usedKeys.add(nk);
      break;
    }
  }
  if (!attackerHex) {
    // Fallback: znajdz jakikolwiek ladowy heks
    attackerHex = landHexes.find(h => !usedKeys.has(`${h.coords.q},${h.coords.r}`)) ?? landHexes[0]!;
    usedKeys.add(`${attackerHex.coords.q},${attackerHex.coords.r}`);
  }
  const attackerDef = { nazwa: 'Wojownik', kategoria: 'wlocznik', ruchMax: 2 };
  const attackerUnit = placeUnit(attackerDef, 'gracz', attackerHex);

  // Reszta jednostek gracza (bez pierwszego — juz umieszczono)
  const graczStartHexes = pickSpread(GRACZ_UNITS_DEF.length - 1, usedKeys, 4);
  graczStartHexes.forEach((hex, i) => {
    const def = GRACZ_UNITS_DEF[i + 1]; // pominij indeks 0 (Wojownik juz umieszczony)
    if (def) placeUnit(def, 'gracz', hex);
  });

  // Jednostki wroga (dodatkowe — nie garnizon)
  const wrogStartHexes = pickSpread(WROG_UNITS_DEF.length, usedKeys, 4);
  wrogStartHexes.forEach((hex, i) => {
    const def = WROG_UNITS_DEF[i];
    if (def) placeUnit(def, 'wrog', hex);
  });


  // --- Stacking liczniki ---
  const stackCounters = new Map<string, THREE.Sprite>();

  function updateStackCounters(): void {
    for (const sprite of stackCounters.values()) scene.remove(sprite);
    stackCounters.clear();

    const countPerHex = new Map<string, number>();
    for (const u of units) {
      const key = `${u.q},${u.r}`;
      countPerHex.set(key, (countPerHex.get(key) ?? 0) + 1);
    }
    for (const [key, count] of countPerHex) {
      if (count <= 1) continue;
      const [sq, sr] = key.split(',').map(Number) as [number, number];
      const [x, y, z] = hexWorldPos(sq, sr, map.hexes);
      const sprite = makeCounterSprite(count);
      sprite.position.set(x, y + 1.2, z);
      scene.add(sprite);
      stackCounters.set(key, sprite);
    }
  }

  // --- Mgla — odslon wokol jednostek gracza ---
  function revealAroundPlayerUnits(): void {
    const RADIUS = 3;
    for (const u of units) {
      if (u.owner !== 'gracz') continue;
      const visited = new Set<string>();
      const queue: Array<{ q: number; r: number; d: number }> = [{ q: u.q, r: u.r, d: 0 }];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const k = `${curr.q},${curr.r}`;
        if (visited.has(k)) continue;
        visited.add(k);
        revealedKeys.add(k);
        if (curr.d < RADIUS) {
          for (const [dq, dr] of HEX_DIRS) {
            const nk = `${curr.q + dq},${curr.r + dr}`;
            if (map.hexes[nk] && !visited.has(nk)) {
              queue.push({ q: curr.q + dq, r: curr.r + dr, d: curr.d + 1 });
            }
          }
        }
      }
    }
    setFog(allKeys, revealedKeys);
  }

  updateStackCounters();
  revealAroundPlayerUnits();

  // --- HUD ---
  const elMeta       = document.getElementById('meta')!;
  const elUnitInfo   = document.getElementById('unit-info')!;
  const elPathInfo   = document.getElementById('path-info')!;
  const elReaction   = document.getElementById('reaction-info')!;

  elMeta.textContent = `${W}x${H} hex · seed ${SEED} · jednostki: ${units.length} · miasto: Grecja poz.6+mur (q=${cityQ},r=${cityR})`;

  // --- Stan selekcji ---
  let selectedUnit: UnitState | null = null;
  let currentDijkstra: Map<string, DijkNode> | null = null;
  let pathMarkers: THREE.Mesh[] = [];
  let turnSprites: THREE.Sprite[] = [];
  let selectedMarker: THREE.Mesh | null = null;
  let animating = false;

  // Stan animacji ruchu
  let animSteps: string[] = [];
  let animStepIdx = 0;
  let animLerpT = 0;
  let animFromPos = new THREE.Vector3();
  let animToPos = new THREE.Vector3();
  let animUnit: UnitState | null = null;
  let animRuchSim = 0;

  function clearPathMarkers(): void {
    for (const m of pathMarkers) scene.remove(m);
    pathMarkers = [];
    for (const s of turnSprites) scene.remove(s);
    turnSprites = [];
  }

  function clearSelectedMarker(): void {
    if (selectedMarker) { scene.remove(selectedMarker); selectedMarker = null; }
  }

  function selectUnit(unit: UnitState): void {
    clearPathMarkers();
    clearSelectedMarker();
    selectedUnit = unit;
    elReaction.textContent = '';

    currentDijkstra = dijkstra(unit.q, unit.r, map);

    selectedMarker = makeHexMarker(COL_SELECTED, 0.55);
    const [sx, sy, sz] = hexWorldPos(unit.q, unit.r, map.hexes);
    selectedMarker.position.set(sx, sy + 0.04, sz);
    scene.add(selectedMarker);

    elUnitInfo.innerHTML = `<b>${unit.nazwa}</b> [${unit.owner === 'gracz' ? 'GRACZ' : 'WROG'}]<br>Ruch: ${unit.ruchLeft}/${unit.ruchMax} pkt`;
    elPathInfo.textContent = '';
  }

  function deselectUnit(): void {
    clearPathMarkers();
    clearSelectedMarker();
    selectedUnit = null;
    currentDijkstra = null;
    elUnitInfo.textContent = 'Kliknij jednostke gracza (zolta), aby ja wybrac.';
    elPathInfo.textContent = '';
    elReaction.textContent = '';
  }

  // Hover — podglad sciezki z numerami tur
  function showPathPreview(tq: number, tr: number): void {
    clearPathMarkers();
    if (!selectedUnit || !currentDijkstra) return;
    const toKey = `${tq},${tr}`;
    const fromKey = `${selectedUnit.q},${selectedUnit.r}`;
    if (toKey === fromKey) { elPathInfo.textContent = ''; return; }

    const dNode = currentDijkstra.get(toKey);
    if (!dNode) { elPathInfo.textContent = 'Pole nieosiagalne.'; return; }

    const totalCost = dNode.cost;
    const path = reconstructPath(fromKey, toKey, currentDijkstra);

    const { turnLabels, totalTurns } = simulateTurns(
      path,
      selectedUnit.ruchLeft,
      selectedUnit.ruchMax,
      map.hexes
    );

    for (const stepKey of path) {
      const [sq, sr] = stepKey.split(',').map(Number) as [number, number];
      const [mx, my, mz] = hexWorldPos(sq, sr, map.hexes);
      const isTurnEnd = turnLabels.has(stepKey);
      const isDestination = stepKey === toKey;

      const turnNum = turnLabels.get(stepKey);
      const isThisTurn = (turnNum === 1) || (!isTurnEnd && totalTurns === 1);
      const color = isThisTurn ? COL_PATH_OK : COL_PATH_NEXT;
      const opacity = isDestination ? 0.65 : 0.45;

      const m = makeHexMarker(color, opacity);
      m.position.set(mx, my + 0.04, mz);
      scene.add(m);
      pathMarkers.push(m);

      if (isTurnEnd || isDestination) {
        const labelTurn = turnLabels.get(stepKey) ?? totalTurns;
        const sprite = makeTurnLabel(labelTurn);
        sprite.position.set(mx, my + 1.1, mz);
        scene.add(sprite);
        turnSprites.push(sprite);
      }
    }

    const destHex = map.hexes[toKey];
    const destTerr = destHex ? (TEREN_TO_MV_KEY[destHex.terenBazowy] ?? '?') : '?';
    const destForest = destHex?.nakladka === Nakladka.Las ? '+Las' : '';
    elPathInfo.textContent = `Sciezka: ${path.length} pol · koszt ${totalCost} · Dojscie: ${totalTurns} tur · teren: ${destTerr}${destForest}`;
  }

  // --- Reakcja ZoC (stub) ---
  function checkReactionZoC(unit: UnitState): void {
    for (const [dq, dr] of HEX_DIRS) {
      const nq = unit.q + dq, nr = unit.r + dr;
      const enemy = units.find(u => u.owner !== unit.owner && u.q === nq && u.r === nr);
      if (enemy) {
        const decision = Math.random() < 0.6 ? 'flee' : 'fight';
        if (decision === 'flee') {
          let fled = false;
          for (const [fdq, fdr] of HEX_DIRS) {
            const fq = enemy.q + fdq, fr = enemy.r + fdr;
            const fKey = `${fq},${fr}`;
            const fhex = map.hexes[fKey];
            if (!fhex) continue;
            if (moveCost(fhex) >= 99) continue;
            const occupied = units.some(u2 => u2.id !== enemy.id && u2.owner === enemy.owner && u2.q === fq && u2.r === fr);
            if (!occupied) {
              enemy.q = fq; enemy.r = fr;
              const [ex, ey, ez] = hexWorldPos(fq, fr, map.hexes);
              enemy.group.position.set(ex, ey + 0.02, ez);
              fled = true;
              break;
            }
          }
          elReaction.textContent = `Reakcja: wrog (${enemy.nazwa}) w poblizu — FLEE${fled ? ' (odsunal sie)' : ' (brak miejsca)'}`;
        } else {
          elReaction.textContent = `Reakcja: wrog (${enemy.nazwa}) w poblizu — FIGHT -> scena bitwy (UNITS) [stub]`;
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DETEKCJA ATAKU NA MIASTO / OBLEZENIE
  // ---------------------------------------------------------------------------

  function isCityHex(q: number, r: number): boolean {
    return q === siegeCity.q && r === siegeCity.r;
  }

  function isAdjacentToCity(q: number, r: number): boolean {
    for (const [dq, dr] of HEX_DIRS) {
      if (q + dq === siegeCity.q && r + dr === siegeCity.r) return true;
    }
    return false;
  }

  function handleAttackOnCity(attacker: UnitState): void {
    // Garnizon = jednostka wroga stojaca na heksie miasta
    const garrison = units.find(u => u.owner === 'wrog' && u.q === siegeCity.q && u.r === siegeCity.r) ?? null;

    const ctx = buildKontekst(
      attacker,
      siegeCity.q, siegeCity.r,
      siegeCity,
      garrison,
      units,
      map.hexes
    );

    showSiegeOverlay(ctx);

    // Info w HUD
    elReaction.textContent = `TRYB OBLEZENIA WYKRYTY — kontekst przekazany do UNITS [overlay]`;
  }

  // --- Wykonaj ruch (animacja wewnatrz glownej petli) ---
  function executeMove(tq: number, tr: number): void {
    if (!selectedUnit || !currentDijkstra || animating) return;
    const toKey = `${tq},${tr}`;
    const fromKey = `${selectedUnit.q},${selectedUnit.r}`;
    if (toKey === fromKey) return;

    // ---- DETEKCJA: Atak na miasto? ----
    if (selectedUnit.owner === 'gracz' && isCityHex(tq, tr)) {
      // Sprawdz sasiedztwo (musi byc obok)
      if (isAdjacentToCity(selectedUnit.q, selectedUnit.r)) {
        handleAttackOnCity(selectedUnit);
        return;
      } else {
        // Nie jest obok — potraktuj jak zwykly ruch do miasta (sciezka przez miasto = blokada)
        elPathInfo.textContent = 'Miasto wroga — musisz byc obok, by zaatakowac.';
        return;
      }
    }

    // ---- Wejscie na pole z wrogiem (bitwa polowa) ----
    const enemy = units.find(u => u.owner !== selectedUnit!.owner && u.q === tq && u.r === tr);
    if (enemy) {
      if (selectedUnit.owner === 'gracz') {
        // Klasyfikacja: bitwa polowa (brak miasta)
        const ctx = buildKontekst(
          selectedUnit,
          tq, tr,
          null, // brak miasta
          enemy,
          units,
          map.hexes
        );
        showSiegeOverlay(ctx);
        elReaction.textContent = 'BITWA POLOWA — kontekst przekazany do UNITS [overlay]';
      } else {
        elReaction.textContent = `Atak/bitwa z ${enemy.nazwa} (UNITS) [stub] — ruch anulowany`;
      }
      return;
    }

    const dNode = currentDijkstra.get(toKey);
    if (!dNode) { elPathInfo.textContent = 'Nieosiagalne.'; return; }

    const path = reconstructPath(fromKey, toKey, currentDijkstra);
    if (path.length === 0) return;

    // Wyznacz ile krokow mozna wykonac (MIN.1 POLE)
    const unit = selectedUnit;
    const stepsToWalk: string[] = [];
    let ruchSim = unit.ruchLeft;

    for (let i = 0; i < path.length; i++) {
      const stepKey = path[i]!;
      const stepHex = map.hexes[stepKey];
      if (!stepHex) break;
      const c = moveCost(stepHex);
      if (i === 0 && ruchSim >= 1) {
        stepsToWalk.push(stepKey);
        ruchSim = Math.max(0, ruchSim - c);
      } else if (ruchSim >= c) {
        stepsToWalk.push(stepKey);
        ruchSim -= c;
      } else {
        break;
      }
    }

    if (stepsToWalk.length === 0) {
      elPathInfo.textContent = 'Brak punktow ruchu.';
      return;
    }

    animating = true;
    animUnit = unit;
    animSteps = stepsToWalk;
    animStepIdx = 0;
    animLerpT = 0;
    animRuchSim = ruchSim;

    clearPathMarkers();
    clearSelectedMarker();
    elReaction.textContent = '';

    const firstKey = stepsToWalk[0]!;
    const [fq, fr] = firstKey.split(',').map(Number) as [number, number];
    unit.q = fq; unit.r = fr;
    animFromPos = unit.group.position.clone();
    const [fx, fy, fz] = hexWorldPos(fq, fr, map.hexes);
    animToPos = new THREE.Vector3(fx, fy + 0.02, fz);
    animStepIdx = 1;
  }

  // --- Sterowanie kamera ---
  let tx = cx, tz = cz; // skieruj na miasto
  const initPos = camera.position.clone();
  let radius = Math.hypot(initPos.x - cx, initPos.y, initPos.z - cz) || 20;
  let theta  = Math.atan2(initPos.x - cx, initPos.z - cz);
  let phi    = Math.acos(Math.min(1, Math.max(-1, initPos.y / radius)));
  const init = { radius, theta, phi, tx, tz };

  function updateCam(): void {
    const s = Math.sin(phi);
    camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta));
    camera.lookAt(tx, 0, tz);
  }

  let dragging = false, dragStartX = 0, dragStartY = 0, lx = 0, ly = 0;
  let dragMoved = false;
  const DRAG_THRESH = 5;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; dragMoved = false;
    lx = e.clientX; ly = e.clientY;
    dragStartX = e.clientX; dragStartY = e.clientY;
  });

  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = Math.abs(e.clientX - dragStartX);
    const dy = Math.abs(e.clientY - dragStartY);
    if (dx < DRAG_THRESH && dy < DRAG_THRESH) {
      handleClick(e.clientX, e.clientY);
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) {
      handleHover(e.clientX, e.clientY);
      return;
    }
    const dx = Math.abs(e.clientX - dragStartX);
    const dy = Math.abs(e.clientY - dragStartY);
    if (dx > DRAG_THRESH || dy > DRAG_THRESH) dragMoved = true;
    if (dragMoved) {
      theta -= (e.clientX - lx) * 0.005;
      phi = Math.min(1.45, Math.max(0.12, phi - (e.clientY - ly) * 0.005));
      updateCam();
    }
    lx = e.clientX; ly = e.clientY;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.min(520, Math.max(4, radius * (1 + Math.sign(e.deltaY) * 0.08)));
    updateCam();
  }, { passive: false });

  // --- Raycast ---
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);

  function screenToHex(clientX: number, clientY: number): { q: number; r: number } | null {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, hit)) return null;
    return worldToAxial(hit.x, hit.z, HEX_R);
  }

  function unitAt(q: number, r: number): UnitState | null {
    return units.find(u => u.q === q && u.r === r) ?? null;
  }

  function handleClick(clientX: number, clientY: number): void {
    if (animating) return;
    const pos = screenToHex(clientX, clientY);
    if (!pos) return;
    const { q, r } = pos;
    const clickedHex = map.hexes[`${q},${r}`];
    if (!clickedHex) return;

    if (selectedUnit) {
      if (selectedUnit.q === q && selectedUnit.r === r) {
        deselectUnit(); return;
      }
      const clicked = unitAt(q, r);
      if (clicked && clicked.owner === 'gracz') {
        selectUnit(clicked); return;
      }
      // Ruch lub atak
      executeMove(q, r);
    } else {
      const clicked = unitAt(q, r);
      if (clicked && clicked.owner === 'gracz') {
        selectUnit(clicked);
      }
    }
  }

  let lastHoverKey = '';
  function handleHover(clientX: number, clientY: number): void {
    if (animating || !selectedUnit) return;
    const pos = screenToHex(clientX, clientY);
    if (!pos) return;
    const { q, r } = pos;
    const hk = `${q},${r}`;
    if (hk === lastHoverKey) return;
    lastHoverKey = hk;
    showPathPreview(q, r);
  }

  // --- Zakoncz ture ---
  document.getElementById('btn-endturn')?.addEventListener('click', () => {
    for (const u of units) u.ruchLeft = u.ruchMax;
    deselectUnit();
    elReaction.textContent = '';
    revealAroundPlayerUnits();
    updateStackCounters();
    elPathInfo.textContent = 'Tura zakonczona. Wszyscy maja pelny ruch.';
  });

  document.getElementById('btn-seed')?.addEventListener('click', () => {
    const s = Math.floor(Math.random() * 100000);
    const p = new URLSearchParams(location.search);
    p.set('seed', String(s));
    location.search = p.toString();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    radius = init.radius; theta = init.theta; phi = init.phi;
    tx = init.tx; tz = init.tz; updateCam();
  });

  // --- Pan WASD ---
  const pressed = new Set<string>();
  const panKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (panKeys.includes(k)) { pressed.add(k); e.preventDefault(); }
    if (k === 'escape') {
      deselectUnit();
      const overlay = document.getElementById('siege-overlay');
      if (overlay) overlay.remove();
    }
  });
  window.addEventListener('keyup', (e) => { pressed.delete(e.key.toLowerCase()); });

  let autoRot = false;

  function applyPan(): void {
    if (pressed.size === 0) return;
    const st = radius * 0.012, fx2 = -Math.sin(theta), fz2 = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
    if (pressed.has('w') || pressed.has('arrowup')) { tx += fx2 * st; tz += fz2 * st; }
    if (pressed.has('s') || pressed.has('arrowdown')) { tx -= fx2 * st; tz -= fz2 * st; }
    if (pressed.has('d') || pressed.has('arrowright')) { tx += rx * st; tz += rz * st; }
    if (pressed.has('a') || pressed.has('arrowleft')) { tx -= rx * st; tz -= rz * st; }
    updateCam();
  }

  updateCam();

  // ---------------------------------------------------------------------------
  // GLOWNA PETLA ANIMACJI
  // ---------------------------------------------------------------------------
  renderer.setAnimationLoop(() => {
    applyPan();
    if (autoRot) { theta += 0.0016; updateCam(); }

    if (animating && animUnit) {
      animLerpT += 0.06;
      if (animLerpT >= 1) {
        animUnit.group.position.copy(animToPos);
        animLerpT = 0;

        if (animStepIdx >= animSteps.length) {
          animating = false;
          const doneUnit = animUnit;
          animUnit = null;
          doneUnit.ruchLeft = animRuchSim;
          updateStackCounters();
          revealAroundPlayerUnits();
          selectUnit(doneUnit);
          checkReactionZoC(doneUnit);
          elUnitInfo.innerHTML = `<b>${doneUnit.nazwa}</b> [GRACZ]<br>Ruch: ${doneUnit.ruchLeft}/${doneUnit.ruchMax} pkt`;
        } else {
          const nextKey = animSteps[animStepIdx]!;
          const [nq, nr] = nextKey.split(',').map(Number) as [number, number];
          animUnit.q = nq; animUnit.r = nr;
          animFromPos = animUnit.group.position.clone();
          const [nx, ny, nz] = hexWorldPos(nq, nr, map.hexes);
          animToPos = new THREE.Vector3(nx, ny + 0.02, nz);
          animStepIdx++;
        }
      } else {
        animUnit.group.position.lerpVectors(animFromPos, animToPos, animLerpT);
      }
    }

    renderer.render(scene, camera);
  });

  (window as unknown as { __moveReady?: boolean }).__moveReady = true;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
