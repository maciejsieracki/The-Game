# 03-final-control-runda1.md — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1, Final Control runda 1/5

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
GOAL: Jedna wspólna `assignForcedWarPairings` zastępująca coordinated-pick i domino
trójstronne; krok 1 ECHO warless 1v1 pierwsi; krok 2 nieparzysta reszta dołącza jako
trzeci; gracz jak AI; brzegowy przypadek → `unresolvedOwnerIds`/DECISION_REQUIRED.

## ZMIANY-COMMIT
Zweryfikowano `git log`/`git show --stat` w `/home/user/wt-wojny-domino`: cały stan rundy 1
(Operator+Obrona) jest w JEDNYM commicie `c0083cfb` (baza `8b3ddfaa`), working tree czyste —
zgodne z raportami. `git diff 8b3ddfaa c0083cfb -- gra/src/main.ts` potwierdza hunki na
30360+, 30900, 31136-31273, 31264-31307 — czytelnie widać, że usunięte bloki
`pickBronzeForcedWarTargetIdCoordinated`/analogi Kamienia/Żelaza żyły GŁĘBOKO wewnątrz
`ownerLoop` (nie tylko punkt wywołania przed nim). `ai.ts`, `society-breakdown.ts`,
`order.ts`, `docs/decyzje/**`, `WERSJE.md`, `gra-robocza/**` — zero zmian, potwierdzone.

## TESTY (wszystkie uruchomione niezależnie, z `gra/`)
- `npx tsc --noEmit` → 0 błędów. Potwierdzone.
- 5 referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6. Potwierdzone identycznie.
- Cała rodzina (`find gra/tools -iname "*forced-war*" -o -iname "*wojna*wymuszona*"`,
  17 plików realnych, wykluczając artefakty esbuild): WSZYSTKIE 17 uruchomione osobno,
  liczby identyczne z raportami Operatora/Evaluatora/Obrony — bronze-test 56/56,
  bronze-main-guard 28/28, bronze-new-game-reset 34/34, stone-test 38/38,
  stone-main-guard 19/19, iron-test 55/55, iron-main-guard 37/37,
  iron-era-enter-turn-save-load 20/20, trojstronna-test 23/23, trojstronna-main-guard
  14/14, reguly-multi-turn-simulation 39/39, p-wojna-wymuszona-trzy-naprawy 13/13,
  wojna-wymuszona-parowanie-test **47/47** (Scenariusz 10 zielony), player-target-live
  11/11 (Playwright), iron-player-target-live 11/11 (Playwright). **Dwa czerwone,
  potwierdzone bez zmian**: `forced-war-iron-mutant-probe.cjs` — exit 1, FAIL (mutacje
  M38-M44/M56 na usunięty kod per-owner nadal niepokryte); `forced-war-trojstronna-domino-live-test.cjs`
  — 22 pass · 2 fail, dokładnie asercje D/F (strona 2 domina nie wypowiada wojny + log
  DECISION_REQUIRED w konsoli), zgodnie z GOAL 1 nowego algorytmu.

**Weryfikacja WŁASNA zarzutu 2 (niezależna od Scenariusza 10)**: fuzz+konstrukcje ręczne,
harness w scratchpadzie, `assignForcedWarPairings` ładowana przez esbuild (zero
reużycia formuły). (A) własna topologia 6 podmiotów {10..60}, blokady {10-30,10-50,
20-40,20-60,30-60,40-50} — pełne dopasowanie 3/3 znalezione, 0 unresolved, żadna
zwrócona para nie narusza blokady. (A2) 6 podmiotów z graczem, trójkąt blokad
{22-44,44-55,55-22} — rozmiar dopasowania zgodny z niezależnym brute-force. (B) fuzz
3000 losowych instancji (n=2..14, gęstość blokad 15-70%), porównanie z NAIWNYM
brute-force max-matching (osobna implementacja, bez DP/bitmasek) — **0 niezgodności,
0 użytych zablokowanych par**. Naprawa Obrony (DP na bitmasce) potwierdzona jako
faktycznie ogólna, nie dopasowana punktowo do przykładu Evaluatora.

## BLOKADY
1. `forced-war-iron-mutant-probe.cjs` — FAIL (potwierdzone, exit 1).
2. `forced-war-trojstronna-domino-live-test.cjs` — 22 pass, 2 fail (potwierdzone).
Oba jawnie odłożone przez Operatora/Obronę na rundę 2; **kryterium binarne dispatchu
wymaga CAŁEJ rodziny forced-war-* zielonej — dopóki te dwa są czerwone, runda NIE MOŻE
dostać PASS**, niezależnie od jakości reszty (Obrona PASS-WITH-NOTES jest tu za
optymistyczna wobec własnego binarnego kryterium dispatchu).

## RUNDY: 1/5
## NASTĘPNY KROK (runda 2, dokładnie dwa zadania — zarzut 1 ODDALONY, brak trzeciego):
(a) dopisać ~15-20 mutacji w `forced-war-iron-mutant-probe.cjs` pokrywających pre-pass
(`triggeredSubjects`/`assignForcedWarPairings` per-owner odczyt w Żelazie);
(b) przepisać asercje D/E/F `forced-war-trojstronna-domino-live-test.cjs` pod nowy kształt
(cel tylko JEDNEJ, wybranej strony domina — nie obu).
## DEPLOY-PUSH: NIE WYKONANO

## WERDYKTY

**Zarzut 1 (main.ts poza literalnym "punkt wywołania przed `ownerLoop`") → ODDAL.**
Diff (`git diff 8b3ddfaa c0083cfb -- gra/src/main.ts`) fizycznie potwierdza: usunięte bloki
`pickXForcedWarTargetIdCoordinated` żyły per-owner WEWNĄTRZ `ownerLoop` (linie ok.
31136-31273 dla Brązu, analogicznie Kamień/Żelazo) — to samo miejsce, które sekcja
"MAPA KODU" tego samego dispatchu (autorstwa orkiestratora) już lokalizuje PRZED
ALLOWLISTĄ. Sekcja "ROZSTRZYGNIĘCIE ZAKRESU" jest jawną, świadomą decyzją tej samej
strony (orkiestratora), która napisała allowlistę, wydaną w TYM SAMYM dokumencie,
explicite mówiącą "rozstrzygane tu, nie eskalowane do właściciela" — nie jest to
sprzeczność dispatch-vs-właściciel wymagająca C-054/STOP, tylko wewnętrzna niespójność
między wcześniejszą sekcją zakresu a później zredagowanym, węższym zdaniem allowlisty,
którą sam dispatch już rozstrzyga na korzyść ROZSTRZYGNIĘCIA ZAKRESU. GOAL byłby fizycznie
niewykonalny bez tych edycji. Operator jawnie ujawnił interpretację do ratyfikacji zamiast
milczeć — zgodne z procesem. Brak naruszenia; zero działania w rundzie 2. Rekomendacja
kosmetyczna (nie blokuje): przyszłe dispatche z sekcją ROZSTRZYGNIĘCIE ZAKRESU powinny
od razu redagować ALLOWLISTĘ jako already-updated, nie zostawiać sprzecznego zdania.

**Zarzut 2 (parowanie zachłanne, nie maksymalne) → PRZYJĘTY i NAPRAWIONY, potwierdzone
niezależnie.** Weryfikacja własna (opis wyżej: (A), (A2), fuzz 3000 prób) potwierdza, że
DP-na-bitmasce w `assignForcedWarPairings` zwraca dokładne maksymalne dopasowanie na
DOWOLNEJ topologii blokad, nie tylko na przykładzie Evaluatora. Brak dalszego działania.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Fs7eokPtaxbQL7KGTXXeWS
