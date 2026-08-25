# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T7`
GOAL: Audyt czterech jednostek Rzymu/Grecji — Evocati, Triari, Hieros Lochos
(Święty Zastęp), Hastati — z realnym pomiarem geometrii i widoczności z kamery
gry, naprawą znalezionych defektów, sekcjami ZGODNOŚĆ HISTORYCZNA i testem
real-render z dowodem nietautologiczności.
MODEL WYKONAWCY: **Opus 5 (`claude-opus-5[1m]`)** — odczytane ze środowiska
sesji, nie z założenia. Dispatch wymaga Opus 5 High (`R-PROC-AUTOBOT.md` §5a,
wyjątek graficzny/wizualny).

ZMIANY/COMMIT:
- `gra/src/render/jednostki-p6-super.ts` — buildSuperGreece + buildSuperRome
- `gra/src/render/jednostki-z2-srodziemne.ts` — WYŁĄCZNIE buildTriari + `z2Banner`
  (parametr nazwy z domyślną wartością pustą, wzorzec T6)
- `gra/src/render/hastati-opus5.ts` — buildHastatiOpus5
- `gra/tools/zelazo-super-rzym-grecja-real-render-test.cjs` — NOWY test
- `gra/tools/zelazo-srodziemnomorze-real-render-test.cjs` — dwie asercje (R1, K0)
  przepisane, bo T7 legalnie zmienił stan, który pilnowały
- `gra/src/render/units.ts` — **BEZ ZMIAN** (audyt nie wykazał potrzeby)
- `gra/data/**` — **BEZ ZMIAN**

TESTY:
- `zelazo-super-rzym-grecja-real-render-test.cjs` — **92 pass / 0 fail**
  (16 asercji H + macierz ablacyjna 16 mutacji, każda czerwieni SWOJĄ asercję)
- `zelazo-srodziemnomorze-real-render-test.cjs` (T6) — 81/0
- `zelazo-falanga` 38/0, `zelazo-mezopotamia` 70/0, `zelazo-celtowie…` 40/0,
  `zelazo-jezdziec-oszczepami` 55/0, `zelazo-konnica-asyryjska` 29/0,
  `zelazo-gate-test` 24/24
- Bramki §6: `tsc --noEmit` 0 błędów, logic 213/213, tech-tree 19/19,
  research ALL GREEN, unit-replace 13/13, combat OK,
  unit-power 4 pass/2 fail (**czerwony pre-istniejąco**, nie regresja)
- `vite build` przez binarkę z `node_modules` do `/tmp` (C-001) — czysty

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).
