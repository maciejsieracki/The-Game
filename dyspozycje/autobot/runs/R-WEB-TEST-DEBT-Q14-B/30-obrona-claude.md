STATUS: BLOCK
DOMAIN: GAME (testy; bez zmian w gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q14-B
GOAL: Odpowiedź na 7 zarzutów Evaluatora (49542f4ce) do kandydata 6f9736f32. Bez osłabiania asercji. Pozycje nie domknięte zaznaczone wprost.
BAZA: kandydat 6f9736f32f029bce8138c71ee5fdc340fba871c7 (detach). Runda 2/5. Operator HAIKU 5.5.

ZMIANY/COMMIT (allowlista, git add ścieżkami):
- gra/tools/wojna-wymuszona-parowanie-test.cjs: DODANA asercja negatywna S2-NEG (Brąz nie dołącza do pary Kamienia; strony pary nie wskazują leftovera). Dotychczasowe asercje bez zmian.
- gra/tools/ai-player-parity-fixes-test.cjs: DODANY kontrast czuły: unitProductionItem tempo 'wysoki' vs 'niski' ZMIENIA koszt. Asercje o koszcie bez zmian.
- gra/tools/hud-moc-warstwa-test.cjs: wzorce zawężone do ME() (usunięte alternatywy z literałem 0); dwa checki teraz CZERWONE, patrz zarzut 5.
- gra/tools/granice-relacja-dyplomatyczna-test.cjs: wzorzec `(a === 0 || b === 0)` usunięty, zostaje tylko `isMe(a) || isMe(b)`.
- gra/tools/hotseat-etap6d-podetap-e-source-test.cjs: wyjątek wrapperów wymaga teraz delegacji do ...Impl/...Uncached (regex na ciele), zamiast samej nazwy z listy.
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-B/30-obrona-claude.md (ten raport).
- Brak zmian w gra/src, gra/data, wiki, docs. Nie uruchamiano npm run build w gra/. npm ci wykonano w worktree (node_modules do usunięcia po bramkach).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ, NIE DOKOŃCZONE w tej rundzie: dyplo-bilans-runda2 pozostaje 18 PASS / 6 FAIL. Przyczyna (zweryfikowana): e27418db7 przywróciło KIERUNKOWĄ bramkę pokoju (gracz-autor z pwBalance<0 -> accepted:false, "Brakuje N PW"), pomijaną gdy autorem jest partner (AI). Checki (5-REGRESJA/PLAYER) i (5-KONTROLA/PLAYER) pinują stan z e253e64a6 (bez bramki w obu kierunkach) i wymagają re-pinu do reguły kierunkowej. (0e) oczekuje 2, kod daje 1. (6-setup): brak fixtur dla 4 typów komend z ai.ts (oferuj_miasto_za_pokoj, zada_miasto_za_pokoj, zaproponuj_wymiane_cykliczna, zaproponuj_przemarsz), do dopisania (test-only). (1-PRZED), (2-PRZED): dowody błędu rundy 2 nie są odtwarzalne na kodzie bieżącym, do przepisania jako pin historyczny albo usunięcia z jawnym uzasadnieniem. Wymaga osobnej rundy.
2. PRZYJMUJĘ, NIE RUSZANE w tej rundzie: dyplo-bilans-runda3 = "=== PODSUMOWANIE: 10 PASS / 17 FAIL ===" (surowe). Diagnoza: needle mutacji (FIXED_NEEDLE, PRE_R4_BLOCK, pluginSwap) są zakotwiczone w kodzie sprzed e253e64a6/e27418db7 i nie pasują do bieżącego diplomacy-proposals.ts (case 'pokoj', ok. linii 2051-2117), więc (0a) daje applied != 2. Oczekiwane pwBalance (-450/+450/+50) dryfowały (bieżąco -554/+554/0 przy tej samej relacji). Check (3b) oczekuje accepted=true dla gracza-autora, a kod po e27418db7 zwraca false. Wymaga osobnego, zakresowego dispatchu Operatora.
3. PRZYJMUJĘ I ZROBIONE: ai-player-parity dostał kontrast czuły (tempo niski vs wysoki ZMIENIA koszt, PASS). Wynik: 45 passed, 0 failed. Równość per trudność jest teraz informatywna.
4. PRZYJMUJĘ: ai-army-composition-per-civ pozostaje DECYZJA_WŁAŚCICIELA (10 FAIL "min 50% wręcz": sumer 48,3%, babilonia 48,3%, asyria 46,7%, L1-L3 asyria). Operator nie rozstrzyga progu. Bez zmian w kodzie testu. Pytanie ABC: patrz 10-operator-claude.md (runda 1), opcje A/B/C bez zmian.
5. PRZYJMUJĘ I ZROBIONE: wzorce poluzowane usunięte.
   - hud-moc-warstwa: tylko ME(). WYNIK: 26 PASS / 2 FAIL. To ujawnia pozostałości literału 0 w kodzie gry: main.ts:24044 (buildHudState: objectivePowerForOwnerEffective(0)) i main.ts:3140 (objectiveRespektPctTowardEffective: objectivePowerForOwnerEffective(0)). Kandydat BŁĄD-GRY (semantycznie neutralne w grze 1-graczowej, ME()=0). Kodu gry NIE poprawiano (zakaz). Test NIE osłabiony.
   - granice-relacja: tylko isMe(a) || isMe(b). WYNIK: 52 passed, 0 failed.
   - hotseat-etap6d: wrapper zwolniony tylko gdy ciało zawiera ...Impl/...Uncached (regex \b\w+(?:Impl|Uncached)\b). Potwierdzone w main.ts: previewNegotiationEntry -> previewNegotiationEntryImpl; collectTurnEvents -> collectTurnEventsUncached. WYNIK: 77 PASS / 0 FAIL.
6. PRZYJMUJĘ I ZBADANE: ai-ai-treaty-live-proof-wiring wykonano w przebiegu LIVE (poniżej). WYNIK: 3 OK / 1 FAIL.
   - Przebieg: ai-ai-treaty-live-proof-wiring-run.cjs, Chromium /usr/bin/google-chrome, bundle vite zbudowany poza repo (scratchpad .../scratchpad/q14b-live/dist), ziarno 4242, 60 tur. Wznowienie ze slotu dwukrotnie padło SIGSEGV w openGame, więc wykonano ŚWIEŻY przebieg (resumed=false), który się zakończył. Wyjście: .../scratchpad/q14b-live/out2/seed4242.{jsonl,wiring.log,events.log,summary.json}. Runner: endTurn=60, wallSec=246, counters: gateActiveTurns 1, bypassApplied 1, battlesAuto 0, modal closed 0/0/0.
   - Analizator (node tools/ai-ai-treaty-live-proof-wiring-test.cjs <out2> 4242): A1 OK (59 wierszy). A2 OK (min skarbiec 0, tura 2, owner 22, negCount 0). A3 FAIL: nap=0, dopl=2, napD=[]. A4 OK (0 pageerror/crash).
   - Interpretacja (zmierzona): w 60 turach tor zapisał 0 linii "Pakt o nieagresji" (NAP), ale 2 linie "Sojusz ... (pełny, bezterminowy), dopłata 966 ¤ od Celtowie(13)" i "dopłata 431 ¤ od Fenicjanie(22)", oraz 59 linii "Umowa Handlowa". Asercja A3 szuka NAP z dopłatą. Tor zawiera dopłatę D przy SOJUSZACH. Rozstrzygnięcie: albo A3 jest STARY-PIN (powinna objąć sojusz z dopłatą D), albo tor NAP AI↔AI nie zawiera się w 60 turach (BŁĄD-GRY albo decyzja, otwarte w KOLEJKA: "tor NAP AI↔AI"). Operator NIE zmienia A3 bez decyzji właściciela. Status: CZERWONY, DECYZJA_WYMAGANA.
7. PRZYJMUJĘ I ZROBIONE: wojna-wymuszona dostała S2-NEG (dwie asercje negatywne, para 'stone', leftover 'bronze'). WYNIK: PASSED 49 / FAILED 0 (przed: 47/0). Mutacji kodu NIE pokazano (NIE ZMIERZONO).

BRAMKI:
- Ponownie uruchomione testy z allowlisty: hud-moc-warstwa 26/2 (czerwone, BŁĄD-GRY kandydat); granice 52/0; hotseat 77/0; wojna-wymuszona 49/0; ai-player-parity 45/0.
- NIE PONOWIONO (brak zmian w gra/src): tsc, logic-test, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing, ai-ai-alliance-surcharge. Wynik rundy 1 dla kodu gry nadal obowiązuje, ponowny pomiar NIE ZMIERZONO w tej rundzie.
- dyplo-runda2 18/6, dyplo-runda3 10/17, ai-army 331/10: bez zmian (zarzuty 1, 2, 4).

BLOKADY:
- dyplo-bilans runda2 (6 FAIL) i runda3 (17 FAIL): wymagają przepisania (zarzuty 1, 2). Nie zrobione w tej rundzie.
- ai-army-composition-per-civ: DECYZJA_WŁAŚCICIELA (zarzut 4).
- ai-ai-treaty-live-proof-wiring: A3 czerwone, DECYZJA_WYMAGANA (sojusz z dopłatą vs NAP), zarzut 6.
- hud-moc-warstwa: 2 checki czerwone = BŁĄD-GRY kandydat (literał 0 w main.ts:24044 i :3140).

UWAGI-DLA-ORKIESTRATORA:
1. BŁĄD-GRY kandydat (drobny): main.ts:3140 (objectiveRespektPctTowardEffective) i main.ts:24044 (buildHudState) nadal używają literału 0 zamiast ME(). Pozostałość migracji. Kandydat R-WEB-HUD-ME-MIGRATION-Q1 (2 linie w gra/src, decyzja orkiestratora).
2. Decyzja dla właściciela (ABC): tor AI↔AI. Czy NAP ma się zawierać w 60 turach (ziarno 4242: 0 NAP, 2 sojusze z dopłatą D)? Bez tego nie wiadomo, czy A3 to stary pin, czy błąd gry.
3. Wznowienie przebiegu live ze slotu -> SIGSEGV Chromium w openGame (dwukrotnie). Kandydat do osobnego tematu harness (CHROMEHELPER).
4. Dyplo runda2/3: osobny dispatch zakresowy (Operator Haiku, kolejna runda tego tematu lub nowe ID).
5. Poza zakresem: rydwan-konnica-x2-test i unit-context-card-test (z raportu rundy 1) bez zmian.

TESTY (surowe wyniki tej rundy):
- wojna-wymuszona-parowanie-test: "PASSED: 49 / FAILED: 0 / TOTAL: 49", ALL GREEN, exit 0
- ai-player-parity-fixes-test: "45 passed, 0 failed", exit 0
- granice-relacja-dyplomatyczna-test: "52 passed, 0 failed", exit 0
- hotseat-etap6d-podetap-e-source-test: "77 PASS, 0 FAIL", exit 0
- hud-moc-warstwa-test: "WYNIK: 26 PASS, 2 FAIL", exit 1 (BŁĄD-GRY kandydat)
- ai-ai-treaty-live-proof-wiring-test (live, świeży przebieg): "3 OK / 1 FAIL", exit 1 (A3)

RUNDY: 2/5 (po tej rundzie zarzuty 1, 2, 4, 6 otwarte)
NASTĘPNY KROK: (a) owner: ABC o A3 (NAP vs sojusz z dopłatą) i o progu ai-army; (b) Operator (Haiku, runda 3): dyplo-runda2/3 re-pin do reguły e27418db7 + mutacje na bieżących needle; (c) Evaluator rundy 3 po (b).
DEPLOY/PUSH: NIE WYKONANO
