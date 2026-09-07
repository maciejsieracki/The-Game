# R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — Operator, runda 2

## Zakres tej rundy

Naprawiono dokładnie 4 pliki z allowlisty `00b-dispatch-runda2-allowlist.md`:

1. **`gra/tools/forced-war-iron-main-guard-test.cjs`** — regex asercji „gracz dołącza do
   puli" zaktualizowany z dwuwarunkowego (`playerCity && totalActiveForcedWarsByOwner(0)
   === 0`) na trzywarunkowy blok Kroku C (`playerCity && turn >=
   WOJNA_KAMIEN_WYMUSZONA_START_TURY && totalActiveForcedWarsByOwner(0) === 0`), 1:1 z
   aktualnym kodem main.ts. Czysty re-anchor, treść i liczba pozostałych 36 asercji
   nietknięta. Wynik: **37/37 PASS**.
2. **`gra/tools/forced-war-iron-mutant-probe.cjs`** — literal `find`/`replace` mutanta
   `M42-main-gracz-zawsze-w-puli` zaktualizowany analogicznie (mutant teraz usuwa CAŁY
   trzywarunkowy blok, w tym próg tury). Wynik: **55/55 mutacji zaczerwienionych**, kontrakt
   czysty, bramka main/ai 37/37.
3. **`gra/tools/forced-war-iron-player-target-live-test.cjs`** i
4. **`gra/tools/forced-war-player-target-live-test.cjs`** (Brąz) — SEDNO zachowane
   (dowód na żywym silniku, że mechanizm wyboru celu/wypowiedzenia wojny działa DLA
   GRACZA), scenariusz przesunięty za próg: dodano krok A2 — fast-forward 23× realnym
   `__eraTestDebug.endTurn()` (bez nowego haka; sprawdzono `__eraTestDebug` — brak haka do
   ustawienia tury, więc pętla endTurn() zgodnie z wytyczną dispatchu) do tury 24, DOPIERO
   POTEM `force*ForcedWarOnPlayer()` + `endTurn()` (tura 25, próg spełniony).

## Dwa napotkane problemy sandboksu i ich naprawa (bez nowego haka produkcyjnego)

- **Modal preBattle blokujący fast-forward**: `?playtest=mapa` stawia gracza przy AI —
  przy 24 realnych turach barbarzyńcy/AI atakują jednostki gracza, otwierając modal
  preBattle i blokując kolejne `endTurn()`. Użyto WYŁĄCZNIE JUŻ ISTNIEJĄCYCH haków
  (`__rebelProtectionTestDebug.pullPlayerUnitsHome()` + `disableVictoryCheckForTest()`,
  main.ts, R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1) — dokładnie ten sam wzorzec co
  `perf-long-session-live-test.cjs`. Diagnoza (izolowane próby diagnostyczne, usunięte po
  weryfikacji) wykazała, że kliknięcie przycisku „Auto" przez `page.locator(...).click
  ({force:true})` Playwrighta zawodzi cicho (timeout hit-testu) w tym headless+swiftshader
  środowisku — zastąpione natywnym DOM `.click()` (`page.evaluate(() =>
  document.querySelector('.pb-overlay [data-act="auto"]')?.click())`), które działa
  niezawodnie. Potwierdzone powtarzalnie do tury 26 w izolowanej próbie.
- **Asercja toastu (E) fałszywie czerwona**: odkryto (weryfikacja na żywym silniku), że
  `main.ts` (`R-EOT-EVENT-DEFER-Q1`, `shouldDeferEotEvents`) ZAWSZE odkłada toast wywołany
  podczas `endTurnInProgress===true` — a DOW wymuszonej wojny inicjowany w fazie AI zawsze
  tak ma, NIEZALEŻNIE od progu tury (identyczne przy turze 1 i 25). Toast nigdy się nie
  pokazuje jako `display:block`; ląduje WYŁĄCZNIE jako trwała karta `kind:"enemy"` w
  `warEventLog`. To zachowanie silnika jest ORTOGONALNE do tego tematu (próg tury gracza)
  — zaktualizowano asercję E, by żądać dowodu z WŁAŚCIWEGO, aktualnego nośnika
  (`warEventLog` z kartą `kind:"enemy"` i tytułem o wypowiedzeniu wojny), zamiast
  przestarzałego `toast.display==="block"`. SEDNO („widoczne w UI") w pełni zachowane,
  udokumentowane w kodzie testu z uzasadnieniem.

Żaden z powyższych nie wymagał nowego haka w `main.ts` — allowlista `gra/src/main.ts`
(poza rundą 1) nietknięta w tej rundzie.

## Testy — WSZYSTKO ZIELONE

- `tsc --noEmit` — czysto.
- Rodzina `forced-war-*-test.cjs` (15 plików) + `wojna-wymuszona-parowanie-test.cjs` +
  `wojna-wymuszona-prog-tury-gracz-test.cjs` = **17/17 zielone** (w tym oba naprawione
  pliki #1/#2 i oba live #3/#4 uruchomione realnie, nie tylko odczytane).
- `boot-error-catcher-console-error-test.cjs` — 8/8 PASS.
- 5 bramek referencyjnych (`logic-test`, `tech-tree-test`, `research-test`,
  `unit-replace-test`, `combat-test`) — zielone.
- `forced-war-iron-player-target-live-test.cjs` — **12/12 PASS** (real Playwright, build
  vite, fast-forward do tury 24, DOW na turze 25, zero console.error).
- `forced-war-player-target-live-test.cjs` (Brąz) — **12/12 PASS**, analogicznie.

## Zmiany/commit

Niescommitowane (jak w rundzie 1). `git status --short`: dokładnie 4 pliki z tej rundy +
2 pliki z rundy 1 (`gra/index.html`, `gra/src/main.ts`) + 2 nowe pliki rundy 1 +
katalog runu. Zero zmian w `gra/src/game/forced-war-*.ts` (potwierdzone `git diff --stat`).
Zero `git add`. Wszystkie tymczasowe pliki diagnostyczne (`gra/tools/zzz-debug-*.cjs`,
`gra/dist-debug-*`) usunięte po użyciu — potwierdzone czystym `git status`.

## Blokady

Brak.

## Rundy

2/5.

## Następny krok

Evaluator rundy 2.

DEPLOY/PUSH: NIE WYKONANO
