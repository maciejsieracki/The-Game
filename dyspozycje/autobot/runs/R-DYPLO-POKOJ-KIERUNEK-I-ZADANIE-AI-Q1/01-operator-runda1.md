STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1
GOAL: Część A — bramka bilansu PW dla pokoju KIERUNKOWA (pominięta gdy partner autorem
aktualnych warunków, stosowana gdy gracz autorem). Część B — AI proponujące goły pokój
ma żądać surowców/złota, żeby wyrównać własny bilans do bliskiego zera.

RECON WSTĘPNY (Część B, guard main.ts, wykonany PRZED zmianą payloadu — zgodnie z regułą
przeciw samooszukiwaniu): guard main.ts (dziś ok. linii 15627/15633, `if (!clampedPayload)
return;`) faktycznie odrzuca KAŻDĄ propozycję AI bez giveItems/receiveItems/goldOnce —
potwierdzone, i to WCZEŚNIEJ niż recon zakładał: `clampAiProposalPayloadToRealResources`
(main.ts ok. 9205-9231, `clampNegotiationPayloadToRealResources`) zwraca `null` dla pustego
payloadu JUŻ na wcześniejszym etapie (linia ~9224), więc dzisiejsza „goła" oferta pokoju AI
(`aiCommandToPendingProposal` case 'zaproponuj_pokoj' → `payload:{}`) jest odrzucana i NIGDY
nie trafia na stół negocjacji — bez naprawy tej rundy AI nigdy realnie nie proponuje pokoju.
Twierdzenie właściciela o widzeniu takiej oferty pozostaje niewyjaśnione (inny/starszy stan
gry, poza zakresem tego zlecenia) — udokumentowane w kodzie, nie zamiecione.

ZMIANY/COMMIT: (allowlista, bez `git add -A`)
- gra/src/game/diplomacy-proposals.ts: `ProposalEvalContext.authorOwnerId?` (DYNAMICZNY,
  domyślnie fallback na statyczny `proposerOwnerId` — wsteczna zgodność). `case 'pokoj'`:
  `accepted` gaje TYLKO gdy `authorOwnerId===gracz` i `pokojPwBalance<0`; gdy autorem jest
  partner — `accepted:true` bez zmian (jak runda 4).
- gra/src/main.ts: `previewNegotiationEntry` (~16223) dopisuje `authorOwnerId: entry.authorOwnerId`
  do ctx (jedyny konsument nowego pola). `enqueueNegotiationFromAiCmd`: nowa gałąź
  `zaproponuj_pokoj` licząca `peaceOfferAiRequestPn`/`-Basket`, dopisuje `receiveItems` PRZED
  guardem 9224/15627. Import: `treatyBasePnFromConfig` (diplomacy-proposals),
  `peaceOfferAiRequestPn`/`peaceOfferAiRequestBasket` (diplomacy-ai-offer-balance) — jedyna
  świadoma wycieczka poza linie 15549-15950/16279 (dopisanie do ISTNIEJĄCYCH importów tych
  dwóch modułów, konieczne żeby użyć nowych eksportów w allowlistowanym kodzie).
- gra/src/game/diplomacy-ai-offer-balance.ts: `peaceOfferAiOwnBilans` (reużywa
  `treatyBaseFairnessGap`), `peaceOfferAiRequestPn` (cel: tolerancja jak D-DYPLO-AI-OFERTA-ZERO),
  `peaceOfferAiRequestBasket` (wzorzec `computeQuickDealBasket`: najtańszy priced surowiec
  partnera, fallback złoto). `pnToPaymentAmount` wyeksportowana (była lokalna).
- diplomacyAcceptanceBalance.ts: BEZ ZMIAN — zweryfikowane (test), że generyczna ścieżka
  blockReason (linia 322-325, `responderPreview.accepted===false`) już poprawnie przejmuje
  nowe `accepted:false` z evaluateProposal; wyjątek `uiActionId!=='10'` (linia 366) zostaje
  martwy dla 'own'-negatywnego (blockReason już ustawiony wcześniej) i nadal chroni 'incoming'.
  `oferuj_trybut_za_pokoj` NIETKNIĘTE.
- gra/tools/dyplo-pokoj-kierunek-runda1-test.cjs (nowy, 18/18 PASS).
Commit w worktree: wykonany po tym raporcie.

TESTY:
- `node tools/dyplo-pokoj-kierunek-runda1-test.cjs`: 18 PASS / 0 FAIL. Zawiera KRYTYCZNY
  TEST 3 (kontroferta): partner proponuje (proposerOwnerId=1), gracz kontruje gołym koszykiem
  (authorOwnerId→0, awaitingOwnerId→1, proposerOwnerId NADAL 1) → bramka NAPRAWIONA poprawnie
  blokuje (accepted:false), a KONTROLA NIETAUTOLOGICZNA (mutacja: fallback statyczny zamiast
  dynamicznego authorOwnerId) odtwarza dokładnie błąd z ZASTRZEŻENIA ARCHITEKTONICZNEGO
  (accepted:true mimo ujemnego bilansu) — TEST 3d potwierdza, że oba warianty realnie się
  różnią (nie tautologia). TEST 4: brak `ctx.authorOwnerId` → fallback statyczny, bit-identyczne
  ze stanem sprzed rundy (evaluatePendingFromAI/generateCounterOffer nietknięte).
- `node ./node_modules/typescript/bin/tsc --noEmit`: czysto (exit 0).
- Regresja historyczna (runda2/runda3 P-DYPLO-BILANS-GATE): 3-5 FAIL w każdym pliku —
  WSZYSTKIE to asercje „accepted zawsze true dla gracza-proponenta niezależnie od bilansu"
  (decyzja rundy 4), którą TA runda ŚWIADOMIE i CZĘŚCIOWO odwraca na ECHO właściciela (dispatch
  wprost: „CZĘŚCIOWO odwraca/doprecyzowuje P-DYPLO-BILANS-GATE runda 4"). Sprawdzone, że KAŻDY
  FAIL dotyczy wyłącznie tej jednej asercji (gracz-proponent, kierunek 'own') — brak innych,
  nieoczekiwanych regresji w tych plikach (pozostałe testy w nich, w tym część 'pokoj'
  incoming/AI-proponent, PASS bez zmian). Inne pliki testowe dotknięte tymi samymi modułami
  (dyplo-karta-decyzji-bilans-skrot: 13/13, dyplo-bilans-gate-n-e1-reprodukcja: 22/22) — zielone.

ROZBIEŻNOŚĆ ZE SŁOWNYM PRZYKŁADEM DISPATCHU (Część B, zgłoszona jawnie, nie ukryta):
dispatch sugerował scenariusz testowy „relacja niska" jako przykład bilansu niekorzystnego
dla AI. Matematyka `treatyBaseFairnessGap` (ZWERYFIKOWANA żywym testem regresji rundy 3,
TEST 2: AI daje 300 PW za darmo → pwBalance idzie W GÓRĘ = korzystniej dla GRACZA) daje
odwrotny kierunek: bilans AI jest KORZYSTNY przy niskiej Relacji (AI "wygrywa" na asymetrii
formuły: baza partnera stała 500 vs baza gracza skalowana Relacją) i NIEKORZYSTNY przy
wysokiej/surowej Relacji — patrz komentarz `peaceOfferAiOwnBilans` i TEST 5 (PROOF) w nowym
pliku testowym. Zaimplementowano wg zweryfikowanej matematyki (spójnej z istniejącą bramką
akceptacji), NIE wg dosłownego przykładu — DECISION_REQUIRED tylko jeśli właściciel chce
INNEJ definicji "bilansu AI" niż odwrotność już ustalonego `pokojPwBalance`.

BLOKADY: brak technicznych. Powyższa rozbieżność semantyczna wymaga ewentualnego potwierdzenia
właściciela (nie blokuje merge — matematyka jest spójna i przetestowana).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
