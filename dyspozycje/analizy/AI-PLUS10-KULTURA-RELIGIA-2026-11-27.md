# AI „Kultura i religia” — wspólna formuła addytywna i osobny poziom AI (R-WEB-CULT-REL-AI-PLUS10-Q1, obrona rundy 3)

Data: 2026-11-27. Ten dokument zastępuje wcześniejsze wersje (runda 2 i pomiar z bazy `44649038c`): ich sekcje „NIE ZMIERZONO” i tabele PRZED/PO są nieaktualne.

- PRZED = origin/main `3608af1ce` (baza gałęzi; zawiera FALE 928–929 AIREBEL). Dzięki temu różnica PRZED/PO obejmuje wyłącznie zmiany tego tematu.
- PO = kandydat `78363f7b0` scalony z origin/main `3608af1ce` (merge), zob. SHA w raporcie `30-obrona-claude.md`.
- Decyzje właściciela 2026-11-27 (potwierdzona tabela): plus G rośnie z epoką, minusy D też rosną z epoką, obie wartości **addytywnie** (nie mnożone przez skalę); gracz i komputer (AI) mają **osobne poziomy** „Kultura i religia”.

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

Poziom gracza steruje minusem i plusem gracza. Poziom AI steruje minusem AI; plus AI jest stały na każdym poziomie (+10 w epoce 1, rośnie z epoką). Poziom `null` (tryb zgodności, stare zapisy bez pola) działa bit-w-bit jak dotąd i linii Prawa nie ma.

Zmiana względem wersji sprzed AI-PLUS10:
- minusy gracza i AI w epokach 2/3 są addytywne (wcześniej mnożone przez skalę: trudny −32 / −46 zamiast −26 / −33; normalny −24 / −34,5 zamiast −21 / −28);
- plus gracza normalnego i trudnego w epokach 2/3 jest addytywny (normalny +11 / +18 zamiast +8 / +11,5; trudny +6 / +13 zamiast 0 / 0);
- poziom łatwy dla gracza daje te same wartości co przed zmianą (−10/−16/−23 i +10/+16/+23).

## Osobny poziom AI (ustawienie nowej gry)

- Kreator: dwa selektory „Kultura i religia” — „dla gracza” i „dla komputera (AI)”. Domyślnie AI = poziom gracza.
- Zapis: pole `advanced.kulturaReligiaLevelAI` obok `kulturaReligiaLevel`. Zapis bez pola AI = poziom gracza.
- Poziom gracza `null` (zgodność) = poziom AI `null`.

## Implementacja (jedna formuła, dwa źródła poziomu)

- `gra/src/game/culture-religion-level.ts`: `cultureReligionLineValue(level, scaleEra, udzial, bounds, ownerIsHuman, basePts)` — jedna gałąź addytywna dla obu właścicieli; `ownerIsHuman` wybiera tylko plus (G gracza albo GAi). `getCulturaReligiaLevelForOwner(ownerIsHuman)` wybiera poziom gracza albo AI.
- `gra/src/game/society-breakdown.ts`: `kultReligLinePoints` — jedno miejsce liczenia linii, używane przez Szczęście i Prawo; `evaluateOrderFromBreakdown` przekazuje typ właściciela.
- `gra/src/main.ts`: zapis, wczytanie i start pola AI (hak startGame: `kulturaReligiaLevelAI`); typ właściciela dla miast AI; `__settingsLive.getSettings` zwraca oba poziomy.
- `gra/src/ui/newGameFlow.ts`: drugi selektor, podsumowanie, opis (tabela addytywna).
- `gra/data/society-params.json` → `kultura_religia_poziomy`: D, G, G_ai na poziom; opis zaktualizowany do formuły addytywnej.

## Testy (stan po scaleniu z origin/main `3608af1ce`, gra/, ta runda)

| Test | Wynik | Uwagi |
|---|---|---|
| `tsc --noEmit` | exit 0 | |
| logic-test | 213 / 213 | |
| tech-tree-test | 20 / 0 | |
| research-test | 33 / 33 | |
| unit-replace-test | exit 0 | |
| combat-test | 6 / 6 | |
| ai-test | 297 / 0 | zgodność dla `null` bez zmian |
| culture-religion-level-test | 108 / 0 | sekcja 8: AI (tabela, rozdział poziomów gracz/AI) |
| ai-plus10-matrix-test | 190 / 0 | macierz 3×3 poziomów × epoki 1–3 |
| ai-plus10-culture-test | 72 / 0 | |
| culture-religion-test | 65 / 0 | |
| society-breakdown-test | 56 OK / 0 FAIL | |
| ai-city-order-need-test | 35 / 0 | |
| ai-city-order-need-wiring-test | 267 / 0 | T0 (AI trudny = 4; AI niezależny od poziomu gracza), T0b (plus AI jednakowy) |
| ai-plus10-wizard-ui-test (Chromium, bundle newGameFlow) | 6 / 0 | dwa selektory, parametry startu `kulturaReligiaLevel=trudny`, `kulturaReligiaLevelAI=latwy`, przeżycie zamknięcia okna |
| newgame-settings-layout-reposition-test | PASS | 14 kart siatki, 18 pozycji okna zaawansowanego; w tej rundzie poprawiono stale komunikaty (były „12 / 13”) — asercje bez zmian |
| ai-plus10-live-roundtrip-test (NOWY, żywa gra, `?civTest=1`) | 4 / 4 | start przez `startNewGame` (REALNY doStartGame) + `saveRoundTrip` (REALNE persistSaveToSlot + loadGameFromSlot): gracz trudny / AI łatwy; gracz łatwy / AI trudny; brak pola AI (= poziom gracza); zgodność (oba `null`). Po wczytaniu ustawienia = przed zapisem we wszystkich scenariuszach |

Mutacje czerwone (wyniki z obron rund 2, NIE powtarzane w rundzie 3; formuła w tej rundzie się nie zmieniła): minus D mnożony zamiast dodawany — czerwone; plus gracza mnożony — czerwone; AI czyta plus gracza — czerwone; AI czyta poziom gracza — czerwone (w macierzy 3×3); typ właściciela ignorowany w `kultReligLinePoints` — culture-level 106 pass / 2 fail, wiring 29 pass / 1 fail; AI czyta poziom gracza — culture-level 103 / 3 fail, wiring 27 / 2 fail; plus AI z G gracza — culture-level 100 / 6 fail.

## Pomiar PRZED / PO (poziom MAKSYMALNY, tym samym runnerem)

Warunki: `gra/tools/ai-cult-rel-measure-run.cjs --pace wysoki --koszt-jednostek wysoki --kr trudny --difficulty trudny --city-state 1 --turns 60` (seed 7: 58 tur, zob. zastrzeżenia). Gra Trudny; Kultura i religia gracza = Trudny; **PRZED** (bazowy bundle `3608af1ce`, jeden poziom) i **PO** (kandydat scalony) z tym samym runnerem. Koszty jednostek = Wysoki (×4). `unitCostPace` w każdym rekordzie = `wysoki` (potwierdzone w 4 biegach).

Surowe dane (jsonl, summary, zestawienie): `dyspozycje/autobot/runs/R-WEB-CULT-REL-AI-PLUS10-Q1/dane/` (`PRZED-s4242.jsonl`, `PO-s4242.jsonl`, `PRZED-s7.jsonl`, `PO-s7.jsonl`, `*.summary.json`, `przed-po-zestawienie-wynik.txt`, skrypt `przed-po-zestawienie.cjs`).

Suma AI (właściciele inni niż człowiek; Porządek śr. = Σ porPctSuma / Σ miasta):

| Wielkość | s4242 PRZED t10 / t30 / t60 | s4242 PO t10 / t30 / t60 | s7 PRZED t10 / t30 / t58 | s7 PO t10 / t30 / t58 |
|---|---|---|---|---|
| Jednostki wojskowe AI | 57 / 118 / **142** | 57 / 172 / **214** | 57 / 111 / **133** | 56 / 190 / **259** |
| Miasta AI | 42 / 68 / **160** | 42 / 126 / **188** | 42 / 71 / **151** | 44 / 127 / **183** |
| Miasta AI poniżej 14% (bunt skrajny) | 14 / 5 / **67** | 0 / 0 / **1** | 15 / 9 / **75** | 0 / 0 / **1** |
| Porządek AI śr. (%) | 19,3 / 34,2 / **19,3** | 65,8 / 62,9 / **55,4** | 20,8 / 31,6 / **19,8** | 65,4 / 66,0 / **52,4** |

Bieg „AI łatwy, gracz trudny” (`--kr-ai latwy`) nie został powtórzony w tej rundzie; PRZED dla tego wariantu nie istnieje (baza nie ma osobnego poziomu AI). Wynik z wcześniejszej rundy nie jest tu powoływany jako dowód.

Wnioski z pomiaru (tylko tury AI, kierunek zgodny na obu ziarnach):
- Porządek AI na poziomie trudnym wzrósł z ~20% do ~52–55% przy t60; miasta AI poniżej progu buntu skrajnego (14%) spadły z 67/75 do 1/0.
- Liczba jednostek wojskowych AI wzrosła o ~50–95% (zgodnie z wcześniejszą diagnozą AICULT: niski Porządek ograniczał produkcję).
- Liczba miast AI wzrosła (mniej buntów).

## Zastrzeżenia do pomiaru (jawne)

- Seed 7: PRZED i PO zmierzone do tury 58 (nie 60). Bieg PO zatrzymał się na turze 58 przez limit czasu polecenia (wiersze 2–58 zapisane); wznowienie ze slotu kończyło się crashem Chromium (SIGSEGV, znany problem harnessu, #90). Bieg PRZED zrobiono świeżo do 58 tury. Porównanie na seedzie 7 jest więc na tym samym horyzoncie (58).
- Różnica PRZED/PO obejmuje całą zmianę tematu: plus AI, addytywny minus AI, addytywne plus i minus gracza (wpływa na miasta gracza, nie na tabelę AI) oraz plumbing poziomu AI. Nie rozdzielono wkładu poszczególnych elementów.
- Mierzone są tury AI. Ruchy gracza sterowane są prostym endTurn z harnessu, więc wynik dla gracza nie jest mierzony.
- Porównanie z dokumentem AICULT (liczby 221/230 jednostek z innego biegu) nie jest dowodem i nie jest tu używane.
- Liczby poniżej progu zależą od dzisiejszego progu 14% (bez zmian).
- Widoki poza turą (panel miasta, `growth-happiness.ts`, `turn-economy.ts`, `conquest-stability.ts`): nie mierzono; tury liczy `evaluateOrderFromBreakdown`.

## Weryfikacja żywa — stan

- Zapis/wczytanie obu pól poziomów w żywej grze: **ZMIERZONE** (`ai-plus10-live-roundtrip-test.cjs`, 4/4, wynik w `dane/live-roundtrip-wynik.txt`).
- Start nowej gry z dwoma różnymi poziomami (przez REALNE doStartGame): **ZMIERZONE** w tym samym teście (odczyt `getSettings`: gracz i AI mają właściwe poziomy).
- Odczyt D/G wartości linii per miasto/właściciel w żywej grze: **NIE ZMIERZONO**. Powód techniczny: brak istniejącego haka zwracającego rozbicie Kultury i Religii per właściciel (`cityOrderState` / `computeHappinessBreakdown` nie są wystawione na `window`). Dodanie haka wymagałoby zmiany `gra/src` poza zakresem tej rundy. Wartości potwierdzone testami funkcji (`ai-plus10-matrix` 190/0, `ai-plus10-culture` 72/0, `culture-religion-level` 108/0). Dług dla orkiestratora.
- Ustawienie zapisu starego formatu (bez pola AI) z dysku: NIE ZMIERZONO na żywo; pokryte pozycją „brak pola AI = poziom gracza” w teście żywym (start bez pola) i testami jednostkowymi wczytania.
- Kreator w przeglądarce: test UI 6/0 (Chromium) po scaleniu; zrzut `dane/kreator-dwa-selektory-kultura.png` z rundy 2.
- Wartości gracza w grze pod nowymi plusami: NIE ZMIERZONO (runner nie steruje ruchami gracza).
- Poziomy łatwy i normalny dla AI w pomiarze PO: NIE ZMIERZONO w tej rundzie (poza biegiem „AI łatwy” z poprzedniej obrony, bez przeliczenia na bazie).
