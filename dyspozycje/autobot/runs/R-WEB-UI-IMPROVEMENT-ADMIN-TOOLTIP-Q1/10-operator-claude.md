STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1
GOAL: w treści panelu „AUTOMATYZACJA ULEPSZEŃ TERENU" zostaje krótki komunikat („Wymaga administratora ulepszeń"), pełne wyjaśnienie, koszt i utrzymanie są w tooltipie (atrybut title) tego samego elementu. Bez zmiany mechaniki, progów, kosztów i stanów.
BAZA: origin/main 81e357dee (checkout --detach w izolowanym worktree)

ZMIANY/COMMIT:
- gra/src/ui/buildModeHud.ts:
  - podpowiedź administratora (nie zatrudniony): w treści „Wymaga administratora ulepszeń"; title = pełne wyjaśnienie + koszt + utrzymanie (zwykły tekst, bez chipów);
  - administrator zatrudniony, nie pracuje: w treści „Administrator nie pracuje — brak środków"; title = pełny tekst o wstrzymaniu;
  - notatka blokady państwa: w treści „Wymaga administratora ulepszeń", pełne zdanie w title;
  - notatka blokady miasta: j.w.; „Efekt w mieście: wstrzymane" z przyczyną w title;
  - usunięty nieużywany import resourceAmountChipHtml.
- gra/tools/improvement-admin-tooltip-real-render-test.cjs (nowy): test w prawdziwym Chromium (bundle esbuild buildModeHud.ts), kryteria (a)-(e) i mutacja.
- Stałe tekstu w gra/src/game/auto-build-gate.ts NIE zmieniane (AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT zostaje jako tekst title).
- Mechanizm data-lock-hint / showLockTip NIE użyty: notatki nie są elementami `.civ-build-item`; title (dopuszczony kryterium (b)) wybrany jako najprostszy wariant bez zmiany pozycjonowania.
- Commit: SHA w polu odpowiedzi (commit zawiera kod, test i ten raport).

TESTY:
- Zależności: `npm ci --ignore-scripts` w gra/ (tylko instalacja, bez build/dev).
- `tsc --noEmit` (gra/): exit 0, bez wyjścia.
- tools/improvement-admin-tooltip-real-render-test.cjs: 12 pass, 0 fail, exit 0 (surowe wyjście). S1 (a) wszystkie komunikaty ≤60 znaków; (b) pełny tekst w title (podpowiedź, notatki państwa i miasta); (c) zablokowane przyciski automatyzacji mają title z „Wymaga administratora ulepszeń"; S2 (a)/(b) „nie pracuje" i „Efekt w mieście: wstrzymane"; (d) mutacja (długi tekst wraca do treści) wykryta przez kryterium (a); (e) 0 błędów konsoli/pageerror.
- Bramki referencyjne (tylko exit code; liczba asercji NIE_ZMIERZONO, wyjście przekierowano do /dev/null):
  - tools/logic-test.cjs: exit 0
  - tools/tech-tree-test.cjs: exit 0
  - tools/research-test.cjs: exit 0
  - tools/unit-replace-test.cjs: exit 0
  - tools/combat-test.cjs: exit 0
- Powiązany tools/improvement-administrator-test.cjs: exit 0 (sprawdza obecność AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT w buildModeHud; nadal obecna, w title).
- NIE_ZMIERZONO: zrzut z żywej gry (kryterium f, Chromium 1440x900 przed/po z najechaniem). Nie uruchamiano serwera gry ani builda (zakaz npm run build/dev); test DOM w Chromium zastępuje to tylko częściowo.
- Uwaga: tools/live-verify-improvement-administrator.cjs czyta textContent `[data-imp-admin-hint]`; po zmianie zwraca krótki tekst (skrypt live, nie bramka; do dostosowania przy następnej weryfikacji na żywo).

BLOKADY: brak. WERSJE.md, JSON i rust-port nie dotknięte.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator (diff, test, mutacja), potem Final Control; zrzut z żywej gry (f) do wykonania przez orkiestratora, jeśli wymagany.

ZAŁOŻENIA:
- Krótkie komunikaty w treści: „Wymaga administratora ulepszeń" (istniejąca stała AUTO_IMPROVE_LOCKED_NOTE), „Administrator nie pracuje — brak środków", „Efekt w mieście: wstrzymane".
- Koszt/utrzymanie w tooltipie jako zwykły tekst, bo atrybut title nie renderuje HTML.
- Przyciski disabled: zachowany istniejący title; wyjaśnienia są w title widocznego elementu tuż pod przyciskami.

DEPLOY/PUSH: NIE WYKONANO
