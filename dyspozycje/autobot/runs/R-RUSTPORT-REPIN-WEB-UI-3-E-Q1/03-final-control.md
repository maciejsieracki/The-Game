STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-E-Q1
GOAL: Przepiąć bloki K `cityPanel` w `src-tauri/frontend-v2/src/ui/` z webu `86d510c66` na `9b019a7d8` (FALA 509–532). Dostarczyć harness partii w Chromium, mutacje, niezależny weryfikator i regresję na kodzie końcowym.
ZMIANY/COMMIT: oceniany kod: gałąź `op-ui3e-r2`, `c5acea712` (`b02f96ca5`, `6726e5abb`, `e6d5367ef`, `c5acea712`) na bazie `dde5e9034`. Merge-base potwierdzony, równy obecnemu `origin/rust-port/parity-v2`. Ten raport jest w gałęzi `fc-ui3e`, w commicie nad `c5acea712`.
TESTY: niżej. Wszystkie zmierzyło FC na `c5acea712`, w worktree `wf_7705c3c3-f05-4`.
BLOKADY: brak.
RUNDY: 2/5 (Evaluator r1 FAIL, potem obrona r2, potem FC).
NASTĘPNY KROK: integracja przez orkiestratora, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenia

| Zarzut | Orzeczenie | Dowód FC |
| --- | --- | --- |
| Z1 brak raportu | ODDAL (naprawione) | Plik `01-operator-r2.md` jest w `c5acea712` i ma wszystkie pola kontraktu, SHA i wyniki. |
| Z2 harness poza commitem | ODDAL (naprawione) | W `e6d5367ef` są `run-repin-ui3e.mjs`, `mutate-repin-ui3e.mjs` i `fixtures/repin_ui3e-web-vectors.json`. Po przebiegach `git status` jest czysty. |
| Z3 mutacje niezmierzone | ODDAL (naprawione) | FC zmierzył 17/17 wykrytych, 0 przeżyło, 0 błędów, w dwóch seriach (`--only`). Przypadek kontrolny przeszedł we wszystkich 10 bramkach z EXIT 0. M16 wykrywa `k03m`. |
| Z4 brak dowodu z przeglądarki | ODDAL (naprawione) | `run-repin-ui3e` w Chromium 141 (`chromium-1194`): EXIT 0, 10 jednostek, 507 wektorów, 0 różnic, HUNK 7/7, DOM web = port, `pageerror`+`console.error` = 0. PNG 1280×720 `55c04d53…6313` i 360×640 `479c7c79…7ab6` są bajtowo równe web/port. FC obejrzał PNG: widać chipy „Wymaga rzeki przy mieście” i „(epoka ×N)”. `webVectorsSha256 8790e8d0…` = fixtura. |
| Z5 regresja niezmierzona | ODDAL (naprawione pomiarem obrony, częściowo powtórzonym przez FC) | FC: UI-3-A 33×2 scen, 360 kroków, PIX 0, 56/56, 0 różnic, EXIT 0. Harnessy K (k05a, k06b-copies, k07a, k07b, k09a, k08e, k03-units, k03) dały EXIT 0 w przypadku kontrolnym mutacji. Pozostałe wyniki (L0, L1A, L2, C4, hud, cityux, run-cycles 1623 = E-Z3, UI-2-A…G) zmierzyła obrona, FC ich nie powtórzył. |
| Z6 brak niezależnego weryfikatora | ODDAL (naprawione) | `verify-repin-ui3e-fixture.mjs` na drugim, osobnym `git archive 9b019a7d8`: F1, F2 i F3 OK, niezgodności 0, EXIT 0. |
| Z7 brak skryptów i dokumentacji | ODDAL (naprawione) | `package.json` ma 3 nowe skrypty i zero innych zmian. `P5-REPIN-UI-2.md` dostał sekcję „UI-3-E” (+74/−0). |

Żaden zarzut nie wymaga naprawy ani decyzji człowieka.

## Bramki (FC, `c5acea712`)

- `tsc --noEmit`: EXIT 0.
- `npm run check`: EXIT 0. Wyniki: pin 426/0, kblocks rev `9b019a7d8` 37 plików i 323 zakresy, UI-3: 12 kopii, 1 adapter, kblocksE 7/7, niezgodnych 0.
- `git diff --check dde5e9034 c5acea712`: czysto.
- Allowlista: 101 plików. Poza `cityPanel/**`, `tools/**` i `types.ts` zmieniono tylko `package.json` (skrypty), `P5-REPIN-UI-2.md` (sekcja) i raport w runie.
  - `types.ts`: +2 linie (`ownerEra?: number`).
  - Wspólne pliki są zmienione addytywnie: `repin-ui3-manifest.json` dostał osobny blok `kblocksE`, a `verify-repin-ui3-copies.mjs` +42/−0.
  - Zero zmian w `gra/`, `rust-port/`, `src-tauri/src/`, `Cargo.*`, `WERSJE.md` i `gra-robocza/`.

## Kolejność integracji

- `c5acea712` i ten raport stoją bezpośrednio na `dde5e9034`, czyli na obecnym `origin/rust-port/parity-v2`. Wejdą fast-forwardem, jeśli trafią pierwsze.
- Partie UI-3-B, C i D edytują te same wspólne pliki: `repin-ui3-manifest.json` (zamknięcie `]` i blok po nim), `verify-repin-ui3-copies.mjs`, `package.json` i `P5-REPIN-UI-2.md`. Przy kolejnych partiach orkiestrator musi rozwiązać konflikty addytywnie. Po każdym scaleniu trzeba ponowić `npm run check` i `run-repin-ui3e` + `verify-repin-ui3e-fixture`.

## NIE_ZMIERZONO przez FC

- Pełna regresja L0, L1A, L2, C4, hud, cityux, run-cycles i UI-2-A…G. Wymaga nakładek PINOV i WEB86U3, a dysk ma ok. 3,5 GB wolnego. Opieramy się na pomiarze obrony.
- `run-newgame`.
- GPU i natywne okno Tauri.
- Podpięcie hooków kontrolera v2 (P6).
