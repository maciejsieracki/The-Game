# 30 — Obrona (runda 4) — R-WEB-POLISH-LANGUAGE-AUDIT-Q1

STATUS: PASS-WITH-NOTES (obrona zarzutów Evaluatora z raportu eca5ab979, kandydat 9673f4661)
DOMAIN: GAME (TEKSTY / PROCES JAKOŚCI)
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: odpowiedzieć na każdy zarzut Evaluatora: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
BAZA: 9673f4661a841e75945f0ae54e81adb65b194299 (kandydat startowy, detached HEAD w worktree)
SHA KODU OBRONY: d248650e970304326c4a470a9b28cbc5f7d7aa32

## Odpowiedzi na zarzuty

### Zarzut 1 (niska waga) — „Super Huge" w panelu wydajności i w raporcie — PRZYJMUJĘ
- Poprawka (commit d248650e9): `gra/src/ui/perfTestPanel.ts` (3 miejsca: wpis raportu ok. linii 459, wynik klasyfikacji ok. linii 563, komunikat „Zapisano" ok. linii 653) oraz `gra/src/ui/perfReport.ts` (linia `rozmiar:` w tekście raportu). Etykieta przechodzi przez `mapSizeDisplayLabel()` z `gra/src/util/map-size-display.ts`; import dodany w obu plikach.
- Klucze i dane bez zmian: `RECOMMENDED_MAX_MAP_SIZE` w `hardwareProfile.ts` nadal zwraca klucz „Super Huge" (klucz zapisu/menu). Slug nazwy pliku raportu (`buildPerfReportFilename`, z `rozmiarLabel`) celowo nietknięty, żeby nie zmieniać nazwy pliku.
- Dowód po zmianie: `grep -n "Super Huge\|Malenki" gra/src/ui/perfTestPanel.ts gra/src/ui/perfReport.ts` daje pusty wynik.
- Strażnik rozszerzony (`gra/tools/polish-language-audit-q1-guard-test.cjs`, sekcje 4 i 5): sprawdzenie importu i użycia `mapSizeDisplayLabel` w obu plikach (z mutacją na próbce surowego tekstu) oraz negatywne sprawdzenie, że surowy `${preset.maxMapSizeLabel}` / `${escapeHtml(preset.maxMapSizeLabel)}` nie wraca w `perfTestPanel.ts` (mutacja: próbka `maks. mapa ${preset.maxMapSizeLabel}` jest łapana).

### Zarzut 2 (informacyjny) — import `formatTurCountAcc` z `../ui/formatPl` w `game/diplomacy-display.ts` — ODRZUCAM (brak żądania zmiany)
- Zarzut sam stwierdza, że nie wymaga zmiany. Zależność game→ui nie jest nowa: w `gra/src/game` jest 11 plików importujących `../ui/`, również przed tą rundą. `formatPl` to czysty moduł formatowania PL bez DOM. Bez zmian.

### Zarzut 3 (informacyjny) — przeredagowanie zdania o zużyciu w `empireDetailPanel.ts` — ODRZUCAM (brak poprawki kategorii 1–3)
- Przeredagowanie było celowe w rundzie 3 (pełne zdanie zamiast skrótu). Liczby bez zmian: ta sama zmienna `zuzyciePerTyp = Math.floor(sumObyw * citizenRate)` i `citizenResCount` (linie 2662 i 2679 w `gra/src/ui/empireDetailPanel.ts`). Zmieniono tylko składnię zdania („zużycie na turę: X sztuk każdego z N surowców epoki"). Zostaje jak w kandydacie.

## ZMIANY-COMMIT
- d248650e9 — `gra/src/ui/perfTestPanel.ts` (import + 4 wywołania), `gra/src/ui/perfReport.ts` (import + 1 wywołanie), `gra/tools/polish-language-audit-q1-guard-test.cjs` (+8 linii sprawdzeń). Allowlista: pliki UI i strażnik tematu.
- `git diff --check` — czysto. `git diff --stat` od 9673f4661: 3 pliki, 14 insercji, 4 usunięcia.
- Brak zmian w wikiBundle: poprawka dotyczy tylko kodu UI, nie docs/encyklopedii. Regeneracja niewymagana; NIE_ZMIERZONO ponowna regeneracja w tej rundzie.

## TESTY (surowe wyniki z tej rundy, na d248650e9)
- `cd gra && npx tsc --noEmit -p .` → exit 0, log pusty.
- `node gra/tools/polish-language-audit-q1-guard-test.cjs` → `polish-language-audit-q1-guard (runda 2, UI): 5120 ok, 0 fail` / `polish-language-audit-q1-guard: 7166 ok, 0 fail` (przed poprawką: 7160 ok; dołożone 6 sprawdzeń).
- `node gra/tools/ids-leak-audit-test.cjs` → `WYNIK: 1648 ok, 0 FAIL`.
- `node gra/tools/wonder-text-no-raw-ids-test.cjs` → `WYNIK: 132 ok, 0 FAIL`.
- `node gra/tools/terminology-trade-vs-tax-test.cjs` → `799 pass, 0 fail`.
- `node gra/tools/hud-gross-net-rest-test.cjs` → `OK: hud-gross-net-rest-test (808 ok, 0 fail)`.
- `node gra/tools/city-administrator-test.cjs` → `119 passed, 0 failed`.
- 5 bramek referencyjnych: NIE_ZMIERZONO w tej rundzie (nie uruchamiane przeze mnie; Evaluator raportuje je zielone na 9673f4661).
- Testy live i przeglądarkowe: NIE_ZMIERZONO. Panel wydajności nie był sprawdzony wizualnie.

## BLOKADY
- Brak blokad technicznych.

## RUNDY
- 4/5 (obrona zarzutów z eca5ab979).

## NASTĘPNY KROK
- Evaluator r4: ponowna ocena SHA d248650e9. Zarzut 1 zamknięty dowodem, zarzuty 2–3 odrzucone z dowodem.

## DEPLOY/PUSH: NIE WYKONANO
