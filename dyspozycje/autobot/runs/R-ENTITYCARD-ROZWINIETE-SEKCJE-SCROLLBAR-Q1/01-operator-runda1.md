STATUS: PASS
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
GOAL: (A) Karta technologii — sekcje "Ulepszenia terenu" i "Zmiany ekonomiczne" domyślnie
ROZWINIĘTE. (B) `.entity-card-dialog` ma TRWALE WIDOCZNY pasek przewijania.

ZMIANY/COMMIT:
- `gra/src/ui/entityCards/technologyAdapter.ts` — `openDefault: false` → `openDefault: true`
  w OBU miejscach (`improvementsSection` linia ~221, `econSection` linia ~301). Mechanizm
  `collapsible: true` NIE ruszony — akordeon zostaje.
- `gra/src/ui/entityCards/renderer.ts` — do reguły `.entity-card-dialog` dodano
  `scrollbar-gutter:stable; scrollbar-width:thin; scrollbar-color:rgba(232,216,138,.55)
  rgba(20,26,34,.9)` (Firefox) oraz nowe reguły `::-webkit-scrollbar`/`-track`/`-thumb`/
  `-thumb:hover` (Chromium/WebKit, 12px, kolorystyka spójna ze złotym akcentem karty).
  Nic poza tym blokiem CSS nie zmienione.
- Nowa bramka: `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` (żywy
  Chromium/Playwright, esbuild bundling renderer.ts+technologyAdapter.ts, wzorzec z
  `entity-card-single-dialog-real-render-test.cjs`).
- Commit na gałęzi `autobot/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1`, baza `e29a772f`
  (SHA poniżej po commicie).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów.
- 5 bramek referencyjnych (R-PROC-AUTOBOT.md §6), stan po zmianie:
  logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone, bez regresji.
- Nowa bramka `entitycard-rozwiniete-scrollbar-real-render-test.cjs`: 21 PASS, 0 FAIL.
  MUSI biec pod `xvfb-run -a node tools/...cjs` — Playwright w `headless:true` dokleja
  bezwarunkowo `--hide-scrollbars` (playwright-core), co ukrywa KAŻDY pasek przewijania
  niezależnie od CSS; z `headless:false` pod Xvfb pasek renderuje się naprawdę.
  Kryteria: (K1a/K1b) obie sekcje `data-open="1"`, body bez `hidden`, ZARAZ po otwarciu
  karty "Gospodarka wodna" (dokładnie ta ze zrzutu właściciela), bez klikania; (precond)
  w oknie 900×560 `scrollHeight > clientHeight` (treść faktycznie przekracza okno);
  (K3) `.entity-card-dialog` rezerwuje ≥8px na pasek (`offsetWidth - clientWidth`), bez
  interakcji scrolla; (K2) ręczne zwinięcie/rozwinięcie klikiem w nagłówek nadal działa w
  obie strony — akordeon nie został usunięty; (PRE, sekcja "PRZED") mutacja w pamięci
  cofająca `openDefault`+CSS do stanu sprzed tematu daje PRZECIWNY wynik (sekcje zwinięte,
  inna szerokość `::-webkit-scrollbar`) — dowód nietautologiczności (K4).
- ŻYWE ZRZUTY (obowiązkowe wg REGUŁY PRZECIW SAMOOSZUKIWANIU), zapisane w
  `/tmp/ec-shots/` w trakcie przebiegu (poza allowlistą repo, dowód dołączony do raportu
  operatora zamiast wersjonowany):
  - `po-01-karta-otwarta.png` — karta "Gospodarka wodna" tuż po otwarciu w oknie 900×560:
    złoty pasek przewijania widoczny PO PRAWEJ od razu, bez scrolla/hovera.
  - `po-01b-scroll-do-improvements-econ.png` — po przewinięciu widać treść sekcji
    "Ulepszenia terenu" (Irygacja) i "Zmiany ekonomiczne" (Studnia, Studnia — utrzymanie)
    już ROZWINIĘTĄ, chevron ▾ w obu nagłówkach — zero kliknięcia wymagane.
  - `przed-01-karta-otwarta-zwiniete.png` — kontrola negatywna: kod sprzed tematu, ten sam
    viewport — domyślny/węższy pasek (bez naszego CSS) i sekcje NIE są jeszcze widoczne
    rozwinięte na pierwszy rzut oka bez scrolla (accordion domyślnie zwinięty w danych
    testu).

BLOKADY: brak.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Ścieżka A) → Final Control → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
