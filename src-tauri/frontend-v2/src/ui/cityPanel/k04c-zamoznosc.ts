/**
 * K04C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1, batch 4a): karta „Zamożność — ściąga”.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56) `buildWealthDetailCard` :4824-4944. 1:1 DOM i tekst.
 * Wszystkie wartosci reguł (cap, prog, mnoznik, zadowolenie, rownowaga, pula, etaW, zamIn, atCap, parametry
 * zamoznosci) przychodza z `CityPanelDto.wealth`, `CityPanelDto.panelInputs.wealth` i `CityPanelK04CDto.zamoznosc`
 * (K04C-Z4). Estymaty „Spółdzielnia / koszt utrzymania” zostaja jak w pinie (zaokraglenie z pieniadza miasta i
 * udzialu) — to prezentacja, nie regula gry.
 */
import type { WealthParamsDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { HANDEL_ZAMOZNOSC_LABEL, signed, tury } from './k01a-fundament';

/** Wejscia karty Zamożność (wszystko z silnika, K04C-Z4). */
export interface ZamoznoscCardInputK {
  /** `CityPanelDto.wealth.poziom` (pin `ws.poziom`). */
  poziom: number;
  /** `panelInputs.wealth.pula` (pin `ws.pula`). */
  pula: number;
  /** `CityPanelDto.wealth.cap` (pin `wealthCap`). */
  cap: number;
  /** `CityPanelDto.wealth.prog` (pin `wealthProg`). */
  prog: number;
  /** `CityPanelDto.wealth.mnoznik` (pin `wealthMnoznik`). */
  mnoznik: number;
  /** `CityPanelDto.wealth.zadowolenie` (pin `wealthZadowolenie`). */
  zadowolenie: number;
  /** `CityPanelDto.wealth.rownowaga` (pin `wealthRownowaga`). */
  rownowaga: number;
  /** `panelInputs.wealth.epoch`. */
  epoch: number;
  /** `panelInputs.wealth.atCap`. */
  atCap: boolean;
  /** `panelInputs.wealth.zamIn` (pin `estimateHandelChips(...).zam`). */
  zamIn: number;
  /** `panelInputs.wealth.etaW` (`null` = brak). */
  etaW: number | null;
  /** `sliders.handel.procentLuksus` (pin `readPodzialHandlu.procentLuksus`). */
  procentLuksus: number;
  /** `labels.danina.mianownik` / `dopelniacz`. */
  daninaLbl: string;
  daninaLblGen: string;
  /** `CityPanelK04CDto.zamoznosc.pieniadzMiasta` (pin `view.pieniadz`). */
  pieniadzMiasta: number | null;
  params: WealthParamsDto;
}

/** Pin :4824-4944 `buildWealthDetailCard`. */
export function buildZamoznoscDetailCardK(i: ZamoznoscCardInputK): HTMLDivElement {
  const p = i.params;
  const { poziom, pula, cap, prog, atCap, epoch, zamIn, etaW } = i;
  const mnoz = i.mnoznik;
  const szcz = i.zadowolenie;
  const daninaLbl = i.daninaLbl;
  const daninaLblGen = i.daninaLblGen;
  const rown = i.rownowaga;
  const pctSpol = i.procentLuksus;
  const miastoMoney = i.pieniadzMiasta;
  const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 100) : null;
  const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney) : null;

  const card = el('div', 'detail-card wealth-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Zamożność — ściąga</span>';
  card.appendChild(head);

  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.textContent = atCap
    ? `W${poziom} · MAX (epoka ${epoch}) · ×Skarb ${mnoz.toFixed(2)}`
    : `W${poziom} · pula ${Math.round(pula)} / ${Math.round(prog)} · ×Skarb ${mnoz.toFixed(2)}`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pasek w panelu pokazuje tylko postęp puli do następnego poziomu W — jak spichlerz dla wzrostu ludności. ' +
    `Część ${daninaLblGen} (suwak Zamożność) trafia do puli; wyższy W mnoży pieniądze do skarbca, ale utrzymanie W też kosztuje.`;
  card.appendChild(intro);

  appendDetailSection(card, 'Co oznaczają liczby');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Pasek (główny widok)', atCap
    ? 'Pełny — osiągnięto max W w tej epoce'
    : `${Math.round(pula)} / ${Math.round(prog)} — ile zebrano z puli potrzebnej do W${poziom + 1}`);
  gridDetailRow(g0, 'W (poziom Wealth)', `W${poziom} — poziom zamożności obywateli (max W${cap} w epoce ${epoch}). Wyższe W = bogatsze miasto i bonus do szczęścia co 10 poziomów.`);
  gridDetailRow(g0, '×Skarb (mnożnik)', `×${mnoz.toFixed(2)} — ile razy mnożony jest strumień pieniędzy do skarbca przy obecnym W. W1 = ×1,00 (bez bonusu); każdy kolejny poziom W podnosi mnożnik.`);
  gridDetailRow(g0, 'Próg awansu', atCap
    ? 'Brak — cap epoki'
    : `${Math.round(prog)} 💰 w puli → awans na W${poziom + 1} (zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli)`);

  appendDetailSection(card, 'Stan miasta');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Poziom W', `W${poziom} (max W${cap} w epoce ${epoch})`);
  gridDetailRow(g1, 'Pula zamożności', `${Math.round(pula)} / ${Math.round(prog)} do W${Math.min(cap, poziom + 1)}`);
  gridDetailRow(g1, 'Postęp paska', atCap
    ? 'Maks. poziom zamożności w tej epoce'
    : `→ W${poziom + 1}: ${Math.round(pula)} / ${Math.round(prog)} (${Math.round(prog > 0 ? (pula / prog) * 100 : 0)}%)`);
  gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(2).replace('.', ',')}`);
  gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz)} zadowolonych`);
  gridDetailRow(g1, 'Kolejny poziom W', atCap
    ? 'Maks. poziom w tej epoce'
    : (etaW != null
      ? `W${poziom + 1} za ok. ${etaW} ${tury(etaW)} przy ~${zamIn} 💰/turę do puli (udział „Zamożność” w ${daninaLblGen})`
      : 'Brak wpływu do puli — zwiększ udział „Zamożność” w podziale handlu'));

  appendDetailSection(card, 'Wzory');
  appendDetailFormula(card, `×Skarb = max(1, 1 + (W−1) × ${p.mnoznikNaPoziom})`);
  appendDetailFormula(card, `Próg W(L→L+1) = ${p.progNaPoziom} × (L+1) × epoka`);
  appendDetailFormula(card, 'Utrzymanie = rownowaga(W) × pieniądz_miasta');
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
