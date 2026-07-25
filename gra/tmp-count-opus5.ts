import * as THREE from 'three';
import { buildZuluJavelineerOpus5, buildBatteringRamOpus5 } from './src/render/kamien-zulu-taran-opus5';

function countGroup(name: string, g: THREE.Group): void {
  let meshes = 0;
  let tris = 0;
  const mats = new Set<THREE.Material>();
  g.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes++;
      const mesh = obj as THREE.Mesh;
      const geo = mesh.geometry;
      let triCount = 0;
      if (geo.index) triCount = geo.index.count / 3;
      else if (geo.attributes['position']) triCount = geo.attributes['position'].count / 3;
      tris += triCount;
      const m = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((mm) => mats.add(mm));
      else mats.add(m);
    }
  });
  // bbox
  const box = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log(`${name}: ${meshes} mesh / ${Math.round(tris)} tri / ${mats.size} mat | bbox ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`);
}

const zulu = buildZuluJavelineerOpus5(0xff2222);
countGroup('Zulu', zulu);

const ram = buildBatteringRamOpus5(0xff2222);
countGroup('Taran (kamien, plozy)', ram);
