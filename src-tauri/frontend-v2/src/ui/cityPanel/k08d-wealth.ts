/**
 * K08D-4b (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, partia `wealth`): karta „Zamożność" i panel z pinu
 * `edb8fb56` (`gra/src/ui/cityPanel.ts`) — `renderWealth` (:4775-4823) i `buildWealthDetailCard` (:4824-4945).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08d-port.mjs --batch wealth` (bloki = pin, `k08d-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08d-copies.mjs`.
 * Reguły zamożności = delegaty `k08d-deps.ts` (P5.13); pasek = `k08d-wealth-pasek.ts`.
 */

import { el, appendDetailAlgo, appendDetailSection, gridDetailRow } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { HANDEL_ZAMOZNOSC_LABEL, signed, tury } from './k01a-fundament';
import { appendSectionTitleWithDetails } from './k08b-title';
import {
  cfg, daninaLabelForCity, daninaLabelGenitive, freshWealthState, readPodzialHandlu, type City, type GameData,
} from './k05b-host';
import { appendWealthCompactStrip } from './k08d-wealth-pasek';
import {
  loadWealthParams, wealthCap, wealthMnoznik, wealthProg, wealthRownowaga, wealthZadowolenie, type WealthParams,
} from './k08d-deps';

// ─── Jednostki K08D, partia k08d-wealth.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:4775-4822
export function renderWealth(mount: HTMLElement, city: City, data: GameData | null, view: CityView | null = null): void {
  mount.innerHTML = '';
  const ws = city.wealthState ?? freshWealthState();
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const wealthParams = data
    ? loadWealthParams(data.econParams, cfg.difficulty ?? 'normal')
    : null;

  appendSectionTitleWithDetails(mount, '<span>Zamożność</span>', () => {
    if (!wealthParams) {
      const c = el('div', 'detail-card');
      c.appendChild(el('div', 'dc-note', 'Brak danych parametrów zamożności.'));
      return c;
    }
    return buildWealthDetailCard(city, ws, epoch, wealthParams, view, data);
  });

  if (!wealthParams) return;

  const cap = wealthCap(epoch, wealthParams);
  const prog = wealthProg(ws.poziom, epoch, wealthParams);
  const atCap = ws.poziom >= cap;
  const mnoz = wealthMnoznik(ws.poziom, wealthParams);
  const szBonus = wealthZadowolenie(ws.poziom, wealthParams, epoch);
  const pct = atCap ? 100 : (prog > 0
    ? Math.round(Math.min(100, Math.max(0, (ws.pula / prog) * 100)))
    : 0);
  const daninaLblGen = daninaLabelGenitive(daninaLabelForCity(city));
  const zamIn = view && data ? estimateHandelChips(view, readPodzialHandlu(city, data)).zam : 0;
  const etaW = !atCap && prog > ws.pula && zamIn > 0
    ? Math.max(1, Math.ceil((prog - ws.pula) / zamIn))
    : null;

  appendWealthCompactStrip(mount, {
    poziom: ws.poziom,
    atCap,
    cap,
    epoch,
    mnoz,
    szBonus,
    pula: ws.pula,
    prog,
    pct,
    etaW,
    zamIn,
    daninaLblGen,
  });
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:4824-4944
export function buildWealthDetailCard(
  city: City,
  ws: { poziom: number; pula: number },
  epoch: number,
  p: WealthParams,
  view: CityView | null,
  data: GameData | null,
): HTMLDivElement {
  const cap = wealthCap(epoch, p);
  const prog = wealthProg(ws.poziom, epoch, p);
  const mnoz = wealthMnoznik(ws.poziom, p);
  const szcz = wealthZadowolenie(ws.poziom, p, epoch);
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);
  const rown = wealthRownowaga(ws.poziom, epoch, p);
  const podzial = readPodzialHandlu(city, data);
  const pctSpol = podzial.procentLuksus;
  const miastoMoney = view?.pieniadz ?? null;
  const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 100) : null;
  const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney) : null;
  const zamIn = view && data ? estimateHandelChips(view, readPodzialHandlu(city, data)).zam : 0;
  const atCap = ws.poziom >= cap;
  const etaW = !atCap && prog > ws.pula && zamIn > 0
    ? Math.max(1, Math.ceil((prog - ws.pula) / zamIn))
    : null;

  const card = el('div', 'detail-card wealth-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Zamożność — ściąga</span>';
  card.appendChild(head);

  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.textContent = ws.poziom >= cap
    ? `W${ws.poziom} · MAX (epoka ${epoch}) · ×Skarb ${mnoz.toFixed(2)}`
    : `W${ws.poziom} · pula ${Math.round(ws.pula)} / ${Math.round(prog)} · ×Skarb ${mnoz.toFixed(2)}`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pasek w panelu pokazuje tylko postęp puli do następnego poziomu W — jak spichlerz dla wzrostu ludności. ' +
    `Część ${daninaLblGen} (suwak Zamożność) trafia do puli; wyższy W mnoży pieniądze do skarbca, ale utrzymanie W też kosztuje.`;
  card.appendChild(intro);

  appendDetailSection(card, 'Co oznaczają liczby');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Pasek (główny widok)', ws.poziom >= cap
    ? 'Pełny — osiągnięto max W w tej epoce'
    : `${Math.round(ws.pula)} / ${Math.round(prog)} — ile zebrano z puli potrzebnej do W${ws.poziom + 1}`);
  gridDetailRow(g0, 'W (poziom Wealth)', `W${ws.poziom} — poziom zamożności obywateli (max W${cap} w epoce ${epoch}). Wyższe W = bogatsze miasto i bonus do szczęścia co 10 poziomów.`);
  gridDetailRow(g0, '×Skarb (mnożnik)', `×${mnoz.toFixed(2)} — ile razy mnożony jest strumień pieniędzy do skarbca przy obecnym W. W1 = ×1,00 (bez bonusu); każdy kolejny poziom W podnosi mnożnik.`);
  gridDetailRow(g0, 'Próg awansu', ws.poziom >= cap
    ? 'Brak — cap epoki'
    : `${Math.round(prog)} 💰 w puli → awans na W${ws.poziom + 1} (zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli)`);

  appendDetailSection(card, 'Stan miasta');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Poziom W', `W${ws.poziom} (max W${cap} w epoce ${epoch})`);
  gridDetailRow(g1, 'Pula zamożności', `${Math.round(ws.pula)} / ${Math.round(prog)} do W${Math.min(cap, ws.poziom + 1)}`);
  gridDetailRow(g1, 'Postęp paska', ws.poziom >= cap
    ? 'Maks. poziom zamożności w tej epoce'
    : `→ W${ws.poziom + 1}: ${Math.round(ws.pula)} / ${Math.round(prog)} (${Math.round(prog > 0 ? (ws.pula / prog) * 100 : 0)}%)`);
  gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(2).replace('.', ',')}`);
  gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz)} zadowolonych`);
  gridDetailRow(g1, 'Kolejny poziom W', atCap
    ? 'Maks. poziom w tej epoce'
    : (etaW != null
      ? `W${ws.poziom + 1} za ok. ${etaW} ${tury(etaW)} przy ~${zamIn} 💰/turę do puli (udział „Zamożność” w ${daninaLblGen})`
      : 'Brak wpływu do puli — zwiększ udział „Zamożność” w podziale handlu'));

  appendDetailSection(card, 'Wzory');
  appendDetailFormula(card, `×Skarb = max(1, 1 + (W−1) × ${p.mnoznikNaPoziom})`);
  appendDetailFormula(card, `Próg W(L→L+1) = ${p.progNaPoziom} × (L+1) × epoka`);
  appendDetailFormula(card, `Utrzymanie = rownowaga(W) × pieniądz_miasta`);
  appendDetailFormula(card, `Równowaga(W) = ${Math.round(p.utrzymanieBaza * 100)}% + (W/cap)×(${Math.round(p.utrzymaniePrzyCap * 100)}%−${Math.round(p.utrzymanieBaza * 100)}%)`);

  appendDetailSection(card, 'Skąd bierze się pula');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, `Suwak ${HANDEL_ZAMOZNOSC_LABEL}`, `${pctSpol}% udziału ${daninaLblGen}`);
  if (miastoMoney !== null) {
    gridDetailRow(g2, 'Pieniądz miasta', `${signed(miastoMoney)} 💰`);
    if (spolEst !== null) gridDetailRow(g2, '→ do puli zamożności', `~${signed(spolEst)}`);
    if (utrzymEst !== null) gridDetailRow(g2, '→ koszt utrzymania W', `~${signed(utrzymEst)}`);
    if (spolEst !== null && utrzymEst !== null) {
      const net = spolEst - utrzymEst;
      gridDetailRow(g2, 'Saldo puli', `${signed(net)} (${net >= 0 ? 'rośnie' : 'maleje'})`);
    }
  } else {
    gridDetailRow(g2, 'Pieniądz miasta', '— (brak podglądu tury)');
  }

  appendDetailSection(card, 'Mechanika');
  const g3 = appendDetailGrid(card);
  gridDetailRow(g3, 'Awans', `Pula ≥ próg → W+1, zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli`);
  gridDetailRow(g3, 'Spadek', 'Gdy pula spadnie poniżej 0 → W−1 (bufor wyczerpany)');
  gridDetailRow(g3, 'Równowaga W', `${Math.round(p.utrzymanieBaza * 100)}%→${Math.round(p.utrzymaniePrzyCap * 100)}% pieniędzy (W0→cap)`);
  gridDetailRow(g3, 'Szczęście', `W=0: ${p.karaZero}; dalej floor(W × ${p.zadowolenieMax} / cap epoki) — max +${p.zadowolenieMax} w każdej epoce (cap ${cap})`);

  appendDetailAlgo(card, 'Kolejność ticku zamożności', [
    `Wejście: strumień z ${daninaLblGen} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) — nie trafia do skarbca.`,
    'Koszt utrzymania = rownowaga(W) × pieniądz brutto miasta tej tury.',
    `Pula += wpływ z ${daninaLblGen} − utrzymanie. Gdy pula < 0 → pula=0 i W−1.`,
    'Dopóki pula ≥ próg awansu i W < cap: W+1, pula −= próg, pula ×= zachowanie po awansie.',
    'Mnożnik skarbca rośnie z poziomem W — stosowany do pieniędzy miasta (nie do nauki).',
  ]);

  appendDetailAlgo(card, 'Skąd bierze się wpływ do puli', [
    `${daninaLbl} brutto z pól + bonus Targowiska → handelNetto (po korupcji, opcjonalnie ×Waluta).`,
    `Podział ${daninaLblGen}: %${HANDEL_ZAMOZNOSC_LABEL} × handelNetto → wpływ do puli zamożności.`,
    `Więcej % na Skarb = mniej ${HANDEL_ZAMOZNOSC_LABEL} = wolniejszy W, ale więcej 💰 od razu.`,
    `Więcej % na ${HANDEL_ZAMOZNOSC_LABEL} = szybszy W, ale mniej gotówki — ×Skarb rośnie z opóźnieniem.`,
  ]);

  const note = el('div', 'dc-note');
  note.textContent =
    `Trade-off: więcej % na ${HANDEL_ZAMOZNOSC_LABEL} = wolniejszy skarbiec dziś, ale wyższe W jutro mnoży podatki. ` +
    `Więcej % na Skarb = gotówka teraz, zamożność stoi w miejscu lub spada.`;
  card.appendChild(note);
  return card;
}
// pin-end
