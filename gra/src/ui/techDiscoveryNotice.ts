/**
 * Karta odkrytej technologii, otwierana przy ukończeniu badań.
 * Dane są czytane z tych samych JSON-ów co drzewko — bez kopii balansowych.
 */

import techData from '../../data/tech.json';
import buildingsData from '../../data/buildings.json';
import unitsData from '../../data/units.json';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

type TechRow = {
  Technologia: string;
  Epoka?: string | null;
  Poziom?: number | null;
  'Wymaga (prereq)'?: string | null;
  'wymagany budynek'?: string | null;
  'wymagane ulepszenie'?: string | null;
  'Odblokowuje budynek'?: string | null;
  'Odblokowuje ulepszenie terenu'?: string | null;
  'Odblokowuje surowiec.'?: string | null;
  'Koszt nauki'?: number | null;
  Uwagi?: string | null;
  awansDoEpoki?: number | null;
};

type BuildingRow = {
  id: string;
  nazwa?: string;
  techUnlock?: string | null;
  baza?: Record<string, number>;
  przyrost?: Record<string, number>;
  uwagi?: string;
};

type UnitRow = { Jednostka: string; Tech?: string | null };

const HOST_ID = 'civ-tech-discovery-notice-host';
const STYLE_ID = 'civ-tech-discovery-notice-css-v1';
const OVERLAY_ID = 'tech-discovery-notice';

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function list(raw: string | null | undefined): string[] {
  return (raw ?? '').split(/[;,+]/).map(x => x.trim())
    .filter(x => x !== '' && x !== '-' && x !== '—');
}

function unlockBuildings(raw: string | null | undefined): string[] {
  return list(raw).filter(x => !/^Jednostki\s*:/i.test(x));
}

function section(title: string, values: string[], cls = ''): string {
  if (values.length === 0) return '';
  return `<section class="tdn-sec ${cls}"><h3>${esc(title)}</h3><ul>${
    values.map(value => `<li>${esc(value)}</li>`).join('')
  }</ul></section>`;
}

function buildingEffect(building: BuildingRow): string {
  const effects: string[] = [];
  for (const [key, value] of Object.entries(building.przyrost ?? {})) {
    if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
  }
  if (effects.length === 0) {
    for (const [key, value] of Object.entries(building.baza ?? {})) {
      if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  return effects.length > 0 ? `${building.nazwa ?? building.id}: ${effects.join(', ')}` : (building.nazwa ?? building.id);
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${HOST_ID}{position:fixed;inset:0;z-index:940;display:flex;align-items:center;justify-content:center;
padding:18px;pointer-events:none;font-family:'Segoe UI',Tahoma,sans-serif;color:#e8e0c8}
#${HOST_ID} .tdn-back{position:fixed;inset:0;background:rgba(2,3,6,.72);pointer-events:auto}
#${HOST_ID} .tdn-card{position:relative;width:min(720px,96vw);max-height:calc(100vh - 36px);overflow:hidden;
display:flex;flex-direction:column;pointer-events:auto;border:2px solid #e8d88a;border-radius:15px;
background:linear-gradient(180deg,rgba(40,34,18,.99),rgba(9,11,17,.99));box-shadow:0 0 48px rgba(232,216,138,.25),0 22px 60px #000}
#${HOST_ID} .tdn-head{padding:18px 22px 14px;border-bottom:1px solid rgba(232,216,138,.22)}
#${HOST_ID} .tdn-kick{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#e8d88a}
#${HOST_ID} h2{margin:5px 0 0;font:600 27px Georgia,serif;color:#f4e6a8}
#${HOST_ID} .tdn-sub{margin-top:5px;color:#c8b898;font-size:12px}
#${HOST_ID} .tdn-scroll{overflow:auto;padding:15px 22px 8px}
#${HOST_ID} .tdn-sec{margin:0 0 14px}.tdn-sec h3{margin:0 0 6px;color:#e8d88a;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
#${HOST_ID} ul{margin:0;padding-left:20px;line-height:1.45;font-size:12px;color:#e8e0c8}
#${HOST_ID} li+li{margin-top:3px}.tdn-sec.req li{color:#c8b898}.tdn-sec.fx li{color:#b9d8ba}
#${HOST_ID} .tdn-foot{display:flex;justify-content:flex-end;padding:11px 22px 16px;border-top:1px solid rgba(232,216,138,.18)}
#${HOST_ID} button{border:1px solid #e8d88a;border-radius:8px;padding:8px 22px;cursor:pointer;color:#2e2708;
font-weight:700;background:linear-gradient(180deg,#f0dc88,#b99a28)}
`;
  document.head.appendChild(style);
}

function buildBody(tech: TechRow): string {
  const buildings = (buildingsData as BuildingRow[]).filter(b => b.techUnlock === tech.Technologia);
  const units = (unitsData as UnitRow[]).filter(u => u.Tech === tech.Technologia).map(u => u.Jednostka);
  const allTechs = (techData as unknown as { technologie: TechRow[] }).technologie;
  const nextTechs = allTechs.filter(t => list(t['Wymaga (prereq)']).includes(tech.Technologia))
    .map(t => t.Technologia);
  const effects = [
    ...(tech.Uwagi ? [tech.Uwagi] : []),
    ...buildings.map(buildingEffect),
    ...(tech['Odblokowuje surowiec.'] ? [`Dostęp do surowca: ${tech['Odblokowuje surowiec.']}`] : []),
  ];
  const requirements = [
    ...list(tech['Wymaga (prereq)']).map(x => `Technologia: ${x}`),
    ...(tech['wymagany budynek'] ? [`Budynek: ${tech['wymagany budynek']}`] : []),
    ...(tech['wymagane ulepszenie'] ? [`Ulepszenie: ${tech['wymagane ulepszenie']}`] : []),
  ];
  return section('Budynki', buildings.map(b => b.nazwa ?? b.id))
    + section('Jednostki', units)
    + section('Ulepszenia terenu', list(tech['Odblokowuje ulepszenie terenu']))
    + section('Kolejne technologie', nextTechs)
    + section('Wymagania', requirements, 'req')
    + section('Efekty', effects, 'fx');
}

export function showTechDiscoveryNotice(opts: {
  techName: string;
  eraIndex: number;
  /** Awans epoki zachowuje dotychczasowy nagłówek; zwykłe badanie ma neutralny komunikat. */
  kind?: 'era' | 'completion';
  onOpenTree?: () => void;
}): void {
  const tech = (techData as unknown as { technologie: TechRow[] }).technologie
    .find(t => t.Technologia === opts.techName);
  if (!tech) return;
  ensureStyles();
  hideTechDiscoveryNotice();
  const host = document.createElement('div');
  host.id = HOST_ID;
  const close = () => { popOverlay(OVERLAY_ID); host.remove(); };
  const isEraAdvance = (opts.kind ?? 'era') === 'era';
  const kick = isEraAdvance
    ? `Awans do epoki ${esc(tech.Epoka ?? opts.eraIndex)}`
    : 'Ukończono badania';
  const subtitle = isEraAdvance
    ? 'Technologia odkryta · pełna karta odblokowań'
    : 'Technologia zbadana · pełna karta odblokowań';
  host.innerHTML = `<div class="tdn-back"></div><article class="tdn-card" role="dialog" aria-modal="true"
    aria-label="Odkryta technologia"><header class="tdn-head"><div class="tdn-kick">${kick}</div>
    <h2>${esc(tech.Technologia)}</h2><div class="tdn-sub">${subtitle}</div></header>
    <div class="tdn-scroll">${buildBody(tech) || '<p>Brak dodatkowych danych w drzewie technologii.</p>'}</div>
    <footer class="tdn-foot"><button type="button" data-act="tree">Otwórz drzewo</button>
    <button type="button" data-act="close">Zamknij</button></footer></article>`;
  host.querySelector('.tdn-back')?.addEventListener('click', close);
  host.querySelector('[data-act="close"]')?.addEventListener('click', close);
  host.querySelector('[data-act="tree"]')?.addEventListener('click', () => {
    opts.onOpenTree?.();
    close();
  });
  document.body.appendChild(host);
  pushOverlay(OVERLAY_ID, close);
}

export function hideTechDiscoveryNotice(): void {
  popOverlay(OVERLAY_ID);
  document.getElementById(HOST_ID)?.remove();
}
