/**
 * Grupa D — kontynuacja frame'ów D-02…D-06 w Figmie (use_figma).
 * Uruchom gdy limit MCP się odnowi LUB wklej w Figma Plugin console.
 * fileKey: COVbTJUV5dx8MzMxfWlYeu · strona: 06 Screens D
 * Fonty: Lora (zamiast Georgia — brak w Figma cloud), Inter
 * Tokeny: docs/ux/DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md (1B)
 */
// eslint-disable-next-line no-unused-vars
async function buildGrupaDFrames() {
  function hex(h) {
    const n = h.replace('#', '');
    return { r: parseInt(n.slice(0, 2), 16) / 255, g: parseInt(n.slice(2, 4), 16) / 255, b: parseInt(n.slice(4, 6), 16) / 255 };
  }
  const T = {
    bgDeep: hex('#080a12'), bgPanel: hex('#121820'), gold: hex('#e8d88a'),
    goldDim: hex('#a08030'), text: hex('#e8e0c8'), muted: hex('#8a8070'),
    red: hex('#c84040'), blue: hex('#5a9bd4'),
  };
  await figma.loadFontAsync({ family: 'Lora', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  const page = figma.root.children.find(p => p.name === '06 Screens D');
  await figma.setCurrentPageAsync(page);
  const solid = (c, o = 1) => [{ type: 'SOLID', color: c, opacity: o }];
  const txt = (s, sz, f = 'Inter', st = 'Regular', c = T.text) => {
    const t = figma.createText();
    t.fontName = { family: f, style: st };
    t.characters = s;
    t.fontSize = sz;
    t.fills = solid(c);
    return t;
  };
  const panel = (w, h, n) => {
    const f = figma.createFrame();
    f.name = n;
    f.resize(w, h);
    f.fills = solid(T.bgPanel);
    f.strokes = solid(T.gold);
    f.strokeWeight = 2;
    f.cornerRadius = 10;
    f.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.75 }, offset: { x: 0, y: 12 }, radius: 40, spread: 0, visible: true, blendMode: 'NORMAL' }];
    return f;
  };
  const btn = (l, dest = false) => {
    const b = figma.createFrame();
    b.layoutMode = 'HORIZONTAL';
    b.primaryAxisAlignItems = 'CENTER';
    b.counterAxisAlignItems = 'CENTER';
    b.paddingLeft = 14;
    b.paddingRight = 14;
    b.paddingTop = 6;
    b.paddingBottom = 6;
    b.cornerRadius = 4;
    b.fills = [];
    b.strokes = solid(dest ? T.red : T.goldDim);
    b.strokeWeight = 2;
    b.appendChild(txt(l, 12, 'Inter', 'Semi Bold', dest ? hex('#ffd0cc') : T.text));
    b.layoutSizingHorizontal = 'HUG';
    b.layoutSizingVertical = 'HUG';
    return b;
  };
  const W = 1280;
  const H = 800;
  const ids = {};
  // usuń stare frame'y D-0x (zostaw __DipChipLibrary)
  for (const c of page.children) {
    if (c.name.startsWith('D-0')) c.remove();
  }
  // D-02 lista
  const f2 = figma.createFrame();
  f2.name = 'D-02';
  f2.resize(W, H);
  f2.x = 0;
  f2.fills = solid(T.bgDeep, 0.95);
  page.appendChild(f2);
  const list = panel(300, 520, 'Lista');
  list.x = 72;
  list.y = 140;
  list.layoutMode = 'VERTICAL';
  list.paddingTop = 14;
  list.paddingLeft = 14;
  list.paddingRight = 14;
  list.itemSpacing = 10;
  f2.appendChild(list);
  list.appendChild(txt('DYPLOMACJA', 14, 'Lora', 'Bold', T.gold));
  // … (pełna implementacja — patrz RAPORT)
  ids.d02 = f2.id;
  return ids;
}
