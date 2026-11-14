# R-WEB-MAPGEN-RIVERS-STANDARD-1-10-CHECKSUM-VERIFY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-MAPGEN-RIVERS-STANDARD-1-10-CHECKSUM-VERIFY-Q1
GOAL: tabela ziaren 1–10 rozmiaru Standardowy: suma kontrolna układu rzek+terenu PRZED (fab9a9b75 = 7b06e233c^, tuż przed FALĄ 707) i PO (origin/main 96c30f2c4); 10 par, każda identyczna → PASS.
ZMIANY/COMMIT: brak zmian w `gra/src` i `gra/data` (zero diffów kodu gry). Dodany tylko raport i dowody w `runs/R-WEB-MAPGEN-RIVERS-STANDARD-1-10-CHECKSUM-VERIFY-Q1/` (`10-operator-claude.md`, `evidence/standard-<N>-{przed,po}.{json,log}`). Commit: patrz sekcja DEPLOY/PUSH (SHA w polu `sha` wyniku). Gra nie jest budowana ani wdrażana.
TESTY: patrz tabela poniżej oraz sekcja „Bramki”.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree i FF tylko po Evaluatorze i Final Control). Operator nie integruje.
DEPLOY/PUSH: NIE WYKONANO

---

## 1. Wynik zasadniczy

Dla wszystkich 10 ziaren Standardowy (1–10) suma kontrolna układu (teren + nakładka + krawędzie rzek, wszystkie 20160 hexów) PRZED jest identyczna z PO. Brak różnic, brak ziaren NIE ZMIERZONO.

| Ziarno | Suma PRZED (`estimateLandCentroidFromSeed` = BFS bez pamięci) | Suma PO (BFS po pamięci) | Zgodność | BFS PRZED | BFS PO (`...Uncached`) | Czas PRZED | Czas PO |
|---|---|---|---|---|---|---|---|
| 1 | `c92dbbf` | `c92dbbf` | IDENTYCZNE | 8522 | 544 | 417,09 s | 225,60 s |
| 2 | `b4502de8` | `b4502de8` | IDENTYCZNE | 7253 | 587 | 352,49 s | 202,60 s |
| 3 | `ef0d203c` | `ef0d203c` | IDENTYCZNE | 7524 | 9 | 260,94 s | 195,09 s |
| 4 | `6c009940` | `6c009940` | IDENTYCZNE | 5974 | 356 | 289,89 s | 172,73 s |
| 5 | `947064e8` | `947064e8` | IDENTYCZNE | 9130 | 9 | 349,37 s | 198,63 s |
| 6 | `f5fb41c4` | `f5fb41c4` | IDENTYCZNE | 12136 | 6 | 521,96 s | 236,30 s |
| 7 | `38fdb560` | `38fdb560` | IDENTYCZNE | 7669 | 478 | 426,52 s | 221,99 s |
| 8 | `a845add2` | `a845add2` | IDENTYCZNE | 8096 | 786 | 572,88 s | 286,75 s |
| 9 | `9b6a36e0` | `9b6a36e0` | IDENTYCZNE | 11491 | 610 | 579,78 s | 249,73 s |
| 10 | `7e491833` | `7e491833` | IDENTYCZNE | 8109 | 775 | 273,44 s | 145,05 s |

Każda generacja: `hexes=20160`, `rc=0`. Liczby z surowego wyjścia (`CHECKSUM`, `COUNTERS`, `DONE` w logach), zebrane skryptem do JSON, nie z pamięci.

## 2. Wniosek

Pamięć środka lądu (`estimateLandCentroidFromSeed`, FALA 707) nie zmienia przejścia BFS rzek dla ziaren Standardowy 1–10. Potwierdza to wcześniejszy pomiar dla Małego 1–12 i 22 (FC FALA 707). Przyspieszenie na Standardowym: 145–287 s PO wobec 261–580 s PRZED (współczynnik 1,3–2,3×, zależnie od ziarna; najmniejszy zysk na ziarnie 3, największy na 10).

Liczba BFS spada z 5974–12136 do 6–786 wywołań (`estimateLandCentroidFromSeedUncached` po wdrożeniu pamięci). Te dwie kolumny oznaczają to samo wywołanie logiczne, ale różne nazwy licznika. W PRZED nie było warstwy pamięci, więc licznik `estimateLandCentroidFromSeed` = wszystkie wywołania BFS.

## 3. Metoda (dla audytu)

- Baza PRZED: `7b06e233c^` (= `fab9a9b75`). Wg `git log -- gra/src/map/gen-helpers.ts` FALA 707 to dwa commity `7b06e233c` i `a13a33da4`; PRZED = rodzic pierwszego z nich, zgodnie z dispatchem.
- PO: `origin/main` = `96c30f2c4` (dispatch: `8b750e12b` lub nowszy; `gen-helpers.ts` nie zmienia się między nimi).
- Oba drzewa wyeksportowane `git archive` (`gra/`) do katalogu scratch poza repo, `node_modules` podlinkowane z worktree. Źródła `gra/src` nie były modyfikowane.
- Wrapper: istniejący `gra/tools/mapgen-rivers-seed22-diag-build.cjs --instr` + `mapgen-rivers-seed22-diag-wrap.ts` (bez zmian w narzędziach). Wywołanie: `node wrap-<wariant>-instr.js <ziarno> standardowy Standardowy 15 2`, czyli te same parametry co w `R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1`. Instrumentacja dodaje tylko liczniki wywołań w czasie kompilacji bundla; nie zmienia wyniku.
- Suma kontrolna: FNV-1a po posortowanych kluczach hexów (`terenBazowy`, `nakladka`, krawędzie rzek). Ten sam kod w obu wariantach.
- Uruchomienia: 20 generacji, 3 równoległe (4 rdzenie), każda w tle przez `nohup xargs -P 3`, wyniki do plików, odczyt krótkimi wywołaniami. Żadne Bash nie było `run_in_background`.
- Limit 590 s narzędzia nie obciął żadnego pomiaru (najdłuższy PRZED: 579,78 s, ziarno 9; uruchamiany w tle). Skryptu pomiarowego nie zmieniano, nie dodano nowego pliku w `gra/tools/`.
- Wrapper nie był budowany na `gra/src` z dysku głównego repo, tylko z eksportów git dwóch commitów.

## 4. Bramki

| Bramka | Komenda | Wynik (z surowego wyjścia) |
|---|---|---|
| TypeScript | `node_modules/.bin/tsc --noEmit` (w worktree `gra/`) | exit 0, bez błędów |
| Logika | `node tools/logic-test.cjs` | `LOGIC OK (213/213)` |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | `20 pass, 0 fail` |
| Badania | `node tools/research-test.cjs` | `PASSED: 33 / FAILED: 0 / TOTAL: 33` |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | `WSZYSTKIE TESTY ZIELONE (21/21)` |
| Walka | `node tools/combat-test.cjs` | `COMBAT TEST: 6/6 pass` |
| Moc jednostek | `node tools/unit-power-test.cjs` | `6 pass, 0 fail`, exit 0 |
| Dyscyplina diffu | `git diff --check` | czysto |

Uruchomione zostały bramki z tabeli §6 `docs/decyzje/R-PROC-AUTOBOT.md` oprócz Generatora mapy, mgła, AI-budynki, bitwa na polu, karta encji i pozostałych wierszy UI/Chromium (nie uruchamiane w tej rundzie; tematu nie dotykają). Wszystkie uruchomione bramki są zielone na bazie 6a1415472. `map-gen-regression-test.cjs` nie był uruchamiany, bo jest wolny (rzędu minut); ta runda nie zmienia kodu generatora.

## 5. Uwagi dla orkiestratora

- `00-dispatch.md` nie istnieje w `origin/main` pod wskazaną ścieżką (`git show` zwrócił `fatal`). Użyty został `00-dispatch-DODATEK-claude.md` z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, który w treści zawiera pełne zadanie tej rundy. Proszę zweryfikować, czy oryginalny dispatch powinien zostać dodany do `main`.
- Baza `origin/main` w chwili pomiaru to `96c30f2c4`, nie `8b750e12b` podany w dispatchu. Kod `gen-helpers.ts` między nimi się nie zmienia (sprawdzone `git log`).
- Worktree ma nieśledzony `gra/node_modules` (`npm ci --ignore-scripts`, zgodnie z `.gitignore`). Do usunięcia przy sprzątaniu po integracji wraz z katalogiem scratch `mapgen-std` (ok. kilkaset MB wyników i kopii źródeł).
- Pomiar nie zmierzył wydajności w sensie ścisłym: czasy to wall-clock przy 3 równoległych procesach na 4 rdzeniach, więc są zawyżone względem pojedynczego procesu. Współczynnik przyspieszenia (PRZED/PO) jest porównywalny, bo oba warianty działały w tych samych warunkach.
- Nie zmierzono generatora przy innych rozmiarach niż Standardowy 1–10 (zgodnie z zakresem dispatchu). NIE_ZMIERZONO: Standardowy poza 1–10; Duży i Mały poza wcześniejszym pomiarem FC FALA 707.
- Znalezisk poza zakresem nie ma.
