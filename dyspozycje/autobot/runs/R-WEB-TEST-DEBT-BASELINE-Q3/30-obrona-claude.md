STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko gra/tools/*test*.cjs; gra/src, gra/data, WERSJE.md, manifest nietkniete; zadnych zmian w gra/src - mutacje w gra/src wykonane tymczasowo i przywrocone `git checkout`, `git status` czysty)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: odpowiedz Obrony (runda 4) na 8 zarzutow Evaluatora z kandydata 18df17133: PRZYJMUJE (poprawka + dowod + commit) albo ODRZUCAM (dowod). Kandydat startowy 18df17133, zmiany obrony w commicie 188493117.
BAZA/KANDYDAT: 18df17133f9233f3f3902740bd1f0159bf534cc0 (detach). `git merge-base --is-ancestor 18df17133 origin/main` = NIE (kandydat z linii 51a3f6b94, nie potomek ef6e8ea1e; zgodnie z DODATKIEM 3 nie zakladam ancestry).
ZMIANY-COMMIT: 188493117 (3 pliki): gra/tools/defense-breakdown-test.cjs, gra/tools/budynek-civ-bonus-u17-test.cjs, gra/tools/pr141-hotseat-diplomacy-owner-test.cjs. Raport: ten plik (commit raportu = SHA w polu sha odpowiedzi).
TESTY: patrz sekcja 3 (wszystko ZMIERZONO w tej rundzie, liczby z surowego wyjscia).
BLOKADY: brak blokad technicznych. NIE ROZSTRZYGNIETE: ledger v1/v3/v4, evidence-ledger-behavior, runtime-ordinary-scope (klasy A/C wg Operatora r4; brakujacy krok jak w 10-operator-claude.md sekcja 1).
RUNDY: 4/5 (ta runda = obrona rundy 4, Operator SONNET). Kolejna runda = 5/5 (ostatnia), po niej limit.
NASTEPNY KROK: Evaluator (diff 188493117 + ten raport); ABC wlasciciela wg sekcji 6.
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 [niskie] — defense-breakdown nadal czerwony (6 FAIL, klasa B-2); brak oddzielenia asercji B-2 — CZESCIOWO PRZYJMUJE (dokumentacja), ODRZUCAM separacje
- Dowod, ze wszystkie 6 FAIL to B-2 (zerowe wpisy `walka_hp_*`): w kopii testu z filtrem `b.wartosc !== 0` na `grecyBonusy` (linia 185) wynik = `=== defense-breakdown-test: 46 pass, 0 fail ===` (ZMIERZONO, plik tymczasowy usuniety).
- Lista 6 FAIL na 188493117 (ZMIERZONO, `node gra/tools/defense-breakdown-test.cjs`, exit 1, 33 pass / 6 fail):
  1. "Roster samej kawalerii/rydwanow: ... PUSTA liste" (~linia 304) — zwraca linie HP rydwanow `walka_hp_rydwany=0`
  2. "Roster mieszany: dokladnie 1 linia" (~linia 311) — 2 linie (obrona + HP piechoty)
  3. "Roster cala piechota: 4 z 4" (~linia 327) — dodatkowa linia HP piechoty
  4. "cityDefenseBreakdownLines: 4 linie ... otrzymano 5" (~linia 393) — linia HP piechoty
  5. "cityDefenseBreakdownLines z difficultyMult=1.0: 3 linie" (~linia 407) — j.w.
  6. "REGRESJA: Falanga na Rowninie: 3 z 3" (~linia 497) — j.w. (dodatkowa linia HP)
- ODRZUCAM separacje asercji B-2 do osobnej grupy/`skip`: to ukrylaby czerwony wynik (zakaz z dispatchu: nie usuwac i nie oslabiac testow) albo zmienilaby status klasy B na zielony bez decyzji ABC. Zostawiam czerwone 6 z numerami linii powyzej; kazdy nowy FAIL poza tymi 6 jest od razu widoczny w logu (wynik 33/6 z lista).

### Zarzut 2 [niskie] — oczekiwany opis Falangi i expectedChipCount wyprowadzone z testowanej funkcji — PRZYJMUJE, naprawione (commit 188493117)
- `falangaOpisPl` = wpisany na sztywno `'Walka · obrona · piechoty'` (wartosc z probe na 18df17133: wynik defenderCivBonusBreakdown po obcieciu `— N z M jednostek`).
- `expectedChipCount` = wpisane `6`; osobna asercja "DANE: Grecy maja 6 niezerowych bonusow walki" liczy filtr z danych (zgodny z isCombatModifierBonus) — ZMIERZONO: `[OK] DANE ... (oczekiwano 6)`, `[OK] bonusChipTexts(Grecy): dokladnie 6`.
- MUTACJA dowodzaca (ZMIERZONO): w `gra/src/game/civ-matrix-semantic.ts` (wspolna funkcja `civBonusOpisPl`) dodany prefiks `'X' +` -> nowy test: `32 pass, 7 fail` (dodatkowy FAIL "zawiera chip Falangi"). Ta sama mutacja na wersji testu ze STARYM wyprowadzanym oczekiwaniem (kopia): `33 pass, 6 fail` = chip-check przechodzi. Roznica = nowa asercja wykrywa zmiane tekstu. Zrodla przywrocone (`git checkout`, `git status` czysty).

### Zarzut 3 [niskie] — u17: utracony przypadek "dwa Warsztaty w JEDNYM miescie" — PRZYJMUJE, naprawione (commit 188493117)
- Dodana asercja: `2 Warsztaty w 1 miescie: kamien ×1.10` = `Math.floor(baseKamien * 1.1)`. Kod: turn-economy.ts (~1577) `activeBuiltIds.includes('kamieniarski')` -> +1 na MIASTO, wiec licznik civ-wide liczy miasta, nie budynki.
- ZMIERZONO: u17 `7 passed, 0 failed` (bylo 6/0). Linia: `PASS: 2 Warsztaty w 1 miescie: kamien ×1.10 ... (got 60, want 60)`.
- MUTACJA (kopia testu, oczekiwanie ×1.20 dla tego przypadku): `FAIL: ... (got 60, want 66)`, `6 passed, 1 failed`. Asercja wykrywa kumulacje budynkow w jednym miescie.

### Zarzut 4 [srednie] — pr141-hotseat-diplomacy-owner: asercje `wspolnaReligia` true/false zamienione na `undefined`; utrata dowodu routingu; brak mutacji — PRZYJMUJE (tytul + mutacja), z ograniczeniem
- Zmiana: tytul check() zmieniony z "resolves the nonzero human seat culture and religion" (byl nieprawdziwy po #342) na "does not carry religion flag (decyzja #342...)". Asercje `=== undefined` zostaja - sa to asercje NIEOBECNOSCI zgodne z decyzja #342 i `wspolnaReligia_zaufanie_perTura = 0` (diplomacy.ts:158).
- ZMIERZONO: `TOTAL 10/10` (exit 0).
- MUTACJA (kopia; oczekiwanie `true` zamiast `undefined` dla buildDiplomacyTickCtxForPair(7,99)): `FAIL actual shared diplomacy tick context does not carry religion flag ...` exit 1. Test wykrywa ponowne wprowadzenie flagi do TickCtx.
- OGRANICZENIE (przyjete jawnie): test NIE pilnuje routingu wlasciciela religii (test nie ma juz dodatniego przypadku, bo flaga nie ma efektu na Zaufanie). Routing kultury (roznicaKulturowa) nadal sprawdza check "relation breakdown keeps..." (linie ~160-190).
- ZGLOSZONE (poza zakresem testu): main.ts:44101 nadal buduje `wspolnaReligia` w glownym ticku pary gracz-AI (`sameCultureCircle` + `ownerReligionForOwnerId`), a buildDiplomacyTickCtxForPair (main.ts:24056) jej nie niesie. Efekt na Zaufanie = 0 wg params, wiec to pozostalosc martwa; kandydat do osobnego tematu sprzatania (UWAGI-DLA-ORKIESTRATORA).

### Zarzut 5 [niskie] — brak mutacji dla stubow harnessu (hotseat-*, f04-*, saveload, semantic) — ODRZUCAM
- DODATEK 3 (orkiestrator, 2026-11-16), punkt (3) wymaga mutacji TYLKO dla u17 i defense-breakdown ("mutacje dowodzace moc poprawek u17 i defense-breakdown"). Kryterium formalnie spelnione (w tej rundzie: u17 - pkt 3 odpowiedzi; defense-breakdown - pkt 2 i 1).
- Mutacje stubow dla kazdego harnessu nie sa wymagane dispatchem. Dodatkowo, dla nowych asercji z tej rundy wykonano mutacje (zarzuty 2, 3, 4, 6) - patrz odpowiedzi.
- Potwierdzenie stuba `battleUnitCivBonusy` (Evaluator): zgodne z kodem `unit.civBonusy ?? sideFallback` (ZMIERZONO: test semantic-consumer 52/0 po stubie) - nie zmieniano.

### Zarzut 6 [niskie] — combat-defense-owner-route: HP `>` zlagodzone do `>=`; regex szansy trafienia kruchy; dane matrycy (Grecy/Rzymianie) niezweryfikowane — PRZYJMUJE (mutacja + weryfikacja danych), ODRZUCAM zarzut "kruchy regex" jako niebezpieczny
- Dane ZWERYFIKOWANE (ZMIERZONO, data/civ-matrix.json, params): grecy `walka_obrona_piechota = 0.2` (+20% obrony piechoty), `walka_obrona_morska = 0.5`, `walka_obrona_piechota_teren_plytkie_morze = 0.5`; rzymianie: brak niezerowych `walka_obrona_*`; slowianie `walka_obrona_piechota_teren_las = 0.2`; harappa `..._terytorium_wlasne = 0.15`; hetyci `..._w_murze = 0.15`. Zmiana neutralnego ownera z grecy na rzymian jest zgodna z danymi.
- Glowna asercja (strict) to `activePct < foreignPct` (szansa trafienia z logu), HP jest dodatkowe (`>=`) - HP przy rzucie 0.497 nie rozdziela (54,5%->50,5%), co udokumentowano w komentarzu testu.
- MUTACJA (kopia, `active` liczone z `foreignOpts` = zerwane routingu wlasciciela): `AssertionError ...: walka_obrona_morska: real owner-id battle setup lowers attacker hit chance 54.5% vs foreign 54.5% (defender HP 80 vs 80)` exit 1. Asercja wykrywa zerwanie routingu.
- Regex: przy zmianie formatu logu `Number(undefined)` = NaN i asercja `Number.isFinite` pada (glosno), nie przechodzi cicho. Zachowane.
- Base: `PASS: 45 assertions` (ZMIERZONO, exit 0).

### Zarzut 7 [informacyjne] — 5 pr141 nadal czerwonych; bramka pr141 nie zielona — PRZYJMUJE (informacja)
- ZMIERZONO (petla po wszystkich 33 `gra/tools/pr141-*-test.cjs`, exit code): ZIELONE 28, CZERWONE 5: `pr141-current-evidence-ledger-test` (v1, rc=1, `raw value differs from matrix meta_mnoznik_waluta/asyria`), `pr141-current-evidence-ledger-v3-test` (rc=1, `current per-cell status differs ... prod_szybkosc_jednostki_proc/grecy`), `pr141-current-evidence-ledger-v4-test` (rc=1, ENOENT dla sciezki w R-PR141-CODEX-F04-...), `pr141-evidence-ledger-behavior-test` (rc=1, ENOENT `/workspace/pr141-review/current-consumers.json`), `pr141-runtime-ordinary-scope-test` (rc=1, `Runtime preflight is not ready: approved-snapshot` nie spelniony).
- Uwaga do liczby "68 niezgodnosci" z zarzutu 7 / 10-operator sekcja 1: NIE ZMIERZONO w tej rundzie. Wersja w repo konczy sie na pierwszym bledzie (`throw` w `assert`), wiec liczba 68 pochodzi z kopii z licznikiem Operatora, ktorej nie odtwarzalem.
- Ledger v1/v3: klasa A (snapshot); v4/behavior/runtime-ordinary-scope: klasa C (artefakty nigdy nie byly w repo). Bez zmian w tej rundzie (poza allowlista/wymaga decyzji ABC).

### Zarzut 8 [informacyjne] — map-snapshot-load nie zmierzony swiezo — PRZYJMUJE, ZMIERZONO teraz
- ZMIERZONO na 188493117 (uruchomione w tle przez harness, zakonczone exit 0): `=== map-snapshot-load-test: 58 pass, 0 fail, 1 known-fail (nie liczy sie do exit code) ===`. KNOWN-FAIL = budzet agregatowy rotacji autozapisu 14,364 MB UTF-16 > ~5 MB origin (znany bloker, ABC wlasciciela, nie testy). Czas: nie zmierzony precyzyjnie (przekroczyl 120 s domyslnego limitu Basha i przeszedl w tlo); Operator r3 podawal 169 s.

## 2. Tabela przed/po (czerwone -> czerwone), ZMIERZONO w tej rundzie

| test | kandydat 18df17133 | po obronie 188493117 | klasa |
|---|---|---|---|
| pr141-* (33) | 28 zielonych / 5 czerwonych | 28 / 5 (bez zmian) | ledger v1, v3: A; v4, evidence-ledger-behavior, runtime-ordinary-scope: C |
| pr141-hotseat-diplomacy-owner | 10/10 | 10/10 (tytul + mutacja) | A |
| pr141-combat-defense-owner-route | PASS 45 | PASS 45 (mutacja czerwona) | A |
| defense-breakdown | 32/6 | 33/6 (nowa asercja danych; te same 6 FAIL) | B-2 (6 FAIL, zero-marker) |
| budynek-civ-bonus-u17 | 6/0 | 7/0 (+ asercja 1 miasto) | A |
| map-snapshot-load | nie mierzono | 58/0 + 1 KNOWN-FAIL, exit 0 | C/ABC (budzet rotacji) |
| gate tsc / logic / tech-tree / research / unit-replace / combat | zielone | zielone (ponizej) | - |

Bramki (ZMIERZONO na 188493117): `npx tsc --noEmit` exit 0; logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.`; `git diff --check` czysty.

## 3. Mutacje i probe (wszystkie ZMIERZONE; pliki tymczasowe usuniete; zrodla przywrocone)
- M1 (zarzut 2): `civBonusOpisPl` z prefiksem 'X' -> nowy test 7 FAIL; stary oracle (kopia) 6 FAIL.
- M2 (zarzut 3): u17 kopia z oczekiwaniem x1.20 dla 2 Warsztatow w 1 miescie -> `FAIL ... (got 60, want 66)`.
- M3 (zarzut 4): hotseat kopia z `true` -> `FAIL` exit 1.
- M4 (zarzut 6): combat kopia z zerwanym routingiem (active = foreignOpts) -> `lowers attacker hit chance 54.5% vs foreign 54.5%` exit 1.
- P1 (zarzut 1): defense-breakdown z filtrem zerowych wpisow (kopia) -> 46 pass / 0 fail.

## 4. Zakres zmian obrony vs pozostale pozycje
- Zmienione w tej rundzie: defense-breakdown (oracle literal + chipy), u17 (asercja 1 miasto), hotseat (tytul).
- Bez zmian: pozostale pr141 (patrz sekcja 2), war-epoch-player-first-main-guard (35/0), diplo weaker-seeks/main-guard/gate/truce (zielone).

## 5. B-1 / B-2 (klasa B, NIE naprawiano)
- B-2 (potwierdzony probe P1): `defenderCivBonusBreakdown` (gra/src/game/defenseBreakdown.ts) nie filtruje wpisow o wartosci 0 (`walka_hp_piechota`, `walka_hp_rydwany`, MATRIX_ZERO_MARKER_IDS, civ-bonuses.ts ~293). Kandydat R-WEB-UI-DEFENSE-BREAKDOWN-ZERO-BONUS-LINES-Q1 (1 warunek w defenseBreakdown.ts).
- B-1 (Grecy `walka_obrona_piechota_teren_las` = 0): opis; dane NIE zmieniane (pytanie ABC).

## 6. ABC do wlasciciela (do zadania, nie rozstrzygam sam)
1. Czy zerowe wpisy macierzy maja byc widoczne w panelu "Rozbicie obrony" (B-2 -> R-WEB-UI-DEFENSE-BREAKDOWN-ZERO-BONUS-LINES-Q1)? Do tego czasu defense-breakdown zostaje 6 FAIL.
2. Ledgery PR141 (v1/v3): odswiezyc (generate.cjs + manifest) czy oznaczyc archiwalne? (poza allowlista.)
3. Testy bez artefaktow (v4, evidence-ledger-behavior, runtime-ordinary-scope): odtworzyc dowody czy usunac z bramki?
4. map-snapshot-load KNOWN-FAIL: budzet rotacji autozapisu 14,364 MB > ~5 MB origin - architektura rotacji (decyzja).

## 7. Znaleziska poza zakresem (UWAGI-DLA-ORKIESTRATORA)
- Pozostalosc `wspolnaReligia` w main.ts:44101 (glowny tick pary gracz-AI, bez efektu na Zaufanie) - kandydat do sprzatania po #342 (osobny temat; nie w tym temacie).
- Nie utworzono zadnych sesji, zadan ani harmonogramow (ZAKAZ z dispatchu przestrzegany).
- Komenda Basha dla map-snapshot-load przekroczyla domyslny limit 120 s i przeszla w tlo (harness); wynik odebrany z pliku wyjscia (exit 0). Na przyszlosc: pierwszy plan wywolan z timeout >= 300000 ms.
