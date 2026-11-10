STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1
RUNDA: 2/5 (Operator - obrona; odtworzono stan z 1514c239)

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE. Dok. §2 legenda + wiersz `getForestBuildBlockReason` = `PORTOWANY (cz.)` (6/8 wariantow w wektorze, 2 martwe galezie jawnie), §7 NIE_ZMIERZONO uzupelnione.
2. PRZYJMUJE. §5 przepisany: wektor = zachowanie weba (zmierzone); zamiarowosc = komentarz `improvement-build.ts:744-746` (zacytowany); kanon = decyzja orkiestratora (P6-25 §2 pkt 9).
3. ODRZUCAM. `verify-m16-vectors.py:55` asertuje sygnature, a `:56` regexem asertuje cialo: `re.search(r"hasBlockingDepositForFarm\(_hex: HexWithZloze\): boolean \{\s*return false;", S)` - stala `False` (:669) JEST zakotwiczona. Dok. §1 doprecyzowany numerami linii.
4. PRZYJMUJE (uzasadnienie). §7: kryterium podzialu = "wolane przez cos innego niz listTypes" (getImprovementMeta :1454/:1511/:1528, isImprovementTechUnlocked :1509 -> lokalnie; getImprovementLockHint tylko :1498 -> RUNDA-2); literaly `'Brak heksów w twoim terytorium'` (:1486) i fallback `'Brak lasu...'` (:1485) wymienione jako zalezne od listTypes.
5. PRZYJMUJE. §6: 50 zdefiniowanych, 2 odrzucone po fakcie jako rownowazne (powody a/b), 48 = lista po usunieciu; zaznaczone, ze ocena rownowaznosci jest decyzja Operatora.
6. (notatka, ale wykonane) Weryfikator: 4 nowe sprawdzenia `tab.teksty.*` tekstow tabeli z kodem weba.
7. PRZYJMUJE. `gen-m16-vectors.mjs`: `getQualifyingHexes` dla KAZDEGO klucza w KAZDYM stanie (chance() zachowane -> strumien RNG bez zmian; rules/gallery bajt-w-bajt jak R1; qualifier.json: stare `qualifying` podzbiorem nowych, reszta identyczna). Test `api_qualifying_hexes_and_work_cost_match_web` bez warunku `is_some()`, asercja `checked == stany x klucze`.
8. Notatka - bez zmian (odstepstwo `ulepszenia-budowa.json` jawne; do akceptacji orkiestratora).
9. Notatka - bez zmian (§5 pkt 1-4 do decyzji orkiestratora).

TESTY (surowe pelne logi z EXIT=): gen-m16-r2.log (EXIT=0), verify-m16-r2.log (checks=138335 rozbieznosci=0, EXIT=0), gate-fmt-r2.log (EXIT=0), gate-clippy-r2.log (EXIT=0), gate-test-r2.log (EXIT=0, 702 passed / 0 failed).
Mutacje: nie powtarzano (zmiana wektorow tylko addytywna).
DEPLOY/PUSH: NIE WYKONANO
