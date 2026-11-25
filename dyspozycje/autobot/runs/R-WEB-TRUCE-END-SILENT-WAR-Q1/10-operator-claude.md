STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TRUCE-END-SILENT-WAR-Q1
GOAL: Gracz (ME()) dostaje jeden wpis „Ważne” w warEventLog, gdy rozejm wygasa i wojna wraca bez oferty pokoju; pary AI↔AI bez zmian; logika wojny/rozejmu bez zmian.
BAZA: origin/main 76c0fbc6b55816399ccbe8d6ac5c3240b99e70ee (detached worktree wf_4b1c0733-cd1-1)

## 1. Analiza: kiedy gracz nie widzi powrotu do wojny

Wejście: tickTruceExpiries (gra/src/main.ts ~13212) -> truceEndTickPair (gra/src/game/diplomacy-peace-lock.ts:267), raz na turę dla każdej pary.
Port wojny: gra/src/main.ts:13109 declareWarAfterTruce -> applyDiploEventTracked('wojna_wypowiedziana'). Przed zmianą nie dopisywał wpisu do warEventLog.
truceEndToWarCore (diplomacy-peace-lock.ts:257) wywołuje declareWarAfterTruce tylko, gdy status = 'pokoj'.

Gałęzie:
- A. Brak inicjatora (stare zapisy) lub brak adresata: revert_to_war -> truceEndToWarCore (diplomacy-peace-lock.ts:278-281). CICHE dla gracza będącego stroną pary.
- B. Adresat = gracz: oferta w skrzynce (enqueueOffer, diplomacy-peace-lock.ts:284). Gdy gracz nie odpowie do kolejnej tury: truceEndOfferExpired (:270) -> truceEndToWarCore. CICHE.
- C. Adresat = AI: truceEndAiAccepts (:291) true -> finalizePeace (wpis „Rozejm przeszedł w pokój” w main.ts ~13126, jest). False (siła wojskowa) -> truceEndToWarCore (:294). CICHE.
- D. Gracz odrzuca ofertę pokoju po rozejmie: gra/src/main.ts:22889 truceEndToWar(ME(), p.ownerId). Skutek działania gracza; po zmianie też dostaje wpis (ten sam port).
Pary AI↔AI: wszystkie gałęzie bez wpisu (guard ME()).

Porównanie: logPeaceVazne (gra/src/main.ts ~27029) i finalizePeace (gra/src/main.ts ~13119–13131) dają wpis „Ważne” dla pokoju/rozejmu z graczem. Powrót do wojny po rozejmie nie miał odpowiednika.

## 2. Zmiana (gra/src/main.ts, port declareWarAfterTruce ~13109–13124)

Po setDiploRelation: gdy a === ME() || b === ME(), wpis
  id: truce-war-<tura>-<diploPairKey>, icon ⚔, kind 'enemy', turnCreated turn,
  title: 'Rozejm wygasł, wojna wraca: ' + ownerDiploLabel(other),
  subtitle: 'Bez pokoju stałego po końcu rozejmu (odmowa lub brak zgody)',
  dedup po id, trimWarEventLog().
Wzorzec: mechanizm i styl logPeaceVazne. Port jest jedynym punktem wszystkich gałęzi bez oferty, więc wpis jest w jednym miejscu.
Język: tytuły zapisane wprost po polsku, jak sąsiednie wpisy warEventLog. W gra/src ani gra/data nie ma tabeli i18n dla tych tytułów (grep „Pokój zawarty: ” trafia tylko w main.ts). EN nie dodano: brak konwencji do naśladowania. Do decyzji orkiestratora.
Zero zmian logiki wojny/rozejmu/Wiarygodności; zero zmian dla par AI↔AI.

## 3. Test (gra/tools/truce-end-war-notice-test.cjs)
- Część 1 runtime: truceEndTickPair (esbuild bundle diplomacy-peace-lock.ts) z portem declareWarAfterTruce = ciało wyciągnięte z main.ts. Odmowa AI -> 1 wpis (id truce-war-10-0-1, kind enemy, ikona ⚔); brak inicjatora -> 1 wpis; oferta dla gracza -> 0 wpisów w tym kroku; AI↔AI -> 0; dedup w tej samej turze -> 1.
- Część 2 źródło: guard ME(), id, unshift, trimWarEventLog w bloku main.ts.
- Część 3 mutanty na wyciągniętym ciele: M1 (guard false) -> 0 wpisów (czerwone); M2 (guard true) -> AI↔AI dostaje wpis (czerwone).
- Czerwony po cofnięciu wpisu z main.ts: usunięcie bloku daje brak wpisu i brak id, więc asercje Części 1/2 padają. Nie uruchamiano na zmutowanej kopii main.ts.

## Bramki (liczby z surowego wyjścia, worktree 76c0fbc6b + zmiana)
- npx tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21); archer-slinger 51 OK 0 FAIL; army-multi-select 36/36; full-cost 40 passed 0 failed; multitype-walk 25 OK 0 FAIL; promotion-table PASS
- combat-test: 6/6 pass
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hotseat-etap6d-podetap-e-source-test: 77 PASS, 0 FAIL
- hud-me-literal-zero-test: 150 PASS / 0 FAIL
- bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
- truce/rozejm (niezależne od przeglądarki): diplo-truce-impl 91/0; diplo-truce-n6-saveload PASS; diplo-truce-r1 PASS; diplo-truce-r4-ai PASS; diplo-truce-until-turn 15/0; diplo-rozejm-parity 25/0
- nowy: truce-end-war-notice-test: PASS (wszystkie asercje OK)
- NIE ZMIERZONO (live, wymagają przeglądarki/serwera): diplo-truce-live-test (timeout rc=124), diplo-truce-ai-table-live-test (TimeoutError), diplo-truce-saveload-live-test (FAIL save,load,expire,legacy). Dispatch: diplo-truce live nie wymagany. Nie sprawdzono, czy padają tak samo na bazie.

## BLOKADY
- Brak wizualnej weryfikacji wpisu w panelu „Ważne” w grze — NIE ZMIERZONO.
- EN tłumaczenie tytułu/podtytułu: brak konwencji i18n dla tych wpisów — decyzja orkiestratora.

## RUNDY
1/5 (Operator HAIKU 5.5)

## NASTĘPNY KROK
FC (Sonnet): sprawdzić wpis dla gracza w gałęziach A–D, brak zmian dla AI↔AI, bramki; decyzja o tekście EN.

## UWAGI-DLA-ORKIESTRATORA
- Gracz, który sam odrzuca ofertę (gra/src/main.ts:22889), też dostanie wpis „wojna wraca”. Uznane za zgodne z „każda gałąź bez oferty”; do potwierdzenia przez FC.
- gra/node_modules utworzone przez npm ci do bramek; usunięte po commicie.

DEPLOY/PUSH: NIE WYKONANO
