STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-2-TOOLCHAIN-Q1
GOAL: P1.2 z PLAN-PORT-RUST-TAURI-20261020.md §4 — jak się faktycznie buduje/uruchamia web dziś
(node/vite), na świeżo pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym checkoucie `main` (`edb8fb56`), w katalogu `gra/`: zapisać w
`dyspozycje/rust-port/p1/P1-2-TOOLCHAIN.md` — wymaganą wersję Node (z `package.json`/`.nvmrc` jeśli
jest), listę skryptów `npm run *` z `package.json` i co każdy faktycznie robi, realnie przetestowane
polecenie instalacji zależności i URUCHOMIENIA bramek referencyjnych (`node tools/*-test.cjs` — lista
z liczbą plików), zweryfikowany w tej rundzie zakaz z CLAUDE.md tego repo (`npm run build`/`npm run dev`
w `gra/` bez scratch outDir — zacytuj dokładny tekst zakazu i dozwoloną komendę zamienną). NIE
URUCHAMIAJ `npm run build`/`npm run dev` — tylko `npm install`/`npm ci` (w scratch, nie w repo) i
istniejące bramki testowe, jeśli dają się uruchomić bez buildu.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz cytowania wersji Node/listy skryptów z pamięci/starego audytu — każda wartość musi pochodzić z
pliku faktycznie otwartego w tej rundzie, z cytatem.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, zawiera: wersję Node, pełną listę `npm run *` z opisem, dosłowny cytat zakazu
build/dev z CLAUDE.md + dozwoloną komendę zamienną, listę bramek referencyjnych z `gra/tools/*.cjs`
(liczba plików policzona w tej rundzie).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-2-TOOLCHAIN.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-2-TOOLCHAIN-Q1/**`. Odczyt: `gra/**` read-only (świeży checkout
main). Zakaz `npm run build`/`npm run dev`, zakaz `git add -A`.

IZOLACJA
Świeży checkout/clone `main` (`edb8fb56`) w scratch, `npm install` tam dozwolone (nie w repo właściwym).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
