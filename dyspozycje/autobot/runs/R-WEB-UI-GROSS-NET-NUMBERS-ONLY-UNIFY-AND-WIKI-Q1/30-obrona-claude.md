# R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1 — obrona Operatora (runda 2, po zarzutach Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI + dokumentacja gracza; bez logiki gry)
TEMAT: R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1
GOAL: Nauka, Żywność i Handel w panelu imperium pokazują same liczby (Nauka i Handel jako jedna liczba, bez zdublowanej strzałki; Żywność jako „+brutto → +netto”); opis i jednostka w `title`; `grossNetSub` usunięta; wiki §53.1a zaktualizowane, wikiBundle przez generator.
BAZA: `87b040130` (kandydat z 10-operator-claude.md); `bd647523b` jest jego przodkiem (`git merge-base --is-ancestor` OK). Worktree przepięty na `87b040130` (detached), potem poprawki w commicie obrony.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

- **Zarzut 1 (zrzut z żywego Chromium, kryterium (c)): PRZYJMUJĘ, CZĘŚCIOWO.** Przyczyna: `/opt/pw-browsers/...` nie istnieje (Playwright nie pobierze przeglądarki, zgodnie z dispatchem). Systemowy `/usr/bin/chromium` (Chromium 141.0.7390.37) działa po `executablePath`. Wykonałem render fragmentów HTML generowanych przez funkcje z aktualnego kodu (`singleNumberSub` dla Nauki i Handlu, `grossNetNumbersSub` dla Żywności) w tym samym układzie nagłówków co panel. Zrzut obejrzany narzędziem Read: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r1/numbers-only.png`. Widać: „+12” (Nauka), „+8 → -3” (Żywność), „+40” (Handel), bez słów „Brutto/netto” i bez „/ turę” w liniach liczbowych. Tooltipy odczytane z DOM (`title`) zgodne z dispatchem.
  - NIE_ZMIERZONO: pełny panel imperium w żywej grze (build vite poza repo nie był wykonany w tej rundzie). Zrzut to render wyizolowanych fragmentów, nie całego panelu w aplikacji. Dispatch dopuszcza render testowy jako uzupełnienie, nie jako zamiennik żywego zrzutu.
- **Zarzut 2 (tautologiczny M1): PRZYJMUJĘ.** Przepisany blok mutantów: każdy mutant jest zastosowany do tekstu źródła i przekazany do `checks()`, a liczba FAIL-i z tego przebiegu jest policzona (nie tylko regex). Dodany M2 (usunięcie jednostki „złota na turę” z tooltipu Handlu). Dowód (surowe wyjście): `mutant wykryty przez checks() (FAIL-e: 1)` dla M1 i dla M2.
- **Zarzut 3 (test nie jest testem DOM): ODRZUCAM.** Dispatch, kryterium (a), wprost dopuszcza „test jednostkowy/DOM (wzorem resource-card-numbers-only-test.cjs)”, czyli test oparty na kodzie źródłowym i odtworzonej funkcji. Pokrycie DOM dla Nauki/Handlu/Żywności daje zrzut z punktu 1 (na wyizolowanych fragmentach). Pełny DOM panelu: NIE_ZMIERZONO (jak wyżej).
- **Zarzut 4 (zdublowane „+X → +X” dla brutto = netto): PRZYJMUJĘ.** Dodana funkcja `singleNumberSub(value, tooltip)` (wariant jednej liczby, bez strzałki, opis i jednostka w `title`). Nauka i Handel używają jej zamiast `grossNetNumbersSub(x, x, …)`. Żywność zostaje przy `grossNetNumbersSub`, bo brutto i netto mogą się różnić. Surowce bez zmian. Wiki §53.1a opisuje wariant jednej liczby.

## ZMIANY-COMMIT

Allowlista (tylko te pliki, `git add` po ścieżkach):
- `gra/src/ui/empireDetailPanel.ts` — nowa eksportowana funkcja `singleNumberSub` (ok. l. 1697); Nauka (`singleNumberSub(rate, …)`) i Handel (`singleNumberSub(t.totalIncome, …)`) przełączone z `grossNetNumbersSub(x, x, …)`. Żywność bez zmian. Brak zmian w `gra/src/game/**`.
- `gra/tools/gross-net-numbers-only-unify-test.cjs` — U2 rozpoznaje `singleNumberSub` dla Nauki i Handlu; U4 testuje obie funkcje (`grossNetNumbersSub` i `singleNumberSub`: brak „Brutto/netto/ turę/szt.”, „+1222” bez „→”, tooltip, klasa neg); M1 i M2 przeliczone przez `checks()`.
- `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` — akapit po §53.1a: Nauka i Handel jako jedna liczba (wariant bez strzałki), Żywność jako „+brutto → +netto”.
- `gra/src/data/wikiBundle.json` — WYŁĄCZNIE przez generator `cd gra && node tools/bundle-wiki-for-game.cjs` (wynik: 22 rozdz. + 184 haseł; `git diff --stat`: 1 linia).
- `dyspozycje/autobot/runs/R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1/30-obrona-claude.md` — ten raport.
- Commit obrony: SHA w polu `sha` StructuredOutput (po commicie).

`git status --short` przed commitem: 4 zmodyfikowane pliki w allowlistach (docs, wikiBundle, empireDetailPanel, test) + raport 30. `git diff --check`: bez wyjścia (czysto).

## TESTY (surowe wyniki, po `npm ci` w worktree)

- `cd gra && npx tsc --noEmit -p tsconfig.json` → EXIT=0 (po zmianach w empireDetailPanel.ts).
- `node tools/gross-net-numbers-only-unify-test.cjs` → `RESULT: 35 ok, 0 FAIL (calls=4)`, EXIT=0 (wcześniej 14 ok).
  - mutanty: `mutant wykryty przez checks() (FAIL-e: 1)` (M1), `mutant wykryty przez checks() (FAIL-e: 1)` (M2).
- Bramki referencyjne:
  - `logic-test` → `LOGIC OK (213/213)`
  - `tech-tree-test` → `tech-tree-test: 20 pass, 0 fail`
  - `research-test` → `ALL GREEN`
  - `unit-replace-test` → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`
  - `combat-test` → `All sanity checks passed.`
- Pokrewne: `resource-card-numbers-only-test` → `14 pass, 0 fail`; `resource-cards-gross-net-test` → `24 pass, 0 fail`; `hud-gross-net-rest-test` → `OK: (820 ok, 0 fail)`.
- `grep grossNetSub` w `gra/tools` i `gra/src`: tylko test (wzmianka w U1) i komentarz w `empireDetailPanel.ts` (dokumentacja usunięcia), brak wywołań.
- Render fragmentów w systemowym Chromium: zrzut opisany wyżej, tylko w scratchpadzie (nie w repo, bez `dyspozycje/**/dowody`).

## BLOKADY

Brak blokad kodowych. Otwarte: NIE_ZMIERZONO pełny panel imperium w żywej grze (vite build poza repo nie wykonany w tej rundzie).

## ZAŁOŻENIA

1. Wariant jednej liczby (bez „→”) dotyczy Nauki i Handlu, bo tam brutto = netto zawsze. Żywność zostaje z parą, bo jej brutto i netto mogą się różnić.
2. Jednostki (PN, 🍞, złota) są w `title` tooltipu; hero nad linią nadal podaje jednostkę („PN / turę”, „złota / turę”). Zgodne z dispatchem.

## RUNDY

2/5 (obrona po zarzutach Evaluatora r1). Werdykt wymagany od Evaluatora i FC.

## UWAGI-DLA-ORKIESTRATORA

- Dług poza zakresem, bez zmian: `resource-usage-breakdown-test` nie buduje się (esbuild: brak loadera .svg) — już w tasku #427.
- Dług poza zakresem: żywy zrzut pełnego panelu imperium (Nauka, Żywność, Handel) wymaga vite build poza repo; do wykonania przez Evaluatora lub osobny temat, jeśli orkiestrator uzna to za wymagane przed FC.

## NASTĘPNY KROK

Evaluator: zweryfikować commit obrony (allowlista, `gross-net-numbers-only-unify-test.cjs` 35/0, mutanty M1/M2), ocenić zrzut fragmentów i zdecydować, czy wymagany jest żywy zrzut pełnego panelu przed FC.

DEPLOY/PUSH: NIE WYKONANO
