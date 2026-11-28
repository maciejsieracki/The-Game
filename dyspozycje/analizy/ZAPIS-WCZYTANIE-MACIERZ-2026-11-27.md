# ZAPIS-WCZYTANIE-MACIERZ — macierz zapis/wczytanie na MAKSIMUM (R-WEB-SAVE-LOAD-MATRIX-Q1, runda 3, Operator SONNET)

## 0A. STAN WIĄŻĄCY (runda 3, 2026-11-28; zastępuje sekcję „R2” niżej, która jest tylko historyczna: rivals=2, NIE maksimum)

**Baza:** `286d594d3` (origin/main `481e0ebf9` = FALA 936 + WIP runnera). Kod gry w tej rundzie zmieniony JEDEN raz (poprawka z pkt 0A.1): `gra/src/main.ts` (+22 linii, tylko zapis/odtworzenie stanu). Build `vite build` do `/tmp` poza repo; zapisy mierzone na dwóch buildach: PRZED poprawką i PO poprawce.
**Maksimum użyte WSZĘDZIE (odczyt `cfgUsed` w każdym JSON, `dane/r3b-READBACK.txt`):** barbarzyńcy Trudny, poziom Trudny, Wysoki ×4, kultura trudny (gracz i AI), dyplomacja trudna, `rivals=9`, `civTypesCount=14` (maksimum dla epoki Brąz).

### 0A.1 Główny wynik: ZNALEZIONY I NAPRAWIONY PRAWDZIWY BŁĄD GRY (B≠A)

Komórka **bunt/7/zapis po t7** (rivals=9) dała B≠A we **wszystkich 6 turach** po wczytaniu (powtórzone 2×, ten sam wynik). Różnica w turze 8: **106 miast-państw** zmienia właściciela na cywilizacje w przebiegu ciągłym (A: wchłonięcie przez AI), a po wczytaniu (B) zostają niezależne.

**Przyczyna (zmierzona, nie założona):** trzy mapy stanu absorpcji miast-państw przez AI w `main.ts` — `aiCsTrybutSince`, `aiCsWasalSince`, `aiCsFailCount` — NIE były zapisywane i NIE były odtwarzane. `decideAiCsClusterAction` czyta je (`wasal_timer` → wchłonięcie, liczba odmów → wojna). Odczyt `__turnSlowdownTestDebug.collections()`: **przy zapisie (A) trybut=106, wasal=106; po wczytaniu (B) trybut=0, wasal=0** (`dane/bunt-7-t7-B-PRZED-poprawka-aiCs.json`). Traktat (`activeDeals`) wracał z zapisu, zegar nie, więc AI zaczynało odliczanie od nowa i wchłonięcia się spóźniały.

**Skutek dla gracza:** zapis w trakcie wchłaniania miast-państw przez AI (tura ~7 na maksimum) po wczytaniu daje inny świat niż gra bez wczytania; dodatkowo wczytanie w tej samej sesji dziedziczyło zegary z bieżącej gry (mapy nie były czyszczone).

**Poprawka (minimalna):** zapis trzech map w `meta` (`Array.from(mapa.entries())`), czyszczenie przy resecie świata i przy wczytaniu, odtworzenie z `saved.meta`; stary zapis bez pól = puste mapy jak dotąd (zachowanie bez zmian).

**Test czerwony → zielony:**
- na żywo (maksimum, rivals=9): bunt/7/t7 PRZED poprawką **0/6 tur równych** → PO poprawce **6/6 równych**; przy zapisie 106/106 par, po wczytaniu 106/106 (`dane/bunt-7-t7-B-PRZED-poprawka.json` vs `dane/bunt-7-t7-B-PO-poprawce.json`);
- statyczny `gra/tools/save-load-ai-cs-absorption-state-test.cjs`: **12/0**, na źródle PRZED poprawką czerwony; 3 mutacje (wycięty zapis / odtworzenie / czyszczenie) każda czerwona.

### 0A.2 Diagnoza bunt/t10 z r2 (różnica `cities[city3].podzialPracy`) — rozstrzygnięta: **(a) wyłącznie reprezentacja**

- `resolveCityPodzialPracy` (`empire-city-defaults.ts`) czyta pole `city.podzialPracy` tylko gdy `podzialPracyOverride=true` albo gdy brak domyślnej właściciela; przy `override=false` pole jest martwe. `ensureCityPodzialDefaults` (wczytanie) dopisuje `{procentBudynki}`, przejęcie miasta w ciągłej grze je kasuje (`main.ts:6803`) — stąd różnica w zrzucie surowym, nie w stanie gry.
- Test deterministyczny na funkcjach `gra/tools/save-load-podzial-pracy-representation-test.cjs`: **5 PASS / 0 FAIL** (18 kombinacji: domyślny podział właściciela × wypełniacz pola; efektywny podział PRZED = PO; przy `override=true` pole żywe; **mutacja** wycinająca gałąź domyślnej właściciela → 6/18 kombinacji różnych, test czerwony).
- Na żywo przy rivals=9 komórka bunt/4242/zapis po t10: **B==A 6/6 BEZ normalizacji** — `rawDiffSummary.count=0` w każdej turze (`dane/bunt-4242-t10-B.json`). Różnicy z r2 nie odtworzono na maksimum. Runner od tej rundy porównuje wartość efektywną (`effPP`, ten sam resolver co silnik) i pomija martwe pole (normalizacja jawna; `--norm-pp raw` ją wyłącza); w danych zostaje `rawDiffSummary` (surowe różnice).
- Zmian w `cities.ts` NIE wprowadzono (wariant (a): bez zmiany kodu gry).

### 0A.3 Tabela komórek na MAKSIMUM (rivals=9, civTypes=14, barbarzyńcy Trudny): B==A tury po wczytaniu z pauzy (hak `loadJsonAsPauseLoad` → produkcyjne `loadGameFromSlot(slot,true)`)

| Konfiguracja | Ziarno | Zapis po | Build | B==A | Plik |
|---|---|---|---|---|---|
| max | 4242 | t3 | wcześniejsza runda (przed poprawką) | 6/6 | `dane/r3-B-4242-t3.json` |
| max | 4242 | t10 | j.w. | 6/6 | `dane/r3-B-4242-t10.json` |
| max | 7 | t3 | j.w. | 6/6 | `dane/r3-B-7-t3.json` |
| max | 7 | t10 | j.w. | 6/6 | `dane/r3-B-7-t10.json` |
| max+bunt stolicy AI | 4242 | t3 | PRZED poprawką | 6/6 | `dane/bunt-4242-t3-B.json` |
| max+bunt stolicy AI | 7 | t3 | PRZED poprawką | 6/6 | `dane/bunt-7-t3-B.json` |
| max+bunt stolicy AI | 4242 | t10 | PRZED poprawką | 6/6 (0 surowych różnic) | `dane/bunt-4242-t10-B.json` |
| max+bunt stolicy AI | 7 | **t7** (nie t10) | PRZED | **0/6 FAIL (błąd gry)** | `dane/bunt-7-t7-B-PRZED-poprawka.json` |
| max+bunt stolicy AI | 7 | **t7** | **PO poprawce** | **6/6** | `dane/bunt-7-t7-B-PO-poprawce.json` |
| aionly (kultura tylko AI) | 4242 | t3 | PRZED poprawką | 6/6 | `dane/aionly-4242-t3-B.json` |
| aionly | 7 | t3 | PRZED poprawką | 6/6 | `dane/aionly-7-t3-B.json` |

**Razem 10 komórek z B==A 6/6** (4 wcześniejsze + 6 tej rundy, w tym 1 po poprawce) oraz 1 komórka (bunt/7/t7) ujawniająca błąd, zielona po poprawce. Komórki PRZED poprawką dotyczą stanów, w których liczniki absorpcji są puste przy zapisie; poprawka zmienia wyłącznie zapis/odtworzenie tych liczników, więc te wyniki zostają ważne, ALE nie były powtórzone na buildzie PO poprawce (uczciwie: po poprawce zmierzono bunt/7/t7 oraz render max/4242/t10).

**NIE ZMIERZONO:** aionly/{4242,7}/t10; bunt/7/t10 (dwa podejścia: bieg ciągły A do t16 przekracza limit 590 s narzędzia przy 20–50 s na turę na zajętej maszynie; zamiast tego zmierzono t7); bunt/4242/t7 i aionly/*/t7; powtórzenie wszystkich komórek „PRZED” na buildzie PO poprawce.

### 0A.4 Ścieżka UI (klik „Zapisz grę” → „Wczytaj grę”, rivals=9; harness poprawiony: `--rivals`/`--civtypes`, domyślnie 9/14)

Wczytanie KLIKIEM (`button.b-menu` → `[data-act=save]` → `Zapisz` → `[data-act=load]` → wiersz zapisu → `Wczytaj`), build PO poprawce, B porównane z przebiegiem A.

| Zapis | Ziarno | Tury dalej przed wczytaniem (cofnięcie) | B==A | Uwaga |
|---|---|---|---|---|
| t3 | 4242 | 1 (wczytanie cofa t4→t3) | **5/5 OK** (t4–t8) | 6. tura nie zdążyła — limit 590 s narzędzia |
| t3 | 4242 | 0 | **5/5 OK** (t4–t8) | j.w. |
| t3 | 7 | 0 | **3/3 OK** (t4–t6) | j.w. |

Strona: 0 błędów (`pageErrors`=0). **Kryterium „≥6 tur klikiem na 2 komórkach” NIE spełnione**: 0 rozjazdów w 13 zmierzonych turach, ale nie osiągnięto 6 tur w jednym biegu (start gry ~100–250 s, dojście do t3 + zapis + wczytanie z odbudową świata 3–6 min, tura 25–55 s przy obciążeniu maszyny 5–7).

**FAIL „dirty3” z r2 (rozjazd od tury 7 po 3 turach dalej w tej samej grze):** nie sprawdzono hipotezy zasiewu `Math.random` osobnym eksperymentem. Zmierzone: po poprawce absorpcji (wczytanie w tej samej sesji nie dziedziczy już zegarów z cofanej przyszłości) wariant z cofnięciem dirty=1 daje 5/5 OK. Wariant dirty=3 NIE powtórzony po poprawce — NIE ZMIERZONO, więc rozstrzygnięcie „artefakt harnessu vs błąd gry” zostaje otwarte (najbardziej prawdopodobne wyjaśnienie z danych: ta sama klasa błędu co 0A.1, bo różnice dotyczyły miasta-państwa city15 i jednostek wiosek).

### 0A.5 Render po wczytaniu (max/4242, zapis t10, rivals=9, build PO poprawce; `dane/render-max-4242-t10-B.json`, zrzut `dane/render-max-4242-t10-po-wczytaniu.png`)

- po wczytaniu (t10): `hexCount=20160`; miasta w stanie 142, jednostki 194; siatki wiosek 81, ulepszeń 59; render: 185 wywołań rysowania, 372 246 trójkątów; `pageErrors`=0, `consoleErrors`=0;
- po 6 turach (t16): `hexCount=20160` (bez zmian), miasta 151, jednostki 244, siatki wiosek 51 (zebrane), ulepszeń 184, 226 wywołań, 373 174 trójkąty; 0 błędów.
- Zrzut (HUD, „TURA 10 · 3550 P.N.E.”, obszar gracza z mgłą wojny, minimapa z jednym skupiskiem) jest spójny z odczytem stanu. **Ograniczenie:** brak haka liczącego obiekty sceny miast/jednostek, więc „liczba widocznych w scenie = stan” NIE ZMIERZONO wprost (tylko siatki wiosek/ulepszeń i liczniki stanu).
- Porównanie B z A w tym przebiegu pokazało „rozjazd” wyłącznie w polu `effPP` dodanym do runnera w tej rundzie (zrzut A z wcześniejszej rundy go nie ma; 143 różnice, tylko `effPP`, żadnego innego pola) — artefakt porównania, nie gry. Komórka NIE liczona w tabeli 0A.3.

### 0A.6 A==A' (determinizm ciągły, maksimum rivals=9; `dane/r3b-AA-porownanie.txt`; zrzuty kanoniczne bez pola `effPP`)

- max/4242 zapis t3: dwa nowe niezależne biegi A1, A2: **9 tur (t4–t12) identyczne bajt w bajt**; A1 kontra starszy bieg (inna wersja runnera i kodu), t4–t9: identyczne (6 tur). Nie osiągnięto 10 tur: A2 przerwany limitem 590 s na t12.
- max/7 zapis t3: nowy bieg kontra starszy: **6 tur (t4–t9) identyczne**; drugi bieg 10-turowy NIE wykonany.
- bunt/7 zapis t7: trzy niezależne biegi A (stary build, stary build k=2, nowy build): t8–t13 identyczne (6 tur); poprawka nie zmienia przebiegu ciągłego.
- **Kryterium „≥10 tur × 2 ziarna” NIE spełnione w pełni**: 9 tur dla 4242 (+ dodatkowe porównania), 6 tur dla ziarna 7.

### 0A.7 Bramki (z `gra/`, po poprawce)

`npx tsc --noEmit` exit 0 · `logic-test` 213/213 · `tech-tree-test` 20/0 · `research-test` 33/0 · `unit-replace-test` 21/21 · `combat-test` 6/6 · `ai-test` 297/0 · `early-grace-15-test` 33/0 · `society-breakdown-test` 56/0 · `ai-city-order-need-wiring-test` 267/0 · `save-load-sort-test` 4/4 · `save-load-ledger-history-test` 4/0 · `save-load-budowa-priorytet-on-load-test` 6/0 · `determinism-save-load-resume-test` PASS · `save-load-roundtrip-state-drift-test --static-only 1` OK (warstwa dynamiczna tego testu NIE uruchomiona: ~5 min/ziarno) · nowe: `save-load-ai-cs-absorption-state-test` 12/0, `save-load-podzial-pracy-representation-test` 5/0. NIE uruchomione (wymagają przeglądarki/`--dist`): `save-load-deserialize-fields-audit`; `unit-power-test` (poza zakresem zmiany).

### 0A.8 Uwagi procesu

- Przy obciążeniu 5–7 na 4 rdzeniach tura gry trwa 20–55 s; start sesji (generowanie świata dla 9 rywali) 100–250 s. Biegi ciągłe A powyżej ~13 tur nie mieszczą się w jednym wywołaniu 590 s; dlatego zapis „późny” = t7 w komórce, gdzie t10 nie był osiągalny.
- Runner `save-load-continuity-live.cjs` rozszerzony: efektywny podział Pracy (`effPP`), `rawDiffSummary` per tura, odczyt liczników absorpcji (`aiCsAtSave`/`aiCsAfterLoad`), tryb `--render 1` z `--shot`, `--dumpb`, `--vw/--vh`, `SM_ARGS`, czasy tur.

---

## 0B. OBRONA RUNDY 3 — rewalidacja na kandydacie d14cfce23 (2026-11-28)

**Build:** kod gry = `dfae6298c` (poprawka aiCs*, jedyna zmiana w `gra/src/main.ts`); build `vite build` do katalogu w scratchpadzie (bez `npm run build`). Ustawienia maksymalne: rivals=9, civTypesCount=14, barbarzyńcy Trudny, Wysoki ×4, kultura trudny, dyplomacja trudna; `cfgUsed` zapisane w każdym JSON (`dane/r3d-READBACK-d14.txt`). Porównanie: `normPP=inert` (domyślne), a obok każdej tury zapisany `rawDiffSummary` (BEZ normalizacji).

**Komórki zmierzone na d14 (runner `gra/tools/save-load-continuity-live.cjs`):**

| Konfiguracja | Zapis | Tury B==A | pageErrors | Surowe różnice (rawDiff, bez normalizacji) | Wynik |
|---|---|---|---|---|---|
| max / 4242 | t3 | 6/6 | 0 | 0 w każdej z 6 tur | PASS |
| max / 4242 | t10 | 6/6 | 0 | 0 w każdej z 6 tur | PASS |
| bunt / 4242 | t10 | 6/6 | 0 | 1 w każdej turze: wyłącznie pole `podzialPracy` (jedno miasto); `effPP` = 0 różnic | PASS (reprezentacja) |
| bunt / 4242 | t3 | nie uzyskano | — | 4 próby: Chromium „Target page … has been closed” (limit ponowień z dispatchu wyczerpany) | NIE ZMIERZONO |

Pliki: `dane/r3d-B-max-4242-t3.json`, `dane/r3d-B-max-4242-t10.json`, `dane/r3d-B-bunt-4242-t10.json`, logi `dane/r3d-LOG-B-bunt-4242-t3-CRASH.txt`.

**NIE ZMIERZONO na d14 (powód):** max/7 t3 i t10, aionly 4242 i 7 (t3 i t10), bunt/7 (t3 i t10). Bieg A do tury 16 trwa 9–12 min (20–50 s na turę przy obciążonej maszynie). Dwa biegi A dla max/7 (`dane/r3d-LOG-A-max-7-t13-timeout.txt`) i jeden dla max/4242 (`dane/r3d-LOG-AP-max-4242-t13-timeout.txt`) przekroczyły limit 590 s narzędzia w turze 13, bez zapisu snapshotu t10 dla max/7 w kompletnej formie. Runner nie wznawia biegu A.

**A==A' na d14 (max/4242):** dwa niezależne biegi A, zapis po t3 i t10; porównano **9 tur** (t4–t9, t11–t13), bajt w bajt identyczne (`dane/r3d-AA-max4242-d14.txt`). Kryterium ≥10 tur NIE spełnione (9). max/7 na d14: NIE ZMIERZONO.

**Klik UI i render po wczytaniu na d14:** NIE ZMIERZONO w tej rundzie. Wyniki r3b (`dane/ui-*`, `dane/render-*`) pochodzą z buildu sprzed tej rundy; komórka `render-max-4242-t10-B` ma verdict FAIL i nie jest ważnym dowodem renderu.

**Odpowiedzi na zarzuty Evaluatora (d24774dc8):**

1. A==A' ≥10 tur × 2 ziarna — PRZYJMUJĘ. max/4242: 9 tur (identyczne), max/7: brak na d14. Otwarte.
2. Klik UI ≥6 tur; hipoteza artefaktu `Math.random` dla „dirty3” — PRZYJMUJĘ. Nie zmierzono w tej rundzie; hipoteza nierozstrzygnięta. Otwarte.
3. Macierz niepełna; komórki sprzed poprawki bez powtórzenia — PRZYJMUJĘ. Na d14 zmierzono 3 z 12 komórek (max/4242 t3, t10; bunt/4242 t10). Dla bunt/4242/t10 na d14 brak regresji po zmianie formatu zapisu (B==A 6/6). Pozostałe komórki, w tym bunt/4242 t3 i bunt/7 t3 (zmierzone wcześniej tylko przed poprawką), otwarte.
4. Test czerwony→zielony tylko tekstowy — PRZYJMUJĘ CZĘŚCIOWO. Dowód behawioralny (ten sam runner, ta sama komórka): bunt/7/t7 PRZED poprawką 0/6 tur równych (FAIL; `dane/bunt-7-t7-B-PRZED-poprawka.json`), PO poprawce 6/6 (PASS; `dane/bunt-7-t7-B-PO-poprawce.json`). Test `save-load-ai-cs-absorption-state-test.cjs` ma mutację na linii przywracania (Evaluator: 11/1 FAIL). Brak powtarzalnej bramki behawioralnej w repo (wymaga przeglądarki) — otwarte jako dług.
5. Render: liczba miast/jednostek niezmierzona; verdict FAIL komórki — PRZYJMUJĘ. Wpis w dokumencie 0A.5 nie jest dowodem renderu; nowy render na d14 NIE ZMIERZONO.
6. Dokument: nieaktualne treści historyczne — PRZYJMUJĘ, poprawione: sekcja 0 (r2) oznaczona jako ARCHIWUM, stary „stan wiążący” zastąpiony odsyłaczem do 0A/0B.
7. Normalizacja `podzialPracy` (inert) ukrywa różnice ekonomii — ODRZUCAM w zakresie zmierzonych komórek, z dowodem: rawDiff bez normalizacji dla max/4242 t3 i t10 to 0 różnic w każdej turze; dla bunt/4242/t10 jedyna surowa różnica to `podzialPracy` (martwe pole, `override=false`), `effPP` 0 różnic, wszystkie pozostałe pola miast i jednostek (produkcja, zapasy, populacja, praca) bitowo równe przez 6 tur (`dane/r3d-READBACK-d14.txt`). Rozjazd r2 bunt/t10 (rivals=2) NIE został odtworzony na maksimum, więc nie ma jego zachowania do porównania. Ograniczenie: normalizacja domyślna w runnerze nadal pomija pole; porównanie surowe należy włączać dla każdej nowej komórki (`--norm-pp raw`).

**Wnioski obrony:** zmiana w `gra/src/main.ts` (aiCs*) nie została zmieniona w tej rundzie. Dowód red→green na buildzie: bunt/7/t7 0/6 → 6/6. Kryteria binarne z dispatchu NIE są spełnione (A==A' 9/10, klik UI, render, 9 z 12 komórek bez pomiaru na d14). Status: BLOCK — brak czasu/infrastruktury do domknięcia; kolejna runda wymaga dłuższego okna biegów A lub runnera z wznawianiem.

## R2 (historyczne, rivals=2 — NIE jest dowodem maksimum)

## 0. ARCHIWUM RUNDY 2 (NIEAKTUALNE — stan wiążący jest w sekcjach 0A i 0B)

**Baza kodu:** origin/main `ca61257d4` (FALA 932–935, merge do gałęzi tematu `dd5bd3cb5`); kod gry w tej rundzie NIE zmieniony (`gra/src` bez zmian). Build: `vite build` do katalogu w scratchpadzie, `npx tsc --noEmit` exit 0.
**Ustawienia maksymalne (wg kreatora):** barbarzyńcy Trudny, poziom Trudny, Wysoki ×4, kultura trudny (gracz i AI), dyplomacja trudna. Rywale (`rivals`/miasta-państwa) MAKSIMUM = 9 (`MAX_MIAST_PANSTWA`). `civTypesCount` MAKSIMUM dla epoki startu Brąz = **14** (nie 15: 15 dotyczy dopiero Żelaza; `civs.json` ma 14 cywilizacji z wejściem ≤ Brąz, `newGameFlow.ts:2236` clampuje do `epochCivMax`).
**Uwaga (obrona r3):** poniższy opis był stanem wiążącym rundy 2 i jest NIEAKTUALNY (r2 = rivals=2, nie maksimum). Stan bieżący: sekcja 0A (runda 3, build przed obroną) oraz 0B (obrona, kandydat d14cfce23). Rozjazd bunt/t10 z r2 rozstrzygnięty w 0A.2.

### 0.1 Tabela komórek (rivals=2, barbarzyńcy Trudny; pliki `dane/r2-*`)

| Konfiguracja | Ziarno | Zapis po | cfgUsed (rivals) | B==A tury po wczytaniu | Wynik | Pola różnic |
|---|---|---|---|---|---|---|
| max | 4242 | t3 | 2 | 6/6 | PASS | — |
| max | 4242 | t10 | 2 | 6/6 | PASS | — |
| max | 7 | t3 | 2 | 6/6 | PASS | — |
| max | 7 | t10 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 4242 | t3 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 4242 | t10 | 2 | **0/6** | **FAIL (rozjazd)** | `cities[city3].podzialPracy` |
| max + bunt stolicy AI | 7 | t3 | 2 | 6/6 | PASS | — |
| max + bunt stolicy AI | 7 | t10 | 2 | **0/6** | **FAIL (rozjazd)** | `cities[city3].podzialPracy` |
| aionly | 4242 | t3 | 2 | 6/6 | PASS | — |
| aionly | 4242 | t10 | 2 | 6/6 | PASS | — |
| aionly | 7 | t3 | 2 | 6/6 | PASS | — |
| aionly | 7 | t10 | 2 | 6/6 | PASS | — |
| max (kontrola) | 4242 | t3 | **9** | 6/6 | PASS | — |

Wynik: 10 z 12 komórek macierzy PASS, 2 FAIL (bunt, t10). Komórki r1 (`max/4242/t10`, `aionly/7/t3`, `max/7/t3` z r1 pochodzące z barbarzyńców „normalny”) zostały przemierzone w r2 na tym samym kodzie (rivals=2); poprzednie wyniki z barbarzyńcami „normalny” NIE liczą się jako maksimum.

### 0.2 Rozjazd bunt/t10 (diagnoza częściowa, NIE naprawione)

- Odtworzone 2/2 ziarna (4242, 7) przy `cfg bunt` + zapis po t10; przy t3 i przy `max` bez buntu brak rozjazdu.
- Jedyna różnica w 6 turach: `cities[city3].podzialPracy` — przebieg ciągły (A): pole nieobecne (miasto śledzi globalny podział imperium); przebieg po wczytaniu (B): `{procentBudynki: 50}`. Pozostałe pola (miasta, jednostki, skarbiec) zgodne.
- Kandydaci przyczyny (hipotezy, nieprzetestowane minimalnie): `ensureCityPodzialDefaults` (`gra/src/game/cities.ts:754`) uzupełnia brakujące pole wartością domyślną przy wczytaniu; po zmianie właściciela pole jest kasowane (`gra/src/main.ts:6803`). Skutek w zmierzonych turach: brak różnic ekonomicznych (wybór sposobu zapisu stanu „śledzi globalny”).
- Poprawka NIE wdrożona: wymagałaby zmiany `gra/src/game/cities.ts` (poza allowlistą dispatchu), a oparta na hipotezie. Decyzja orkiestratora wymagana.

### 0.3 Ścieżka UI (klik „Zapisz grę” → „Wczytaj grę” w menu pauzy)

- Harness: `gra/tools/save-load-continuity-ui-live.cjs` (nowy). Zapis i wczytanie KLIKIEM w jednej sesji (przycisk `button.b-menu` → `[data-act=save]`/`[data-act=load]` → dialog `.civ-sl-row` → `Wczytaj`). Tura przesuwana hakiem `__eraTestDebug.endTurn` (nie wczytanie).
- `max/4242/t3`, wczytanie po 0 turach od zapisu: **PASS 6/6** (`r2-UI-max-4242-t3-dirty0.json`).
- `max/4242/t3`, wczytanie po 3 turach dalej w tej samej grze: **FAIL** — tury 4–6 zgodne, rozjazd od tury 7 (różne identyfikatory jednostek wiosek i zasoby miasta city15). Hipoteza: stan poza zapisem w tej samej grze (zgodnie z klasą SAVEFIX). NIE ZDIAGNOZOWANE do końca; `max/7/t3` ścieżką UI NIE ZMIERZONO.
- Próby: pierwsza wersja harnessu nie otworzyła menu klawiszem Escape (brak reakcji); przełączono na przycisk HUD `button.b-menu` (działa).

### 0.4 A==A' (determinizm ciągły)

- Dwa niezależne przebiegi A tego samego ziarna i ustawień (`max`, rivals=2): **identyczne bajt w bajt** zrzuty kanoniczne (`sha256` 16 znaków zgodne) dla wszystkich tur: t4–t9 i t11–t16 (12 tur) — ziarno 4242 i ziarno 7.

### 0.5 Render po wczytaniu

- NIE ZMIERZONO (hexCount, licznik błędów konsoli po wczytaniu na t10 nie wykonane). Zrzut ekranu z przebiegu UI (`r2-UI-max-4242-t3-po-wczytaniu.png`, stan po 3+6 turach w sesji z rozjazdem) istnieje, ale NIE oceniony merytorycznie.

### 0.6 Bramki

- `npx tsc --noEmit` w `gra/`: exit 0. Testy logiczne (logic 213, ai-test 297/0 itd.) nie uruchamiane: brak zmian w `gra/src`.

### 0.7 Pozostałe ustalenia procesu

- Runy A/B trwały 6–8 min na bieg; dwa razy narzędzie przeniosło bieg w tło po 590 s (automatycznie, nie przez `run_in_background`); wynik zebrany z pliku logu.
- `rivals=9` tylko dla jednej komórki; reszta macierzy wymaga ponownego biegu na 9 (≈12 komórek, ok. 1,5 h).

### 0.8 Pliki

Wszystkie w `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` z prefiksem `r2-`: `r2-B-*.json`, `r2-A-*.json`, `r2-A2-*.json`, `r2-UI-*.json`, `r2-READBACK-*.txt` (cfgUsed per komórka), `r2-MAX-USTAWIENIA-KREATOR.txt`, stany `r2-STATE-A-*.json.gz`, logi `r2-log*.txt`.

---

## RUNDA 1 (archiwum, 2026-11-27 — NIE na maksimum dla części komórek)

# ZAPIS-WCZYTANIE-MACIERZ — pomiar macierzy po FALI 932 (runda 1)

**Baza:** origin/main `ebaa23b03` (kod 4bd55c32, FALA 932). Żadnych zmian w kodzie w tej rundzie: B==A we wszystkich zmierzonych komórkach, więc poprawki nie wdrażano (zgodnie z pkt 5 dispatchu).
**Zakres:** WYŁĄCZNIE konfiguracje maksymalne (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny, barbarzyńcy normalny/włączeni); `default` nie mierzony.
**Metoda:** `gra/tools/save-load-continuity-live.cjs` (tryb A = ciągła gra z zapisem w punkcie; tryb B = świeża gra tego samego ziarna + wczytanie zapisu ścieżką `loadJsonAsPauseLoad` → produkcyjne `loadGameFromSlot(slot, true)`). Porównanie per tura na znormalizowanym `__detHarness.full()`, 6 tur po wczytaniu.
**Bunt** = cfg `bunt` (max + bunt stolicy AI w 1. turze po zapisie).

## 1. Macierz (12 komórek = {max, bunt, aionly} × {4242, 7} × {t3, t10})

| Konfiguracja | Ziarno | Zapis po | B==A (tury po wczytaniu) | mapDiffers | Błędy strony | Źródło wyniku |
|---|---|---|---|---|---|---|
| max | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-4242-t3.json` |
| max | 4242 | t10 | 6/6 (t11–t16) | true | 0 | poprzednia runda (r3/r4, ten sam kod); NIE przemierzono w tej rundzie |
| max | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-max-7-t3.json` |
| max | 7 | t10 | 6/6 (t11–t16) | true | 0 | ten przebieg: `dane/B-max-7-t10.json` |
| bunt | 4242 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-4242-t3.json` |
| bunt | 7 | t3 | 6/6 (t4–t9) | true | 0 | ten przebieg: `dane/B-bunt-7-t3.json` (drugie podejście, patrz §4) |
| aionly | 4242 | t3 | **NIE ZMIERZONO** | — | — | — |
| aionly | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| aionly | 7 | t3 | 6/6 (t4–t9) | true | 0 | poprzednia runda (r4, ten sam kod) |
| aionly | 7 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 4242 | t10 | **NIE ZMIERZONO** | — | — | — |
| bunt | 7 | t10 | **NIE ZMIERZONO** | — | — | — |

**Wynik:** 7 z 12 komórek ma B==A 6/6 (5 w tej rundzie, 2 z poprzedniej, na tym samym kodzie). Zero rozjazdów. Pozostałe 5 komórek: NIE ZMIERZONO (brak czasu w tej rundzie, patrz §5).

`mapDiffers = true` we wszystkich pięciu biegach tej rundzie: żywa mapa po zapisie różniła się od zapisu, więc decyzja `liveMapDiffersFromSave` w `loadGameFromSlot` odbudowała mapę. To jest ścieżka naprawy z FALI 932; wynik 6/6 jest więc dowodem, że poprawka działa także w cfg `bunt` i na ziarnie 7.

## 2. Punkt 1 dispatchu (macierz) — stan

Zrobione: 5 komórek w tej rundzie + 2 z poprzedniej (max/4242/t10, aionly/7/t3). Nie zrobione: bunt/4242/t10, bunt/7/t10, aionly/4242/t3, aionly/4242/t10, aionly/7/t10 — każda komórka t10 wymaga ok. 16 tur gry (ok. 9–10 min na jeden bieg A, plus bieg B), a t3 ok. 9 tur. Przy limicie 590 s na wywołanie Bash każdy bieg trzeba było dzielić na osobne wywołania.

## 3. Punkt 2 (klik UI w menu pauzy) — NIE ZMIERZONO

Nie napisano jeszcze harnessu klikającego menu pauzy („Wczytaj” → wybór slotu). Obecny test używa haka `loadJsonAsPauseLoad`, który woła produkcyjne `loadGameFromSlot`, ale nie przechodzi przez UI. Pozostaje: nowy skrypt z klikaniem, osobna runda.

## 4. Incydenty (bez wpływu na wynik)

- **max/7 (bieg A z zapisami t3 i t10 w jednym przebiegu):** Chromium zamknęło stronę w turze 16 (`Target page, context or browser has been closed`), po 9 min 45 s. Dlatego t10 powtórzono w osobnym biegu A (`--saves 10`, 16 tur, 8 min 57 s, bez błędu); ten bieg daje komórkę max/7/t10. Bieg B t10 zakończony bez błędów.
- **bunt/7/t3 (bieg B):** pierwsze uruchomienie zakończyło się błędem `Target page ... has been closed` (SIGSEGV Chromium, bez segmentu wyniku). Ponowione z tym samym stanem A: PASS 6/6. Dwa podejścia do jednej komórki, wynik z drugiego.
- **max/7 stan częściowy:** `STATE-A-max-7-t3-partial-z-t10-crash.json` to stan z przerwanego biegu A (zawiera pełny punkt t3 i częściowy t10). Użyty do biegu B t3; bieg B t10 użył osobnego stanu `STATE-A-max-7-t10.json`.

## 5. Punkty 3 i 4 dispatchu — NIE ZMIERZONO

- **A==A' (determinizm ciągły, digest bajt w bajt przez ≥10 tur, max/4242 i max/7):** nie uruchomiono. Wymaga dwóch niezależnych biegów A po ≥10 turach na każdym ziarnie (ok. 2 × 9–12 min na ziarno). Nie zrobione w tej rundzie.
- **Render po wczytaniu (hexCount, brak [Error] w konsoli, liczba miast/jednostek widocznych, zrzut do dane/):** nie zmierzono. Bieg testowy działa bez renderu sceny (swiftshader, bez oceny wizualnej); zrzut ekranu nie był wykonywany.

## 6. Bramki

Brak zmian w kodzie w tej rundzie. Wykonano: `npx tsc --noEmit` w `gra/` — exit 0 (build vite do katalogu w scratchpadzie, nie w repo; `npm run build` nie uruchamiano). Pozostałe bramki (logic 213, ai-test 297/0 itd.) nie były potrzebne, bo nie zmieniano `gra/src`.

## 7. Kandydaci do decyzji orkiestratora (poza zakresem)

Brak nowych kandydatów błędu gry w tej rundzie. Obserwacja metodyczna: bieg B wymaga ok. 5–8 min i bywa przerywany przez SIGSEGV Chromium (2 przypadki w tej rundzie); bieg A t10 zbliża się do limitu wywołania narzędzia. Dla dalszych komórek warto rozważyć zapis kilku punktów w jednym biegu A (jeden przebieg zamiast dwóch) — wymaga zmiany skryptu, więc poza tą rundą.

## Dane

`dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` — pliki wyników `B-*.json` (5 biegów tej rundy, z polami `verdict`, `pageErrors`, `segments[].turns[]`) i stany `STATE-A-*.json` (punkty zapisu i zrzuty kanoniczne).
