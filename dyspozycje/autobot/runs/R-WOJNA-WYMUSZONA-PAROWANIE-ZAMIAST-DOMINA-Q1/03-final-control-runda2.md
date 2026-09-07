# 03-final-control-runda2.md — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1, Final Control runda 2/5 (werdykt CAŁOŚCI)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
GOAL: Jedna wspólna `assignForcedWarPairings` (forced-war-common.ts) zastępująca coordinated-pick
i domino trójstronne; ECHO krok 1 (warless 1v1 pierwsi, globalnie wszystkie epoki+gracz) i krok 2
(nieparzysta reszta dołącza jako trzeci); gracz jak AI; brzegowy przypadek → `unresolvedOwnerIds`/
DECISION_REQUIRED. Zgadza się z `00-dispatch.md`.

## ZMIANY/COMMIT
Worktree `/home/user/wt-wojny-domino`, HEAD `798e9a3d` (baza `8b3ddfaa`), `git status` czyste.
`git diff 8b3ddfaa HEAD --stat`: WYŁĄCZNIE `forced-war-common.ts` (nowy rdzeń), `forced-war-
{bronze,stone,iron}.ts`, `main.ts`, bramki `forced-war-*`/`wojna-wymuszona-parowanie-test.cjs`,
`runs/**`. Zero trafień na `ai.ts`/`society-breakdown.ts`/`order.ts`/`docs/decyzje/**`/`WERSJE.md`/
`gra-robocza/**` (grep dedykowany, 0 linii). `git diff 8b3ddfaa HEAD -- main.ts`: hunki tylko na
importach i bloku 30360-31307 (mechanizm wojny wymuszonej) — zgodne z allowlistą i ratyfikacją
zarzutu 1 z rundy 1. `git diff 041b8a01 798e9a3d --stat` (delta rundy 2 osobno): WYŁĄCZNIE
`forced-war-iron-mutant-probe.cjs` + `forced-war-trojstronna-domino-live-test.cjs` + raporty —
zero zmian logiki w rundzie 2, potwierdzone niezależnie (nie tylko odczytane z raportu Evaluatora).

## TESTY (wszystkie uruchomione niezależnie od zera, z `gra/`)
- `npx tsc --noEmit` → 0 błędów.
- 5 referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- Cała rodzina (`find tools -iname "*forced-war*" -o -iname "*wojna*wymuszona*"`, 17 plików
  realnych): wszystkie 17 PASS, liczby identyczne z raportami — bronze 56/56, bronze-main-guard
  28/28, bronze-new-game-reset 34/34, stone 38/38, stone-main-guard 19/19, iron 55/55,
  iron-main-guard 37/37, iron-era-enter-turn-save-load 20/20, trojstronna 23/23,
  trojstronna-main-guard 14/14, reguly-multi-turn-simulation 39/39, p-wojna-wymuszona-trzy-naprawy
  13/13, wojna-wymuszona-parowanie-test 47/47, player-target-live 11/11 (Playwright),
  iron-player-target-live 11/11 (Playwright).
- **Blokery rundy 1, uruchomione z uwagą szczególną**: `forced-war-iron-mutant-probe.cjs` → PEŁNY
  PASS, exit 0 (kontrakt czysty 55/55, bramka main/ai 37/37). `forced-war-trojstronna-domino-live-
  test.cjs` z timeoutem 450s (>180s zgodnie z instrukcją) → **28 pass · 0 fail, exit 0** — realny
  Chromium ukończył wszystkie 3 scenariusze (bootstrap, para bez blokady = tylko attacker
  wypowiada wojnę, sojusz napastnika i sojusz obrońcy = cała para zablokowana z dokładnie jednym
  DECISION_REQUIRED każdy). Oba blokery rundy 1 zielone, potwierdzone niezależnie.

## WERYFIKACJA NIEZALEŻNA NIEZMIENNIKA BINARNEGO (własny harness, esbuild ładujący prawdziwą
`assignForcedWarPairings`, zero reimplementacji formuły, konstrukcje INNE niż Scenariusz 10
Obrony i fuzz 6-podmiotowy Final Control rundy 1):
1. Ręczna konstrukcja adwersaryjna: 9 podmiotów (gracz+8 AI), blokady = cykl C9 + 3 akordy
   (0-4,1-5,2-6), n nieparzyste, brak istniejących par → niezmiennik OK, dokładnie 1 unresolved
   (jak oczekiwano, brak pary do dołączenia).
2. Ręczna konstrukcja: 10 podmiotów (gracz+9 AI), gęste "koło" blokad (odległość ≤2 na okręgu) +
   2 istniejące pary aktywne poza zasięgiem blokady gracza → niezmiennik OK, krok 4 (dołączanie
   leftover) realnie ćwiczony.
3. Fuzz 4000 losowych instancji, n=7..12, gęstość blokad 20-80%, z losowymi istniejącymi parami
   (mulberry32, seed inny niż jakikolwiek wcześniejszy fuzz w temacie) → **0 naruszeń blokad,
   0 naruszeń niezmiennika binarnego**.
Razem 17/17 asercji własnego harnessu zielone. Niezmiennik ECHO potwierdzony niezależnie na
świeżych, gęstszych topologiach.

## WPIĘCIE PRODUKCYJNE (main.ts)
Potwierdzone bezpośrednio w kodzie (nie tylko w testach): `assignForcedWarPairings` wołana
BEZWARUNKOWO raz na turę w `boot()` (main.ts ~30524), wewnątrz realnej pętli AI (przed
`ownerLoop`, UI `setTurnTransition`/`yieldTurnTransitionUi` obok — jednoznacznie kod produkcyjny,
nie gałąź testowa). Wynik (`forcedWarAssignmentByOwner`) czytany per owner w `ownerLoop`
(~31283-31289) i podstawiany do `bronze/stone/ironForceWarTargetId`. Grep na stare
`pickXForcedWarDominoOwnerIds`/`pickXForcedWarTargetIdCoordinated` w `main.ts` i
`forced-war-{bronze,stone,iron}.ts`: zero definicji (tylko komentarze historyczne) — stara
zduplikowana logika faktycznie usunięta, nie owinięta.

## BLOKADY
Brak.

## RUNDY: 2/5 (temat zamknięty, PASS całości obu rund)
## NASTĘPNY KROK: integracja z main przez orkiestratora (allowlist-only), poza zakresem tej roli.
## DEPLOY-PUSH: NIE WYKONANO

## WERDYKT CAŁOŚCI (obie rundy)
PASS. Runda 1: zarzut 1 (zakres main.ts) słusznie oddalony przez poprzednie Final Control —
diff fizycznie potwierdza konieczność edycji wewnątrz `ownerLoop`. Zarzut 2 (algorytm zachłanny
→ max-matching DP-na-bitmasce) naprawiony i ponownie zweryfikowany fuzzem. Runda 2: oba blokery
(mutant-probe Żelaza, domino-live-test) naprawione WYŁĄCZNIE w dwóch plikach testowych, zero
zmian logiki — potwierdzone `git diff` i powtórzeniem testów od zera z długim timeoutem. Własna,
nowa weryfikacja niezmiennika binarnego (9- i 10-podmiotowe konstrukcje adwersaryjne + fuzz 4000
prób) nie znalazła naruszeń. Wpięcie w produkcyjną pętlę main.ts potwierdzone bezpośrednio.
Temat gotowy do integracji z main.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Fs7eokPtaxbQL7KGTXXeWS
