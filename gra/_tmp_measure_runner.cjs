const { buildNubianArcherOpus5 } = require('./_tmp_measure_nubian.cjs');
const THREE = require('three');

const group = buildNubianArcherOpus5(0xff0000);
group.updateMatrixWorld(true);

let meshCount = 0;
let triCount = 0;
group.traverse((obj) => {
  if (obj.isMesh) {
    meshCount++;
    const geo = obj.geometry;
    let triForThis;
    if (geo.index) triForThis = geo.index.count / 3;
    else triForThis = geo.attributes.position.count / 3;
    triCount += triForThis;
  }
});

const box = new THREE.Box3().setFromObject(group);

console.log('mesh count:', meshCount);
console.log('triangle count:', triCount);
console.log('materials (userData.mats.length):', group.userData['mats'].length);
console.log('bbox min:', box.min);
console.log('bbox max:', box.max);
console.log('height (HEX_R units):', box.max.y - box.min.y);
console.log('width X (HEX_R units):', box.max.x - box.min.x);
console.log('depth Z (HEX_R units):', box.max.z - box.min.z);
