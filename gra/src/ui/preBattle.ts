/**
 * preBattle.ts
 * Pre-battle overlay -- kompaktowa nakladka nad mapa swiata (KANON v1.1, 2026-07-23).
 * Zrodlo wizualne: docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/
 *   "The Game - PreBattle nakladka v1.1 (1E).dc.html" + DYSPOZYCJA-WDROZENIE.md (KROK 3).
 * Kontrakt danych (PreBattleInfo / PreBattleSide / PreBattleUnit / callbacks) NIEZMIENIONY --
 * to jest restyling + rekompozycja layoutu, bez zmian logiki silnika.
 * Pure DOM (innerHTML z template stringow, jak cityAttackChoice.ts).
 */

import type { CivBonusLite } from '../game/production';
import { bonusChipTexts } from '../game/defenseBreakdown';
import { terrainIconSvg, civIconSvg, brandIconSvg } from './icons/brandAssets';
import { PB_SVG } from '../battle/battleHudTheme';
import { leaderPortraitUrl, leaderName } from './leaderPortraits';
import { startPreBattleMusic, stopPreBattleMusic } from '../audio/muzyka-antyczna';
import { setArmyStackHudSuppressed } from './hud';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface PreBattleUnit {
  nazwa: string;
  kategoria: string;
  hp: number;
  maxHp: number;
  atak: number;
  /** M jednostki (pole), Moc NOMINALNA (armyFieldPower(unitDefFor)). Jedyny konsument:
   * unitSubtitle() niżej, etykieta "Szarża +X" dla jednostek konnych. NIE jest sumowana
   * ani wyświetlana jako "Moc" gdzie indziej w panelu (zweryfikowane 2026-08-07, Evaluator). */
  moc?: number;
  ilosc?: number;
  /**
   * TRZECI SYSTEM -- doświadczenie bojowe / weterani (2026-07-25,
   * game/veteran.ts). Etykieta gotowa z veteranBadgeLabel(), np. "★★ +10%" /
   * "★★★ Weteran +20%"; undefined/pusty string na poziomie 1 (brak odznaki).
   * Renderowana OSOBNĄ, złotą linią (klasa .pb-vet) — wizualnie odróżnialna
   * od reszty karty jednostki (HP/atak), zero konfliktu z odznakami budynków
   * (ten kontrakt nie ma odznak budynkowych — patrz unit-building-bonuses.ts).
   */
  veteranBadge?: string;
}

export interface PreBattleModifier {
  tekst: string;
  wartosc?: string;
  typ?: 'pos' | 'neg' | 'neu';
}

export interface PreBattleSide {
  nazwa: string;
  cywilizacja?: string;
  wodz?: string;
  portretEmoji?: string;
  /** D4-Q3 / P0-D4: lookup bonusów przez configurePreBattle.getCivBonusy */
  ownerId?: number;
  /** ikonaId cywilizacji (civs.json) -- portret wladcy w medalionie (leaderPortraits.ts). */
  civId?: string;
  /** Epoka tej strony (1=kamien,2=braz,3=zelazo) -- dobor portretu wladcy. Brak = 1. */
  era?: number;
  /**
   * R-MP-PORTRET (Maciej 2026-07-24) -- ta strona to miasto-panstwo klastra
   * (isOwnerClusterCityState). Gdy true, medalion dowodcy NIE pokazuje portretu-zdjecia
   * wladcy glownej cywilizacji -- wraca do ikony-symbolu kultury (civIconSvg), zeby MP nie
   * wygladalo identycznie jak gracz/glowne AI tej samej kultury.
   */
  isCityState?: boolean;
  /**
   * TEMAT 11 (Maciej 2026-07-24) -- ta strona to frakcja barbarzyncow
   * (game/barbarians.ts isBarbarian(ownerId)). Gdy true, medalion dowodcy NIE
   * pokazuje ani portretu-zdjecia, ani ikony-symbolu jakiejkolwiek cywilizacji
   * (barbarzyncy nie maja kultury/civId -- civId bywa fallbackiem 'grecy') --
   * dostaje wlasny sygnet barbarzyncow (czaszka, brandIconSvg('chip-death')).
   * Ma pierwszenstwo przed isCityState (wzajemnie wykluczajace sie w praktyce).
   */
  isBarbarian?: boolean;
  units: PreBattleUnit[];
}

export interface PreBattleInfo {
  atakujacy: PreBattleSide;
  obronca: PreBattleSide;
  teren: string;
  szanseAtkPct: number;
  miejsce?: string;
  lokacja?: string;
  tura?: number;
  modyfikatory?: PreBattleModifier[];
  warunki?: PreBattleModifier[];
  prognoza?: string;
  werdykt?: string;
  canRetreat?: boolean;
  /** Gdy canRetreat===false (obrońca gracza) — pokaż przycisk Wycofaj i Esc. */
  defenderCanRetreat?: boolean;
  /** Opcjonalne nadpisanie — inaczej z getCivBonusy(ownerId) */
  bonusyAtakujacy?: readonly CivBonusLite[];
  bonusyObronca?: readonly CivBonusLite[];
}

export interface PreBattleConfig {
  /** Bonusy cywilizacji per owner (civs.json bonusy[]) — wzorzec jak cityPanel. */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
}

export interface PreBattleCallbacks {
  onAuto: () => void;
  onBattlefield: () => void;
  onCancel: () => void;
  /** Zwraca true gdy zapis się powiódł (toast na overlay). */
  onSave?: () => boolean;
}

export interface PreBattleOptions {
  defaultAction?: 'auto' | 'manual';
  /** Nadpisanie hooka z configurePreBattle (np. jednorazowy test). */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
}

let overlayEl: HTMLDivElement | null = null;
/** Ciemny scrim nad mapą świata (pod UI pre-battle, z-index 9899). */
let mapScrimEl: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let pbCfg: PreBattleConfig = {};
let saveToastEl: HTMLDivElement | null = null;
let saveToastTimer: ReturnType<typeof setTimeout> | null = null;
let activePreBattleCb: PreBattleCallbacks | null = null;
let activePreBattleRetreat: boolean = false;

/** Wpięcie silnika — jak configureCityPanel (P0-D4). */
export function configurePreBattle(config: PreBattleConfig): void {
  pbCfg = { ...pbCfg, ...config };
}

function showMapScrim(): void {
  ensureStyles();
  mapScrimEl = document.createElement('div');
  mapScrimEl.className = 'pb-map-scrim';
  mapScrimEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(mapScrimEl);
}

function hideMapScrim(): void {
  if (mapScrimEl !== null) {
    mapScrimEl.remove();
    mapScrimEl = null;
  }
}

export function showPreBattle(
  info: PreBattleInfo,
  cb: PreBattleCallbacks,
  opts?: PreBattleOptions,
): void {
  hidePreBattle();
  showMapScrim();
  overlayEl = buildOverlay(info, cb, opts);
  document.body.appendChild(overlayEl);
  activePreBattleCb = cb;
  activePreBattleRetreat = retreatUiEnabled(info);
  attachKeyboard(cb, info, opts);
  pushOverlay('pre-battle', handlePreBattleEscape);
  startPreBattleMusic();
  // T-BITWA-ROSTER (Maciej 2026-07-24): panel rosteru armii swiata (armyStackHud, dolny
  // stos "Armia . (x,y)") zaslania ten overlay -- ukryj go na czas dialogu, przywroc w
  // hidePreBattle() (kazda sciezka wyjscia -- deploy/auto/cancel/Esc/Enter -- przechodzi
  // przez hidePreBattle).
  setArmyStackHudSuppressed(true);
}

export function hidePreBattle(): void {
  popOverlay('pre-battle');
  detachKeyboard();
  activePreBattleCb = null;
  activePreBattleRetreat = false;
  clearPreBattleSaveToast();
  hideMapScrim();
  if (overlayEl !== null) {
    overlayEl.remove();
    overlayEl = null;
  }
  stopPreBattleMusic();
  setArmyStackHudSuppressed(false);
}

function clearPreBattleSaveToast(): void {
  if (saveToastTimer !== null) {
    clearTimeout(saveToastTimer);
    saveToastTimer = null;
  }
  if (saveToastEl !== null) {
    saveToastEl.remove();
    saveToastEl = null;
  }
}

function showPreBattleSaveToast(overlay: HTMLElement, message: string, ok: boolean): void {
  clearPreBattleSaveToast();
  const toast = document.createElement('div');
  toast.className = 'pb-toast';
  toast.style.borderColor = ok ? 'rgba(122,208,160,.65)' : 'rgba(255,112,112,.65)';
  toast.style.background = ok ? 'rgba(18,40,28,.96)' : 'rgba(40,18,18,.96)';
  toast.style.color = ok ? '#7ad0a0' : '#ff7070';
  toast.textContent = message;
  overlay.appendChild(toast);
  saveToastEl = toast;
  saveToastTimer = setTimeout(() => {
    clearPreBattleSaveToast();
  }, 2500);
}

export function isPreBattleOpen(): boolean {
  return overlayEl !== null;
}

let styleInjected = false;

function ensureStyles(): void {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
:root{
  --pb-gold:#e8d88a;--pb-gold-bright:#f4e6a8;--pb-gold-dim:#c9a84c;
  --pb-panel:linear-gradient(180deg,rgba(22,28,40,.78),rgba(8,10,16,.84));
  --pb-border:rgba(232,216,138,.45);--pb-border-soft:rgba(232,216,138,.22);
  --pb-text:#e8e0c8;--pb-dim:#8a8070;
  --pb-you:#3a6ad0;--pb-you-txt:#8fb6e0;--pb-foe:#c84040;--pb-foe-txt:#e08a8a;--pb-green:#7ad0a0;
  --pb-shadow:0 6px 26px rgba(0,0,0,.5);
  --pb-roster-w:clamp(168px,15vw,206px);
  --pb-font-main:Georgia,"Times New Roman",serif;
  --pb-font-ui:"Segoe UI",Tahoma,sans-serif;
}
.pb-map-scrim{position:fixed;inset:0;z-index:9899;pointer-events:none;
  background:rgba(6,8,14,.58);
  backdrop-filter:saturate(.38) brightness(.7);
  -webkit-backdrop-filter:saturate(.38) brightness(.7);
  animation:pb-scrimIn .24s ease-out}
.pb-overlay{position:fixed;inset:0;z-index:9900;font-family:var(--pb-font-ui);color:var(--pb-text);
  user-select:none;pointer-events:none;overflow:hidden;animation:pb-fadeIn .22s ease-out}
.pb-overlay *{box-sizing:border-box}
.pb-overlay button{font:inherit;cursor:pointer}
@keyframes pb-scrimIn{from{opacity:0}to{opacity:1}}
@keyframes pb-fadeIn{from{opacity:0}to{opacity:1}}

.pb-cmd{position:absolute;top:14px;display:flex;align-items:center;gap:12px;z-index:5;pointer-events:auto;
  background:var(--pb-panel);backdrop-filter:blur(7px);border:1px solid rgba(232,216,138,.3);border-radius:12px;
  padding:9px 14px;box-shadow:var(--pb-shadow),inset 0 1px 0 rgba(232,216,138,.1);max-width:min(380px,32vw)}
.pb-cmd.pb-l{left:14px}
.pb-cmd.pb-r{right:14px;flex-direction:row-reverse;text-align:right}
.pb-cmd .pb-por{width:56px;height:56px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}
.pb-cmd.pb-you .pb-por{border:2px solid var(--pb-you-txt);color:var(--pb-you-txt);
  background:radial-gradient(circle at 40% 30%,#1a2c40,#0a0d14);box-shadow:0 0 16px rgba(58,106,208,.35)}
.pb-cmd.pb-foe .pb-por{border:2px solid var(--pb-foe-txt);color:var(--pb-foe-txt);
  background:radial-gradient(circle at 40% 30%,#3a1c1c,#0a0d14);box-shadow:0 0 16px rgba(200,64,64,.3)}
.pb-cmd .pb-por svg{width:27px;height:27px}
.pb-cmd .pb-por img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
.pb-cmd .pb-role{font-size:9.5px;color:var(--pb-dim);text-transform:uppercase;letter-spacing:.09em;white-space:nowrap}
.pb-cmd.pb-you .pb-role b{color:var(--pb-you-txt)}
.pb-cmd.pb-foe .pb-role b{color:var(--pb-foe-txt)}
.pb-cmd .pb-leader{font-size:10.5px;color:var(--pb-gold-dim);font-style:italic;line-height:1.2;white-space:nowrap}
.pb-cmd .pb-who{font-family:var(--pb-font-main);font-size:16px;color:var(--pb-gold);line-height:1.25}
.pb-cmd .pb-cnt{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:1px;white-space:nowrap}
.pb-cmd.pb-you .pb-cnt{color:var(--pb-you-txt)}
.pb-cmd.pb-foe .pb-cnt{color:var(--pb-foe-txt)}
.pb-bonuses{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.pb-cmd.pb-r .pb-bonuses{justify-content:flex-end}
.pb-bchip{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;color:var(--pb-text);white-space:nowrap;
  border:1px solid var(--pb-border-soft);border-radius:999px;padding:2px 8px;background:rgba(0,0,0,.35)}
.pb-bchip svg{width:9px;height:9px;color:var(--pb-gold);flex:none}

.pb-roster{position:absolute;top:132px;bottom:186px;width:var(--pb-roster-w);z-index:3;pointer-events:auto;
  display:flex;flex-direction:column;gap:6px}
.pb-roster.pb-l{left:14px}
.pb-roster.pb-r{right:14px;text-align:right}
.pb-rlbl{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-variant-numeric:tabular-nums;flex:none;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:5px 10px;border-radius:8px;background:var(--pb-panel);
  backdrop-filter:blur(7px);border:1px solid var(--pb-border-soft);box-shadow:var(--pb-shadow)}
.pb-roster.pb-you .pb-rlbl{color:var(--pb-you-txt)}
.pb-roster.pb-foe .pb-rlbl{color:var(--pb-foe-txt)}
.pb-rcards{display:flex;flex-direction:column;gap:5px;min-height:0;overflow-y:auto;overflow-x:hidden;
  scrollbar-width:thin;scrollbar-color:rgba(232,216,138,.25) transparent}
.pb-rcards::-webkit-scrollbar{width:5px}
.pb-rcards::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:4px}
.pb-uc{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:9px;box-shadow:0 2px 8px rgba(0,0,0,.4);
  flex:none;backdrop-filter:blur(5px)}
.pb-roster.pb-you .pb-uc{border:1px solid rgba(90,155,212,.45);background:linear-gradient(180deg,rgba(18,30,44,.82),rgba(10,16,26,.86))}
.pb-roster.pb-foe .pb-uc{border:1px solid rgba(200,64,64,.45);background:linear-gradient(180deg,rgba(38,16,16,.82),rgba(20,10,10,.86))}
.pb-roster.pb-r .pb-uc{flex-direction:row-reverse}
.pb-uc .pb-ic{width:28px;height:28px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center}
.pb-roster.pb-you .pb-uc .pb-ic{border:1.5px solid var(--pb-you);color:var(--pb-you-txt);background:radial-gradient(circle at 38% 30%,#12202e,#0a0d14)}
.pb-roster.pb-foe .pb-uc .pb-ic{border:1.5px solid var(--pb-foe);color:var(--pb-foe-txt);background:radial-gradient(circle at 38% 30%,#2a1414,#0a0d14)}
.pb-uc .pb-ic svg{width:15px;height:15px}
.pb-uc .pb-m{flex:1;min-width:0;display:block}
.pb-uc .pb-nm{display:block;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pb-roster.pb-you .pb-uc .pb-nm{color:#bcd6f0}
.pb-roster.pb-foe .pb-uc .pb-nm{color:#e8c8c8}
.pb-uc .pb-sub{display:block;font-size:9px;color:var(--pb-dim);font-variant-numeric:tabular-nums;margin-top:1px;white-space:nowrap}
.pb-uc .pb-hpb{display:block;height:3px;border-radius:2px;background:rgba(0,0,0,.5);overflow:hidden;margin-top:3px}
.pb-uc .pb-hpb i{display:block;height:100%}
.pb-uc .pb-vet{display:block;font-size:8.5px;font-weight:700;letter-spacing:.03em;color:#f4d35e;
  text-shadow:0 0 5px rgba(244,211,94,.4);margin-top:1px;white-space:nowrap}
.pb-more{flex:none;font-size:10px;color:var(--pb-gold);border:1px dashed var(--pb-gold-dim);border-radius:999px;
  padding:3px 10px;background:rgba(8,11,17,.82);align-self:flex-start;font-variant-numeric:tabular-nums;white-space:nowrap}
.pb-roster.pb-r .pb-more{align-self:flex-end}

.pb-deploy{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:6;pointer-events:auto;
  width:min(640px,calc(100vw - 2 * var(--pb-roster-w) - 80px));
  background:var(--pb-panel);backdrop-filter:blur(8px);border:2px solid var(--pb-border);border-radius:14px;
  box-shadow:0 14px 44px rgba(0,0,0,.65),inset 0 1px 0 rgba(232,216,138,.12);overflow:hidden}
.pb-hd{padding:9px 16px 8px;text-align:center;border-bottom:1px solid var(--pb-border-soft);
  background:linear-gradient(180deg,rgba(232,216,138,.09),transparent)}
.pb-kick{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#b09a55;white-space:nowrap}
.pb-ttl{font-family:var(--pb-font-main);font-size:20px;color:var(--pb-gold);letter-spacing:.03em;margin-top:2px}
.pb-meta{display:flex;align-items:center;justify-content:center;gap:7px;font-size:11px;color:var(--pb-dim);margin-top:4px;flex-wrap:wrap}
.pb-meta b{color:var(--pb-text);font-weight:600}
.pb-meta .pb-ter{display:inline-flex;align-items:center;gap:5px;color:var(--pb-gold-bright);font-weight:600;white-space:nowrap;
  border:1px solid var(--pb-gold-dim);border-radius:999px;padding:1px 9px;background:rgba(232,216,138,.06)}
.pb-meta .pb-ter svg{width:13px;height:13px}
.pb-bd{padding:10px 16px 12px;display:grid;gap:8px}
.pb-odds{display:grid;gap:4px}
.pb-bar{height:12px;border-radius:7px;border:1px solid rgba(232,216,138,.4);overflow:hidden;display:flex;
  background:#0a0d14;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.5)}
.pb-bar .pb-yf{background:linear-gradient(90deg,#2f5aa8,#5a9bd4)}
.pb-bar .pb-ff{background:linear-gradient(90deg,#a83a3a,#7e2626)}
.pb-bar .pb-mk{position:absolute;top:-2px;bottom:-2px;width:3px;background:var(--pb-gold-bright);
  box-shadow:0 0 8px rgba(232,216,138,.9);transform:translateX(-50%)}
.pb-lbl{display:flex;justify-content:space-between;font-size:10px;color:var(--pb-dim);font-variant-numeric:tabular-nums}
.pb-lbl b{color:var(--pb-gold)}
.pb-mods{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.pb-pill{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;border-radius:999px;padding:3px 10px;white-space:nowrap}
.pb-pill.pb-pos{color:var(--pb-green);border:1px solid rgba(80,176,112,.4);background:rgba(80,176,112,.07)}
.pb-pill.pb-neg{color:var(--pb-foe-txt);border:1px solid rgba(200,64,64,.4);background:rgba(200,64,64,.07)}
.pb-pill.pb-neu{color:var(--pb-dim);border:1px solid var(--pb-border-soft);background:rgba(255,255,255,.03)}
.pb-note{font-size:11px;color:var(--pb-dim);line-height:1.5;text-align:center}
.pb-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:1px}
.pb-btn{border-radius:9px;padding:8px 15px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  white-space:nowrap;display:inline-flex;align-items:center;gap:8px;border:2px solid rgba(232,216,138,.4);color:var(--pb-gold);
  background:linear-gradient(180deg,#161c28,#0a0d14);transition:border-color .15s,box-shadow .15s,filter .15s}
.pb-btn:hover{border-color:var(--pb-gold);box-shadow:0 0 10px rgba(232,216,138,.3)}
.pb-btn svg{width:14px;height:14px}
.pb-btn.pb-primary{border:1px solid #6a5212;border-top-color:#f8eea8;color:#2e2708;
  background:linear-gradient(180deg,#f0dc88,#b99a28);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.22)}
.pb-btn.pb-primary:hover{filter:brightness(1.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 22px rgba(232,216,138,.34)}
.pb-btn.pb-danger{border:2px solid rgba(200,64,64,.5);color:var(--pb-foe-txt);
  background:linear-gradient(180deg,rgba(40,18,18,.85),rgba(20,10,10,.85))}
.pb-btn.pb-danger:hover{border-color:var(--pb-foe-txt);box-shadow:0 0 10px rgba(200,64,64,.3)}
.pb-btn:disabled{opacity:.35;cursor:not-allowed;filter:none;box-shadow:none}
.pb-keys{font-size:9.5px;color:#6a6250;text-align:center;letter-spacing:.05em}
.pb-keys b{color:#c8b898;font-weight:600;border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06)}
.pb-noretreat{display:flex;align-items:center;justify-content:center;gap:7px;font-size:10px;color:#b09090;
  border:1px dashed rgba(200,64,64,.35);border-radius:8px;padding:5px 10px;background:rgba(200,64,64,.05)}
.pb-noretreat svg{width:12px;height:12px;flex:none}
.pb-toast{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:20;padding:14px 28px;
  border-radius:10px;font-size:15px;font-family:var(--pb-font-ui);pointer-events:none;border:2px solid;
  box-shadow:0 10px 36px rgba(0,0,0,.6);letter-spacing:.04em}
`;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function unitCount(units: PreBattleUnit[]): number {
  return units.reduce((acc, u) => acc + (u.ilosc ?? 1), 0);
}

type UnitKind = 'mounted' | 'melee' | 'ranged' | 'siege';

function unitKind(kategoria: string): UnitKind {
  const k = kategoria.toLowerCase();
  if (k.includes('kawaleria') || k.includes('konnica') || k.includes('jezd') || k.includes('mounted')) return 'mounted';
  if (k.includes('lucznik') || k.includes('łuk') || k.includes('arc') || k.includes('dystans')) return 'ranged';
  if (k.includes('mur') || k.includes('machin') || k.includes('katapult') || k.includes('garnizon')) return 'siege';
  return 'melee';
}

function unitSvgHtml(kind: UnitKind): string {
  if (kind === 'mounted') return PB_SVG.unitMounted;
  if (kind === 'ranged') return PB_SVG.unitRanged;
  if (kind === 'siege') return PB_SVG.unitSiege;
  return PB_SVG.unitMelee;
}

function unitSubtitle(unit: PreBattleUnit): string {
  const kind = unitKind(unit.kategoria);
  if (kind === 'mounted') return 'Szarża +' + String(unit.moc ?? unit.atak);
  if (kind === 'ranged') return 'Zasięg 2 · Atk ' + String(unit.atak);
  if (kind === 'siege') return 'Obrona ' + String(unit.atak);
  return 'Atak ' + String(unit.atak);
}

/** Czy dana strona (rola atk/def) to gracz -- ownerId===0 gdy znane, inaczej wg canRetreat
 * (canRetreat!==false => atakujacy to gracz; canRetreat===false => obronca to gracz). */
function isPlayerSide(side: PreBattleSide, role: 'atk' | 'def', canRetreat: boolean): boolean {
  if (side.ownerId !== undefined) return side.ownerId === 0;
  return canRetreat ? role === 'atk' : role === 'def';
}

/** Etykieta roli w karcie dowodcy: "Atakujacy -- Ty" / "Atakujacy -- Wrog" / "Obronca" / "Obronca -- Ty". */
function roleLabel(role: 'atk' | 'def', isPlayer: boolean): string {
  const base = role === 'atk' ? 'Atakujący' : 'Obrońca';
  if (isPlayer) return base + ' — Ty';
  if (role === 'atk') return base + ' — Wróg';
  return base;
}

function resolveSideBonusy(
  side: PreBattleSide,
  explicit: readonly CivBonusLite[] | undefined,
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[],
): readonly CivBonusLite[] {
  if (explicit?.length) return explicit;
  if (side.ownerId !== undefined && getCivBonusy) return getCivBonusy(side.ownerId);
  return [];
}

function defaultVerdict(atkPct: number): string {
  if (atkPct >= 65) return 'Przewaga atakującego';
  if (atkPct <= 35) return 'Przewaga obrońcy';
  return 'Szanse umiarkowane';
}

function retreatUiEnabled(info: PreBattleInfo): boolean {
  return info.canRetreat !== false || info.defenderCanRetreat === true;
}

function handlePreBattleEscape(): void {
  if (!activePreBattleRetreat || activePreBattleCb === null) return;
  activePreBattleCb.onCancel();
  hidePreBattle();
}

function attachKeyboard(
  cb: PreBattleCallbacks,
  info: PreBattleInfo,
  opts?: PreBattleOptions,
): void {
  const defaultManual = (opts?.defaultAction ?? 'manual') === 'manual';
  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (defaultManual) cb.onBattlefield();
      else cb.onAuto();
      hidePreBattle();
    }
  };
  document.addEventListener('keydown', keyHandler);
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

const PB_ICON_DEPLOY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const PB_ICON_SHIELD =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/></svg>';
const PB_ICON_NO_RETREAT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>';
const PB_ICON_DOT =
  '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';

function unitRowHtml(unit: PreBattleUnit): string {
  const kind = unitKind(unit.kategoria);
  const qty = unit.ilosc ?? 1;
  const hpPct = unit.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((unit.hp / unit.maxHp) * 100))) : 100;
  const hpColor = hpPct > 50 ? '#4caf50' : hpPct > 20 ? '#d0a030' : '#c84040';
  const name = esc(unit.nazwa) + (qty > 1 ? ' ×' + String(qty) : '');
  const vetHtml = unit.veteranBadge
    ? '<span class="pb-vet">' + esc(unit.veteranBadge) + '</span>'
    : '';
  return (
    '<div class="pb-uc">' +
    '<span class="pb-ic">' + unitSvgHtml(kind) + '</span>' +
    '<span class="pb-m">' +
    '<span class="pb-nm">' + name + '</span>' +
    '<span class="pb-sub">' + esc(unitSubtitle(unit)) + '</span>' +
    '<span class="pb-hpb"><i style="width:' + String(hpPct) + '%;background:' + hpColor + '"></i></span>' +
    vetHtml +
    '</span>' +
    '</div>'
  );
}

/** Max kart w rosterze -- reszta jako chip "+N wiecej...". */
const PB_ROSTER_MAX = 8;

function rosterHtml(side: PreBattleSide, role: 'atk' | 'def', isYou: boolean): string {
  const total = unitCount(side.units);
  const label = isYou ? 'Twoje wojska' : (side.nazwa || 'Wróg');
  const shown = side.units.slice(0, PB_ROSTER_MAX);
  const hidden = side.units.length - shown.length;
  const rows = shown.map(u => unitRowHtml(u)).join('');
  const more = hidden > 0 ? '<div class="pb-more">+' + String(hidden) + ' więcej…</div>' : '';
  const sideCls = isYou ? 'pb-you' : 'pb-foe';
  const posCls = role === 'atk' ? 'pb-l' : 'pb-r';
  return (
    '<div class="pb-roster ' + sideCls + ' ' + posCls + '">' +
    '<div class="pb-rlbl">' + esc(label) + ' · ' + String(total) + '</div>' +
    '<div class="pb-rcards">' + rows + '</div>' +
    more +
    '</div>'
  );
}

function commanderHtml(
  side: PreBattleSide,
  role: 'atk' | 'def',
  isYou: boolean,
  explicit: readonly CivBonusLite[] | undefined,
  getBonusy?: (ownerId: number) => readonly CivBonusLite[],
): string {
  const total = unitCount(side.units);
  const civ = esc(side.cywilizacja ?? side.nazwa);
  const who = esc(side.wodz ?? side.nazwa);
  const sideCls = isYou ? 'pb-you' : 'pb-foe';
  const posCls = role === 'atk' ? 'pb-l' : 'pb-r';
  const bonusy = resolveSideBonusy(side, explicit, getBonusy);
  const chipTexts = bonusChipTexts(bonusy);
  const chipsHtml = chipTexts.length
    ? '<div class="pb-bonuses">' +
      chipTexts.map(t => '<span class="pb-bchip">' + PB_ICON_DOT + esc(t) + '</span>').join('') +
      '</div>'
    : '';
  // NOTE: kontrakt PreBattleSide nie ma pola "liczba ludzi" (tylko jednostki/ilosc) --
  // pokazujemy liczbe oddzialow (unitCount); TODO: dodac headcount, jesli silnik zacznie go liczyc.
  // Portret wladcy (docs/.../PORTRETY-WLADCOW-2026-07-23) -- fallback obowiazkowy: brak
  // civId/pliku -> dotychczasowa ikona PB_SVG.commander, bez zmian.
  // R-MP-PORTRET: miasto-panstwo (side.isCityState) NIGDY nie dostaje portretu-zdjecia
  // wladcy glownej cywilizacji -- wraca do ikony-symbolu kultury (civIconSvg), nie do
  // generycznej ikony dowodcy, zeby bylo widac KTOREJ kultury to MP.
  // TEMAT 11: barbarzyncy (side.isBarbarian) tez NIGDY nie dostaja portretu -- ani nawet
  // ikony-symbolu cywilizacji (civId bywa fallbackiem 'grecy' -- barbarzyncy nie maja
  // prawdziwej kultury), tylko wlasny sygnet (czaszka). Sprawdzane PRZED isCityState.
  const portraitUrl = (side.isBarbarian || side.isCityState)
    ? null
    : leaderPortraitUrl(side.civId, side.era ?? 1);
  const porInner = portraitUrl
    ? '<img src="' + esc(portraitUrl) + '" alt="">'
    : side.isBarbarian
      ? brandIconSvg('chip-death', 27)
      : side.isCityState
        ? civIconSvg(side.civId ?? '', 27)
        : PB_SVG.commander;
  // C-BITWA-WLADCA=B: preferuj imię przydzielone per właściciel (side.wodz, pula 10/civ);
  // fallback do imienia per-epoka gdy brak (np. brak puli dla cywilizacji).
  const leader = side.isBarbarian ? null : (side.wodz ?? leaderName(side.civId, side.era ?? 1));
  const leaderHtml = leader ? '<div class="pb-leader">' + esc(leader) + '</div>' : '';
  return (
    '<div class="pb-cmd ' + sideCls + ' ' + posCls + '">' +
    '<span class="pb-por">' + porInner + '</span>' +
    '<div>' +
    '<div class="pb-role">' + civ + ' · <b>' + roleLabel(role, isYou) + '</b></div>' +
    leaderHtml +
    '<div class="pb-who">' + who + '</div>' +
    '<div class="pb-cnt">' + String(total) + ' oddziałów</div>' +
    chipsHtml +
    '</div>' +
    '</div>'
  );
}

function oddsHtml(info: PreBattleInfo, canRetreat: boolean): string {
  const atkPct = Math.max(0, Math.min(100, Math.round(info.szanseAtkPct)));
  const defPct = 100 - atkPct;
  const isYouAttacker = isPlayerSide(info.atakujacy, 'atk', canRetreat);
  const tyPct = isYouAttacker ? atkPct : defPct;
  const foePct = 100 - tyPct;
  const werdykt = (info.werdykt ?? defaultVerdict(atkPct)).toLowerCase();
  const label = canRetreat ? 'Szansa zwycięstwa' : 'Szansa obrony';
  return (
    '<div class="pb-odds">' +
    '<div class="pb-bar">' +
    '<span class="pb-yf" style="width:' + String(tyPct) + '%"></span>' +
    '<span class="pb-ff" style="width:' + String(foePct) + '%"></span>' +
    '<span class="pb-mk" style="left:' + String(tyPct) + '%"></span>' +
    '</div>' +
    '<div class="pb-lbl"><span>' + label + ': <b>' + String(tyPct) + '%</b> Ty</span>' +
    '<span>' + String(foePct) + '% wróg · ' + esc(werdykt) + '</span></div>' +
    '</div>'
  );
}

function modPillsHtml(items: PreBattleModifier[]): string {
  if (!items.length) return '';
  const pills = items
    .map(m => {
      const t = m.typ ?? 'neu';
      const cls = t === 'pos' ? 'pb-pos' : t === 'neg' ? 'pb-neg' : 'pb-neu';
      const prefix = t === 'pos' ? '▲ ' : t === 'neg' ? '▼ ' : '';
      const text = prefix + m.tekst + (m.wartosc ? ' ' + m.wartosc : '');
      return '<span class="pb-pill ' + cls + '">' + esc(text) + '</span>';
    })
    .join('');
  return '<div class="pb-mods">' + pills + '</div>';
}

function metaHtml(info: PreBattleInfo): string {
  // NOTE: kontrakt PreBattleInfo nie ma pola "region" (tylko miejsce/lokacja/teren) --
  // segment "Region: X" z makiety pominiety (brak zrodla danych). Teren jest OBOWIAZKOWY.
  const parts: string[] = [];
  parts.push(
    '<span class="pb-ter">' + terrainIconSvg(info.teren, 13) + 'Teren: ' + esc(info.teren) + '</span>',
  );
  if (info.tura !== undefined) {
    parts.push('<span>Tura <b>' + String(info.tura) + '</b></span>');
  }
  return '<div class="pb-meta">' + parts.join('<span>·</span>') + '</div>';
}

function buildDeployPanel(info: PreBattleInfo, canRetreat: boolean, defaultManual: boolean, hasSave: boolean): HTMLElement {
  const defenderCanRetreat = info.defenderCanRetreat === true;
  const showRetreat = canRetreat || defenderCanRetreat;
  const place = info.miejsce ?? info.lokacja ?? info.teren;
  const kicker = canRetreat ? 'ROZSTAWIENIE BITWY' : 'WRÓG ATAKUJE';
  const title = (canRetreat ? 'Atakujesz: ' : 'Broni się: ') + esc(place);

  const allMods: PreBattleModifier[] = [...(info.modyfikatory ?? []), ...(info.warunki ?? [])];

  const deployLabel = 'BITWA';
  const deployIcon = canRetreat ? PB_ICON_DEPLOY : PB_ICON_SHIELD;

  const btns: string[] = [];
  if (showRetreat) {
    btns.push('<button type="button" class="pb-btn pb-danger" data-act="cancel">' + PB_SVG.retreat + 'Wycofaj</button>');
  }
  btns.push('<button type="button" class="pb-btn" data-act="auto">' + PB_SVG.auto + 'Auto</button>');
  btns.push('<button type="button" class="pb-btn pb-primary" data-act="deploy">' + deployIcon + esc(deployLabel) + '</button>');
  if (hasSave) {
    btns.push('<button type="button" class="pb-btn" data-act="save">Zapisz</button>');
  }

  const noRetreatBar = showRetreat
    ? (defenderCanRetreat && !canRetreat
        ? '<div class="pb-note">Wycofaj — uniknij walki (jednostka cofa się na sąsiedni heks)</div>'
        : '')
    : '<div class="pb-noretreat">' + PB_ICON_NO_RETREAT +
      'Wycofanie niedostępne — to wróg wybrał bitwę (obrońca nie może uciec)</div>';

  const enterLabel = defaultManual ? deployLabel : 'Auto';
  const keysParts: string[] = ['<b>Enter</b> = ' + esc(enterLabel)];
  if (showRetreat) keysParts.push('<b>Esc</b> = Wycofaj');
  if (hasSave) keysParts.push('<b>Zapisz</b> dostępny przed bitwą');
  const keys = '<div class="pb-keys">' + keysParts.join(' · ') + '</div>';

  const prognoza = info.prognoza
    ? '<div class="pb-note">' + esc(info.prognoza) + '</div>'
    : '';

  const panel = document.createElement('div');
  panel.className = 'pb-deploy';
  panel.innerHTML =
    '<div class="pb-hd">' +
    '<div class="pb-kick">' + kicker + '</div>' +
    '<div class="pb-ttl">' + title + '</div>' +
    metaHtml(info) +
    '</div>' +
    '<div class="pb-bd">' +
    oddsHtml(info, canRetreat) +
    modPillsHtml(allMods) +
    prognoza +
    '<div class="pb-btns">' + btns.join('') + '</div>' +
    noRetreatBar +
    keys +
    '</div>';
  return panel;
}

function buildOverlay(info: PreBattleInfo, cb: PreBattleCallbacks, opts?: PreBattleOptions): HTMLDivElement {
  ensureStyles();
  const canRetreat = info.canRetreat !== false;
  const defaultManual = (opts?.defaultAction ?? 'manual') === 'manual';
  const getBonusy = opts?.getCivBonusy ?? pbCfg.getCivBonusy;

  const isYouAtk = isPlayerSide(info.atakujacy, 'atk', canRetreat);
  const isYouDef = isPlayerSide(info.obronca, 'def', canRetreat);

  const overlay = document.createElement('div');
  overlay.className = 'pb-overlay';

  // TODO (brak danych w kontrakcie): pulsujacy zloty/czerwony znacznik hexa bitwy z
  // makiety wymaga rzutowania wspolrzednych heksa (q,r) na ekran (kamera mapy swiata) --
  // ta warstwa nie jest dostepna z poziomu preBattle.ts (modul nie zna kamery/mapy).
  // Pominieto -- wymagaloby integracji z warstwa render/map, poza zakresem restylingu.

  // TODO (brak danych w kontrakcie): PreBattleUnit nie niesie flagi "wykryty wywiadem",
  // wiec rozroznienie "Nieznany oddzial / wywiad: brak danych" z makiety pominieto --
  // roster wroga renderowany w pelni z dostepnych danych (tak jak dotychczas).

  overlay.innerHTML =
    commanderHtml(info.atakujacy, 'atk', isYouAtk, info.bonusyAtakujacy, getBonusy) +
    commanderHtml(info.obronca, 'def', isYouDef, info.bonusyObronca, getBonusy) +
    rosterHtml(info.atakujacy, 'atk', isYouAtk) +
    rosterHtml(info.obronca, 'def', isYouDef);

  overlay.appendChild(buildDeployPanel(info, canRetreat, defaultManual, !!cb.onSave));

  const dismiss = (): void => hidePreBattle();
  overlay.querySelector('[data-act="cancel"]')?.addEventListener('click', () => { cb.onCancel(); dismiss(); });
  overlay.querySelector('[data-act="auto"]')?.addEventListener('click', () => { cb.onAuto(); dismiss(); });
  overlay.querySelector('[data-act="deploy"]')?.addEventListener('click', () => { cb.onBattlefield(); dismiss(); });
  overlay.querySelector('[data-act="save"]')?.addEventListener('click', () => {
    if (!cb.onSave) return;
    const ok = cb.onSave();
    const tur = info.tura !== undefined ? String(info.tura) : '?';
    showPreBattleSaveToast(overlay, ok ? 'Zapisano · tura ' + tur : 'Zapis nieudany (brak localStorage?)', ok);
  });

  return overlay;
}
