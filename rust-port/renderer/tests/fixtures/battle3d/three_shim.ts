// `three` as seen by battle/battleScene.ts in the generator bundle: the real
// three@0.169.0 with ONLY `WebGLRenderer` replaced by an inert stub (no WebGL
// under node). The renderer is not part of the scene graph; its settings
// (shadowMap.type, toneMapping, exposure) are recorded and dumped as data.
export * from 'three';
export class WebGLRenderer {
  shadowMap: { enabled: boolean; type: number } = { enabled: false, type: -1 };
  toneMapping = -1;
  toneMappingExposure = -1;
  pixelRatio = -1;
  domElement: unknown;
  constructor(p: { canvas?: unknown }) { this.domElement = p?.canvas; }
  setPixelRatio(v: number): void { this.pixelRatio = v; }
  setSize(): void {}
  setAnimationLoop(): void {}
  render(): void {}
  dispose(): void {}
  getPixelRatio(): number { return this.pixelRatio; }
}
