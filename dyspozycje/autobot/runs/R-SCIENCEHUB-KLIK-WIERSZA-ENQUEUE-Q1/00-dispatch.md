# 00-dispatch — R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1

TEMAT: R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1
GOAL: kliknięcie wiersza technologii na liście w panelu „Badania" (`scienceHubHud.ts`,
sekcje „MOŻESZ WYBRAĆ"/„WKRÓTCE") ma DODAWAĆ technologię do planu badań (`onSelectTech`)
BEZPOŚREDNIO, tak jak działało to wcześniej — NIE otwierać karty podglądu. Podgląd karty
ma być dostępny przez osobny, WYRAŹNIE OZNACZONY element — mały baner/przycisk z napisem
„Karta" (nie samą ikonkę), niezależny od kliknięcia wiersza.

## Zgłoszenie właściciela (2026-08-21, zrzut ekranu + dwa opisy)

> Poprzedni sposób wybierania z listy badań z menu po lewej stronie na mapie świata był ok.
> Mi chodziło tylko o malutki przycisk po prawej stronie, na przykład „Łowiectwo", który
> pozwoli sprawdzić kartę tego badania. Na przykład mały banerek z napisem „Karta", po
> najechaniu którego możemy wejść do karty tego badania. Niestety, teraz efekt jest taki, że
> w momencie gdy naciśniemy np. „Łowiectwo", żeby dać je do kolejki, to włącza się karta
> badań, a nie tak to miało działać.

## Ważny kontekst — to NIE jest regres wprowadzony przez ten dispatch ani przez wcześniejszą
## fazę CivPedii w tej sesji (T2, ikonka info)

Recon potwierdza: mechanizm „klik całego wiersza otwiera kartę podglądu (`kind:'preview'`),
osobny callback `onStartResearch` wywołuje faktyczne dodanie do kolejki DOPIERO z wnętrza
karty" **już istniał w kodzie PRZED T2/T3 tej sesji** — pochodzi z wcześniejszej, równoległej
zmiany „tryb podglądu" (widoczne w `scienceHubHud.ts::buildEntryRow()`, `act()` linia ~630-638,
i analogicznie w `techTreeView.ts`). T2 (ta sama sesja) jedynie DODAŁ osobną ikonkę „ⓘ" obok
— nie zmienił zachowania kliknięcia całego wiersza. Właściciel teraz jasno mówi, że TA
WCZEŚNIEJSZA zmiana (nie moja) jest niepożądana i chce powrotu do bezpośredniego dodawania
do kolejki po kliknięciu wiersza.

## Zakres zmian

### 1. `gra/src/ui/scienceHubHud.ts`, `buildEntryRow()` (funkcja `act()`, linia ~630-642)

- Klik na WIERSZ (`row.addEventListener('click', ...)`, linia ~639) ma wołać
  `config.onSelectTech(e.id)` BEZPOŚREDNIO (dla wierszy odblokowanych, `!lockedRow &&
  canEnqueue`) — DOKŁADNIE tak jak `+ PLAN` (dekoracyjny badge, linia ~622-627) dziś tylko
  sugeruje wizualnie. Sprawdź czy trzeba dodać potwierdzenie/animację przy dodaniu (np. czy
  `+ PLAN` badge ma się na chwilę podświetlić) — jeśli to za duża zmiana UX poza zakresem,
  zrób najprostszą wersję (po prostu wywołaj `onSelectTech`) i zanotuj to w raporcie.
- Dla wierszy ZABLOKOWANYCH (`lockedRow`) klik nadal nie powinien nic robić (nie da się
  dodać zablokowanej technologii do planu) — sprawdź co ma się dziać: nic, czy nadal podgląd
  karty (rozsądne dla zablokowanej, żeby zobaczyć wymagania)? Jeśli sam kod dziś już to
  rozróżnia (`lockedRow ? undefined : ...` przy `onStartResearch`), zachowaj tę różnicę:
  wiersz zablokowany → klik OTWIERA kartę (info o wymaganiach), wiersz odblokowany → klik
  DODAJE do kolejki.
- **Zamień małą ikonkę „ⓘ" (`sh-info-ic`, dodaną w T2) na WYRAŹNY baner/przycisk z widocznym
  tekstem „Karta"** (nie sam symbol), niezależny od kliknięcia wiersza (`stopPropagation`,
  jak dziś), wołający TĘ SAMĄ funkcję co dziś otwiera podgląd (`act()` — tę samą funkcję,
  tylko już nie podpiętą do kliknięcia całego wiersza, patrz punkt wyżej). Rozmiar/styl:
  mały, ale z czytelnym tekstem "Karta", nie kryptyczna ikonka.

### 2. `gra/src/ui/techTreeView.ts` — sprawdź analogiczne miejsce

T2 dodał tam też ikonkę info (`ttv-info-ic`) na węzłach `.civ-ttv-tn`. Sprawdź czy klik na
węzeł drzewka MA TAKI SAM problem (otwiera kartę zamiast dodać do planu) — jeśli tak,
zastosuj analogiczną zmianę (klik węzła = dodaj do planu, osobny widoczny element „Karta" =
podgląd). Jeśli natomiast klik węzła w drzewku NIGDY nie dodawał bezpośrednio do kolejki
(inny model interakcji niż lista w hubie — np. drzewko może z natury wymagać
otwarcia karty przed wyborem, skoro pokazuje całe drzewo zależności) — zanotuj to jawnie i
NIE zmieniaj tego miejsca bez potwierdzenia, żeby nie zepsuć czegoś czego właściciel nie
zgłosił jako problem. Zrzut właściciela dotyczy WYŁĄCZNIE lewego panelu „Badania"
(scienceHubHud.ts), nie widoku pełnego drzewka.

## Ograniczenia

- To jest wyraźna, jednoznaczna dyspozycja UX od właściciela — nie wymaga dalszego ABC.
- Nie zmieniaj samej karty podglądu (`showTechDiscoveryNotice`/`technologyAdapter.ts`) —
  ten temat dotyczy WYŁĄCZNIE tego, CO wywołuje jej otwarcie, nie jej zawartości. (Uwaga:
  osobny, RÓWNOLEGŁY temat `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` naprawia inny, krytyczny
  bug w samej karcie — przyciski „Rozpocznij badanie"/„Otwórz drzewo" nie działają. Nie
  duplikuj tej naprawy tutaj, to osobny temat.)
- Nie zmieniaj `main.ts`'s `onSelectTech`/`enqueueOrSetPlayerResearchSlug` (już poprawne,
  tylko nie jest dziś wołane z kliknięcia wiersza).

## Branch

`autobot/R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1` (z `main`).
