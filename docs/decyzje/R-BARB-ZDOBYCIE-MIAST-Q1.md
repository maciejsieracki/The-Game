# [TEMAT: Zdobywanie miast przez barbarzyńców] R-BARB-ZDOBYCIE-MIAST-Q1

**Status:** ABC zapisane — czeka na wybór właściciela
**Data:** 2026-08-19
**Powód:** potwierdzona luka krytyczna: barbarzyńcy dochodzą do miasta, ale nie mają komendy szturmu ani przejęcia miasta.

## Sytuacja

Barbarzyńcy mają obecnie w `gra/src/game/barbarians.ts` tylko komendę ataku jednostki
(`targetUnitId`). Miasto jest dla nich wyłącznie celem marszu. Dispatcher w
`gra/src/main.ts` obsługuje ich ruch, rajd i atak na jednostki, ale nie obsługuje
ataku na miasto. Dodatkowo ruch na obcy heks miasta jest blokowany przez
`canUnitOccupyCityHex`, więc jednostka zatrzymuje się przed miastem.

Istniejące ścieżki przejęcia można zachować i wykorzystać:

- `startMapSiege()` / `commitBesiege()` utrzymują stan oblężenia, oblegających
  i machin;
- `collectSiegeDefRoster()` zachowuje garnizon oraz milicję;
- `executeSilentSiegeStorm()` i `captureCityWithoutBattle()` prowadzą szturm
  oraz przejęcie;
- `applyCityCaptureToMap()` wywołuje `runCapitalCapturePlunder()`, sukcesję,
  eliminację właściciela AI i sprzątanie stanu;
- `buildSaveGameSnapshot()` zapisuje miasta, jednostki, obozy i mapy stanu
  oblężenia, a `restoreGameFromSave()` odtwarza mapy oblężenia i obozy.

Nie jest jednak ustalone, jaki owner ma zostać zapisany po zwycięstwie barbarzyńców.
`BARBARIAN_OWNER_ID=-1` jest dziś właścicielem jednostek, ale nie jest pełnoprawnym
ownerem cywilizacji: nie ma skarbca, ekonomii, dyplomacji ani warunku zwycięstwa.
Bez tej decyzji implementacja mogłaby zapisać miasto w stanie, którego reszta silnika
nie umie obsłużyć.

## Cel pytania

Wybrać trwały model własności miasta po udanym szturmie lub kapitulacji barbarzyńców,
żeby można było bezpiecznie wdrożyć:

1. dojście do sąsiedniego heksu i rozpoczęcie/utrzymanie oblężenia;
2. garnizon, szturm, pustą kapitulację i przejęcie;
3. eliminację poprzedniego właściciela gracza lub AI oraz późniejsze odbicie miasta;
4. zapis i odczyt stanu bez utraty obozów, jednostek, właściciela i oblężenia.

## Dlaczego teraz

Luka jest potwierdzona w rejestrze jako `R-BARB-ZDOBYCIE-MIAST-Q1` i dotyczy zarówno
miast gracza, jak i AI. Samo dopisanie `attackCity` bez decyzji o ownerze może
uszkodzić ekonomię, kapitał i save/load, dlatego przed zmianą kodu trzeba zamknąć
ten jeden kontrakt.

## Opcja A — wspólna frakcja barbarzyńców (`ownerId=-1`) — rekomendacja

Po zwycięstwie miasto otrzymuje `ownerId=BARBARIAN_OWNER_ID`. Barbarzyńcy nie
prowadzą w mieście normalnej produkcji, badań, handlu ani dyplomacji. Miasto jest
trwałym, możliwym do odbicia celem barbarzyńców; jego garnizon stanowią żywe
jednostki barbarzyńskie pozostawione po szturmie. Przy przejęciu stolicy/ostatniego
miasta poprzedni właściciel przechodzi istniejącą ścieżkę plądrowania i eliminacji,
ale łup nie jest księgowany do skarbca barbarzyńców. Przy ponownym odbiciu
barbarzyńskie miasto działa jak zwykłe miasto obcego właściciela, z wyłączeniem
barbarzyńców jako celu kapitału/dyplomacji.

**Za:**

- wykorzystuje istniejący sentinel i nie tworzy nowych ownerów ani kolizji z AI;
- jest deterministyczne i łatwo zachowuje się w `cities[]`, `units[]` oraz save/load;
- oddaje prostą, czytelną regułę: miasto może być odbite, ale barbarzyńcy nie stają
  się pełnoprawną cywilizacją.

**Przeciw:**

- wymaga jawnych wyjątków w ekonomii, kapitale, renderze i walidacji własności, aby
  `ownerId=-1` nie uruchamiał ścieżek przeznaczonych dla cywilizacji;
- trzeba ustalić, czy przejęcie miasta przez barbarzyńców ma przenosić, zerować
  czy ignorować skarbiec/pracę/naukę poprzedniego właściciela;
- trzeba dopisać osobną regułę garnizonu po szturmie, bo zwykły owner-based
  `syncCityGarnizon()` nie rozróżnia „barbarzyńcy zdobyli" od „barbarzyńcy oblegają".

## Opcja B — osobny trwały owner per obóz

Każdy obóz otrzymuje stabilny identyfikator właściciela miasta, zapisywany razem
z obozem. Zdobyte miasto należy do tego obozu, a jednostki kontyngentu zachowują
jego ownerId. Miasta zdobyte przez różne obozy są rozdzielone organizacyjnie.

**Za:**

- pozwala modelować konkretne „królestwa obozów" i różne garnizony bez wspólnej
  puli wszystkich barbarzyńców;
- ułatwia późniejsze rozszerzenie o rozwój obozu, odzyskanie miasta lub różne
  zachowania Ludów Morza.

**Przeciw:**

- wymaga nowego systemu identyfikatorów ownerów, migracji save/load i ochrony przed
  kolizjami z ownerami AI;
- dotyka dyplomacji, ekonomii, renderu, zwycięstwa, kapitału i list ownerów, choć
  barbarzyńcy nadal nie mają być cywilizacją;
- zwiększa zakres bieżącej luki ponad potrzebę i utrudnia deterministyczne testy
  wieloma obozami.

## Opcja C — czasowa okupacja bez własności miasta

Po zwycięstwie miasto zachowuje poprzedniego ownera, ale dostaje osobny stan
`barbarianOccupied`/`barbarianOccupierCampId`. Produkcja i obrona poprzedniego
owner-a są wstrzymane, a miasto wraca do poprzedniego właściciela po zniszczeniu
lub odejściu kontyngentu barbarzyńców.

**Za:**

- nie wprowadza `ownerId=-1` do istniejącego systemu ekonomii i kapitału;
- minimalizuje wpływ na dyplomację oraz listy cywilizacji;
- dobrze pasuje do interpretacji barbarzyńców jako napadu/okupacji.

**Przeciw:**

- nie spełnia literalnie kontraktu „po zwycięstwie właścicielem zostaje frakcja
  barbarzyńska albo typ obozu";
- wymaga nowej semantyki okupacji, jej zegara i reguł odbicia, a także osobnych pól
  save/load;
- nie daje jasnego zachowania przy eliminacji poprzedniego ownera ani przy przejęciu
  miasta przez trzecią cywilizację.

## Rekomendacja

**Rekomendacja: A.** Wspólna frakcja `BARBARIAN_OWNER_ID=-1` jest najmniejszym
rozszerzeniem zgodnym z obecnym modelem, ale wdrożenie powinno być owner-aware:
barbarzyńcy mogą zdobyć i utrzymać miasto, lecz nie dostają cywilizacyjnej ekonomii
ani dyplomacji. Przed kodem trzeba jeszcze potwierdzić zasady łupu oraz garnizonu
po przejęciu.

## Zakres po wyborze

Po wyborze opcji należy wdrożyć i przetestować osobno:

1. planner barbarzyńców: cel miasta, komenda podejścia, `siegeCity`/`attackCity`
   dla miasta gracza i AI;
2. dispatcher: pusty city capture, szturm, oblężenie, kapitulacja głodowa,
   zachowanie garnizonu i wycofanie/odparcie;
3. przejęcie: owner, kapitał/łup, eliminacja poprzedniego ownera, możliwość odbicia;
4. save/load: miasta, jednostki, `oblegane`, `oblegajacyOwnerId`,
   `siegeCapitulationPending`, mapy oblężenia i obozy;
5. testy: osobny scenariusz miasta gracza, osobny scenariusz miasta AI oraz
   round-trip save/load.
