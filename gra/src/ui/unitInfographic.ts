/**
 * unitInfographic.ts — kanon ikon jednostek 1E (jednostki-infografiki-1E.html).
 * Poziom B: 18 kategorii · sylwetki SVG inline z mockupu Design.
 */
import type { UnitDef } from '../data/loader';
import { categoryOf } from '../units/setup';

/** Inner SVG markup per category (viewBox 0 0 24 24). */
const SVG_INNER: Record<string, string> = {
  lucznik:
    '<path d="M8 3C14 6 14 18 8 21"/><path d="M8 3v18"/><path d="M4 12h16"/><path d="M16 9l4 3-4 3"/>',
  procarz:
    '<path d="M5 4 11 13M19 4 13 13"/><path d="M10.4 13c.7 1.5 2.5 1.5 3.2 0"/><path d="M12 17.6a1.5 1.5 0 1 0 .01 0"/>',
  oszczepnik:
    '<path d="M4 20 18 6"/><path d="M18 6l-3.4.4M18 6l-.4 3.4"/><path d="M6.5 10.5 9 13"/>',
  wlocznik:
    '<path d="M6 14a4 4 0 1 0 8 0 4 4 0 1 0-8 0"/><path d="M17 3v18"/><path d="M17 3l-1.6 2.2M17 3l1.6 2.2"/>',
  falanga:
    '<path d="M5 20 9 4M10 20 14 4M15 20 19 4"/><path d="M4 20h16"/>'
    + '<path d="M9 4 8 5.6M9 4l1.3 1M14 4l-1 1.6M14 4l1.3 1M19 4l-1 1.6M19 4l1.3 1"/>',
  legionista:
    '<path d="M6 5.5A1.5 1.5 0 0 1 7.5 4h3A1.5 1.5 0 0 1 12 5.5v13A1.5 1.5 0 0 1 10.5 20h-3A1.5 1.5 0 0 1 6 18.5z"/>'
    + '<path d="M9 4v16M6 12h6"/><path d="M17 4v9M15 13h4M17 13v3"/>',
  miecznik:
    '<path d="M3.5 14a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0"/><path d="M16 3v13"/>'
    + '<path d="M13.5 7h5"/><path d="M16 16v4"/>',
  maczuga:
    '<path d="M3.5 20.5 10 14"/><circle cx="14" cy="10" r="4"/>'
    + '<path d="M14 4v2.2M14 13.8V16M20 10h-2.2M10.2 10H8M18.2 5.8l-1.55 1.55M11.35 12.65 9.8 14.2M18.2 14.2l-1.55-1.55M11.35 7.35 9.8 5.8"/>',
  topor:
    '<g transform="rotate(30 12 12)"><path d="M12 3V21"/>'
    + '<path d="M12 5.5 7 5Q4 8.5 7 12L12 11.5Z" fill="currentColor" fill-opacity="0.2"/>'
    + '<path d="M12 5.5 17 5Q20 8.5 17 12L12 11.5Z" fill="currentColor" fill-opacity="0.2"/></g>',
  konnica:
    '<g transform="rotate(180 12 12)"><path d="M8 4.5C5.4 6.2 4.3 9.2 4.3 12.2c0 3.7 3.1 6.6 7.7 6.6s7.7-2.9 7.7-6.6c0-3-1.1-6-3.7-7.7"/>'
    + '<path d="M8 4.5 9.3 6.7M16 4.5 14.7 6.7"/>'
    + '<path d="M6.7 10.2h.01M6.5 13.4h.01M17.3 10.2h.01M17.5 13.4h.01M9 16.4h.01M15 16.4h.01"/></g>',
  rydwan:
    '<path d="M4 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M7 15v-4h7l2 4"/>'
    + '<path d="M14 11 12 6"/><path d="M16 15l4-1"/><path d="M7 11 5 8"/>',
  obleznicza:
    '<path d="M4 17h12"/><path d="M6.5 17 5 8l11 3"/><path d="M16 11l4-2"/>'
    + '<path d="M7.5 20a1.8 1.8 0 1 0 .01 0M13.5 20a1.8 1.8 0 1 0 .01 0"/>',
  zwiadowca:
    '<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6"/><path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/>',
  osadnik:
    '<path d="M3 17h15"/><path d="M4.5 17v-4c0-2.8 2-4.2 5-4.2s5 1.4 5 4.2v4"/>'
    + '<path d="M5.5 20a1.5 1.5 0 1 0 .01 0M13 20a1.5 1.5 0 1 0 .01 0"/><path d="M9.5 8.8v4M6.5 11h6"/>',
  robotnik:
    '<path d="M4 20 12 12"/><path d="M6.5 8.5c3.4-2 7.6-1.4 10 1.6"/>'
    + '<path d="M6.5 8.5 8 12.5M16.5 10.1 12.5 9"/>',
  galera:
    '<path d="M3 15h18l-2 4.5H5z"/><path d="M12 15V5"/>'
    + '<path d="M12 7.2c3 0 5 1 6.2 3-3 .6-5.2-.4-6.2-2.2M12 7.2c-3 0-5 1-6.2 3 3 .6 5.2-.4 6.2-2.2"/>',
  super:
    '<path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5z"/>'
    + '<path d="M12 8.2l1.3 2.7 2.9.3-2.2 2 .6 2.9L12 16.6 9.4 18.1l.6-2.9-2.2-2 2.9-.3z"/>',
  domyslny:
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/>',
};

const COMBAT_CLASS: Record<string, { id: string; label: string }> = {
  konnica: { id: 'class-mounted', label: 'Konnica' },
  rydwan: { id: 'class-mounted', label: 'Konnica' },
  lucznik: { id: 'class-ranged', label: 'Dystansowe' },
  procarz: { id: 'class-ranged', label: 'Dystansowe' },
  oszczepnik: { id: 'class-ranged', label: 'Dystansowe' },
  obleznicza: { id: 'class-siege', label: 'Oblężenie' },
  super: { id: 'class-elite', label: 'Elita' },
  zwiadowca: { id: 'class-civil', label: 'Zwiad' },
  osadnik: { id: 'class-civil', label: 'Cywilna' },
  robotnik: { id: 'class-civil', label: 'Cywilna' },
  galera: { id: 'class-naval', label: 'Morska' },
};

const CATEGORY_LABEL: Record<string, string> = {
  lucznik: 'Łucznik',
  procarz: 'Procarz',
  oszczepnik: 'Oszczepnik',
  wlocznik: 'Włócznik',
  falanga: 'Falanga',
  legionista: 'Legionista',
  miecznik: 'Miecznik',
  maczuga: 'Maczuga',
  topor: 'Topór',
  konnica: 'Konnica',
  rydwan: 'Rydwan',
  obleznicza: 'Oblężnicza',
  zwiadowca: 'Zwiadowca',
  osadnik: 'Osadnik',
  robotnik: 'Robotnik',
  galera: 'Galera',
  super: 'Super',
  domyslny: 'Piechota',
};

export function unitInfographicCategory(u: UnitDef | undefined, id?: string): string {
  const isSuper = u?.['Super-jednostka'] === 'TAK';
  return categoryOf(u?.Jednostka ?? id ?? '', u?.['Rola (linia)'] ?? '', isSuper, u?.['Typ']);
}

export function unitInfographicLabel(cat: string): string {
  return CATEGORY_LABEL[cat] ?? cat;
}

export function unitCombatClassTag(u: UnitDef | undefined, id?: string): { id: string; label: string } {
  const cat = unitInfographicCategory(u, id);
  return COMBAT_CLASS[cat] ?? { id: 'class-melee', label: 'Piechota' };
}

/** SVG ikony jednostki @size (stroke currentColor). */
export function unitInfographicSvg(
  u: UnitDef | undefined,
  id?: string,
  size: number = 24,
): string {
  const cat = unitInfographicCategory(u, id);
  const inner = SVG_INNER[cat] ?? SVG_INNER.domyslny;
  if (!inner) return '';
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" `
    + `stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  );
}

/** Medalion okrągły (Poziom B · rekrutacja / hover). */
export function unitInfographicMedallionHtml(
  u: UnitDef | undefined,
  id?: string,
  size: number = 26,
): string {
  const svg = unitInfographicSvg(u, id, size);
  if (!svg) return '';
  return `<span class="unit-infographic-medallion" aria-hidden="true">${svg}</span>`;
}

export const UNIT_INFOGRAPHIC_CSS = `
.unit-infographic-medallion{display:inline-flex;align-items:center;justify-content:center;
  width:2.4em;height:2.4em;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);
  border:1.5px solid #a08030;color:var(--gold,#e8d88a);}
.unit-infographic-medallion svg{display:block;}
.civ-cs .unit-infocard-wrap{margin-bottom:0.55em;}
.civ-cs .unit-infocard{border:2px solid rgba(232,216,138,.4);border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,rgba(20,26,34,.98),rgba(8,10,16,.98));box-shadow:0 8px 24px rgba(0,0,0,.35);}
.civ-cs .unit-infocard-hd{padding:0.72em 0.85em;display:flex;align-items:center;gap:0.65em;
  border-bottom:1px solid rgba(232,216,138,.16);}
.civ-cs .unit-infocard-title{font-family:Georgia,serif;font-size:1.05em;color:#e8e0c8;line-height:1.15;font-weight:600;}
.civ-cs .unit-infocard-cat{display:inline-flex;margin-top:0.28em;font-size:0.58em;letter-spacing:.1em;
  text-transform:uppercase;color:#8a8070;border:1px solid rgba(232,216,138,.25);border-radius:5px;padding:0.18em 0.45em;}
.civ-cs .unit-infocard-bd{padding:0.62em 0.85em 0.72em;display:flex;flex-direction:column;gap:0.45em;}
.civ-cs .unit-infocard-chips{display:flex;flex-wrap:wrap;gap:0.35em;}
.civ-cs .unit-infocard-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;color:#c8b898;
  border:1px solid rgba(232,216,138,.25);border-radius:20px;padding:0.22em 0.52em;}
.civ-cs .unit-infocard-ft{display:flex;align-items:center;justify-content:space-between;padding-top:0.42em;
  border-top:1px solid rgba(232,216,138,.12);font-size:0.62em;color:#8a8478;}
.civ-cs .unit-infocard-actions{display:flex;align-items:center;justify-content:space-between;gap:0.35em;
  margin-top:0.12em;flex-wrap:wrap;}
.civ-cs .unit-infocard-cost{font-size:0.68em;color:var(--muted);}
.civ-army-stack .ash-card-ic .unit-infographic-medallion{width:1.85em;height:1.85em;}
`;

const STYLE_ID = 'civ-unit-infographic-css-v1';

export function ensureUnitInfographicStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = UNIT_INFOGRAPHIC_CSS;
  document.head.appendChild(s);
}
