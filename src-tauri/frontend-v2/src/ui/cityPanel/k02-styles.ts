// P5.8 K02 (kawalek H): ensureStyles -> ensureCityPanelStyles. Kopia CSS (string) z
// gra/src/ui/cityPanel.ts @ edb8fb56, linie 1948-3009. Zmiany wzgledem pinu (pelna lista):
//  (a) eksport i nazwa funkcji ensureStyles -> ensureCityPanelStyles;
//  (b) el('style') -> document.createElement('style') (ZAŁOŻENIE P5.8-K02-Z2; pin:863 bez cls/html = to samo);
//  (c) stale ukladu pin:1755-1773 IMPORTOWANE z ./k01a-fundament (P5.8 SCAL, zamkniecie R1;
//      wczesniej lokalne kopie, wartosci bez zmian). Stalej LIST_SCROLL_VISIBLE_CATALOG nie uzywa ensureStyles.
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from '../brandTokenVars';
import { resourceColorClassCss } from '../resourceColors';
import { UNIT_INFOGRAPHIC_CSS } from '../unitInfographic';
import { UNIT_RECRUIT_CARD_CSS } from '../unitRecruitCard';
// P5.8 SCAL: stale ukladu z K01 (zamiast lokalnych kopii; wartosci bez zmian).
import {
  BUILD_QUEUE_VISIBLE,
  CITY_PANEL_ICON_GLYPH_EM,
  CITY_PANEL_ICON_RAIL_VERT_EM,
  LIST_ROW_HEIGHT_COMPACT,
  LIST_ROW_HEIGHT_EM,
  LIST_SCROLL_VISIBLE,
  QUEUE_ROW_EM,
  RECRUIT_QUEUE_VISIBLE,
  STYLE_ID,
} from './k01a-fundament';

export function ensureCityPanelStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-city-screen-css-v2')?.remove();
  const css = `
.civ-cs{position:fixed;inset:0;z-index:400;display:flex;pointer-events:none;
  ${CIV_BRAND_SCOPE_VARS}
  --bg:var(--civ-bg-deep);--panel:var(--civ-panel-bg);--panel2:#121820;
  --border:var(--civ-gold-border);--bord2:var(--civ-gold-border-strong);
  --text:var(--civ-text-primary);--muted:var(--civ-text-muted);
  --gold:var(--civ-gold-primary);--green:var(--civ-success);--red:var(--civ-danger);
  --blue:var(--civ-science);--happy:var(--civ-gold-primary);
  font-family:var(--civ-font-ui);font-size:16px;}
/* P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1: paleta szesciu surowcow — jedno zrodlo prawdy
   (resourceColors.ts), to samo, z ktorego czyta HUD mapy swiata (hud.ts).
   Dwa poziomy swoistosci: goly selektor dla paska W3 (renderowanego poza .civ-cs)
   i wariant z prefiksem .civ-cs, ktory musi wygrac z istniejaca regula
   .civ-cs .gold o swoistosci (0,2,0). */
${resourceColorClassCss()}
${resourceColorClassCss('.civ-cs')}
.civ-cs *{box-sizing:border-box;}
.civ-cs-backdrop{flex:1 1 55%;min-width:0;background:rgba(8,10,18,0.58);pointer-events:auto;cursor:default;}
.civ-cs-drawer{flex:0 0 45%;width:45%;max-width:720px;min-width:300px;height:100%;pointer-events:auto;
  background:linear-gradient(180deg,rgba(26,32,44,0.98) 0%,var(--bg) 14%);color:var(--text);
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:-16px 0 48px rgba(0,0,0,0.65);border-left:1px solid var(--civ-gold-border-strong);
  animation:civ-cs-slide 0.24s ease-out;}
@keyframes civ-cs-slide{from{transform:translateX(100%);opacity:0.85}to{transform:translateX(0);opacity:1}}
.civ-cs-drawer-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45em 0.55em 0.6em;}
.civ-cs-tab-panel{display:flex;flex-direction:column;gap:0.42em;}
.civ-cs-tabs{display:flex;gap:0.15em;padding:0.28em 0.45em 0;border-bottom:1px solid var(--border);background:rgba(0,0,0,0.22);flex-shrink:0;}
.civ-cs-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:none;background:transparent;color:var(--muted);font-size:0.68em;font-weight:600;
  padding:0.38em 0.2em 0.32em;cursor:pointer;border-radius:var(--civ-radius-btn) var(--civ-radius-btn) 0 0;font-family:inherit;}
.civ-cs-tab-inner{display:flex;flex-direction:column;align-items:center;gap:0.15em;pointer-events:none;}
.civ-cs-tab-ic-wrap{display:inline-flex;align-items:center;justify-content:center;line-height:0;}
.civ-cs-tab-ic svg{width:22px;height:22px;color:var(--civ-gold-dim);opacity:0.88;}
.civ-cs-tab.on .civ-cs-tab-ic svg{color:var(--civ-gold-primary);opacity:1;}
.civ-cs-tab-lbl{line-height:1.1;letter-spacing:0.02em;white-space:nowrap;}
.civ-cs-tab:hover{color:var(--text);background:rgba(232,216,138,0.04);}
.civ-cs-tab.on{color:var(--gold);background:rgba(232,216,138,0.06);box-shadow:inset 0 -2px 0 var(--gold);}
.civ-cs .hdr-ic{display:inline-flex;align-items:center;line-height:0;vertical-align:middle;}
.civ-cs .hdr-ic svg{color:var(--civ-gold-primary);}
.civ-cs .mbadge .hdr-ic svg{width:0.95em;height:0.95em;color:var(--civ-gold-dim);}
.civ-cs .hbtn .hdr-ic svg{width:1.05em;height:1.05em;color:var(--civ-text-primary);}
.civ-cs .closeb .hdr-ic svg{width:1.1em;height:1.1em;color:#fff8f0;}
.civ-cs .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:0.38em 0.52em;box-shadow:0 1px 0 rgba(255,255,255,0.03);}
.civ-cs .panel-tight{padding:0.28em 0.45em;}
.civ-cs .ptitle{font-size:0.82em;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);
  border-bottom:1px solid rgba(232,216,138,0.2);padding:0.72em 0.85em 0.58em;margin:0 0 0.38em;
  background:linear-gradient(90deg,rgba(232,216,138,0.1),transparent);
  display:flex;justify-content:space-between;align-items:center;}
.civ-w4-panel-detail{font-size:0.56em;letter-spacing:0.14em;text-transform:uppercase;color:#a08030;font-weight:600;}
.civ-cs .subhd{font-size:0.72em;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin:0.35em 0 0.2em;}
.civ-cs .chip-row{display:flex;flex-wrap:wrap;gap:0.28em;align-items:center;}
.civ-cs .handel-chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.32em;max-width:100%;margin-bottom:0.32em;}
.civ-cs .handel-chip-grid .chip{display:flex;flex-direction:column;align-items:flex-start;gap:0.1em;padding:0.48em 0.58em;min-width:0;width:100%;box-sizing:border-box;border-radius:8px;border:1px solid rgba(232,216,138,0.18);background:rgba(255,255,255,0.02);}
.civ-cs .handel-chip-grid .chip .cl{font-size:0.72em;color:#8a8070;letter-spacing:.02em;}
.civ-cs .handel-chip-grid .chip .cv{font-size:0.82em;margin-top:0.04em;}
.civ-cs .handel-chip-grid .handel-card-skarb{border-color:rgba(232,216,138,0.18);}
.civ-cs .handel-chip-grid .handel-card-nauka{border-color:rgba(90,155,212,0.25);background:rgba(90,155,212,0.04);}
.civ-cs .handel-chip-grid .handel-card-zam{border-color:rgba(232,216,138,0.18);}
.civ-cs .city-money-grid{display:flex;flex-direction:column;gap:0.22em;font-size:0.72em;}
.civ-cs .city-money-row{display:flex;justify-content:space-between;gap:0.5em;padding:0.18em 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.civ-cs .city-money-lbl{color:#8a8070;flex:1;}
.civ-cs .city-money-val{font-weight:600;white-space:nowrap;}
.civ-cs .city-money-val.green{color:#78c95a;}
.civ-cs .city-money-val.red{color:#e07070;}
.civ-cs .handel-korupcja-chip{border-style:dashed;opacity:0.92;background:rgba(200,64,64,0.04)!important;border-color:rgba(200,64,64,0.25)!important;}
.civ-cs .handel-w4-sliders{display:flex;flex-direction:column;gap:0.38em;max-width:100%;margin-top:0.12em;}
.civ-cs .handel-w4-sliders .slider-row{margin-bottom:0;}
.civ-cs .handel-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
.civ-cs .handel-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .handel-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;margin-top:0;}
.civ-cs .handel-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
.civ-cs .handel-w4-sliders .slider-nauka input[type=range]::-webkit-slider-thumb{background:radial-gradient(circle at 40% 35%,#8fb6e0,#3a5f8a);border-color:#26456a;}
.civ-cs .handel-w4-sliders .slider-nauka input[type=range]::-moz-range-thumb{background:radial-gradient(circle at 40% 35%,#8fb6e0,#3a5f8a);border-color:#26456a;}
.civ-handel-wealth-host{margin-top:0.55em;padding-top:0.42em;border-top:1px solid rgba(212,175,90,0.22);padding-bottom:0.2em;}
.civ-handel-sliders-host{padding-bottom:0.18em;}
.civ-tab-indicators{gap:0.28em!important;margin:0.28em 0 0.38em!important;flex-wrap:wrap;}
.civ-tab-indicators .chip{font-size:0.72em;padding:0.24em 0.55em;border-radius:7px;border-color:rgba(232,216,138,0.25);}
.civ-tab-indicators .cl{font-size:0.92em;color:#c8b898;}
.civ-tab-indicators .cv{font-size:1em;font-weight:700;}
.civ-cs .chip{display:inline-flex;align-items:center;gap:0.32em;background:rgba(255,255,255,0.02);border:1px solid rgba(232,216,138,0.25);border-radius:7px;padding:0.28em 0.58em;font-size:0.74em;line-height:1.25;white-space:nowrap;}
.civ-cs .chip .cl{color:#c8b898;font-size:0.92em;}
.civ-cs .chip .cv{font-weight:700;}
.civ-cs .sliders-compact{display:flex;flex-wrap:wrap;gap:0.2em 0.55em;max-width:28em;}
.civ-cs .sliders-compact .slider-row{flex:1 1 8.5em;margin-bottom:0;min-width:7.5em;}
.civ-cs .col{display:flex;flex-direction:column;gap:0.32em;align-items:stretch;}
.civ-cs #cs-center{align-items:flex-start;}
.civ-cs #cs-center .panel{width:100%;max-width:100%;}
.civ-cs .muted{color:var(--muted);} .civ-cs .gold{color:var(--gold);} .civ-cs .green{color:var(--green);}
.civ-cs .red{color:var(--red);} .civ-cs .blue{color:var(--blue);} .civ-cs .happy{color:var(--happy);} .civ-cs .val{font-weight:600;}
.civ-cs .rsb{display:flex;justify-content:space-between;align-items:center;gap:0.3em;}
.civ-cs .row{display:flex;align-items:center;gap:0.35em;}
.civ-cs .btn{display:inline-flex;align-items:center;gap:0.2em;background:linear-gradient(180deg,#3a4150,#2a3040);
  border:1px solid var(--bord2);border-radius:3px;color:var(--text);font-size:0.82em;padding:0.18em 0.6em;cursor:pointer;font-family:inherit;}
.civ-cs .btn:hover{background:linear-gradient(180deg,#4a5160,#3a4050);}
.civ-cs .btn:disabled{opacity:0.4;cursor:not-allowed;}
.civ-cs .btn-g{background:linear-gradient(180deg,rgba(232,216,138,0.38),rgba(140,100,32,0.92));
  border:1px solid var(--civ-gold-border-strong);color:#fff8e8;font-weight:700;border-radius:var(--civ-radius-btn);}
.civ-cs .btn-g:hover{filter:brightness(1.08);}
.civ-cs .btn-b{background:linear-gradient(180deg,#2a5080,#1a3860);border-color:#5080c0;color:#e8f4ff;font-weight:700;}
.civ-cs .btn-b:hover{background:linear-gradient(180deg,#356090,#244870);}
.civ-cs .btn-b.can-build{background:linear-gradient(180deg,#3a7cc8,#2560a8);border-color:#5aa0e8;color:#f0f8ff;font-weight:700;
  box-shadow:0 0 0 1px rgba(90,160,232,0.32);}
.civ-cs .btn-b.can-build:hover{background:linear-gradient(180deg,#4890d8,#3070b8);}
.civ-cs .btn-b.cannot-build{background:linear-gradient(180deg,#2a3848,#1e2a38);border-color:#3d5068;color:#8a9cac;font-weight:600;
  opacity:1!important;cursor:not-allowed;}
.civ-cs .btn-b.cannot-build:disabled{opacity:1!important;}
.civ-cs .btn-g.can-build{background:linear-gradient(180deg,rgba(232,216,138,0.48),rgba(140,100,32,0.96));
  border-color:var(--civ-gold-border-strong);color:#fff8e8;opacity:1!important;}
.civ-cs .btn-g.cannot-build{background:linear-gradient(180deg,rgba(60,54,38,0.55),rgba(40,36,26,0.82));
  border-color:rgba(100,88,60,0.42);color:#8a8070;opacity:1!important;cursor:not-allowed;}
.civ-cs .btn-g.cannot-build:disabled{opacity:1!important;}
.civ-cs .btn-sm{padding:0.1em 0.45em;font-size:0.78em;}
.civ-cs .fsbtn{background:linear-gradient(180deg,#2a3040,#1e2530);border:1px solid var(--bord2);border-radius:3px;
  color:var(--muted);font-size:0.74em;padding:0.12em 0.5em;cursor:pointer;font-family:inherit;}
.civ-cs .fsbtn.active{color:var(--gold);border-color:var(--gold);font-weight:700;}
.civ-cs .hbtn{background:rgba(232,216,138,0.08);border:1px solid var(--civ-gold-border);color:var(--text);
  font-size:0.8em;padding:4px 8px;border-radius:var(--civ-radius-btn);cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;min-width:1.75em;min-height:1.75em;}
.civ-cs .hbtn:hover{background:rgba(232,216,138,0.16);border-color:var(--civ-gold-border-strong);}
.civ-cs .bwrap{background:#111518;border:1px solid var(--border);border-radius:2px;height:0.7em;overflow:hidden;}
.civ-cs .bfill{height:100%;border-radius:2px;}
.civ-cs #hdr{background:linear-gradient(180deg,rgba(28,34,46,0.98),rgba(14,18,26,0.98));border-bottom:1px solid var(--border);
  padding:0.4em 0.65em;display:flex;align-items:center;gap:0.4em;flex-wrap:wrap;flex-shrink:0;}
.civ-cs #cname{font-size:1.15em;font-weight:700;color:var(--gold);letter-spacing:.02em;font-family:var(--civ-font-title);}
.civ-cs .nav-arr{background:rgba(232,216,138,0.06);border:1px solid var(--bord2);color:var(--gold);font-size:0.95em;
  padding:0 0.4em;height:1.65em;cursor:pointer;border-radius:var(--civ-radius-btn);}
.civ-cs .nav-arr:disabled{opacity:0.35;cursor:not-allowed;}
.civ-cs .mbadge{background:var(--panel2);border:1px solid var(--border);border-radius:var(--civ-radius-btn);
  padding:0.1em 0.45em;font-size:0.76em;display:inline-flex;align-items:center;gap:0.25em;}
.civ-cs .era-b{background:linear-gradient(90deg,rgba(80,56,16,0.85),rgba(120,88,32,0.85),rgba(80,56,16,0.85));
  border:1px solid var(--gold);color:var(--gold);font-size:0.76em;font-weight:700;padding:0.12em 0.6em;border-radius:10px;}
.civ-cs #hdr-r{margin-left:auto;display:flex;align-items:center;gap:0.4em;}
.civ-cs .closeb{background:linear-gradient(180deg,#a83828,#6a1810);border:1px solid rgba(208,80,64,0.75);color:#fff;
  font-weight:700;border-radius:var(--civ-radius-btn);padding:0.12em 0.55em;cursor:pointer;font-size:1em;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;}
.civ-cs #body{display:grid;grid-template-columns:14em minmax(0,1fr) 15em;gap:0.4em;padding:0.4em;align-items:start;}
.civ-cs .bld,.civ-cs .spec,.civ-cs .unit,.civ-cs .res{display:flex;align-items:center;gap:0.35em;background:var(--panel2);
  border:1px solid var(--border);border-radius:3px;padding:0.2em 0.42em;margin-bottom:0.18em;}
.civ-cs .bi{font-size:0.95em;width:1.3em;text-align:center;} .civ-cs .bn{flex:1;font-size:0.84em;}
.civ-cs .bld-upg{flex:0 0 auto;margin-left:auto;padding:0 0.35em;background:transparent;border:none;color:var(--gold);cursor:pointer;font-size:0.95em;line-height:1;}
.civ-cs .bld-upg:hover{color:#fff;}
.civ-cs .bld-group{margin-bottom:0.22em;}
.civ-cs .bld-group>.bld,.civ-cs .bld-group>.bld-owned-row,.civ-cs .bld-group>.bld-group-empty-note{margin-left:0.15em;}
.civ-cs .bld-group-h{cursor:pointer;font-size:0.82em;font-weight:700;color:var(--fg);padding:0.16em 0.3em;
  background:var(--panel2);border:1px solid var(--border);border-radius:3px;margin-bottom:0.16em;user-select:none;}
.civ-cs .bld-group-h:hover{color:var(--gold);}
.civ-cs .bld-group-empty>.bld-group-h{color:var(--muted);font-weight:400;background:transparent;border-style:dashed;}
.civ-cs .bld-group-empty-note{font-size:0.72em;padding-left:0.5em;}
.civ-cs .be{font-size:0.74em;color:var(--green);} .civ-cs .bm{font-size:0.74em;color:var(--red);margin-left:auto;}
.civ-cs .ybox{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.4em 0.5em;}
.civ-cs .yn{font-size:0.74em;color:var(--muted);} .civ-cs .yv{font-size:1.4em;font-weight:700;line-height:1.1;}
.civ-cs .fbout{background:#111518;border:1px solid var(--border);border-radius:2px;height:1.15em;overflow:hidden;position:relative;}
.civ-cs .fbfil{height:100%;background:linear-gradient(90deg,#1e5a1e,#3a8a2a);}
.civ-cs .fbtxt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.74em;font-weight:700;white-space:nowrap;text-shadow:0 0 4px #000,0 1px 2px #000;}
.civ-cs .food-grow-block{margin:0.12em 0 0.32em;}
.civ-cs .food-grow-block.hover-detail-anchor{cursor:help;}
.civ-cs .food-grow-track{background:linear-gradient(180deg,#14100c,#0a0908);border:1px solid #4a3828;border-radius:4px;height:1.35em;position:relative;overflow:hidden;}
.civ-cs .food-grow-fill{height:100%;background:linear-gradient(180deg,#f0d878,#c89830 45%,#8a6018);border-radius:3px 0 0 3px;transition:width .15s ease;min-width:0;}
.civ-cs .food-grow-loaf{position:absolute;right:0.22em;top:50%;transform:translateY(-50%);font-size:0.9em;opacity:0.92;pointer-events:none;z-index:1;}
.civ-cs .food-stat-pair{display:flex;justify-content:space-between;gap:0.5em;margin-top:0.32em;}
.civ-cs .food-stat{display:flex;flex-direction:column;gap:0.06em;min-width:0;}
.civ-cs .food-stat-lbl{font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.civ-cs .food-stat-val{font-size:0.92em;font-weight:700;line-height:1.15;}
.civ-cs .food-split-wrap{margin-top:0.28em;}
.civ-cs .food-split-bar{display:flex;height:1.35em;background:#111518;border:1px solid var(--border);border-radius:4px;overflow:hidden;position:relative;touch-action:none;}
.civ-cs .food-split-bar--interactive{overflow:visible;cursor:ew-resize;}
.civ-cs .food-split-bar--interactive .food-split-g,.civ-cs .food-split-bar--interactive .food-split-a{border-radius:0;}
.civ-cs .food-split-g,.civ-cs .food-split-a{height:100%;min-width:0;flex-shrink:0;transition:width .12s ease;pointer-events:none;}
.civ-cs .food-split-bar--dragging .food-split-g,.civ-cs .food-split-bar--dragging .food-split-a{transition:none;}
.civ-cs .food-split-bar--ro{cursor:default;}
.civ-cs .food-split-g{background:linear-gradient(180deg,#f0d878,#c89830 45%,#8a6018);}
.civ-cs .food-split-a{background:linear-gradient(180deg,#5a3840,#3a2830);}
.civ-cs .food-split-handle{position:absolute;top:-3px;bottom:-3px;width:14px;margin-left:-7px;border-radius:4px;background:linear-gradient(180deg,#faf0c8 0%,#e8d070 35%,#a9861f 100%);border:1px solid #6a5212;box-shadow:0 1px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35);cursor:ew-resize;z-index:2;touch-action:none;pointer-events:none;}
.civ-cs .food-split-bar:focus-visible{outline:2px solid rgba(232,216,138,.55);outline-offset:2px;}
.civ-cs .food-split-labels{display:flex;justify-content:space-between;font-size:0.66em;color:var(--muted);margin-bottom:0.12em;}
.civ-cs .wyzwienie-w4-sliders{margin:0.38em 0 0.12em;}
.civ-cs .wyzwienie-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .wyzwienie-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c8e8a8,#4a7a1f);border:1px solid #3a5a12;cursor:pointer;}
.civ-cs .wyzwienie-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c8e8a8,#4a7a1f);border:1px solid #3a5a12;cursor:pointer;}
.civ-cs .wyzwienie-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
.civ-cs .auto-wyzywienie-btn{width:100%;min-width:0;}
.civ-cs .indywidualne-btn{width:100%;min-width:0;}
.civ-cs .indywidualne-row{margin-top:0.28em;}
.civ-cs .wyzwienie-w4-hint{font-size:0.62em;color:var(--muted);text-align:center;margin-top:0.2em;}
.civ-cs .food-bilans-row{display:flex;justify-content:space-between;align-items:center;gap:0.35em;font-size:0.76em;margin:0.28em 0 0.12em;padding:0.35em 0.45em;border:1px solid var(--border);border-radius:5px;background:rgba(255,255,255,.02);}
.civ-cs .food-bilans-row .pos{color:var(--green);}
.civ-cs .food-bilans-row .neg{color:var(--red);}
.civ-cs .growth-bd-block{margin-top:0.42em;padding-top:0.35em;border-top:1px solid rgba(232,216,138,.14);}
.civ-cs .growth-bd-hd{font-size:0.66em;letter-spacing:.12em;text-transform:uppercase;color:#a08030;margin-bottom:0.28em;}
.civ-cs .growth-bd-total{font-size:1.05em;font-weight:700;color:var(--gold);margin-bottom:0.22em;}
.civ-cs .growth-bd-row{display:flex;justify-content:space-between;gap:0.5em;font-size:0.74em;line-height:1.55;}
.civ-cs .growth-bd-row.pos{color:#7ad0a0;}
.civ-cs .growth-bd-row.neg{color:#e08a8a;}
.civ-cs .growth-bd-row.muted{color:var(--muted);}
.civ-cs .food-pop-hero{margin:0.1em 0 0.42em;padding:0.42em 0.5em;border-radius:9px;border:1px solid rgba(232,216,138,.22);background:rgba(232,216,138,.06);}
.civ-cs .food-pop-hero .pop-slots{font-size:1.12em;font-weight:700;color:var(--gold);line-height:1.35;}
.civ-cs .food-pop-hero .pop-abs{font-size:0.78em;color:var(--muted);margin-top:0.12em;}
.civ-cs .growth-progress-block{margin-top:0.22em;padding-top:0.2em;border-top:1px dashed rgba(232,216,138,.12);}
.civ-cs .growth-progress-block.hover-detail-anchor{cursor:help;}
.civ-cs .growth-progress-main{font-size:0.76em;color:var(--text);line-height:1.45;}
.civ-cs .growth-eta{font-size:0.74em;margin-top:0.2em;line-height:1.4;}
.civ-cs .growth-eta.ok{color:#7ad0a0;}
.civ-cs .growth-eta.warn{color:#e0a860;}
.civ-cs .growth-eta.muted{color:var(--muted);}
.civ-cs .praca-split-bar{display:flex;height:26px;background:rgba(255,255,255,0.08);border:1px solid rgba(232,216,138,0.18);border-radius:7px;overflow:hidden;position:relative;margin-bottom:0.38em;}
.civ-cs .praca-split-b{background:linear-gradient(90deg,#a08030,#e8d88a);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#2e2708;font-weight:700;}
.civ-cs .praca-split-u{background:linear-gradient(90deg,#3a6ad0,#5a9bd4);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#08121e;font-weight:700;}
.civ-cs .praca-w4-sliders{margin:0.38em 0 0.12em;}
.civ-cs .praca-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
.civ-cs .praca-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .praca-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
.civ-cs .praca-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
/* R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek F) — sygnał Ulepszeń na samej górze panelu
   „Podział pracy" + dwie wyraźnie oddzielone kolumny Budynki/Ulepszenia nad suwakiem. */
.civ-cs .praca-split-summary{display:flex;align-items:baseline;gap:0.3em;font-size:0.86em;font-weight:700;
  color:#8ec5ff;margin:0.1em 0 0.3em;}
.civ-cs .praca-split-summary b{font-size:1.1em;}
.civ-cs .praca-split-cols{display:flex;gap:0.5em;margin-bottom:0.32em;}
.civ-cs .praca-split-col{flex:1 1 50%;padding:0.3em 0.42em;border-radius:6px;background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);}
.civ-cs .praca-split-col.right{border-left:2px solid rgba(142,197,255,0.35);}
.civ-cs .praca-split-col-lbl{display:flex;align-items:center;gap:0.16em;font-size:0.7em;color:var(--muted);
  text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.14em;}
.civ-cs .praca-split-col b{font-size:0.92em;}
.civ-cs .civ-w4-order-banner{display:flex;align-items:center;justify-content:center;gap:0.55em;margin-top:0.42em;padding:0.68em 0.75em;border-radius:9px;font-size:0.82em;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}
.civ-cs .civ-w4-order-banner.ok{color:#7ad0a0;border:1px solid rgba(74,158,106,0.45);background:rgba(74,158,106,0.08);}
.civ-cs .civ-w4-order-banner.warn{color:#e0a860;border:1px solid rgba(224,168,96,0.4);background:rgba(224,168,96,0.08);}
.civ-cs .civ-w4-order-banner.crit{color:#ff8888;border:1px solid rgba(255,80,80,0.45);background:rgba(211,50,50,0.12);}
.civ-cs .civ-w4-order-banner.rebel{color:#e08a8a;border:1px solid rgba(200,64,64,0.45);background:rgba(200,64,64,0.1);}
.civ-cs .civ-breakdown-block .or-bar{height:8px;border-radius:5px;background:rgba(255,255,255,0.08);border:none;margin:0.12em 0 0.22em;}
.civ-cs .praca-split-bar .fbtxt{pointer-events:none;z-index:1;}
.civ-cs .civ-w4-tab-card{border:2px solid rgba(232,216,138,.42);border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,rgba(18,24,32,.97),rgba(8,10,16,.97));box-shadow:0 14px 36px rgba(0,0,0,.6);
  width:100%;max-width:24em;}
.civ-cs .civ-w4-tab-card.civ-w4-tab-card--scroll{display:flex;flex-direction:column;max-height:min(72vh,calc(100vh - 220px));min-height:0;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;
  padding-bottom:0.65em;scrollbar-width:thin;}
.civ-v-left-main.civ-v-left-main-split > .civ-w4-tab-card.civ-w4-tab-card--scroll{
  flex:1 1 auto;min-height:0;max-height:none;
}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll.civ-v-recruit-body{
  display:flex;flex-direction:column;overflow:hidden;
}
.civ-cs .civ-v-recruit-body .list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;
  overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll::-webkit-scrollbar{width:5px;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-cs .civ-w4-tab-body{padding:0 0.85em 0.55em;}
.civ-cs .civ-w4-tab-body .ptitle{margin:0 -0.85em 0.38em;padding-left:0.85em;padding-right:0.85em;width:calc(100% + 1.7em);}
.civ-cs .civ-w4-tab-body > .panel,.civ-cs .civ-w4-tab-body > div.panel{border:none;border-radius:0;background:transparent;box-shadow:none;padding:0 0 0.12em;}
.civ-cs .civ-w4-tab-body .ptitle{margin:0;border-radius:0;}
.civ-cs .civ-w4-tab-foot{border-top:1px solid rgba(232,216,138,.16);background:rgba(255,255,255,.015);}
.civ-cs .civ-w4-tab-foot .civ-w4-surowce-foot{border:none;border-radius:0;background:transparent;padding:0.55em 0.85em;margin:0;}
.civ-cs .civ-w4-subhd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;margin-bottom:0.22em;
  display:flex;justify-content:space-between;align-items:baseline;gap:0.35em;}
.civ-cs .civ-w4-subhd-pct{color:#e8e0c8;font-weight:600;letter-spacing:normal;text-transform:none;flex-shrink:0;}
.civ-cs .civ-w4-subhd-pts{color:#a09880;font-weight:400;letter-spacing:normal;text-transform:none;margin-left:0.35em;}
.civ-cs .civ-w4-pct-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:0.28em;}
.civ-cs .civ-w4-pct-fill{height:100%;border-radius:5px;}
.civ-cs .civ-w4-inline-breakdown{font-size:0.74em;line-height:1.65;margin-bottom:0.55em;}
.civ-cs .civ-w4-inline-breakdown.pos{color:#7ad0a0;}
.civ-cs .civ-w4-inline-breakdown.neg{color:#e08a8a;}
.civ-cs .civ-w4-inline-breakdown.muted{color:#8a8070;font-style:italic;}
.civ-cs .civ-w4-section-hd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;
  margin:0.55em 0 0.38em;padding-top:0.35em;border-top:1px solid rgba(232,216,138,.12);}
.civ-cs .civ-w4-tab-body .civ-breakdown-block .subhd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;}
.civ-cs .civ-w4-tab-body .civ-breakdown-block .muted{font-size:0.68em;letter-spacing:.1em;text-transform:uppercase;color:#8a8070;}
.civ-cs .picon{width:3.4em;height:3.4em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:1.9em;flex-shrink:0;}
.civ-cs .qitem{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.1em 0.45em;font-size:0.8em;display:flex;align-items:center;gap:0.25em;}
.civ-cs .qitem.qitem-draggable .qitem-grip{cursor:grab;}
.civ-cs .qitem.qitem-draggable{cursor:grab;}
.civ-cs .qitem.qitem-draggable button{cursor:pointer;}
.civ-cs .qitem.is-dragging{opacity:0.42;}
.civ-cs .qitem.is-drop-target{border-color:var(--gold);box-shadow:0 0 0 1px rgba(232,216,138,0.35);}
.civ-cs .qitem-grip{color:var(--muted);font-size:0.68em;letter-spacing:-0.14em;padding:0 0.12em;user-select:none;flex-shrink:0;line-height:1;opacity:0.75;}
.civ-cs .qitem-grip:hover{color:var(--gold);opacity:1;}
.civ-cs .qitem-eta{font-size:0.72em;color:var(--blue,#6ab0e8);white-space:nowrap;flex-shrink:0;line-height:1.2;}
.civ-cs .qitem-eta.muted-eta{color:var(--muted,#8a8070);}
.civ-cs .qitem-cost{font-size:0.72em;color:var(--muted,#8a8070);white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;gap:0.12em;line-height:1.2;}
.civ-cs .qitem .qitem-ic{width:1.05em;height:1.05em;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;}
.civ-cs .qitem .qitem-ic svg{width:1.05em;height:1.05em;display:block;}
.civ-cs .qitem .qitem-ic .unit-infographic-medallion{width:1.05em;height:1.05em;border:none;}
.civ-cs .qitem .btn{flex-shrink:0;}
.civ-cs .hpb{height:0.4em;background:var(--panel2);border:1px solid var(--border);border-radius:2px;overflow:hidden;margin-top:0.15em;}
.civ-cs .hpf{height:100%;border-radius:2px;background:var(--green);} .civ-cs .hpl{background:var(--red);}
.civ-cs .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:0.25em;}
.civ-cs .res.res-on{border-color:rgba(107,191,89,0.45);opacity:1;}
.civ-cs .res.res-off{opacity:0.38;border-style:dashed;filter:grayscale(0.85);}
.civ-cs .cring{display:flex;align-items:center;justify-content:center;width:3.6em;height:3.6em;border:3px solid var(--gold);
  border-radius:50%;font-size:0.9em;font-weight:700;color:var(--gold);margin:0.2em auto;background:radial-gradient(circle,#2a2530,#1b1f26);}
.civ-cs #ftr{background:linear-gradient(180deg,#1a2030,#141820);border-top:1px solid var(--border);padding:0.35em 0.55em;display:flex;align-items:center;gap:0.35em;flex-shrink:0;}
.civ-cs #ftr-r{margin-left:auto;display:flex;align-items:center;gap:0.45em;font-size:0.78em;}
.civ-cs .okolica{padding:0;}
.civ-cs .okolica h3{display:none;}
.civ-cs .okwrap{display:flex;gap:1em;align-items:flex-start;flex-wrap:wrap;}
.civ-cs .okolica-grid-wrap{position:relative;display:inline-block;line-height:0;}
.civ-cs #cs-okolica{position:relative;z-index:2;cursor:default;}
.civ-cs #cs-okolica svg{display:block;touch-action:manipulation;pointer-events:none;}
.civ-cs .ok-hex-hit{position:absolute;z-index:3;padding:0;margin:0;border:none;background:transparent;cursor:pointer;touch-action:manipulation;}
.civ-cs .ok-hex-hit:focus-visible{outline:2px solid var(--gold);outline-offset:1px;}
.civ-cs .oklegend{font-size:0.78em;color:var(--muted);display:flex;flex-direction:column;gap:0.25em;}
.civ-cs .sw{display:inline-block;width:0.75em;height:0.75em;border-radius:2px;vertical-align:middle;margin-right:0.3em;}
.civ-cs .okstats{display:flex;flex-wrap:wrap;gap:0.45em;margin-bottom:0.2em;}
.civ-cs .okstats.is-collapsed{display:none;}
.civ-cs .okstat{background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:0.3em 0.65em;font-size:0.82em;line-height:1.3;min-width:5.5em;}
.civ-cs .okstat b{color:var(--gold);font-size:1.1em;}
.civ-cs .okstat .ks{display:block;color:var(--muted);font-size:0.8em;text-transform:uppercase;letter-spacing:.04em;}
.civ-cs .okhint{font-size:0.76em;color:var(--muted);margin-top:0.55em;font-style:italic;flex-basis:100%;}
.civ-cs .okhint.is-collapsed{display:none;}
.civ-cs .okolica-compact-row{margin:0.12em 0 0.38em;}
.civ-cs .okolica-toolbar{display:flex;align-items:center;flex-wrap:nowrap;gap:0.2em;
  margin:0.12em 0 0.38em;padding:0.2em 0.38em;
  background:var(--panel2);border:1px solid var(--border);border-radius:4px;
  overflow-x:auto;min-width:0;}
.civ-cs .okolica-toolbar.hover-detail-anchor{cursor:help;}
.civ-cs .okolica-toolbar-profiles{display:flex;flex-wrap:nowrap;gap:0.16em;flex-shrink:0;}
.civ-cs .okolica-toolbar-profiles button{font-size:0.66em;padding:0.1em 0.28em;border:1px solid var(--border);
  background:var(--panel);color:var(--muted);border-radius:3px;cursor:pointer;font-family:inherit;white-space:nowrap;line-height:1.25;}
.civ-cs .okolica-toolbar-profiles button.on{border-color:var(--gold);color:var(--gold);background:#2a2530;}
.civ-cs .okolica-toolbar-profiles button:disabled{opacity:0.55;cursor:default;}
.civ-cs .okolica-toolbar-profiles button.okolica-profile-btn{display:inline-flex;align-items:center;gap:0.28em;
  padding:0.12em 0.38em;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-glyph{display:inline-flex;align-items:center;justify-content:center;
  width:1.15em;height:1.15em;flex-shrink:0;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-ic{width:100%;height:100%;display:block;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-lbl{font-size:0.95em;line-height:1;}
.civ-cs .okolica-toolbar-profiles button.okolica-restore-btn{min-width:1.65em;padding:0.12em 0.32em;font-size:0.85em;}
.civ-cs .okolica-mode-hint{font-size:0.68em;color:var(--muted);margin:0.12em 0 0.22em;line-height:1.35;}
.civ-cs .okolica-grid-host{margin-top:0.15em;max-height:11em;overflow:auto;}
.civ-cs .okolica-compact-inner{display:flex;align-items:center;justify-content:space-between;gap:0.45em;flex-wrap:wrap;
  padding:0.28em 0.45em;background:var(--panel2);border:1px solid var(--border);border-radius:4px;}
.civ-cs .okolica-compact-inner.hover-detail-anchor{cursor:help;}
.civ-cs .okolica-info-link{font-size:0.72em;font-weight:600;text-decoration:underline dotted;text-underline-offset:2px;
  pointer-events:auto;cursor:pointer;position:relative;z-index:6;background:none;border:none;padding:0.18em 0.32em;margin:0;
  font-family:inherit;color:inherit;line-height:inherit;text-transform:inherit;letter-spacing:inherit;}
.civ-cs .okolica-info-link:hover,.civ-cs .okolica-info-link:focus-visible{color:var(--gold);}
.civ-cs .civ-w4-surowce-detail{pointer-events:auto;cursor:pointer;position:relative;z-index:6;background:none;border:none;padding:0.18em 0.32em;margin:0;
  font-family:inherit;color:inherit;line-height:inherit;text-transform:inherit;letter-spacing:inherit;}
.civ-cs .civ-w4-surowce-detail:hover,.civ-cs .civ-w4-surowce-detail:focus-visible{color:var(--gold);}
.civ-cs .ptitle .okolica-info-link,.civ-cs .ptitle .civ-w4-panel-detail{flex-shrink:0;pointer-events:auto;}
.civ-ux-right .ptitle,.civ-ux-left .ptitle{position:relative;z-index:3;isolation:isolate;}
.civ-ux-right .civ-w4-tab-body--scroll .ptitle{z-index:4;}
.civ-detail-scope .detail-card.okolica-detail-card{font-size:0.84em;line-height:1.42;}
.civ-detail-scope .detail-card.okolica-detail-card .dc-grid{grid-template-columns:minmax(7em,0.95fr) 1.05fr;}
.civ-cs .cs-order .or-t{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold);
  border-bottom:1px solid var(--border);padding-bottom:0.25em;margin-bottom:0.35em;display:flex;justify-content:space-between;align-items:center;}
.civ-cs .cs-order .or-r{display:flex;justify-content:space-between;padding:0.08em 0;font-size:0.82em;}
.civ-cs .cs-order .or-l{color:var(--muted);}
.civ-cs .cs-order .or-bar{height:0.55em;background:#111518;border:1px solid var(--border);border-radius:2px;overflow:hidden;margin:0.15em 0 0.3em;}
.civ-cs .cs-order .or-fill{height:100%;}
.civ-cs .cs-order .or-status{margin-top:0.35em;padding:0.25em 0.45em;border-radius:3px;font-size:0.78em;font-weight:700;text-align:center;}
.civ-cs .cs-order .or-status.ok{background:rgba(107,191,89,0.12);color:var(--green);border:1px solid rgba(107,191,89,0.35);}
.civ-cs .cs-order .or-status.t1{background:rgba(217,138,58,0.12);color:#d98a3a;border:1px solid rgba(217,138,58,0.35);}
.civ-cs .cs-order .or-status.t2{background:rgba(211,107,94,0.15);color:var(--red);border:1px solid rgba(211,107,94,0.45);}
.civ-cs .hbtn.active{background:linear-gradient(180deg,#2a5a28,#1e4020);border-color:var(--green);color:#dff5d8;box-shadow:0 0 8px rgba(107,191,89,.45);}
/* R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B (Maciej, zrzut panelu miasta): przelacznik
   wyzywienia dawal sie odczytac WYLACZNIE po tym, ze wariant WLACZONY swieci (.active).
   Wariant WYLACZONY wygladal jak kazdy inny, w pelni aktywny .hbtn (pelny tekst
   var(--text) + zloty kontur), wiec „ciemny" przycisk nie czytal sie jako WYLACZONY,
   tylko jako „zwykly przycisk do klikniecia". Stan WYL dostaje wiec jawne WYGASZENIE
   — dokladnie ta sama para co istniejacy .civ-cs .fsbtn / .fsbtn.active wyzej
   (nieaktywny: ten sam gradient #2a3040->#1e2530 + color:var(--muted); aktywny: kolor
   nasycony + wyroznienie). Zadnej nowej konwencji: swieci = WL, wygaszony = WYL.
   TYLKO WYGLAD — logika przelaczania nietknieta. */
.civ-cs .hbtn.off{background:linear-gradient(180deg,#2a3040,#1e2530);border-color:var(--border);
  color:var(--muted);box-shadow:none;font-weight:400;}
.civ-cs .hbtn.off:hover{background:linear-gradient(180deg,#333a4c,#252d3a);border-color:var(--bord2);color:var(--text);}
.civ-cs .okprof{display:flex;flex-wrap:wrap;gap:0.25em;margin:0.35em 0;}
.civ-cs .okprof button{font-size:0.72em;padding:0.15em 0.45em;border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:3px;cursor:pointer;font-family:inherit;}
.civ-cs .okprof button.on{border-color:var(--gold);color:var(--gold);background:#2a2530;}
.civ-cs .oktile-btn{font-size:0.65em;padding:0 0.25em;margin-left:0.15em;cursor:pointer;border:1px solid var(--border);background:var(--panel);border-radius:2px;color:var(--gold);}
.civ-cs .cs-order .or-ph{font-size:0.66em;color:var(--muted);border:1px solid var(--border);border-radius:3px;padding:0 0.3em;}
.civ-cs .cs-order .or-lines{font-size:0.72em;color:var(--muted);margin:0.15em 0 0.35em;line-height:1.35;padding-left:0.15em;}
.civ-cs .cs-order .or-lines .pos{color:var(--green);}
.civ-cs .cs-order .or-lines .neg{color:var(--red);}
.civ-cs .civ-breakdown-block{margin-top:0.38em;padding-top:0.12em;}
.civ-cs .civ-breakdown-block .or-r{display:flex;justify-content:space-between;padding:0.08em 0;font-size:0.82em;}
.civ-cs .civ-breakdown-block .or-l{color:var(--muted);}
.civ-cs .civ-breakdown-block .or-bar{height:0.55em;background:#111518;border:1px solid var(--border);border-radius:2px;overflow:hidden;margin:0.12em 0 0.22em;}
.civ-cs .civ-breakdown-block .or-fill{height:100%;}
.civ-cs .civ-breakdown-block .or-lines{font-size:0.72em;color:var(--muted);margin:0.1em 0 0.28em;line-height:1.38;padding-left:0.12em;}
.civ-cs .civ-breakdown-block .or-lines .pos{color:var(--green);}
.civ-cs .civ-breakdown-block .or-lines .neg{color:var(--red);}
.civ-cs .civ-breakdown-block .or-lines .muted-line{color:var(--muted);font-style:italic;}
.civ-cs .civ-breakdown-block .or-status{margin-top:0.28em;padding:0.25em 0.45em;border-radius:3px;font-size:0.78em;font-weight:700;text-align:center;}
.civ-cs .civ-breakdown-block .or-status.ok{background:rgba(107,191,89,0.12);color:var(--green);border:1px solid rgba(107,191,89,0.35);}
.civ-cs .civ-breakdown-block .or-status.t1{background:rgba(217,138,58,0.12);color:#d98a3a;border:1px solid rgba(217,138,58,0.35);}
.civ-cs .civ-breakdown-block .or-status.t2{background:rgba(211,107,94,0.15);color:var(--red);border:1px solid rgba(211,107,94,0.45);}
.civ-cs .civ-breakdown-block .or-status.crit{background:rgba(211,50,50,0.22);color:#ff8888;border:1px solid rgba(255,80,80,0.55);}
.civ-cs .hrow{display:flex;justify-content:space-between;align-items:center;font-size:0.82em;padding:0.1em 0;}
.civ-cs .slider-row{margin-bottom:0.22em;}
.civ-cs .slider-row label{display:flex;justify-content:space-between;font-size:0.72em;margin-bottom:0.06em;gap:0.3em;}
.civ-cs .slider-row input[type=range]{width:100%;accent-color:var(--gold);height:0.85em;}
.civ-cs .praca-balance{margin-top:0.12em;}
.civ-cs .praca-balance-labels{display:flex;justify-content:space-between;align-items:flex-end;gap:0.5em;margin-bottom:0.1em;}
.civ-cs .praca-side{display:flex;flex-direction:column;gap:0.04em;min-width:4.5em;}
.civ-cs .praca-side.right{align-items:flex-end;text-align:right;}
.civ-cs .praca-side .lbl{font-size:0.72em;color:var(--muted);letter-spacing:.02em;}
.civ-cs .praca-side .pct{font-size:0.95em;font-weight:700;line-height:1.1;}
.civ-cs .praca-balance input[type=range]{width:100%;accent-color:var(--gold);height:0.85em;margin:0.05em 0;}
.civ-cs .praca-balance-hint{font-size:0.65em;color:var(--muted);text-align:center;margin-top:0.1em;line-height:1.3;}
.civ-cs .praca-split-info{margin-top:0.35em;display:flex;flex-direction:column;gap:0.18em;font-size:0.74em;line-height:1.35;}
.civ-cs .praca-split-info .psi-row{display:flex;justify-content:space-between;align-items:flex-start;gap:0.45em;}
.civ-cs .praca-split-info .psi-lbl{color:var(--muted);flex:0 0 auto;}
.civ-cs .praca-split-info .psi-val{text-align:right;flex:1 1 auto;}
.civ-cs .praca-split-info .psi-sub{font-size:0.92em;color:var(--muted);margin-top:0.06em;}
.civ-cs .praca-split-chips{margin:0.28em 0 0.12em;}
.civ-cs .civ-cs-chip-ic-wrap{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.1em;}
.civ-cs .civ-cs-chip-ic{width:1em;height:1em;color:var(--gold);flex-shrink:0;}
.civ-cs .civ-cs-inline-loaf{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.06em;}
.civ-cs .civ-cs-inline-loaf .civ-v-loaf-ic{width:0.9em;height:0.95em;}
.civ-detail-scope .detail-card .dc-v .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-note .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-formula .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-section .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-algo-step .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-v .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-note .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-formula .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-section .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-algo-step .civ-cs-chip-ic-wrap,
.civ-cs .or-status .civ-cs-chip-ic-wrap,
.civ-cs .or-status .civ-cs-inline-loaf{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.08em;}
.civ-cs .praca-split-bar .fbtxt{display:flex;align-items:center;justify-content:center;gap:0.08em;flex-wrap:wrap;}
.civ-cs .praca-split-info .psi-lbl{display:inline-flex;align-items:center;gap:0.12em;}
.civ-cs .chip .cl{display:inline-flex;align-items:center;gap:0.1em;}
.civ-cs .wealth-grid{display:flex;flex-wrap:wrap;gap:0.22em;}
.civ-cs .wealth-compact-wrap{margin:0.06em 0 0.28em;padding:0.28em 0.34em;background:var(--panel2);border:1px solid var(--border);border-radius:6px;}
.civ-cs .wealth-compact-wrap.hover-detail-anchor{cursor:help;}
.civ-cs .wealth-compact-badges{display:flex;align-items:center;gap:0.28em;flex-wrap:wrap;margin-bottom:0.28em;}
.civ-cs .wealth-compact-stat{display:inline-flex;align-items:center;justify-content:center;gap:0.12em;
  min-width:2.1em;padding:0.18em 0.38em;border:1px solid rgba(232,216,138,0.22);border-radius:5px;
  font-size:0.78em;line-height:1;cursor:help;flex:0 0 auto;background:rgba(0,0,0,0.14);}
.civ-cs .wealth-compact-stat b{font-weight:700;font-size:1em;}
.civ-cs .wealth-compact-stat.wealth-w b{color:var(--gold);}
.civ-cs .wealth-compact-stat.wealth-mnoz b{color:#8ec8f0;}
.civ-cs .wealth-compact-stat.wealth-happy{padding:0.18em 0.32em;}
.civ-cs .wealth-compact-bar{width:100%;height:1.15em;margin:0;}
.civ-cs .wealth-compact-bar .fbtxt{font-size:0.82em;padding:0 0.25em;}
.civ-cs .wealth-compact-eta{font-size:0.66em;color:var(--muted);margin-top:0.22em;line-height:1.35;}
.civ-cs .wealth-compact-eta.ok{color:#7ad0a0;}
.civ-cs .wealth-compact-eta.warn{color:#e0a860;}
.civ-detail-scope .detail-card.wealth-detail-card{font-size:0.84em;line-height:1.42;}
.civ-detail-scope .detail-card.wealth-detail-card .dc-grid{grid-template-columns:minmax(7.5em,0.95fr) 1.05fr;}
.civ-detail-scope .detail-card.wealth-detail-card .dc-formula{font-size:0.88em;color:var(--gold);font-family:Consolas,'Courier New',monospace;margin:0.2em 0 0.35em;padding:0.25em 0.4em;
  background:rgba(0,0,0,0.25);border-radius:3px;border-left:2px solid var(--gold);}
.civ-cs .wealth-stat{flex:0 0 auto;background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.15em 0.38em;font-size:0.78em;}
.civ-cs .wealth-stat .ks{display:inline;color:var(--muted);font-size:0.92em;margin-right:0.25em;}
.civ-cs .wealth-stat b{color:var(--gold);font-size:0.95em;}
.civ-ux-mount.civ-cs{pointer-events:auto;}
.civ-ux-panel-scope.civ-cs{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;
  gap:0.48em!important;
  z-index:auto!important;width:100%;height:auto;min-height:0;
  background:transparent;color:var(--text);font-family:var(--civ-font-ui);}
.civ-ux-left .civ-ux-panel-scope.civ-cs,
.civ-ux-right .civ-ux-panel-scope.civ-cs,
.civ-ux-left-icon-rail .civ-ux-panel-scope.civ-cs,
.civ-ux-right-icon-rail .civ-ux-panel-scope.civ-cs,
.civ-ux-map-chrome .civ-ux-panel-scope.civ-cs{pointer-events:auto!important;}
.civ-ux-top .civ-ux-panel-scope.civ-cs{pointer-events:none;}
.civ-ux-right,.civ-ux-left,.civ-v-right-main,.civ-v-left-main,.civ-w4-tab-card,.civ-w4-tab-body{pointer-events:auto;}
.civ-v-card{background:rgba(6,12,24,0.55);border:1px solid var(--civ-gold-border);border-radius:var(--civ-radius-panel);
  padding:0.45em 0.5em;margin-bottom:0.45em;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.35);}
.civ-v-city-name{font-size:1.35em;font-weight:700;color:var(--civ-gold-primary);letter-spacing:0.04em;text-transform:uppercase;font-family:var(--civ-font-title);}
.civ-v-city-pop{font-size:0.78em;color:var(--muted);margin-top:0.15em;}
.civ-v-growth{margin:0.45em 0 0.55em;}
.civ-v-growth-lbl{font-size:0.68em;color:var(--muted);text-transform:uppercase;margin-bottom:0.12em;}
.civ-v-yields{display:flex;flex-direction:column;gap:0.22em;}
.civ-v-yield-row{display:flex;align-items:center;gap:0.45em;font-size:0.88em;padding:0.12em 0;
  border-bottom:1px solid rgba(255,255,255,0.04);}
.civ-v-yield-row:last-child{border-bottom:none;}
.civ-v-yield-icon{width:1.35em;text-align:center;font-size:1.05em;}
.civ-v-yield-label{flex:1;color:#c8d0dc;}
.civ-v-yield-val{font-weight:700;min-width:2.5em;text-align:right;}
.civ-v-top-strip{display:flex;align-items:center;justify-content:space-between;gap:0.5em;
  padding:0.28em 0.65em;background:linear-gradient(180deg,#121a28,#0a1018);
  border-bottom:1px solid rgba(212,175,90,0.25);font-size:0.78em;}
.civ-v-resource-bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  gap:0.5rem;padding:0 0.65rem;height:100%;min-height:0;box-sizing:border-box;
  background:linear-gradient(180deg,#0c121c,#060a10);border-bottom:1px solid rgba(212,175,90,0.32);}
.civ-v-resource-bar.civ-v-resource-bar-w3{display:flex;align-items:center;justify-content:center;gap:0.65rem;
  padding:0;background:transparent;border:none;height:auto;min-height:0;width:fit-content;max-width:100%;min-width:0;margin:0 auto;box-sizing:border-box;}
.civ-v-top-stack{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:fit-content;max-width:min(98vw,1280px);gap:0.22rem;padding:0;box-sizing:border-box;margin:0 auto;}
.civ-v-top-flank-row{display:flex;align-items:flex-start;justify-content:center;gap:0.5rem 0.65rem;flex-wrap:nowrap;width:100%;overflow:visible;}
.civ-v-w3-chips-flank{display:flex;align-items:center;justify-content:center;flex-wrap:nowrap;gap:0.32rem 0.48rem;
  padding:0.38rem 0.82rem;border-radius:12px;
  background:linear-gradient(180deg,rgba(22,28,40,0.94),rgba(8,10,16,0.95));border:1px solid rgba(232,216,138,0.32);
  flex:0 0 auto;min-width:0;overflow:visible;}
.civ-v-w3-chips-flank.civ-v-w3-chips-left{justify-content:flex-end;}
.civ-v-w3-chips-flank.civ-v-w3-chips-right{justify-content:flex-start;}
.civ-v-top-line{display:flex;align-items:center;justify-content:center;gap:0.65rem;flex-wrap:wrap;width:100%;}
.civ-v-exit-bottom-row{display:flex;flex-direction:column;align-items:center;gap:0.15em;pointer-events:auto;flex-shrink:0;margin-bottom:0.12em;}
.civ-v-exit-bottom-row .civ-v-exit-map-btn{font-size:0.76em;padding:0.38em 0.9em 0.38em 0.72em;}
.civ-v-exit-bottom-row .civ-v-exit-foot-hint{font-size:0.58em;color:#8b97a8;text-align:center;white-space:nowrap;}
.civ-v-w3-bar-spacer{display:none;}
.civ-v-w3-chips-city{margin-left:0;flex:0 0 auto;width:fit-content;max-width:100%;min-width:0;}
.civ-v-w3-city-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0.12rem;
  flex-shrink:0;min-width:0;max-width:100%;width:fit-content;}
.civ-v-w3-city-badge{display:inline-flex;align-items:center;gap:0.55rem;padding:0.45rem 1.05rem 0.45rem 0.75rem;
  border-radius:24px;background:linear-gradient(180deg,#151b26,#0a0d14);border:1.5px solid #e8d88a;
  box-shadow:0 5px 16px rgba(0,0,0,0.6);flex-shrink:0;max-width:100%;}
.civ-v-w3-city-nav{display:inline-flex;align-items:center;justify-content:center;min-width:1.75em;min-height:1.75em;
  padding:0 0.22em;border:none;border-radius:7px;background:rgba(232,216,138,0.08);color:#e8d88a;
  font-size:1.15em;font-weight:700;line-height:1;cursor:pointer;opacity:0.92;font-family:inherit;
  flex-shrink:0;pointer-events:auto;}
.civ-v-w3-city-nav:hover:not(:disabled){opacity:1;color:#fff8e0;background:rgba(232,216,138,0.18);}
.civ-v-w3-city-nav:disabled{opacity:0.25;cursor:default;background:transparent;}
.civ-v-w3-city-name{font-family:var(--civ-font-title, Georgia, serif);font-size:1.35em;font-weight:700;
  color:#f0e6d0;letter-spacing:0.04em;text-transform:uppercase;line-height:1;}
.civ-v-w3-city-pop{width:1.65em;height:1.65em;border-radius:50%;background:#e8d88a;color:#2a2208;
  font-size:0.72em;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.civ-v-w3-capital-badge{font-size:0.68em;font-weight:700;color:#2a2208;background:#e8d88a;
  border-radius:10px;padding:0.2em 0.6em;white-space:nowrap;flex-shrink:0;letter-spacing:0.02em;}
.civ-v-w3-capital-btn{font-size:0.62em;font-family:inherit;font-weight:600;color:#e8d88a;
  background:transparent;border:1px solid #e8d88a;border-radius:10px;padding:0.22em 0.6em;
  white-space:nowrap;flex-shrink:0;cursor:pointer;opacity:0.9;}
.civ-v-w3-capital-btn:hover:not(:disabled){opacity:1;background:rgba(232,216,138,0.14);}
.civ-v-w3-capital-btn:disabled{opacity:0.35;cursor:not-allowed;}
.civ-v-w3-chips{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0.35rem 0.55rem;
  padding:0.3rem 0.85rem;border-radius:12px;
  background:linear-gradient(180deg,rgba(22,28,40,0.94),rgba(8,10,16,0.95));border:1px solid rgba(232,216,138,0.32);
  flex:1 1 auto;width:100%;max-width:100%;min-width:0;overflow-x:visible;overflow-y:visible;}
.civ-v-w3-chips-stacked{flex-direction:column;align-items:stretch;flex-wrap:nowrap;gap:0.22rem;
  padding:0.34rem 0.9rem 0.38rem;}
.civ-v-w3-chips-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:0.7rem;
  align-items:center;justify-items:center;width:100%;}
.civ-v-w3-chips-row + .civ-v-w3-chips-row{padding-top:0.24rem;border-top:1px solid rgba(232,216,138,0.18);}
.civ-v-w3-chips-stacked .civ-v-w3-chip{justify-content:center;width:100%;max-width:100%;min-width:0;
  flex-wrap:wrap;row-gap:0.08rem;}
.civ-v-w3-chips-stacked.civ-v-w3-chips-city{width:100%;}
.civ-v-w3-chip{display:inline-flex;align-items:center;gap:0.48rem;white-space:nowrap;flex-shrink:0;
  font-size:1.56em;line-height:1.2;border:none;background:transparent;padding:0.14em 0.2em;margin:0;
  cursor:pointer;border-radius:4px;font-family:inherit;color:inherit;}
.civ-v-w3-chip:hover{background:rgba(212,175,90,0.1);}
.civ-v-w3-chip:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-w3-chip{--civ-res-self:var(--civ-gold-primary);}
.civ-v-w3-chip-icon{display:flex;align-items:center;justify-content:center;color:var(--civ-res-self);font-size:1.15em;line-height:1;}
/* Ikona chipa jest wstrzykiwana jako brandowy <svg class="civ-cs-chip-ic"> ze stroke
   przepisanym na currentColor — a reguła .civ-cs .civ-cs-chip-ic{color:var(--gold)}
   o swoistości (0,2,0) BIJE dziedziczenie z .civ-v-w3-chip-icon (0,1,0). Bez reguły niżej
   ikona surowca w panelu miasta maluje się kolorem --gold scope'u, a nie paletą: dziś obie
   wartości są równe #e8d88a, więc rozjazdu nie widać gołym okiem, ale MUTACJA PALETY NIE
   RUSZA IKONY (złapane w rundzie 1 — zrzut mutacji panelu miasta wyszedł bajtowo identyczny
   ze zrzutem PO). Trzy klasy = (0,3,0), więc wygrywa niezależnie od kolejności w arkuszu.
   Pilnuje tego asercja A5f w tools/kolor-surowce-spojnosc-test.cjs. */
.civ-v-w3-chip .civ-v-w3-chip-icon .civ-cs-chip-ic{color:var(--civ-res-self);}
.civ-v-w3-chip-icon .civ-v-loaf-ic{width:1.2em;height:1.3em;}
.civ-v-w3-sci-med{display:inline-flex;align-items:center;justify-content:center;
  width:1.35em;height:1.35em;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%,#8fb6e0,#3a5f8a);border:1px solid #26456a;}
.civ-v-w3-sci-med .civ-science-owl-ic{width:0.82em;height:0.82em;color:#0a1628;}
.civ-v-w3-chip-icon .civ-science-owl-ic{width:1.05em;height:1.05em;color:#0a1628;}
.civ-v-w3-chip-lbl{font-size:0.95em;color:#a8a090;font-weight:600;}
.civ-v-w3-chip-val{font-size:1.08em;font-weight:700;color:var(--civ-res-self);}
.civ-v-w3-chip-val.green{color:var(--green);}
.civ-v-w3-chip-val.red{color:var(--red);}
/* R-HUD-MIASTO-STAN-CYWILIZACJI: wkład TEGO miasta — mała liczba obok dużej sumy
   cywilizacji (.civ-v-w3-chip-val), ta sama konwencja co .civ-v-res-delta niżej. */
.civ-v-w3-chip-delta{font-size:0.62em;font-weight:700;margin-left:0.18em;line-height:1;}
.civ-v-w3-chip-delta.green{color:var(--green);}
.civ-v-w3-chip-delta.red{color:var(--red);}
/* R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY: trzeci element — realny ZAPAS całej
   cywilizacji, w nawiasie, ZŁOTY (odrębny kolor od tempa), pod małą liczbą. */
.civ-v-w3-chip-stock{font-size:0.62em;font-weight:700;margin-left:0.18em;line-height:1;color:var(--civ-res-self);}
.civ-v-w3-chip-sep{width:1px;height:1.45em;background:rgba(232,216,138,0.2);flex-shrink:0;}
.civ-v-w3-top-actions{display:flex;align-items:center;gap:0.75rem;flex-shrink:0;margin-left:0.35rem;}
.civ-v-exit-map-btn{display:inline-flex;align-items:center;gap:0.38em;padding:0.38em 0.85em 0.38em 0.65em;
  border-radius:10px;border:2px solid rgba(232,216,138,0.55);
  background:linear-gradient(180deg,#5a3018,#2a1408);color:#fff8e0;
  font-size:0.76em;font-weight:700;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;
  font-family:inherit;line-height:1;box-shadow:0 2px 10px rgba(0,0,0,0.45);}
.civ-v-exit-map-btn:hover{border-color:#e8d88a;background:linear-gradient(180deg,#7a4020,#3a1808);}
.civ-v-exit-map-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-exit-map-btn .civ-v-exit-ic{display:flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;}
.civ-v-resource-bar-w3 .civ-v-top-close{width:2.45em;height:2.45em;padding:0;border-radius:10px;
  border:1px solid rgba(232,216,138,0.35);background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8d88a;
  font-size:1.05em;display:flex;align-items:center;justify-content:center;line-height:1;}
.civ-v-res-city{font-size:0.85em;font-weight:700;color:#d4af5a;letter-spacing:0.07em;text-transform:uppercase;
  white-space:nowrap;align-self:center;padding-right:0;line-height:1;flex-shrink:0;}
.civ-v-res-head{display:flex;align-items:center;gap:0.55rem;justify-self:start;min-width:0;max-width:min(44vw,520px);}
.civ-v-garrison-inline{display:flex;align-items:center;justify-content:center;gap:0.42rem;min-width:0;overflow-x:auto;scrollbar-width:none;
  padding:0.1rem 0;-ms-overflow-style:none;width:auto;max-width:100%;text-align:center;align-self:center;}
.civ-v-garrison-inline::-webkit-scrollbar{display:none;}
.civ-v-garrison-label{display:inline-flex;align-items:center;gap:0.32em;font-size:0.94em;font-weight:700;color:#f0e6d0;
  letter-spacing:0.03em;flex-shrink:0;white-space:nowrap;cursor:pointer;border-radius:7px;padding:0.26em 0.52em;
  background:rgba(20,25,34,0.72);border:1px solid rgba(212,175,90,0.34);
  transition:color .15s,border-color .15s,background .15s,box-shadow .15s;}
.civ-v-garrison-label:hover,.civ-v-garrison-label:focus-visible{color:#f0e8b8;border-color:rgba(212,175,90,0.28);
  background:rgba(212,175,90,0.08);outline:none;}
.civ-v-garrison-label.is-pinned{color:#fff8df;border-color:#e0b24a;background:rgba(94,64,22,0.38);
  box-shadow:0 0 0 1px rgba(224,178,74,0.16),0 2px 8px rgba(0,0,0,0.35);}
.civ-v-garrison-icon{font-size:1.62em;line-height:1;display:flex;align-items:center;flex-shrink:0;opacity:1;}
.civ-v-garrison-count{font-size:0.96em;font-weight:800;color:#f0c968;min-width:1.35em;padding:0.08em 0.28em;
  border-radius:999px;background:rgba(212,175,90,0.16);text-align:center;}
.civ-v-garrison-detail-close{margin-left:auto;flex:0 0 auto;pointer-events:auto;cursor:pointer;width:1.5em;height:1.5em;
  padding:0;border:1px solid rgba(212,175,90,0.35);border-radius:3px;background:rgba(212,175,90,0.08);
  color:#e8d88a;font:inherit;font-size:0.9em;line-height:1;}
.civ-v-garrison-detail-close:hover,.civ-v-garrison-detail-close:focus-visible{background:rgba(212,175,90,0.24);
  color:#fff8df;outline:2px solid rgba(232,216,138,0.55);outline-offset:1px;}
.civ-v-garrison-chip{display:inline-flex;align-items:center;gap:0.3em;padding:0.22em 0.52em;border-radius:3px;
  background:rgba(20,28,40,0.88);border:1px solid rgba(212,175,90,0.28);font-size:0.72em;line-height:1.15;flex-shrink:0;}
.civ-v-garrison-detail-list{display:flex;flex-direction:column;gap:0.35em;max-height:min(50vh,320px);overflow-y:auto;
  padding:0.15em 0.05em 0.05em;scrollbar-width:thin;}
.civ-v-garrison-detail-list .civ-v-garrison-chip{width:100%;font-size:0.78em;padding:0.35em 0.55em;}
.civ-v-garrison-detail-list .civ-v-garrison-chip .gn{max-width:none;flex:1;}
.civ-v-garrison-chip .gi{font-size:1.15em;line-height:1;}
.civ-v-garrison-chip .gn{font-weight:600;color:var(--text);max-width:7em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-v-garrison-chip .hpb{width:2em;height:0.4em;background:#0a0e14;border-radius:2px;overflow:hidden;border:1px solid rgba(0,0,0,0.35);flex-shrink:0;}
.civ-v-garrison-chip .hpf{height:100%;background:linear-gradient(90deg,#2a6a2a,#6bbf59);}
.civ-v-garrison-chip .hpf.hpl{background:linear-gradient(90deg,#6a1818,#d36b5e);}
.civ-v-garrison-chip.in-garnizon{border-color:rgba(224,178,74,0.55);}
.civ-v-garrison-leave-btn{flex-shrink:0;cursor:pointer;border:1px solid rgba(212,175,90,0.4);
  background:rgba(212,175,90,0.12);color:#e0b24a;font-size:0.85em;line-height:1;border-radius:3px;
  padding:0.05em 0.32em;margin-left:0.1em;pointer-events:auto;}
.civ-v-garrison-leave-btn:hover:not(:disabled){background:rgba(212,175,90,0.28);color:#f0d290;}
.civ-v-garrison-leave-btn:disabled{opacity:0.35;cursor:not-allowed;border-color:rgba(212,175,90,0.2);}
.civ-v-garrison-leave-all-btn{pointer-events:auto;}
.civ-v-garrison-leave-all-btn{display:block;width:100%;margin-top:0.5rem;cursor:pointer;
  border:1px solid rgba(212,175,90,0.45);background:rgba(212,175,90,0.14);color:#e0b24a;
  font-size:0.78em;padding:0.35em 0.6em;border-radius:4px;text-align:center;}
.civ-v-garrison-leave-all-btn:hover{background:rgba(212,175,90,0.28);color:#f0d290;}
.civ-v-garrison-empty{display:none;}
.civ-v-res-scroll{display:flex;align-items:center;justify-content:center;gap:1.15rem;
  justify-self:center;align-self:center;max-width:min(100%,96vw);
  overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;
  padding:0 0.25rem;}
.civ-v-res-scroll::-webkit-scrollbar{display:none;}
.civ-v-res-item{display:inline-flex;align-items:center;gap:0.22em;font-size:1.68em;white-space:nowrap;line-height:1;}
.civ-v-res-item.civ-v-res-interactive{cursor:pointer;border-radius:4px;padding:0.1em 0.28em;margin:-0.1em -0.12em;
  border:1px solid transparent;transition:background .12s ease,border-color .12s ease,box-shadow .12s ease;}
.civ-v-res-item.civ-v-res-interactive:hover{background:rgba(212,175,90,0.14);border-color:rgba(212,175,90,0.38);
  box-shadow:0 0 0 1px rgba(212,175,90,0.08);}
.civ-v-res-item.civ-v-res-interactive:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-res-icon{opacity:0.95;font-size:1.05em;line-height:1;display:flex;align-items:center;}
.civ-v-res-icon .civ-v-loaf-ic{width:0.76em;height:0.84em;}
.civ-v-res-icon .civ-science-owl-ic{width:0.76em;height:0.76em;color:#0a1628;}
.civ-v-loaf-chip{width:0.62em;height:0.68em;display:inline-flex;vertical-align:-0.1em;}
.food-grow-loaf .civ-v-loaf-ic{width:0.58em;height:0.64em;display:inline-flex;}
.civ-v-loaf-ic svg{width:100%;height:100%;display:block;}
.civ-v-res-val{font-weight:700;font-size:1em;line-height:1;display:flex;align-items:center;}
.civ-v-res-delta{font-size:0.62em;font-weight:700;margin-left:0.14em;line-height:1;display:flex;align-items:center;}
.civ-v-res-delta.green{color:var(--green);}
.civ-v-res-delta.red{color:var(--red);}
.civ-v-res-delta.gold{color:var(--gold);}
.civ-v-res-delta.blue{color:var(--blue);}
.civ-v-res-sep{width:1px;height:1.35em;align-self:center;background:rgba(255,255,255,0.12);flex-shrink:0;}
.civ-v-resource-bar>.civ-v-top-close{justify-self:end;align-self:center;font-size:1.15em;padding:0.2em 0.65em;line-height:1;}
.civ-v-bld-btns{display:flex;gap:0.22em;margin-left:auto;flex-shrink:0;}
.civ-cs .list-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * ${LIST_ROW_HEIGHT_EM}em);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;
  padding-right:0.12em;margin-bottom:0.15em;}
.civ-cs .list-scroll::-webkit-scrollbar{width:5px;}
.civ-cs .list-scroll::-webkit-scrollbar-thumb{background:var(--bord2);border-radius:3px;}
.civ-cs .mini-thumb{width:2.15em;height:2.15em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);
  display:flex;align-items:center;justify-content:center;font-size:1.1em;flex-shrink:0;line-height:1;color:var(--gold);}
.civ-cs .mini-thumb svg,.civ-cs .picon svg,.civ-cs .bi svg{width:1.35em;height:1.35em;display:block;}
.civ-cs .obelisk-ic{font-size:0;position:relative;display:inline-flex;align-items:flex-end;justify-content:center;}
.civ-cs .obelisk-ic::before{content:'';position:absolute;left:50%;bottom:0.22em;transform:translateX(-50%);
  width:0.38em;height:1.48em;background:linear-gradient(90deg,#8f6b2e 0%,#c9a04a 42%,#edd98a 50%,#c9a04a 58%,#8f6b2e 100%);
  clip-path:polygon(50% 0%,72% 11%,66% 100%,34% 100%,28% 11%);box-shadow:inset -1px 0 0 rgba(0,0,0,0.12);}
.civ-cs .obelisk-ic::after{content:'';position:absolute;left:50%;bottom:0.12em;transform:translateX(-50%);
  width:0.78em;height:0.11em;background:linear-gradient(180deg,#7a5c32,#5c4524);border-radius:1px;}
.civ-cs .mini-thumb.obelisk-ic,.civ-cs .picon.obelisk-ic{align-items:center;justify-content:center;}
.civ-cs .bi.obelisk-ic{width:1.3em;height:1.15em;vertical-align:middle;}
.civ-cs .qitem .obelisk-ic{width:1.05em;height:1.05em;flex-shrink:0;}
.civ-cs .planks-ic{font-size:0;position:relative;display:inline-flex;align-items:center;justify-content:center;}
.civ-cs .planks-ic::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:1.02em;height:1.38em;border-radius:1px;
  background:
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0/100% 0.27em no-repeat,
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0.38em/100% 0.27em no-repeat,
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0.76em/100% 0.27em no-repeat;
  box-shadow:inset 0 0.31em 0 -0.27em rgba(0,0,0,0.14),inset 0 0.62em 0 -0.54em rgba(0,0,0,0.11);}
.civ-cs .mini-thumb.planks-ic,.civ-cs .picon.planks-ic{align-items:center;justify-content:center;}
.civ-cs .bi.planks-ic{width:1.3em;height:1.15em;vertical-align:middle;}
.civ-cs .qitem .planks-ic{width:1.05em;height:1.05em;flex-shrink:0;}
.civ-cs .mini-thumb.building-thumb-hover{cursor:help;}
.civ-cs .unit-mini-preview{width:2.85em;height:2.85em;border:2px solid var(--gold);border-radius:4px;background:#87ceeb;
  overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;}
.civ-cs .unit-mini-canvas{width:100%;height:100%;display:block;object-fit:cover;}
.civ-cs .unit-mini-loading,.civ-cs .unit-mini-fallback{color:var(--muted);font-size:0.85em;}
.civ-detail-scope{
  --bg:#141820;--panel:#1e2430;--panel2:#171c24;--border:#2e3848;--bord2:#3d4a5c;
  --text:#e8ebf0;--muted:#8b97a8;--gold:#e0b24a;--green:#6bbf59;--red:#d36b5e;--blue:#5a9bd4;--happy:#f6c942;
  color:var(--text);font-family:'Segoe UI',Tahoma,Verdana,sans-serif;line-height:1.38;}
.civ-detail-scope .detail-card{margin:0;padding:0.38em 0.48em;background:rgba(0,0,0,0.28);
  border:1px solid var(--bord2);border-left:3px solid var(--gold);border-radius:4px;font-size:0.78em;line-height:1.38;}
.civ-detail-scope .detail-card .dc-h{font-weight:700;color:var(--gold);margin-bottom:0.22em;display:flex;align-items:center;gap:0.35em;}
.civ-detail-scope .detail-card .dc-h .mini-thumb{width:1.85em;height:1.85em;font-size:0.95em;border-width:1px;
  width:2.15em;height:2.15em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;}
.civ-detail-scope .detail-card .dc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12em 0.5em;margin-top:0.15em;}
.civ-detail-scope .detail-card .dc-l{color:var(--muted);}
.civ-detail-scope .detail-card .dc-v{word-break:break-word;}
/* P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1 (kopia 1/3 .dc-v-btn) — ten sam trzeci,
   najlzejszy szczebel skali przyciskow co linki krzyzowe w ENTITY_CARD_CSS: 1px zlota
   obwodka + ciemne tlo, bez podkreslenia. KOTWICA MUTACJI. */
.civ-detail-scope .detail-card .dc-v-btn{-webkit-appearance:none;appearance:none;
  display:inline-block;justify-self:start;padding:0.1em 0.5em;margin:0;font:inherit;color:var(--gold);
  text-align:left;cursor:pointer;text-decoration:none;
  border:1px solid rgba(224,178,74,0.45);border-radius:5px;
  background:linear-gradient(180deg,#1b212c,#0e1219);
  box-shadow:inset 0 1px 0 rgba(224,178,74,0.10);}
.civ-detail-scope .detail-card .dc-v-btn:hover{color:#f4e6a8;border-color:var(--gold);}
.civ-detail-scope .detail-card .dc-section{font-size:0.68em;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;
  color:#d4af5a;margin:0.55em 0 0.2em;padding-bottom:0.12em;border-bottom:1px solid rgba(212,175,90,0.18);}
.civ-detail-scope .detail-card .dc-section:first-of-type{margin-top:0.15em;}
.civ-detail-scope .detail-card.bld-detail-card{padding:0.32em 0.38em;}
.civ-detail-scope .detail-card.bld-detail-card .dc-h{margin-bottom:0.3em;padding-bottom:0.24em;border-bottom:1px solid rgba(212,175,90,0.24);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile{margin-top:0.28em;padding:0.34em 0.42em 0.38em;
  background:rgba(0,0,0,0.24);border:1px solid rgba(212,175,90,0.18);border-radius:5px;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.04);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile:first-of-type{margin-top:0.12em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile + .bld-detail-tile{margin-top:0.32em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-hd{font-size:0.64em;font-weight:700;text-transform:uppercase;
  letter-spacing:0.08em;color:#d4af5a;margin:0 0 0.2em;padding-bottom:0.14em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .dc-grid{margin-top:0.06em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .dc-note{margin-top:0.14em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-chips{margin-top:0.08em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow{margin-top:0.18em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow:first-child{margin-top:0;}
.civ-detail-scope .detail-card .dc-note{margin-top:0.35em;color:var(--muted);font-size:0.88em;font-style:italic;line-height:1.35;}
.civ-detail-scope .detail-card .dc-algo-step{font-size:0.76em;line-height:1.42;color:var(--muted);margin:0.1em 0 0.26em;padding-left:0.12em;}
.civ-detail-scope .detail-card .dc-formula{font-size:0.82em;color:var(--gold);font-family:Consolas,'Courier New',monospace;margin:0.18em 0 0.32em;padding:0.22em 0.38em;
  background:rgba(0,0,0,0.25);border-radius:3px;border-left:2px solid rgba(212,175,90,0.35);}
.civ-hover-detail-dock .civ-detail-scope .detail-card{box-shadow:none;}
.civ-hover-detail-float{display:none;position:fixed;z-index:100000;max-width:min(400px,92vw);pointer-events:none;
  padding:0.38em 0.48em;background:rgba(8,12,20,0.96);border:1px solid #e0b24a;border-radius:4px;
  box-shadow:0 6px 20px rgba(0,0,0,0.65);font-size:0.74em;line-height:1.38;}
.civ-hover-detail-float .civ-detail-scope{pointer-events:auto;}
.civ-hover-detail-float .civ-detail-scope .detail-card{border:none;background:transparent;padding:0;}
.civ-cs .mini-thumb.hover-detail-anchor,.civ-cs .unit-mini-preview.hover-detail-anchor,.civ-cs .item-row.hover-detail-anchor,.civ-cs .growth-progress-block.hover-detail-anchor,.civ-cs .wealth-compact-wrap.hover-detail-anchor{cursor:help;}
.civ-cs .item-row{display:flex;align-items:center;gap:0.32em;background:var(--panel2);border:1px solid var(--border);
  border-radius:3px;padding:0.18em 0.38em;margin-bottom:0.16em;position:relative;}
.civ-cs .item-row.is-catalog-ready{border-color:rgba(107,191,89,0.35);}
.civ-cs .item-row.is-catalog-locked,.civ-cs .item-row.is-catalog-built,.civ-cs .item-row.is-catalog-queued{
  opacity:0.52;filter:grayscale(0.75);}
.civ-cs .item-row.is-catalog-locked .mini-thumb,.civ-cs .item-row.is-catalog-built .mini-thumb{opacity:0.7;}
.civ-cs .bld-catalog-lock{font-size:0.68em;color:#d36b5e;line-height:1.35;margin-top:0.12em;}
.civ-cs .bld-catalog-ready-tag{font-size:0.66em;color:var(--green);font-weight:600;}
.civ-cs .bld-catalog-meta{font-size:0.68em;color:var(--muted);line-height:1.3;}
.civ-cs .bld-catalog-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * 3.4em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .bld-catalog-scroll::-webkit-scrollbar{width:5px;}
.civ-cs .bld-catalog-scroll::-webkit-scrollbar-thumb{background:var(--bord2);border-radius:3px;}
.civ-cs .bld-infocard-wrap{margin-bottom:0.55em;}
.civ-cs .bld-infocard{border:2px solid rgba(232,216,138,.4);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,rgba(20,26,34,.98),rgba(8,10,16,.98));box-shadow:0 8px 24px rgba(0,0,0,.35);}
.civ-cs .bld-infocard.is-catalog-locked{opacity:.78;}
.civ-cs .bld-infocard-hd{padding:0.72em 0.85em;display:flex;align-items:center;gap:0.65em;border-bottom:1px solid rgba(232,216,138,.16);}
.civ-cs .bld-infocard-ic{width:2.4em;height:2.4em;flex:none;border-radius:9px;border:1px solid #a08030;background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.civ-cs .bld-infocard-ic .mini-thumb{width:100%;height:100%;border:none;background:transparent;}
.civ-cs .bld-infocard-title{font-family:Georgia,serif;font-size:1.05em;color:#e8e0c8;line-height:1.15;font-weight:600;}
.civ-cs .bld-infocard-cat{display:inline-flex;margin-top:0.28em;font-size:0.58em;letter-spacing:.1em;text-transform:uppercase;color:#0f1218;background:#c8b070;padding:0.18em 0.45em;border-radius:5px;}
.civ-cs .bld-infocard-bd{padding:0.62em 0.85em 0.72em;display:flex;flex-direction:column;gap:0.45em;}
.civ-cs .bld-infocard-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;color:#c8b898;border:1px solid rgba(232,216,138,.25);border-radius:20px;padding:0.22em 0.52em;}
.civ-cs .bld-infocard-chip.stock-missing{color:#e88a7a;border-color:rgba(232,110,90,.45);background:rgba(232,90,70,.08);}
.civ-cs .bld-req-chip,.civ-detail-scope .bld-req-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;border-radius:20px;padding:0.22em 0.52em;border:1px solid;line-height:1.25;}
.civ-cs .bld-req-chip.met,.civ-detail-scope .bld-req-chip.met{color:#6eb5ff;border-color:rgba(90,155,212,.55);background:rgba(90,155,212,.12);}
.civ-cs .bld-req-chip.unmet,.civ-detail-scope .bld-req-chip.unmet{color:#ff6b6b;border-color:rgba(232,110,90,.5);background:rgba(232,90,70,.1);}
.civ-cs .bld-req-chip .bld-req-tech-ic,.civ-detail-scope .bld-req-chip .bld-req-tech-ic{color:currentColor;opacity:0.92;}
.cp-tech-hint-link{border-radius:50%;transition:box-shadow .15s,opacity .15s;}
.cp-tech-hint-link:hover,.cp-tech-hint-link:focus-visible{box-shadow:0 0 0 2px rgba(232,216,138,.55);outline:none;}
.civ-cs .bld-infocard-chips,.civ-detail-scope .bld-infocard-chips{display:flex;flex-wrap:wrap;gap:0.35em;}
.civ-cs .bld-infocard-eyebrow,.civ-detail-scope .bld-infocard-eyebrow{font-size:0.54em;letter-spacing:.14em;text-transform:uppercase;color:#8a8478;margin-top:0.15em;}
.civ-cs .bld-infocard-eyebrow.req,.civ-detail-scope .bld-infocard-eyebrow.req{color:#c9a35a;}
.civ-cs .bld-infocard-req-access{font-size:0.68em;color:#c8b898;display:flex;align-items:center;gap:0.3em;}
/* SUROW-UI-B1/B2 (Maciej 2026-07-24): pasek surowców uproszczony (budowa/rekrutacja) — Total War-style. */
.civ-cs .civ-cs-res-strip{display:flex;flex-wrap:wrap;align-items:center;gap:0.65em;margin:0 0 0.55em;padding:0.35em 0;}
.civ-cs .civ-cs-res-chip{display:inline-flex;align-items:center;gap:0.4em;color:#e8e0c8;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;}
.civ-cs .civ-cs-res-chip-ic{display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex:none;color:#c8b070;}
.civ-cs .civ-cs-res-chip-ic svg{width:100%;height:100%;display:block;}
.civ-cs .civ-cs-res-chip>b{font-size:16px;line-height:32px;min-width:1.15em;}
.civ-cs .civ-cs-mil-strip{gap:0.6em;padding:0.35em 0.6em;border:1px solid rgba(232,216,138,.22);border-radius:8px;background:rgba(232,216,138,.05);}
.civ-cs .civ-cs-mil-era{font-size:0.62em;letter-spacing:.08em;text-transform:uppercase;color:#8a8070;}
.civ-cs .bld-infocard-upg{display:flex;align-items:center;gap:0.42em;padding:0.42em 0.52em;background:rgba(232,216,138,.07);border:1px solid rgba(232,216,138,.22);border-radius:9px;font-size:0.68em;color:#d8cca8;}
.civ-cs .bld-infocard-ft{display:flex;align-items:center;justify-content:space-between;padding-top:0.42em;border-top:1px solid rgba(232,216,138,.12);font-size:0.62em;color:#8a8478;}
.civ-cs .bld-infocard-era{display:inline-flex;align-items:center;gap:0.35em;letter-spacing:.06em;text-transform:uppercase;color:#b7a06a;}
.civ-cs .bld-infocard-era-dot{width:7px;height:7px;border-radius:50%;background:#c8b070;flex-shrink:0;}
.civ-cs .bld-infocard-actions{display:flex;align-items:center;justify-content:space-between;gap:0.35em;margin-top:0.12em;flex-wrap:wrap;}
.civ-cs .bld-infocard-cost{font-size:0.68em;color:var(--muted);}
.civ-cs .bld-infocard-lock{font-size:0.68em;color:#d36b5e;line-height:1.35;}
${UNIT_INFOGRAPHIC_CSS}
${UNIT_RECRUIT_CARD_CSS}
.civ-cs .item-wrap{margin-bottom:0.05em;}
.civ-cs .detail-card{margin:0.08em 0 0.22em 0.2em;padding:0.38em 0.48em;background:rgba(0,0,0,0.28);
  border:1px solid var(--bord2);border-left:3px solid var(--gold);border-radius:4px;font-size:0.74em;line-height:1.38;}
.civ-cs .detail-card .dc-h{font-weight:700;color:var(--gold);margin-bottom:0.22em;display:flex;align-items:center;gap:0.35em;}
.civ-cs .detail-card .dc-h .mini-thumb{width:1.85em;height:1.85em;font-size:0.95em;border-width:1px;}
.civ-cs .detail-card .dc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12em 0.5em;margin-top:0.15em;}
.civ-cs .detail-card .dc-l{color:var(--muted);}
/* P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1 (kopia 2/3 .dc-v-btn — TA KOPIA NIE BYLA
   WYMIENIONA W RECONIE DISPATCHU; ten sam selektor konczacy sie na ".detail-card .dc-v-btn",
   tylko inny korzen scope'u: ".civ-cs" zamiast ".civ-detail-scope". Pominiecie jej zostawiloby
   ten sam przycisk jako zloty podkreslony link w drugim miejscu montowania karty). */
.civ-cs .detail-card .dc-v-btn{-webkit-appearance:none;appearance:none;
  display:inline-block;justify-self:start;padding:0.1em 0.5em;margin:0;font:inherit;color:var(--gold);
  text-align:left;cursor:pointer;text-decoration:none;
  border:1px solid rgba(224,178,74,0.45);border-radius:5px;
  background:linear-gradient(180deg,#1b212c,#0e1219);
  box-shadow:inset 0 1px 0 rgba(224,178,74,0.10);}
.civ-cs .detail-card .dc-v-btn:hover{color:#f4e6a8;border-color:var(--gold);}
.civ-cs .detail-card .dc-note{margin-top:0.25em;color:var(--muted);font-size:0.92em;font-style:italic;}
.civ-cs .detail-card.bld-detail-card{padding:0.32em 0.38em;}
.civ-cs .detail-card.bld-detail-card .dc-h{margin-bottom:0.3em;padding-bottom:0.24em;border-bottom:1px solid rgba(212,175,90,0.24);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile{margin-top:0.28em;padding:0.34em 0.42em 0.38em;
  background:rgba(0,0,0,0.24);border:1px solid rgba(212,175,90,0.18);border-radius:5px;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.04);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile:first-of-type{margin-top:0.12em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile + .bld-detail-tile{margin-top:0.32em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-hd{font-size:0.64em;font-weight:700;text-transform:uppercase;
  letter-spacing:0.08em;color:#d4af5a;margin:0 0 0.2em;padding-bottom:0.14em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .dc-grid{margin-top:0.06em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .dc-note{margin-top:0.14em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-chips{margin-top:0.08em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow{margin-top:0.18em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow:first-child{margin-top:0;}
.civ-cs .recruit-queue-scroll{max-height:calc(${RECRUIT_QUEUE_VISIBLE} * ${QUEUE_ROW_EM}em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .build-queue-scroll{max-height:calc(${BUILD_QUEUE_VISIBLE} * ${QUEUE_ROW_EM}em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-v-top-strip .civ-v-tag{color:#8b97a8;letter-spacing:0.06em;text-transform:uppercase;}
.civ-v-top-close{background:linear-gradient(180deg,#5a3020,#3a1810);border:1px solid #a05040;
  color:#ffe8d0;font-size:0.85em;padding:0.15em 0.55em;border-radius:2px;cursor:pointer;font-weight:600;}
.civ-v-section-hd{font-size:0.7em;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
  color:#d4af5a;margin:0.5em 0 0.35em;padding-bottom:0.2em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-v-map-plaque{position:absolute;top:8%;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;}
.civ-v-map-plaque .name{font-size:1.5em;font-weight:700;color:#f0e6c8;text-shadow:0 2px 8px rgba(0,0,0,0.85);
  letter-spacing:0.12em;text-transform:uppercase;}
.civ-v-map-plaque .sub{font-size:0.72em;color:#a8b4c8;margin-top:0.2em;text-shadow:0 1px 4px #000;}
.civ-v-map-exit-float{display:none!important;}
.civ-v-map-bottom-stack{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:409;
  display:flex;flex-direction:column;align-items:stretch;gap:0.38em;
  min-width:min(440px,78vw);max-width:92vw;pointer-events:none;}
.civ-v-map-bottom-stack > *{pointer-events:auto;}
.civ-v-okolica-center{position:relative;left:auto;bottom:auto;top:auto;transform:none;
  display:flex;flex-direction:column;align-items:stretch;gap:0.32em;
  min-width:0;max-width:none;width:100%;padding:0.5rem 0.72rem 0.58rem;
  border-radius:12px;
  background:linear-gradient(180deg,rgba(16,22,34,0.97),rgba(6,8,14,0.96));
  border:2.5px solid rgba(232,216,138,0.82);
  box-shadow:0 0 0 1px rgba(212,175,90,0.45),0 0 22px rgba(232,216,138,0.12),0 10px 32px rgba(0,0,0,0.62);}
.civ-v-okolica-center .civ-v-okolica-head{margin:0;padding:0;border:none;
  font-size:0.82em;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#e8d88a;}
.civ-v-okolica-center .okolica-toolbar-map{margin:0;padding:0.32rem 0.4rem;
  border-radius:8px;border:1.5px solid rgba(232,216,138,0.55);
  background:rgba(4,8,16,0.72);justify-content:center;}
.civ-v-okolica-center .okolica-toolbar-profiles{justify-content:center;flex-wrap:wrap;gap:0.22em;}
.civ-v-okolica-center .okolica-toolbar-profiles button{
  font-size:0.72em;padding:0.18em 0.42em;border:1px solid rgba(232,216,138,0.35);
  border-radius:6px;background:rgba(12,18,28,0.9);color:#c8d0dc;}
.civ-v-okolica-center .okolica-toolbar-profiles button.okolica-profile-btn{gap:0.32em;padding:0.2em 0.48em;}
.civ-v-okolica-center .okolica-toolbar-profiles .okolica-profile-glyph{width:1.25em;height:1.25em;}
.civ-v-okolica-center .okolica-toolbar-profiles button.on{
  border-color:#e8d88a;color:#fff4c8;background:linear-gradient(180deg,#3a3018,#1a1408);
  box-shadow:0 0 0 1px rgba(232,216,138,0.55),inset 0 0 10px rgba(232,216,138,0.12);}
.civ-v-okolica-center .okolica-toolbar-profiles button.reczny.on{
  border-color:#7ad0a0;color:#dff5e8;background:linear-gradient(180deg,#1a3028,#0c1810);
  box-shadow:0 0 0 1px rgba(122,208,160,0.45),inset 0 0 8px rgba(122,208,160,0.1);}
.civ-v-okolica-center .civ-v-okmode-map{display:none;}
.civ-v-map-actions{position:relative;left:auto;bottom:auto;top:auto;transform:none;
  display:flex;flex-direction:column;align-items:center;gap:0.28em;pointer-events:auto;}
.civ-v-map-actions .civ-v-map-btn{pointer-events:auto;}
.civ-v-map-btn{background:linear-gradient(180deg,#1a3a5a,#0f2840);border:2px solid #5a9fd4;border-radius:8px;
  color:#e8f4ff;font-size:0.88em;font-weight:700;padding:0.55em 1.25em;cursor:pointer;
  box-shadow:0 4px 16px rgba(0,0,0,0.55);font-family:inherit;display:inline-flex;align-items:center;gap:0.4em;}
.civ-v-map-btn.primary{border-color:#e8d88a;color:#fff8e0;background:linear-gradient(180deg,#6a4020,#3a2010);
  font-size:0.92em;padding:0.6em 1.35em;letter-spacing:0.05em;text-transform:uppercase;}
.civ-v-map-hint{font-size:0.62em;color:#8b97a8;pointer-events:none;text-align:center;white-space:nowrap;}
.civ-v-exit-foot{display:flex;flex-direction:column;align-items:stretch;gap:0.32em;margin-bottom:0.45em;
  padding-bottom:0.42em;border-bottom:1px solid rgba(212,175,90,0.22);}
.civ-v-exit-foot-btn{width:100%;justify-content:center;padding:0.55em 1em;font-size:0.82em;}
.civ-v-exit-foot-hint{font-size:0.68em;text-align:center;color:var(--muted);}
.civ-ux-top-bar{display:flex;align-items:center;gap:0.65rem;padding:0.35rem 0.55rem;background:linear-gradient(180deg,#222838,#1a2030);border-bottom:1px solid var(--border);}
.civ-ux-top-city{font-weight:700;color:var(--gold);font-size:0.95em;white-space:nowrap;}
.civ-ux-top-table{border-collapse:collapse;flex:1;font-size:0.78em;}
.civ-ux-top-table td{padding:0.12rem 0.55rem;border-right:1px solid var(--border);vertical-align:middle;}
.civ-ux-top-table td:last-child{border-right:none;}
.civ-ux-tl{display:block;font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.civ-ux-tv{font-weight:700;font-size:1.05em;}
.civ-ux-top-close{background:linear-gradient(180deg,#c0402f,#8a2418);border:1px solid #d05040;color:#fff;font-weight:700;border-radius:4px;padding:0.15rem 0.55rem;cursor:pointer;font-size:0.95em;}
.civ-ux-mount .panel{margin-bottom:0.38em;}
.civ-ux-panel-scope.civ-cs > .panel{margin-bottom:0;padding:0.32em 0.45em;
  border-color:rgba(212,175,90,0.2);box-shadow:0 1px 0 rgba(0,0,0,0.2);}
.civ-ux-panel-scope.civ-cs > .civ-v-section-hd{
  margin:0.65em 0 0.05em;padding:0.38em 0 0.22em;
  border-bottom:1px solid rgba(212,175,90,0.32);flex-shrink:0;}
.civ-ux-panel-scope.civ-cs > .civ-v-section-hd:first-child{margin-top:0;}
.civ-ux-panel-scope.civ-cs > .civ-v-card{margin-bottom:0;padding:0.38em 0.48em;}
.civ-ux-panel-scope.civ-cs .ptitle{margin-bottom:0.22em;padding-bottom:0.14em;}
.civ-ux-panel-scope.civ-cs .food-grow-block{margin:0.15em 0 0.22em;}
.civ-ux-panel-scope.civ-cs .okolica-toolbar{margin:0.12em 0 0.18em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar{flex-wrap:nowrap;overflow-x:auto;overflow-y:visible;align-items:center;gap:0;margin:0.06em 0 0.18em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles{
  display:flex;flex-wrap:nowrap;flex:1 1 auto;width:100%;min-width:0;gap:0.12em;justify-content:flex-start;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button{
  font-size:0.66em;padding:0;width:auto;min-width:0;flex:0 0 auto;box-sizing:border-box;justify-content:center;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button.okolica-profile-btn-ic-only{
  padding:0.18em;border-radius:4px;line-height:0;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-profile-btn-ic-only .okolica-profile-glyph{width:1.35em;height:1.35em;}
.civ-ux-panel-scope.civ-cs .budowa-lista-bar{margin:0.12em 0 0.22em;padding:0.18em 0.28em;border:1px solid rgba(120,90,40,0.35);border-radius:4px;background:rgba(20,16,10,0.35);}
.civ-ux-panel-scope.civ-cs .budowa-lista-row{display:flex;align-items:center;gap:0.28em;font-size:0.72em;margin:0.1em 0;}
.civ-ux-panel-scope.civ-cs .budowa-lista-row .budowa-lista-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-ux-panel-scope.civ-cs .budowa-lista-slots{display:flex;gap:0.35em;flex-wrap:wrap;margin-top:0.15em;font-size:0.65em;}
.civ-ux-panel-scope.civ-cs .budowa-lista-slots button{padding:0.1em 0.35em;cursor:pointer;}
.civ-v-left-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;gap:0;}
.civ-v-right-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;height:100%!important;gap:0;}
.civ-v-right-head{flex:0 0 auto;padding-bottom:0.38em;margin-bottom:0.28em;border-bottom:1px solid rgba(212,175,90,0.28);}
.civ-v-left-main{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-top:0;margin-top:0;}
.civ-v-left-main::-webkit-scrollbar{width:5px;}
.civ-v-left-main::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-v-left-main.civ-v-left-main-split{overflow:hidden;display:flex;flex-direction:column;padding-top:0;}
.civ-v-right-main{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:0.06em;padding-top:0.12em;padding-bottom:0.85em;}
.civ-v-right-main::-webkit-scrollbar{width:5px;}
.civ-v-right-main::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-v-right-main > .panel:last-child{margin-bottom:0;}
.civ-v-right-foot{flex:0 0 auto;margin-top:auto;margin-left:-0.36rem;margin-right:-0.36rem;margin-bottom:-0.42rem;
  padding:0.58em 0.36rem 0.5rem;border-top:2px solid rgba(212,175,90,0.58);
  background:linear-gradient(180deg,rgba(5,8,14,0.99) 0%,rgba(2,4,8,1) 100%);
  position:relative;z-index:0;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.18);}
.civ-v-right-foot .panel{background:transparent!important;border:none!important;padding:0!important;box-shadow:none!important;}
.civ-w4-surowce-foot{padding:0.62em 0.72em;border:1px solid rgba(212,175,90,0.34);border-radius:10px;
  background:rgba(9,13,22,0.96);box-shadow:0 2px 10px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05);}
.okolica-surowce-strip{margin:0.28em 0 0.42em;padding:0.38em 0.48em;border:1px solid rgba(212,175,90,0.22);
  border-radius:8px;background:rgba(20,18,14,0.45);}
.okolica-surowce-strip .civ-w4-surowce-hd{margin-bottom:0.28em;}
.okolica-surowce-strip .civ-w4-surowce-title{font-size:0.58em;}
.okolica-surowce-strip .civ-w4-surowce-grid{gap:0.22em 0.35em;}
.civ-w4-surowce-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.42em;cursor:help;}
.civ-w4-surowce-title{font-size:0.62em;letter-spacing:0.16em;text-transform:uppercase;color:#a08030;font-weight:700;}
.civ-w4-surowce-detail{font-size:0.56em;letter-spacing:0.14em;text-transform:uppercase;color:#a08030;text-decoration:none;}
.civ-w4-surowce-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.32em;}
.civ-w4-surowce-item{display:inline-flex;align-items:center;gap:0.48em;font-size:0.74em;color:#c8b898;
  border:1px solid rgba(232,216,138,0.18);border-radius:8px;padding:0.48em 0.58em;line-height:1.2;}
.civ-w4-surowce-item.active{color:#e8d898;}
.civ-w4-surowce-item.potential{opacity:.46;color:#9a9078;}
.civ-w4-surowce-item.potential .civ-w4-res-ic{filter:grayscale(.65);}
.civ-w4-surowce-sub{font-size:0.58em;letter-spacing:0.12em;text-transform:uppercase;color:#7a7055;margin:0.38em 0 0.28em 2px;}
.civ-w4-res-ic{display:inline-flex;align-items:center;justify-content:center;width:1.12em;height:1.12em;color:#e8d88a;flex-shrink:0;line-height:0;}
.civ-w4-res-ic svg{width:100%;height:100%;display:block;}
.civ-v-icon-rail-mount{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;margin:0!important;width:100%;height:auto;}
.civ-v-icon-rail{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:2mm;margin:0 auto;padding:0;border:none;width:100%;height:auto;line-height:1;
  --civ-tab-icon:${CITY_PANEL_ICON_GLYPH_EM}em;}
.civ-v-icon-rail.civ-v-icon-rail-vert{flex-direction:column;justify-content:flex-start;align-items:center;gap:10px;height:auto;width:100%;padding:0;
  --civ-tab-icon:${CITY_PANEL_ICON_RAIL_VERT_EM}em;}
.civ-v-icon-rail-w3 .civ-v-icon-btn{width:46px;height:46px;min-width:46px;max-width:46px;padding:0;border-radius:50%;
  border:2px solid #a08030;background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);color:#e8d88a;
  box-shadow:none;transition:box-shadow .15s ease,border-color .15s ease,transform .12s ease;}
.civ-v-icon-rail-w3 .civ-v-icon-btn.on{border-color:#e8d88a;background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);
  color:#f4e6a8;box-shadow:0 0 14px rgba(232,216,138,0.3),inset 0 2px 4px rgba(232,216,138,0.12);}
.civ-v-icon-rail-w3 .civ-v-icon-btn:hover{transform:translateY(-1px);border-color:#e8d88a;
  box-shadow:0 0 12px rgba(232,216,138,0.22);}
.civ-v-icon-rail-w3 .civ-v-icon-glyph{width:22px;height:22px;font-size:22px;}
.civ-ux-left-icon-rail .civ-v-icon-rail-vert .civ-v-icon-glyph{font-size:26px;width:26px;height:26px;}
.civ-ux-right-icon-rail .civ-v-icon-rail-vert .civ-v-icon-glyph{font-size:26px;width:26px;height:26px;}
.civ-v-icon-btn{display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0.14em;
  border:2px solid var(--civ-gold-border, rgba(212,175,90,0.28));border-radius:var(--civ-radius-btn, 9px);
  background:rgba(8,10,18,0.35);color:var(--civ-gold-dim, #a08030);cursor:pointer;font-family:inherit;text-align:center;line-height:1;
  box-shadow:0 3px 14px rgba(0,0,0,0.38),0 1px 0 rgba(255,255,255,0.04) inset;
  transition:background .12s ease,border-color .12s ease,box-shadow .12s ease,transform .12s ease;}
.civ-v-icon-btn:hover{background:rgba(232,216,138,0.08);border-color:var(--civ-gold-border-strong, rgba(212,175,90,0.48));
  box-shadow:0 5px 18px rgba(0,0,0,0.48),0 0 10px rgba(232,216,138,0.12);transform:translateY(-1px);}
.civ-v-icon-btn.on{border-color:var(--civ-gold-primary, var(--gold));background:rgba(232,216,138,0.12);
  box-shadow:0 0 14px rgba(232,216,138,0.22),0 6px 20px rgba(0,0,0,0.45);transform:translateY(-1px);color:var(--civ-gold-primary, var(--gold));}
.civ-v-icon-glyph svg.civ-cp-rail-ic{width:100%;height:100%;color:currentColor;}
.civ-v-icon-btn.on .civ-cp-rail-ic{color:var(--civ-gold-primary, var(--gold));}
.civ-v-icon-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.civ-v-icon-glyph{font-size:var(--civ-tab-icon);width:1em;height:1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45));}
.civ-v-icon-glyph svg{width:100%;height:100%;display:block;}
.civ-v-icon-lbl{display:none;}
.civ-v-caduceus-ic{color:#5a9bd4;}
.civ-v-temple-ic{color:#e0b24a;}
.civ-v-loaf-ic{color:#c89452;display:inline-flex;align-items:center;justify-content:center;}
.civ-v-icon-glyph .civ-v-loaf-ic{width:0.8em;height:0.88em;}
.civ-v-right-main.civ-v-right-main-split{overflow:hidden;display:flex;flex-direction:column;padding-top:0;}
.civ-v-split-pane{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;gap:0;}
.civ-v-split-col{flex:1 1 50%;min-height:0;max-height:50%;display:flex;flex-direction:column;overflow:hidden;padding:0.12em 0;}
.civ-v-split-col + .civ-v-split-col{border-top:1px solid rgba(212,175,90,0.22);padding-top:0.28em;}
.civ-v-split-col > .panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-split-col .list-scroll-fill,
.civ-v-split-col .recruit-queue-scroll.list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;}
.civ-v-build-pane{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;gap:0;}
.civ-v-build-main{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-build-main > .panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-build-main .list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;}
.bld-owned-compact-mount .bld-owned-row--tight{padding:0.1em 0.22em;margin-bottom:0.06em;border-radius:4px;gap:0.12em 0.28em;min-height:1.35em;}
.bld-owned-compact-mount .bld-owned-hd{gap:0.18em;max-width:46%;}
.bld-owned-compact-mount .bld-owned-hd .bi{width:1em;height:1em;font-size:0.85em;}
.bld-owned-compact-mount .bld-owned-name{font-size:0.68em;max-width:7.5em;}
.bld-owned-compact-mount .bld-owned-tail{font-size:0.62em;gap:0.22em 0.28em;line-height:1.1;}
.bld-owned-compact-mount .bld-owned-conv-row{font-size:0.62em;gap:0.16em 0.28em;line-height:1.1;}
.bld-owned-compact-mount .bld-owned-chip{gap:0.06em;}
.bld-owned-compact-mount .bld-owned-sep{opacity:.4;font-size:0.9em;margin:0 0.06em;}
.bld-owned-compact-mount .bld-owned-row .bld-upg{font-size:0.62em;padding:0 0.2em;}
.bld-owned-bar{width:100%;display:flex;align-items:center;justify-content:space-between;gap:0.5em;padding:0.48em 0.58em;
  background:rgba(9,13,22,0.96);border:1px solid rgba(212,175,90,0.34);border-radius:8px;color:var(--gold);cursor:pointer;
  font-family:inherit;font-size:0.78em;letter-spacing:.03em;}
.bld-owned-bar:hover{border-color:rgba(232,216,138,0.55);background:rgba(14,18,28,0.98);}
.bld-owned-bar .bld-owned-chevron{opacity:.75;font-size:0.9em;}
.bld-owned-summary{display:flex;align-items:center;gap:0.35em;flex-wrap:wrap;font-size:0.72em;color:#a8a090;
  margin:0.12em 0 0.42em;padding:0.32em 0.42em;border-radius:6px;background:rgba(232,216,138,0.06);
  border:1px solid rgba(232,216,138,0.14);}
.bld-owned-summary b{color:#e8d070;font-weight:700;}
.bld-owned-row{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:0.22em 0.42em;padding:0.24em 0.36em;margin-bottom:0.12em;
  background:rgba(255,255,255,0.025);border:1px solid rgba(232,216,138,0.14);border-radius:6px;cursor:pointer;}
.bld-owned-row:hover{border-color:rgba(232,216,138,0.38);background:rgba(232,216,138,0.05);}
.bld-owned-hd{display:flex;align-items:center;gap:0.28em;min-width:0;flex:0 1 auto;max-width:55%;}
.bld-owned-hd .bi{flex:none;width:1.25em;height:1.25em;display:flex;align-items:center;justify-content:center;}
.bld-owned-name{flex:0 1 auto;min-width:0;max-width:9.5em;font-size:0.78em;font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bld-owned-name--inactive{color:#e07070;}
.bld-owned-lvl{flex:none;font-size:0.58em;font-weight:700;color:#2a2208;background:#c8b070;border-radius:4px;padding:0.08em 0.32em;line-height:1.2;}
.bld-owned-tail{display:flex;align-items:center;justify-content:flex-end;gap:0.35em 0.45em;flex:1 1 8em;min-width:0;margin-left:auto;flex-wrap:wrap;font-size:0.66em;line-height:1.25;}
.bld-owned-upkeep{flex:none;color:#e8a090;font-weight:600;white-space:nowrap;}
.bld-owned-upkeep.muted{color:#6a6458;font-weight:500;}
.bld-owned-bonus{display:inline-flex;flex-wrap:wrap;gap:0.18em 0.32em;min-width:0;justify-content:flex-end;}
/* P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE: druga linia -- bilans produkcji
   konwertera. N6 (werdykt runda 1): wejscia dostaja odcien ODROZNIALNY od
   .bld-owned-upkeep (#e8a090 lososiowy) -- cieply pomarancz, zeby "koszt
   utrzymania" i "koszt produkcji" nie wygladaly identycznie w dwoch
   sasiadujacych liniach; wyjscie zostaje zielone bez zmian. Prefiks "Prod.:"
   (.bld-owned-conv-label) jako dodatkowy sygnal semantyczny.
   flex-basis:100% wymusza zawijanie na wlasna linie w .bld-owned-row (flex-wrap). */
.bld-owned-conv-row{flex-basis:100%;display:flex;flex-wrap:wrap;align-items:center;gap:0.2em 0.4em;
  font-size:0.66em;line-height:1.25;margin-top:0.1em;}
.bld-owned-conv-label{flex:none;color:#a8a090;font-weight:700;margin-right:0.06em;}
.bld-owned-conv-in{color:#e0973c;font-weight:600;white-space:nowrap;}
.bld-owned-conv-out{color:var(--green);font-weight:600;white-space:nowrap;}
/* N2 (werdykt runda 1): budynek runtime-nieaktywny nie wykonuje konwersji --
   wyszarzenie analogiczne do .bld-owned-upkeep.muted, zeby gracz nie widzial
   pelnej linii produkcji jakby budynek dzialal. */
.bld-owned-conv-row--inactive .bld-owned-conv-in,
.bld-owned-conv-row--inactive .bld-owned-conv-out,
.bld-owned-conv-row--inactive .bld-owned-conv-label{color:#6a6458;font-weight:500;}
.bld-owned-chip{display:inline-flex;align-items:center;gap:0.12em;color:#c8d8b0;white-space:nowrap;}
.bld-owned-chip .civ-cs-chip-ic-wrap,.bld-owned-chip .civ-cs-inline-loaf{opacity:0.92;}
.bld-owned-row .bld-upg{margin-left:auto;flex:none;font-size:0.72em;padding:0.1em 0.32em;line-height:1;border-radius:4px;
  border:1px solid rgba(232,216,138,0.28);background:rgba(0,0,0,0.2);color:var(--gold);cursor:pointer;}
.bld-compact-row{display:flex;align-items:center;gap:0.45em;padding:0.2em 0.38em;margin-bottom:0.16em;
  background:var(--panel2);border:1px solid var(--border);border-radius:6px;min-height:calc(${LIST_ROW_HEIGHT_COMPACT}em - 0.35em);
  cursor:help;}
.bld-compact-row.is-locked{opacity:.72;cursor:help;}
.bld-compact-ic{width:1.65em;height:1.65em;flex:none;border-radius:6px;border:1px solid rgba(160,128,48,.35);
  background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.bld-compact-ic .mini-thumb{width:100%;height:100%;border:none;background:transparent;}
.bld-compact-name{flex:1;min-width:0;font-size:0.82em;font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bld-compact-actions{flex:0 0 auto;display:flex;gap:0.28em;margin-left:auto;flex-shrink:0;}
.bld-compact-actions .btn-sm{padding:0.18em 0.55em;font-size:0.72em;min-width:3.2em;}
.bld-compact-row.can-build-row{border-color:rgba(90,160,232,0.28);}
.bld-compact-row.cannot-build-row{border-color:rgba(80,96,112,0.32);}
.bld-detail-actions{display:flex;flex-wrap:wrap;gap:0.35em;margin-top:0.55em;padding-top:0.45em;border-top:1px solid rgba(232,216,138,.16);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-actions,
.civ-cs .detail-card.bld-detail-card .bld-detail-actions{margin-top:0.38em;padding:0.42em 0.42em 0.1em;border-top:1px solid rgba(212,175,90,0.22);}
`;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    // ZAŁOŻENIE P5.8-K02-Z2: równoważne `el('style')` z pin:863 (bez cls/html); helper `el` należy do K01.
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
  document.getElementById('civ-city-screen-css')?.remove();
}
