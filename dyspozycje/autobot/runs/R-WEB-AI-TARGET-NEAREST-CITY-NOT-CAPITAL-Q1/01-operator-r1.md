STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1
GOAL: AI w wojnie z GRACZEM (jak z inną AI) idzie na NAJBLIŻSZE miasto wroga, nie na stolicę. Stolica jest celem tylko gdy jest najbliższym (lub jedynym) miastem. Barbarzyńcy jako atakujący bez zmian.
RUNDA: 1/5 (baza origin/main 8dad78b3a)

ZMIANY/COMMIT: (SHA w wiadomości commita, patrz git log)
- gra/src/game/ai-war-target-select.ts: `isNearestCityWarPair` = `!isHuman(self) && !isBarbarian(self) && !isBarbarian(target)` (wcześniej wymagało też `!isHuman(target)`). Komentarze nagłówka zaktualizowane.
- gra/src/game/warAllInCapital.ts: tylko komentarz nagłówka (gracz = cel, wszystkie miasta gdy atakuje AI).
- gra/src/main.ts: tylko komentarz przy `buildWarCityTargets` w warAllInContextFor (~33437). Logika wywołania bez zmian.
- gra/tools/ai-war-nearest-city-peace-2t-test.cjs: asercja A5 ZMIENIONA świadomie: "gracz jako cel: tylko stolica" -> "wszystkie miasta gracza". Uzasadnienie: nowa decyzja właściciela 2026-11-08. Mutacja "cel tylko stolica" nadal zabija (16/16).
- NOWE gra/tools/ai-target-nearest-city-test.cjs (12 asercji, patrz TESTY).
- NOWE dyspozycje/autobot/runs/R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1/ (ten raport, gate-tsc.txt, gate-nowy-test-na-bazie-red.txt).

TABELA "plik:linia -> co wybiera cel"
| Miejsce | PRZED | PO |
|---|---|---|
| ai-war-target-select.ts:45 isNearestCityWarPair | tylko AI<->AI | AI->AI i AI->GRACZ |
| ai-war-target-select.ts:53-65 buildWarCityTargets | AI->gracz: 1 cel = stolica (`capitalCityIdForOwner`) | AI->gracz: wszystkie miasta gracza (planer wybiera najbliższe) |
| main.ts:33442 warAllInContextFor | wywołuje buildWarCityTargets | bez zmian wywołania |
| warAllInCapital.ts planWarAllInCapital/nearestTarget (~420, ~758) | wybiera najbliższy z listy | bez zmian |
| ai.ts:4386 applyWarAllInCapitalToCommands (4568, 4717) | konsumuje targets | bez zmian |
| barbarians.ts:1860 | barbarzyńca -> stolica | bez zmian (barbarzyńca atakujący poza zasadą) |
| ai-war-home-defense (S1/S2/S3, FALA 551) | obrona domu | bez zmian (priorytet obrony nietknięty) |
| main.ts wymuszona wojna epoki (~28063, filtr oid>0) | wybór najbliższej AI | bez zmian (gracz nigdy nie jest celem tej ścieżki) |

Pytanie (c) z dispatchu: w REJESTRZE nie ma wprost decyzji właściciela wykluczającej gracza. Wykluczenie "gracz bez zmian" pochodzi z raportu Operatora R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (01-operator-r1.md, linia 7, zakres tematu), a decyzja właściciela 2026-11-03 mówiła "cel = najbliższe miasto" bez wyjątku dla gracza. Dzisiejsze zgłoszenie właściciela wprost obejmuje gracza, więc założono zgodę i NIE zgłoszono DECISION_REQUIRED.

TESTY (wyniki zmierzone w tym worktree, po zmianie):
- tsc --noEmit: EXIT 0 (gate-tsc.txt)
- logic-test: LOGIC OK 213/213
- ai-test: 289 passed, 0 failed
- ai-defend-recapture-attack-priority-test: 55 passed, 0 failed
- ai-war-defend-home-test: 30 passed, 0 failed
- ai-war-gate-test: 24 passed, 0 failed
- ai-war-nearest-city-peace-2t-test: ZESTAW 40/40, MUTACJE 16/16 zabite, WYNIK PASS
- war-allin-keep-barb-defense-test: 8/0; war-allin-general-path-barb-defense-test: 24/0
- war-allin-capital-regress: NIEZIELONE 0; war-allin-capital-scenarios: exit 0; war-allin-capital-quick: exit 0
- ai-target-nearest-city-test (NOWY): 12/12 PASS. Na BAZIE (stary ai-war-target-select.ts): 8/12, FAIL P1, P2, P5, R3 (czerwone, gate-nowy-test-na-bazie-red.txt).
- war-allin-capital-test: 96 passed, 2 failed (6b aiVsAi, 6b noLandPath: hash flagi OFF). IDENTYCZNE na bazie 8dad78b3a (sprawdzone: ten sam wynik bez zmian). NIE regresja tego tematu, ale dług sprzed tematu.
- Nie wykonano: npm run build/dev (zakaz), pełne symulacje gry/ live w przeglądarce (NIE_ZMIERZONO w tej rundzie; wizualnie nic nie zmieniono).

BLOKADY: brak. Notatka: 6b hash flagi OFF (war-allin-capital-test) był czerwony już na bazie, poza zakresem tego tematu.

RUNDY: 1/5. Ostatni werdykt: brak (Operator).
NASTĘPNY KROK: Obrona (jeśli wymagana) -> Evaluator (Sonnet) -> Final Control (Sonnet) na commicie operatora; sprawdzić, że ai-target-nearest-city-test jest w allowliście FC.
DEPLOY/PUSH: NIE WYKONANO
