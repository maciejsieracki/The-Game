"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/.pre-battle-defender-retreat-entry.ts
var pre_battle_defender_retreat_entry_exports = {};
__export(pre_battle_defender_retreat_entry_exports, {
  hidePreBattle: () => hidePreBattle,
  isPreBattleOpen: () => isPreBattleOpen,
  showPreBattle: () => showPreBattle
});
module.exports = __toCommonJS(pre_battle_defender_retreat_entry_exports);

// src/game/civ-bonuses.ts
function isCombatModifierBonus(b) {
  if (b.realizuje !== "walka") return false;
  if (b.typ === "jednostka_specjalna") return false;
  return typeof b.wartosc === "number";
}

// tools/.stubs/pre-battle-brandAssets-stub.ts
function terrainIconSvg() {
  return "";
}
function civIconSvg() {
  return "";
}
function brandIconSvg() {
  return "";
}

// src/battle/battleHudTheme.ts
var PB_SVG = {
  auto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  manual: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  retreat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  commander: '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  unitMounted: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 20c0-6 2-9 6-10l1-3 3 1-1 3c3 1 4 4 4 9"/></svg>',
  unitMelee: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4.5 5 14 14.5M19.5 5 10 14.5"/></svg>',
  unitRanged: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5c8 1 13 6 14 14"/><path d="M5 5v4M5 5h4"/></svg>',
  unitSiege: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20V9l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2v11Z"/><path d="M4 13h16"/></svg>'
};
var ROSTER_CARD_W = 56;
var ROSTER_CARD_GAP = 4;
var ROSTER_MAX_COLS = 6;
var ROSTER_PANEL_EDGE_RESERVE = 0;
function rosterBaseGridWidth(maxCols = ROSTER_MAX_COLS, cardW = ROSTER_CARD_W, gap = ROSTER_CARD_GAP) {
  return maxCols * cardW + Math.max(0, maxCols - 1) * gap;
}
function rosterFixedPanelWidth(hPad = 12) {
  return rosterPanelWidth(rosterBaseGridWidth(), hPad);
}
var ROSTER_PANEL_FIXED_W = rosterFixedPanelWidth(12);
function rosterPanelWidth(gridW, hPad = 16) {
  const inner = gridW / (1 - ROSTER_PANEL_EDGE_RESERVE);
  return Math.ceil(inner + hPad);
}
var BATTLE_SEL_CHEVRON_DATA = 'url("data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23e8d88a" stroke-width="1.8"><path d="M6 9l6 6 6-6"/></svg>'
) + '")';

// tools/.stubs/leaderPortraits-stub.ts
function leaderPortraitUrl() {
  return null;
}
function leaderName() {
  return "";
}

// tools/.stubs/audio-stub.ts
function startPreBattleMusic() {
}
function stopPreBattleMusic() {
}

// tools/.stubs/hud-stub.ts
function setArmyStackHudSuppressed() {
}

// src/ui/preBattle.ts
var overlayEl = null;
var keyHandler = null;
var pbCfg = {};
var saveToastEl = null;
var saveToastTimer = null;
function showPreBattle(info, cb, opts) {
  hidePreBattle();
  overlayEl = buildOverlay(info, cb, opts);
  document.body.appendChild(overlayEl);
  attachKeyboard(cb, info, opts);
  startPreBattleMusic();
  setArmyStackHudSuppressed(true);
}
function hidePreBattle() {
  detachKeyboard();
  clearPreBattleSaveToast();
  if (overlayEl !== null) {
    overlayEl.remove();
    overlayEl = null;
  }
  stopPreBattleMusic();
  setArmyStackHudSuppressed(false);
}
function clearPreBattleSaveToast() {
  if (saveToastTimer !== null) {
    clearTimeout(saveToastTimer);
    saveToastTimer = null;
  }
  if (saveToastEl !== null) {
    saveToastEl.remove();
    saveToastEl = null;
  }
}
function showPreBattleSaveToast(overlay, message, ok) {
  clearPreBattleSaveToast();
  const toast = document.createElement("div");
  toast.className = "pb-toast";
  toast.style.borderColor = ok ? "rgba(122,208,160,.65)" : "rgba(255,112,112,.65)";
  toast.style.background = ok ? "rgba(18,40,28,.96)" : "rgba(40,18,18,.96)";
  toast.style.color = ok ? "#7ad0a0" : "#ff7070";
  toast.textContent = message;
  overlay.appendChild(toast);
  saveToastEl = toast;
  saveToastTimer = setTimeout(() => {
    clearPreBattleSaveToast();
  }, 2500);
}
function isPreBattleOpen() {
  return overlayEl !== null;
}
var styleInjected = false;
function ensureStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement("style");
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
.pb-overlay{position:fixed;inset:0;z-index:9900;font-family:var(--pb-font-ui);color:var(--pb-text);
  user-select:none;pointer-events:none;overflow:hidden;animation:pb-fadeIn .22s ease-out}
.pb-overlay *{box-sizing:border-box}
.pb-overlay button{font:inherit;cursor:pointer}
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
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unitCount(units) {
  return units.reduce((acc, u) => acc + (u.ilosc ?? 1), 0);
}
function unitKind(kategoria) {
  const k = kategoria.toLowerCase();
  if (k.includes("kawaleria") || k.includes("konnica") || k.includes("jezd") || k.includes("mounted")) return "mounted";
  if (k.includes("lucznik") || k.includes("\u0142uk") || k.includes("arc") || k.includes("dystans")) return "ranged";
  if (k.includes("mur") || k.includes("machin") || k.includes("katapult") || k.includes("garnizon")) return "siege";
  return "melee";
}
function unitSvgHtml(kind) {
  if (kind === "mounted") return PB_SVG.unitMounted;
  if (kind === "ranged") return PB_SVG.unitRanged;
  if (kind === "siege") return PB_SVG.unitSiege;
  return PB_SVG.unitMelee;
}
function unitSubtitle(unit) {
  const kind = unitKind(unit.kategoria);
  if (kind === "mounted") return "Szar\u017Ca +" + String(unit.moc ?? unit.atak);
  if (kind === "ranged") return "Zasi\u0119g 2 \xB7 Atk " + String(unit.atak);
  if (kind === "siege") return "Obrona " + String(unit.atak);
  return "Atak " + String(unit.atak);
}
function isPlayerSide(side, role, canRetreat) {
  if (side.ownerId !== void 0) return side.ownerId === 0;
  return canRetreat ? role === "atk" : role === "def";
}
function roleLabel(role, isPlayer) {
  const base = role === "atk" ? "Atakuj\u0105cy" : "Obro\u0144ca";
  if (isPlayer) return base + " \u2014 Ty";
  if (role === "atk") return base + " \u2014 Wr\xF3g";
  return base;
}
function bonusChipTexts(bonusy) {
  const out = [];
  for (const b of bonusy) {
    if (!isCombatModifierBonus(b)) continue;
    const text = (b.opis ?? "").trim();
    if (!text) continue;
    out.push(text);
  }
  return out;
}
function resolveSideBonusy(side, explicit, getCivBonusy) {
  if (explicit?.length) return explicit;
  if (side.ownerId !== void 0 && getCivBonusy) return getCivBonusy(side.ownerId);
  return [];
}
function defaultVerdict(atkPct) {
  if (atkPct >= 65) return "Przewaga atakuj\u0105cego";
  if (atkPct <= 35) return "Przewaga obro\u0144cy";
  return "Szanse umiarkowane";
}
function retreatUiEnabled(info) {
  return info.canRetreat !== false || info.defenderCanRetreat === true;
}
function attachKeyboard(cb, info, opts) {
  const showRetreat = retreatUiEnabled(info);
  const defaultManual = (opts?.defaultAction ?? "manual") === "manual";
  keyHandler = (e) => {
    if (e.key === "Escape" && showRetreat) {
      e.preventDefault();
      cb.onCancel();
      hidePreBattle();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (defaultManual) cb.onBattlefield();
      else cb.onAuto();
      hidePreBattle();
    }
  };
  document.addEventListener("keydown", keyHandler);
}
function detachKeyboard() {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
}
var PB_ICON_DEPLOY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
var PB_ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/></svg>';
var PB_ICON_NO_RETREAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>';
var PB_ICON_DOT = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';
function unitRowHtml(unit) {
  const kind = unitKind(unit.kategoria);
  const qty = unit.ilosc ?? 1;
  const hpPct = unit.maxHp > 0 ? Math.max(0, Math.min(100, Math.round(unit.hp / unit.maxHp * 100))) : 100;
  const hpColor = hpPct > 50 ? "#4caf50" : hpPct > 20 ? "#d0a030" : "#c84040";
  const name = esc(unit.nazwa) + (qty > 1 ? " \xD7" + String(qty) : "");
  const vetHtml = unit.veteranBadge ? '<span class="pb-vet">' + esc(unit.veteranBadge) + "</span>" : "";
  return '<div class="pb-uc"><span class="pb-ic">' + unitSvgHtml(kind) + '</span><span class="pb-m"><span class="pb-nm">' + name + '</span><span class="pb-sub">' + esc(unitSubtitle(unit)) + '</span><span class="pb-hpb"><i style="width:' + String(hpPct) + "%;background:" + hpColor + '"></i></span>' + vetHtml + "</span></div>";
}
var PB_ROSTER_MAX = 8;
function rosterHtml(side, role, isYou) {
  const total = unitCount(side.units);
  const label = isYou ? "Twoje wojska" : side.nazwa || "Wr\xF3g";
  const shown = side.units.slice(0, PB_ROSTER_MAX);
  const hidden = side.units.length - shown.length;
  const rows = shown.map((u) => unitRowHtml(u)).join("");
  const more = hidden > 0 ? '<div class="pb-more">+' + String(hidden) + " wi\u0119cej\u2026</div>" : "";
  const sideCls = isYou ? "pb-you" : "pb-foe";
  const posCls = role === "atk" ? "pb-l" : "pb-r";
  return '<div class="pb-roster ' + sideCls + " " + posCls + '"><div class="pb-rlbl">' + esc(label) + " \xB7 " + String(total) + '</div><div class="pb-rcards">' + rows + "</div>" + more + "</div>";
}
function commanderHtml(side, role, isYou, explicit, getBonusy) {
  const total = unitCount(side.units);
  const civ = esc(side.cywilizacja ?? side.nazwa);
  const who = esc(side.wodz ?? side.nazwa);
  const sideCls = isYou ? "pb-you" : "pb-foe";
  const posCls = role === "atk" ? "pb-l" : "pb-r";
  const bonusy = resolveSideBonusy(side, explicit, getBonusy);
  const chipTexts = bonusChipTexts(bonusy);
  const chipsHtml = chipTexts.length ? '<div class="pb-bonuses">' + chipTexts.map((t) => '<span class="pb-bchip">' + PB_ICON_DOT + esc(t) + "</span>").join("") + "</div>" : "";
  const portraitUrl = side.isBarbarian || side.isCityState ? null : leaderPortraitUrl(side.civId, side.era ?? 1);
  const porInner = portraitUrl ? '<img src="' + esc(portraitUrl) + '" alt="">' : side.isBarbarian ? brandIconSvg("chip-death", 27) : side.isCityState ? civIconSvg(side.civId ?? "", 27) : PB_SVG.commander;
  const leader = side.isBarbarian ? null : side.wodz ?? leaderName(side.civId, side.era ?? 1);
  const leaderHtml = leader ? '<div class="pb-leader">' + esc(leader) + "</div>" : "";
  return '<div class="pb-cmd ' + sideCls + " " + posCls + '"><span class="pb-por">' + porInner + '</span><div><div class="pb-role">' + civ + " \xB7 <b>" + roleLabel(role, isYou) + "</b></div>" + leaderHtml + '<div class="pb-who">' + who + '</div><div class="pb-cnt">' + String(total) + " oddzia\u0142\xF3w</div>" + chipsHtml + "</div></div>";
}
function oddsHtml(info, canRetreat) {
  const atkPct = Math.max(0, Math.min(100, Math.round(info.szanseAtkPct)));
  const defPct = 100 - atkPct;
  const isYouAttacker = isPlayerSide(info.atakujacy, "atk", canRetreat);
  const tyPct = isYouAttacker ? atkPct : defPct;
  const foePct = 100 - tyPct;
  const werdykt = (info.werdykt ?? defaultVerdict(atkPct)).toLowerCase();
  const label = canRetreat ? "Szansa zwyci\u0119stwa" : "Szansa obrony";
  return '<div class="pb-odds"><div class="pb-bar"><span class="pb-yf" style="width:' + String(tyPct) + '%"></span><span class="pb-ff" style="width:' + String(foePct) + '%"></span><span class="pb-mk" style="left:' + String(tyPct) + '%"></span></div><div class="pb-lbl"><span>' + label + ": <b>" + String(tyPct) + "%</b> Ty</span><span>" + String(foePct) + "% wr\xF3g \xB7 " + esc(werdykt) + "</span></div></div>";
}
function modPillsHtml(items) {
  if (!items.length) return "";
  const pills = items.map((m) => {
    const t = m.typ ?? "neu";
    const cls = t === "pos" ? "pb-pos" : t === "neg" ? "pb-neg" : "pb-neu";
    const prefix = t === "pos" ? "\u25B2 " : t === "neg" ? "\u25BC " : "";
    const text = prefix + m.tekst + (m.wartosc ? " " + m.wartosc : "");
    return '<span class="pb-pill ' + cls + '">' + esc(text) + "</span>";
  }).join("");
  return '<div class="pb-mods">' + pills + "</div>";
}
function metaHtml(info) {
  const parts = [];
  parts.push(
    '<span class="pb-ter">' + terrainIconSvg(info.teren, 13) + "Teren: " + esc(info.teren) + "</span>"
  );
  if (info.tura !== void 0) {
    parts.push("<span>Tura <b>" + String(info.tura) + "</b></span>");
  }
  return '<div class="pb-meta">' + parts.join("<span>\xB7</span>") + "</div>";
}
function buildDeployPanel(info, canRetreat, defaultManual, hasSave) {
  const defenderCanRetreat = info.defenderCanRetreat === true;
  const showRetreat = canRetreat || defenderCanRetreat;
  const place = info.miejsce ?? info.lokacja ?? info.teren;
  const kicker = canRetreat ? "ROZSTAWIENIE BITWY" : "WR\xD3G ATAKUJE";
  const title = (canRetreat ? "Atakujesz: " : "Broni si\u0119: ") + esc(place);
  const allMods = [...info.modyfikatory ?? [], ...info.warunki ?? []];
  const deployLabel = canRetreat ? "Bitwa" : "Bro\u0144 si\u0119 \u2014 rozstawienie";
  const deployIcon = canRetreat ? PB_ICON_DEPLOY : PB_ICON_SHIELD;
  const btns = [];
  if (showRetreat) {
    btns.push('<button type="button" class="pb-btn pb-danger" data-act="cancel">' + PB_SVG.retreat + "Wycofaj</button>");
  }
  btns.push('<button type="button" class="pb-btn" data-act="auto">' + PB_SVG.auto + "Auto</button>");
  btns.push('<button type="button" class="pb-btn pb-primary" data-act="deploy">' + deployIcon + esc(deployLabel) + "</button>");
  if (hasSave) {
    btns.push('<button type="button" class="pb-btn" data-act="save">Zapisz</button>');
  }
  const noRetreatBar = showRetreat ? defenderCanRetreat && !canRetreat ? '<div class="pb-note">Wycofaj \u2014 uniknij walki (jednostka cofa si\u0119 na s\u0105siedni heks)</div>' : "" : '<div class="pb-noretreat">' + PB_ICON_NO_RETREAT + "Wycofanie niedost\u0119pne \u2014 to wr\xF3g wybra\u0142 bitw\u0119 (obro\u0144ca nie mo\u017Ce uciec)</div>";
  const enterLabel = defaultManual ? deployLabel : "Auto";
  const keysParts = ["<b>Enter</b> = " + esc(enterLabel)];
  if (showRetreat) keysParts.push("<b>Esc</b> = Wycofaj");
  if (hasSave) keysParts.push("<b>Zapisz</b> dost\u0119pny przed bitw\u0105");
  const keys = '<div class="pb-keys">' + keysParts.join(" \xB7 ") + "</div>";
  const prognoza = info.prognoza ? '<div class="pb-note">' + esc(info.prognoza) + "</div>" : "";
  const panel = document.createElement("div");
  panel.className = "pb-deploy";
  panel.innerHTML = '<div class="pb-hd"><div class="pb-kick">' + kicker + '</div><div class="pb-ttl">' + title + "</div>" + metaHtml(info) + '</div><div class="pb-bd">' + oddsHtml(info, canRetreat) + modPillsHtml(allMods) + prognoza + '<div class="pb-btns">' + btns.join("") + "</div>" + noRetreatBar + keys + "</div>";
  return panel;
}
function buildOverlay(info, cb, opts) {
  ensureStyles();
  const canRetreat = info.canRetreat !== false;
  const defaultManual = (opts?.defaultAction ?? "manual") === "manual";
  const getBonusy = opts?.getCivBonusy ?? pbCfg.getCivBonusy;
  const isYouAtk = isPlayerSide(info.atakujacy, "atk", canRetreat);
  const isYouDef = isPlayerSide(info.obronca, "def", canRetreat);
  const overlay = document.createElement("div");
  overlay.className = "pb-overlay";
  overlay.innerHTML = commanderHtml(info.atakujacy, "atk", isYouAtk, info.bonusyAtakujacy, getBonusy) + commanderHtml(info.obronca, "def", isYouDef, info.bonusyObronca, getBonusy) + rosterHtml(info.atakujacy, "atk", isYouAtk) + rosterHtml(info.obronca, "def", isYouDef);
  overlay.appendChild(buildDeployPanel(info, canRetreat, defaultManual, !!cb.onSave));
  const dismiss = () => hidePreBattle();
  overlay.querySelector('[data-act="cancel"]')?.addEventListener("click", () => {
    cb.onCancel();
    dismiss();
  });
  overlay.querySelector('[data-act="auto"]')?.addEventListener("click", () => {
    cb.onAuto();
    dismiss();
  });
  overlay.querySelector('[data-act="deploy"]')?.addEventListener("click", () => {
    cb.onBattlefield();
    dismiss();
  });
  overlay.querySelector('[data-act="save"]')?.addEventListener("click", () => {
    if (!cb.onSave) return;
    const ok = cb.onSave();
    const tur = info.tura !== void 0 ? String(info.tura) : "?";
    showPreBattleSaveToast(overlay, ok ? "Zapisano \xB7 tura " + tur : "Zapis nieudany (brak localStorage?)", ok);
  });
  return overlay;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hidePreBattle,
  isPreBattleOpen,
  showPreBattle
});
