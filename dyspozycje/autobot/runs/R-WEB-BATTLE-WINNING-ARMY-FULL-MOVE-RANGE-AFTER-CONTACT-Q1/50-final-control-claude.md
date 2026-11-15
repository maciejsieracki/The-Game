STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: konnica zwycięskiej armii (AUTO/SKIP, tury 9-16) wykorzystuje >=80% puli ruchu, gdy ma wolną drogę; zatrzask wzwarcia wręcz zdejmuje sufity tempa po zerwaniu kontaktu.
ZMIANY/COMMIT: kandydat bd07227f40953de84bef7836829de16fcd38c249 (potomek b3417d2a7; kod gry identyczny z a7382f5d8 i 1c0f36230 — bd07227f4 dodaje tylko 30-obrona-claude.md). Kod: gra/src/battle/battleScene.ts (+89/-5), narzędzia gra/tools/battle-pace-latch-test.cjs, battle-pursuit-move-behavior-test.cjs, battle-pursuit-pace-{browser-entry.html,browser-entry.ts,measure.cjs}; reszta = runs/<ID>/** (raporty, evidence). INTEGRATION_SHA = bd07227f40953de84bef7836829de16fcd38c249. Dry-run `git merge-tree origin/main bd07227f4` (origin/main = ff090714d): czysty, bez konfliktów (gra/src/battle nie zmieniało się w main od b3417d2a7).
TESTY (własne, surowe wyjście; kod kandydata uruchamiany w drzewie o identycznym gra/ — worktree 1c0f36230 z node_modules; własny worktree bez node_modules, dysk ~22 MB wolnego):
- tsc --noEmit --incremental false: 0 błędów (exit 0)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0 (wszystkie = wartości referencyjne §6; brak czerwonych, więc porównanie baza vs kandydat niepotrzebne)
- battle-pace-latch-test: 5/5 pass, mutacja MELEE_LATCH wykryta (czerwona)
- battle-skip-equals-auto-resolve-test (Chromium, build w /dev/shm): 42 ok, 0 fail (seedy 1,2,3,7: SKIP == AUTO)
- battle-pursuit-move-behavior-test część kodowa (seedy 1,2): T1 arbPathCav=0, T2 pingpong=0, T3 freeRatio=1 (133/133; wszystkie aktywacje 180/448) — 3/3 ok
- mutacja PATH_RESERVE->false: arbPathCav 23, freeRatio 0,236 (T1 czerwony, wykryta); mutacja CAV_TRAIL->false: pingpong 24 (T2 czerwony, wykryta)
- git diff --check: czysty (zapis tylko tego raportu). Pełny pomiar macierzy s1-s3 watch+skip w Chromium: NIE_ZMIERZONO samodzielnie (macierz r3 z evidence Operatora przyjęta, nie odtworzona).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. DO DECYZJI CZŁOWIEKA — konnica 35,7/44,6/17,3% puli (s1/s2/s3) wynika w reszcie z reguły ciosu (blow_stop, wariant A/B/C) — zmiana reguły produktowej, poprawnie niewdrożona; temat nie jest „w pełni naprawiony”: wdrożona jest część błędowa (kolizje/ping-pong/zatrzask), ABC dla ciosu czeka na właściciela.
2. ODDAL — T3 słaby w s3 (7 MP wolnej drogi); T1/T2 mają niezależne mutacje CZERWONE na realnej ścieżce planera; zalecane (nieblokujące) rozszerzenie o seed 3 i asercję watch.
3. ODDAL — T3 samoreferencyjny; mutację CAV_TRAIL łapie T2, PATH_RESERVE łapie T1 i T3 (potwierdzone powyżej).
4. ODDAL / NIE ZMIERZONO — 10 MP other_end konnicy s3: residuum nieproduktowe bez przyczyny; zostaje w UWAGACH.
5. DO DECYZJI CZŁOWIEKA — piechota/łucznicy tracą ruch przez arbitraż „ucięcie na kolizji” (szyk W19); celowo niezmienione, osobny temat/ABC (GOAL dotyczy konnicy).
6. ODDAL — rozjazd watch vs skip s1 istniał przed zmianą (wg Operatora); bramka SKIP==AUTO 42/0 zielona.
7. ODDAL — marker `if (/*PATH_RESERVE*/ true)` i znaczniki mutacji w kodzie: higiena, nie błąd; usunięcie wymaga zmiany testu (drobny osobny temat).
8. ODDAL — pomiar przed/po nieporównywalny wprost; po stronie kodu zweryfikowano mutacje i wartości po zmianie.
9. ODDAL — dysk to ograniczenie środowiska; nazwa battle-pursuit-move-behavior-test.cjs poza dosłownym wzorcem allowlisty to uchybienie formalne (test w gra/tools, dotyczy tematu); evidence ok. 42 tys. linii JSON — przy integracji preferować .gz lub pominąć pp-scen*.json.
Brak zarzutu NAPRAW => nie FAIL.
BLOKADY: brak blokujących. Ograniczenie: dysk ~22 MB wolnego (wymagane >=6 GB) — testy uruchomiono w istniejącym worktree z node_modules i /dev/shm.
RUNDY: FC 3/5 (r3); Evaluator zarzuty 1-9; Obrona BLOCK (dysk).
UWAGI-DLA-ORKIESTRATORA: (a) ABC dla ciosu konnicy (A cios / B przejście na sąsiedni hex / C bez zmian) — prototyp A daje 27-55% puli, więc >=80% wymaga decyzji; (b) osobny temat: piechota/łucznicy other_end (arbitraż kolizji); (c) REPIN Rust: zatrzask melee_latched (ustawiany raz przy pierwszym kontakcie wręcz, reset w _startBattle/reset sceny) zdejmujący _paceCapFor i _lineAdvanceCap + przeplanowanie ucięć konnicy z rezerwacją pól + cavTrail (koniec ping-pongu); (d) integrować na aktualny origin/main (ff090714d) — merge czysty; (e) bramki po integracji wg procedury orkiestratora.
NASTĘPNY KROK: integracja orkiestratora bd07227f4 -> main, ABC właściciela o ciosie konnicy, REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
