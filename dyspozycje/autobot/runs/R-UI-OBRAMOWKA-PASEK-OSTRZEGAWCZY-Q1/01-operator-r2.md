# 01-operator-r2 — R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 (runda 2)

STATUS: PASS
TEMAT: R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 (runda 2, branch `autobot/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1-r2`)
GOAL: Zastąpić diagonalny pasek `.sp-blk-stripe` w `gra/src/ui/sidePanelHud.ts` (CSS + markup
nad rozwiniętą kartą blokującą) wzorcem wizualnym `chip-warning.svg` / `.civ-emp-alert` z paczki
designu panelu imperium — NIE usuwać paska całkowicie bez zamiennika (twardy wymóg ECHO
właściciela z rundy 2, w odróżnieniu od rundy 1 tej samej sesji, która usunęła pasek całkowicie).

## Recon (krok 0 i 1-2 zadania)

- **KROK 0:** worktree startował na `worktree-wf_cdc65dc1-8cf-2`, HEAD `6ce11f7f` — przodek
  `38aa9510` (`git merge-base --is-ancestor HEAD 38aa9510` = true, odwrotnie było `false`).
  Wykonano `git merge --ff-only 38aa9510` — fast-forward, zero konfliktów. Nowy HEAD:
  `38aa9510` (tożsamy z wymaganym).
- **Paczka designu** `docs/ux/claude-design/_dist/11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13/`:
  plik `.dc.html` zawiera `chip-warning.svg` w dwóch miejscach — jako ikona w callout-cie
  (16×16, `<img src="../eksport/icons/chip-warning.svg">`) i przy nazwie miasta niedokarmionego
  (11×11). Klasa `.civ-emp-alert` w TYM konkretnym `.dc.html` NIE występuje dosłownie jako
  nazwa CSS (to plik makiety/`.dc.html`, nie gotowy kod) — ale ECHO właściciela nazwało ją
  wprost jako nazwę roboczą, więc sprawdzono globalnie repo.
- **`.civ-emp-alert` jako realna klasa CSS — ZNALEZIONA, w DWÓCH miejscach:**
  1. `gra-robocza/Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html` (prototyp/build) — pełna
     definicja: `.civ-emp-alert{margin-top:12px;padding:10px 12px;border-radius:8px;
     border:1px solid #4a2a2a;background:rgba(224,122,122,.07);font-size:12px;
     color:#e6c4c4;line-height:1.45;}` + wariant `.warn` (żółty, `#4a3a1a`/`rgba(217,164,65,.07)`)
     + `.civ-emp-sp-alert{display:flex;gap:9px;align-items:flex-start;...}` (layout
     ikona+tekst) + `.civ-emp-sp-alert-ic{width:16px;height:16px;...}` (kontener ikony).
     Użycie: `<div class="civ-emp-alert civ-emp-sp-alert"><span class="civ-emp-sp-alert-ic"
     aria-hidden="true">${Yo("chip-warning",16)}</span><span><b>Realny niepokryty deficyt
     żywności</b> — ...</span></div>`.
  2. **`gra/src/ui/empireDetailPanel.ts` — TEN SAM wzorzec już w produkcyjnym kodzie gry**
     (linie 450–462, 538–542 CSS; linia 2444-2445 markup): identyczna paleta i layout,
     `brandIconSvg('chip-warning', 16)` jako ikona. To jest gotowy, już zaimplementowany
     wzorzec do skopiowania 1:1 — DOKŁADNIE ta sytuacja przewidziana w zadaniu ("jeśli tak,
     to prawdopodobnie już zaimplementowany wzorzec do skopiowania 1:1").
- **`chip-warning.svg`** — istnieje jako plik (`gra/src/ui/icons/brand/chip-warning.svg`,
  wektor ostrzegawczy pomarańczowy `#d08030`) i jest szeroko używany przez helper
  `brandIconSvg('chip-warning', N)` w wielu panelach (`cityPanel.ts`, `orderPanel.ts`,
  `siegeMapPanel.ts`, `diplomacyAudience.ts`, `empireDetailPanel.ts`, także już w
  `sidePanelHud.ts` linia 101 dla ikony `enemy`). `brandIconSvg` był już zaimportowany
  w `sidePanelHud.ts` (linia 7) — zero nowych importów potrzebnych.

**Wniosek recon:** wzorzec `.civ-emp-alert`/`.civ-emp-sp-alert` + `chip-warning` istnieje
NAPRAWDĘ, jest już użyty w produkcyjnym `gra/src/ui/empireDetailPanel.ts` (nie tylko w
prototypie), więc zadanie NIE wymagało wymyślania nowego stylu — tylko przeniesienia
identycznej konwencji (paleta kolorów, ikona) do kontekstu `sidePanelHud.ts`, zeskalowane
pod istniejący prefiks klas tego pliku (`sp-*`, zamiast `civ-emp-*`, żeby nie kolidować z
przestrzenią nazw innego panelu — sama konwencja wizualna 1:1, nazwy klas zeskalowane pod
lokalny plik zgodnie z istniejącym stylem `sidePanelHud.ts`).

## Implementacja

`gra/src/ui/sidePanelHud.ts`:
- CSS: `.sp-blk-stripe` (pasek 5px, diagonalny gradient złoto/ciemne złoto) zastąpiony przez
  `.sp-blk-alert` (pasek flex: ikona + etykieta, `border-bottom:1px solid #4a2a2a`,
  `background:rgba(224,122,122,.07)`) + `.sp-blk-alert-ic` (kontener ikony 16×16,
  wzorowany 1:1 na `.civ-emp-sp-alert-ic`) + `.sp-blk-alert-txt` (etykieta, kolor
  `#e6c4c4` — dokładnie kolor tekstu `.civ-emp-alert`). Kolory/border/tło skopiowane
  1:1 z `.civ-emp-alert` (BEZ wariantu `.warn` — blokująca karta wymagająca decyzji
  odpowiada semantyce "aktywny problem", nie "nadchodzące ostrzeżenie", więc paleta
  czerwona bazowa, nie żółta `.warn`).
- Markup: `<div class="sp-blk-stripe"></div>` zastąpiony przez
  `<div class="sp-blk-alert"><span class="sp-blk-alert-ic" aria-hidden="true">` +
  `brandIconSvg('chip-warning', 16)` + `</span><span class="sp-blk-alert-txt">Wymaga
  natychmiastowej decyzji</span></div>` — ikona `chip-warning` inline SVG (identyczny
  helper jak w `empireDetailPanel.ts`), NIE nowy import, NIE nowy asset.
- Zero zmian w logice kolejki/dismiss/licznika/blockingSeen — wyłącznie CSS + jeden
  fragment markupu w gałęzi renderowania pierwszej (rozwiniętej) karty blokującej.
- `gra/src/ui/icons/brand/tokens.css` — BEZ zmian (nie było potrzeby nowego tokenu;
  paleta skopiowana jako literały zgodnie z konwencją źródłowego `.civ-emp-alert`, który
  też używa literałów, nie tokenów CSS).

## Testy — sprawdzenie odwołań do `sp-blk-stripe`

`grep -n "sp-blk-stripe" gra/tools/sidepanel-events-toolbar-test.cjs
gra/tools/sidepanel-hud-deadzone-test.cjs` — ZERO trafień w obu plikach. Żadna asercja nie
odwoływała się do tej klasy po nazwie — nie było nic do aktualizacji w testach.

TESTY:
- `npm install` w `gra/` — wykonane (node_modules brakowało), 69 paczek, bez błędów instalacji.
- `npm run typecheck` — PASS, czysto (`tsc --noEmit`, zero błędów).
- `node gra/tools/sidepanel-events-toolbar-test.cjs` — PASS, **19 pass, 0 fail**.
- `node gra/tools/sidepanel-hud-deadzone-test.cjs` — PASS, **43 pass, 0 fail** (uruchomiony
  w tle, dłuższy — pełny log zebrany, zero błędów konsoli, wszystkie sekcje A–M OK).

## Kryteria końca (z dispatchu)

1. `chip-warning.svg` widoczny na rozwiniętej karcie blokującej zamiast diagonalnego paska —
   SPEŁNIONE (ikona renderowana przez `brandIconSvg('chip-warning', 16)` w `.sp-blk-alert-ic`).
2. Pasek/element NIE jest całkowicie usunięty — jest zamiennik — SPEŁNIONE (`.sp-blk-alert`
   zajmuje dokładnie to samo miejsce w markupie, przed `.sp-blk-body`).
3. `tsc` czysty, testy z allowlisty PASS — SPEŁNIONE.
4. Zero zmian w logice kolejki/dismiss/licznika — SPEŁNIONE (diff ograniczony do CSS i
   jednego fragmentu markupu wewnątrz istniejącej gałęzi `blockingSeen === 1`).

ZMIANY/COMMIT: `gra/src/ui/sidePanelHud.ts` (CSS `.sp-blk-stripe` → `.sp-blk-alert` +
`.sp-blk-alert-ic` + `.sp-blk-alert-txt`; markup: pasek → ikona+etykieta ostrzegawcza) +
ten raport. Commit lokalny (bez push) — SHA podany niżej po `git commit`.

BLOKADY: brak.

NASTĘPNY KROK: Evaluator (Sonnet 5, effort High) → Final Control (Sonnet 5, effort High,
osobny subagent) → integracja orkiestratora.

DEPLOY/PUSH: NIE WYKONANO.
