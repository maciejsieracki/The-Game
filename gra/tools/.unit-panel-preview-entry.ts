/**
 * Entry do podglądu karty jednostki w panelu bocznym (screenshoty docs/ux).
 */
import { buildUnitContextTooltipHtml, UNIT_CONTEXT_PANEL_CSS } from '../src/ui/hexContextTooltip';
import { CIV_BRAND_SCOPE_VARS } from '../src/ui/brandTokenVars';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const combat = {
  atakBase: 8,
  atakEffective: 10,
  obronaBase: 6,
  obronaEffective: 7,
  hpMaxBase: 20,
  hpMaxEffective: 22,
  pancerzBase: 2,
  pancerzEffective: 3,
};

const actions = [
  { id: 'fortify', label: 'Ufortyfikuj' },
  { id: 'replace', label: 'Zastąp' },
  { id: 'sentry', label: 'Czuwaj' },
  { id: 'skip', label: 'Pomiń turę' },
  { id: 'disband', label: 'ROZWIĄŻ', danger: true },
];

const stackCards = [
  {
    id: 'u1',
    name: 'Łucznik',
    icon: '🏹',
    hp: 18,
    hpMax: 22,
    ruchLeft: 2,
    ruchMax: 2,
    active: true,
  },
  {
    id: 'u2',
    name: 'Wojownik',
    icon: '⚔',
    hp: 20,
    hpMax: 24,
    ruchLeft: 2,
    ruchMax: 2,
    active: false,
  },
];

const baseInput = {
  displayName: 'Łucznik egipski',
  q: 12,
  r: 8,
  ruchLeft: 2,
  ruchMax: 2,
  combat,
  hp: 18,
  zasieg: 2,
  parametryPathPp: 20,
  pancerzPathPp: 30,
  veteranProgress: { veterancyXp: 12, veterancyLevel: 2 } as const,
  veteranExperienceLine: 'Doświadczenie bojowe: 12 pkt (★★ Doświadczony)',
  veteranPanelExplanation:
    'Jednostki zdobywają doświadczenie w bitwach. Wyższy poziom daje bonus do ataku i obrony.',
  buildingBonusLabel: 'Parametry +20% · Pancerz +30%',
  expandable: true,
  actions,
  esc,
};

export function buildMiniHtml(): string {
  return buildUnitContextTooltipHtml({ ...baseInput, expanded: false });
}

export function buildExpandedHtml(): string {
  return buildUnitContextTooltipHtml({
    ...baseInput,
    expanded: true,
    stackCards,
  });
}

export function buildPreviewDocument(bodyHtml: string): string {
  const cardWrap = `
<div class="preview-wrap" style="${CIV_BRAND_SCOPE_VARS}">
  <div class="sp-ctx-card sp-ctx-interactive" style="width:300px;padding:14px 16px;border-radius:10px;
    background:linear-gradient(180deg,rgba(24,30,42,.98),rgba(10,12,18,.96));
    border:1px solid rgba(212,175,90,.38);box-shadow:0 6px 18px rgba(0,0,0,.45);">
    <div class="sp-ctx-head" style="font-size:10px;color:#a09880;text-transform:uppercase;letter-spacing:.22em;margin-bottom:8px;text-align:right;">Jednostka</div>
    <div class="cp-msg">${bodyHtml}</div>
  </div>
</div>`;
  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<title>Unit panel preview</title>
<style>
html,body{margin:0;background:#1a1e28;font-family:Segoe UI,Tahoma,sans-serif;}
.preview-wrap{padding:24px;display:flex;justify-content:flex-end;}
.sp-ctx-expand{display:block;width:100%;margin-top:10px;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(212,175,90,.35);background:rgba(20,26,36,.75);
  color:#e8d88a;font-size:10px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;}
${UNIT_CONTEXT_PANEL_CSS}
</style></head><body>${cardWrap}</body></html>`;
}
