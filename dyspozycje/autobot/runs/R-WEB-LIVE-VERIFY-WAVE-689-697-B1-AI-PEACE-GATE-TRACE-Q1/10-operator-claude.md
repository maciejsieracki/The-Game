STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1
GOAL: rozstrzygnąć w żywej grze, dlaczego AI nie wysyła graczowi bezwarunkowego `zaproponuj_pokoj` przy zmęczeniu wojną >= 0,8 (od tury 16 wojny).
ZMIANY/COMMIT: kod gry NIE zmieniony (brak haka `__civTest.aiPeaceTrace`, brak runnera `gra/tools/live-verify-wave-689-697-b1-*.cjs`). Commit zawiera wyłącznie ten raport. Lokalnie wykonano `npm ci --ignore-scripts` w gra/ (71 pakietów; node_modules nie jest commitowane).
TESTY: NIE_ZMIERZONO (pomiar w żywej grze nie został wykonany w tej rundzie). tsc, 5 bramek referencyjnych i git diff --check nie były wymagane, bo kod gry nie został zmieniony.
BLOKADY: (1) hak read-only pod ?civTest=1 nie został napisany; (2) runner z checkpointem (20+ tur realnej wojny, tryb przyspieszony, 2 ziarna) nie został zbudowany ani uruchomiony; (3) zakres rundy 1 ograniczono do analizy statycznej, co nie spełnia kryterium (1) tematu (przyczyna z dowodem z hooka).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 Operatora z tym samym ID: dodać hak (punkty zapisu w civTestRuntime, bez logów w pętli tury), zbudować bundle poza repo (`node ./node_modules/vite/bin/vite.js build --outDir <katalog w scratchpadzie>`), uruchomić wzorem gra/tools/measure-ai-trade-offer-frequency.cjs (Chromium /usr/bin/chromium, ?civTest=1, setFastMode), wojna przez UI lub ownerDeclareWarOn, 20+ tur, 2 ziarna, tabela kandydatów a–d z dowodem z hooka.
DEPLOY/PUSH: NIE WYKONANO

## Analiza statyczna (baza origin/main 75e238e52; linie odczytane z plików)

Ścieżka propozycji AI -> gracz w gra/src/main.ts:

1. Decyzja: gra/src/game/ai.ts ~7050-7066, gałąź bezwarunkowa. Warunki: `rel.stanWojny && rel.partnerId === '0' && aiPeaceTimeOk && wearinessUnconditionalEndDue(wearyLevel)`; komenda `zaproponuj_pokoj` z `bezwarunkowy: true`. Poza grą (gra/tools/live-verify-wave-689-697-b-ai-peace-probe.cjs @ 2111b4471) gałąź zwraca komendę dla T=16 i T=20 przy lost=0.
   - ai.ts:6975: `turnsAtWarRel = rel.turnsAtWar`; `aiPeaceTimeOk = turnsAtWarRel >= max(minTurWojny, 10)`.
   - war-weariness.ts:68-72: poziom = turns/pelneTur + wagaStratMiasta*lostCitiesTotal (pelneTur=20 wg data/war-weariness-params.json). Poziom nie zależy od turnsSinceCityChange. Przy T=16 poziom = 0,80 dokładnie, więc wynik zależy od off-by-one licznika.
2. Wejście do decyzji w grze: main.ts ~42987-43062 buduje relacjeDip. `relAi.turnsAtWar` pochodzi z diploRelWarFields (main.ts:12086-12089) -> diploWarStateFor (main.ts:11940). NIEZWERYFIKOWANE: czy licznik turnsAtWar w grze w danej turze równa się T, czy T-1 (przy T-1 poziom = 0,75 < 0,80 i gałąź nie odpala). Do zmierzenia hakiem.
3. Warstwa mgły: main.ts:43058 `dipLayer = diplomacyLayerForOwner(ownerId, simplifiedDiplomacyOwners, foreignTypeOwners, contactedOwners)`. `contactedOwners = getDiplomaticContacts()` (main.ts:42475 -> 23355 -> diplomaticallyDiscoveredOwnersSet). Warstwa = 'pre_contact' tylko gdy gracz nigdy nie odkrył tej AI (diplo-layers.ts:272-285). Zbiór jest trwały (main.ts:23363, 13911, 13935). W trwającej wojnie to prawdopodobnie NIE jest przyczyna (NIEPOTWIERDZONE).
   - Filtr: `filterDiplomacyCommandsForLayer(dipCmdsPlayerFacingNormal, dipLayer)` w bloku dipCmdsLayered (main.ts ~43385-43395). Dla warstwy 'simplified' przepuszcza `zaproponuj_pokoj` (diplo-layers.ts:22-30, SIMPLIFIED_CMD).
4. Przekazanie na stół: main.ts ~43617-43621, dla targetId === 0: `if (cmd.type === 'zaproponuj_pokoj') enqueueDiplomacyPendingFromCmd(ownerId, cmd)`.
5. main.ts:20765 `enqueueDiplomacyPendingFromCmd`: `if (!diplomaticContactEstablishedSet().has(ownerId)) return;`. Zbiór zasilany przez establishDiplomaticContact (main.ts ~23391), onDiplomacy z modali obcego miasta/jednostki (main.ts 13912, 13936), applyAiAudienceRequest (main.ts ~24339) i hak (main.ts 29795, 30441). NIEPOTWIERDZONE, czy zasilany jest w każdej wojnie; do zmierzenia.
6. main.ts ~20798-20808: `atWarWithPlayer` blokuje wszystkie typy oprócz zaproponuj_pokoj / trybut / miasto. `zaproponuj_pokoj` przechodzi.
7. main.ts:12117-12121 `peaceProposalIsTooEarly` -> diplomacy-peace-proposal-timing.ts:6 (blokada gdy turnsAtWar < 10). Przy T >= 16 NIE blokuje.
8. main.ts ~20915-20933: `peaceBareAllowed` = (rodzaj rozejm lub bezwarunkowy) && neededPn <= 0 && brak pozycji i złota. Omija clampAiProposalPayloadToRealResources; payload bezwarunkowego pokoju zostaje pusty. Kolejne guardy (`!peaceBareAllowed && ...`, sensibleBalance, aiOneshotHandelOverpaysPlayer) nie odrzucają pokoju.
9. Dalej, NIEZBADANE w tej rundzie: main.ts ~20985-21040 — `hasPendingNegotiationForPair` (dedup), `isOfferRejectedOnCooldown(rejectedOfferCooldowns, ...)` (cooldown po odrzuceniu przez gracza), `createNegotiation`, `negotiationTable.push`. Dodatkowe miejsca możliwej utraty: czyszczenie stołu przy zmianach stanu wojny (pruneTributeNegotiationsBetween, main.ts ~43604) i wygasanie wpisów.

Kandydaci z dispatchu — status statyczny (bez dowodu z hooka):
- (a) filtr contactedOwners / dipLayer (main.ts ~43058, ~43390): mało prawdopodobne w trwającej wojnie (zbiór trwały); do potwierdzenia hakiem.
- (b) diplomaticContactEstablishedSet przed logiem (main.ts:20765): zależy od tego, czy kontakt został nawiązany modalem; NIEPEWNE, do potwierdzenia hakiem.
- (c) turnsAtWar widziane przez AI (main.ts ~12086 vs ai.ts:6975): możliwa rozbieżność off-by-one względem progu 0,8 przy T=16; do potwierdzenia.
- (d) wojna wymuszona epoki z nieodkrytym graczem: nie badane w tej rundzie.

Wniosek: żadna przyczyna NIE została wskazana z dowodem. Najbardziej wiarygodne kandydatury do sprawdzenia hakiem to (c) oraz cooldown/kolejka po stronie gracza (krok 9). Hipoteza do weryfikacji: w grze dipCmds przy T=16 może nie zawierać bezwarunkowego pokoju przez rozbieżność licznika turnsAtWar (poziom 0,75 zamiast 0,80).

Uwagi procesowe: log `npm ci` zapisano w /tmp/claude-0-npmci.log (poza scratchpadem; do usunięcia przez orkiestratora). Dispatch 00-dispatch.md istnieje tylko na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie na origin/main. Zakres DODATKU (hak + runner + 20 tur x 2 ziarna) jest trudny do wykonania w jednej rundzie; rozważyć podział: B1a = hak i pomiar licznika turnsAtWar oraz dipCmds; B1b = pełny pomiar kandydatów a–d.
