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

// tools/.army-merge-dismiss-entry.ts
var army_merge_dismiss_entry_exports = {};
__export(army_merge_dismiss_entry_exports, {
  activeUnitStack: () => activeUnitStack,
  assignBounceHexesForUnits: () => assignBounceHexesForUnits,
  exitGarnizon: () => exitGarnizon,
  hideArmyMergePanel: () => hideArmyMergePanel,
  isArmyMergePanelOpen: () => isArmyMergePanelOpen,
  showArmyMergePanel: () => showArmyMergePanel
});
module.exports = __toCommonJS(army_merge_dismiss_entry_exports);

// tools/.stubs/brandAssets-stub.ts
function unitIconSvg() {
  return "";
}

// src/ui/formatPl.ts
function formatJednostkiCount(n) {
  const word = n === 1 ? "jednostka" : n >= 2 && n <= 4 ? "jednostki" : "jednostek";
  return `${n} ${word}`;
}
function formatArmiaLabel(n) {
  return `Armia \u2014 ${formatJednostkiCount(n)}`;
}

// src/ui/armyMergePanel.ts
var root = null;
var keyHandler = null;
var STYLE_ID = "civ-army-merge-css-v1";
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes amp-in{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.civ-amp-overlay{
  position:fixed;inset:0;z-index:520;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);animation:amp-in .2s ease-out;
}
.civ-amp{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  --merge:#50b070;--panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(440px,calc(100vw - 28px));max-width:520px;
  background:var(--panel);border:1px solid rgba(232,216,138,0.38);border-radius:14px;
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;animation:amp-in .26s ease-out;
}
.civ-amp *{box-sizing:border-box;}
.civ-amp-hdr{padding:16px 20px 12px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);
  background:linear-gradient(180deg,rgba(232,216,138,0.07),transparent);}
.civ-amp-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
.civ-amp-orn i{display:block;height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-amp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-amp-title{font:700 11px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-amp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-amp-body{padding:16px 18px 14px;display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start;}
.civ-amp-col{border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;background:rgba(255,255,255,0.03);}
.civ-amp-col-h{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-amp-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15);margin-bottom:5px;}
.civ-amp-row:last-child{margin-bottom:0;}
.civ-amp-row-ic{font-size:20px;line-height:1;width:28px;text-align:center;}
.civ-amp-row-meta{flex:1;min-width:0;}
.civ-amp-row-name{font-size:12px;font-weight:700;color:#f0e8b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-amp-row-mv{font-size:10px;color:var(--muted);margin-top:2px;}
.civ-amp-row.new{border-color:rgba(80,176,112,0.35);background:rgba(80,176,112,0.08);}
.civ-amp-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:28px;gap:6px;}
.civ-amp-arrow{font-size:28px;color:var(--gold-dim);line-height:1;}
.civ-amp-mid-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;text-align:center;}
.civ-amp-result{margin:0 18px 12px;padding:8px 12px;border-radius:8px;text-align:center;
  font-size:12px;color:#c8ffd8;background:rgba(80,176,112,0.1);border:1px solid rgba(80,176,112,0.28);}
.civ-amp-foot{padding:0 18px 16px;display:flex;gap:12px;justify-content:space-between;align-items:stretch;}
.civ-amp-btn{flex:1;font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:10px 14px;border:1px solid transparent;text-align:center;min-width:0;}
.civ-amp-btn:hover{filter:brightness(1.08);}
.civ-amp-btn-merge{background:linear-gradient(135deg,rgba(80,176,112,0.85),rgba(50,130,70,0.9));color:#0a120a;border-color:rgba(120,220,140,0.5);}
.civ-amp-btn-sep{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
@media(max-width:480px){
  .civ-amp-body{grid-template-columns:1fr;}
  .civ-amp-mid{padding:4px 0;flex-direction:row;}
  .civ-amp-arrow{transform:rotate(90deg);}
}
`;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unitRowHtml(u, isNew) {
  const mv = u.ruchMax !== void 0 && u.ruchLeft !== void 0 ? u.ruchLeft + "/" + u.ruchMax + " ruch" : "";
  return '<div class="civ-amp-row' + (isNew ? " new" : "") + '"><div class="civ-amp-row-ic">' + (u.icon || unitIconSvg(void 0)) + '</div><div class="civ-amp-row-meta"><div class="civ-amp-row-name">' + esc(u.name) + "</div>" + (mv ? '<div class="civ-amp-row-mv">' + esc(mv) + "</div>" : "") + "</div></div>";
}
function detachKeyboard() {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
}
function closePanel() {
  detachKeyboard();
  if (root) {
    root.remove();
    root = null;
  }
}
function pick(fn) {
  closePanel();
  fn();
}
function hideArmyMergePanel() {
  closePanel();
}
function isArmyMergePanelOpen() {
  return root !== null;
}
function showArmyMergePanel(opts) {
  closePanel();
  ensureStyles();
  const arriveN = opts.arrivingCount ?? 1;
  const total = opts.existing.length + arriveN;
  const resultLabel = formatArmiaLabel(total) + " na " + opts.hexLabel;
  root = document.createElement("div");
  root.className = "civ-amp-overlay";
  root.addEventListener("click", (e) => {
    if (e.target === root) pick(opts.onMerge);
  });
  const box = document.createElement("div");
  box.className = "civ-amp";
  box.innerHTML = '<div class="civ-amp-hdr"><div class="civ-amp-orn"><i></i><span>\u{1F517}</span><i class="r"></i></div><div class="civ-amp-title">Po\u0142\u0105czenie armii</div><div class="civ-amp-sub">Heks ' + esc(opts.hexLabel) + '</div></div><div class="civ-amp-body"><div class="civ-amp-col"><div class="civ-amp-col-h">Na polu (' + opts.existing.length + ")</div>" + (opts.existing.length > 0 ? opts.existing.map((u) => unitRowHtml(u, false)).join("") : '<div class="civ-amp-row-mv" style="padding:4px">\u2014</div>') + '</div><div class="civ-amp-mid"><span class="civ-amp-arrow">\u2192</span><span class="civ-amp-mid-lbl">do\u0142\u0105cza</span></div><div class="civ-amp-col"><div class="civ-amp-col-h">Przybywa</div>' + unitRowHtml(opts.arriving, true) + '</div></div><div class="civ-amp-result">' + esc(resultLabel) + '</div><div class="civ-amp-foot"><button type="button" class="civ-amp-btn civ-amp-btn-sep" data-act="sep">Zostaw osobno</button><button type="button" class="civ-amp-btn civ-amp-btn-merge" data-act="merge">Po\u0142\u0105cz armie</button></div>';
  box.querySelector('[data-act="merge"]')?.addEventListener("click", () => pick(opts.onMerge));
  box.querySelector('[data-act="sep"]')?.addEventListener("click", () => pick(opts.onSeparate));
  box.addEventListener("click", (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);
  keyHandler = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      pick(opts.onMerge);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(opts.onMerge);
    }
  };
  document.addEventListener("keydown", keyHandler);
}

// data/terrain-improvements.json
var terrain_improvements_default = {
  _meta: {
    opis: "Ulepszenia terenu (lane MIASTO: liczby bonusow + koszt + epoka). Gdzie wolno (placement) + render = MAPA. Przeplyw w turze = SILNIK. Koszt w PRACY (z puli Pracy w skarbcu, Q4). Lista uzgodniona z MAPA + uzupelniona na przyszlosc wczesnych epok (2026-06-24). EKONOMIA: dodano surowiecOdblokowany (ASCII) + zasieg_terytorium (2026-06-25).",
    bonus_pola: "zywnosc | praca | handel | pieniadz | kamien | drewno (na obrabiane pole)",
    epoka: "1=Kamien, 2=Braz, 3=Zelazo",
    decyzje_MIASTO: "lodzie_rybackie = TAK teraz; kamieniolom OSOBNO od kopalni (rozne surowce); teren NIE daje +Nauka/+Kultura (te z budynkow/specjalistow/suwaka). Tarasy = +zywnosc (nie kultura).",
    kanon_zywnosc_hodowla: "docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md (2026-06-29 Maciej) \u2014 obowiazuje nad tym plikiem do wdrozenia",
    decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostepu boolean v0.1; zasieg_terytorium: posterunek=5 (epoka 2), fort=10 (epoka 3), miasto=10 (stale); zakladanie kolejnego miasta wymaga Straznica LUB zasiegu obecnego miasta. Rozbieznosci kluczy z resources.json (brak pola id) zapisane w EKONOMIA-ulepszenia-terenu-v01.md.",
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol",
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE (Maciej 2026-07-23, korekta po ECHO placeholdera): Tartak->drewno 4, Kamieniolom->kamien 4, Glinianka->glina 4, Kopalnia miedzi->ruda 2, Kopalnia (zloze zelaza)->ruda_zelaza 2. Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
  },
  farma: {
    nazwa: "Farma",
    epoka: 1,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina; Wzg\xF3rza z lasem",
    warunek: "ziemia uprawna; DZIA\u0141A BEZ rzeki (podstawowy); MO\u017BE na lesie (Las) \u2014 bez wyr\u0119bu (Maciej 2026-07-21)",
    koszt_praca: 20,
    tech: "Rolnictwo",
    odblokowuje: ""
  },
  irygacja: {
    nazwa: "Irygacja",
    epoka: 2,
    bonus: {
      zywnosc: 5
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina, Pustynia",
    warunek: "TYLKO pole s\u0105siaduj\u0105ce z rzek\u0105 (1 pole) lub na rzece \u2014 BRAK \u0142a\u0144cuch\xF3w; kluczowa nad Nilem",
    koszt_praca: 30,
    tech: "Irygacja",
    odblokowuje: ""
  },
  bydlo: {
    nazwa: "Trzoda",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: "bydlo",
    surowiecOdblokowany_uwaga: "ABC-18: dost\u0119p dopiero po postawieniu na z\u0142o\u017Cu trzody",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "plaski l\u0105d; pierwsze: z\u0142o\u017Ce byd\u0142a; potem po odblokowaniu \u2014 bez z\u0142o\u017Ca; + farma lub solo; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Trzoda (Rydwan po odblokowaniu)"
  },
  owce: {
    nazwa: "Owce",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 2
    },
    surowiecOdblokowany: "owce",
    surowiecOdblokowany_uwaga: "pierwsze na zlozu owiec; solo na wzgorzu; bez farmy/bydla",
    teren: "Wzg\xF3rza",
    warunek: "solo wzg\xF3rze; pierwsze: z\u0142o\u017Ce owiec; potem wzg\xF3rze bez z\u0142o\u017Ca po odblokowaniu",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Owce (we\u0142na / jedzenie)"
  },
  lama: {
    nazwa: "Lama",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 3
    },
    surowiecOdblokowany: "lama",
    surowiecOdblokowany_uwaga: "TYLKO Inkowie; solo \u2014 bez innych ulepszen na heksie; pierwsze na zlozu lamy",
    teren: "Wzg\xF3rza, G\xF3ry",
    warunek: "solo; tylko cyw. Inkowie; wzg\xF3rza/g\xF3ry; pierwsze: z\u0142o\u017Ce lamy; NIE na \u0141\u0105ce/R\xF3wninie/Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Lama (transport / \u017Cywno\u015B\u0107)"
  },
  stadnina: {
    nazwa: "Stadnina",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "kon",
    surowiecOdblokowany_uwaga: "ABC-18: tylko na z\u0142o\u017Cu konia + tech Je\u017Adziectwo",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "solo; tylko heks ze z\u0142o\u017Cem konia w terytorium",
    koszt_praca: 28,
    tech: "Je\u017Adziectwo",
    odblokowuje: "Ko\u0144 (jednostki konne)"
  },
  kopalnia: {
    nazwa: "Kopalnia",
    epoka: 1,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "ruda miedzi lub ruda_zelaza (zale\u017Cnie od z\u0142o\u017Ca); plon 2/t z kopalni. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture dla ruda_zelaza (kopalnia na z\u0142o\u017Cu \u017Celaza).",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce rudy miedzi lub \u017Celaza",
    warunek: "wydobycie rudy do magazynu miasta (ruda / ruda_zelaza)",
    koszt_praca: 25,
    tech: "Murarstwo",
    odblokowuje: "Metal/Br\u0105z (jednostki br\u0105zowe, mury)"
  },
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1,
      glina: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. Stawka SUROW-TERYT-01: 4/ture, podniesiona do 5 przy C-SUROW-CEGLA=A (Maciej 2026-07-24, odciazenie cegly wg symulacji -- glina musi nadazyc za Cegielnia 3/ture). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 5,
    teren: "z\u0142o\u017Ce Gliny",
    warunek: "glina \u2192 ceg\u0142a (wa\u017Cne w br\u0105zie)",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "Ceg\u0142a (budynki br\u0105zu)"
  },
  kamieniolom: {
    nazwa: "Kamienio\u0142om",
    epoka: 1,
    bonus: {
      praca: 1,
      kamien: 1
    },
    surowiecOdblokowany: "kamien",
    surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamie\u0144' w resources.json; brak pola id \u2014 propozycja EKONOMIA; UWAGA: 'kamien' pojawia sie rowniez w bonus{} jako efekt plonu \u2014 DANE musi zdecydowac czy bonus.kamien = dostep czy liczba. Stawka SUROW-TERYT-01 (Maciej 2026-07-23, REALNA) = 4/ture.",
    surowiec_ilosc_tura: 4,
    teren: "Wzg\xF3rza, G\xF3ry (kamie\u0144)",
    warunek: "budulec \u2014 mury, budynki",
    koszt_praca: 22,
    tech: "Murarstwo",
    odblokowuje: "Kamie\u0144 (mury / budynki)"
  },
  oboz_lowiecki: {
    nazwa: "Ob\xF3z \u0142owiecki",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      pieniadz: 1
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "dzika zwierzyna nie jest osobnym surowcem w resources.json v0.1 \u2014 brak klucza; plony ekonomiczne (zywnosc+pieniadz) jako substytut",
    teren: "Las / dzika zwierzyna",
    warunek: "dzika zwierzyna",
    koszt_praca: 18,
    tech: "\u0141owiectwo",
    odblokowuje: ""
  },
  wyrab: {
    nazwa: "Wyr\u0105b",
    typ: "wycinka",
    epoka: 1,
    bonus: {},
    surowiecOdblokowany: null,
    teren: "Las",
    warunek: "koszt 5 Pracy na start; plon +5 Drewna \xD7 1 tura (surowiec do puli pa\u0144stwa, Maciej 2026-07-24); potem teren bazowy bez lasu",
    koszt_praca: 5,
    tech: null,
    wycinka: {
      praca_per_tura: 5,
      tury: 1,
      usuwa_nakladke: "las"
    },
    odblokowuje: ""
  },
  tartak: {
    nazwa: "Tartak",
    typ: "ulepszenie",
    epoka: 1,
    bonus: {
      praca: 3
    },
    surowiecOdblokowany: "drewno",
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja -- patrz surowiec_ilosc_tura (REALNA stawka 4/ture, nie placeholder).",
    surowiec_ilosc_tura: 4,
    teren: "L\u0105d w terytorium (\u0142\u0105ka, lasy, wzg\xF3rza\u2026)",
    warunek: "sta\u0142e ulepszenie; MO\u017BE na lesie \u2014 las NIE znika; odblokowuje dost\u0119p do drewna (v0.1 bez ilo\u015Bci)",
    koszt_praca: 25,
    tech: "Obr\xF3bka drewna",
    odblokowuje: "Drewno (TYP 1 \u2014 bez desek, B-SUROW-BUD-03)"
  },
  tarasy: {
    nazwa: "Tarasy uprawne",
    epoka: 2,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "Wzg\xF3rza",
    warunek: "Wzg\xF3rze w terytorium; solo; +\u017Cywno\u015B\u0107; nie na z\u0142o\u017Cu",
    koszt_praca: 25,
    tech: "Rolnictwo",
    odblokowuje: "",
    uwagi: "T-TECH-4 Maciej 2026-07-04: po Rolnictwie \u2014 wszystkie cywilizacje"
  },
  lodzie_rybackie: {
    nazwa: "\u0141odzie rybackie",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "ryby nie sa osobnym surowcem w resources.json v0.1; plony (zywnosc) jako substytut; DANE moze dodac klucz 'ryby' w przyszlosci",
    teren: "Wybrze\u017Ce, Morze (ryby)",
    warunek: "\u0142awica ryb",
    koszt_praca: 20,
    tech: "\u017Begluga",
    odblokowuje: ""
  },
  warzelnia_soli: {
    nazwa: "Warzelnia soli",
    epoka: 2,
    bonus: {
      pieniadz: 1,
      zywnosc: 1
    },
    surowiecOdblokowany: "sol",
    surowiecOdblokowany_uwaga: "klucz 'sol' \u2014 Sol nie ma wpisu w resources.json v0.1 (brak Surowiec='Sol'); propozycja EKONOMIA: dodac 'sol' do resources.json; wymaga uzgodnienia z DANE",
    teren: "Wybrze\u017Ce, z\u0142o\u017Ce soli (hex.zloze=sol)",
    warunek: "s\xF3l \u2014 wy\u0142\u0105cznie wybrze\u017Ce morskie (kanon: z\u0142o\u017Ca soli przy brzegu) lub hex.zloze=sol",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "S\xF3l"
  },
  fort: {
    nazwa: "Fort",
    epoka: 3,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 100,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 10,
    zasieg_terytorium: 10,
    zasieg_kontroli: 10,
    teren: "dowolny l\u0105d w terytorium",
    warunek: "+100% Obrony jednostkom obozuj\u0105cym na polu fortu (bez plon\xF3w); rozszerza zasi\u0119g terytorium o promie\u0144 10 p\xF3l",
    koszt_praca: 25,
    tech: "Wojskowo\u015B\u0107",
    odblokowuje: "",
    uwagi: "ABC-10 Maciej 2026-07-04: Fort (mapa) \u2260 Cytadela (miasto). \u017Belazo ep.3; zasi\u0119g 10; +100% Obrona obozowanie"
  },
  droga: {
    nazwa: "Droga",
    epoka: 1,
    bonus: {
      handel: 1
    },
    surowiecOdblokowany: null,
    teren: "ka\u017Cdy przejezdny heks",
    warunek: "\u0142\u0105czy TYLKO miasta i posterunki (MAPA pilnuje); +szybko\u015B\u0107 ruchu jednostek",
    koszt_praca: 15,
    tech: "Ko\u0142o",
    odblokowuje: ""
  },
  droga_brukowana: {
    nazwa: "Droga brukowana",
    typ: "ulepszenie",
    epoka: 3,
    bonus: {},
    bonus_ruch: 2,
    surowiecOdblokowany: null,
    upgradeFrom: "droga",
    teren: "hex z Drogi",
    warunek: "upgrade Drogi; +2 ruch jednostek; ta sama sie\u0107 dr\xF3g co Droga",
    koszt_praca: 25,
    tech: "Drogi brukowane",
    odblokowuje: "",
    uwagi: "T-TECH-9 Maciej 2026-07-04"
  },
  kopalnia_miedzi: {
    nazwa: "Kopalnia miedzi",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "ruda miedzi (Odlewnia br\u0105zu); plon 2/t z kopalni_miedzi. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture.",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce miedzi (hex.zloze=miedz)",
    warunek: "ruda miedzi \u2192 magazyn (Odlewnia br\u0105zu)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy"
  },
  kopalnia_zlota: {
    nazwa: "Kopalnia z\u0142ota",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "Maciej 2026-07-25: z\u0142oto jest surowcem DOST\u0118POWYM \u2014 bez magazynowania, bez ilo\u015Bci/tur\u0119. W przeciwie\u0144stwie do Kopalni miedzi/kopalni na z\u0142o\u017Cu \u017Celaza, ta Kopalnia NIE zasila \u017Cadnej puli (celowo brak surowiecOdblokowany i surowiec_ilosc_tura) \u2014 liczy si\u0119 wy\u0142\u0105cznie fakt jej istnienia gdziekolwiek w imperium (empireHasKopalniaZlota, game/zloto-access.ts).",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce z\u0142ota (hex.zloze=zloto)",
    warunek: "dost\u0119p imperium do Z\u0142ota (bramka Mennicy) \u2014 bez wydobycia ilo\u015Bciowego",
    koszt_praca: 22,
    tech: "Waluta",
    odblokowuje: "Mennica (dost\u0119p do Z\u0142ota, obok Targowiska w tym mie\u015Bcie)",
    uwagi: "Maciej 2026-07-25: \u201Ez\u0142oto potraktujemy jako surowiec, do kt\xF3rego wystarczy tylko dost\u0119p \u2014 nie trzeba budowa\u0107 wielu kopalni\u201D. Wzorowana na Kopalni miedzi (kopalnia_miedzi) \u2014 dedykowane ulepszenie, tylko na hex.zloze=zloto."
  },
  posterunek: {
    nazwa: "Posterunek (Stra\u017Cnica)",
    epoka: 2,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 50,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 5,
    zasieg_terytorium: 5,
    teren: "l\u0105d w/na kraw\u0119dzi w\u0142asnego zasi\u0119gu",
    warunek: "NIE miasto, BEZ plon\xF3w; ROZSZERZA zasi\u0119g terytorium o promie\u0144 5 p\xF3l; odkrywa mg\u0142\u0119; w\u0119ze\u0142 sieci dr\xF3g; +50% Obrony jednostkom obozuj\u0105cym na polu",
    koszt_praca: 30,
    tech: "-",
    tech_uwaga: "T-TECH-3 Maciej 2026-06-26: bramka AND w kodzie \u2014 Obr\xF3bka drewna + Murarstwo (improvement-tech.ts IMPROVEMENT_MULTI_TECH_REQ)",
    odblokowuje: "",
    uwagi: "Br\u0105z (epoka 2); zasieg_terytorium=5; +50% Obrona w trybie obozowania (decyzja Naster 2026-06-25)"
  },
  _miasto_zasieg_ref: {
    _komentarz: "NOTA (nie ulepsz. terenu): miasto ma zasieg_terytorium=10 (stale, wg dyspozycji EKONOMIA 2026-06-25); helper: okolica.cityRangeForPopulation \u2014 pop<5 r5, pop>=5 r10, pop>=10 r15 (wg memory civ-zasieg-miasta-dynamiczny); zasieg_terytorium=10 to wartosc poczatkowa/bazowa dla zasladania kolejnych miast"
  }
};

// src/game/terrain-improvements.ts
var IMPROVEMENTS = terrain_improvements_default;
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));

// src/map/road-movement.ts
var ROAD_MIN_MOVE_COST = 1 / 3;

// src/units/setup.ts
function keyOf(q, r) {
  return `${q},${r}`;
}
var DEFAULT_TERRAIN_COSTS = {
  ["laka" /* Laka */]: 1,
  ["rownina" /* Rownina */]: 1,
  ["pustynia" /* Pustynia */]: 1,
  ["wybrzeze" /* Wybrzeze */]: Infinity,
  ["wzgorza" /* Wzgorza */]: 2,
  ["gory" /* Gory */]: Infinity,
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };

// src/game/armyMerge.ts
var NEIGH = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1]
];
function visibleStackOnHex(units, q, r, ownerId) {
  return units.filter(
    (u) => u.ownerId === ownerId && u.q === q && u.r === r && u.inGarnizon !== true
  );
}
function activeUnitStack(units, active) {
  if (active.inGarnizon === true) return [active];
  return visibleStackOnHex(units, active.q, active.r, active.ownerId);
}
function exitGarnizon(u) {
  if (u.inGarnizon !== true) return false;
  u.inGarnizon = false;
  u.sentry = false;
  return true;
}
function assignBounceHexesForUnits(units, preferQ, preferR, unitIds, isPassable) {
  const passable = (q, r) => isPassable ? isPassable(q, r) : true;
  const out = /* @__PURE__ */ new Map();
  const virtualOcc = /* @__PURE__ */ new Set();
  const isOccupied = (q, r, exceptId) => {
    const k = keyOf(q, r);
    if (virtualOcc.has(k)) return true;
    return units.some(
      (u) => u.id !== exceptId && !unitIds.includes(u.id) && u.q === q && u.r === r && u.inGarnizon !== true
    );
  };
  const trySpot = (exceptId) => {
    if (!isOccupied(preferQ, preferR, exceptId) && passable(preferQ, preferR)) {
      return { q: preferQ, r: preferR };
    }
    for (const [dq, dr] of NEIGH) {
      const q = preferQ + dq;
      const r = preferR + dr;
      if (!passable(q, r)) continue;
      if (!isOccupied(q, r, exceptId)) return { q, r };
    }
    return null;
  };
  for (const uid of unitIds) {
    const spot = trySpot(uid);
    if (!spot) continue;
    out.set(uid, spot);
    virtualOcc.add(keyOf(spot.q, spot.r));
  }
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activeUnitStack,
  assignBounceHexesForUnits,
  exitGarnizon,
  hideArmyMergePanel,
  isArmyMergePanelOpen,
  showArmyMergePanel
});
