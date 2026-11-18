STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI dyplomacji, wyłącznie prezentacja)
TEMAT: R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 (obrona, runda 2 po FAIL Evaluatora)
GOAL: plansze umów: na widoku tylko liczby decyzyjne, werdykt i przyciski; wyjaśnienia w tooltipach; SZYBKA WYMIANA na górze audiencji.
BAZA: 98c988d7c (origin/main); punkt startowy obrony: 9873f99de (kandydat r1).

ZMIANY-COMMIT: gałąź autobot/R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1, commit w sekcji RUNDY poniżej (SHA końcowy w polu sha).
Allowlista: gra/src/ui/diplomacyAcceptanceBalance.ts, gra/src/ui/diplomacyTipText.ts, gra/src/ui/diplomacyTradeBasket.ts, gra/tools/diplo-deal-boards-declutter-tooltips-test.cjs, gra/tools/terminology-trade-vs-tax-test.cjs. Brak zmian logiki gry.

ODPOWIEDZI NA ZARZUTY EVALUATORA
1. REGRESJA [D] (terminology-trade-vs-tax-test): PRZYJMUJĘ. Asercja przepisana na tooltip: wymaga `detailTipAttr([mode === 'once' ? … : …])` w resourceTradeModeHtml i braku `<p class="cdb-sub cdb-res-mode-hint">`. Wynik: 798 pass / 1 fail; jedyny fail to [G] gen-building-cards-top5 (building-cards-top5.json NIEZGODNY z generatorem), plik nie tknięty; czerwony już na bazie wg Evaluatora (nie mierzyłem ponownie na bazie).
2. dealDurationSub widoczny pod „Czas umowy”: PRZYJMUJĘ. Opis przeniesiony z `<p class="cdb-sub">` do tooltipa etykiety `<label for="cdb-deal-turns">` (detailTipAttr([sub])). Wynik: diplomacy-cyclic-trade-duration-ui-test 12/12 PASS; diplomacy-trade-era-dom-test 58/0.
3. Luka testowa R6 / główny panel renderPnBalancePanelHtml: PRZYJMUJĘ.
   a) Dodane testy: widoczny tekst głównego panelu ≤160 zn. bez fraz wyjaśniających (wszystkie OK), tooltip bilansu niesie „Relacja z perspektywy AI 55,3” i traktat, widoczne są „My oddajemy / Oni oddają / Brakuje u nich”.
   b) Asercje źródłowe: szybka wymiana (da-quickdeal-row) renderowana PRZED paskiem akcji (`actionBarHtml(st,'top')` przed `actionBarHtml(st,'bar')`); podpis „auto-uczciwa oferta” tylko w tooltipie.
   c) Podpowiedź (hint) powtarzająca werdykt („Brakuje u nich: Brakuje 89 PW”) przeniesiona do tooltipa, gdy jej treść już stoi w werdykcie.
   d) ZNALEZIONA REGRESJA KANDYDATA: plainTextFromHtml gubiło atrybut title zagnieżdżonych dymków (Cena pokoju, Wpływ Relacji). Naprawa: nowy helper plainTextWithTitles w diplomacyTipText.ts. Wykryte przez diplo-weariness-pw-row-ui-test (u4), który na kandydacie miał 2 FAIL, teraz 15/0.
   e) NIE ZROBIONO: mutacji (kopii pliku) dla głównego panelu. Dodano tylko asercje na widoczny tekst i tooltip.

NIEZMIENIONE TESTY-BAZA (ta sama liczba FAIL na 9873f99de, zmierzone na bazie):
- diplomacy-relation-deal-text-consistent-test: 5 pass / 1 fail
- diplomacy-acceptance-points-test: 302 pass / 2 fail
- dyplo-bilans-gate-n-e1-reprodukcja-runda2-test: FAIL (0a) mutacja A (29 vs 30) — dług bazowy, nie dotyczy UI

TESTY (surowe wyniki, ten commit):
- node tools/diplo-deal-boards-declutter-tooltips-test.cjs: 13 pass, 0 fail (w tym mutacja: wyjaśnienie wraca na planszę → czerwień)
- node tools/diplo-weariness-pw-row-ui-test.cjs: 15 pass / 0 fail (było 13/2 na kandydacie)
- node tools/terminology-trade-vs-tax-test.cjs: 798 pass / 1 fail ([G], dług bazowy)
- node tools/diplomacy-cyclic-trade-duration-ui-test.cjs: 12/12 PASS
- node tools/diplomacy-trade-era-dom-test.cjs: 58 pass / 0 fail
- node tools/diplomacy-relation-labels-test.cjs: 23 pass / 0 fail; diplomacy-stol-pw-sum-test: 168 pass / 0 fail; diplomacy-bilans-unifikacja-test: 27 PASS / 0 FAIL
- tsc --noEmit (gra): exit 0

NIE ZMIERZONO:
- Chromium / zrzuty PRZED i PO / zrzut z tooltipem: NIE ZMIERZONO. Powód: na dysku 1,8 GB wolne (96%), node_modules podpięte symlinkiem z worktree wf_412e64bc (do usunięcia przy sprzątaniu, nie commitowane).
- Build vite i audiencja: NIE ZMIERZONO.
- Zrzuty PNG testów nie są w commicie (testy modyfikują zrzuty w runs/P-DYPLO-...; przywrócone `git checkout`).

BLOKADY: brak blokad kodu. Wymagane żywe potwierdzenie układu (Chromium) przed READY — do zrobienia przez orkiestratora lub kolejną rundę.

RUNDY: 2/5 (runda 1 = kandydat 9873f99de, runda 2 = ta obrona). Ostatni werdykt: FAIL (Evaluator, 3 zarzuty).

UWAGI-DLA-ORKIESTRATORA
- Duplikacja wyjaśnień nadal istnieje w innych oknach (poza zakresem r1: część 2 Q2).
- Wartość `hint` w trybie traktatu (responderPreview.reason) może być długa; przy powtórzeniu w werdykcie jest już ukryta.

NASTĘPNY KROK: ponowna ocena Evaluatora (bramka: tsc 0, 5 bramek referencyjnych, testy UI bez regresji).
DEPLOY/PUSH: NIE WYKONANO

## Runda 3 (odpowiedź na zarzuty Evaluatora 80b9a63f6)

Start: 80b9a63f6 (potomek bazy 98c988d7c). Gałąź: autobot/R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1-r3.

- Zarzut 1 (zrzuty pełnej gry): NIE ZMIERZONO. Brak zrzutu okna „Umowa wymiany surowców”, paska akcji z SZYBKĄ WYMIANĄ i dymka hover w żywej audiencji w tej rundzie. Dowód SZYBKIEJ WYMIANY na górze pozostaje sprawdzeniem po źródle (test). Zrzuty PW pokoju z r2 nie są dowodem gry.
- Zarzut 2 (natywny title): ODRZUCAM. Okno koszyka ma klasę `civ-diplo-basket` (diplomacyTradeBasket.ts, box.className ok. linii 2499 i 2618); hudTitleTooltip.ts SCOPE_SELECTOR zawiera `.civ-diplo-aud` i `.civ-diplo-basket` (linie 51-52); resolveTarget i przeniesienie title do `data-civ-ori-title` (linie 152-162) zdejmują natywny dymek i pokazują dymek gry. Hover w żywej grze, fokus i dotyk: NIE ZMIERZONO.
- Zarzut 3 (hint „Poniżej progu fair min” na planszy): ODRZUCAM. Hint w span `.da-pn-bal-hint` to wyłącznie `Brakuje N PW` / `Nadwyżka N PW` / `Równo — spełnia` (diplomacyAcceptanceBalance.ts, ok. linii 787-790). Zdanie „Poniżej progu fair min (…) — ryzyko odrzucenia” jest w `verdict` (ok. linii 794) i trafia tylko do `title` (detailTip). Test FORBIDDEN_ON_BOARD sprawdza widoczny tekst.
- Zarzut 4 (przeredagowany tekst bazy): PRZYJMUJĘ. Przywrócone brzmienie 1:1 „(baza 80, Relacja −10,4% siła)” (treatyBaseDetailText); asercja w diplomacy-acceptance-points-test.cjs dopasowana (linia 612).
- Zarzut 5 (tooltip PW zniknął z liczby Bilans; title „Baza traktatu”): PRZYJMUJĘ. PW_EXCHANGE_TOOLTIP dodany na początku detailTip liczby Bilans we wszystkich trzech panelach. Dawny `title="Baza traktatu"` był w pwAmountWithBaseHtml, która nie jest używana; treść bazy jest w tooltipie przez treatyBaseDetailText.
- Zarzut 6 (podtytuł gift/trade widoczny): PRZYJMUJĘ. Na planszy zostaje tylko „partner: <nazwa>”. Opis trybu (gift „Oddajesz bez towaru w zamian · Rel ≥ …”, trade „Wymiana dwustronna”, treaty „Ustal warunki…”) i „Wymagana Relacja” idą do title podtytułu (diplomacyTradeBasket.ts, subExplain/subTip, również wariant treaty-only).
- Zarzut 7 (luźne asercje testu declutter): PRZYJMUJĘ częściowo. Dwie asercje z OR i luźnym regexem zastąpione dokładnymi (tooltip niesie „Relacja z perspektywy AI 55,3” i „(baza 200, Relacja −44,7% siła)”; traktat: „Relacja z perspektywy AI <liczba>” i „(baza <liczba>)”). Pozostałe asercje (np. „fair min” w tooltipie koszyka) nadal szersze; nie zmieniano ich w tej rundzie.
- Zarzut 8 (testy nadpisują tracked png w runs/): PRZYJMUJĘ jako notkę. Przywrócono `git checkout --` zmienionych png w runs/P-DYPLO-BILANS-GATE-… i R-DYPLO-WARUNEK-…; nie wchodzą do commita.
- Zarzut 9 (terminology 798/1): informacyjne. Wynik identyczny na bazie (tabela poniżej).

Pomiary (surowe wyniki; baza = worktree 98c988d7c, kandydat = ta gałąź):

| test | baza 98c988d7c | kandydat r3 |
|---|---|---|
| terminology-trade-vs-tax-test | 798 pass / 1 fail | 798 pass / 1 fail |
| dyplo-bilans-gate-n-e1-reprodukcja-test | 21 PASS / 1 FAIL | 21 PASS / 1 FAIL |
| dyplo-pakt-ekspansja-granica-test | 22/26 | 22/26 |
| dyplo-warunek-niespelniony-czerwony-tooltip-test | 22/26 | 22/26 |

Kandydat r3, pozostałe: tsc --noEmit exit 0; diplo-deal-boards-declutter-tooltips-test 13 pass / 0 fail; diplomacy-acceptance-points-test 304 pass / 0 fail; diplomacy-relation-deal-text-consistent-test 6 pass / 0 fail; diplomacy-trade-era-dom-test 58 pass / 0 fail.
Testy live (4 timeouty 60 s na kandydacie r2): baza NIE ZMIERZONO; nie uruchamiano ich w tej rundzie.

Środowisko: gra/node_modules to dowiązanie do katalogu w scratchpadzie (npm ci tam, gitignored).

UWAGI-DLA-ORKIESTRATORA: worktree bazy w scratchpadzie (base-98c) do usunięcia przy sprzątaniu. Część 2 nie ruszana. Brak DECISION_REQUIRED.
RUNDY: 3/5 (Operator Haiku; licznik porażek Haiku tematu = 2, decyzja o Sonnet należy do orkiestratora).
NASTĘPNY KROK: Evaluator (to samo ID), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
