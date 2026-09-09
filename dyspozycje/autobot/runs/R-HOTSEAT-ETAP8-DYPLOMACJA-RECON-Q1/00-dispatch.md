# Dispatch — R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1

## Kontekst

`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §G definiuje **Etap 8** jako pełną dyplomację
gracz↔gracz — jawnie odłożoną „po ustabilizowaniu Etapów 0-7" (ABC-1=C). Etapy 0-7 są
w trakcie ostatecznego domykania równolegle z tym reconem (`R-HOTSEAT-ETAP6F-PART2-UI-Q1`,
ostatni brakujący pod-temat). Silnik już dziś wspiera symetryczną relację
`getDiploRelation(a, b)` i dowolno-parową `activeDeals` (nie tylko „gracz↔AI") — ale
CAŁA istniejąca warstwa UI dyplomacji (patrz §1 niżej) była projektowana i budowana pod
założenie „jeden człowiek negocjuje z wieloma AI", NIE „dwóch ludzi przy jednym
ekranie negocjuje ze sobą bez wzajemnego podglądu tajnych informacji".

To jest RECON, nie implementacja. Wzorzec identyczny do już zamkniętego
`R-HOTSEAT-ETAP6F-PART2-RECON-Q1`: inwentaryzacja stanu, warianty projektowe,
JAWNE pytania ABC do właściciela — BEZ sugerowanego rozstrzygnięcia, BEZ zmian w `gra/`.

## GOAL

Dokument gotowy do decyzji właściciela: co dokładnie trzeba zbudować, żeby dwóch ludzi
przy jednym urządzeniu (hot-seat) mogło ze sobą negocjować/zawierać traktaty, jakie są
warianty UI tego mechanizmu, i jakie pytania projektowe (ABC) musi rozstrzygnąć
właściciel PRZED jakąkolwiek implementacją Etapu 8.

## Zakres researchu (wiążący — te punkty MUSZĄ się znaleźć w raporcie)

1. **Warstwa silnika (już generalizuje wg planu — zweryfikuj, nie zakładaj):**
   `getDiploRelation(a, b)` (main.ts), `activeDeals`/`ActiveDeal` (dowolne pary
   `ownerId`), `diplomacy-pn-engine.ts` (`diploPairKey(a, b)`), `diplomacy-layers.ts`
   (`diplomacyLayerForOwner`, `filterDiplomacyCommandsForLayer`,
   `partitionDiplomacyCommandsForPlayerFog`). Ustal wprost: czy którakolwiek z tych
   funkcji ma DZIŚ zaszyte założenie "jeden ownerId to zawsze AI" (np. przez
   odwołanie do `ME()`/pojedynczego `HUMAN_OWNER_PRIMARY` zamiast dowolnego
   `humanOwnerIds`) — a nie tylko czy NAZWA sugeruje ogólność.
2. **Warstwa UI istniejąca, zaprojektowana pod 1 człowieka:** przejrzyj i nazwij
   konkretne założenia „jeden człowiek" w: `diplomacyPanel.ts`,
   `diplomacyNegotiationModal.ts`, `diplomacyProposalBanner.ts`,
   `diplomacyPendingHud.ts`, `diploListHud.ts`, `diplomacyTradeBasket.ts`,
   `diplomacyAudience.ts`, `diplomacyDealDisplay.ts`, `diplomacyAcceptanceBalance.ts`.
   Kluczowe pytanie do odpowiedzi per plik: czy ekran/modal zakłada, że WIDZ = jedyny
   człowiek przy komputerze (czyli może swobodnie pokazać MU dane wszystkich AI), a
   przy dwóch ludziach przy jednym ekranie analogiczne dane strony przeciwnej
   (gracza B) byłyby „przeciekiem" widocznym dla gracza A bez jego zgody/wiedzy.
3. **Punkt odniesienia: mechanizm handoff z Etapu 5.** `showHotSeatHandoff`/
   `hideHotSeatHandoff` (`gra/src/ui/hotSeatHandoff.ts`) już rozwiązuje analogiczny
   problem dla PRZEKAZANIA TURY (ukrycie ekranu między graczami). Ustal, czy ten sam
   komponent/wzorzec da się reużyć dla „gracz A składa ofertę → ekran chowa się →
   gracz B ją widzi i odpowiada", czy natura negocjacji (obie strony musiałyby
   momentami widzieć TEN SAM ekran naraz, np. przy licytacji) wymaga czegoś innego.
4. **Relacja do dyplomacji AI-AI i gracz↔AI.** Etap 8 dotyczy WYŁĄCZNIE pary
   człowiek↔człowiek. Ustal explicite, czy dzisiejsza dyplomacja człowiek↔AI (z
   perspektywy KAŻDEGO z dwóch ludzkich foteli osobno wobec tych samych AI) już
   działa poprawnie po migracji Etapu 6d (`isHuman`/`isMe`, `R-HOTSEAT-ETAP6D-*`) —
   jeśli NIE, to jest to blokująca luka DZISIAJ, nie część Etapu 8, i musi być
   nazwana osobno jako potencjalny dodatkowy temat (nie mieszaj zakresów w
   rekomendacji, tylko nazwij fakt).

## Warianty projektowe do zaproponowania (minimum 2, bez rekomendacji)

Zaproponuj analogicznie do `R-HOTSEAT-ETAP6F-PART2-RECON-Q1` §3 co najmniej dwa
warianty UI dla samego aktu negocjacji gracz↔gracz (np. „handoff sekwencyjny — oferta
→ ukryj → druga strona odpowiada", „jeden wspólny ekran obu graczy patrzących na to
samo, bez ukrywania" — z jawnym „za/przeciw" każdego, tak jak dla części (ii)).

## Pytania ABC do przygotowania (wzorem §4 recon 6f-part2 — jawne, BEZ sugerowanego rozstrzygnięcia)

Minimum, rozszerzaj jeśli research ujawni więcej:
- Czy negocjacja gracz↔gracz wymaga ukrywania informacji między fotelami (jak przy
  turze), czy przy jednym urządzeniu i tak nie ma separacji fizycznej i ukrywanie
  jest teatrem bez realnej wartości?
- Czy AI ma jakąkolwiek rolę w negocjacji gracz↔gracz (np. jako świadek/gwarant), czy
  to czysto dwustronna wymiana?
- Czy istniejące typy traktatów (`RodzajTraktatu`) mają się stosować 1:1 do pary
  człowiek↔człowiek, czy potrzebne są nowe/wyłączone warianty specyficzne dla tej pary?
- Czy inicjatywa negocjacji gracz↔gracz wymaga nowego punktu wejścia w UI (przycisk/
  ekran), czy rozszerzenia istniejącego panelu dyplomacji o zakładkę „drugi gracz"?

## Reguła przeciw samooszukiwaniu

Zakaz twierdzenia „silnik już to obsługuje" na podstawie samej nazwy funkcji
(`getDiploRelation`, `activeDeals`) bez pokazania konkretnego wywołania/miejsca w
kodzie, które faktycznie przyjmuje DOWOLNĄ parę `ownerId` (nie tylko `ME()` kontra
AI). Każde twierdzenie o „już generalizuje" lub „zakłada jednego człowieka" musi mieć
cytat: plik + linia + fragment.

## Format wyniku

Dokument w tym katalogu, wzorem `R-HOTSEAT-ETAP6F-PART2-RECON-Q1/01-operator-runda1.md`
(numerowane sekcje: kontekst, inwentaryzacja z cytatami plik+linia, warianty projektowe
z za/przeciw, pytania ABC, wynik STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/
RUNDY/NASTĘPNY KROK). DOMAIN: INFORMATIONAL. Max ok. 1200 słów (recon, nie limit 400
słów zwykłego etapu implementacyjnego — ten sam wyjątek co przy 6f-part2-recon).

## Allowlista

Wyłącznie nowy plik w tym katalogu
(`dyspozycje/autobot/runs/R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1/01-operator-runda1.md`).
Zero zmian w `gra/`. Zakaz `git add -A`.

## Izolacja

Ten temat jest docs-only (recon) — może pracować bezpośrednio w głównym drzewie roboczym
orkiestratora do CZYTANIA, ale zapisuje WYŁĄCZNIE plik w allowliście. Jeśli Operator
wymaga własnego worktree dla higieny równoległej pracy — `/home/user/wt-etap8-recon`,
gałąź `autobot/R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1`, baza `origin/main`.

## Binarne kryterium sukcesu

Dokument istnieje, zawiera wszystkie 4 punkty researchu (§ wyżej) z cytatami plik+linia,
minimum 2 warianty projektowe z za/przeciw, minimum 4 pytania ABC bez sugerowanego
rozstrzygnięcia. Final Control NIE dotyczy (docs-only, informational, jak przy 6f-part2-recon).

## Ograniczenia wyjścia

Nie integrujesz, nie deployujesz, nie pushujesz. Raport kończy się STATUS: PASS,
DEPLOY/PUSH: NIE WYKONANO.
