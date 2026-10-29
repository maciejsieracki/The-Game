STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1
GOAL: Niezależna weryfikacja K01B (bf7223a6 na bazie b31cd50c) oraz pomiary: gate'y, wierność kopii do pinu edb8fb56, mutacje pól DTO.
ZMIANY/COMMIT: allowlista: `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1/**` (surowe logi `r1-logi/`, raport), `dyspozycje/rust-port/p5/P5-8-K01B.md` (sekcja pomiarów). Kod `src-tauri/frontend-v2/src/**` NIE zmieniony (mutacje cofnięte `git checkout --`, `git status` czysty przed commitem). Commit: SHA w sekcji "Commit" niżej.
TESTY:
- `npm ci` EXIT 0 (r1-logi/npm-ci.txt).
- `npm run typecheck` EXIT 0 (r1-logi/typecheck.txt).
- `npm run check` EXIT 0: self-test 33/15; check-no-logic-imports 153 plików, trafień 0; verify-pin-copies 435, niezgodnych 0 (r1-logi/check.txt). UWAGA: verify-pin-copies NIE obejmuje plików k01b (nie są bajtowymi kopiami; manifest ich nie zawiera).
- `cargo fmt --check` w `src-tauri/` EXIT 0 (r1-logi/cargo-fmt.txt). Clippy/test Rust NIE uruchomione: diff b31cd50c..bf7223a6 dotyczy wyłącznie plików TS w frontend-v2 (9 plików, 1108 linii dodanych, zero zmian Rust).
- Wierność (niezależny skrypt `r1-logi/verify-k01b.mjs`, wynik `r1-logi/verify-out.txt`; pin z `git show edb8fb56:gra/src/ui/cityPanel.ts`): 57 jednostek z `odroczone.json` (K01A r3). Markery `// pin edb8fb56` w k01b-*.ts: 55 bloków. Zakresy markerów nie pokrywają się dokładnie z zakresami listy (np. 677-693 vs 677-695, 1039-1072 vs 1039-1074); część jednostek (np. PULA_LBL, PULA_LBL_PELNA, CityWithSliders) nie ma osobnego markera. Obecność nazw: sprawdzona grepem, wszystkie wybrane nazwy są wyeksportowane. Różnice po normalizacji (bez `export`, spacje): 638 niepustych linii pinu; 40 bloków z różnicą; 93 linie brakujące, 84 nadmiarowe. Różnice to: renamy typów (`*K`), wywołania `reguly().X`, JSDoc. Nie są to zmiany wartości, poza punktami opisanymi niżej.
- Stałe etykiet zweryfikowane ręcznie wobec pinu: PODZIAL_PRACY_PULA_LBL/_PELNA/_TIP (gra/src/game/cities.ts:533-541), CITY_PANEL_RANGE_DEPOSIT_LABELS (gra/src/game/resource-access.ts:243-247), daninaLabel = 'Podatek' (gra/src/game/danina-nazwa.ts, stała decyzja 2026-07-27): zgodne.
- Port reguł `reguly()` rzuca przy braku wstrzyknięcia (k01b-reguly.ts:46-51): potwierdzone odczytem kodu, NIE sprawdzone testem wykonania.
- Mutacje pól DTO (`src/ui/cityPanel/k01b-dto.ts`, tsc --noEmit, błędy liczone z `error TS`):
  - M1 ProductionItemK.koszt -> 3 błędy (wykryte)
  - M2 CityProductionK.kolejka -> 18 (wykryte)
  - M3 BuildingDefK.maksPoziom -> 2 (wykryte)
  - M4 GrowthPercentBreakdownK.total -> 2 (wykryte)
  - M5 GameDataK.units -> 2 (wykryte)
  - M6 podzialPracy/podziałPracy.procentBudynki -> 0 (NIEWYKRYTE; pole nieczytane w żadnej jednostce K01B, tylko zadeklarowane; nie błąd)
  - M7 EmpireFoodTickK.nakarmione -> 1 (wykryte)
  Mutacje behawioralne (wartości w runtime) NIE_ZMIERZONO.
BLOKADY:
- Harness DOM 57 jednostek vs pin (wzór run-k01a.mjs): NIE_ZMIERZONO, nie zbudowany w tej rundzie. Kryterium dispatchu "harness identyczny z pinem" NIESPEŁNIONE.
- Testy wykonania (runtime) jednostek R/F/DOM: NIE_ZMIERZONO.
- Podłączenie `CityPanelRulesPort` w `src/controller/**`: poza tematem (osobny temat).
- Brak `harness:k01a`/`harness:k01b` w package.json (K01A harness nie ma skryptu npm).
RUNDY: 1/5 (runda pomiarów tej samej rundy numeru 1; kolejna runda: harness DOM + testy wykonania)
NASTĘPNY KROK: Evaluator na 751519fc..bf7223a6 z uwzględnieniem tabeli NIE_ZMIERZONO. Osobny Operator-impl r2: harness DOM vs pin (57 jednostek) i testy behawioralne reguł przez port testowy.
DEPLOY/PUSH: NIE WYKONANO

Commit: zob. wiadomość commita tej rundy (commit po `git add` jawnych ścieżek; bez push).
