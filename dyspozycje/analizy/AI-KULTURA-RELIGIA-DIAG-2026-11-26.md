# AI „Kultura i religia: trudny” — diagnoza przyczyn (R-WEB-AI-CULT-REL-DIAG-Q1, runda 2 po obronie)

Data: 2026-11-26. Baza: origin/main `5748b924f` (FALA 926). Tylko pomiar i diagnoza: zero zmian reguł, parametrów i balansu.
Runda 2 (obrona po Evaluatorze) wykonuje pomiar PONOWNIE na poziomie MAKSYMALNYM dla wszystkich ustawień i dodaje przepływy miast. Wyniki rundy 1 (tempo „normalny”) są w sekcji „Odniesienie: runda 1” na końcu.

## Pytanie

Na poziomie maksymalnym (gra „Trudny”, Kultura i religia „Trudny”) AI ma ok. 30% mniej jednostek i dużo pustych miast względem trybu zgodności. Ustalić liczbami, która przyczyna to tłumaczy.

## Poziom maksymalny (deklaracja)

- Poziom trudności gry: `trudny` (najwyższy z łatwy / normalny / trudny; `kulturaReligiaLevel` = `trudny`, wariant odniesienia `zgodnosc`).
- Koszty jednostek gracza (`kosztJednostekPace`): `wysoki` (najwyższy z niski / normalny / wysoki, zgodnie z `--pace`). Runda 1 była na `normalny` i jest tylko odniesieniem.
- Poziom Porządku (`society`): `hard` (domyślny runnera; najtrudniejszy z easy / normal / hard).

## Metoda

- Runner `gra/tools/ai-cult-rel-measure-run.cjs`, headless Chromium, żywy bundle vite zbudowany poza repo (`--build 1`), realny `endTurn`, `?civTest=1`.
- Komendy (4 biegi, 60 tur, `--pace wysoki --unit-flow 1 --city-state 1`):
  - `--seed 4242 --kr trudny` i `--seed 4242 --kr zgodnosc` (`--difficulty trudny` w obu),
  - `--seed 7 --kr trudny` i `--seed 7 --kr zgodnosc`.
- Hak tylko do odczytu (`gra/src/main.ts`, za `?civTest=1`):
  - `__aiEconomyMeasure.cityStateTurn(prog)`: per właściciel miasta, bunt skrajny, rebelia, ostrzeżenie, Porządek poniżej progu 14 %, suma PorPct;
  - `__aiEconomyMeasure.cityTransfersLast()` (NOWE w rundzie 2): przejęcia miast od poprzedniej tury (z właściciela na nowego, -99 = rebelianci, -1 = barbarzyńcy);
  - `__aiEconomyMeasure.unitFlowTurn()` (istniejący): nowe id jednostek i przyczyny zejścia.
- Zestawienie przepływów: `gra/tools/ai-cult-rel-measure-flow.cjs` (NOWE, tylko odczyt plików JSONL).
- Dane surowe (poza repo): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aicult-r2/{trudny-4242,zgod-4242,trudny-7,zgod-7}/seed*.jsonl`.
- Odtworzenie zestawienia: `node gra/tools/ai-cult-rel-measure-flow.cjs trudny=<katalog> zgod=<katalog>`.

## Wyniki: tura 60, suma AI (owner > 0), tempo maksymalne (`wysoki`)

| Wielkość | trudny s4242 | zgodn. s4242 | trudny s7 | zgodn. s7 |
|---|---|---|---|---|
| Miasta AI | 153 | 190 (+24%) | 149 | 182 (+22%) |
| Jednostki wojskowe AI | 159 | 221 (+39%) | 138 | 230 (+67%) |
| Jednostki na miasto | 1,04 | 1,16 | 0,93 | 1,26 |
| Puste miasta (0 wojska) | 56 (37%) | 61 (32%) | 59 (40%) | 48 (26%) |
| Porządek śr. (PorPct) | 21,2 | 44,3 | 19,1 | 38,0 |
| Miasta poniżej 14 % (bunt skrajny) | 60 (39%) | 1 | 75 (50%) | 1 |
| Miasta w buncie (flaga `bunt`) | 0 | 0 | 0 | 2 |
| Miasta w rebelii (`rebelState`) | 0 | 0 | 0 | 0 |
| Budynki Prawa (suma) | 25 | 80 | 15 | 48 |
| Budynki Szczęścia (suma) | 75 | 178 | 70 | 135 |
| Skarbiec AI | 3 731 | 6 058 | 4 374 | 4 492 |

Różnica jednostek w t60: −28 % (s4242), −40 % (s7). Przy tempie `normalny` (runda 1) było −31 % i −39 %: luka jest zbliżona, tempo gracza jej nie zmienia.

## Oś czasu (suma AI)

| Tura | s4242 trudny: miasta / jednostki / Porządek | s4242 zgodn. | s7 trudny | s7 zgodn. |
|---|---|---|---|---|
| 10 | 42 / 57 / 19,3 | 42 / 57 / 51,0 | 42 / 57 / 20,8 | 44 / 55 / 49,6 |
| 20 | 48 / 76 / 35,5 | 60 / 91 / 59,7 | 50 / 70 / 36,4 | 65 / 98 / 58,8 |
| 30 | 68 / 118 / 33,9 | 115 / 178 / 51,3 | 71 / 111 / 31,6 | 125 / 184 / 51,1 |
| 40 | 116 / 179 / 26,7 | 165 / 260 / 46,9 | 117 / 187 / 25,2 | 164 / 269 / 46,1 |
| 50 | 135 / 142 / 23,2 | 181 / 215 / 44,5 | 136 / 138 / 21,1 | 175 / 228 / 41,4 |
| 60 | 153 / 159 / 21,2 | 190 / 221 / 44,3 | 149 / 138 / 19,1 | 182 / 230 / 38,0 |

Obserwacja: rozjazd miast pojawia się wcześnie (t30: 68 vs 115 oraz 71 vs 125), zanim jednostki się rozjadą.

## Przepływy (AI, tury 2–60)

| Przepływ | s4242 trudny | s4242 zgodn. | s7 trudny | s7 zgodn. |
|---|---|---|---|---|
| Nowe jednostki (`noweId`: produkcja + zakup RAZEM) | 208 | 278 (+34%) | 202 | 295 (+46%) |
| Zejście: rozwiązane przez AI | 59 | 61 | 69 | 66 |
| Zejście: bez przyczyny (walka itd.) | 1 | 4 | 2 | 7 |
| Zejście: eliminacja właściciela | 1 | 1 | 0 | 1 |
| Zejście: głód / deficyt złota | 0 | 0 | 0 | 0 |
| Miasta AI utracone (AI→AI) | 30 | 28 | 27 | 34 |
| Miasta AI utracone (do gracza / rebeliantów / barbarzyńców) | 0 | 0 | 0 | 0 |
| Utrzymanie jednostek, pieniądz (suma po turach) | 57 344 | 97 536 | 56 720 | 95 632 |
| Utrzymanie budynków, pieniądz (suma po turach) | 35 930 | 67 106 | 34 464 | 62 252 |
| Pierwsza tura z budynkiem Prawa / Szczęścia | 25 / 21 | 32 / 17 | 31 / 9 | 33 / 16 |

Kontrola księgowa (przybliżona, różnice między wariantami): różnica stanu jednostek t60 (trudny minus zgodność) to −62 (s4242) i −92 (s7). Różnica nowych jednostek to −70 i −93, a różnica zejść to +5 i +3 (trudny traci mniej). Składają się więc w przybliżeniu do różnicy stanu, z rezyduum kilku jednostek (liczenie od tury 2). Zejścia przez rozwiązanie są prawie równe w obu wariantach (59 vs 61; 69 vs 66), więc nie tłumaczą luki.

## Odpowiedzi na zarzuty Evaluatora (raport 71782dfe1)

1. **PRZYJMUJĘ.** Pomiar powtórzony na `wysoki` (maksimum). Zapisane ustawienia w sekcji „Poziom maksymalny”. Wyniki `normalny` zostają jako odniesienie (sekcja na końcu).
2. **PRZYJMUJĘ CZĘŚCIOWO, z dopisanymi licznikami.**
   - Dodane w rundzie 2: przejęcia miast per właściciel i per przyczyna (`cityTransfersLast`), pierwsza tura budynków Prawa i Szczęścia (`ai-cult-rel-measure-flow.cjs`).
   - Już wcześniej były: jednostki stracone wg przyczyny, stan miast w buncie i rebelii, utrzymanie per cywilizacja (pieniądz i surowce w rekordzie tury).
   - **NIE ZMIERZONO:** rozdział jednostek kupionych i wyprodukowanych. Wymaga haka w ścieżkach zakupu i produkcji (poza zakresem tego pomiaru, osobny temat). Dlatego liczba `noweId` łączy oba źródła.
   - **NIE ZMIERZONO:** utrzymanie żywnościowe jednostek (pole `utrzymanieJednostekSurowce`) nie zostało zsumowane w tej rundzie.
3. **PRZYJMUJĘ.** Hipoteza „Porządek → produkcja/wzrost” zostaje zdegradowana do hipotezy. Hak mierzy PorPct (procent), a próg niepokoju T1 jest w punktach Porządku (`porzadek_prog_t1` = 1 pkt dla hard). Wejście poniżej T1 nie zostało zmierzone. Kary ×0,80 (produkcja, pieniądz) i ×0,65 (wzrost) pochodzą z `data/society-params.json` (poziom hard), nie z pomiaru. Brak rebelii przy 60 miastach poniżej 14 % (bunt skrajny) pozostaje nierozstrzygnięty.
4. **PRZYJMUJĘ.** Premisa „dużo pustych miast” jest prawdziwa tylko częściowo. W t60 różnica puste/miasta wynosi 37 % vs 32 % (s4242) i 40 % vs 26 % (s7). Liczba miast AI jest też mniejsza w wariancie trudnym, więc udział pustych miast i liczba pustych miast to różne wielkości. Nie tłumaczą one samodzielnie −30 % jednostek.
5. **PRZYJMUJĘ (alternatywa nie odrzucona), z częściowym odrzuceniem.**
   - ODRZUCAM z dowodem: „rozwiązanie przez AI” nie jest przyczyną (59 vs 61; 69 vs 66). Zejścia przez rozwiązanie są równe w obu wariantach.
   - NIE ODRZUCAM: mniej złota na zakup. Skarbiec AI w t40 jest niższy w obu ziarnach (9 581 vs 15 132; 9 873 vs 16 467). W t60 różnica jest niestabilna (3 731 vs 6 058; 4 374 vs 4 492), więc brak potwierdzenia. Utrzymanie jednostek jest niższe o ok. 41 % w obu ziarnach, co jest skutkiem mniejszej liczby jednostek, a nie przyczyną. Rozdział zakupu i produkcji: NIE ZMIERZONO (patrz pkt 2).
6. **PRZYJMUJĘ (poprawki).**
   - (a) Linia haka: w tej rundzie `cityStateTurn` leży w `gra/src/main.ts:34604`, `cityTransfersLast` w `:34638` (dawne „ok. 34350” było błędne).
   - (b) Pałac: w tej rundzie (tempo `wysoki`, t10) AI w trudnym ma 0 budynków `palac`, a w zgodności 8. Poprzedni wpis „1 Pałac” pochodził z biegu `normalny`. Dlaczego trudny nie buduje pałacu w t10 — NIE ZMIERZONO.
   - (c) Skrypt zestawień `analyze.py` leżał poza repo. Zastąpiony przez zacommitowany `gra/tools/ai-cult-rel-measure-flow.cjs` (rozszerzenie allowlisty `ai-cult-rel-measure-*.cjs`).

## Rozstrzygnięcie (hipoteza, nie ustalenie)

1. Główna różnica jest po stronie PRODUKCJI jednostek, nie strat. Nowe jednostki (produkcja + zakup): −25 % (s4242) i −32 % (s7). Zejścia (rozwiązania, walka, głód) są prawie równe, więc luka w stanie jednostek t60 (−28 % / −40 %) jest praktycznie równa luce w nowych jednostkach.
2. Różnica zaczyna się od MIAST: w t30 AI trudnego ma 68 i 71 miast wobec 115 i 125 w zgodności. Mniej miast to mniej produkcji. Dlaczego AI trudnego zakłada mniej miast — NIE ZMIERZONO (nie zmierzono liczby osadników ani decyzji o zakładaniu).
3. Porządek jest najbardziej różniącą się wielkością od tury 10 (19–21 vs 44–51 PorPct) i tylko on jest mierzony wprost przy progu bunt skrajny (60 miast poniżej 14 % w trudnym, 1 w zgodności). Że to on napędza produkcję, jest HIPOTEZĄ: kary niepokoju nie zostały zmierzone (patrz zarzut 3).
4. Rebelia nie wystąpiła ani razu (0 miast w `rebelState` przy 60 miastach poniżej progu). Mechanizm NIE ZMIERZONO.
5. Skarbiec: możliwy drugi wpływ (mniej złota na zakup). Nie rozstrzygnięty (zarzut 5).

## Decyzja wymagana (DECISION_REQUIRED)

Przyczyna (jeśli potwierdzi się hipoteza z pkt 3) leży w wartościach balansu (Porządek, progi, kary), nie w błędzie AI. Nie wdrażam zmiany. Warianty do decyzji właściciela (jedno zdanie skutku na wariant):
- A: zostawić „Kultura i religia: trudny” bez zmian — AI na poziomie maksymalnym ma ok. 30–40 % mniej jednostek i ok. 20 % mniej miast niż przy zgodności, a połowa miast AI jest w strefie buntu skrajnego.
- B: zmienić parametry Porządku/kultury dla „trudny” — AI zbliża się do zgodności, ale zmiana dotyka wszystkich poziomów trudności i wymaga osobnego pomiaru (nie należy do tego tematu).

## NIE ZMIERZONO (z powodami)

- Rozdział jednostek kupionych i wyprodukowanych: wymaga haka w ścieżkach zakupu i produkcji (osobny temat).
- Wpływ kar niepokoju (T1 w punktach Porządku, kary ×0,80 / ×0,65) na produkcję: wymaga haka mierzącego Porządek w punktach, nie PorPct.
- Brak rebelii przy 60 miastach poniżej progu: wymaga analizy warunku wejścia w rebelię i grace (poza tym tematem).
- Dlaczego AI trudnego zakłada mniej miast (t10–t30): wymaga liczenia osadników i decyzji o zakładaniu miast.
- Dlaczego AI trudnego nie ma pałacu w t10: wymaga sprawdzenia warunku budowy.
- Utrzymanie żywnościowe jednostek: pole jest w rekordzie, nie zsumowane.
- Inne ziarna niż 4242 i 7; inne poziomy „Kultura i religia” (łatwy, normalny).

## Zmiany w kodzie (tylko odczyt, za `?civTest=1`)

- `gra/src/main.ts`: hak `__aiEconomyMeasure.cityTransfersLast()` i liczenie przejęć w `cityStateTurn` (bez zapisu do stanu gry).
- `gra/tools/ai-cult-rel-measure-run.cjs`: pole `cityTransfers` w rekordzie tury przy `--city-state 1`.
- `gra/tools/ai-cult-rel-measure-flow.cjs`: NOWE zestawienie przepływów z JSONL.

## Bramki (surowe wyjścia, runda 2)

- `tsc --noEmit`: exit 0.
- logic-test: `LOGIC OK (213/213)`.
- tech-tree-test: `20 pass, 0 fail`.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- combat-test: `All sanity checks passed.`
- ai-test: `297 passed, 0 failed`.
- ai-city-order-need-wiring-test: `231 passed, 0 failed (of 231)`.
- ai-unit-replace-same-rules-test: `45 passed, 0 failed`.

## Odniesienie: runda 1 (tempo `normalny`, bez przepływów)

| Wielkość t60 | trudny s4242 | zgodn. s4242 | trudny s7 | zgodn. s7 |
|---|---|---|---|---|
| Jednostki AI | 187 | 273 | 205 | 337 |
| Miasta AI | 159 | 190 | 165 | 194 |
| Miasta < 14 % | 63 | 7 | 81 | 0 |

Runda 1 potwierdza kierunek i rząd wielkości rundy 2 (−31 % / −39 % przy `normalny`, −28 % / −40 % przy `wysoki`).
