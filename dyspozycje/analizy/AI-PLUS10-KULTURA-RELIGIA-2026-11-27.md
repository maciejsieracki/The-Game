# AI „Kultura i religia” — wspólna formuła addytywna i osobny poziom AI (R-WEB-CULT-REL-AI-PLUS10-Q1, runda 2)

Data: 2026-11-27. Baza kodu: origin/main `44649038c`. Kandydat rundy 2: `c2152fdbf` (kod i testy), na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (ten dokument w commicie raportu).
Decyzje właściciela 2026-11-27 (DODATKI 1–3 i potwierdzenie tabeli): plus G rośnie z epoką, minusy D też rosną z epoką, obie wartości **addytywnie** (nie mnożone przez skalę); gracz i AI mają **osobne poziomy** „Kultura i religia”.

## Reguła (obowiązuje dla gracza i AI)

Δ = x_epoki − x_epoki1 (0 / +6 / +13, z `szczescie_skala_kultura_religia` 10/16/23).
- minus przy 0% własnej: `D_e = D − Δ` (D wg poziomu **podmiotu**)
- plus przy 100% własnej: `G_e = G_podmiotu + Δ`
- wartość linii = `D_e + (G_e − D_e) · udział_własnej` (Kultura i Religia osobno; każda do Szczęścia i do Prawa)

| Wartość (epoki 1 / 2 / 3) | Łatwy (Mały wpływ) | Normalny (Neutralny) | Trudny (Duży wpływ) |
|---|---|---|---|
| Minus D — gracz i AI | −10 / −16 / −23 | −15 / −21 / −28 | −20 / −26 / −33 |
| Plus G — GRACZ (hotseat: każdy człowiek) | +10 / +16 / +23 | +5 / +11 / +18 | 0 / +6 / +13 |
| Plus G — AI (każdy poziom) | +10 / +16 / +23 | +10 / +16 / +23 | +10 / +16 / +23 |

Poziom gracza steruje minusem i plusem gracza. Poziom AI steruje minusem AI; plus AI jest stały (+10 w epoce 1, rośnie z epoką). Poziom `null` (tryb zgodności, stare zapisy bez pola) działa bit-w-bit jak dotąd i linii Prawa nie ma.

Zmiana względem rundy 1 i względem wersji sprzed AI-PLUS10:
- minusy gracza i AI w epokach 2/3 są teraz addytywne (wcześniej mnożone przez skalę: np. trudny −32 / −46 zamiast −26 / −33; normalny −24 / −34,5 zamiast −21 / −28);
- plus gracza normalnego i trudnego w epokach 2/3 jest addytywny (normalny 11 / 18 zamiast 8 / 11,5; trudny 6 / 13 zamiast 0 / 0);
- poziom łatwy dla gracza daje te same wartości co przed zmianą (−10/−16/−23 i +10/+16/+23).

## Osobny poziom AI (ustawienie nowej gry)

- Kreator: dwa selektory „Kultura i religia” — „dla gracza” i „dla komputera (AI)”. Domyślnie AI = poziom gracza.
- Zapis: pole `advanced.kulturaReligiaLevelAI` obok `kulturaReligiaLevel`. Stary zapis bez pola AI = poziom gracza.
- Gracz `null` (zgodność) = AI `null`.

## Implementacja (jedna formuła, dwa źródła poziomu)

- `gra/src/game/culture-religion-level.ts`: `cultureReligionLineValue(level, scaleEra, udzial, bounds, ownerIsHuman, basePts)` — jedna gałąź addytywna dla obu właścicieli; `ownerIsHuman` wybiera tylko plus (G gracza albo GAi). `getCulturaReligiaLevelForOwner(ownerIsHuman)` wybiera poziom gracza albo AI.
- `gra/src/game/society-breakdown.ts`: `kultReligLinePoints` — jedno miejsce liczenia linii, używane przez Szczęście i Prawo; `evaluateOrderFromBreakdown` przekazuje typ właściciela.
- `gra/src/main.ts`: zapis, wczytanie i start pola AI; typ właściciela dla miast AI.
- `gra/src/ui/newGameFlow.ts`: drugi selektor, podsumowanie, opis.
- `gra/data/society-params.json` → `kultura_religia_poziomy`: D, G, G_ai na poziom; opis zaktualizowany do formuły addytywnej.

## Testy

| Plik | Wynik (ta runda) | Uwagi |
|---|---|---|
| `gra/tools/culture-religion-level-test.cjs` | 59 / 0 | 10 oczekiwanych wartości gracza w epokach 2/3 zmienionych na addytywne (przed → po: trudny e2 −32→−26, trudny e3 −46→−33, normalny e2 +8→+11, trudny Prawo/Szczęście e3 religia −23→−10) |
| `gra/tools/ai-plus10-culture-test.cjs` | 72 / 0 | 1 oczekiwanie zmienione (gracz trudny 100% e2: 0→+6); dodane: +13 e3, −26 e2, normalny +11 e2 |
| `gra/tools/ai-plus10-matrix-test.cjs` | 190 / 0 | tabela gracza przepisana do formuły addytywnej; macierz 3×3 poziomów × epoki 1–3 przez pełne Szczęście |
| `gra/tools/culture-religion-test.cjs` | 65 / 0 | bez zmiany asercji |
| `gra/tools/society-breakdown-test.cjs` | 56 OK / 0 FAIL | bez zmiany asercji |
| `gra/tools/ai-city-order-need-test.cjs` | 35 / 0 | bez zmiany asercji |
| `gra/tools/ai-city-order-need-wiring-test.cjs` | 231 / 0 | bez zmiany asercji |
| `tsc --noEmit` | exit 0 | |
| logic / tech-tree / research / combat | 213/213 · 20/0 · 33/0 · 6/6 | |
| unit-replace (6 plików) | 21/21 · 51 OK · 40 · 25 OK · 32 PASS · live panel NIE ZMIERZONO | |
| ai-test | 297 / 0 | bez zmian (zgodność dla `null`) |

Mutacje czerwone (kod przywracany po każdej; wynik = liczba nieudanych asercji w trzech testach: level / ai-plus10-culture / matrix):
- M1 — minus D mnożony przez skalę zamiast dodawany: 7 / 1 / 36 — czerwone.
- M2 — plus gracza mnożony przez skalę: 4 / 3 / 16 — czerwone.
- M3 — AI używa plusu gracza (G zależne od poziomu gracza): 0 / 21 / 30 — czerwone (level-test nie testuje AI).
- M4 — AI czyta poziom gracza: 0 / 0 / 19 — czerwone, ale tylko w macierzy 3×3 (ai-plus10-culture-test tego nie wychwytuje).

## Pomiar PRZED / PO (poziom MAKSYMALNY)

Warunki (wszystkie biegi tym samym runnerem `gra/tools/ai-cult-rel-measure-run.cjs --unit-flow 1 --city-state 1`, 60 tur, Chromium headless, bundle vite zbudowany z odpowiedniego źródła):
- gra Trudny, Kultura i religia gracza = Trudny, Kultura i religia AI = Trudny (AI domyślnie = poziom gracza; brak osobnego biegu „AI łatwy”, patrz NIE ZMIERZONO), Koszty jednostek = Wysoki (×4) (`--pace wysoki`), seed 4242 i 7.
- PRZED = baza `44649038c` (przed AI-PLUS10). PO = kandydat `c2152fdbf`.
- Surowe dane poza repo: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aiplus10/r2/` (pre-4242, post-4242, pre-7, post-7; `seed*.jsonl`, `summary.json`). Zestawienie: `gra/tools/ai-cult-rel-measure-flow.cjs`.

Suma AI (owner > 0), tura 60:

| Wielkość | s4242 PRZED | s4242 PO | s7 PRZED | s7 PO |
|---|---|---|---|---|
| Miasta AI | 153 | 188 | 149 | 189 |
| Jednostki wojskowe AI | 159 | **205** | 138 | **265** |
| Puste miasta (0 wojska) | 56 (37%) | 56 (30%) | 59 (40%) | 35 (19%) |
| Porządek śr. (PorPct), t60 | 21,2 | **55,6** | 19,1 | **52,9** |
| Miasta poniżej 14% (bunt skrajny), t60 | 60 (39%) | **0** | 75 (50%) | **0** |
| Porządek śr., t10 | 19,3 | **65,8** | 20,8 | **65,4** |
| Miasta poniżej 14%, t10 | 14 | 0 | 15 | 0 |
| Nowe jednostki AI (t2–60) | 208 | 273 | 202 | 288 |
| Skarbiec AI, t60 | 3 731 | 7 478 | 4 375 | 12 492 |
| Utrata miast AI (AI→AI) | 30 | 26 | 27 | 33 |

Oś czasu jednostek AI (t10 / t20 / t30 / t40 / t50 / t60):
- PRZED s4242: 57 / 76 / 118 / 179 / 142 / 159
- PO s4242: 57 / 95 / 159 / 249 / 201 / 205
- PRZED s7: 57 / 70 / 111 / 187 / 138 / 138
- PO s7: 56 / 98 / 191 / 267 / 257 / 265

Odniesienie z dispatcha (diagnoza AICULT, PRZED bez kultury trudnej): jednostki 221 (s4242) i 230 (s7). PO jest na tym poziomie lub powyżej dla s7 (265 vs 230) i nieco poniżej dla s4242 (205 vs 221). Poziomy odniesienia pochodzą z innego biegu i są podane do porównania, nie jako dowód.

Zastrzeżenia do pomiaru:
- Różnica PRZED/PO obejmuje całą zmianę od bazy `44649038c`: plus AI, addytywny minus AI, addytywne plus i minus gracza (wpływa na miasta gracza, nie na tę tabelę) oraz plumbing poziomu AI. Nie rozdzielono wkładu poszczególnych elementów.
- Mierzone są tury AI. Ruchy gracza sterowane są prostym endTurn z harnessu (bez autopilota), więc wynik dla gracza nie jest mierzony; w szczególności „gracz trudny” w sensie nowych plusów nie jest zmierzony osobnym biegiem.
- Porządek AI t60 w PO jest wyższy o ~35 pkt; liczba miast i jednostek rośnie. Nie stwierdzono buntów skrajnych ani rebelii (bunt 0–1 w obu wariantach, rebelia 0).
- Nie zmierzono skutków w widokach poza turą (panel miasta, `growth-happiness.ts`, `turn-economy.ts`, `conquest-stability.ts`): nie dostały typu właściciela i mogą pokazywać wartości gracza dla miast AI. Tury liczy `evaluateOrderFromBreakdown`, więc wynik pomiaru tego nie dotyczy.

## NIE ZMIERZONO

- Weryfikacja UI kreatora w przeglądarce (dwa selektory, zrzut, odczyt D/G przez hak civTest, zapis i wczytanie pól przez UI) — NIE WYKONANA w tej rundzie. Zapis/wczytanie pól obu poziomów pokryte testem macierzy.
- Bieg „AI łatwy, gracz trudny” (seed 4242) — runner ustawia tylko poziom gracza (`startGame({kulturaReligiaLevel})`); poziom AI nie jest przekazywany przez hak `__nnsMeasureDebug`. Wymaga zmiany haka w `main.ts` poza zakresem tej rundy.
- Bieg gracza (wartości gracza w grze pod nowymi plusami) — NIE ZMIERZONO.
- Pozostałe poziomy (łatwy, normalny dla AI) — NIE ZMIERZONO (decyzja: maksymalny poziom).

## Runda 3 — pomiar PRZED/PO z `--pace wysoki` (tabela domyka rundę 2)

Warunki: runner `gra/tools/ai-cult-rel-measure-run.cjs --pace wysoki --koszt-jednostek wysoki --kr trudny --kr-ai trudny --city-state 1 --unit-flow 1 --difficulty trudny --turns 60`. `unitCostPace` w każdym rekordzie = `wysoki` (potwierdzone w jsonl). PRZED = baza `44649038c` (osobny build z `git archive`). PO = kandydat z merge `3aff4be25` (origin/main 99375f77e scalony; kod gry identyczny z `85b8e79a9`, różnica to tylko test kreatora). Surowe dane poza repo (scratchpad, `seed*.jsonl`). Liczby z jsonl przez `summ.py`: miasta AI = suma `miasta` właścicieli ≠ 0/−1; jednostki AI = suma `jednostkiWojskowe`; poniżej progu = suma `ponizejProgu` z `cityState` (AI); Porządek śr. = Σ`porPctSuma` / Σ`miasta` (AI).

| Wielkość | s4242 PRZED t10/t30/t60 | s4242 PO t10/t30/t60 | s7 PRZED t10/t30/t60 | s7 PO t10/t30/t60 |
|---|---|---|---|---|
| Jednostki wojskowe AI | 57 / 118 / **159** | 57 / 172 / **214** | 57 / 111 / **138** | 56 / 190 / **262** |
| Miasta AI | 42 / 68 / **153** | 42 / 126 / **187** | 42 / 71 / **149** | 44 / 127 / **184** |
| Miasta AI poniżej 14% | 14 / 6 / **60** | 0 / 0 / **1** | 15 / 9 / **75** | 0 / 0 / **0** |
| Porządek AI śr. (%) | 19,3 / 33,9 / **21,2** | 65,8 / 62,9 / **55,4** | 20,8 / 31,6 / **19,1** | 65,4 / 66,0 / **51,8** |

Dodatkowy bieg „AI łatwy, gracz trudny” (PO, seed 4242, `--kr trudny --kr-ai latwy`): t10 57 jedn. / 0 poniżej / Porządek 68,7; t30 183 / 0 / 65,0; t60 **236** jedn., 193 miasta AI, 1 poniżej progu, Porządek 57,4. PRZED dla tego wariantu NIE ZMIERZONO (baza nie ma osobnego poziomu AI).

Zastrzeżenia:
- Baza `44649038c` nie zawiera FALI 928–929 (AIREBEL: bunt AI). Różnica PRZED/PO obejmuje więc także tę zmianę, której efekt na miasta poniżej progu nie został odizolowany.
- Pomiar nie rozdziela wkładu plusa AI, minusa AI i addytywnej formuły gracza.
- Wartości gracza w grze NIE ZMIERZONO (runner nie steruje ruchami gracza; brak haka odczytu breakdown).
- Liczby poniżej progu zależą od wartości dzisiejszego progu 14% (bez zmian, zgodnie z dispatchem).

## Runda 3 — weryfikacja żywa i zapis (stan)

- Odczyt D/G (civTest) gracz/AI w żywej grze: NIE ZMIERZONO. Powód techniczny: brak istniejącego haka zwracającego rozbicie Kultury i Religii per miasto/właściciel; dodanie haka wymagałoby zmiany `gra/src` poza wykonaną tu zmianą. Wartości potwierdzone testami jednostkowymi (`ai-plus10-matrix` 190/0, `ai-plus10-culture` 72/0, `culture-religion-level` 108/0).
- Round-trip zapisu/wczytania (`kulturaReligiaLevelAI`): kod sprawdzony przeglądem. `setCulturaReligiaLevel(gracz, AI)` zapisuje AI = poziom gracza, gdy pola brak; `null` (zgodność) zostaje `null`. Test żywy zapisu NIE ZMIERZONO.
- Kreator w przeglądarce: zrzut i test wizard-UI 6/0 z poprzedniej rundy; ponowna weryfikacja po merge NIE ZMIERZONO.
