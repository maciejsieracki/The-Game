STATUS: DECISION_REQUIRED
DOMAIN: GAME (testy + jeden wyjątek wiki)
TEMAT: R-WEB-TEST-DEBT-Q14-B
GOAL: Kategoria B (10 testów) + Konnica 98 (wiki i piny) + garnizon min. 1 nie liczy się jako „wręcz”. Bramki zielone.
BAZA: origin/main f96787fb70da4086f9b25487cc4b6c62a2127610 (FALA 892). Worktree detach od tej bazy. Operator HAIKU 5.5, runda 1/5.

ZMIANY/COMMIT: patrz SHA w sekcji DEPLOY/PUSH (commit zawiera allowlistę + ten raport; `git add` tylko ścieżek allowlisty).
Allowlista użyta:
- docs/PORADNIK-GRACZA/57-katalog-jednostek.md: wiersz Konnica, kolumna Moc 49 -> 98 (jedna zmiana; źródło wiki).
- gra/src/data/wikiBundle.json: regeneracja `node tools/bundle-wiki-for-game.cjs`. Zweryfikowane `git diff --word-diff`: JEDYNA zmiana to `[-49-]{+98+}` w wierszu Konnicy. Wiki-S/Wiki-M w docs/encyklopedia/jednostki/konnica.md już mówiły 98 (bez zmiany).
- gra/tools/*-test.cjs (10 plików, patrz tabela). Żadnych zmian w gra/src ani gra/data.

## Wyniki surowe (liczby z wyjścia, po zmianach)

| Test | Baza (przed) | Po Q14-B | Klasyfikacja / przyczyna | Status |
|---|---|---|---|---|
| hud-moc-warstwa-test | 21 PASS / 7 FAIL | 28 PASS / 0 FAIL | STARY-PIN Konnica 49->98 (nominalna), 58,0->116,0 (efektywna = 98*1,20 - armor*0,20); HARNESS: literał `0` -> `ME()` w buildHudState/openDiplomacyAudience/buildPlayerDiploSummary/theirRespekt; sygnatura `buildHudState(ownerId = ME())` | ZIELONY |
| moc-ranking-rozjazd-test | 13 PASS / 6 FAIL | 19 PASS / 0 FAIL | STARY-PIN Konnica 49->98 / 58,0->116,0; HARNESS: callsite #3 i buildEmpireDetailSnap przez ME() | ZIELONY |
| granice-relacja-dyplomatyczna-test | 49 PASS / 3 FAIL | 52 PASS / 0 FAIL | HARNESS/STARY-PIN: `ownerId === 0` -> `isMe(ownerId)`, `civColorFn(0)` -> `civColorFn(ME())`, `getDiploRelation(0,..)` -> `(ME(),..)`, `(a === 0 || b === 0)` -> `isMe(a) || isMe(b)` (ta sama semantyka). Nie BŁĄD-GRY | ZIELONY |
| war-epoch-player-first-main-guard-test | 33 PASS / 2 FAIL | 35 PASS / 0 FAIL | HARNESS: kandydaci wyodrębnieni do `const forcedWarMajorAiSubjects = aiOwnerList.flatMap(...)`, przekazywani jako `candidates: forcedWarMajorAiSubjects` (ta sama lista wszystkich major AI). Mutacja przepięta na nowy wzorzec | ZIELONY |
| march-attack-queue-persist-test | 55 PASS / 2 FAIL | 57 PASS / 0 FAIL | STARY-PIN (przegląd legalności wykonany): (g5) 5 -> 6 wywołań `clearPlannedMarch(u.id,true)` = nowa galąź `ambush` (R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1, jawny rozkaz zasadzki); (g8) 35 -> 36 wystąpień `clearPlayerUnitSelection(` w kodzie = ta sama galąź `ambush`. Obie galąź dodana po ostatniej edycji testu | ZIELONY |
| wojna-wymuszona-parowanie-test | (D w Q13; baza: S2, S7, TypeError) | 47 PASS / 0 FAIL | STARY-PIN wobec R-WEB-ERA-WAR-DEFER-NOT-CANCEL-Q1 r3: Brąz/Żelazo NIE dołącza do pary Kamienia (forced-war-common.ts, krok 4: `pair.era === 'stone' && actor.era !== 'stone' -> continue`). Fixtury S2 i S7: para `stone` -> `bronze`. Scenariusz bez zmiany. NIE BŁĄD-GRY (reguła zamierzona) | ZIELONY |
| ai-player-parity-fixes-test | 41 PASS / 3 FAIL | 44 PASS / 0 FAIL | STARY-PIN wobec decyzji 2026-11-19 (DODATEK 1): trudność NIE wpływa na koszt jednostek (production.ts::unitMoneyCost ignoruje difficulty). Asercje „koszt RÓŻNY" odwrócone na „koszt TAKI SAM" (nie osłabione, odwrócone na obowiązującą regułę). HARNESS: `city.ownerId` -> `unitReplaceCtx(u)->replaceAvailabilityCtxEmpireWide(u.ownerId)` | ZIELONY |
| hotseat-etap6d-podetap-e-source-test | 60 PASS / 17 FAIL | 77 PASS / 0 FAIL | HARNESS: baza „PRZED" była `git show HEAD:` (HEAD = już zmigrowany kod) -> przypięte do rodzica commita migracji `4e07a9aa9^`. PO: 2 cienkie wrappery bez literału fotela (previewNegotiationEntry, collectTurnEvents) zwolnione z wymogu isMe/ME (zero literałów nadal sprawdzane). applyProposalOutcome: niezmienność względem commita migracji rozbita na rodzic vs migracja (późniejsze 230fd049f R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 legalnie zmieniło ciało) | ZIELONY |
| dyplo-bilans-gate-n-e1-reprodukcja-runda2-test | (0a)-(0e)+5 FAIL wg Q13 | 18 PASS / 6 FAIL | (0a) ZIELONY po re-picie 29 -> 30 (aaece58c2 dodał 1 odrzut `pwBalance:-1` w evaluateProposalImpl, NAP trust 30). POZOSTAŁE 6 FAIL = STARY-PIN wobec późniejszych rund: (5-REGRESJA),(5-KONTROLA),(0e): e27418db7 przywróciła KIERUNKOWĄ bramkę pokoju (gracz-autor z pwBalance<0 -> accepted:false, „Brakuje N PW"); test pinuje runda-4 „bez bramki". NIE BŁĄD-GRY (późniejsza decyzja kierunkowa). (6-setup): 4 nowe typy komend bez fixtura (oferuj_miasto_za_pokoj, zada_miasto_za_pokoj, zaproponuj_wymiane_cykliczna, zaproponuj_przemarsz). (1-PRZED),(2-PRZED): reprodukcje sprzed naprawy wymagają przepisania zakresu. NIEZROBIONE w tej rundzie | CZERWONY (STARY-PIN, do przepisania) |
| dyplo-bilans-gate-n-e1-reprodukcja-runda3-test | 10 PASS / 17 FAIL | bez zmian | Nie ruszane w tej rundzie. Kontrole (3c),(4a),(4b) zakładają zamianę argumentów z rundy 3, nadpisaną rundą 4 (e253e64a6) i późniejszą kierunkową bramką (e27418db7). STARY-PIN, do przepisania | CZERWONY (STARY-PIN, nieobjęty) |
| naval-water-access-gate-test | exit 0 (40/0) | exit 0 (40/0) | bez zmian | ZIELONY |
| ai-army-composition-per-civ-test | 341/0 (baza, garnizon liczony jako wręcz) | 331 passed / 10 failed | Decyzja właściciela 2026-11-22 WDROŻONA: licznik wręcz startuje od 0 (garnizon nie wlicza się), próbka = N rekrutacji. Progi tabeli NIETKNIĘTE. Zostają 10 FAIL „min 50% wręcz": D sumer/Kamień 48,3%, sumer/Brąz 48,3%, sumer/Żelazo 48,3%, babilonia/Brąz 48,3%, babilonia/Żelazo 48,3%, asyria/Brąz 46,7%, asyria/Żelazo 46,7%; F: L1/L2/L3 asyria. Asercje ±10 pp przechodzą. To jest pytanie ABC (patrz niżej) | DECYZJA_WŁAŚCICIELA |
| mur-paradoks-test | 29/0 | 29/0 (exit 0) | bez zmian (Konnica 98 już w pinie) | ZIELONY |
| ai-ai-treaty-live-proof-wiring-test | exit 2 „Brak katalogu wyniku: undefined" | exit 2 | Test przyjmuje katalog wyniku jako argv[2] z przebiegu LIVE (ai-ai-treaty-live-proof-wiring-run.cjs, Chrome). Bez przebiegu nie ma wejścia. NIE ZMIERZONO w tej rundzie (nie uruchamiano przebiegu live). Nie jest błędem asercji | NIE_ZMIERZONO |

## Bramki (liczby z surowego wyjścia)
- tsc --noEmit: exit 0
- logic-test: exit 0, ostatnia linia `[213] cityfix ...` (213 wyników OK)
- tech-tree-test: exit 0, `tech-tree-test: 20 pass, 0 fail`
- research-test: exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test: exit 0, 21 linii `[OK]`, 0 `FAIL`
- combat-test: exit 0, `All sanity checks passed.`
- ai-test: exit 0, `ai-test: 297 passed, 0 failed`
- era-war-pairing-alliance-test: exit 0, `19 pass, 0 fail`
- ai-ai-alliance-surcharge-test: exit 0, `RESULT: ALL GREEN (live + mutants detected)`

## Dodatkowe sprawdzenie wpływu (poza allowlistą, nie edytowane)
- weterani-test: exit 0, 79 PASS / 0 FAIL (Konnica nie pinowana na 49).
- unit-context-card-test: exit 0. Linia 152/167 pinuje „Konnica rekrut Moc pola = 49" w komentarzu/asercji, ale asercja przechodzi (nie zmieniana).
- rydwan-konnica-x2-test: exit 1, 4 niezgodności `Rydwan (woły).Surowiec/Utrzymanie surowiec: powinno pozostać "Brąz", jest "Drewno"`. NIE dotyczy Konnicy i NIE jest skutkiem tej rundy (dane Rydwanu nie były zmieniane). Zgłoszone w UWAGACH.

## BLOKADY
- Decyzja właściciela ABC (patrz niżej) przed zamknięciem ai-army-composition-per-civ.
- dyplo-bilans runda2 (6 FAIL) i runda3 (17 FAIL) wymagają przepisania zakresu do obowiązującego stanu (runda 4 + e27418db7). Nie zrobione w tej rundzie. Nie kwalifikuje się jako BŁĄD-GRY.
- ai-ai-treaty-live-proof-wiring: NIE ZMIERZONO (wymaga przebiegu live z Chrome).

## PYTANIE ABC DO WŁAŚCICIELA (decyzja progowa)
Pytanie: po wdrożeniu „garnizon min. 1 nie liczy się jako wręcz" 7 kombinacji (sumer Kamień/Brąz/Żelazo 48,3%; babilonia Brąz/Żelazo 48,3%; asyria Brąz/Żelazo 46,7%) oraz L1–L3 asyria mają udział wręcz poniżej 50% (test „min 50% wręcz"). Opcje:
- A (rekomendacja operatora): próg min 50% liczyć po armii BEZ garnizonu (próbka rekrutacji). Wymaga zmiany progu w tabeli właściciela (decyzja).
- B: próg 50% zostaje po całej armii, z garnizonem; wtedy do testu wraca wliczanie garnizonu jako wręcz (cofnięcie tej rundy dla tej części).
- C: próg 50% zostaje, a zmiana składu AI dla asyrii/sumeru/babilonii (game balance) — osobny temat R-WEB-*, poza tą paczką.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie robione)
1. gra/tools/rydwan-konnica-x2-test.cjs: 4 niezgodności Rydwan (woły) Surowiec „Brąz" vs „Drewno" — kandydat R-WEB-* (dane lub test; nie związane z Konnicą).
2. gra/tools/unit-context-card-test.cjs:152,167: komentarz/asercja „Moc pola = 49" dla Konnicy — po decyzji 98 należy przepiąć (poza allowlistą tej rundy; obecnie przechodzi).
3. Dyplo runda2/runda3 — przepisanie do stanu po e253e64a6 i e27418db7 (bramka kierunkowa pokoju). Osobna runda Operatora (Haiku) z dispatchem zakresowym.
4. ai-ai-treaty-live-proof-wiring — zaplanować przebieg live (Chrome dostępny: /usr/bin/google-chrome) z katalogiem wyniku.

## TESTY (podsumowanie)
- Zielone po rundzie: hud-moc-warstwa, moc-ranking-rozjazd, granice-relacja-dyplomatyczna, war-epoch-player-first-main-guard, march-attack-queue-persist, wojna-wymuszona-parowanie, ai-player-parity-fixes, hotseat-etap6d-podetap-e-source, naval-water-access-gate, mur-paradoks + wszystkie bramki.
- Czerwone z przyczyną: ai-army-composition-per-civ (10 FAIL, DECYZJA), dyplo-bilans runda2 (6 FAIL, STARY-PIN do przepisania), dyplo-bilans runda3 (17 FAIL, STARY-PIN nieobjęty).
- NIE ZMIERZONO: ai-ai-treaty-live-proof-wiring.
- Żadna asercja nie została osłabiona: zmiany to re-pin wartości, zmiana baz porównania (HEAD -> SHA migracji), rozszerzenie dopuszczalnych wzorców (ME()/isMe) i odwrócenie asercji „różny koszt" -> „taki sam" zgodnie z decyzją 2026-11-19.

RUNDY: 1/5
NASTĘPNY KROK: (a) owner ABC na progu min 50% (ai-army); (b) runda 2 Operatora: dyplo-bilans runda2/3 przepisanie do stanu po e27418db7 (osobny dispatch); (c) live ai-ai-treaty-live-proof-wiring jako osobny przebieg.
DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje ani nie integruje; deploy tylko wiki Konnicy po integracji i decyzji orkiestratora).
