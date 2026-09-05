# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Operator, runda 2/5

> SKRÓCONY po zarzucie 3 rundy 2 (§11: 776 słów → limit ok. 400). Treść merytoryczna bez
> zmian; pełna wersja pierwotna żyje w Gicie pod `f24af77b`. Obrona: `06-obrona-runda2.md`.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: stos kart encji z sufitem 2 (trzecia zamyka NAJSTARSZĄ), karta B przesunięta tak,
że spod niej wystaje klikalny brzeg A, zamknięcie B odsłania A; rozliczenie 29 asercji.
MODEL+EFFORT: Opus 5, effort high (C-052).
ZMIANY/COMMIT: baza `d7819ab7`. Allowlista: `gra/src/ui/entityCards/renderer.ts`,
`gra/tools/entitycard-sufit-dwoch-kart-test.cjs` (NOWY),
`gra/tools/entity-card-single-dialog-real-render-test.cjs`, ten katalog runu. Poza
allowlistą zero zmian; `git diff --check` czysty.
TESTY (sekwencyjne): `tsc --noEmit` 0 błędów · `entitycard-sufit-dwoch-kart` **65/65**
(baza 26/39 fail) · `civpedia-caly-wiersz-przyciskiem` **85/85** (baza 66/85) ·
`entity-card-single-dialog-real-render` **25/25** (baza 21/26) · `nested-overlay` 16/24
(baza 14/24) · `civpedia-karty-nazwa` 27/27 · `improvement-card-callsites` 36/36 ·
`unit-info-card-viewport-height` 35/35 · `tech-discovery-card-real-click` 12/12 ·
referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
BLOKADY: brak dla tematu; jedno zgłoszenie osobne (niżej).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO

## Osiem kryteriów końca rundy 2

1. **Brzeg A zmierzony.** 1280×900: A `l=310 t=90 w=660 h=720`, B `l=382 t=146` → pasek
   72 px z lewej, 56 px z góry.
2. **A→B→C:** dokładnie 2 karty, zamknięta A, żyją B i C; `data-ec-stack-depth` przeliczone.
3. **Jeden gest = jedna karta:** Esc, klik w tło i klik w brzeg A — każdy zdejmuje jedną.
4. **Mieszczenie się:** 1920×1080 / 1600×900 / 1440×900 / 1280×900 dx72 dy56 · 1366×768
   i 1024×768 dx72 dy53 · 800×600 dx34 dy36 · 700×520 dx0 dy28. Degradacja ciągła, próg
   732 px; rozmiar 660×min(80vh,100vh−32) nietknięty.
5. **Nietautologiczność:** bramka na bazie daje 26/39 (na pracy 65/0); niesie też mutację
   w pamięci `ENTITY_CARD_STACK_LIMIT` 2→1.
6. **29 asercji rozliczonych pomiarem:** (a) zzieleniały same — **21** (civpedia 19: 15 o
   kształcie `depthAfter===2`, 4 z `:376-379` w ogóle nie asertujące głębokości;
   nested-overlay bloki [4] i [5]); (b) czerwone z przyczyny **niezależnej od tematu** — **8**,
   wszystkie w nested-overlay (brak `scrollIntoView` przed klikiem; sonda dwóch linii → 24/24,
   cofnięta) — zgłoszenie osobne, **nie naprawiane tutaj**; (c) utrwalające stos
   nieograniczony — **0**, treści oczekiwań w obu plikach nietknięte.
7. **Zrzuty z żywego Chromium:** `04-operator-runda2-zrzut-dwie-karty-widoczny-brzeg-A.png`,
   `…-zrzut-sufit-trzecia-karta.png`.
8. Bramki kart i pięć referencyjnych — zielone.

## `entity-card-single-dialog-real-render-test.cjs` — 10 asercji, każda z uzasadnieniem

Bramka egzekwowała tezę odwrotną i była czerwona już na bazie. Dwie asercje `(0)` wiążące
test z `git show HEAD:` — usunięta / zastąpiona stałą `ENTITY_CARD_STACK_LIMIT`.
`(PRE-P2/P3/P4)` 2/3/4 backdropy → 1. `(K1)` „1 backdrop, A nie istnieje" → „2 backdropy,
A pod B" — jedyna asercja będąca zapisem sporu rozstrzygniętego przez ECHO. `(K2a/K2b)` →
„2 backdropy, najstarsza wypada"; `(K2c)` opisana jawnie. `(K3)`, `(K4)` nietknięte.

## Rekonesans i zgłoszenie osobne

Callsite'ów `openEntityCard(` jest **8**, nie 12: `techDiscoveryNotice.ts:716`,
`cityPanel.ts:7207, 9236`, `buildModeHud.ts:755, 763, 802, 810`, `renderer.ts:458`;
`grep '= openEntityCard'` → 0. Sufit domyka się w jednym pliku.

Kategoria (b), **nie naprawiana tutaj:** `entity-card-cross-links-nested-overlay-test.cjs:147,
214` klika ślepo w piksel bez `scrollIntoView` (przycisk ląduje na `y≈869-890`); wzorzec
poprawny w `civpedia-caly-wiersz-przyciskiem-test.cjs:209-210`.
