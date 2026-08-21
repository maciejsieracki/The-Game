# 01-operator — R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1

## Potwierdzenie zakresu

- Checkout: `Civ-clean-main-2026-08-20`
- README: potwierdzone w katalogu checkoutu.
- HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`).
- FALA: `300`, zgodnie z `00-dispatch.md`.
- Deploy/push: nie wykonano.
- Allowlista: `gra/src/ui/cityPanel.ts`, `gra/src/ui/empireDetailPanel.ts`, `gra/src/ui/buildModeHud.ts`, `gra/src/game/auto-improvements.ts`, `gra/src/game/cities.ts`, `gra/src/game/empire-city-defaults.ts`, celowane testy `gra/tools` i artefakt runu.

## Recon kontrolek

### A — nadrzędny podział zebranego budżetu Praca

Kod: `EmpirePracaSplit.procentUlepszenia`, odczyt/zapis przez `getEmpirePracaSplit` i `onEmpirePracaSplitChange`.

- Dotyczy całej puli Pracy imperium już dostępnej do wydania.
- `0–50%` na ulepszenia terenu.
- Budynki są wyliczaną resztą `100% − ulepszenia`.
- Ten suwak nie jest budżetem automatu.

### B — tryb automatycznego użycia budżetu na ulepszenia

Kod: `UlepszeniaEmpirePolicy.pracaAutoPercent`, per-miasto `City.ulepszeniaPracaPercent`, przekazanie do `pickAutoImprovements` jako `pracaBudgetPercent` / `getPracaBudgetPercent`.

- Dotyczy wyłącznie wydatku auto-managera ulepszeń.
- Zakres sterowania: `0–100%`.
- `0%` wyłącza automatyczny wydatek; `100%` pozwala użyć całej dostępnej puli z zachowaniem rezerwy.
- Polityka imperium i override miasta są osobnymi zapisami od A.
- `pickAutoImprovements` stosuje wspólny pułap imperium i nie pozwala override miasta przebić polityki imperium.

Wniosek: A nie blokuje ani nie steruje B. Po reconie nie pozostaje realna niejednoznaczność, więc ABC nie jest potrzebne.

## Zmiana w tej próbie

- W `gra/src/game/cities.ts` dodano wymagany przez istniejący import w `gra/src/game/ai.ts` eksport `clampPodzialPracyBudynkiPercent`.
- Funkcja ogranicza wyłącznie lokalny suwak `procentBudynki` do `0–100%`, zaokrągla wartości i dla niepoprawnej liczby wraca do istniejącego defaultu `70%`.
- Nie zmieniono kontraktu globalnego budżetu: ulepszenia `0–50%`, budynki jako `100% − ulepszenia`.
- Nie zmieniono automatyzacji ulepszeń: `pracaAutoPercent` pozostaje `0–100%`.
- Nie zmieniono `ai.ts`; naprawa ogranicza się do brakującego eksportu w allowliście.

## Dokładny diff tej próby

- `gra/src/game/cities.ts`: +6 linii funkcji eksportowanej `clampPodzialPracyBudynkiPercent`.
- `dyspozycje/autobot/runs/R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1/01-operator.md`: aktualizacja raportu.
- Widoczna zmiana diakrytyki w komentarzu `cities.ts` oraz wszystkie pozostałe modyfikacje/artefakty w `git status` były pre-existing; nie nadpisywałem ich ani nie przypisuję ich temu runowi.

## Testy

- `npm run typecheck` (w `gra/`) — **PASS**, `tsc --noEmit`, exit 0.
- `node tools/praca-split-ui-test.cjs` — **13 pass, 0 fail**.
- `node tools/auto-improvements-test.cjs` — **43 pass, 0 fail**.
- `node tools/wire-ekonomia-test.cjs` — **37 pass, 0 fail**.
- `node tools/empire-city-defaults-test.cjs` — **49 pass, 0 fail**.
- `node tools/praca-miasto-limit-50-test.cjs` — **4 pass**.
- Pierwsze uruchomienie testów skryptowych dostało `EPERM` sandboxu przy zapisie tymczasowych entrypointów; ponowienie z wymaganym dostępem zakończyło się wynikami powyżej.

## Ograniczenia i następny krok

- Worktree nadal zawiera obce modyfikacje poza allowlistą, w tym `ai.ts` i wiele innych plików. Zostały zachowane bez resetu, checkoutu, clean, usuwania ani nadpisywania.
- Ten raport potwierdza zakres mojej próby, ale nie deklaruje, że cały historyczny worktree jest czystym diffem runu.
- Następny krok: niezależna ponowna ocena diffu i raportu; nadal bez integracji, commita, deployu i pushu.

STATUS: PASS-WITH-NOTES
TEMAT: R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1
GOAL: Rozdzielić globalny budżet Pracy od automatu ulepszeń i zachować niezależny lokalny split miasta.
ZMIANY/COMMIT: `gra/src/game/cities.ts` + raport runu; brak commita.
BLOKADY: pre-existing dirty worktree poza allowlistą.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO

---

# CYKL NAPRAWCZY PO LIMIT-5-EXCEEDED — decyzja właściciela, 2026-08-21

STATUS: **PASS-WITH-NOTES — OPERATOR CLOSED FOR EVALUATOR**  
CYKL: **REPAIR-AFTER-LIMIT** — nie jest zwykłą rundą `6`; licznik historyczny
pozostaje jawnie `5/5`, z poprzednim terminalnym `LIMIT-5-EXCEEDED`. Nie zeruję
historii i nie nadaję temu cyklowi numeru `6/5`.

TEMAT: `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1`

GOAL: lokalny podział Pracy miasta ma respektować tę samą regułę co cywilizacja:
ulepszenia maksymalnie `50%`, a pozostała część trafia do budynków; niezależny
automat ulepszeń zachowuje swój własny zakres `0–100%`; zapis/odczyt nie może
przepuścić starej wartości ponad cap.

## Decyzja właściciela i provenance R5

- Bieżące polecenie właściciela jest jawną autoryzacją wznowienia tego samego
  exact-ID po `LIMIT-5-EXCEEDED`. Nie tworzę nowego ID, nie uruchamiam zwykłej
  rundy `6` i nie zmieniam licznika `5/5`.
- W live snapshot `Civ-clean-main-2026-08-20` istnieje exact-ID ślad
  `00-dispatch.md → 01-operator.md → 02-evaluator.md` poprzedniego pakietu.
- Pełny historyczny pakiet R5 (`00`–`03`) znajduje się w izolacji
  `_operator-work3-R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1`, nie w kanonicznym
  live snapshot. Klasyfikuję go jako **historyczny dowód z izolacji**, nie jako
  kanonicznie zintegrowany pakiet R5; nie kopiuję go ani nie integruję, bo byłoby
  to poza zakresem właściciela.
- Ten append-only artefakt jest pierwszym bezpośrednim raportem Operatora dla
  jawnego cyklu naprawczego po limicie i zamyka wcześniejszą lukę provenance bez
  fałszowania numeracji rund.

## Recon reguły 0–50% i separacji automatu

- `gra/src/game/cities.ts`: `clampPodzialPracyBudynkiPercent` normalizuje lokalny
  udział budynków do `50–100%`; zatem udział ulepszeń/puli wynosi `0–50%`.
- `gra/src/ui/cityPanel.ts`: lokalny input ma `min='50'`, `max='100'`; zapis przechodzi
  przez ten sam clamp, a reszta jest `100% − budynki`.
- `gra/src/game/empire-city-defaults.ts`: resolver, migracja i stare save’y używają
  tego samego clampu.
- `gra/src/ui/empireDetailPanel.ts` oraz `gra/src/game/cities.ts`: nadrzędny suwak
  cywilizacji pozostaje `0–50%` na pulę ulepszeń; automatyzacja nie jest przez niego
  ograniczana i zachowuje zakres `0–100%`.
- Nie wykonano żadnej zmiany kodu w tym cyklu; nie rozszerzono allowlisty i nie
  dotknięto tematów obcych.

## Testy

| Bramka | Wynik |
|---|---|
| `npm run typecheck` (`gra/`) | **PASS**, exit `0` |
| `node tools/praca-miasto-limit-50-test.cjs` | **PASS**, `4 pass` — stary `0%` → `50%` budynków, legalne `70%`, migracja i ensure/save default |
| `node tools/praca-panel-parity-test.cjs` | **PASS**, `16 passed, 0 failed` — warianty `0/100`, `50/50`, `100/0`, dwa ticki i save/load puli |
| `node tools/praca-split-ui-test.cjs` | **PASS**, `7 pass, 0 fail` — zakres nadrzędnego suwaka `0–50`, wiring i remainder |
| `node tools/empire-city-defaults-test.cjs` | **PASS**, `49 pass, 0 fail` — resolver/migracja/persistence |
| `node tools/auto-improvements-test.cjs` | **PASS**, `43 passed, 0 failed` — automat nadal rozdzielony i obsługuje `0–100%` |

Pierwsze uruchomienie testów dynamicznych zwróciło sandboxowe `EPERM` przy
tworzeniu tymczasowych entrypointów w `gra/tools`; ponowienie z wymaganym
dostępem zakończyło się wynikami powyżej. Nie powstał commit ani zmiana kodu.

ZMIANY/COMMIT: tylko ten append-only artefakt exact-ID; **kod: brak zmian**;
commit: **NIE WYKONANO**.

TESTY: wszystkie wymagane bramki reguły `0–50%`, wiring suwaka, separacji automatu
i zapisu/odczytu — **PASS** jak w tabeli.

BLOKADY: brak blokady funkcjonalnej. Pozostaje nota procesowa: live snapshot ma
zastane dirty diffy wielu tematów, a historyczny pakiet R5 jest w izolacji, nie
kanonicznie zintegrowany. Nie przypisuję tych zmian temu cyklowi.

NASTĘPNY KROK: **Evaluator Luna High** dla tego samego exact-ID; ma niezależnie
potwierdzić zakres, provenance cyklu po limicie, testy i brak potrzeby zmiany kodu.

DEPLOY/PUSH: **NIE WYKONANO**. Integracja również **NIE WYKONANO**.
