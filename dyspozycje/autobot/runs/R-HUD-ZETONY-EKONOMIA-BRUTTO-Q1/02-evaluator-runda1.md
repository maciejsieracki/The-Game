STATUS: PASS
DOMAIN: GAME
TEMAT: R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1
GOAL: Trzy żetony HUD (Praca, Skarbiec, Nauka) + nagłówki analogicznych sekcji w
`empireDetailPanel.ts` pokazują BRUTTO zamiast netto; redukcja do netto zostaje
wyłącznie w rozpisce/tooltipie/tabeli bilansu. Praca dociągnięta o brakujące pole
"Cuda na mapie".

ZMIANY/COMMIT: zweryfikowano `a417f361` na `autobot/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1`
(baza `f2809766`, potwierdzone `git merge-base --is-ancestor`) w worktree
`/home/user/wt-hud-zetony-brutto`.
- `git diff f2809766 a417f361 --stat`: dokładnie 4 pliki kodu/testu + 2 pliki runu
  (`01-operator-runda1.md`, zrzut PNG) — zero plików poza allowlistą.
  `gra/src/main.ts` (+16/-0), `gra/src/ui/empireDetailPanel.ts` (+38/-10),
  `gra/src/ui/hud.ts` (+59/-10), `gra/tools/hud-zetony-ekonomia-brutto-live-test.cjs`
  (nowy, 205 linii).
- `main.ts`: potwierdzono nowe pole `_lastPracaCudaKoszt` — deklaracja, akumulacja
  `+= usedPlayer` w pętli `advanceOwnerWonderMapBuilds`, wystawienie w
  `buildHudState()` jako `pracaCudaKoszt: Math.round(...)`, reset do 0 w dokładnie
  3 miejscach (`_lastPracaRate = 0; _lastPracaAutoUlepszeniaKoszt = 0;` blok end-of-turn,
  i dwa dalsze bloki reset z `_lastPracaUpkeep`/`_lastPracaAutoUlepszeniaKoszt`).
  `git diff -- main.ts` nie dotyka ANI JEDNEJ linii kodu w blokach
  P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES2/3 (jedyne wystąpienie "REGRES2" w
  diffie to niezmieniona linia kontekstu diff-hunka, nie modyfikacja).
  Potwierdzono, że `bogactwoWplywyBrutto` (Skarbiec) istniało JUŻ PRZED tym commitem
  (nie jest dodane w tym diffie) — zgodne z twierdzeniem operatora.
- `hud.ts`: `HudState.pracaCudaKoszt?: number` dodane; `pracaWplywBrutto()` (nowa,
  samowystarczalna) i `pracaChipTitle()` (4. składnik dołączony) liczą identyczny
  wzór `netto + utrzymanie + autoUlepszenia + cudaNaMapie`; `renderBarD1B` (teraz
  `export`) — żeton Skarbiec czyta `s.bogactwoWplywyBrutto ?? s.bogactwoRate`, żeton
  Praca czyta `pracaWplywBrutto(s)`; `rateWarn` na żetonie Praca nadal patrzy na
  `pracaRate` (netto), nie na brutto — ostrzeżenie o kurczącej się puli zachowane.
  `naukaChipTitle()` — tylko zmiana opisu (komentarz "brutto = netto"), zero zmiany
  liczby, zgodnie z twierdzeniem że Nauka nie ma dziś drenaży.
- `empireDetailPanel.ts`: hero Skarbca renderuje "Wpływy brutto" z `wplywy`
  (=`bogactwoWplywyBrutto`), `nettoCls` (kolor ostrzegawczy) nadal kluczowany
  `netto`; `renderPracaSection()` liczy `wplywBrutto` z 4 składników (w tym nowego
  `cudaKoszt = economy.pracaCudaKoszt`), box "PULA IMPERIUM" pokazuje `wplywBrutto`;
  nowy warunkowy box + stopka "CUDA NA MAPIE" (wzorzec identyczny z istniejącym
  "AUTO-ULEPSZENIA (AI)"); dalsza tabela bilansu per-miasto i etykieta "Netto
  skarbiec" niżej w pliku pozostają nietknięte (redukcja do netto nadal widoczna).
- `git diff --check`: czysto (brak whitespace-errors).

TESTY (wszystkie uruchomione samodzielnie w worktree, nie tylko odczytane z raportu):
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/`: czysto, zero błędów.
- `node tools/hud-zetony-ekonomia-brutto-live-test.cjs`: **5 pass, 0 fail**,
  potwierdzone niezależnie. Wyrenderowany tekst (prawdziwy `renderBarD1B`, prawdziwy
  headless Chromium): `Skarbiec500+40Praca88+113...Nauka310+15` — WSZYSTKIE TRZY
  brutto jednocześnie w jednym renderze, zapas Pracy "88" i etykieta zapasu
  żywności "48" (`Spichlerz480` w innerText) niezmienione względem mock-inputu.
  Otwarto zapisany PNG `zrzut-runda1-trzy-zetony-brutto.png` — treść zgadza się
  1:1 z cytatem z raportu operatora.
- `node tools/praca-auto-ulepszenia-koszt-split-test.cjs`: 20 pass, 0 fail —
  potwierdza brak regresu na istniejącej bramce Pracy po zmianie
  `pracaChipTitle`/`renderBarD1B`.
- `node tools/hud-tooltip-body-mounted-panels-test.cjs`: 16 pass, 0 fail przy
  samodzielnym, izolowanym uruchomieniu (zgodne z opisem operatora, że fail
  wcześniej wystąpił tylko pod dużą współbieżnością — nie sprawdzano tu ponownie
  reprodukcji flaki, bo operator już potwierdził identyczność z baseline przez
  `git stash`).
- Nie uruchomiono ponownie wszystkich 38 bramek dotykających `hud.ts`/
  `empireDetailPanel.ts` z raportu operatora (zaufano zakresowi regresji operatora
  dla pełnej listy; zweryfikowano samodzielnie tsc + trzy bramki wskazane explicite
  w raporcie/dispatchu jako najbardziej istotne dla tej zmiany).

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator → orkiestrator dispatchuje Final Control osobno →
integracja allowlist-only.
ZARZUTY: brak.
DEPLOY/PUSH: NIE WYKONANO
