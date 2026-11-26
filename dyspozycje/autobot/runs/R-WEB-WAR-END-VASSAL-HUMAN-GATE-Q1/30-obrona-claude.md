STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1
GOAL: Zbadać, czy wasalizacja kończy wojnę i czy propozycja pokoju między dwoma fotelami ludzkimi podlega bramce 10 tur wojny; klasyfikacja plik:linia z dowodem.
ZMIANY/COMMIT: dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md (poprawiony) + gra/tools/war-end-vassal-human-probe-test.cjs (nowy, probe źródłowy, tylko odczyt) + dyspozycje/autobot/runs/R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1/30-obrona-claude.md (nowy). Zero zmian w gra/src, gra/data, WERSJE.md. Commit: czubek brancha obrony (SHA w polu sha wyniku).
TESTY: Probe `cd gra && node tools/war-end-vassal-human-probe-test.cjs` -> EXIT=0, wynik surowy w §6 analizy (uruchomienie na b2e9c2f2a). Test behawioralny w runtime: NIE ZMIERZONO. tsc: nie uruchamiano (brak zmian kodu gry). git diff --check: patrz wynik na końcu raportu.
BLOKADY: brak blokad technicznych. NIE ZMIERZONO: zachowanie na żywo (modal trybutu w wojnie, HUD hotseat dla pary bez wojny, propozycja pokoju przed 10. turą); cleanup wojen epoki z wasalem (L2); pełna lista wywołań recordAiAiWarPeaceNews.
RUNDY: 2/5 (poprzednio r1 = PASS-WITH-NOTES; werdykt Evaluatora 606b2a26f: 6 zarzutów, ostatni werdykt do obrony)
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje poprawki i nowy probe; następnie Final Control. Decyzje do właściciela w §5 analizy (3 pytania: hotseat 10 tur, pokój bez wojny, cykliczny trybut w wojnie).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (606b2a26f)

Zarzut 1 (brak testu źródłowego/behawioralnego i surowego wyniku): PRZYJMUJĘ. Dodany probe źródłowy `gra/tools/war-end-vassal-human-probe-test.cjs` (odczyt plik:linia, wynik surowy w analizie §6). Probe nie jest testem regresji i nie wymusza wyniku. Test behawioralny w runtime (evaluateProposal / live) nadal NIE ZMIERZONO i jest wpisany jako krok 4 w §4.

Zarzut 2 (trybut_oferta w wojnie: nieistniejąca reguła „tylko jednorazowe”): PRZYJMUJĘ z doprecyzowaniem. Dowód: silnik przepuszcza `trybut_oferta` w wojnie (`diplomacy-proposals.ts:1589-1591`, `diplomacy-war-gates.ts:11`, `:48-56`), gałąź `case 'trybut_oferta'` (`:2191-2221`) nie sprawdza wojny (probe: BRAK). Reguła „tylko jednorazowe” występuje wyłącznie w komentarzu UI (`diplomacy-locks.ts:333`). Doprecyzowanie: koszyk (`diplomacyTradeBasket.ts:1338`) ustawia `goldOnce` w trybie „offer”, więc trafia w jednorazową gałąź (`:2202`). Cykliczny trybut w wojnie wynika ze ścieżki modala (`diplomacyNegotiationModal.ts:425-431`, case `8`: `goldPerTurn` bez `goldOnce`). Klasyfikacja: BŁĄD GRY (kandydat, potwierdzony kod; zamierzoność według komentarza UI; decyzja o regule do właściciela, §5 pyt. 3).

Zarzut 3 (§2.3: „jedyne gałęzie zmieniające relację” nieprecyzyjne): PRZYJMUJĘ. Trybut (`trybut_odmowa` `main.ts:27160`, `trybut_oferta_przyjeta` `main.ts:27355`, `trybut_zaakceptowany` `main.ts:27376`) wołają `setDiploRelation` ze zdarzeniem zaufania/respektu; status się nie zmienia. Status zmienia tylko `finalizePeaceTreatyBetween` (`main.ts:27357`, `:27369`). Wniosek o braku zmiany statusu zostaje, uzasadnienie poprawione.

Zarzut 4 (P21b: BŁĄD GRY vs pytanie o zamierzoność w §5): PRZYJMUJĘ. P21b przeklasyfikowany na „LUKA — kandydat BŁĄD GRY; zamierzoność NIEPOTWIERDZONA” (analiza §1, §3.3). Pytanie §5 jest teraz pytaniem o potwierdzenie.

Zarzut 5 (nierozliczone: countActiveWars*, pendingPrincipal, warTypesForOwner, warWearinessByPairKey, cleanup*ForcedWarOnPeace, „Wydarzenia”, finalizePeaceTreatyBetween dla pary bez wojny): PRZYJMUJĘ — każda pozycja rozliczona dowodem w analizie §2.3–§2.4, §3.4:
- countActiveWarsForOwner (`main.ts:26091`), ...ExcludingBarbarians (`:26107`), warTypesForOwner (`:26120`): tylko odczyt; zakres `applyProposalOutcomeImpl` (27140–27380) ich nie wywołuje (probe/awk: 0 trafień).
- pendingPrincipal: tworzony wyłącznie przy wypowiedzeniu wojny (`main.ts:26296`); ścieżka wasalizacji nie dotyka.
- warWearinessByPairKey: czyszczony w `cleanupRegularWarOnPeace` (`main.ts:12921`) wołanym z `finalizePeaceTreatyBetween` (`:13041`); zapis przez `runWarWearinessTick` (`:40863`); ścieżka wasalizacji nie dotyka.
- cleanup*ForcedWarOnPeace: wołane tylko z `finalizePeaceTreatyBetween` (`:13038`, `:13040`) i `sweepStaleForcedWarEntries` (`:12902`, `:12905`). Wasalizacja tego nie wywołuje.
- „Wydarzenia na świecie”: wpis tworzy `recordAiAiWarPeaceNews` (`main.ts:27094–27122`) przy zmianie statusu prevStatus→nextStatus; wasalizacja/trybut nie zmienia statusu, więc brak wpisu. Pełna lista wywołań NIE ZMIERZONO (analiza §7).
- finalizePeaceTreatyBetween dla pary bez wojny: NIE MA guardu statusu (`main.ts:12957–12969`, probe: BRAK); ustawia `status: 'pokoj'` i blokadę dla dowolnej pary (`main.ts:12988`, `:12996`, `:13021`). Akceptacja hotseat (`main.ts:23057`) wywołuje to bez sprawdzenia wojny. Ta sama sytuacja dla pary AI jest odrzucana (`diplomacy-proposals.ts:1584`, `Pokój — brak trwającej wojny`). Nowy kandydat BŁĄD GRY P21c (analiza §3.4), live NIE ZMIERZONO. To jest skutek dla decyzji właściciela, nie tylko kosmetyka.

Zarzut 6 (drobne: numer linii 23057 vs 23056, §3.2 bez main.ts:27845): PRZYJMUJĘ. Poprawione: akceptacja `zaproponuj_pokoj` = `main.ts:23057` (`finalizePeaceTreatyBetween`), a `main.ts:27845` dodane do §3.2 jako odczyt do renderu (`diploWarStateForRead`), nie bramka.

## Zmiany poza zarzutami (korekty wynikłe z weryfikacji)
- Numery linii poprawione przy weryfikacji: `diplomacy-proposals.ts:1583-1587` (pokój/rozejm bez wojny), `:2217` (pieniadzePerTura w trybut_oferta), `main.ts:12988/12996` (status pokoju w finalize), `main.ts:27376` (trybut_zaakceptowany).
- Dodane kandydaty: P21c (pokój między fotelami bez wojny) i doprecyzowane źródło cyklicznego trybutu (modal, nie koszyk).
- Dodane 3 pytania do właściciela (§5): hotseat 10 tur; pokój bez wojny; cykliczny trybut w wojnie.

## Dyscyplina
- Zero zmian w gra/src, gra/data, WERSJE.md, rust-port/. Brak npm run build/dev. Brak run_in_background. Brak sesji/zadań/triggerów.
- Commit przez `git add <ścieżki>` (nie -A): analiza, probe, raport obrony.

UWAGI-DLA-ORKIESTRATORA:
- P21c (pokój między fotelami bez wojny) jest kandydatem silniejszym niż sama bramka 10 tur. Warto dodać go do pytania ABC razem z P21b, bo to decyzja, czy hotseat w ogóle może zawierać pokój poza wojną.
- Probe `war-end-vassal-human-probe-test.cjs` czyta teksty źródłowe i będzie się rozjeżdżał przy przesunięciu linii w main.ts. Dla regresji po naprawie lepsze są testy behawioralne.
- Kandydat trybut cykliczny w wojnie (P17b) wymaga jednego ABC, czy cykliczny trybut w wojnie ma być dozwolony; inaczej naprawa jest tylko w modalu.
