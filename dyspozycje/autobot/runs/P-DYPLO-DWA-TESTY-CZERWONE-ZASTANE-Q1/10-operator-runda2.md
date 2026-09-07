# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — Operator, runda 2/5

MODEL+EFFORT: Opus 5, effort high · 2026-09-06 · worktree `/home/user/wt-dyplo-testy`,
gałąź `autobot/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1`. Guard §2b: baza `4dfced2d`
potwierdzona jako przodek, drzewo czyste przed pracą.

**Uwaga proceduralna:** ta runda uległa przerwaniu sesją (limit) w trakcie pracy Operatora —
kod był już kompletny i przechodził testy, ale agent nie zdążył zapisać raportu ani
zacommitować. Orkiestrator zweryfikował wytwór niezależnie (trzy mutacje z kryteriów końca)
i spisuje ten raport w jego imieniu, bez zmiany ani linii kodu.

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1
GOAL: obie bramki zielone i mierzące zachowanie, nie zapis.

## U1 — `[A4]` liczy WYWOŁANIA na masce nie-kodu, nie znaki regexu

Dodana funkcja `maskNonCode()` (`:92-131`) zamienia treść komentarzy, stringów i literałów
szablonowych na spacje zachowując długość i numerację wierszy, więc offsety trafień na masce
są offsetami w oryginale. Licznik `[A4]`/`[A4c]` liczy teraz na `codeSrc = maskNonCode(mainSrc)`,
nie na dosłownym regexie `/hideDiplomacyAudience\(\);/g` wymagającym średnika.

Dołożona `[A4d]`: maska nie może "zjeść" żadnego realnego wywołania (odróżnia komentarz
od kodu po tym, czy wystąpienie zniknęło z maski w całości).

## U2 — `[A4c]` kotwiczy na ZAKRESIE własności `closeAudience`, nie na wierszu fizycznym

Wcześniej wymagane było, żeby `closeAudience:` i wywołanie stały w tym samym wierszu.
Teraz sprawdzana jest przynależność do zakresu (nawiasy/blok) property, niezależnie od
formatowania.

## TESTY (zweryfikowane przeze mnie, orkiestratora, niezależnie)

- `node tools/diplomacy-audience-close-flush-test.cjs` — **46 pass, 0 fail** (baza allowlisty
  wymagała ≥ liczby z rundy 1; nie spadła).
- **Mutacja F4** (nowa funkcja `closeAudienceNow: () => hideDiplomacyAudience(),` omijająca
  wrapper, wzorem znaleziska Final Control rundy 1) → **44 pass, 2 fail**
  (`[A4]` got 4 zamiast 3, `[A4f]` nierozpoznane miejsce). Cofnięta, `git diff --quiet` czysto.
- **Mutacja F2** (czysto kosmetyczne rozbicie `closeAudience` na cztery linie, identyczna
  semantyka) → **46 pass, 0 fail** — bramka NIE reaguje na formatowanie. Cofnięta.
- **Mutacja realna** (`closeAudience: (): void => {},` — usunięcie wywołania z haka)
  → **44 pass, 2 fail** (`[A4]` got 2, `[A4c]` got 0). Cofnięta, `git diff --quiet` czysto.
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.
- Pięć bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat OK.

## ZAKRES

Wyłącznie `gra/tools/diplomacy-audience-close-flush-test.cjs`. `gra/src/main.ts` NIETKNIĘTY
(zweryfikowane: `git diff --stat -- gra/src/main.ts` w tej rundzie puste).
`dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` NIETKNIĘTY, zgodnie z ratyfikacją.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator, runda 2.
DEPLOY/PUSH: NIE WYKONANO
