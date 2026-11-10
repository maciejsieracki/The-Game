STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TURN-SLOWDOWN-Q2
GOAL: Final Control po rundzie 2. Oceniane: zarzuty Evaluatora (runda 1, FAIL, Z1–Z7) i obrona `e77a53d4` (rodzic `0f041ad6`, baza `c11f5087` = origin/main). Werdykt oparty na samodzielnie powtórzonych bramkach.

ZAŁOŻENIE: część bramek z zadania skryptu (fmt, clippy -D warnings, próbka wektorów względem funkcji weba) dotyczy portu Rust. Ten temat nie zmienia `rust-port/**`, `src-tauri/**` ani `Cargo.*`, więc te bramki nie mają zastosowania. Zamiast nich bramkami są: tsc, logic, territory-border i `web-turn-slowdown-test.cjs`.

## Orzeczenia

| Zarzut | Orzeczenie | Dowód |
|---|---|---|
| Z1 bramka 24 tur nie ćwiczy P2 per miasto | ODDAL (naprawione w `e77a53d4`) | Domyślnie `TURNS=40` plus asercja M. W moim przebiegu `aiMaxC` wynosiło 3 w T22 i 7 w T39, M OK. Mutację „jedna pamięć” wykrył Evaluator przy 50 turach i obrona przy 40 turach (`evidence/r2-gate40-mutacja-p2.log.txt`). |
| Z2 kryterium (4) wynika z narzutu swiftshadera | ODDAL | Obrona wycofała „spełnione”. Liczy na czasie JS: tura ×2,50, panel ×1,84 (przed poprawką ×6,28 i ×3,28). Dispatch (4) dopuszcza uzasadnienie. Uzasadnienie jest zmierzone: miasta ×3,6, jednostki ×7,9, elastyczność kosztu względem liczby miast 1,43 przed i 0,71 po. |
| Z3 procenty liczone od wszystkich próbek | ODDAL (naprawione) | `r2-profile-fix-city73.txt` podaje %JS od mianownika 306,8 ms. `computeTerritoryResourceYieldByCity` ma 10,6%. Pozostały koszt nazwano P5. |
| Z4 brak spisu tekstur T7–9 | ODDAL (naprawione) | `r2-texsmoke-diff.txt`: w T7 doszły id=244 i 245 `Mesh:CANVAS:72x126` w `unitStatPlatePower`. Tablica `powerDigitTex` ma 10 pozycji (`gra/src/render/unitStatPlate.ts:544`, obrona podaje :545, różnica jednej linii). |
| Z5 P4 bez asercji kosztu | ODDAL (naprawione) | K4 w moim przebiegu: min FIX 65,7 ms wobec PRE 86,8 ms (76% < 85%). |
| Z6 linie bundla zamiast źródła | ODDAL (naprawione) | Streszczenia r2 mają kolumnę `gra/src/**:linia`. Nazwy z kilkoma trafieniami oznaczono jako niejednoznaczne. |
| Z7 zawieszenie może być skutkiem poprawki | ODDAL | Zawieszenie odtworzyło się w PRE, na kodzie bez P1–P4 (`r2-gate40-zawieszenie-PRE-T34.log.txt`). Moje przebiegi FIX, PRE i FIX2 po 40 tur przeszły bez zawieszenia. |

Agregat: 0 × NAPRAW, 7 × ODDAL, czyli PASS.

## Bramki powtórzone samodzielnie

Czysty cel: `git archive e77a53d4 gra` do katalogu tymczasowego, potem `npm ci --ignore-scripts`.

- `tsc --noEmit`: EXIT 0. `logic-test`: 213/213. `territory-border-test`: 9 pass, 0 fail.
- `web-turn-slowdown-test.cjs` przy 40 turach, uruchomiony pojedynczo: **13 OK / 0 FAIL, EXIT 0**.
  - D1: 39/39 tur zgodnych. D2: OK.
  - K1 5,8 vs 451,4 ms; K2 6,9 vs 102,3 ms; K3 1,6 vs 152,2 ms; K4 65,7 vs 86,8 ms.
  - Skróty stanu w T12 (`1c44e526`) i T24 (`7a3564db`) są takie same jak u Operatora i Evaluatora. W T40 skrót wynosi `2bf2abe9` we wszystkich trzech przebiegach.
- Przegląd kodu:
  - P4: argument sporu liczony z pełnej listy `cities`. Wynik jest równoważny fallbackowi z `turn-economy.ts:904`.
  - P2: w zakresie `decideAITurn` (`ai.ts:3067–3766`) nie ma przypisań do pól `cities` ani `units`.
  - Diff src `0f041ad6..e77a53d4` to wyłącznie +64 linie haka testowego.
- Allowlista: `gra/src/main.ts`, `gra/tools/web-turn-slowdown-*.cjs` i ten run. `git diff --check c11f5087 e77a53d4` jest czysty.
- Pierwsza próba bramki skończyła się `ENOSPC` (dysk w 100%), a druga SIGTRAP Chromium przy `TMPDIR` w scratchpadzie. Obie to INFRA, nie wada kodu. Trzecia próba, z domyślnym tmpdir, jest wynikiem podanym wyżej.

## Uwagi (bez blokady)

1. Kryterium (4) ×1,3 nie jest spełnione liczbowo i przyjęte jest na podstawie uzasadnienia. P5, czyli koszt okolicy i terytorium per miasto, to kandydat na osobny temat.
2. K4 ma mały zapas: 76% wobec progu 85%. Serie PRE wahają się od 86,8 do 252,7 ms. Przy dużym obciążeniu K4 może dać fałszywy FAIL.
3. Obrona podaje, że skrót stanu jest wrażliwy na obciążenie CPU (PRE rozjechało się w T15 w przebiegu równoległym). Wskazuje to na zachowanie zależne od zegara w samej grze. Problem istniał przed poprawkami i jest kandydatem na osobny temat. Przy obciążeniu 9–17 w moim przebiegu nie wystąpił.

## Integracja

Kolejność: fast-forward `origin/main` (`c11f5087`) → `0f041ad6` → `e77a53d4` → commit tego raportu.

Gałąź `origin/rust-port/parity-v2` (`8eb124a6`) nie zmienia `gra/src` ani `gra/tools` względem merge-base `f4c89d00`. Konfliktu nie ma i kolejność względem niej jest dowolna.

RUNDY: 2/5 (Final Control po obronie rundy 2)
NASTĘPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY. Wydanie ROBOCZEJ wymaga osobnej zgody właściciela.
DEPLOY/PUSH: NIE WYKONANO
