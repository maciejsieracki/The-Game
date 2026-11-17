# R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI + dokumentacja gracza; bez logiki gry)
TEMAT: R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1
GOAL: Nauka, Żywność i Handel w panelu imperium pokazują tylko same liczby „+X → +Y” (jak Surowce); opis i jednostka w `title` (tooltip); stara `grossNetSub` usunięta; wiki §53.1a zaktualizowane i wikiBundle przez generator.
BAZA: origin/main = bd647523b (merge-base OK, HEAD = bd647523b przed zmianami).

## ZMIANY-COMMIT

Pliki (allowlista):
- `gra/src/ui/empireDetailPanel.ts` — usunięta `grossNetSub` (definicja + komentarz); Nauka (`grossNetNumbersSub(rate, rate, 'Nauka nie ma dziś kosztów — brutto = netto. Jednostka: PN na turę.')`), Żywność (`grossNetNumbersSub(zywnoscWplywMiast ?? zywnoscRate, zywnoscRate, 'Brutto = … Jednostka: 🍞 żywność na turę.')`), Handel (`grossNetNumbersSub(totalIncome, totalIncome, 'Trasy nie mają kosztów … Jednostka: złota na turę.')`). Dotychczasowy opis i jednostka przeniesione do tooltipu. Brak zmian w `gra/src/game/**`.
- `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` — §53.1a przepisane do formatu „+brutto → +netto” (bez „Brutto/netto”, bez „/ turę”), dopisek o Nauce, Spichlerzu centralnym i Handlu, zwinięte „Zobacz szczegóły zużycia” i „Skąd zapasy”.
- `gra/src/data/wikiBundle.json` — WYŁĄCZNIE przez generator `cd gra && node tools/bundle-wiki-for-game.cjs` (wynik: 22 rozdz. + 184 haseł). `git diff --stat` tego pliku: 1 linia zmieniona, bez dużego diffu.
- `gra/tools/gross-net-numbers-only-unify-test.cjs` — NOWY test (patrz TESTY).
- `dyspozycje/autobot/runs/R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1/10-operator-claude.md` — ten raport.

Nie zmieniono: `gra/src/game/**`, `resourceSourceLedgerHtml.ts`, `gra/data`, `WERSJE.md`, manifest, `gra-robocza/`, `rust-port/`, `battleScene.ts`. Istniejące testy tekstowe nie wymagały zmian (grep `Brutto`/`/ turę` w `gra/tools` trafia tylko w `resource-card-numbers-only-test.cjs`, który dotyczy karty surowca i nagłówka Surowce — oba zielone bez zmian).

SHA: patrz pole `sha` w StructuredOutput (commit z kodem i raportem).

## TESTY (surowe wyniki)

- `cd gra && npx tsc --noEmit -p tsconfig.json` → EXIT=0 (po `npm ci`: "added 71 packages").
- Nowy `node tools/gross-net-numbers-only-unify-test.cjs` → `RESULT: 14 ok, 0 FAIL (calls=4)`, EXIT=0. Obejmuje: U1 brak `grossNetSub`; U2 Nauka/Żywność/Handel wołają `grossNetNumbersSub` (+ Surowce, łącznie 4 wywołania); U3 tooltipy niosą PN / 🍞 / złota i opis; U4 odtworzona z kodu funkcja daje widoczny tekst `+1222 → +1075` bez słów „Brutto”, „netto”, „/ turę”, „szt.”, opis w `title`, netto ujemne = klasa `neg`; M1 mutant (przywrócenie `grossNetSub`) wykrywany przez U1.
  - Uwaga: M1 sprawdza mutanta predykatem regex, a nie uruchomieniem całego zestawu U1–U4 na kopii pliku. Zapisane jako NIE_ZMIERZONO w pełnym zakresie mutacji.
- Bramki referencyjne (po `npm ci`):
  - `logic-test` → `LOGIC OK (213/213)`, EXIT=0
  - `tech-tree-test` → `20 pass, 0 fail`, EXIT=0
  - `research-test` → `ALL GREEN`, EXIT=0
  - `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT=0
  - `combat-test` → `All sanity checks passed.`, EXIT=0
- Pokrewne testy zielone bez zmian: `resource-card-numbers-only-test` (14 pass, 0 fail), `resource-cards-gross-net-test` (24 pass, 0 fail), `hud-gross-net-rest-test` (820 ok, 0 fail).
- `git diff --check` → bez wyjścia (czysto).
- NIE_ZMIERZONO: (c) zrzut z żywego Chromium panelu imperium (Nauka/Żywność/Handel) — nie wykonano build vite poza repo ani przeglądarki w tej rundzie; nie ma więc obejrzanego zrzutu. Test U4 odtwarza funkcję z kodu, nie cały panel w DOM.
- NIE_ZMIERZONO: test wiki/poradnika — w `gra/tools` nie znaleziono testu specyficznego dla §53.1a (`git grep "53.1a"` w tools puste); wykonano tylko generator i sprawdzenie `git diff --stat`.

## ZAŁOŻENIA (luki w dispatchu)

1. Jednostka (PN, 🍞, złota) NIE jest już przy liczbie w linii nagłówka, tylko w tooltipie — zgodnie z dispatchem („NIE gub informacji o jednostce … w tooltipie”). Hero nad linią nadal pokazuje „PN / turę” (Nauka) i „złota / turę” (Handel), więc jednostka jest widoczna także poza tooltipem.
2. Wariant jednej liczby (brutto = netto → bez strzałki) NIE wdrożony; zachowano konwencję „+X → +Y”, bo dispatch podaje ją jako wzorzec.
3. Test `hud-gross-net-rest-test` (HUD) nie był zmieniany ani wymagany — dotyczy innych powierzchni (baner, karta miasta).

## BLOKADY

Brak blokad kodowych. Jedyne otwarte: zrzut na żywo (c) — NIE_ZMIERZONO (powyżej).

## RUNDY

1/5 (werdykt: PASS-WITH-NOTES; wymaga Evaluatora i FC przed integracją).

## UWAGI-DLA-ORKIESTRATORA

- Znalezisko poza zakresem (nie naprawiane): `resource-usage-breakdown-test` nie buduje się (esbuild: brak loadera .svg) — już zgłoszone w tasku #427, bez zmian w tym temacie.
- `grossNetSub` usunięta, bo po zmianie nie miała użyć (dispatch: „usuń jeśli brak użyć”).

## NASTĘPNY KROK

Evaluator (Sonnet): sprawdzić allowlistę i diff, uruchomić `gross-net-numbers-only-unify-test.cjs`, ocenić zrzut na żywo (c) lub zlecić go osobno przed FC.

DEPLOY/PUSH: NIE WYKONANO
