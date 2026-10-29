import { readFileSync, writeFileSync, cpSync } from 'node:fs';
const SRC = '/home/user/The-Game/.claude/worktrees/wf_22d071fc-4d1-2/src-tauri/frontend-v2/src/ui/cityPanel';
const M = '/tmp/claude-0/k09a-mut';
const muts = [
  ['M1-order-setK07aUxSectionRefresh-setK07aActiveCity', 'k09a-paint.ts',
    '  setK07aUxSectionRefresh(refresh);\n  setK07aActiveCity(city as unknown as CityK07);',
    '  setK07aActiveCity(city as unknown as CityK07);\n  setK07aUxSectionRefresh(refresh);'],
  ['M2-drop-setK06aActive', 'k09a-paint.ts',
    '  setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);\n', ''],
  ['M3-map-null-setK06aActive', 'k09a-paint.ts',
    '  setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);\n  ensureCityPanelStyles();', '  setK06aActive(city as unknown as CityK06, null as never, onClose ?? st.activeOnClose);\n  ensureCityPanelStyles();'],
  ['M4-drop-ensureCityPanelStyles', 'k09a-paint.ts', '  ensureCityPanelStyles();\n\n  requireK09aDeps()', '  requireK09aDeps()'],
  ['M5-scalePx-const', 'k09a-paint.ts', "const sp = getK07aScalePx() + 'px';", "const sp = '12px';"],
  ['M6-drop-clearGarrisonPanel', 'k09a-paint.ts', '    clearGarrisonPanel();\n', ''],
];
for (const [id, file, from, to] of muts) {
  const d = `${M}/${id}`;
  cpSync(SRC, d, { recursive: true });
  const p = `${d}/${file}`;
  const txt = readFileSync(p, 'utf8');
  const n = txt.split(from).length - 1;
  if (n !== 1) { console.log(`${id} SKIP: pattern count ${n}`); continue; }
  writeFileSync(p, txt.replace(from, to));
  console.log(`${id} applied`);
}
