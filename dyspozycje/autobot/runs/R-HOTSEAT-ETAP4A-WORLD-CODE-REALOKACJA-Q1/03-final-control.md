STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1
GOAL: Krok 0+1 z recon §6.1 — wydzielić `runWorldEndTurn()` (fazy 7-14, literalny
copy-paste) i przenieść na jej początek trzy bloki „światowe" (`st.bunt`,
`evictForeignUnitsFromCityHexes()`, reset ruchu wszystkich jednostek) — no-op
behawioralny przy jednym fotelu.

## Metoda (niezależna od Operatora/Evaluatora)

Guard §2b: `git log -1` = `dfc1bec3` (oczekiwane), `git status --short` puste — zgodne.
Przeczytany CAŁY `git diff 06c0eaa5..HEAD -- gra/src/main.ts` (3 hunki, jak twierdzi
Evaluator) linia po linii, plus bezpośredni odczyt finalnego kodu main.ts:28638-28667
i main.ts:33108-33150. Zweryfikowałem SAMODZIELNIE, bez ufania cytatom obu raportów.

## Punkty a-e dyspozycji

(a) `runWorldEndTurn()` = dokładnie fazy 7-14 (`turn++`@28663 do `setTurnTransition(100,...)`
+yield, PRZED `catch`/`finally`) — potwierdzone odczytem, `catch`/`finally` fizycznie
zostają w `triggerPlayerEndTurn`, wołane po `await runWorldEndTurn()` (main.ts:33122-33125).
(b) Trzy bloki fizycznie zniknęły ze starej pozycji (grep: brak `st.bunt`/
`evictForeignUnitsFromCityHexes()`/`movedByPlayerThisTurn.clear()` w nowym
`triggerPlayerEndTurn`) i są na starcie `runWorldEndTurn()` — potwierdzone.
(c) `const nextTurnNum = turn + 1;` PIERWSZĄ instrukcją `runWorldEndTurn()` (28644) —
lokalne przeliczenie, nie martwe domknięcie — potwierdzone.
(d) Trzy call-site'y (`main.ts:21042` HUD, `21630` `__eraTestDebug.endTurn`, `33283`
skrót „N") — WSZYSTKIE poza zakresem obu hunków diffu, wołają `triggerPlayerEndTurn()`
bez zmian — potwierdzone.
(e) `grep -n "endActiveHumanTurn|advanceSeat" gra/src/main.ts` → **zero trafień**.

## Testy — uruchomione SAMODZIELNIE

- `tsc --noEmit` (5.9.3, node_modules realny, nie symlink): **0 błędów**.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6 — wszystkie zielone.
- `git diff --check`: czyste. `wc -l`: 36186→36190 (+4, zgodne z raportem).
- **Bramka no-op, PEŁNE 4×30, sekwencyjnie (nie równolegle — dokładnie rekomendacja
  Evaluatora z BLOKADY):** (1) `/home/user/The-Game`@`06c0eaa5` (PRZED, main czyste) —
  30/30 A=B; (2) worktree Operatora (PO) uruchomienie 1 — 30/30 A=B; (3) worktree
  Operatora (PO) uruchomienie 2 — 30/30 A=B. Wyekstrahowane WSZYSTKIE 3×60 linii hashy
  (A+B po 30) do plików i porównane `diff`: **baseline vs PO#1 IDENTYCZNE, baseline vs
  PO#2 IDENTYCZNE, PO#1 vs PO#2 IDENTYCZNE** — zero rozbieżności, bit-w-bit, wszystkie
  90 punktów danych. To zamyka lukę zostawioną przez Evaluatora (jego 4×30 było
  niepełne z powodu kontencji CPU) — mój dowód jest kompletny.

## Dwie notatki informacyjne Evaluatora

1. Brak pliku z baseline hashy w katalogu runu — kosmetyczne/proceduralne, NIE wpływa
   na GOAL/dowód/zakres. ODDAL jako blokada; rekomendacja na przyszłość (zapisywać
   pełną listę do pliku) do zanotowania przez orkiestratora, nie wymaga nowej rundy.
2. Evaluator nie ukończył samodzielnie pełnych 4×30 — dotyczy KOMPLETNOŚCI DOWODU
   (§3b), więc formalnie nie mogłoby zamknąć tematu bez uzupełnienia. **Uzupełnione
   w tej rundzie przeze mnie** (patrz TESTY wyżej) — luka zamknięta, nie wraca do
   Operatora.

## Własne dodatkowe ustalenie (poza listą Evaluatora)

Kolejność `evictForeignUnitsFromCityHexes()` względem `runPlannedMarchesAtPlayerEndTurn()`
uległa ODWRÓCENIU (dawniej evict PRZED marszem, dziś evict PO marszu, wewnątrz
`runWorldEndTurn()`) — recon uzasadniał niezależność kolejności trzech bloków
wyłącznie względem `turn` (żaden go nie czyta), nie względem kodu „gracza" między nimi.
Zweryfikowałem ciała `evictForeignUnitsFromCityHexes`/`applyMarchSegmentInstant`:
wejście na obcy heks miasta jest zablokowane już na poziomie planowania ścieżki
(`canOccupyHexForUnit`/`canUnitOccupyCityHex`, main.ts:23304, 23737) — normalny marsz
strukturalnie nie może wylądować na nieswoim mieście bez odrębnej mechaniki
zdobycia. Bramka no-op (bez rozkazów gracza) nie ćwiczy tej ścieżki wcale — to
ŚWIADOME, ujawnione w recon §6.2 pkt 4 uproszczenie testu, nie ukryta luka. **ODDAL
jako blokadę tej rundy** (mechanika gry chroni przed obserwowalną różnicą; kryterium
dyspozycji było i pozostaje spełnione) — **rekomendacja NIE-blokująca**: dopisać do
`R-HOTSEAT-ETAP4B-SPLIT-Q1` scenariusz testowy z aktywnym zaplanowanym marszem, zanim
`endActiveHumanTurn`/hot-seat uczynią tę interakcję realnie osiągalną.

BLOKADY: brak.
ZMIANY/COMMIT: brak nowych zmian w `gra/src/main.ts` (weryfikacja czysto odczytowa);
ten raport, allowlist-only.
RUNDY: 1/5.
NASTĘPNY KROK: integracja allowlist-only przez orkiestratora (`gra/src/main.ts` +
artefakty runu) → po zielonym Etapie 4a dispatch `R-HOTSEAT-ETAP4B-SPLIT-Q1`
(uwzględniając rekomendację testową wyżej).
GOTOWOŚĆ DO INTEGRACJI: TAK.
DEPLOY/PUSH: NIE WYKONANO
