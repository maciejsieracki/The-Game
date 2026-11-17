# 50 — Final Control (niezależny), R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/render bitwy)
TEMAT: R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1
GOAL: kolor strony bitwy = gracz (niebieski, BATTLE_PLAYER) / przeciwnik (czerwony, BATTLE_ENEMY) niezależnie od roli atakujący/obrońca i strony ekranu.
ZMIANY-COMMIT: kandydat abca05c453dd77352d79bb0196a97cafecfc2e73 (gałąź r-web-playerblue-q1-obrona); potomek bazy 5a26c74bbdff0d0fce768aedaec265c4e5063c9e (git merge-base --is-ancestor: TAK). Diff vs baza: 10 plików (+443/-17): battle/battleScene.ts (+1, defenderIsPlayer l.~8223), battle/endDetails1E.ts, battle/siegeHud1E.ts, main.ts (+1, l.~40082), oblezenie/main.ts (+1, l.49), ui/postBattleSummary.ts (winnerColor l.369-375), tools/battle-player-always-blue-test.cjs, tools/battle-player-always-blue-live-test.cjs, 2 raporty (10, 30). integration_sha = abca05c453dd77352d79bb0196a97cafecfc2e73 (łańcuch operator r1 + obrona r2).

## Werdykt zarzutów
| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | brak żywego Chromium i zrzutów | ODDAL | Własny przebieg live (xvfb, build vite poza repo): 1024x640 oraz 1280x720, atk i def, 12 PASS / 0 FAIL, 8 zrzutów. Obejrzałem 4 zrzuty t4s (atk/def x 2 rozdzielczości): minimapa atk = niebieski po lewej / czerwony po prawej, def = odwrotnie (gracz zawsze niebieski), pasek „Ty / wróg” niebiesko-czerwony. Zrzuty t0 NIE OBEJRZANE. Odcienia modeli 3D nie oceniam wzrokowo (skala); kolor 3D opiera się na _playerControlSide(), potwierdzonym runtime. |
| 2 | test głównie statyczny | ODDAL (uwaga) | Runtime: scena dostaje rolę (deployPlayerSide, _playerControlSide) dla atk i def; mutacja launchera (obrona) dała 2 FAIL. Moje mutacje statyczne (cofnięte, git status czysty): winnerColor porównujące z 'atk' zamiast playerSide -> test pada; siegeHud defenderIsPlayer -> false -> test pada. endDetails1E/siegeHud1E nadal bez uruchomienia DOM (nota). |
| 3 | domyślne 'atk' | ODDAL | Jawne deployPlayerSide: main.ts:36316/37097/39960/40082, oblezenie/main.ts:49, mapFieldBattle.ts:551; main.ts:39521 przekazuje opts z mapFieldBattle (jawna rola). Brak nowych miejsc new BattleScene bez roli. Test D4/D5 pilnuje. |
| 4 | winnerColor wg roli | ODDAL (naprawione w r2) | postBattleSummary.ts:369-375 wg playerSide; mutacja wykryta. |
| 5 | siegeHud „Siły oblężnicze” złoty | ODDAL | Złoty = neutralny nagłówek fazy oblężenia, nie znacznik strony; wiersze garnizonu/muru używają defColor wg gracza. |
| 6 | preBattle isPlayerSide | ODDAL (uwaga) | Gdy ownerId podane (produkcja) kolor wg isMe/ownerId; fallback canRetreat spójny z rolą gracza. Nie zmierzone na żywo. |
| 7 | dług Rust | ODDAL | Wpisany w raporcie obrony r2; powtórzony niżej. |
| 8 | SHA i linie | ODDAL | SHA i linie w tym raporcie i w 30-obrona. |

Brak zarzutów NAPRAW, więc brak FAIL.

## TESTY (surowe wyjście z mojego uruchomienia na abca05c45)
- tsc --noEmit -p tsconfig.json: EXIT=0 (puste wyjście)
- battle-player-always-blue-test: OK (A minimap 4/4, B end-details, C siege HUD, D deployPlayerSide, E sideColor, F verdict)
- live 1024x640: WYNIK 6 PASS / 0 FAIL; live 1280x720: WYNIK 6 PASS / 0 FAIL
- 5 bramek referencyjnych: logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0 (ALL GREEN); unit-replace-test 21/21; combat-test 6/6 (All sanity checks passed). Wszystkie EXIT=0, brak czerwonych, więc porównanie z bazą zbędne.
- battle-side-colors-3d OK; battle-minimap-side-colors OK; battle-tempo-minimap-brand OK; battle-hp-display PASS 7/7; battle-damage-colors 28 PASS / 0 FAIL; map-field-battle 24 ok, 0 fail.
- Mutanty statyczne (ręczne, cofnięte): 2/2 wykryte.

## BLOKADY
Brak blokad technicznych.

## NOTY / UWAGI-DLA-ORKIESTRATORA
1. Allowlista: postBattleSummary.ts (ui/) i oblezenie/main.ts poza literalną allowlistą, ale GOAL dispatchu wprost wymienia „podsumowanie po bitwie”, a zmiany są minimalne (6 linii / 1 linia). Rekomendacja: zaakceptować (rozszerzyć allowlistę ex post).
2. Do wiadomości właściciela: werdykt po bitwie dla wygranej atakującego zmienił się ze starego zielonego (#7ad0a0) na kolor gracza/przeciwnika (niebieski gdy wygrywa gracz, czerwony gdy przeciwnik; remis złoty). Zgodne z regułą „kolor = gracz vs przeciwnik”, ale znika zieleń „zwycięstwa”.
3. NIE ZMIERZONO na żywo: ekran werdyktu po bitwie, „Szczegóły bitwy” (endDetails1E), HUD oblężenia (siegeHud1E) dla obrońcy-gracza, okno przed bitwą; zrzuty t0 nieoglądane; odcień 3D nie oceniony wzrokowo.
4. Obwódki godeł cywilizacji w górnym pasku bitwy są zielone (neutralne), nie niebieskie/czerwone; niewdrożone, ewentualna decyzja ABC właściciela.
5. Dług Rust: REPIN palety stron (BATTLE_PLAYER/ENEMY, werdykt, panel oblężenia). Do sprzątnięcia przez orkiestratora: /tmp/fc-pb1-dist, /tmp/fc-pb1-shots, /tmp/fc-pb1, gra/node_modules w worktree.
6. Możliwe konflikty merge: main.ts (ADDUNIT/AMBUSH-TOAST) i battleScene.ts (1 linia).

RUNDY: FC (3/5 łącznie z operatorem r1 i obroną r2)
NASTĘPNY KROK: integracja orkiestratora abca05c453dd77352d79bb0196a97cafecfc2e73 (merge z main, bramki); READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
