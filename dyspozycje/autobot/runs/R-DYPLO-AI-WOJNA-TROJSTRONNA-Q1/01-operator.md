STATUS: PASS
DOMAIN: GAME
TEMAT: R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1
GOAL: gdy AI-A/AI-B są już we wzajemnej wojnie wymuszonej (Kamień/Brąz/Żelazo) i gracz nie
ma pary w tej rundzie koordynacji — OBIE wypowiadają jednocześnie wojnę graczowi, chyba że
KTÓRAKOLWIEK strona ma aktywny sojusz z graczem; zero zmian w ai.ts Priorytet 4; zero
dodatkowego ograniczenia trudnością; zero regresji fallbacku pojedynczego (P-WOJNA-WYMUSZONA-
TRZY-NAPRAWY-Q1).
MODEL+EFFORT: Sonnet 5, effort high (Ścieżka B — różnicowanie rolą w treści promptu).

RECON (przed kodem): mechanizm koordynacji `candidatesAlreadyAtWarIds` i fallback
`playerActiveForcedWarCount` (main.ts ok. L29485-29820, po wcześniejszym reconie
R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1) dotyczą OWNERA DOPIERO SZUKAJĄCEGO celu — obie
strony JUŻ aktywnej pary mają `alreadyAtWarAnyRole=true`, więc normalna ścieżka je pomija.
Domino musi być NIEZALEŻNYM mechanizmem na `*ForceWarActiveByPairKey` (targetId!==0).

Kolizja z limitem "Normalny: max 1 naraz" (RECON pkt 4): NIE dotyczy domina — ten limit
(`playerActiveForcedWarCount>=1` w `pickXForcedWarTargetIdCoordinated`) jest INNYM, węższym
mechanizmem fallbacku pojedynczej AI. Nowe funkcje domina (`pickXForcedWarDominoOwnerIds`)
świadomie NIE przyjmują `poziomTrudnosci` — ECHO 3 ("bez dodatkowego łagodzenia") realizowany
przez brak parametru, nie przez obejście istniejącego.

ZMIANY/COMMIT: allowlista dokładnie: forced-war-stone.ts, forced-war-bronze.ts,
forced-war-iron.ts (po jednej nowej, czystej funkcji `pickXForcedWarDominoOwnerIds` +
typy), main.ts (import x3, snapshot+3 Sety policzone RAZ przed `ownerLoop`, 3 miejsca
użycia `if (xDominoOwnerIds.has(ownerId)) xForceWarTargetId = 0;`), 2 nowe testy. Commit
5d3bd6fe na gałęzi autobot/R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1 (baza origin/main 10aeec78).
Zero usunięć, zero zmian w ai.ts.

Decyzja inżynierska wymagająca uwagi Evaluatora: snapshot "gracz ma już parę" MUSI być
liczony RAZ przed `ownerLoop` (nie per-owner jak istniejący `playerActiveForcedWarCount`) —
inaczej pierwszy przetworzony owner pary zdąży dopisać graczowi wojnę i drugi zobaczy już
wynik pierwszego, łamiąc "jednocześnie". To rozszerza literalny zakres main.ts poza
linie 29485-29820 (insert ok. L28762, tuż przed `ownerLoop:`) — uzasadnienie w komentarzu
w kodzie, konieczne dla kryterium 1.

ZNANE OGRANICZENIE (do jawnej oceny Evaluatora, nie ukryte): silnik potrafi zawiesić
`ownerLoop` w połowie tury (animacja bitwy, `aiCmdResume`) i wznowić go PONOWNYM
wywołaniem `runAiPhase`, które przelicza snapshot na nowo. Gdyby pauza trafiła
DOKŁADNIE między przetworzeniem strony A i B tej samej kwalifikującej się pary, B
zobaczyłby już wynik domina A i by się nie uruchomił (połowiczne "jednocześnie"). Rzadki
brzeg (wymaga bitwy dokładnie w tym oknie), nie objęty kryteriami końca wprost — pełne
rozwiązanie wymagałoby stanu przetrwałego przez `aiCmdResume`, poza allowlistą tego
tematu (main.ts poza "punktami wywołania fallbacku"). Zgłaszam do decyzji: pozostawić
jako udokumentowane ograniczenie, czy rozszerzyć allowlistę osobnym ABC.

TESTY (wklejone wyniki, nie streszczone):
- tsc --noEmit: 0 błędów.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- NOWE, żywa symulacja (reguła anty-halucynacyjna dispatchu): forced-war-trojstronna-test.cjs
  21/21 PASS — para bez sojuszu+gracz bez pary→obie strony (kryt.1); sojusz napastnika LUB
  obrońcy→zero efektu (kryt.2, ECHO 2 "KTÓRAKOLWIEK"); gracz już sparowany→zero efektu
  (kryt.3/GOAL5); wiele par jednocześnie; obrona w głąb.
- forced-war-trojstronna-main-guard-test.cjs 14/14 PASS, w tym dowód mutacyjny
  (usunięcie okablowania Brązu czerwieni test).
- Regresja zero: forced-war-stone-test 45/45, forced-war-bronze-test 60/60,
  forced-war-iron-test 46/46, forced-war-stone-main-guard 19/19,
  forced-war-iron-main-guard 29/29, forced-war-bronze-new-game-reset-test 32/32,
  forced-war-reguly-multi-turn-simulation-test 45/45, forced-war-player-target-live-test
  11/11 (żywy Chromium, kryt.3, PEŁNY PRZEBIEG).
- forced-war-iron-player-target-live-test: NIEROZSTRZYGNIĘTY (2 próby, żywy Chromium wisi
  na tym samym etapie bootstrap ?playtest=mapa oba razy, >150s, poza timeoutem) — etap
  bootstrap jest WSPÓLNY z bronze/stone (który przeszedł 11/11 pełnym przebiegiem), a mój
  kod nie dotyka bootstrapu/mapy, więc podejrzenie: kontencja zasobów tej współdzielonej
  maszyny (widoczne równoległe worktree wf_*), nie regresja tego tematu — wymaga
  niezależnej próby Evaluatora, nie uznaję kryterium za spełnione bez niej.
- ai-test 287/295 (8 FAIL) i forced-war-bronze-main-guard-test 27/28 (1 FAIL) —
  POTWIERDZONE identyczne na czystym origin/main (osobny worktree baseline, a522cd7e) —
  przedistniejące, poza zakresem tego tematu (C-025).
- forced-war-iron-mutant-probe: 28/29 pokrycia, luka "eliminacja i nowa gra Żelaza"
  POTWIERDZONA identyczna na baseline (mutant M56 ma nieaktualną kotwicę tekstową,
  niezwiązaną z tym tematem).

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
