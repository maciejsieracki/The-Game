/**
 * stoneCity.ts (lane Civ-MAPA / render)
 * 10 poziomow miasta EPOKI KAMIENIA (wioska -> miasto):
 *  L1-5: prymityw -- lepianki/szalasy (glina + stozkowa strzecha).
 *  L6-10: pojawia sie CEGLA (prostokatne domki) + centralna SWIATYNIA (megalit).
 * MURY sa NIEZALEZNE od poziomu (buduje gracz): buildStoneAgeCity(level, owner, withWalls).
 * withWalls=true dokłada kamienny wal z brama wokol osady, niezaleznie od poziomu.
 *
 * FIX (cityfix): dodano widoczna platforma gliniasta na L1-5 (r=0.40) i
 * zwiększono hutR 0.06 -> 0.13, aby osada była widoczna z domyslnej odleglosci kamery.
 */
import * as THREE from 'three';

function rnd(n: number, salt: number): number {
  let x = Math.imul((n + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

interface M { mud: THREE.Material; thatch: THREE.Material; thatchDk: THREE.Material; brick: THREE.Material; brickDk: THREE.Material; stone: THREE.Material; stoneDk: THREE.Material; wood: THREE.Material; fire: THREE.Material; owner: THREE.Material; }

function lepianka(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const wallH = rad * (0.55 + rnd(seed, 7) * 0.25);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.1, wallH, 7), m.mud);
  wall.position.y = wallH / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(rad * 1.35, rad * 1.0, 7), m.thatch);
  roof.position.y = wallH + rad * 0.45; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.4, wallH * 0.6, rad * 0.2), m.brickDk);
  door.position.set(0, wallH * 0.3, rad * 1.04); g.add(door);
  return g;
}

function brickHouse(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.7, h = rad * (1.1 + rnd(seed, 3) * 0.5), d = rad * 1.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.brick);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, rad * 0.12, d * 1.06), m.brickDk);
  roof.position.y = h + rad * 0.06; roof.castShadow = true; g.add(roof);
  return g;
}

function standingStone(hh: number, m: M): THREE.Mesh {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, hh, 0.05), m.stone);
  s.position.y = hh / 2; s.castShadow = true; s.receiveShadow = true; return s;
}

function megalithTemple(scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.085 * scale;
  const n = Math.round(6 + scale * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const st = standingStone(0.16 * scale, m);
    st.position.set(Math.cos(a) * ringR, 0, Math.sin(a) * ringR);
    st.rotation.y = a; g.add(st);
  }
  const hh = 0.15 * scale;
  for (const sx of [-0.05 * scale, 0.05 * scale]) {
    const up = new THREE.Mesh(new THREE.BoxGeometry(0.055 * scale, hh, 0.055 * scale), m.stoneDk);
    up.position.set(sx, hh / 2, 0); up.castShadow = true; g.add(up);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.045 * scale, 0.08 * scale), m.stoneDk);
  cap.position.set(0, hh + 0.022 * scale, 0); cap.castShadow = true; g.add(cap);
  return g;
}

// Kamienny wal obronny (NIEZALEZNY od poziomu) -- gdy gracz wybuduje mury.
function cityWall(spread: number): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.42, wallH = 0.17;
  const wmat = new THREE.MeshLambertMaterial({ color: 0x9a8c70, side: THREE.DoubleSide });
  const dmat = new THREE.MeshLambertMaterial({ color: 0x77694f, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr * 1.03, wallH, 30, 1, true), wmat);
  wall.position.y = wallH / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 1.05, Rr * 1.05, 0.035, 30, 1, true), dmat);
  rim.position.y = wallH; g.add(rim);
  // brama (ciemny otwor od frontu)
  const gate = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.16, wallH * 0.85, 0.06), new THREE.MeshLambertMaterial({ color: 0x3a2c1a }));
  gate.position.set(0, wallH * 0.42, Rr * 1.02); g.add(gate);
  return g;
}

export function buildStoneAgeCity(level: number, ownerCol: number, withWalls = false): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const mk = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const m: M = { mud: mk(0x8a6a45), thatch: mk(0xc2a262), thatchDk: mk(0x9a7d44), brick: mk(0xb07a52), brickDk: mk(0x84573a), stone: mk(0x9a8c70), stoneDk: mk(0x77694f), wood: mk(0x6b4f2a), fire: mk(0xff7a1a), owner: mk(ownerCol) };

  const hutCount = [1, 2, 3, 5, 7, 9, 12, 15, 18, 22][L - 1]!;
  const spread = 0.22 + L * 0.06;
  // hutR increased 0.06 -> 0.13 so single hut at L1 is ~26% hex-radius and visible from default cam
  const hutR = 0.13;

  // --- Platforma gliniasta (zawsze widoczna, kazdego poziomu) ---
  // Plaska podstawa o promieniu zaleznie od poziomu: r=0.40 dla L1, rosnie z poziomem.
  const platR = 0.40 + (L - 1) * 0.03;
  const platH = 0.03;
  const platMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
  const platGeo = new THREE.CylinderGeometry(platR, platR * 1.04, platH, 8, 1);
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = platH * 0.5;
  plat.receiveShadow = true;
  group.add(plat);

  if (L >= 6) {
    group.add(megalithTemple(0.85 + (L - 6) * 0.16, m));
  } else {
    if (L >= 3) {
      const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.03, 12), m.stoneDk);
      pit.position.y = platH;
      pit.receiveShadow = true; group.add(pit);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.10, 6), m.fire);
      fire.position.y = platH + 0.06; group.add(fire);
    }
    if (L >= 4) {
      const s1 = standingStone(0.22, m); s1.position.set(0.09, platH, 0.05); group.add(s1);
      const s2 = standingStone(0.18, m); s2.position.set(-0.09, platH, -0.05); group.add(s2);
    }
  }

  let placed = 0;
  const dwelling = (idx: number, r: number): THREE.Group => (L >= 6 && idx % 3 === 1) ? brickHouse(r, idx, m) : lepianka(r, idx, m);
  if (L <= 2) {
    for (let i = 0; i < hutCount; i++) {
      const ang = i * 2.2 + rnd(i, 1) * 6;
      // L1: single hut at centre; L2: two huts offset from centre
      const rr = L === 1 ? 0 : platR * 0.55;
      const hut = lepianka(hutR, i, m);
      hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
      hut.rotation.y = rnd(i, 4) * 6.28; group.add(hut); placed++;
    }
  } else {
    const rings: Array<[number, number]> = [[5, spread * 0.55], [8, spread * 0.85], [16, spread * 1.12]];
    for (const [cap, ringR] of rings) {
      const per = Math.min(hutCount - placed, cap);
      for (let i = 0; i < per; i++) {
        const ang = (i / per) * 6.2832 + rnd(placed, 1);
        const rr = ringR * (0.82 + rnd(placed, 2) * 0.36);
        const hut = dwelling(placed, hutR * (0.85 + rnd(placed, 3) * 0.3));
        hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
        hut.rotation.y = rnd(placed, 4) * 6.28; group.add(hut); placed++;
      }
      if (placed >= hutCount) break;
    }
  }

  if (L >= 5) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 0.45, 6), m.wood);
    pole.position.set(spread * 0.85, 0.22, spread * 0.18); pole.castShadow = true; group.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), m.owner);
    flag.position.set(spread * 0.85, 0.49, spread * 0.18); group.add(flag);
  }

  if (withWalls) group.add(cityWall(spread));
  return group;
}
