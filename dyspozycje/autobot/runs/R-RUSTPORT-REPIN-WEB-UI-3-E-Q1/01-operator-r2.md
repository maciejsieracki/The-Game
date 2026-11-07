STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-E-Q1
GOAL: Przepiąć bloki K `cityPanel` w `src-tauri/frontend-v2/src/ui/` z webu `86d510c66` na `9b019a7d8` (FALA 509–532). Dostarczyć harness partii w Chromium, mutacje, niezależny weryfikator i regresję na końcowym kodzie.
ZMIANY/COMMIT: gałąź `op-ui3e-r2` = r1 (`b02f96ca5`, `6726e5abb`) + `e6d5367ef` (r2). Baza `dde5e9034`. Pliki spoza `src/ui/cityPanel/**`, `tools/**` i `viewmodel/types.ts`: tylko `package.json` (skrypty) i `P5-REPIN-UI-2.md` (sekcja UI-3-E). Zero zmian w `gra/`, `rust-port/`, `src-tauri/src/`, `Cargo.*`, `WERSJE.md`, `gra-robocza/`.
TESTY: wyniki niżej, wszystkie na `e6d5367ef`.
BLOKADY: brak.
RUNDY: 2/5 (obrona po Evaluator r1 FAIL).
NASTĘPNY KROK: Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

- **Z1 PRZYJMUJĘ.** Raport r1 nie powstał. Ten plik zawiera SHA i wyniki bramek.
- **Z2 PRZYJMUJĘ.** Pliki niezacommitowane w worktree r1 przeczytałem w całości i zacommitowałem jawnym `git add` w `e6d5367ef`:
  - `run-repin-ui3e.mjs`, `mutate-repin-ui3e.mjs` (dodałem `--tmp-dir`) i fixturę `repin_ui3e-web-vectors.json`. Fixtura jest bajtowo równa tej z r1 (`cmp`).
  - Rozszerzenia wektorów w `run-k07b-units.mjs` i `run-k09a-pin.mjs`.
  - W worktree r1 `k-ui3e-host.ts` zawierał pozostawioną mutację M6 (`oblegane: false`). Tego pliku NIE przeniosłem: w commicie jest oryginał.
- **Z3 PRZYJMUJĘ.** Pierwszy przebieg dał 15/17: M11 i M16 przeżyły.
  - M11: `run-k09a-pin` zdejmował `disabled` przed zrzutem `outerHTML`. Teraz zapisuje stan przed zdjęciem atrybutu.
  - M16: `run-k03` dostał 2 asercje `ownerEra`.
  - Po poprawce: KONTROLA 10 bramek EXIT 0, mutacji 17, wykryte 17, przeżyły 0, błędy 0, EXIT 0.
- **Z4 PRZYJMUJĘ.** `run-repin-ui3e` ładuje CAŁY `cityPanel.ts` z `git archive 9b019a7d8` oraz moduły portu w Chromium 141 (`/opt/pw-browsers/chromium-1194`).
  - 10 jednostek, 507 wektorów, różnic 0, 7/7 HUNK.
  - DOM web = port.
  - PNG 1280×720 (`55c04d53…`) i 360×640 (`479c7c79…`) bajtowo równe.
  - `pageerror`+`console.error` = 0. PNG obejrzane: chipy, w tym „Wymaga rzeki przy mieście”.
- **Z5 PRZYJMUJĘ.** Regresja na końcowym kodzie. Nakładki `PINOV`/`WEB86U3` zbudowałem od nowa (`niezgodnych=0`). Wyniki:
  - L0 3861/0, L1A 3618/0, L2 1784/0 (354/150), C4 1649/0 (75), hud 909/0, cityux 164/0.
  - `run-cycles` 6442/1623, wyłącznie znane E-Z3 (`diplomacyTradeBasket` 1592 + `diplomacyAudience` 31; reszta 0).
  - UI-2-A 2292/0, B 1356/0, C 752/0, D 797/0, E 183/0, E-cycles 9335/0, F 35 scen/0, G 9216/0.
  - UI-3-A 33×2 scen, PIX 0, 56/56.
- **Z6 PRZYJMUJĘ.** Dodałem `verify-repin-ui3e-fixture.mjs`. Działa na DRUGIM, osobnym `git archive 9b019a7d8` i sprawdza trzy rzeczy:
  - F1: spójność fixtury z sha;
  - F2: obecność hunków w źródle webu;
  - F3: ponowny przebieg daje to samo `webVectorsSha256`, te same `values`/`vectors` i te same sha PNG.
  - Wynik: niezgodności 0, EXIT 0. Test negatywny (1 wartość fixtury zmieniona): 2 FAIL, EXIT 1. Fixturę przywróciłem i sha się zgadza.
- **Z7 PRZYJMUJĘ.** Dodałem skrypty `harness:repin-ui3e`, `harness:repin-ui3e:mutate` i `harness:repin-ui3e:verify` oraz sekcję „UI-3-E” w `P5-REPIN-UI-2.md`. Sekcja nie ma numeru, żeby nie kolidować z partiami B/C/D.

## Bramki (`e6d5367ef`)

- `tsc --noEmit`: EXIT 0.
- `npm run check`: EXIT 0. Pin 426/0. UI-2 0 niezgodnych. UI-3: 12 kopii, 1 adapter, kblocksE 7/7, niezgodnych 0.
- Bramki K na `9b019a7d8`:
  - k05a 6136/0, k06b-copies OK, k07a 5296/0;
  - k07b 353/0 (renderProd 11 przypadków), k09a 73/73, k08e 54/54;
  - k03-units 34/0, k03 33/0.
- `git diff --cached --check`: czysto.

## Założenia i NIE_ZMIERZONO

- **E3-Z1:** brak `dto.ownerEra` daje 1, tak jak web `?? 1`.
- **NIE_ZMIERZONO:**
  - `run-newgame` (spoza listy dispatchu). Przekroczył 560 s przy load ≈ 5,6 (4 równoległe partie). Partia nie zmienia `newGameFlow`.
  - GPU i natywne okno Tauri.
  - Podpięcie hooków w kontrolerze v2 (P6, poza zakresem).
- **Uwaga procesowa:** jedno wywołanie regresji przekroczyło 590 s i narzędzie samo przeniosło je w tło. Doczekałem końca przed dalszą pracą i wyniki są wyżej.
- **node_modules:** podlinkowany symbolicznie (niezacommitowany) z worktree r1. Archiwa webu leżą w `scratchpad/ui3e-r2` i usunę je po etapie.
