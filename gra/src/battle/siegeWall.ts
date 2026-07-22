/**
 * siegeWall.ts — proceduralny mur obronny dla 9 cywilizacji epoki brazu.
 * buildSiegeWall(civ, opts) → THREE.Group
 * Mur biegnie wzdluz osi X, licem (zewnetrzna strona) w strone +Z.
 * Brama posrodku (szerokosc = gateWidthTiles * tileSize).
 *
 * ARCHITEKTURA MURU (wymog Naster / Total War):
 *   wallD   = co najmniej tileSize (pelne pole) — mur ma GLEBIE, nie jest cienka linia.
 *   walkY   = H (gorna powierzchnia muru) — CHODNIK BOJOWY o szerokosci wallD.
 *   blanki  = TYLKO na zewnetrznej krawedzi (+Z).
 *   schody  = bieg schodow (stopnie) od strony wewnetrznej (+Z), dostep na chodnik.
 *   userData: wallWalkY, depth, gateCenterX
 *
 * Zero Math.random() — calkowicie deterministyczne.
 */
import * as THREE from 'three';
import type { BronzeCiv } from '../render/bronzeCity';

export type SiegeWallOpts = {
  lengthTiles: number;
  tileSize: number;
  height?: number;
  ownerColor?: number;
  gateWidthTiles?: number;
};

const mk = (c: number, side?: boolean) =>
  new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.92,
    metalness: 0.0,
    ...(side ? { side: THREE.DoubleSide } : {}),
  });

/**
 * hash01 — deterministyczny pseudo-losowy [0,1) z liczby (indeks/pozycja).
 * Zero Math.random() — ta sama liczba wejsciowa zawsze daje ta sama wartosc.
 */
function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * shadeColor — rozjasnia (amt>0) lub przyciemnia (amt<0) kolor hex o ulamek [-1,1].
 */
function shadeColor(hex: number, amt: number): number {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c + c * amt)));
  return (adj(r) << 16) | (adj(g) << 8) | adj(b);
}

/**
 * addMerlonRow — rzad blankow (merlonow) na koronie muru: naprzemienny
 * odcien (jasniejszy/ciemniejszy co drugi merlon) + deterministyczny jitter
 * wysokosci (+/-8%), hash z indeksu — zero Math.random().
 */
function addMerlonRow(
  g: THREE.Group,
  startX: number,
  spanW: number,
  count: number,
  blankW: number,
  blankH: number,
  blankD: number,
  extZ: number,
  H: number,
  baseColor: number,
  seed: number
): void {
  if (count <= 0) return;
  const matLight = mk(shadeColor(baseColor, 0.06));
  const matDark = mk(shadeColor(baseColor, -0.06));
  for (let i = 0; i < count; i++) {
    const bx = startX + (i + 0.5) * (spanW / count);
    const j = (hash01(seed + i * 3.173) - 0.5) * 2 * 0.08; // +/-8% wysokosci
    const h = blankH * (1 + j);
    const mat = i % 2 === 0 ? matLight : matDark;
    const blank = new THREE.Mesh(new THREE.BoxGeometry(blankW, h, blankD), mat);
    blank.position.set(bx, H + h / 2, extZ);
    blank.castShadow = true;
    g.add(blank);
  }
}

/**
 * addSimpleTurrets — skromne wiezyczki przy bramie (2 bryly kazda: trzon +
 * zwienczenie) dla stylow, ktore nie maja dedykowanych wiez bramnych.
 * wood=true → trzon walcowy + stozkowy dach (Zulu/Celtowie/Germanie),
 * wood=false → trzon prostopadloscienny + plaski daszek (Grecja/Sumer/Inka).
 */
function addSimpleTurrets(
  g: THREE.Group,
  gateW: number,
  H: number,
  T: number,
  bodyColor: number,
  capColor: number,
  wood: boolean
): void {
  const turretR = T * 0.3;
  const turretH = H * 1.25;
  const bodyMat = mk(bodyColor);
  const capMat = mk(capColor);
  for (const sx of [-1, 1]) {
    const px = sx * (gateW / 2 + turretR * 0.7);
    if (wood) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(turretR * 0.85, turretR, turretH, 6),
        bodyMat
      );
      body.position.set(px, turretH / 2, 0);
      body.castShadow = true;
      g.add(body);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(turretR * 1.05, turretH * 0.22, 6), capMat);
      cap.position.set(px, turretH + turretH * 0.11, 0);
      cap.castShadow = true;
      g.add(cap);
    } else {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(turretR * 1.7, turretH, turretR * 1.7),
        bodyMat
      );
      body.position.set(px, turretH / 2, 0);
      body.castShadow = true;
      g.add(body);
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(turretR * 2.0, turretH * 0.12, turretR * 2.0),
        capMat
      );
      cap.position.set(px, turretH + turretH * 0.06, 0);
      cap.castShadow = true;
      g.add(cap);
    }
  }
}

/**
 * buildWallBodySegmented — buduje cialo muru jako N segmentow per-tile i
 * rejestruje je w userData['wallSegsByLocalX'] = Map<number, THREE.Mesh>.
 * Klucz = Math.round(localX / T) (indeks segmentu na osi X grupy, odpowiada
 * rzedowi siatki po transformacji sceny).
 *
 * Zamiast jednego monolitu leftMesh+rightMesh, kazdy kafel muru ma oddzielny
 * mesh — umozliwia ukrycie konkretnego segmentu przy wyłomie.
 *
 * @param g         GROUP docelowa
 * @param L         calkowita dlugosc muru (lengthTiles * T)
 * @param gateW     szerokosc bramy
 * @param H         wysokosc muru
 * @param wallD     glebia muru
 * @param T         tileSize
 * @param baseColor kolor bazowy muru (hex) — kazdy segment dostaje deterministyczny
 *                  jitter jasnosci (+/-4-6%) hashowany z indeksu segmentu; materialy
 *                  sa cache'owane per skwantyzowany koszyk jasnosci (max ~5 sztuk),
 *                  wiec nie powstaja setki materialow.
 */
function buildWallBodySegmented(
  g: THREE.Group,
  L: number,
  gateW: number,
  H: number,
  wallD: number,
  T: number,
  baseColor: number
): void {
  const startX = -L / 2;
  const endX   =  L / 2;
  const gateHalfW = gateW / 2;
  const segsByLocalX = new Map<number, THREE.Mesh>();

  // Cache materialow per skwantyzowany koszyk jasnosci — max BUCKETS materialy,
  // niezaleznie od liczby segmentow. Jitter deterministyczny (hash z indeksu),
  // zero Math.random().
  const BUCKETS = 5;
  const shadeCache = new Map<number, THREE.Material>();
  const getSegMat = (segIdx: number): THREE.Material => {
    const bucket = Math.floor(hash01(segIdx * 7.319 + 11.71) * BUCKETS) % BUCKETS;
    let m = shadeCache.get(bucket);
    if (!m) {
      // bucket 0..BUCKETS-1 → jitter w zakresie [-0.06, +0.06]
      const amt = (bucket / (BUCKETS - 1) - 0.5) * 2 * 0.06;
      m = mk(shadeColor(baseColor, amt));
      shadeCache.set(bucket, m);
    }
    return m;
  };

  // Iteruj przez segmenty co T, pomijaj brame
  for (let sx = startX; sx < endX - T * 0.01; sx += T) {
    const cx = sx + T / 2; // środek segmentu
    if (Math.abs(cx) < gateHalfW + T * 0.01) continue; // pomijaj brame + filary

    // klucz = indeks segmentu (zaokraglony cx/T)
    const key = Math.round(cx / T);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(T, H, wallD), getSegMat(key));
    seg.position.set(cx, H / 2, 0);
    seg.castShadow = true;
    seg.receiveShadow = true;
    g.add(seg);

    segsByLocalX.set(key, seg);
  }

  // Zapisz mape segmentow w userData grupy
  if (!(g.userData['wallSegsByLocalX'] instanceof Map)) {
    g.userData['wallSegsByLocalX'] = segsByLocalX;
  } else {
    for (const [k, v] of segsByLocalX) {
      (g.userData['wallSegsByLocalX'] as Map<number, THREE.Mesh>).set(k, v);
    }
  }
}

/**
 * addStairs — bieg schodow ze stopni po wewnetrznej stronie muru (+Z = strona obroncy).
 * Kazdy stopien = BoxGeometry: szerokosc stairW, wysokosc stepH, glebokosc stepD.
 * Kierunek wspinania: od dziedzinca KU murowi.
 *   i=0 (najnizszy, y≈0)         → najdalej od muru (duze Z, glab dziedzinica)
 *   i=nSteps-1 (najwyzszy, y=H)  → przy wewnetrznym licu muru (Z = wallInnerZ + stepD/2)
 * Ostatni stopien dociera dokladnie do wallWalkY (H) i przylega do wewnetrznego lica.
 */
function addStairs(
  g: THREE.Group,
  leftStartX: number,
  rightStartX: number,
  sectionW: number,
  wallD: number,
  H: number,
  cx: number,
  mat: THREE.Material
): void {
  const stepH = 0.22;          // wysokosc jednego stopnia
  const stepD = 0.20;          // glebokosc jednego stopnia (w Z)
  const stairW = Math.min(sectionW * 0.45, wallD * 2.5); // szerokosc biegu (w X)

  const nSteps = Math.ceil(H / stepH); // liczba stopni
  const actualStepH = H / nSteps;      // wyrownana wysokosc — ostatni stopien = walkY

  // Wewnetrzna krawedz muru (strona obroncy, +Z)
  const wallInnerZ = cx + wallD / 2;

  for (const startX of [leftStartX, rightStartX]) {
    for (let i = 0; i < nSteps; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stairW, actualStepH, stepD),
        mat
      );
      // Srodek stopnia w Y: podstawa = i * actualStepH, polowka wyzej
      const stepCenterY = i * actualStepH + actualStepH / 2;
      // Srodek stopnia w Z: odwrocony kierunek — stopien 0 (najnizszy) NAJDALEJ od muru,
      // stopien nSteps-1 (najwyzszy) PRZY wewnetrznym licu muru (wallInnerZ + stepD/2).
      // Wzor: wallInnerZ + (nSteps - i - 0.5) * stepD
      const stepCenterZ = wallInnerZ + (nSteps - i - 0.5) * stepD;
      step.position.set(startX + stairW / 2, stepCenterY, stepCenterZ);
      step.castShadow = true;
      step.receiveShadow = true;
      g.add(step);
    }
  }
}

/**
 * addPortcullis — krata (portcullis) w otworze bramy.
 * Cywilizacje kamienne/ceglane: grecja, rzym, sumer, egipt, inka, chiny.
 * Wypelnia caly otwor bramy (szerokosc gateW, wysokosc gateH).
 * Osadzona w plaszczyznie lica muru (Z = -wallD/2 = zewnetrzna krawedz).
 * Zwraca Group z userData.gate = ta sama grupa.
 */
function addPortcullis(
  g: THREE.Group,
  gateW: number,
  gateH: number,
  wallD: number,
  gateCenterX: number
): THREE.Group {
  const ironMat = mk(0x3a3a3a);
  const ironDkMat = mk(0x252525);

  const gateGroup = new THREE.Group();

  // Grubosc pretu
  const barThick = Math.max(0.045, gateW * 0.038);
  // Liczba pionowych pretow — co ok. 15% szerokosci bramy, min 3
  const vBars = Math.max(3, Math.round(gateW / (gateW * 0.18)));
  const vSpacing = gateW / (vBars + 1);

  // Pionowe prety (vertical bars)
  for (let i = 1; i <= vBars; i++) {
    const vBar = new THREE.Mesh(
      new THREE.BoxGeometry(barThick, gateH, barThick),
      ironMat
    );
    vBar.position.set(gateCenterX - gateW / 2 + i * vSpacing, gateH / 2, -wallD / 2);
    vBar.castShadow = true;
    gateGroup.add(vBar);
  }

  // Poziome poprzeczki (horizontal crossbars) — 3 sztuki
  const hBars = 3;
  for (let i = 0; i < hBars; i++) {
    const yPos = gateH * (0.18 + i * 0.32);
    const hBar = new THREE.Mesh(
      new THREE.BoxGeometry(gateW, barThick * 1.2, barThick),
      ironDkMat
    );
    hBar.position.set(gateCenterX, yPos, -wallD / 2);
    hBar.castShadow = true;
    gateGroup.add(hBar);
  }

  // Rama zewnetrzna kraty (obwodowa)
  // Lewa szyna
  const frameL = new THREE.Mesh(
    new THREE.BoxGeometry(barThick * 1.5, gateH, barThick),
    ironDkMat
  );
  frameL.position.set(gateCenterX - gateW / 2 + barThick * 0.75, gateH / 2, -wallD / 2);
  frameL.castShadow = true;
  gateGroup.add(frameL);
  // Prawa szyna
  const frameR = new THREE.Mesh(
    new THREE.BoxGeometry(barThick * 1.5, gateH, barThick),
    ironDkMat
  );
  frameR.position.set(gateCenterX + gateW / 2 - barThick * 0.75, gateH / 2, -wallD / 2);
  frameR.castShadow = true;
  gateGroup.add(frameR);

  g.add(gateGroup);
  return gateGroup;
}

/**
 * addWoodenGate — wrota z bali w otworze bramy.
 * Cywilizacje drewniane: zulu, celtowie, germanie.
 * Dwa skrzydla (lewa/prawa polowa otworu), pionowe bale + skosne wzmocnienia (krzyz).
 * Osadzone w plaszczyznie lica muru (Z = -wallD/2).
 * Zwraca Group z userData.gate = ta sama grupa.
 */
function addWoodenGate(
  g: THREE.Group,
  gateW: number,
  gateH: number,
  wallD: number,
  gateCenterX: number,
  woodColor: number,
  woodDkColor: number
): THREE.Group {
  const woodMat = mk(woodColor);
  const woodDkMat = mk(woodDkColor);

  const gateGroup = new THREE.Group();
  const zPos = -wallD / 2 + 0.02; // lico zewnetrzne muru

  // Grubosc jednego bala i szerokosc skrzydla
  const planThick = Math.max(0.05, gateH * 0.04);
  const wingW = gateW / 2 - 0.02; // kazde skrzydlo = pol szerokosci bramy
  const planCount = Math.max(3, Math.round(wingW / (wingW * 0.22)));
  const planSpacing = wingW / planCount;

  for (const side of [-1, 1]) {
    const wingCenterX = gateCenterX + side * (gateW / 4);
    const wingStartX = gateCenterX + side * (gateW / 2 - 0.01);

    // Pionowe bale skrzydla
    for (let i = 0; i < planCount; i++) {
      const px = wingStartX - side * (i + 0.5) * planSpacing;
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(planSpacing * 0.88, gateH, planThick),
        woodMat
      );
      plank.position.set(px, gateH / 2, zPos);
      plank.castShadow = true;
      gateGroup.add(plank);
    }

    // Pozioma belka wzmacniajaca (srodkowa)
    const hBeam = new THREE.Mesh(
      new THREE.BoxGeometry(wingW, planThick * 1.4, planThick * 0.8),
      woodDkMat
    );
    hBeam.position.set(wingCenterX, gateH * 0.5, zPos + planThick * 0.6);
    hBeam.castShadow = true;
    gateGroup.add(hBeam);

    // Skosne wzmocnienie (jedna ukosna belka na skrzydle — /  lub \ )
    // Uzywamy BoxGeometry skalowanego i obroczonego
    const diagLen = Math.sqrt(wingW * wingW + (gateH * 0.7) * (gateH * 0.7));
    const diagAngle = Math.atan2(gateH * 0.7, wingW) * (side === -1 ? 1 : -1);
    const diag = new THREE.Mesh(
      new THREE.BoxGeometry(diagLen, planThick * 0.9, planThick * 0.7),
      woodDkMat
    );
    diag.position.set(wingCenterX, gateH * 0.4, zPos + planThick * 1.1);
    diag.rotation.z = diagAngle;
    diag.castShadow = true;
    gateGroup.add(diag);
  }

  // Srodkowy zamek (belka pozioma laczaca skrzydla w miejscu styku)
  const lockBar = new THREE.Mesh(
    new THREE.BoxGeometry(gateW * 0.06, gateH * 0.35, planThick * 1.2),
    woodDkMat
  );
  lockBar.position.set(gateCenterX, gateH * 0.5, zPos + planThick * 0.8);
  lockBar.castShadow = true;
  gateGroup.add(lockBar);

  g.add(gateGroup);
  return gateGroup;
}

// ===== GRECJA =====
function buildGrecja(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  // Glebia muru = min 1 tileSize (chodnik bojowy)
  const wallD = Math.max(T, T * 1.0);
  const stoneColor = 0xd4c5a9;
  const stone = mk(stoneColor);
  const stoneDk = mk(0xc8b596);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Blanki (merlons) — TYLKO na zewnetrznej krawedzi (+Z), naprzemienny odcien + jitter wysokosci
  const blankW = T * 0.25, blankH = H * 0.25, blankD = wallD * 0.35;
  const extZ = -wallD / 2 + blankD / 2; // zewnetrzna krawedz
  const blankCount = Math.floor(leftW / (T * 0.6));
  addMerlonRow(g, -L / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xc8b596, 1);
  addMerlonRow(g, gateW / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xc8b596, 2);

  // Schody (pochylnia) po wewnetrznej stronie — lewa i prawa czesc
  const rampMat = mk(0xb8a888);
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, rampMat);

  // Nadproze bramy (lintel) + most nad brama (chodnik laczacy odcinki)
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(gateW, H * 0.12, wallD), stone);
  lintel.position.set(0, H, 0);
  lintel.castShadow = true;
  g.add(lintel);

  // Most-chodnik nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW, H * 0.06, wallD), stoneDk);
  bridge.position.set(0, H + H * 0.03, 0);
  bridge.castShadow = true;
  g.add(bridge);

  // Filary bramy
  const pillarH = H, pillarW = T * 0.2;
  for (const sx of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, wallD), stone);
    pillar.position.set(sx * (gateW / 2 + pillarW / 2), pillarH / 2, 0);
    pillar.castShadow = true;
    g.add(pillar);
  }

  // Skromne wiezyczki kamienne przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, stoneColor, 0xc8b596, false);

  // KRATA (portcullis) w otworze bramy
  const gateGroup = addPortcullis(g, gateW, H, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== RZYM =====
function buildRzym(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.1);
  const stoneColor = 0xc8b99a;
  const stone = mk(stoneColor);
  const stoneDk = mk(0xb0a080);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Blanki — tylko zewnetrzna krawedz (+Z strona atakujacego = -wallD/2), naprzemienny odcien + jitter
  const extZ = -wallD / 2 + T * 0.1;
  const blankW = T * 0.2, blankH = H * 0.22, blankD = T * 0.15;
  const blankCount = Math.floor(leftW / (T * 0.55));
  addMerlonRow(g, -L / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xb0a080, 3);
  addMerlonRow(g, gateW / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xb0a080, 4);

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, stoneDk);

  // Most nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW + T * 0.1, H * 0.07, wallD), stone);
  bridge.position.set(0, H, 0);
  g.add(bridge);

  // 2 wiezyczki przy bramie
  const towerR = T * 0.35, towerH = H * 1.35;
  for (const sx of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(towerR, towerR * 1.05, towerH, 8), stone);
    tower.position.set(sx * (gateW / 2 + towerR * 0.6), towerH / 2, 0);
    tower.castShadow = true;
    g.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(towerR * 1.1, towerH * 0.25, 8), stoneDk);
    cap.position.set(sx * (gateW / 2 + towerR * 0.6), towerH + towerH * 0.125, 0);
    cap.castShadow = true;
    g.add(cap);
  }

  // KRATA (portcullis) w otworze bramy
  const gateGroup = addPortcullis(g, gateW, H, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== SUMER =====
function buildSumer(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.2); // gruby mur
  const stoneColor = 0xc2956c;
  const stone = mk(stoneColor);
  const stoneDk = mk(0xa07850);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Blanki — tylko zewnetrzna krawedz, naprzemienny odcien + jitter wysokosci
  const extZ = -wallD / 2 + T * 0.1;
  const blankW = T * 0.28, blankH = H * 0.28, blankD = T * 0.15;
  const blankCount = Math.floor(leftW / (T * 0.65));
  addMerlonRow(g, -L / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xa07850, 5);
  addMerlonRow(g, gateW / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xa07850, 6);

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, stoneDk);

  // Polkolisty luk nad brama
  const archR = gateW / 2;
  const archSegs = 8;
  const archGeo = new THREE.CylinderGeometry(archR, archR, wallD, archSegs, 1, true, 0, Math.PI);
  const arch = new THREE.Mesh(archGeo, stone);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, H, 0);
  arch.castShadow = true;
  g.add(arch);

  // Most nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW, H * 0.06, wallD), stoneDk);
  bridge.position.set(0, H + archR, 0);
  g.add(bridge);

  // Skromne wiezyczki kamienne przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, stoneColor, 0xa07850, false);

  // KRATA (portcullis) w otworze bramy
  const gateGroup = addPortcullis(g, gateW, H, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== EGIPT =====
function buildEgipt(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.05);
  const stoneColor = 0xd4a96a;
  const stone = mk(stoneColor);
  const stoneDk = mk(0xb08040);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Blanki — tylko zewnetrzna krawedz, naprzemienny odcien + jitter wysokosci
  const extZ = -wallD / 2 + T * 0.1;
  const blankW = T * 0.32, blankH = H * 0.22, blankD = T * 0.14;
  const blankCount = Math.floor(leftW / (T * 0.7));
  addMerlonRow(g, -L / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xb08040, 7);
  addMerlonRow(g, gateW / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0xb08040, 8);

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, stoneDk);

  // 2 pylony trapezowe przy bramie
  const pylonW = T * 0.5, pylonH = H * 1.4, pylonD = wallD * 1.1;
  for (const sx of [-1, 1]) {
    const pylonX = sx * (gateW / 2 + pylonW * 0.6);
    const pylonBot = new THREE.Mesh(new THREE.BoxGeometry(pylonW, pylonH * 0.6, pylonD), stone);
    pylonBot.position.set(pylonX, pylonH * 0.3, 0);
    pylonBot.castShadow = true;
    g.add(pylonBot);
    const pylonTop = new THREE.Mesh(new THREE.BoxGeometry(pylonW * 0.72, pylonH * 0.4, pylonD * 0.85), stoneDk);
    pylonTop.position.set(pylonX, pylonH * 0.8, 0);
    pylonTop.castShadow = true;
    g.add(pylonTop);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(pylonW * 0.38, pylonH * 0.12, 4), stoneDk);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(pylonX, pylonH + pylonH * 0.06, 0);
    cap.castShadow = true;
    g.add(cap);
  }

  // Most nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW + pylonW, H * 0.06, wallD), stoneDk);
  bridge.position.set(0, H, 0);
  g.add(bridge);

  // KRATA (portcullis) w otworze bramy
  const gateGroup = addPortcullis(g, gateW, H, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== INKA =====
function buildInka(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.1);
  const stoneColor = 0x6b6b5a;
  const stone = mk(stoneColor);
  const stoneDk = mk(0x4a4a3c);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Blanki Inka — male kwadratowe, tylko zewnetrzna krawedz, naprzemienny odcien + jitter
  const extZ = -wallD / 2 + T * 0.08;
  const blankW = T * 0.22, blankH = H * 0.2, blankD = T * 0.12;
  const blankCount = Math.floor(leftW / (T * 0.65));
  addMerlonRow(g, -L / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0x4a4a3c, 9);
  addMerlonRow(g, gateW / 2, leftW, blankCount, blankW, blankH, blankD, extZ, H, 0x4a4a3c, 10);

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, stoneDk);

  // Trapezowa brama
  const gateH = H * 0.88;
  for (const sx of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(T * 0.18, gateH, wallD * 1.1), stoneDk);
    jamb.position.set(sx * gateW / 2, gateH / 2, 0);
    jamb.castShadow = true;
    g.add(jamb);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW * 0.8, H * 0.06, wallD), stoneDk);
  bridge.position.set(0, H, 0);
  g.add(bridge);

  // Skromne wiezyczki kamienne przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, stoneColor, 0x4a4a3c, false);

  // KRATA (portcullis) w otworze bramy — gateH = H * 0.88 (trapezowa Inka)
  const gateGroup = addPortcullis(g, gateW, H * 0.88, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== CHINY =====
function buildChiny(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.15);
  const brickColor = 0x8b3a2a;
  const brick = mk(brickColor);
  const brickDk = mk(0x6b2a1a);
  const tileM = mk(0x3a5a2a);

  const leftW = (L - gateW) / 2;

  // Mur jako segmenty per-tile (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, brickColor);

  // Blanki — tylko zewnetrzna krawedz, naprzemienny odcien + jitter wysokosci
  const extZ = -wallD / 2 + T * 0.1;
  const blankCount = Math.floor(leftW / (T * 0.55));
  addMerlonRow(g, -L / 2, leftW, blankCount, T * 0.22, H * 0.2, T * 0.15, extZ, H, 0x6b2a1a, 11);
  addMerlonRow(g, gateW / 2, leftW, blankCount, T * 0.22, H * 0.2, T * 0.15, extZ, H, 0x6b2a1a, 12);

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, brickDk);

  // Kwadratowa wieza bramna (menglou)
  const towerW = gateW + T * 0.8, towerH = H * 0.65, towerD = wallD * 1.5;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), brick);
  tower.position.set(0, H + towerH / 2, 0);
  tower.castShadow = true;
  g.add(tower);

  const eaveW = towerW + T * 0.5, eaveD = towerD + T * 0.5, eaveH = H * 0.08;
  const eave = new THREE.Mesh(new THREE.BoxGeometry(eaveW, eaveH, eaveD), tileM);
  eave.position.set(0, H + towerH + eaveH / 2, 0);
  eave.castShadow = true;
  g.add(eave);

  const roofH = towerH * 0.45;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(roofH * 0.2, towerW * 0.55, roofH, 4), tileM);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.0, 1.0, towerD / towerW);
  roof.position.set(0, H + towerH + eaveH + roofH / 2, 0);
  roof.castShadow = true;
  g.add(roof);

  // KRATA (portcullis) w otworze bramy
  const gateGroup = addPortcullis(g, gateW, H, wallD, 0);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== ZULU =====
function buildZulu(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  // Palisada: glebia = 1 tileSize (rzad pali)
  const wallD = T;
  const woodColor = 0x5c3d1e;
  const woodDkColor = 0x3d2510;
  const wood = mk(woodColor);
  const woodDk = mk(woodDkColor);
  const thornColor = 0x2d3a18;

  const leftW = (L - gateW) / 2;

  // Cierniowy wal u podstawy (segmentowany dla wyłomów)
  const thornH = H * 0.2;
  buildWallBodySegmented(g, L, gateW, thornH, wallD, T, thornColor);

  // Palisada — cylindry jako pale, w 2 rzedach (glebia)
  const poleR = T * 0.07, poleH = H;
  const poleSpacing = T * 0.22;

  for (let side = 0; side < 2; side++) {
    const startX = side === 0 ? -L / 2 : gateW / 2;
    const w = leftW;
    const cnt = Math.floor(w / poleSpacing);
    for (let i = 0; i <= cnt; i++) {
      const px = startX + i * (w / cnt);
      const h = poleH * (i % 2 === 0 ? 1.0 : 0.88);
      // Rzad zewnetrzny
      const poleExt = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR * 1.1, h, 6), wood);
      poleExt.position.set(px, h / 2, -wallD * 0.3);
      poleExt.castShadow = true;
      g.add(poleExt);
      // Rzad wewnetrzny (krotszy)
      const h2 = h * 0.92;
      const poleInt = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR * 1.1, h2, 6), woodDk);
      poleInt.position.set(px, h2 / 2, wallD * 0.3);
      poleInt.castShadow = true;
      g.add(poleInt);
    }
  }

  // Platforma chodnikowa na koronie — deski
  for (const [px, w] of [[-L / 2 + leftW / 2, leftW], [L / 2 - leftW / 2, leftW]] as [number, number][]) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(w, H * 0.06, wallD * 0.85), woodDk);
    plank.position.set(px, H + H * 0.03, 0);
    plank.castShadow = true;
    g.add(plank);
  }

  // Brama — 2 grubsze cylindry po bokach
  for (const sx of [-1, 1]) {
    const gatePost = new THREE.Mesh(new THREE.CylinderGeometry(T * 0.14, T * 0.16, H * 1.15, 8), woodDk);
    gatePost.position.set(sx * gateW / 2, H * 0.575, 0);
    gatePost.castShadow = true;
    g.add(gatePost);
  }

  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(poleR * 1.5, poleR * 1.5, gateW + T * 0.3, 6), woodDk);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, H * 1.1, 0);
  crossbar.castShadow = true;
  g.add(crossbar);

  // Schody (drewniane)
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, woodDk);

  // Skromne wiezyczki drewniane przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, woodColor, woodDkColor, true);

  // WROTA z bali w otworze bramy
  const gateGroup = addWoodenGate(g, gateW, H, wallD, 0, 0x5c3d1e, 0x3d2510);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== CELTOWIE (murus gallicus) =====
function buildCeltowie(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.15);
  const stoneColor = 0x888877;
  const stone = mk(stoneColor);
  const woodColor = 0x6b4226;
  const woodDkColor = 0x4a2d18;
  const wood = mk(woodColor);
  const woodDk = mk(woodDkColor);

  const leftW = (L - gateW) / 2;

  // Murus gallicus — segmentowany (lica kamienne)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, stoneColor);

  // Palisada na koronie — TYLKO zewnetrzna krawedz
  const poleR = T * 0.055, poleH = H * 0.35;
  const poleSpacing = T * 0.25;
  const extZ = -wallD * 0.38;
  for (let side = 0; side < 2; side++) {
    const startX = side === 0 ? -L / 2 : gateW / 2;
    const cnt = Math.floor(leftW / poleSpacing);
    for (let i = 0; i <= cnt; i++) {
      const px = startX + i * (leftW / cnt);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR * 1.1, poleH, 5), woodDk);
      pole.position.set(px, H + poleH / 2, extZ);
      pole.castShadow = true;
      g.add(pole);
    }
  }

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, wood);

  // Most nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW + T * 0.1, H * 0.06, wallD), wood);
  bridge.position.set(0, H, 0);
  g.add(bridge);

  // Pilary bramy z bali
  for (const sx of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(T * 0.22, H, wallD * 1.0), wood);
    jamb.position.set(sx * gateW / 2, H / 2, 0);
    jamb.castShadow = true;
    g.add(jamb);
  }

  // Skromne wiezyczki drewniane przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, woodColor, woodDkColor, true);

  // WROTA z bali w otworze bramy
  const gateGroup = addWoodenGate(g, gateW, H, wallD, 0, 0x6b4226, 0x4a2d18);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== GERMANIE =====
function buildGermanie(opts: Required<SiegeWallOpts>): THREE.Group {
  const g = new THREE.Group();
  const { lengthTiles, tileSize: T, height: H, gateWidthTiles } = opts;
  const L = lengthTiles * T;
  const gateW = gateWidthTiles * T;
  const wallD = Math.max(T, T * 1.3); // szeroki ziemny wal
  const woodColor = 0x4a3728;
  const woodDkColor = 0x32241a;
  const wood = mk(woodColor);
  const woodDk = mk(woodDkColor);
  const dirtColor = 0x5a4530;
  const dirt = mk(dirtColor);

  const leftW = (L - gateW) / 2;

  // Wal ziemny — segmentowany (umozliwia wyłom per-rząd)
  buildWallBodySegmented(g, L, gateW, H, wallD, T, dirtColor);

  // Drewniane pale — tylko zewnetrzna krawedz
  const poleR = T * 0.065, poleH = H * 0.45;
  const poleSpacing = T * 0.28;
  const extZ = -wallD * 0.38;
  for (let side = 0; side < 2; side++) {
    const startX = side === 0 ? -L / 2 : gateW / 2;
    const cnt = Math.floor(leftW / poleSpacing);
    for (let i = 0; i <= cnt; i++) {
      const px = startX + i * (leftW / cnt);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR * 1.15, poleH, 6), wood);
      pole.position.set(px, H + poleH / 2, extZ);
      pole.castShadow = true;
      g.add(pole);
    }
  }

  // Schody
  addStairs(g, -L / 2, gateW / 2, leftW, wallD, H, 0, woodDk);

  // Most nad brama
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(gateW + T * 0.2, H * 0.06, wallD), dirt);
  bridge.position.set(0, H, 0);
  g.add(bridge);

  // Brama z bali
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(T * 0.2, H * 1.1, T * 0.5), woodDk);
    post.position.set(sx * gateW / 2, H * 0.55, 0);
    post.castShadow = true;
    g.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(gateW + T * 0.4, T * 0.15, T * 0.2), woodDk);
  beam.position.set(0, H * 0.88, 0);
  beam.castShadow = true;
  g.add(beam);

  // Skromne wiezyczki drewniane przy bramie (styl bez dedykowanej wiezy bramnej)
  addSimpleTurrets(g, gateW, H, T, woodColor, woodDkColor, true);

  // WROTA z bali w otworze bramy
  const gateGroup = addWoodenGate(g, gateW, H, wallD, 0, 0x4a3728, 0x32241a);

  g.userData['wallWalkY'] = H;
  g.userData['depth'] = wallD;
  g.userData['gateCenterX'] = 0;
  g.userData['gate'] = gateGroup;
  g.userData['gateOpen'] = false;
  return g;
}

// ===== MAIN EXPORT =====
export function buildSiegeWall(civ: BronzeCiv, opts: SiegeWallOpts): THREE.Group {
  const resolved: Required<SiegeWallOpts> = {
    lengthTiles: opts.lengthTiles,
    tileSize: opts.tileSize,
    height: opts.height ?? 3,
    ownerColor: opts.ownerColor ?? 0xffffff,
    gateWidthTiles: opts.gateWidthTiles ?? 2,
  };

  switch (civ) {
    case 'grecja':   return buildGrecja(resolved);
    case 'rzym':     return buildRzym(resolved);
    case 'sumer':    return buildSumer(resolved);
    case 'egipt':    return buildEgipt(resolved);
    case 'inka':     return buildInka(resolved);
    case 'chiny':    return buildChiny(resolved);
    case 'zulu':     return buildZulu(resolved);
    case 'celtowie': return buildCeltowie(resolved);
    case 'germanie': return buildGermanie(resolved);
    case 'aztek':    return buildGrecja(resolved); // fallback
    default:         return buildGrecja(resolved);
  }
}

/**
 * attachRowBreachPanels — dodaje do wallGroup per-rząd meshe "wyłomowe".
 * Każdy panel = cienki Box o szerokości tileSize, wysokości height i głębokości wallDepth,
 * ustawiony w lokalnym X wallGroup dla danego rzędu (wallGroup jest rotowany 90° w scenie,
 * więc jego lokalna oś X = oś Z sceny).
 *
 * Wywołaj PO buildSiegeWall, PRZED dodaniem do sceny (lub po).
 *
 * @param wallGroup   wynik buildSiegeWall
 * @param wallCenterRow  rząd w siatce baterii odpowiadający centrum wallGroup (użyty przy rotacji)
 * @param rowLo       pierwszy rząd muru (bez bramy)
 * @param rowHi       ostatni rząd muru
 * @param gateRowLo   pierwszy rząd bramy (pominięty)
 * @param gateRowHi   ostatni rząd bramy (pominięty)
 * @param tileSize    rozmiar kafla = TILE_S
 */
export function attachRowBreachPanels(
  wallGroup: THREE.Group,
  wallCenterRow: number,
  rowLo: number,
  rowHi: number,
  gateRowLo: number,
  gateRowHi: number,
  tileSize: number
): void {
  const H   = (wallGroup.userData['wallWalkY'] as number) ?? 2.5;

  // -- NAPRAWA problem 3: budujemy mape row->segment-muru z wallSegsByLocalX --
  // buildWallBodySegmented() zapisal Map<segmentIdx, Mesh> w userData['wallSegsByLocalX'].
  // Przeksztalcamy ja na Map<row, Mesh> uzywajac tej samej formuly localX = (r - wallCenterRow) * T.
  const segsByLocalX = wallGroup.userData['wallSegsByLocalX'] as Map<number, THREE.Mesh> | undefined;
  const rowWallMeshes = new Map<number, THREE.Mesh[]>();

  for (let r = rowLo; r <= rowHi; r++) {
    if (r >= gateRowLo && r <= gateRowHi) continue;
    const localX = (r - wallCenterRow) * tileSize;
    const segKey = Math.round(localX / tileSize); // indeks segmentu = Math.round(cx/T)
    const seg = segsByLocalX?.get(segKey);
    if (seg) rowWallMeshes.set(r, [seg]);
  }
  wallGroup.userData['rowWallMeshes'] = rowWallMeshes;

  // -- Zachowaj rowBreachPanels jako puste (dla kompatybilnosci wstecznej) --
  wallGroup.userData['rowBreachPanels'] = new Map<number, THREE.Mesh[]>();
}
