/**
 * K08D-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1, partia `handel`): karta szczegółów „Podział Daniny"
 * (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`) — `buildHandelDetailCard` (:10845-11005) oraz helpery pinu
 * `ownerHasMennica` (:1322-1330) i `activeTradeRouteCountForCity` (:11045-11054).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08d-port.mjs --batch handel` (bloki = pin, `k08d-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08d-copies.mjs`.
 * Reguły gry (parametry korupcji, mnożnik Waluty+Mennicy, premia tras, biblioteka) = delegaty `k08d-deps.ts`
 * (P5.13: UI ich nie liczy; wartości z hosta przez `controller/k08dWiring.ts`).
 */

import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { HANDEL_KORUPCJA_PCT_PLACEHOLDER, HANDEL_ZAMOZNOSC_LABEL } from './k01a-fundament';
import { cfg, daninaLabelForCity, daninaLabelGenitive, readPodzialHandlu, type City, type GameData } from './k05b-host';
import {
  buildEconParams, cityHasBibliotekaLine, computeTradeRouteBuildingBonusByCity, daninaLabelAccusative,
  mennicaGate, mnoznikHandelPieniadzForCivByDifficulty,
} from './k08d-deps';

// ─── Jednostki K08D, partia k08d-handel.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:1322-1330
export function ownerHasMennica(ownerId: number): boolean {
  const cities = cfg.getCities?.() ?? [];
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const ids = cfg.getBuiltBuildingIds?.(c.id) ?? [];
    if (ids.includes('mennica')) return true;
  }
  return false;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11045-11054
export function activeTradeRouteCountForCity(city: City): number {
  const all = cfg.getTradeRoutes?.() ?? [];
  let n = 0;
  for (const route of all) {
    if (route.status !== 'polaczony') continue;
    if (!route.budynekOdblokowany) continue;
    if (route.fromCityId === city.id || route.toCityId === city.id) n++;
  }
  return n;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10845-11005
export function buildHandelDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
): HTMLDivElement {
  const split = readPodzialHandlu(city, data);
  const params = data ? buildEconParams(data, cfg.difficulty ?? 'normal') : null;
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maTargowisko = built.includes('targowisko');
  // Pytanie 71/C (Maciej 2026-07-25): Mennica stoi wyłącznie w stolicy (pytanie
  // 70/B) -> bramka Efektu 1 patrzy na CAŁE imperium, nie tylko to miasto.
  // maMennicaBudynek = budynek fizycznie istnieje (nie burzymy go po utracie
  // złota -- "budynek stoi, efekt śpi", ten sam wzorzec co
  // maMennicaBuiltEmpireWide w turn-economy.ts). Rozdzielone od maDostepDoZlota
  // (PYTANIE 83=B), zeby ponizej dalo sie rozroznic w tekscie DLACZEGO mnoznik
  // nie dziala: brak Mennicy vs brak Waluty vs Mennica usnieta bez zlota.
  const gateMennica = mennicaGate(city.ownerId);
  const maMennicaBudynek = gateMennica.maMennicaBudynek;
  const maBiblioteka = cityHasBibliotekaLine(built);
  // K08D-Z11 (P5.13): Waluta odkryta i dostęp do złota czyta delegat mennicaGate (bez koniunkcji w UI).
  // (walutaOdkryta: wewnątrz delegatu mennicaGate, K08D-Z11)
  // Zadanie 1 (E1) + PYTANIE 83=B: Mennica dziala TYLKO gdy zbudowana
  // (gdziekolwiek w imperium) ORAZ Waluta odkryta ORAZ cywilizacja MA TERAZ
  // dostep do zlota (turn-economy.ts maMennicaEmpireWide && walutaOdkryta) --
  // identyczna bramka jak silnik, zeby panel nigdy nie pokazywal aktywnego
  // mnoznika, ktorego silnik juz nie liczy.
  // (maMennica: koniunkcja wyłącznie w delegacie mennicaGate, K08D-Z11)
  const mennicaAktywna = gateMennica.mennicaAktywna;
  // Mennica fizycznie stoi + Waluta odkryta, ale mnoznik SPI bo brak zlota TERAZ.
  const mennicaSpiZBrakuZlota = gateMennica.mennicaSpiZBrakuZlota;
  // Pytanie 69 (2026-07-25): tekst pokazuje mnoznik CYWILIZACYJNY skalowany
  // trudnoscia (ten sam co realnie liczy silnik), nie plaski params.mennicaMnoznikPoWalucie.
  const civKeyForMennicaTxt = cfg.getCivKey?.(city.ownerId);
  const mennicaMnoznikVal = params
    ? mnoznikHandelPieniadzForCivByDifficulty(civKeyForMennicaTxt, cfg.data?.civs, cfg.difficulty ?? 'normal', params.mennicaMnoznikPoWalucie)
    : undefined;
  const mennicaMnoznikTxt = mennicaMnoznikVal !== undefined ? `×${mennicaMnoznikVal}` : '×?';
  const est = estimateHandelChips(view, split);
  // Decyzje 65B/66B: etykieta widoczna dla gracza (Danina domyslnie, Podatek gdy
  // Waluta+Mennica W STOLICY -- scislejsze niz `mennicaAktywna` powyzej, ktore
  // opisuje REALNY mnoznik ekonomiczny (gdziekolwiek w imperium, patrz komentarz
  // przy `maMennica`) i NIE jest tu zmieniane.
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);
  const daninaLblAcc = daninaLabelAccusative(daninaLbl);
  // DYSPOZYCJA 85 (Maciej 2026-07-26) + T4 (runda 2, naprawa napisu po przebudowie
  // mnoznika): premia za trasy handlowe realnie DOLICZA SIE (addytywnie) do
  // handelBrutto w silniku (economy.ts, ctx.premiaHandluTrasHandlowych -- NIE
  // ruszane tutaj), TYLKO dla tras Z BUDYNKIEM (budynekOdblokowany===true). W UI
  // zostaje WYŁĄCZNIE ta jedna zbiorcza linia (bez listy szlaków, bez nazw
  // partnerów, bez dochodu ze szlaków — to przeniesione do panelu Handel,
  // empireDetailPanel.ts, zgodnie z zasadą rozdziału z dyspozycji).
  const aktywneTrasyCount = activeTradeRouteCountForCity(city);
  const premiaTrasHandlowych = computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes?.() ?? []).get(city.id) ?? 0;

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>Podział ${daninaLblGen} — szczegóły</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    `${daninaLbl} z pól okolicy to osobny strumień 💰. Najpierw odejmujemy stratę (korupcję), potem suwaki dzielą resztę między skarbiec, naukę i ${HANDEL_ZAMOZNOSC_LABEL.toLowerCase()}. Suma suwaków = 100%, kroki 10%.`,
  );
  card.appendChild(intro);

  const todo = el('div', 'dc-note');
  todo.style.cssText = 'font-style:normal;border-left:2px solid var(--gold);padding-left:0.45em;margin-top:0.35em;';
  todo.innerHTML =
    `<b class="gold">Korupcja:</b> dziś to stały procent <b>${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%</b> ${daninaLblGen} brutto. ` +
    'W przyszłej aktualizacji ma zależeć też od odległości miasta od stolicy i liczby miast w imperium.';
  card.appendChild(todo);

  // PYTANIE 83=B: Mennica fizycznie stoi (nie burzymy jej), ale mnoznik SPI bez
  // aktualnego dostepu do zlota -- gracz musi wiedziec DLACZEGO i CO zrobic.
  if (mennicaSpiZBrakuZlota) {
    const mennicaWarn = el('div', 'dc-note');
    mennicaWarn.style.cssText = 'font-style:normal;border-left:2px solid #e08a8a;padding-left:0.45em;margin-top:0.35em;color:#f0c8c8;';
    mennicaWarn.textContent =
      'Mennica nieaktywna: brak Złota w magazynie państwa (Kopalnia złota, szlak handlowy lub zapas). ' +
      'Uzupełnij magazyn Złotem, żeby mnożnik znów zadziałał — budynek nie jest burzony, tylko czeka.';
    card.appendChild(mennicaWarn);
  }

  appendDetailSection(card, 'Korupcja');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, `${daninaLbl} brutto (szac.)`, est.brutto ? `~${est.brutto}` : '—');
  gridDetailRow(g0, 'Strata korupcji', `−${est.korupcja} (${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto)`);
  gridDetailRow(g0, `${daninaLbl} netto`, est.netto ? `~${est.netto} → split suwaków` : '—');
  if (params) {
    gridDetailRow(g0, 'Planowane zmiany', `dystans×${params.korupcjaWspolczynnikDystansu} + miasta×${params.korupcjaWspolczynnikMiast}, cap ${Math.round(params.korupcjaCap * 100)}%`);
  }
  gridDetailRow(
    g0,
    'Premia za trasy handlowe',
    aktywneTrasyCount > 0
      ? `+${Math.round(premiaTrasHandlowych)} Handlu (${aktywneTrasyCount} z budynkiem) — już w brutto powyżej`
      : 'brak tras z budynkiem handlowym',
  );

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Skarb', `${split.procentPieniadz}%${est.skarb ? ` · ~+${est.skarb} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, 'Nauka', `${split.procentNauka}%${est.nauka ? ` · ~+${est.nauka} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, HANDEL_ZAMOZNOSC_LABEL, `${split.procentLuksus}%${est.zam ? ` · ~+${est.zam} → pula` : ' → pula'}`);
  if (view) {
    gridDetailRow(g1, 'Uwaga', `* Pieniądz i Nauka zawierają też budynki (chipy = tylko udział z ${daninaLblGen} netto)`);
  }

  appendDetailFormula(card, `handelBrutto = Σ ${daninaLblGen} pól`
    + (maTargowisko ? ' × (1 + bonus Targowiska)' : '')
    + (aktywneTrasyCount > 0 ? ' + premia tras handlowych (z budynkiem)' : ''));
  appendDetailFormula(card, `strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (dziś: stały %)`);
  appendDetailFormula(card, 'handelNetto = handelBrutto − strataKorupcji' + (
    mennicaAktywna
      ? ` × Waluta+Mennica (${mennicaMnoznikTxt})`
      : mennicaSpiZBrakuZlota
        ? ' × ×1 (Mennica śpi — brak Złota w magazynie)'
        : ' × ×1 (brak Waluty lub Mennicy)'
  ));
  appendDetailFormula(card, 'nauka = floor(handelNetto × %Nauka) + budynki  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, 'skarb_z_handlu = floor(handelNetto × %Skarb)  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, `${HANDEL_ZAMOZNOSC_LABEL} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) → pula zamożności  ← też już zawiera mnożnik`);

  appendDetailAlgo(card, `Algorytm podziału ${daninaLblGen} (cityYieldPerTurn)`, [
    `Zbierz ${daninaLblAcc} ze wszystkich obrabianych pól + centrum miasta.`,
    maTargowisko ? 'Targowisko zwiększa handelBrutto o bonus procentowy.' : 'Bez Targowiska — tylko plony z terenu.',
    aktywneTrasyCount > 0
      ? `Trasy handlowe z budynkiem: +${Math.round(premiaTrasHandlowych)} do handelBrutto (${aktywneTrasyCount} aktywnych — szczegóły szlaków i partnerów w panelu Handel, żeton paska zasobów).`
      : 'Bez aktywnych tras handlowych z budynkiem — brak premii do handelBrutto.',
    `Odejmij korupcję (dziś: stały ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.`,
    'Waluta + Mennica RAZEM (decyzja 2026-07-25) mnożą całe handelNetto — Skarb, Naukę i ' + HANDEL_ZAMOZNOSC_LABEL + ' równocześnie. Sam tech Waluty już NIE wystarcza.',
    `Podziel handelNetto suwakami: Skarb / Nauka / ${HANDEL_ZAMOZNOSC_LABEL} (suma 100%).`,
    mennicaAktywna
      ? `Mennica + Waluta razem mnożą całe ${daninaLbl} netto ${mennicaMnoznikTxt} (Skarb, Nauka i ${HANDEL_ZAMOZNOSC_LABEL} rosną razem).`
      : mennicaSpiZBrakuZlota
        ? `Mennica zbudowana i Waluta odkryta, ale mnożnik ŚPI: brak Złota w magazynie państwa — wraca sam po uzupełnieniu zapasu.`
        : maMennicaBudynek
          ? 'Mennica zbudowana, ale bez Waluty jeszcze nic nie mnoży (bramka: budynek + technologia, obie wymagane).'
          : `Bez Mennicy — ${daninaLbl} netto bez mnożnika, niezależnie od tego czy Waluta jest odkryta.`,
    maBiblioteka ? `Biblioteka dodaje % bonusu do Nauki (łącznie z Nauką z ${daninaLblGen}).` : `Nauka = wyłącznie udział z ${daninaLblGen} + budynki.`,
    `${HANDEL_ZAMOZNOSC_LABEL} nie trafia do skarbca — idzie do puli zamożności miasta.`,
    'Na końcu: mnożnik W mnoży cały pieniądz miasta (Skarb + budynki + Targowisko).',
  ]);

  appendDetailAlgo(card, 'Suwak UI (adjustHandelSplit)', [
    'Zmieniasz jeden suwak — pozostałe dwa dostosowują się proporcjonalnie.',
    'Kroki co 10% (HANDEL_PCT_STEP). Suma zawsze 100%.',
    `Przesunięcie na ${HANDEL_ZAMOZNOSC_LABEL} = mniej 💰 teraz, wyższe W później (×Skarb rośnie z W).`,
    `Przesunięcie na Skarb = więcej 💰 teraz, wolniejszy W lub spadek W przy zbyt niskim udziale ${HANDEL_ZAMOZNOSC_LABEL}.`,
  ]);

  appendDetailSection(card, 'Kontekst kolumny');
  const note = el('div', 'dc-note');
  note.style.fontStyle = 'normal';
  note.textContent =
    `${daninaLbl}, zamożność, racje/wzrost i porządek — ustawienia w tej kolumnie wpływają na każdą turę. ` +
    `Podział ${daninaLblGen} jest per miasto; racje żywności — per miasto (batony 1/2/3).`;
  card.appendChild(note);
  return card;
}
// pin-end
