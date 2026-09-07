STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1
GOAL: Część A — bramka bilansu PW dla pokoju KIERUNKOWA (pominięta gdy partner autorem
aktualnych warunków, stosowana gdy gracz autorem). Część B — AI proponujące goły pokój ma
żądać surowców/złota, żeby wyrównać własny bilans do bliskiego zera.

ZMIANY/COMMIT: worktree `/home/user/wt-dyplo-pokoj-kierunek-zadanie`, HEAD `2988b9c2`
(Obrona) na commicie kodu `a87dae62` (Operator) + `8fe057c5` (Evaluator, dokumentacja).
`git diff --stat 3f7c68e3..HEAD` (potwierdzone SAMODZIELNIE): `diplomacy-proposals.ts`
(+39/-0), `diplomacy-ai-offer-balance.ts` (+98/-3), `main.ts` (+52/-4),
`gra/tools/dyplo-pokoj-kierunek-runda1-test.cjs` (nowy, 313 linii) + 3 raporty MD — zero
plików poza allowlistą, `diplomacyAcceptanceBalance.ts` i `ai.ts` faktycznie NIETKNIĘTE
(zweryfikowane pustym diffem). `git diff --check` czysty.

TESTY (wszystkie uruchomione SAMODZIELNIE w tej rundzie, nie przejęte z raportów):
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0.
- `node tools/dyplo-pokoj-kierunek-runda1-test.cjs` → 18/18 PASS, potwierdzone.
- `dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs` → 21/3 (zgodne), `-runda3-test.cjs`
  → 22/5 (zgodne), `-test.cjs` (bez numeru) → 22/0, `dyplo-karta-decyzji-bilans-skrot-test.cjs`
  → 13/13 — wszystkie zgodne z raportami Operatora/Evaluatora.
- (a) `git fetch origin main` + `git worktree add --detach` na `origin/main` (HEAD
  `f029ffbf`, 9 commitów przed niniejszą gałęzią) + `git apply --3way --check` na REALNYM,
  aktualnym `origin/main` (nie tylko `merge-tree`) dla diffu tematu → APLIKUJE SIĘ CZYSTO,
  zero konfliktów, wszystkie 3 pliki „Applied patch ... cleanly". Dodatkowo: jedyny z 9
  commitów `origin/main` dotykający pliku współdzielonego z allowlistą tego tematu to
  `22aea4fc` (`R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1`) — zmienia WYŁĄCZNIE
  `diplomacy-acceptance-points.ts` (2 linie, `relCurrent` w etykiecie UI), plik spoza
  allowlisty tego tematu i NIEUŻYWANY przez diff tego tematu. Pozostałe 8 commitów zmienia
  wyłącznie `main.ts` w liniach ok. 201-1495 i 13413-27219 (import/interfejsy/city-capture) —
  z dala od dotkniętych tu obszarów (9209-9243, 15599-15635, 16263-16276) — zero nakładania.
- (b) Test 3 (kontroferta) przeliczony ręcznie: relacja zła → relTotal=10 (raw i wojenny
  clamp identyczne, bo 10<29=WAR_RELATION_SCORE_CAP); `proposerIsPlayer` (statyczne,
  proposerOwnerId=1≠0)=false → gap liczony gałęzią AI-proponenta z SUROWYM `relationTotal`;
  `effectiveTreatyPnRequired(500,10)`=round(500×0,10)=50; `partnerTreatyPnRequired(500)`=500;
  gap=500−50=450 → `pokojPwBalance`=−450. Osobno: `authorOwnerId = ctx.authorOwnerId ??
  proposerOwnerId` = 0 (ctx.authorOwnerId=0, `??` NIE reaguje na 0 jak na falsy — poprawnie
  DYNAMICZNY) → `authorIsPlayer`=(0===0)=true → `accepted:false`. Z mutacją kontrolną
  (fallback wyłącznie `proposerOwnerId`=1) → `authorIsPlayer`=(1===0)=false →
  `accepted:true` mimo TEGO SAMEGO ujemnego bilansu. Liczby i logika ZGODNE z testem i z
  raportem Evaluatora — POTWIERDZONE niezależnym przeliczeniem, nie samym „test przechodzi".
  Dodatkowo sprawdzone: `previewIncomingPlayerAccept`/`usesIncomingPlayerNetPwGate`
  (`diplomacy-acceptance-points.ts:621-629`) NIE zawiera `'pokoj'` w `INCOMING_NET_PW_ACTIONS`
  — więc dla incoming `pokoj` wczesna ścieżka zawsze zwraca `null` i realnie zawsze spada do
  nowej bramki `evaluateProposal` w `previewNegotiationEntry` — brak ukrytego omijania nowej
  logiki dla scenariusza incoming.
- (c) CZĘŚĆ B — zbadane SAMODZIELNIE, bez ufania dispatchowi ani raportowi Operatora: ręcznie
  przeliczone `peaceOfferAiOwnBilans` = `treatyBaseFairnessGap(basePn, aiGivePn, aiReceivePn,
  relTotal)` — DOKŁADNIE ta sama funkcja/gałąź (`!proposerIsPlayer`, surowy `relationTotal`,
  NIE wojenny clamp), którą `evaluateProposal` już i tak policzy dla TEJ SAMEJ propozycji (AI
  jako proponent) — potwierdzone czytaniem obu miejsc, nie założeniem. Przeliczenie: niska
  relacja (zła, 5/5, relTotal=10) → `effectiveTreatyPnRequired(500,10)`=50 <
  `partnerTreatyPnRequired(500)`=500 → gap=+450 → bilans AI DODATNI (korzystny dla AI, NIC do
  dopisania). Wysoka/surowa relacja (95/95, relTotal RAW=190, BEZ `clampRelationForWar`) →
  `effectiveTreatyPnRequired(500,190)`=round(500×1,90)=950 > 500 → gap=−450 → bilans AI
  UJEMNY (niekorzystny, wymaga kompensacji). Obie liczby wyszły mi RĘCZNIE identyczne z
  wynikiem testu (450/−450) — kierunek „niska relacja = korzystna dla AI, wysoka/surowa =
  niekorzystna dla AI" jest MATEMATYCZNIE POPRAWNY względem już wcześniej ECHO'wanej (rundy
  2-4 P-DYPLO-BILANS-GATE), NIETKNIĘTEJ tą rundą matematyki `treatyBaseFairnessGap` —
  odwrotny niż dosłowny przykład dispatchu ("relacja niska"), ale ZGODNY z tym, co silnik i
  tak realnie policzy. Zweryfikowałem też okablowanie w `main.ts` (linia ok. 15620):
  `relationTotal(relForPeace)` — RAW, nie `treatyEvalRelationTotal` — zgodne z gałęzią, którą
  mirror'uje. `peaceOfferAiRequestPn` poprawnie zwraca >0 WYŁĄCZNIE gdy bilans < −tolerancja
  (test 6/7 + ręczne przeliczenie potwierdzają). WNIOSEK: mechanizm Części B NIE działa w
  niewłaściwym kierunku — żąda kompensacji dokładnie w sytuacji, która jest REALNIE
  niekorzystna dla AI wg tej samej matematyki, którą i tak zastosuje bramka akceptacji. NIE
  otwieram nowego zarzutu 3 — nie ma podstawy technicznej (mechanizm jest samospójny i
  poprawnie skierowany względem istniejącej, ECHO'wanej formuły). Jest to WYŁĄCZNIE
  rozbieżność semantyczna między słownym przykładem właściciela w dispatchu a matematyką,
  już jawnie zgłoszona przez Operatora i Evaluatora — nieblokująca, ewentualne
  DECISION_REQUIRED tylko jeśli właściciel chce innej definicji „bilansu AI".
  OBSERWACJA POZA ZAKRESEM (nie zarzut, nie blokuje): sama formuła `treatyBaseFairnessGap`
  przypisuje rabat Relacji („gracz @ Relacji") stronie PROPONENTA niezależnie od tego, czy
  proponentem jest faktycznie gracz czy AI (asymetria opisana i świadomie zaakceptowana w
  komentarzach rund 2-3 P-DYPLO-BILANS-GATE, NIETKNIĘTA przez ten temat) — to sprawia, że
  kierunek „wysoka relacja szkodzi AI-proponentowi" bywa nieintuicyjny narracyjnie. Nie
  naprawiać przy okazji tego tematu bez nowego ECHO — poza allowlistą i poza GOAL tej rundy.
- (d) Regresja historyczna: KAŻDY z 3 FAIL rundy 2 i 5 FAIL rundy 3 zweryfikowany z osobna —
  wszystkie są skutkiem świadomej, ECHO'wanej częściowej reversji rundy 4 (gracz-proponent
  'pokoj' ponownie blokowany bilansem) poza jednym (0e, patrz Zarzut 2 niżej), zero nowych,
  nieoczekiwanych defektów.

BLOKADY: brak technicznych blokujących integrację.

RUNDY: 1/5
NASTĘPNY KROK: integracja allowlist-only przez orkiestratora (gotowość do integracji: TAK).

WERDYKTY:
1 -> ODDAL (nie wymaga naprawy/nowej rundy). Zarzut proceduralnie trafny — dispatch wprost
wymagał `git fetch`/decyzji o rebase PRZED pracą, krok nie został wykonany ani odnotowany.
Ale SAMODZIELNIE zweryfikowałem merytorycznie ponad `merge-tree`: `git apply --3way --check`
na REALNYM, aktualnym `origin/main` (`f029ffbf`, 9 commitów przed gałęzią) aplikuje diff
tematu CZYSTO, zero konfliktów; jedyny z tych 9 commitów dotykający pliku współdzielonego z
allowlistą (`22aea4fc`) zmienia 2 niepowiązane linie w pliku SPOZA allowlisty tego tematu
(`diplomacy-acceptance-points.ts`, etykieta `relCurrent`), reszta zmienia `main.ts` w
obszarach odległych od dotkniętych tu linii. Brak rebase jest realnie nieszkodliwy dla TEJ
integracji — potwierdzone, nie tylko przyjęte na słowo Obrony. Zalecenie proceduralne
(nie warunek): orkiestrator może mimo to zrebase'ować przy integracji jako higienę, ale nie
jest to wymagane technicznie i nie uzasadnia nowej rundy Operatora.
2 -> ODDAL (nie wymaga naprawy/nowej rundy). Zarzut trafny i potwierdzony — uruchomiłem
`dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs` samodzielnie: FAIL (0e) to faktycznie
zliczenie literału `pwBalance: pokojPwBalance` w źródle (oczekiwano 1, jest 2 — bo ta runda
dopisała drugie wystąpienie tego literału obok istniejącego), NIE „accepted zawsze true dla
gracza-proponenta". Opis w raporcie Operatora („KAŻDY FAIL… wyłącznie tej jednej asercji")
jest nieprecyzyjny dla tego jednego przypadku. Skutek nieszkodliwy (test i tak FAILuje z
oczekiwanego, świadomie zaakceptowanego powodu — starzejący się harness mutacyjny liczący
wystąpienia literału, nie regresja funkcjonalna) — korekta opisu w tym raporcie wystarcza,
nie wymaga nowej rundy Operatora ani zmiany kodu.

DEPLOY/PUSH: NIE WYKONANO
