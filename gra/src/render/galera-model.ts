/**
 * galera-model.ts — GALERA (jedyna jednostka morska, epoka brązu) — redesign ROBLOX
 * Seria render-jednostki (MASTER).
 * ---------------------------------------------------------------------------
 * Zamiennik 1:1 dla starego tokenu z render/units.ts:
 *   buildGalera(ownerColor, poza?) -> units.ts:~3524 case 'galera' w buildCategoryModel
 *
 * WPIĘCIE (units.ts): w buildCategoryModel zastąpić ciało `case 'galera'`
 * wywołaniem `return buildGalera(ownerColor_);` (import z tego modułu).
 * Poza 'atak' — do animacji ataku (auto-rozstrzyganie bitwy morskiej, brak
 * osobnej sceny): wiosła w synchronicznym zamachu + żagiel pełny.
 *
 * Interfejs i konwencje BEZ ZMIAN względem starego tokenu:
 *   - HULL_Y = 0.10*HEX_R — kadłub siedzi nisko na kafelku wody,
 *   - DZIÓB na −Z (spójnie z koniem/rydwanem), rufa na +Z,
 *   - kolor gracza: pas+emblemat żagla, tarcze (co druga), tuniki załogi,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - skala tokenu ±20% starego (kadłub 0.66 vs 0.62, maszt ~0.56 vs ~0.54).
 *
 * Sylwetka: klockowa galera wojenna — kadłub fasetowany (deski w 2 odcieniach,
 * wyraźna krzywizna dziobu i rufy), OKO APOTROPAICZNE na dziobie, trójzębny
 * brązowy taran przy linii wody, podwyższona rufa z zawijasem (aplustre)
 * i wiosłem sterowym, maszt z reją i wybrzuszonym żaglem (wiatr!), 8 wioseł
 * na burtę pod kątem wiosłowania, tarcze wzdłuż burt, 2 marynarzy na pokładzie.
 * Budżet: ~700 tri (pojazd, jak machiny oblężnicze).
 */
import * as THREE from 'three';

const HEX_R = 1.0;

// Paleta (spójna z units.ts)
const COLOR_BRONZE = 0xcf9234;  // polerowany brąz (taran, tarcze)
const COLOR_SAIL   = 0xe6ddc4;  // płótno żagla
const COLOR_SKIN   = 0xe0ac69;  // skóra załogi
const WOOD_LIGHT   = 0xa87f4a;  // górny pas desek (jasny, ciepły)
const WOOD_DARK    = 0x7a5530;  // dolny pas desek / dno
const WOOD_TRIM    = 0x4e341a;  // dziobnica / aplustre (ciemny akcent)
const WOOD_DECK    = 0xbb9258;  // pokład
const WOOD_MAST    = 0x6e4a24;  // maszt / reja / wiosła
const EYE_WHITE    = 0xf2eee6;  // białko oka apotropaicznego
const EYE_DARK     = 0x23262e;  // źrenica
const WATER_FOAM   = 0xd8ecf4;  // piana fali dziobowej

type MatFactory = (
  color: number, metalness?: number, roughness?: number,
) => THREE.MeshStandardMaterial;

function makeMatFactory(mats: THREE.Material[]): MatFactory {
  return function mat(color: number, metalness = 0.1, roughness = 0.7): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats.push(m);
    return m;
  };
}

export type GaleraPoza = 'plyniecie' | 'atak';

/**
 * Nowy token galery. `poza`:
 *  - 'plyniecie' (domyślna) — wiosła w wodzie pod kątem wiosłowania, żagiel na wietrze;
 *  - 'atak' — wiosła w synchronicznym zamachu ku rufie + żagiel pełniejszy (wrażenie szarży na taran).
 */
export function buildGalera(ownerColor: number, poza: GaleraPoza = 'plyniecie'): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = makeMatFactory(mats);
  const geos: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number): THREE.BoxGeometry => {
    const g = new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R);
    geos.push(g);
    return g;
  };

  const mHullHi = mat(WOOD_LIGHT, 0.05, 0.85);
  const mHullLo = mat(WOOD_DARK,  0.05, 0.88);
  const mTrim   = mat(WOOD_TRIM,  0.05, 0.85);
  const mDeck   = mat(WOOD_DECK,  0.05, 0.90);
  const mMast   = mat(WOOD_MAST,  0.05, 0.82);
  const mBronze = mat(COLOR_BRONZE, 0.38, 0.52);
  const mSail   = mat(COLOR_SAIL, 0.04, 0.90);
  const mOwner  = mat(ownerColor, 0.10, 0.68);
  const mEyeW   = mat(EYE_WHITE,  0.02, 0.60);
  const mEyeD   = mat(EYE_DARK,   0.05, 0.55);
  const mSkin   = mat(COLOR_SKIN, 0.05, 0.80);
  const mFoam   = mat(WATER_FOAM, 0.02, 0.95);

  const HULL_Y = 0.10 * HEX_R;   // środek kadłuba nisko na kafelku (jak stary token)
  const atak = poza === 'atak';

  // ── KADŁUB — dno w 3 fasetach (ciemne deski): środek + wznoszące dziób/rufa ──
  const mid = new THREE.Mesh(box(0.175, 0.06, 0.34), mHullLo);
  mid.position.set(0, HULL_Y - 0.018 * HEX_R, 0);
  group.add(mid);
  const bowB = new THREE.Mesh(box(0.15, 0.055, 0.19), mHullLo);
  bowB.rotation.x = 0.30;                          // −Z (dziób) unosi się
  bowB.position.set(0, HULL_Y - 0.004 * HEX_R, -0.245 * HEX_R);
  group.add(bowB);
  const stnB = new THREE.Mesh(box(0.15, 0.055, 0.19), mHullLo);
  stnB.rotation.x = -0.34;                         // +Z (rufa) unosi się mocniej
  stnB.position.set(0, HULL_Y + 0.002 * HEX_R, 0.245 * HEX_R);
  group.add(stnB);

  // ── PAS DESEK (jasny) — po 3 fasety na burtę: krzywizna dziobu i rufy ──────
  for (const sx of [-1, 1]) {
    const sMid = new THREE.Mesh(box(0.024, 0.052, 0.34), mHullHi);
    sMid.position.set(sx * 0.092 * HEX_R, HULL_Y + 0.028 * HEX_R, 0);
    group.add(sMid);
    const sBow = new THREE.Mesh(box(0.022, 0.052, 0.21), mHullHi);
    sBow.rotation.x = 0.32;
    sBow.rotation.y = sx * 0.34;                   // fasety zbiegają się w dziobnicy
    sBow.position.set(sx * 0.070 * HEX_R, HULL_Y + 0.050 * HEX_R, -0.245 * HEX_R);
    group.add(sBow);
    const sStn = new THREE.Mesh(box(0.022, 0.052, 0.20), mHullHi);
    sStn.rotation.x = -0.36;
    sStn.rotation.y = -sx * 0.36;                  // i w tylnicy
    sStn.position.set(sx * 0.070 * HEX_R, HULL_Y + 0.055 * HEX_R, 0.240 * HEX_R);
    group.add(sStn);
  }

  // ── POKŁAD ────────────────────────────────────────────────────────────────
  const deck = new THREE.Mesh(box(0.16, 0.018, 0.46), mDeck);
  deck.position.set(0, HULL_Y + 0.044 * HEX_R, -0.01 * HEX_R);
  group.add(deck);
  const DECK_TOP = HULL_Y + 0.053 * HEX_R;

  // ── DZIOBNICA + OKO APOTROPAICZNE ─────────────────────────────────────────
  const stem = new THREE.Mesh(box(0.045, 0.15, 0.05), mHullHi);
  stem.rotation.x = 0.34;                          // pochylona ku −Z
  stem.position.set(0, HULL_Y + 0.055 * HEX_R, -0.315 * HEX_R);
  group.add(stem);
  const stemCap = new THREE.Mesh(box(0.052, 0.035, 0.06), mTrim);
  stemCap.rotation.x = 0.34;
  stemCap.position.set(0, HULL_Y + 0.125 * HEX_R, -0.340 * HEX_R);
  group.add(stemCap);
  for (const sx of [-1, 1]) {                      // oko malowane na obu burtach dziobu
    // "Decal" tuż przy poszyciu dziobu, zwrócony na zewnątrz-do przodu
    // (yaw ~0.7), żeby czytał się i z profilu, i z 3/4 od dziobu.
    const EYE_YAW = 0.70;
    const ex = sx * 0.086 * HEX_R, ey = HULL_Y + 0.058 * HEX_R, ez = -0.268 * HEX_R;
    const white = new THREE.Mesh(new THREE.ConeGeometry(0.055 * HEX_R, 0.020 * HEX_R, 4), mEyeW);
    geos.push(white.geometry as THREE.BufferGeometry);
    white.rotation.z = -sx * Math.PI / 2;          // podstawa na burcie, wierzchołek na zewnątrz
    white.rotation.y = sx * EYE_YAW;
    white.scale.set(1.0, 1.0, 0.68);               // owal (spłaszczone w pionie)
    white.position.set(ex, ey, ez);
    group.add(white);
    const pupil = new THREE.Mesh(new THREE.ConeGeometry(0.024 * HEX_R, 0.018 * HEX_R, 4), mEyeD);
    geos.push(pupil.geometry as THREE.BufferGeometry);
    pupil.rotation.z = -sx * Math.PI / 2;
    pupil.rotation.y = sx * EYE_YAW;
    pupil.position.set(ex + sx * 0.011 * HEX_R, ey, ez - 0.010 * HEX_R);
    group.add(pupil);
  }

  // ── TARAN TRÓJZĘBNY (brąz) nisko przy linii wody ──────────────────────────
  const ramBase = new THREE.Mesh(box(0.060, 0.042, 0.09), mBronze);
  ramBase.position.set(0, HULL_Y - 0.040 * HEX_R, -0.340 * HEX_R);
  group.add(ramBase);
  for (const [px, py] of [[0, 0.014], [-0.030, -0.012], [0.030, -0.012]] as const) {
    const prong = new THREE.Mesh(box(0.016, 0.016, 0.13), mBronze);
    prong.position.set(px * HEX_R, HULL_Y + (py - 0.038) * HEX_R, -0.435 * HEX_R);
    group.add(prong);
  }
  // grzywka piany rozcinanej taranem
  const foam = new THREE.Mesh(box(0.105, 0.014, 0.04), mFoam);
  foam.position.set(0, HULL_Y - 0.052 * HEX_R, -0.372 * HEX_R);
  group.add(foam);

  // ── RUFA: nadbudówka, APLUSTRE (zawijas) i wiosło sterowe ─────────────────
  const qdeck = new THREE.Mesh(box(0.13, 0.05, 0.13), mHullHi);
  qdeck.position.set(0, HULL_Y + 0.075 * HEX_R, 0.255 * HEX_R);
  group.add(qdeck);
  const apl1 = new THREE.Mesh(box(0.035, 0.13, 0.035), mTrim);
  apl1.rotation.x = -0.42;                          // wygina się nad rufę
  apl1.position.set(0, HULL_Y + 0.155 * HEX_R, 0.330 * HEX_R);
  group.add(apl1);
  const apl2 = new THREE.Mesh(box(0.030, 0.090, 0.030), mTrim);
  apl2.rotation.x = -1.15;                          // zawijas ku dziobowi
  apl2.position.set(0, HULL_Y + 0.235 * HEX_R, 0.318 * HEX_R);
  group.add(apl2);
  const apl3 = new THREE.Mesh(box(0.026, 0.055, 0.026), mOwner);
  apl3.rotation.x = -1.85;                          // koniuszek w kolorze gracza
  apl3.position.set(0, HULL_Y + 0.262 * HEX_R, 0.272 * HEX_R);
  group.add(apl3);
  const tiller = new THREE.Mesh(box(0.016, 0.016, 0.20), mMast);   // wiosło sterowe (prawa burta)
  tiller.rotation.x = 0.9;
  tiller.rotation.z = 0.25;
  tiller.position.set(0.105 * HEX_R, HULL_Y + 0.005 * HEX_R, 0.315 * HEX_R);
  group.add(tiller);
  const tBlade = new THREE.Mesh(box(0.014, 0.032, 0.075), mMast);
  tBlade.rotation.x = 0.9;
  tBlade.position.set(0.128 * HEX_R, HULL_Y - 0.065 * HEX_R, 0.372 * HEX_R);
  group.add(tBlade);

  // ── MASZT + REJA + ŻAGIEL (wybrzuszony — wiatr od rufy) ───────────────────
  const MZ = 0.03 * HEX_R;                          // maszt tuż za śródokręciem
  const mast = new THREE.Mesh(box(0.024, 0.42, 0.024), mMast);
  mast.position.set(0, DECK_TOP + 0.21 * HEX_R, MZ);
  group.add(mast);
  const yard = new THREE.Mesh(box(0.40, 0.018, 0.018), mMast);     // reja W POPRZEK kadłuba
  yard.position.set(0, DECK_TOP + 0.395 * HEX_R, MZ);
  group.add(yard);
  const SAIL_Y = DECK_TOP + 0.265 * HEX_R;
  const bulge = (atak ? 0.075 : 0.050) * HEX_R;     // atak → żagiel pełniejszy
  const flare = atak ? 0.62 : 0.50;
  const sailC = new THREE.Mesh(box(0.15, 0.235, 0.014), mSail);    // bryt środkowy (wybrzuszony ku −Z)
  sailC.position.set(0, SAIL_Y, MZ - bulge);
  group.add(sailC);
  for (const sx of [-1, 1]) {                       // bryty boczne cofnięte ku reji
    const wing = new THREE.Mesh(box(0.13, 0.235, 0.014), mSail);
    wing.rotation.y = -sx * flare;
    wing.position.set(sx * 0.128 * HEX_R, SAIL_Y, MZ - bulge + 0.038 * HEX_R);
    group.add(wing);
  }
  // pas + emblemat (romb) w kolorze gracza na brycie środkowym
  const stripe = new THREE.Mesh(box(0.15, 0.052, 0.012), mOwner);
  stripe.position.set(0, SAIL_Y + 0.062 * HEX_R, MZ - bulge - 0.004 * HEX_R);
  group.add(stripe);
  const emblem = new THREE.Mesh(box(0.055, 0.055, 0.012), mOwner);
  emblem.rotation.z = Math.PI / 4;
  emblem.position.set(0, SAIL_Y - 0.045 * HEX_R, MZ - bulge - 0.004 * HEX_R);
  group.add(emblem);

  // ── WIOSŁA: 8/burta, synchronicznie pod kątem wiosłowania ─────────────────
  // plyniecie: łopatki w wodzie w połowie pociągnięcia; atak: pełny zamach ku rufie.
  const oarPitch = atak ? 0.78 : 0.30;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const oz = (-0.21 + i * 0.058) * HEX_R;
      const oar = new THREE.Mesh(box(0.012, 0.012, 0.24), mMast);
      oar.rotation.z = sx * 0.58;                   // łopatka w dół-na zewnątrz
      oar.rotation.x = oarPitch;
      oar.position.set(sx * 0.150 * HEX_R, HULL_Y - 0.012 * HEX_R, oz);
      group.add(oar);
    }
  }

  // ── TARCZE wzdłuż burt (stożki-puklerze; co druga w kolorze gracza) ───────
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const sz = (-0.155 + i * 0.105) * HEX_R;
      const sh = new THREE.Mesh(new THREE.ConeGeometry(0.046 * HEX_R, 0.020 * HEX_R, 6), (i % 2 === 0) ? mOwner : mBronze);
      geos.push(sh.geometry as THREE.BufferGeometry);
      sh.rotation.z = -sx * Math.PI / 2;            // podstawa na nadburciu, czubek na zewnątrz
      sh.position.set(sx * 0.112 * HEX_R, HULL_Y + 0.075 * HEX_R, sz);
      group.add(sh);
    }
  }

  // ── ZAŁOGA: 2 marynarzy (tunika = kolor gracza; ≤40 tri/szt) ──────────────
  // Obserwator na dziobie (z włócznią) + sternik na nadbudówce rufowej.
  const sailorAt = (x: number, y: number, z: number, yaw: number, spear: boolean): void => {
    const body = new THREE.Mesh(box(0.045, 0.085, 0.030), mOwner);
    body.position.set(x, y + 0.042 * HEX_R, z);
    body.rotation.y = yaw;
    group.add(body);
    const head = new THREE.Mesh(box(0.032, 0.032, 0.030), mSkin);
    head.position.set(x, y + 0.102 * HEX_R, z);
    head.rotation.y = yaw;
    group.add(head);
    if (spear) {
      const sp = new THREE.Mesh(box(0.008, 0.20, 0.008), mMast);
      sp.position.set(x + 0.032 * HEX_R, y + 0.085 * HEX_R, z);
      group.add(sp);
    }
  };
  sailorAt(-0.015 * HEX_R, DECK_TOP, -0.200 * HEX_R, atak ? 0 : 0.2, true);   // dziobowy
  sailorAt(0, HULL_Y + 0.10 * HEX_R, 0.250 * HEX_R, 0, false);                // sternik

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = geos;
  return group;
}
