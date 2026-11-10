STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1
GOAL: Plan podziału `gra/src/ui/cityPanel.ts` (pin `edb8fb56`, 11 986 LOC) na kawałki portowalne dla frontend-v2. Tylko dokument, bez portu kodu.
ZMIANY/COMMIT: allowlista zachowana. Commit `722ae757` (plan + logi): `dyspozycje/rust-port/p5/P5-8-CITYPANEL-PODZIAL.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1/r1-logi/**` (logi `.log` dodane jawnie przez `git add -f`, bo `.gitignore:20` ignoruje `*.log`). Zero zmian w `gra/**` i w kodzie Rust. Push nie wykonano.
TESTY:
- Pokrycie: 31 sekcji, suma LOC = 11 986 = liczba linii pinu, każda linia w dokładnie jednej sekcji (`assert` w skrypcie, EXIT=0). Log: `r1-logi/01-inwentarz-pokrycie.log`.
- Cykle funkcji: po przecięciu 3 krawędzi zwrotnych do orkiestracji (`rerender`, `switchCity`, `renderCityIconRightRail`) zostaje 6 nietrywialnych SCC (`r1-logi/03-scc-funkcji.log`).
- Cykle kawałków: 5 cykli międzykawałkowych w proponowanym podziale (`r1-logi/02-chunki-cykle.log`). Plan przecięć (§3 dokumentu) NIE_ZMIERZONO po zastosowaniu.
- Dryf `git diff --stat edb8fb56 origin/main -- gra/src/ui/cityPanel.ts`: 332 linie (+259/−73), 67 hunków, mapa na sekcje w `r1-logi/04-dryf-sekcje.log`.
- Brak trafień 3D/canvas w kodzie pliku; 3D wchodzi przez `unitMiniPreview.ts` (Three.js, `cityPanel.ts:168`, `:7871`, `:7988`).
- `git diff --check`: czysto (0 spacji na końcu linii w dokumencie).
BLOKADY:
- Kryterium „kolejność bez cykli zależności” NIE SPEŁNIONE dla obecnego podziału (5 cykli); przecięcia opisane w §3 do wykonania i ponownego pomiaru w r2.
- Port od pinu czy od `origin/main` (drift 332 linie) wymaga decyzji orkiestratora (ZAŁOŻENIE P5.8-Z2: pin).
- Worktree startuje z `91dc998a`, który nie zawiera gałęzi docs (393 commity za `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Dispatch i dokumenty P5 odczytano przez `git show`. Plik `01-operator-r1.md` i logi są w tym commicie; integracja z gałęzią docs po stronie orkiestratora.
- Analiza oparta na regex, nie AST. Identyfikatory w komentarzach mogą zawyżać krawędzie (NIE_ZMIERZONO).
- Ograniczenia właściciela: 3D jednostek (`unitMiniPreview`) i rysowanie kafli okolicy (mapa) odłożone na koniec (§6 dokumentu). Nie portowane.
RUNDY: 1/5
NASTĘPNY KROK: Runda 2 (Operator): wykonać przecięcia §3 jako przeniesienia helperów, zmierzyć ponownie `p5-8-chunki.py`, zapisać wynik jako pomiar. Potem Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO
