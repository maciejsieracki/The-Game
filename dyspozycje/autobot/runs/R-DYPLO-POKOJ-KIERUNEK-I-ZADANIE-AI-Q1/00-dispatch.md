STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1
GOAL: Dwie powiązane zmiany w mechanice pokoju/zawieszenia broni na Stole negocjacji,
obie na wyraźne, wiążące ECHO właściciela (żywa rozmowa 2026-09-07), obie CZĘŚCIOWO
odwracają/doprecyzowują `P-DYPLO-BILANS-GATE` runda 4 (2026-09-03, `e253e64a`):

CZĘŚĆ A — bramka bilansu PW dla pokoju ma być KIERUNKOWA, nie bezwarunkowo pominięta:
> "Jeżeli inna cywilizacja lub państwo-miasto proponuje mi pokój, to nawet jeżeli
> bilans jest ujemny, powinienem mieć możliwość zaakceptowania, bo oni chcą. Ale
> jeżeli ja chcę zaproponować pokój, a bilans jest ujemny, muszę go wyrównać."

CZĘŚĆ B — AI, gdy SAMO proponuje "goły" pokój (bez niczego w koszyku), powinno zamiast
tego żądać czegoś (surowców/złota) żeby wyrównać bilans do bliskiego zera z WŁASNEJ
perspektywy, zamiast oddawać pokój "za darmo":
> "Zresztą umówiliśmy się, że cywilizacje powinny proponować propozycje, które są w
> bilansie bliskie zeru, żeby nie traciły, a ujemnych i tak nie mogę zaakceptować. W
> związku z tym inna cywilizacja powinna oczekiwać surowców lub innych elementów, na
> które jej zależy, aby wyrównać bilans do zera, a nie dawać pokój za darmo, chociaż
> ma narzędzia do tego, żeby bilans wyrównać do zera i może czegoś zażądać za pokój."

WAŻNE — recon (2 niezależne Explore agenty) ustalił fakty, które MUSISZ znać przed
pracą, żeby nie powielić błędu pamięci właściciela ani nie zepsuć istniejącego kanonu:

**Dla części A:** istniejąca decyzja `P-DYPLO-BILANS-GATE` runda 4 usunęła bramkę
bilansu dla `case 'pokoj'` W OBU KIERUNKACH jednocześnie (`evaluateProposal`,
`gra/src/game/diplomacy-proposals.ts:1272-1306`, `accepted` dla `pokoj` nigdy nie
zależy od `gap`/`pwBalance`). TA runda ma to ZAWĘZIĆ, nie cofnąć w całości: bramka ma
wrócić WYŁĄCZNIE dla kierunku "gracz jest autorem aktualnych warunków i chce je
wysłać", zostać wyłączona dla kierunku "partner jest autorem aktualnych warunków,
gracz tylko akceptuje".

**Dla części B:** twierdzenie właściciela "umówiliśmy się" dotyczy w RZECZYWISTOŚCI
INNEJ, już istniejącej decyzji — `D-DYPLO-AI-OFERTA-ZERO` (2026-07-29,
`gra/src/game/diplomacy-ai-offer-balance.ts:1-5`, "AI na Normal/Trudny celuje w
bilans PW ≈ 0") — TA decyzja dotyczy WYŁĄCZNIE ofert HANDLOWYCH (koszyk
giveItems/receiveItems/goldOnce), NIGDY pokoju. Dla pokoju AI dziś zawsze wysyła
PUSTY payload (`gra/src/game/diplomacy-proposals.ts:1819-1825`, `aiCommandToPendingProposal`,
case `'zaproponuj_pokoj'` → `payload: {}`). Właściciel myli dwie różne decyzje —
CZĘŚĆ B jest więc NOWĄ funkcją (rozszerzenie mechanizmu trymowania handlu na pokój),
nie przywróceniem/naprawą istniejącej reguły. Nie pisz w raporcie że to "przywrócenie
zachowania" — to jest nowa logika, budowana z istniejących cegiełek matematycznych.

KONTEKST TECHNICZNY CZĘŚĆ A (zlokalizowany przez recon):
- `gra/src/game/diplomacy-proposals.ts:2204-2223`, `PendingNegotiation` — ma
  `proposerOwnerId` (STAŁY inicjator rundy 1) i `authorOwnerId`/`awaitingOwnerId`
  (DYNAMICZNE, kto autoryzował AKTUALNE warunki, zmienia się po każdej kontrofercie
  `applyCounterOffer`, linie 2330-2345).
- `main.ts:16279` — UI liczy kierunek z `entry.awaitingOwnerId === 0 ? 'incoming' :
  'own'` — DYNAMICZNIE, poprawnie.
- `evaluateProposal` (`diplomacy-proposals.ts:990` sygnatura, `case 'pokoj'` linie
  ok. 1176-1306) dostaje `proposerOwnerId`/`responderOwnerId` z
  `negotiationAsProposal(entry)` (linia 2310) — kopiuje STATYCZNY `entry.proposerOwnerId`,
  NIE dynamiczny `authorOwnerId`. Już istnieje `proposerIsPlayer` (linia 1187) liczone
  z tego statycznego pola — używane dziś tylko do liczenia `pokojPwBalance`
  informacyjnie, NIE do gate'owania `accepted`.
- **ZASTRZEŻENIE ARCHITEKTONICZNE (recon):** statyczny `proposerOwnerId` i dynamiczny
  `authorOwnerId`/`direction` ROZJEŻDŻAJĄ SIĘ po kontrofercie — prosty przypadek (bez
  kontroferty) oba zgodne, ale po kontroferturze UI pokaże `direction='own'`
  (gracz właśnie licytował), a stary `proposerIsPlayer` nadal wskazywałby na
  pierwotnego inicjatora. NOWA bramka MUSI być oparta o DYNAMICZNE
  `authorOwnerId`/`direction` (kto autoryzował warunki NA STOLE TERAZ), NIE o statyczny
  `proposerOwnerId` — inaczej zbudujesz dokładnie ten sam błąd, tylko przesunięty.
- Gate UI: `gra/src/ui/diplomacyAcceptanceBalance.ts`, `balancePanelDataFromRows()`
  (linia ok. 366) — `row.direction` już czytane w tej samej pętli (linie 317-318, 324).
- Ścieżka klik "Przyjmij": `main.ts:15903-15950`, rozgałęziona po
  `entry.awaitingOwnerId !== 0` — `own` → `handleRequestAiNegotiationResponse`
  (WYSŁANIE do partnera, tu MA obowiązywać bramka bilansu ≥0), `incoming` →
  `resolvePlayerAcceptsAiPending` (PRZYJĘCIE przychodzącej, tu bramka MA być pominięta,
  jak dziś).

ZADANIE CZĘŚĆ A:
1. Zmień gate w `evaluateProposal`/`balancePanelDataFromRows` dla `case 'pokoj'` tak,
   żeby korzystał z DYNAMICZNEGO kierunku (`authorOwnerId`/`direction`/`awaitingOwnerId`),
   nie statycznego `proposerOwnerId`. Gdy `direction==='incoming'` (partner autorem
   aktualnych warunków) → `accepted`/`canAccept` NIEZALEŻNIE od bilansu (jak dziś).
   Gdy `direction==='own'` (gracz autorem, wysyła) → bilans PW musi być `>=0`, inaczej
   zablokuj z komunikatem analogicznym do innych typów traktatów.
2. Napisz/rozszerz test pokrywający: (i) partner proponuje pokój z ujemnym bilansem →
   gracz MOŻE zaakceptować, (ii) gracz chce wysłać pokój z ujemnym bilansem → NIE MOŻE
   (blockReason), (iii) SCENARIUSZ Z KONTROFERTĄ: partner najpierw proponuje, gracz
   licytuje kontrofertę (zmienia `awaitingOwnerId`/`authorOwnerId` na siebie) — teraz TO
   GRACZ jest autorem, więc bramka MA zadziałać dla tej nowej, wynegocjowanej wersji,
   mimo że pierwotny `proposerOwnerId` to nadal partner (to jest test na
   ZASTRZEŻENIE ARCHITEKTONICZNE wyżej — najważniejszy test tej rundy).

ZADANIE CZĘŚĆ B:
1. Gdy AI konstruuje `'zaproponuj_pokoj'` (`ai.ts:4966-4972` decyzja,
   `diplomacy-proposals.ts:1819-1825` `aiCommandToPendingProposal` budowa payloadu) —
   PRZED wysłaniem policz bilans "gołej" oferty pokoju z perspektywy AI (użyj
   ISTNIEJĄCYCH cegiełek: `treatyBaseFairnessGap`/`responderPwSurplus`
   `diplomacy-ai-offer-balance.ts`, wzorzec `computeQuickDealBasket`/
   `priceableTradableGoodOptions` z mechanizmu handlowego). Jeśli bilans jest
   niekorzystny dla AI powyżej tolerancji (ta sama tolerancja co `D-DYPLO-AI-OFERTA-ZERO`
   dla handlu — Normal ~5 PW, Hard ~2 PW, sprawdź dokładne progi w
   `diplomacy-ai-offer-balance.ts`) — DOPISZ do `receiveItems`/`goldOnce` żądanie
   surowców/złota od gracza, wybierając spośród tego, na czym AI faktycznie zależy
   (analogicznie do istniejącej logiki wyboru dóbr w umowach handlowych), żeby
   zrównoważyć do bliskiego zera. NIE zmieniaj `oferuj_trybut_za_pokoj` (istniejący,
   odwrotny przypadek — AI płaci za pokój przy krytycznej słabości) — to zostaje bez
   zmian, dotyczy innego stanu AI.
2. **UWAGA — recon zgłosił niepewność wymagającą jawnej weryfikacji, nie założenia:**
   guard w `main.ts:15627-15633` podobno odrzuca (nie wystawia na stół) KAŻDĄ
   propozycję bez `giveItems`/`receiveItems`/`goldOnce` — jeśli to prawda, DZISIEJSZE
   gołe oferty pokoju AI w ogóle nie powinny trafiać na stół, co przeczy temu, że
   właściciel realnie je widzi w grze (zrzut ekranu z wcześniejszej rozmowy). ZBADAJ
   TO NA POCZĄTKU PRACY (nie na końcu) — albo warunek jest inny niż recon sądził, albo
   coś inne omija ten guard dla pokoju. Opisz w raporcie co faktycznie znalazłeś, PRZED
   zmianą payloadu na niepusty (żeby nie budować na błędnym założeniu).
3. Napisz/rozszerz test: AI z niekorzystnym "gołym" pokojem (np. relacja niska, jak w
   przykładzie z rundy 3/4 P-DYPLO-BILANS-GATE) generuje ofertę z NIEPUSTYM
   `receiveItems`/`goldOnce`, bilans z perspektywy AI bliski zeru (w tolerancji).

BINARNE KRYTERIUM SUKCESU: 4 scenariusze testowe (3 z części A + 1 z części B) zielone,
w tym KRYTYCZNIE scenariusz kontroferty z części A (i)-(iii).

ALLOWLISTA:
- `gra/src/game/diplomacy-proposals.ts` (evaluateProposal case 'pokoj',
  aiCommandToPendingProposal case 'zaproponuj_pokoj')
- `gra/src/game/diplomacy-ai-offer-balance.ts` (rozszerzenie o pokój, jeśli tu żyje
  odpowiednia logika trymowania)
- `gra/src/game/ai.ts` (WYŁĄCZNIE okolice decideAIDiplomacy dot. zaproponuj_pokoj,
  linie ok. 4951-4972 — nie ruszać reszty ogromnego pliku)
- `gra/src/ui/diplomacyAcceptanceBalance.ts` (gate na direction dla pokoju)
- `gra/src/main.ts` (WYŁĄCZNIE okolice linii 15549-15950/16279 dot. Stołu negocjacji —
  main.ts jest OGROMNY, nie ruszać nic poza tym obszarem)
- `gra/tools/*.cjs` (nowe/rozszerzone bramki)
- `dyspozycje/autobot/runs/R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1/*`
Zakaz zmiany `oferuj_trybut_za_pokoj`. Zakaz zmiany mechanizmu trymowania dla handlu
(D-DYPLO-AI-OFERTA-ZERO) poza jego re-użyciem dla pokoju. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: część A — zakaz uznania za gotowe bez testu z
KONTROFERTĄ (scenariusz iii) — to jest dokładnie miejsce, gdzie statyczne
`proposerOwnerId` i dynamiczny `direction` się rozjeżdżają, i gdzie łatwo zbudować
pozornie działającą, w rzeczywistości wadliwą bramkę. Część B — zakaz uznania za
gotowe bez zweryfikowania na początku (nie na końcu) guardu main.ts:15627-15633 opisanego
w punkcie 2 wyżej.

IZOLACJA: worktree `/home/user/wt-dyplo-pokoj-kierunek-zadanie`, gałąź
`autobot/R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1`, baza `origin/main` @ `3f7c68e3`.
UWAGA: `R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1` (inny temat, dotyka TYCH SAMYCH plików:
`diplomacy-acceptance-points.ts`/`diplomacyAcceptanceBalance.ts`) może zostać
zintegrowany do `main` ZANIM ta runda się skończy — sprawdź `git fetch origin main`
PRZED rozpoczęciem pracy i ZDECYDUJ czy rebase'ować na nowszy main (prawdopodobnie
TAK, żeby uniknąć konfliktu przy integracji — to osobna zmiana w innej funkcji tego
samego pliku, powinno się zrebase'ować czysto).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
