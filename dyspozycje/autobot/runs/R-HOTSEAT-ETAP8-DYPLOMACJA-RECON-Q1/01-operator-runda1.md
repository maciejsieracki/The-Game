# R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1 — Operator, runda 1

## 0. Stan poprzedzający

Branch zsynchronizowany: HEAD lokalny = `origin/main` =
`6f7cbab6c87984b67f86a1f33473cbaffeb02662` (`/home/user/wt-etap8-recon`, sparse
`gra`+`docs`+`dyspozycje`, `git status` czysty). Przeczytane w całości: `PLAN-HOT-SEAT-
2-GRACZY.md` §G/§H, `00-dispatch.md` tego tematu, wzorzec
`R-HOTSEAT-ETAP6F-PART2-RECON-Q1/01-operator-runda1.md`. Wszystkie linie niżej —
świeży `grep`/`Read` na tym HEAD.

## 1. Warstwa silnika — co faktycznie generalizuje

**`getDiploRelation(a,b)` — `main.ts:8029-8052`.** Ciało: `const key = a < b ?
\`${a}_${b}\` : \`${b}_${a}\`;` (8030) — klucz z DOWOLNYCH dwóch liczb, zero `ME()`/
`HUMAN_OWNER_PRIMARY`. Dowód użycia NIE-ME(): `main.ts:27718-27720`
(`finalizePeaceTreatyBetween(st.attackerId, st.targetId, ...)` w
`maybeResolveBronzeForcedWarOnCityCapture`, log `AI${attackerId}↔AI${targetId}`) —
realny pokój AI↔AI, żadna strona nie jest graczem. „Generalizuje" POTWIERDZONE.

**`ActiveDeal.strony: [number, number]` — `game/diplomacy-treaties.ts:123-127`** —
para kanoniczna dowolnych `ownerId` (komentarz linii 126). Potwierdzone.

**`diploPairKey(a,b)` — `game/diplomacy-pn-engine.ts:114-116`** — identyczny klucz
symetryczny, zero `ME()`. Potwierdzone.

**`diplomacy-layers.ts` (`diplomacyLayerForOwner` 240-257,
`filterDiplomacyCommandsForLayer` 260-268, `partitionDiplomacyCommandsForPlayerFog`
289-305)** — cały plik: 0 trafień `ME(`/`HUMAN_OWNER_PRIMARY`/`humanOwnerIds`/`isMe`.
Sygnatury przyjmują `ownerId`/`playerOwnerId` jako parametr.

Zastrzeżenie (anty-halucynacyjne) — sygnatura ≠ wywołanie: `partitionDiplomacyCommands
ForPlayerFog` ma domyślny `playerOwnerId = 0` (291), `computeDiplomaticContacts` też
(225). Rzeczywiste wywołania NIE nadpisują tego: `main.ts:17921`
`computeDiplomaticContacts(visible, cities, units)` (3 argumenty) i
`main.ts:32446-32448` `partitionDiplomacyCommandsForPlayerFog(dipCmdsRaw ...)` (1
argument). Funkcja jest generyczna, ale KAŻDE dzisiejsze wywołanie polega na literalnym
`0` — to „silnik POTRAFI", nie „silnik już obsługuje dowolną parę w praktyce".

**Realna luka — kontakt dyplomatyczny to WCIĄŻ globalny stan, nie per-fotel.**
`main.ts:7940-7943`:
```
7940:    /** D3-Q2: nacje, z którymi gracz nawiązał kontakt dyplomatyczny (save/load w meta). */
7941:    const diplomaticContactEstablished = new Set<number>();
7942:    /** Odkryte na mapie (widoczne choć raz) — osobno od formalnego kontaktu. */
7943:    const diplomaticallyDiscoveredOwners = new Set<number>();
```
Komentarz mówi „gracz" (l.pojedyncza), typ to `Set<number>`, NIE `Map<humanOwnerId,
Set<number>>`. Kontrast: `main.ts:8564-8565` (`exploredByHuman.set(secondOwnerId,
new Set())`, `playerStateByHuman.set(secondOwnerId, ...)`) — wzorzec `Map<ownerId,X>`
JUŻ istnieje w kodzie, ale te dwa zbiory go nie używają. Skutek:
`getDiplomaticContacts()` zwraca `diplomaticallyDiscoveredOwners` wprost
(`main.ts:17917`) i karmi nim `diplomacyLayerForOwner` (np. `main.ts:6462-6469`) — jeśli
fotel A odkryje AI(X) na mapie, fotel B widzi AI(X) jako „odkryte" nawet gdy tam nie
był. Nazwane jawnie (patrz §4), nie rozwiązywane tu.

## 2. Warstwa UI — konkretne założenia „jeden człowiek"

Wszystkie 9 plików istnieją. Żaden nie ma `ME()`/`HUMAN_OWNER_PRIMARY` (0 trafień) —
założenie nie jest literalnym `ME()`, tylko architekturą: moduł-singleton na ekran, API
bez parametru „kto patrzy", nazwy pól „gracz"/„Ty" jako jedyna tożsamość widza.

- **`diplomacyPanel.ts:150-151`** — `let cfg`/`let rootEl` — jeden panel na proces.
  `getRelations` (90) to `() => DiploRelation[]` bez argumentu; wołający
  (`main.ts:20562`) zamyka nad `buildPlayerDiploRelations` (`main.ts:6459`,
  wewnątrz `getDiploRelation(ME(), otherId)` na 6464) — panel NIE MOŻE dziś pokazać
  relacji fotela A i B naraz, jedno miejsce na wynik.
- **`diplomacyAudience.ts:286-292`** — `DiplomacyAudienceConfig.ownerId` (287) nazywa
  WYŁĄCZNIE drugą stronę; brak pola `viewerOwnerId`/`myOwnerId`. `getState`/`onAction`
  bez argumentu identyfikującego widza.
- **`diplomacyNegotiationModal.ts:69-115`** — `cityOptions` (96, „Miasta GRACZA"),
  `playerSkarbiec` (114-115, „Skarbiec gracza") — nazwa pola `player`, nie
  `viewerId`/`activeSeat`: jedna, stała tożsamość „gracza".
- **`diplomacyDealDisplay.ts:3`** — nagłówek pliku: „lewa kolumna „Oferujemy", prawa
  „Oferują" (perspektywa gracza)" — układ ZASZYTY w jedną perspektywę; przy dwóch
  ludziach każda strona potrzebowałaby odwróconych kolumn, dziś brak przełącznika.
- **`diplomacyAcceptanceBalance.ts:219,549-551`** — „Wiersze wymagające decyzji
  GRACZA" (219), etykieta „Ty: baza … PW" (550) — literalne „Ty", nie per widz.
- **`diploListHud.ts:245`** — `aria-label('Twoje państwo — ' + ...)`,
  `getPlayerSummary?.()` (241) bez argumentu „które z dwóch państw".
- **`diplomacyTradeBasket.ts:57-58,2356`** — `let overlay`/`let activeOnCancel`
  moduł-singleton; `showTradeBasketModal` bez identyfikatora widza.
- **`diplomacyProposalBanner.ts:8-9`, `diplomacyPendingHud.ts:39`** — te same
  moduł-singletony (`let timer/root`, `let root`).

**Wniosek:** żaden plik nie ma twardego `ME()`, ale wszystkie mają architekturę 1:1 —
jeden singleton, jedna „perspektywa gracza" w nazwach, zero parametru „czyj to widok".
Nazwa/API drugiej strony wygląda generycznie, ale nie ma miejsca na „mój ownerId, inny
niż stały gracz" — bo dziś jeden fotel jest u steru na raz.

## 3. Punkt odniesienia — `hotSeatHandoff.ts`

`gra/src/ui/hotSeatHandoff.ts:107-118` (`showHotSeatHandoff`) — API generyczne
(`HotSeatHandoffInfo{fromLabel,toLabel,toCivIconId?}`, 29-36). Scrim (z-index 9970) +
overlay (9980) montowane SYNCHRONICZNIE, Escape celowo no-op (117), jedyne wyjście —
klik. Rozwiązuje JEDNORAZOWE, JEDNOKIERUNKOWE przejście „A kończy → chowaj → B
zaczyna", wołane raz na turę (`switchActiveHuman()`).

Różnica wobec negocjacji: oferta-kontroferta to POTENCJALNIE WIELE przejść w jednej
sesji (A proponuje → chowaj → B odpowiada → chowaj → ...). Sam komponent DA SIĘ reużyć
per-przejście (nie ma licznika/stanu wewnętrznego blokującego wielokrotne wywołanie),
ale wołający musiałby dobudować WŁASNĄ pętlę „czyja kolej" — dziś nie istnieje (żaden
call-site nie woła go więcej niż raz na turę). Osobny przypadek: „licytacja na żywo"
(obie strony patrzą na TEN SAM ekran naraz) — tu handoff (którego sensem jest ukrycie)
nie pasuje koncepcyjnie, to inny wzorzec (bliższy Wariantowi 2, §5).

## 4. Relacja do dyplomacji gracz↔AI z dwóch foteli osobno

`ME()` (`main.ts:10544-10546`) zwraca `humanSeats.activeHumanOwnerId` DYNAMICZNIE, nie
stały `0`. Sama relacja liczbowa (`getDiploRelation`) generalizuje się poprawnie po
przełączeniu fotela — klucz pary jest symetryczny, niezależny od tego, kto był aktywny
gdy relacja powstała.

**Ale kontakt/odkrycie (§1) NIE jest per-fotel** — luka NIEZALEŻNA od Etapu 8 (dotyczy
DZIŚ istniejącej relacji gracz↔AI z perspektywy KAŻDEGO z dwóch foteli osobno, zgodnie
z pytaniem dispatchu p.4): jeśli fotel A „odkrył" AI(X), fotel B dostanie mimo to
`layer !== 'pre_contact'` dla AI(X), bo `contactedOwners` jest WSPÓLNE. To JEST
blokująca luka DZIŚ (nie część Etapu 8, który dotyczy WYŁĄCZNIE pary człowiek↔człowiek)
— nazwana jawnie jako potencjalny OSOBNY temat (migracja `diplomaticallyDiscoveredOwners`/
`diplomaticContactEstablished`/`diplomaticDiscoveryPopupShown` na `Map<humanOwnerId,
Set<number>>`, wzorem `exploredByHuman`), bez oceny czy to obserwowalny bug w realnej
rozgrywce (nie testowane w przeglądarce — poza zakresem, docs-only).

## 5. Warianty projektowe negocjacji gracz↔gracz (bez rekomendacji)

**Wariant 1 — „handoff sekwencyjny":** każda oferta/odpowiedź woła
`showHotSeatHandoff`/`hideHotSeatHandoff` (§3), analogicznie do przekazania tury.
- Za: reużywa gotowy, zaufany komponent (bezpieczeństwo przez politykę + zablokowany
  Escape); spójne z resztą hot-seatu.
- Przeciw: przy wielu rundach kontrofert generuje serię „kliknij aby kontynuować" —
  może spowalniać wymianę; nie obsługuje „licytacji na żywo" wprost.

**Wariant 2 — „wspólny ekran, oboje patrzą naraz, bez ukrywania":** panel/audiencja
renderuje się raz, widoczny dla obu jednocześnie, bez kroku chowania.
- Za: zero nowego kodu chowania; szybsze tempo; naturalnie wspiera licytację na żywo.
- Przeciw: narusza wprost założenie dispatchu „bez wzajemnego podglądu tajnych
  informacji" — dziś Etap 5 traktuje to jako „przeciek" wymagający handoffu; wymaga
  jawnej decyzji, czy przy SAMEJ negocjacji ukrywanie ma wartość (ABC-Q1).

**Wariant 3 — „hybryda":** handoff wyłącznie przy otwarciu/zamknięciu sesji, sama
wymiana ofert w środku na wspólnym ekranie (jak Wariant 2), bez chowania między turami
negocjacji.
- Za: chroni przygotowanie PRZED/PO, nie spowalnia samej wymiany.
- Przeciw: wymaga jawnej decyzji CO dokładnie jest „tajne" tylko na starcie a jawne w
  środku (np. stan skarbca A widoczny podczas przygotowania koszyka) — więcej
  przypadków brzegowych niż w czystych Wariantach 1/2.

## 6. Pytania ABC do właściciela (bez sugerowanego rozstrzygnięcia)

- **ABC-Q1 (ukrywanie: realna wartość czy teatr?).** Czy negocjacja gracz↔gracz
  wymaga ukrywania informacji między fotelami jak przy przekazaniu tury, czy przy
  jednym urządzeniu bez fizycznej separacji ukrywanie ekranu jest rytuałem bez
  realnej wartości?
- **ABC-Q2 (rola AI).** Czy AI ma jakąkolwiek rolę w negocjacji gracz↔gracz (świadek/
  gwarant/arbiter), czy to czysto dwustronna wymiana?
- **ABC-Q3 (zakres `RodzajTraktatu`).** Czy istniejące rodzaje traktatów stosują się
  1:1 do pary człowiek↔człowiek, czy potrzebne są nowe/wyłączone warianty specyficzne
  dla tej pary?
- **ABC-Q4 (punkt wejścia UI).** Czy inicjatywa wymaga nowego, osobnego punktu wejścia
  (dedykowany przycisk/ekran), czy rozszerzenia istniejącego panelu dyplomacji o
  zakładkę „drugi gracz" traktowaną jak kolejny partner na liście?
- **ABC-Q5 (który wariant z §5?).** Który z Wariantów 1/2/3 (albo inny, tu
  niewymieniony) ma być podstawą implementacji — czy właściciel chce połączyć
  elementy różnych wariantów?
- **ABC-Q6 (relacja do luki z §4).** Czy migracja kontaktu dyplomatycznego na
  strukturę per-fotel ma powstać jako warunek wstępny PRZED Etapem 8 (osobny temat),
  czy może zostać naprawiona RAZEM z Etapem 8?

## 7. Wynik

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1
GOAL: Recon (bez implementacji) Etapu 8 — pełna dyplomacja gracz↔gracz; inwentaryzacja
silnik/UI z cytatami plik+linia, warianty UI negocjacji z za/przeciw, pytania ABC do
właściciela PRZED implementacją.
ZMIANY/COMMIT: Ten dokument (docs-only),
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1/01-operator-runda1.md`.
Zero zmian w `gra/`.
TESTY: brak (dokument, recon — docs-only, zgodnie z GOAL i allowlistą dispatchu).
BLOKADY: brak blokad technicznych zamknięcia recon; 6 pytań ABC (§6) wymagane PRZED
implementacją Etapu 8. Dodatkowo zidentyfikowana luka NIEZALEŻNA od Etapu 8 (§4,
kontakt dyplomatyczny nie per-fotel) — nazwana, nie rozstrzygnięta (ABC-Q6).
RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (weryfikacja świeżości cytatów, kompletności §1-§6,
braku ukrytej rekomendacji w §5). Final Control NIE dotyczy (docs-only, informational).
DEPLOY/PUSH: NIE WYKONANO
