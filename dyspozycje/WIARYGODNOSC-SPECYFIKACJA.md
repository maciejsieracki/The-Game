# WIARYGODNOŚĆ CYWILIZACJI — SPECYFIKACJA (obowiązująca)

Stan na 2026-07-26. Jedna, czysta specyfikacja do wdrożenia — bez historii zmian, bez „było/jest", bez
anulowanych wariantów. Skondensowana z dokumentu roboczego `PROJEKT-WIARYGODNOSC-CYWILIZACJI.md`
(~1890 linii, powstawał całodniowo warstwami, zawiera sprzeczne wersje tych samych parametrów).

**Zasada rozstrzygania zastosowana przy tworzeniu tego pliku:** tam, gdzie dokument źródłowy zawierał
sprzeczne wersje tego samego parametru, obowiązuje wersja z PÓŹNIEJSZEJ sekcji (korekty były dopisywane
na końcu dokumentu, nie w miejscu oryginału). Sekcje oznaczone w źródle „NADRZĘDNE"/„ZASTĘPUJE"/
„KOREKTA" wygrywają wprost. Lista konkretnych sprzeczności rozstrzygniętych w ten sposób — patrz §10.

Ten plik zawiera też trzy najnowsze decyzje Macieja (2026-07-26, wieczór), których jeszcze nie ma
w dokumencie źródłowym: **C-WIAR-N5KONF=B, C-WIAR-SLAD=A, C-WIAR-WROG=A** — oznaczone przy odpowiednich
punktach.

---

## 1. Czym jest Wiarygodność

| Wymiar | Zakres | Co mierzy | Zmienność | Widoczność |
|---|---|---|---|---|
| **Respekt** | per para, symetryczny | Siła WZGLĘDEM partnera TERAZ (potęga militarno-gospodarcza) | Szybka, liczona na żywo co turę (`computePotegaNacji`, `game/diplomacy.ts:1277`; `computeRespekt`, `:1320`) | Per para |
| **Zaufanie** | per para (`RelacjaDyplomatyczna`) | Jak bardzo Cię TERAZ lubię (nastawienie budowane wspólną historią z TOBĄ) | Średnia — dryf co turę (`tickDiplomacy`) + skoki jednorazowe (`applyDiplomaticEvent`) | Tylko strona pary (`types/diplomacy.ts:59-103`, `main.ts:4116`) |
| **Wiarygodność** | **globalna per cywilizacja** (nie para) | Historia dotrzymywania słowa — fakty, nie sympatie | Wolna — wyłącznie dyskretne zdarzenia „dotrzymał/złamał" + ich stopniowe wygasanie | **Publiczna — widzi ją każda cywilizacja, jawnie, bez warunku kontaktu** |

Zerwanie paktu z jedną cywilizacją dziś obniża Zaufanie WYŁĄCZNIE w relacji z tą stroną — pozostałe
cywilizacje „nic o tym nie wiedzą" mechanicznie. Wiarygodność ma to zmienić: ten sam incydent osłabia
reputację u WSZYSTKICH, bo to fakt o Tobie, nie o jednej relacji.

**Nie mylić z `civ-ai-data.ts`** (`lojalnosc`, `pamietliwosc`, `game/civ-ai-data.ts:54-59`,
`DiplomacyPerNacjaRow`, tagi „Lojalny"/„Zdradziecki" w `diplomacy-display.ts:27-73`, `TAG_RULES`) — to
stałe cechy CHARAKTERU per TYP cywilizacji (np. wszyscy Zulusi mają tę samą wartość z Excela), coś jak
skłonność. Wiarygodność to dynamiczny zapis FAKTYCZNYCH czynów TEJ KONKRETNEJ instancji cywilizacji
w TEJ KONKRETNEJ partii. Nie zastępować jednego drugim.

### Skala i etykiety

**Skala: −100 … +100.** Zero = brak historii (cywilizacja niczego jeszcze nie udowodniła w żadną stronę)
— nie „neutralny", tylko „nieznany".

| Zakres | Etykieta |
|---|---|
| +40 … +100 | **Wzór cnoty** (+100 = szczyt) |
| 0 … +39 | **Uczciwy** |
| −39 … −1 | **Chwiejny** |
| −100 … −40 | **Wiarołomny** |

(0 samo w sobie = „brak historii", nie etykietowane jako „Chwiejny"/„Uczciwy" — traktować jako stan
wyjściowy do interpretacji UI.)

### Wartość startowa — zależna od poziomu trudności

| Poziom | Start | Sens |
|---|---|---|
| **Łatwy** | **+40** | świat zakłada dobre intencje — sojusze dostępne od razu |
| **Normalny** | **+20** | lekki kredyt zaufania |
| **Trudny** | **0** | zero kredytu — próg sojuszu (W≥0) stoi dokładnie na starcie |

Dotyczy gracza I wszystkich AI jednakowo (parytet, WIAR-Q6 zmienione: bez różnicowania per cywilizacja).

### Widoczność i prezentacja

**Jawna zawsze** (WIAR-Q4=A) — Wiarygodność każdej odkrytej cywilizacji widoczna dla gracza od początku,
bez warunku wcześniejszego kontaktu. AI reaguje symetrycznie na reputację gracza.

UI (koncepcja, szczegóły plików w §7):
- **Globalny badge przy nazwie/tytule cywilizacji** — `ui/diplomacyAudience.ts`, obok `da-civtitle`
  (linia 617 dla rozmówcy, 583 dla gracza), NIE w sekcji „Relacje z Tobą" (linie 625-630, tam żyją
  Zaufanie/Respekt — per-parowe). Wizualnie odróżniony od Respektu (inny kolor/ikona).
- **Kolumna w rankingu Potęgi** — `ui/powerOverlayHud.ts:17-22`, `PowerRankingRow`.
- **Tooltip** analogiczny do `respektTooltipPl()` (`diplomacy-display.ts:192-194`).

---

## 2. KARY — tabela N1–N7 (stan ostateczny)

⭐ **ZASADA NADRZĘDNA CAŁEGO MECHANIZMU: żadnej kary bez uprzedzenia.** Gracz nie może stracić
Wiarygodności za czyn, o którego konsekwencji nie został uprzedzony PRZED jego wykonaniem. Każde
zdarzenie karzące wywołane świadomym kliknięciem gracza musi mieć modal/ostrzeżenie z jawnym kosztem
PRZED wykonaniem akcji. Kary naliczane pasywnie (np. N6) muszą mieć czytelny komunikat w momencie
naliczenia. Wdrożenie kary bez ostrzeżenia = niepełne wdrożenie tego projektu.

| # | Zdarzenie | Waga | Uwagi |
|---|---|---|---|
| N1 | **Wypowiedzenie wojny bez ostrzeżenia** | **−10** | Kara za SPOSÓB rozpoczęcia wojny, niezależnie od tego KOGO atakujemy. Patrz mechanika modala niżej. |
| N2 | **Wypowiedzenie wojny mimo aktywnego Paktu o Nieagresji** | **−18** | Kara za to KOMU wypowiadamy wojnę. |
| N2 | **Wypowiedzenie wojny mimo aktywnego Sojuszu** (pełny lub defensywny) | **−25** | jw., większe zobowiązanie = większa kara. Obejmuje też atak na własnego sojusznika. |
| N3 | **Atak w oknie karencji** | **−12 dodatkowo** (na wierzchu N1/N2) | Dwa wyzwalacze — patrz niżej. |
| N4 | **Odmowa pomocy sojusznikowi na wezwanie obowiązku sojuszniczego** | **−15** | Kara WYŁĄCZNIE dla odmawiającego, nigdy dla opuszczonego sojusznika. |
| N5 | **Dobrowolne zerwanie traktatu CZASOWEGO** | **−6** (traktat) / **−4** (umowa handlowa) | Traktat BEZTERMINOWY → **BRAK KARY** za samo zerwanie (patrz N3 niżej — może i tak obowiązywać karencja na atak). |
| N6 | **Niedotrzymanie handlu cyklicznego** (3 tury z rzędu z winy strony) | **−2** | Wymaga naprawy atomowości handlu (§6). Kara wyłącznie dla winnego. |
| N7 | **Nieautoryzowany przemarsz** | **−2 jednorazowo** przy pierwszym wykryciu w danej wizycie (NIE co turę) | Zwiadowcy WYŁĄCZENI. Wymaga modala ostrzegawczego. |

**Maksimum jednorazowe: −35** (sojusznik + brak ostrzeżenia = N1 −10 + N2/sojusz −25).

**Kary się sumują — N1 i N2 to dwa niezależne wymiary** (N1 = *jak* zaczynasz wojnę, N2 = *wobec kogo*):

| Sytuacja | N1 | N2 | Razem |
|---|---|---|---|
| Neutralny, wypowiedziano wojnę, odczekana 1 tura | — | — | **0** |
| Neutralny, atak natychmiastowy | −10 | — | **−10** |
| NAP, wypowiedzenie z karencją | — | −18 | **−18** |
| NAP, atak natychmiastowy | −10 | −18 | **−28** |
| Sojusznik, wypowiedzenie z karencją | — | −25 | **−25** |
| **Sojusznik, atak natychmiastowy** | −10 | −25 | **−35 (maksimum)** |

### N1 — mechanika modala + karencja jednej tury

Stan dzisiejszy = BUG UX niezależny od Wiarygodności: gracz może dziś zaatakować cywilizację spoza stanu
wojny bez ŻADNEGO ostrzeżenia — wojna po prostu się dzieje. Do naprawy niezależnie od tego projektu.

**Docelowo:** kliknięcie ataku na cel spoza wojny (neutralny/pokój/pakt/sojusz) → modal z trzema opcjami:

| Opcja | Skutek |
|---|---|
| „Wypowiedz wojnę" | wojna wypowiedziana, atak NIE następuje w tej turze |
| „Atakuj bez wypowiedzenia" | wojna deklarowana automatycznie + atak natychmiast + kara N1 |
| „Anuluj" | nic się nie dzieje |

Modal MUSI jawnie pokazać pełny rachunek kosztu (np. „Sojusznik + brak ostrzeżenia = −35 Wiarygodności
u WSZYSTKICH cywilizacji") — dotyczy KAŻDEGO wypowiedzenia wojny, także sojusznikowi/partnerowi NAP, nie
tylko neutralnemu.

**Reguła karencji:** po wypowiedzeniu wojny trzeba odczekać JEDNĄ turę. Atak w kolejnej turze i później =
czysty, bez kary N1. Atak w TEJ SAMEJ turze, w której wypowiedziano wojnę = kara N1. Wymaga pola
`wojnaOdTury` w `DiploPairMeta` (`game/diplomacy-pn-engine.ts:20-23`, dziś ma tylko
`trustPnGainedThisTurn`/`dobraWolaRemainingTur`) — ta sama struktura przydaje się do N3.

**Brak obejścia:** atak bez wypowiedzenia i tak deklaruje wojnę z automatu (jak dziś); różnica jest
wyłącznie w karze Wiarygodności.

**Parytet AI:** reguła obowiązuje AI identycznie — AI atakujące w turze wypowiedzenia wojny płaci tę samą
karę; AI nie ma modala (nie klika), ale ma tę samą bramkę czasową w logice decyzji.

**Hak w kodzie:** trzeba namierzyć punkt inicjacji walki w `main.ts` (funkcja rozpoczynająca combat między
dwoma `ownerId`) i sprawdzić, czy dopuszcza atak przy `status !== 'wojna'`. Jeśli silnik już dziś wymusza
wypowiedzenie wojny przed atakiem, N1 nigdy się nie zdarzy — odnotować w meldunku wdrożeniowym, nie
zgadywać.

### N2 — hak w kodzie

✅ ISTNIEJE (Zaufanie), Wiarygodność DOPISAĆ. `main.ts:8510-8521` (`breakTreatiesOnWar(a, b,
breakerIsPlayer)`) → dziś aplikuje `'zlamana_obietnica'`/`'zlamana_obietnica_ai'` do Zaufania przez
`applyDiploEventTracked`. Wywoływane z deklaracji wojny gracza (`main.ts:9031`), AI (`main.ts:14834`),
kaskady obowiązków sojuszniczych (`main.ts:8550`). `BREAK_ON_WAR` w `diplomacy-treaties.ts:239-247`
zawiera oba typy sojuszu. ⚠️ `breakTreatiesOnWar` dziś nie ma jawnego `breakerOwnerId`, tylko flagę bool —
trzeba przekazać, KTÓRY z `a`/`b` jest łamiącym (dostępne u wywołującego).

### N3 — dwa wyzwalacze karencji (rozszerzone, ostateczne)

| Jak zakończyło się porozumienie | Kiedy wolno zaatakować bez kary N3 |
|---|---|
| **Umowa TERMINOWA wygasła naturalnie** | następna tura — zero karencji |
| **Porozumienie BEZTERMINOWE anulowane przez nas** (sojusz, otwarte granice/przemarsz, wasalizacja) | dopiero po 10 turach; atak wcześniej = N3 |
| **Pokój zawarty** (stan po wojnie) | dopiero po 10 turach |

**⚠️ ROZSTRZYGNIĘTE — C-WIAR-N5KONF = B (nowa decyzja, 2026-07-26, jeszcze nie w dokumencie
źródłowym):** rozszerzenie N3 na porozumienia bezterminowe **NIE zmienia N5**. N5 zostaje BEZ ZMIAN:
zerwanie traktatu bezterminowego samo w sobie NIE daje kary — bezterminowe są z natury wypowiadalne.
Rozszerzenie N3 dodaje WYŁĄCZNIE karencję: po jednostronnym zakończeniu porozumienia bezterminowego nie
wolno atakować przez 10 tur; atak wcześniej = N3 (−12), na wierzchu N1/N2. Zasada: **„wypowiedzieć wolno,
uderzyć od razu nie"** — karzemy za zerwanie W CELU ATAKU, nie za samo zerwanie. (To rozstrzyga
sprzeczność opisaną w dokumencie źródłowym jako „NIE ROZSTRZYGNIĘTA" między odczytaniami (a)/(b)/(c) —
obowiązuje odczytanie (b).)

**Weryfikacja w kodzie (wykonana):** `ActiveDeal.wygasaTura: number | null` (`game/diplomacy-treaties.ts:44`)
JEST rozróżnieniem terminowe/bezterminowe — `null` = bezterminowe. Używane przez `expireTreaties`
(`:156`) i `tickDiplomacy` (`game/diplomacy.ts:1438`). Rozkład wg typu traktatu w kodzie dziś:

| Typ traktatu | `wygasaTura` |
|---|---|
| Sojusz (defensywny/pełny, także sojusz sióstr AI↔AI) | **ZAWSZE `null`** (bezterminowy) |
| Otwarte granice / prawo wojskowego przemarszu | **ZAWSZE `null`** (bezterminowe) |
| Wasalizacja/Trybut przez `'wasal'` | **ZAWSZE `null`** (bezterminowa) |
| Wasalizacja/Trybut przez `'trybut_zadanie'`/`'trybut_oferta'` | MIESZANE — zależy od `payload.turns` |
| **Pakt o nieagresji (NAP)** | **ZAWSZE liczba (terminowy)** — `clamp(payload.turns ?? 15, 10, 20)`, 10–20 tur |
| Umowa handlowa | **ZAWSZE liczba (terminowa)** — domyślnie 15 tur, zakres 1–20 |

⚠️ **Niespójność do zgłoszenia — patrz §9** (pytania otwarte): Maciej podał NAP jako przykład
porozumienia „nieczasowego" w cytacie źródłowym, ale w kodzie NAP jest JEDYNYM traktatem, który NIGDY nie
może być bezterminowy. Zakres praktycznego stosowania N3-rozszerzone (poza Sojuszem/Otwartymi
Granicami/Wasalizacją-`wasal`) wymaga potwierdzenia Macieja.

Wymaga zapamiętania per para: tury zakończenia porozumienia, jego typu i kto je zakończył — ta sama
struktura co `wojnaOdTury` (N1) i `pokojOdTury` (poniżej) — **zbudować raz, wspólnie**, jako rozszerzenie
`DiploPairMeta`.

**Hak N3 (pokój):** dziś pokój (`status='pokoj'`) nie jest `ActiveDeal`, nie ma pola „kiedy zawarty".
`'pokoj'` event aplikowany w `main.ts:7703` i `:9049`, bez zapisu KIEDY — dopisać `pokojOdTury?: number`
do `DiploPairMeta`.

**Parytet AI:** identycznie dla gracza i AI — to samo zdarzenie (anulowanie bezterminowego porozumienia +
atak w oknie 10 tur) zaaplikowane z inicjatorem-graczem i inicjatorem-AI musi dać identyczną karę.

### N4 — odmowa pomocy sojusznikowi

**Waga: −15** (C-WIAR-N4=B, podniesiona z pierwotnej propozycji −10). Uzasadnienie: odmowa unieważnia
cały sens sojuszu. Hierarchia: atak na sojusznika (−25) > odmowa pomocy (−15) > dobrowolne zerwanie
traktatu czasowego (−6).

**Mechanika (dwie części):** (1) sojusz zostaje zerwany — już działa dziś (`treatiesBrokenByRefusal()`,
`game/diplomacy-treaties.ts:217-231`, i `applyAllianceObligationsOnWar`, `main.ts:8523-8577`, wykrywają
kto się nie stawił — `brokenTreatyIds`, linia 8560 — i zrywają traktat). (2) karę Wiarygodności ponosi
**WYŁĄCZNIE odmawiający** — dziś nie ma jej wcale, to realna luka.

⚠️ **Krytyczne dla implementacji — asymetria kary:** zerwanie sojuszu ma dwie strony, ale winna jest
jedna. Opuszczony sojusznik NIE MOŻE dostać żadnej kary — jest ofiarą, nie sprawcą. Ryzyko: istniejący
kod może aplikować zdarzenia „symetrycznie" na parę — trzeba jawnie sprawdzić, komu przypisywana jest
wina, i naliczyć odpis tylko jemu. To samo dotyczy N2 i N5 (sprawca ≠ para).

**Do zweryfikowania przy implementacji:** czy AI w ogóle ma dziś ścieżkę odmowy (czy zawsze dołącza) —
jeśli tylko gracz może odmówić, parytet jest złamany.

### N5 — zerwanie dobrowolne, warunkowe

| Rodzaj traktatu | Kara przy zerwaniu |
|---|---|
| **Czasowy** | −6 (traktat) / −4 (umowa handlowa) |
| **Bezterminowy** | **BRAK KARY** (zostaje bez zmian — patrz C-WIAR-N5KONF=B wyżej, N3) |

Hak: `main.ts:8181-8205` (`breakTreatyVoluntarily(dealId)`) → dziś `'zerwanie_traktatu'`/`'zerwanie_handlu'`
przez `applyDiploEventTracked` (linia 8193). Stronę-inicjatora zerwania trzeba ustalić z UI — dziś funkcja
nie rozróżnia kto kliknął „Zerwij" (zakłada gracza); przy AI potrzeba odpowiednika.

### N6 — handel cykliczny: pełny werdykt audytu + decyzje

Domyka wcześniejszą wątpliwość „czy wymiana jest symetryczna". Audyt kodu (`tickCyclicResourceTradeDeals`,
`main.ts` ~8631-8663; `transferSurowiecIlosc`, `game/diplomacy-basket-transfer.ts:210-266`;
`buildHandelSurowiecCykliczny`, `game/diplomacy-proposals.ts:293-326`) — **WERDYKT: CZĘŚCIOWO
ASYMETRYCZNE**, siedem ustaleń:

1. ✅ Pełny brak zapasu (surowiec-za-złoto/Pracę) — SYMETRYCZNE, działa poprawnie: `if (result.moved <= 0)
   continue;` (`main.ts:8652`) pomija też zapłatę.
2. ❌ **BARTER surowiec-za-surowiec — najpoważniejszy bug.** `buildHandelSurowiecCykliczny` tworzy DWA
   NIEZALEŻNE obiekty (A→B i B→A), pętla iteruje po nich niepowiązanie. Brak zapasu u A → item A→B
   pomijany, ale B→A wykonuje się w pełni → strona B oddaje towar za darmo. Dotyczy deali z udziałem
   gracza (AI↔AI nie tworzy barteru).
3. ❌ Zapłata Pracą przy niedoborze kupującego — `setOwnerPracaPool` klampuje odbiorcę do 0, ale dawcy
   dodaje pełną kwotę → **Praca kreowana z niczego** (naruszenie bilansu zasobów, nie tylko asymetria).
4. ❌ Zapłata złotem przy niedoborze kupującego — transfer surowca wykonuje się PRZED sprawdzeniem
   wypłacalności → kupujący dostaje towar za darmo.
5. ❌ Dostawa częściowa — transfer częściowy, a zapłata to stała kwota za cały pakiet → kupujący płaci
   pełną cenę za ułamek dostawy.
6. Licznik nieudanych dostaw NIE ISTNIEJE — do zbudowania od zera (potrzebny pod N6 i P3/finisz).
7. Parytet AI zachowany — brak rozgałęzień `ownerId === 0`.

**Decyzje Macieja:**
- **C-HANDEL-1 = B** — bugi naprawiamy RAZEM z wdrożeniem Wiarygodności, jeden przebieg przez ten sam kod.
- **C-HANDEL-2 = A** — transfer surowca tylko przy wypłacalności kupującego (symetrycznie do braku towaru
  u sprzedawcy). Odrzucone: kredyt kupiecki z długiem, zostawienie jak jest.
- **C-HANDEL-3 — zasada nadrzędna handlu** (cytat Macieja): „Handel zawsze musi się odbywać tylko wtedy,
  kiedy obie strony mają to, co mają dostarczyć. […] Nie ma takiej sytuacji, że jedna strona wysyła,
  a druga nie wysyła. […] Ale karana jest ta, która nie dostarczyła."

Reguły implementacyjne z C-HANDEL-3:
1. **Atomowość** — wymiana dochodzi do skutku W CAŁOŚCI (obie strony) albo NIE DOCHODZI WCALE. Dziś kod
   robi odwrotnie (przesuwa surowiec, potem próbuje zapłatę) — odwrócić kolejność.
2. **Kolejność sprawdzeń** — walidacja OBU stron PRZED jakimkolwiek transferem; transfer tylko jeśli oba
   warunki spełnione.
3. Dotyczy WSZYSTKICH wariantów płatności (złoto, Praca, barter — dwa itemy barteru muszą być SPRZĘGNIĘTE
   w jedną atomową transakcję, nie iterowane osobno).
4. **Dostawa częściowa niedopuszczalna** — albo pełna zadeklarowana ilość, albo transakcja się nie odbywa.
5. Jedyny dopuszczalny scenariusz niepowodzenia: umowa nie dochodzi do skutku w danej turze, OBIE strony
   bez zmian.
6. **Kara (N6) obciąża WYŁĄCZNIE stronę, która nie dostarczyła** — przy barterze mogą być winne obie
   strony naraz (obie bez zapasu tej samej tury), ale strona gotowa nigdy nie jest karana za winę drugiej.
7. Licznik nieudanych dostaw liczy TURY z winy danej strony — nie tury bycia poszkodowanym.
8. Parytet AI — identyczne warunki walidacji/atomowości/kary dla gracza i AI.

⚠️ **Do zweryfikowania testem** (nie zakładać automatycznie): ustalenie 3 („Praca z niczego") powinno
zniknąć samoistnie po naprawie atomowości (walidacja przed transferem) — potwierdzić jawnym testem
w `tools/wiarygodnosc-test.cjs` lub osobnym harnessie handlu cyklicznego.

Status: C-HANDEL-1/2/3 ZATWIERDZONE do realizacji WSPÓLNIE z hakiem N6+finisz P3 (`main.ts:8595-8627` /
~8631-8663, `tickCyclicResourceTradeDeals`) — jeden przebieg przez ten kod, nie dwa osobne.

### N7 — nieautoryzowany przemarsz

**Waga: −2 jednorazowo** przy pierwszym wykryciu w danej „wizycie" (NIE co turę — dzisiejsza kara
Zaufania nalicza się co turę obecności, Wiarygodność ma dostać tylko jednorazowy odpis, inaczej
zdominuje inne zdarzenia). Hak: `game/diplomacy-border-march.ts` + `main.ts:2605`. Dopisać flagę „już
naliczono Wiarygodność dla tej wizyty", `bumpWiarygodnosc` tylko przy przejściu z 0 → >0 tur obecności.

**Wymóg ostrzeżenia:** przy próbie ruchu jednostki na cudze terytorium bez otwartych granic/prawa
przemarszu → modal potwierdzenia z jawnym kosztem („wejście bez zgody: −Zaufanie co turę, −2
Wiarygodności"). Opcje „Wejdź mimo to" / „Anuluj", rozważyć „nie pytaj ponownie w tej wizycie" — koszt
musi być pokazany przynajmniej raz.

**Realna alternatywa wymagana:** gracz musi mieć możliwość wynegocjowania prawa przemarszu, nie tylko
wybór „wejdź i płać"/„zawróć". Prawo wojskowego przemarszu istnieje jako typ propozycji dyplomatycznej
(`diplomacy-proposals.ts`, case `'granice'`, bramka Respektu `progGraniceWojskoweRespekt` — naprawiana
w audycie #46) — **do zweryfikowania przy implementacji**: czy gracz ma do niej dostęp w UI, czy tylko
AI ją proponuje, czego dokładnie brakuje. Jeśli ścieżka istnieje — modal ma do niej odsyłać; jeśli nie —
trzeba ją dorobić (inaczej kara jest nieuczciwa: karzemy za coś, czego nie da się legalnie załatwić).

**Zwiadowcy wykluczeni z OBU kar** — `C-WIAR-SKAUT = A`, decyzja Macieja świadoma i ostateczna: zwiad
nie kosztuje nic — ani Wiarygodności (N7), ani ISTNIEJĄCEJ kary Zaufania za przemarsz. Uzasadnienie:
zwiad to podstawowa mechanika wczesnej gry, blokowanie go dyplomatycznie zablokowałoby eksplorację.
Kryterium rozpoznania „zwiadowcy" musi być oparte na POLU DANYCH w `units.json` (kandydat: rola/kategoria
„Zwiad"), nie na nazwie jednostki (nazwy różnią się między nacjami). Obowiązuje parytet AI — zwiadowcy AI
też wyłączeni. To jedyny zatwierdzony wyjątek od zasady „nie zmieniamy istniejących mechanizmów
Zaufania" — Maciej wyraził zgodę świadomie po przedstawieniu kosztu.

### Odwet — C-WIAR-ODWET = A

Wojna wypowiedziana w ODPOWIEDZI na czyjeś złamanie zobowiązania **nie nalicza N1 ani N2** przez okno
**10 tur** [ZAŁOŻENIE — do strojenia] od tury przewinienia sprawcy (nie od wykrycia).

**Które przewinienia otwierają prawo do odwetu: N1, N2, N4** (napaść, złamanie zobowiązania wojną,
odmowa pomocy). **NIE otwierają: N5–N7** (za drobne — inaczej powstaje luka „sprowokuj przemarsz, dostań
darmową wojnę").

Wymaga zapamiętania kto i kiedy zawinił wobec kogo: pole `ostatniePrzewinienieWobecNas: { turn, typ }`
w `DiploPairMeta` — ta sama struktura co `wojnaOdTury`/`pokojOdTury` — **zbudować raz, wspólnie**.

Parytet AI: AI korzysta z tego samego prawa do odwetu.

---

## 3. NAGRODY — trzy tabele: STRUMIEŃ, FINISZ, CZYNY

Ta sekcja **CAŁKOWICIE ZASTĘPUJE** starą, jednolitą tabelę P1–P5 (jednorazowe wagi +8/+4/+5/+3/+6) —
Maciej odrzucił model „nagroda = jedno zdarzenie jednorazowe" dla strony pozytywnej. Rozróżnienie: **A.
dotrzymywanie W TRAKCIE** trwania zobowiązania (strumień co turę) vs. **B/C. dotrzymanie POZA bieżącym
trwaniem** (jednorazowe — przypięte do końca konkretnego zobowiązania = FINISZ, albo niepowiązane z
żadnym zobowiązaniem = CZYNY).

### Tabela A — STRUMIEŃ (na turę, za każde aktualnie dotrzymywane zobowiązanie)

| # | Zobowiązanie | Na turę |
|---|---|---|
| S1 | Sojusz (pełny lub defensywny) | **+1,0** |
| S2 | Pakt o nieagresji | **+0,5** |
| S3 | Umowa handlowa / handel cykliczny | **+0,3** |
| S4 | Prawo przemarszu / otwarte granice | **+0,2** |

⚠️ **Warunek dla S3:** nalicza się TYLKO przy 100% zrealizowanych dostaw w danej turze — jedna nieudana
dostawa = zero przyrostu tej tury. Spójne z atomowością handlu (C-HANDEL-3, §2).

### Tabela B — FINISZ (jednorazowo, za dotrwanie do zapisanego w traktacie terminu)

| # | Zobowiązanie | Bonus |
|---|---|---|
| P1 | Sojusz dotrwany do końca | **+10** |
| P2 | Pakt o nieagresji dotrwany | **+5** |
| P2 | Umowa handlowa dotrwana | **+5** |
| P3 | Handel cykliczny — 100% dostaw do końca | **+1** |

Hak (P1/P2): `main.ts:8629-8637` (`runDiplomacyTurnTick`) już dziś porównuje `dealsBeforeExpire` z
`activeDeals` po `expireTreaties()` (linie 8630-8636, `game/diplomacy-treaties.ts:155-157`) — cicho
usuwa wygasły traktat, zero eventu. Dopisać wykrycie „ten traktat wygasł NATURALNIE" (nie przez zerwanie
czy wojnę — te usuwane wcześniej, więc nie trafią tu podwójnie) i naliczyć finisz.

### Tabela C — CZYNY (jednorazowo, niepowiązane z żadnym trwającym zobowiązaniem)

| # | Czyn | Wartość |
|---|---|---|
| P5 | Pomoc sojusznikowi w wojnie — dołączenie z własnej woli LUB na wezwanie | **+20** |
| P4 | 30 tur bez prowadzenia wojny (kamień milowy powtarzalny co 30 tur) | **+3** |

Hak (P5): event `'pomoc_sojusznikowi'` istnieje (`game/diplomacy.ts:69-70`, `:722-725`) — zero wywołań.
`applyAllianceObligationsOnWar` (`main.ts:8523-8577`) już wie kto faktycznie dołączył
(`joinedWarOwnerIds.push(allyId)`, linie 8531/8556) — dane już policzone, tylko dopiąć wywołanie.

### Uzasadnienie wartości

- Pomoc sojusznikowi (+20) vs zdrada sojusznika (−25, N2) — niemal symetria: stanięcie przy sojuszniku to
  najmocniejszy dowód wiarygodności, tak jak zdrada jest najmocniejszym dowodem przeciwnym.
- Sojusz +1/turę → po 25 turach odrabia jedną zdradę (−25) — budowanie trwa mniej więcej tak długo, jak
  naprawianie.
- Strumień waży więcej niż finisz przy długich zobowiązaniach (sojusz 30 tur = +30 ze strumienia + 10
  z finiszu) — wytrwałość widoczna CAŁY CZAS, koniec to tylko domknięcie.

### ⚠️ Trwały ślad STRUMIENIA — nowa decyzja C-WIAR-SLAD = A (2026-07-26, jeszcze nie w dokumencie źródłowym)

**Trwały ślad 10% (model zapominania, §4) dotyczy WYŁĄCZNIE zdarzeń jednorazowych** — kar N1–N7 oraz
nagród z tabel FINISZ (B) i CZYNY (C). **Zdarzenia ze STRUMIENIA (tabela A, S1–S4) gasną do ZERA, BEZ
trwałego śladu.** Uzasadnienie: trwały życiorys cywilizacji budują DECYZJE (jednorazowe czyny), nie samo
upływanie czasu w ramach trwającego zobowiązania.

**Konsekwencja implementacyjna — to rozwiązuje ryzyko wydajnościowe odnotowane niżej dla strumienia:**
skoro wpisy strumienia nie potrzebują trwałej podłogi, można je konsolidować i **USUWAĆ po pełnym
wygaśnięciu** (w przeciwieństwie do czynów jednorazowych, które zostają na liście na zawsze). Dokładny
kształt (jeden narastający/gasnący „bieżący ciąg" per para/zobowiązanie zamiast osobnego rekordu na każdą
turę) pozostaje do ustalenia przy implementacji Etapu 0 — ale wymóg trwałej podłogi, który wcześniej
czynił to „twardym wymogiem inżynierskim", odpada.

### Pytania otwarte przeniesione do §9

Kumulacja zobowiązań (limit przyrostu na turę), czy strumień pozytywny działa podczas wojny (pytanie
ODRĘBNE od strumienia Wiarygodność→Zaufanie, patrz §5), czy P4 liczy się globalnie czy per para.

---

## 4. ZAPOMINANIE — model finalny (krzywa z trwałą podłogą 10%)

**Dotyczy WYŁĄCZNIE zdarzeń jednorazowych** (kary N1–N7, nagrody FINISZ + CZYNY) — patrz zastrzeżenie
w §3 o STRUMIENIU (gaśnie do zera, bez podłogi).

Każde zdarzenie jednorazowe gaśnie NIEZALEŻNIE od pozostałych, własnym licznikiem tur, LINIOWO, jako
procent swojej wartości pierwotnej — ale NIE do zera. Krzywa zatrzymuje się na **trwałej podłodze 10%
wartości pierwotnej, która zostaje NA ZAWSZE**, do końca partii. Wiarygodność przestaje być pojedynczą
liczbą — staje się sumą: wartość startowa (wg trudności) + trwałe ślady wszystkich przeszłych zdarzeń
jednorazowych + jeszcze wygasające części zdarzeń świeższych.

### Tabela czasów zapomnienia (wg trudności, kara vs nagroda)

| Poziom trudności | Kary (zdarzenia negatywne) | Nagrody FINISZ/CZYNY (pozytywne) |
|---|---|---|
| **Łatwy** | 40 tur (2,5%/turę) | 120 tur (0,833%/turę) |
| **Normalny** | 80 tur (1,25%/turę) | 80 tur (1,25%/turę) |
| **Trudny** | 120 tur (0,833%/turę) | 40 tur (2,5%/turę) |

Sens odwrócenia — poziom trudności to charakter świata, nie tylko liczba: **Trudny** = świat surowy,
zdradę pamięta 120 tur, przysługę zapomina po 40. **Łatwy** = świat wybaczający, zdradę zapomina po 40,
dobro pamięta 120. **Normalny** = symetryczny (80/80).

### Wzór

```
wartośćBieżąca(zdarzenie, tura) =
    zdarzenie.wartośćPierwotna
    × max(0,10 ; 1 − (tura − zdarzenie.turaWystąpienia) / czasZapomnienia(zdarzenie.znak, poziomTrudności))

Wiarygodność(właściciel, tura) = wartośćStartowa(poziomTrudności)
                                  + Σ wartośćBieżąca(zdarzenie, tura)   dla WSZYSTKICH zdarzeń
                                                                          jednorazowych tego właściciela
                                                                          (nawet dawno wygasłych do podłogi)
```

Mnożnik `max(0,10; …)` nigdy nie schodzi poniżej 0,10 — po `tura − turaWystąpienia ≥ czasZapomnienia`
zdarzenie NIE znika, tylko zamraża się na 10% pierwotnej wartości na zawsze. Rozbicie dla UI (równoważne
matematycznie):

```
Wiarygodność = wartośćStartowa
             + Σ trwałySlad(zdarzenie)          // = 0,10 × wartośćPierwotna, na zawsze po osiągnięciu podłogi
             + Σ aktywnaCzęść(zdarzenie, tura)   // pozostała, jeszcze wygasająca część (0–90% ponad ślad)
```

### Przykłady (wagi z §2/§3 = wartość pierwotna)

| Zdarzenie | Wartość świeża | Trwały ślad po wygaśnięciu |
|---|---|---|
| Wypowiedzenie wojny mimo Sojuszu (N2) | −25 | **−2,5 na zawsze** |
| Wypowiedzenie wojny bez ostrzeżenia (N1) | −10 | **−1,0 na zawsze** |
| Odmowa pomocy sojusznikowi (N4) | −15 | **−1,5 na zawsze** |
| Sojusz dotrwany do końca (FINISZ P1) | +10 | **+1,0 na zawsze** |
| Pomoc sojusznikowi w wojnie (CZYN P5) | +20 | **+2,0 na zawsze** |

### Konsekwencja — stan spoczynku PRZESTAJE być wartością startową

Skoro każde zdarzenie jednorazowe zostawia trwały ślad 10%, naturalnym poziomem po długiej grze jest:

```
wartośćStartowa(poziomTrudności) + suma WSZYSTKICH trwałych śladów nagromadzonych przez całą partię
```

Reputacja przestaje być w pełni odzyskiwalna — życiorys cywilizacji trwale przesuwa punkt równowagi,
nawet gdy świeże zdarzenia dawno wygasły do podłogi.

### Wymagania implementacyjne

1. **Model danych: lista zdarzeń per właściciel, nie jedna liczba.**
   `wiarygodnoscZdarzeniaByOwner: Map<number, CredibilityEventRecord[]>`, gdzie
   `CredibilityEventRecord = { typ: CredibilityEvent; wartoscPierwotna: number; turaWystapienia: number;
   znak: 'kara' | 'nagroda' }` — dla zdarzeń JEDNORAZOWYCH (N1–N7, FINISZ, CZYNY). Osobna, prostsza
   struktura dla STRUMIENIA (§3) — bez trwałej podłogi, konsolidowalna/usuwalna po wygaśnięciu.
2. Bieżąca Wiarygodność to funkcja WYLICZANA z listy (wzór wyżej), nie osobno trzymane pole — inaczej dwa
   źródła prawdy mogą się rozjechać.
3. Zdarzenia jednorazowe NIE są usuwane z listy po osiągnięciu podłogi — zostają aktywnym, trwałym
   wkładem do sumy do końca partii.
4. **Decyzja implementacyjna do podjęcia przez wykonawcę** (nierozstrzygnięta przez Macieja, tylko
   zlecona do zanotowania): czy po osiągnięciu podłogi zdarzenie zostaje w pełnej liście (prostsze, lista
   rośnie przez całą partię) czy jest konsolidowane do `trwałySladSumaByOwner: Map<number, number>`
   (lepsza wydajność, mniejszy save) z osobnym zachowaniem rozbicia WYŁĄCZNIE jeśli UI ma to pokazywać
   w rejestrze czynników. Obie opcje poprawne matematycznie.
5. Czas zapomnienia = funkcja znaku (kara/nagroda) ORAZ poziomu trudności — 6 wartości (3×2): tabela wyżej.
6. **Wszystkie wartości (wagi, czasy, podłoga 10%) = parametry strojeniowe w danych, NIE stałe w
   kodzie** — `DIPLOMACY_PARAMS` (`game/diplomacy.ts:65-242`) lub `gra/data/diplomacy.json`.
7. **Save/load** — lista zdarzeń (lub lista + skonsolidowana suma śladów) MUSI wejść do zapisu gry,
   analogicznie do `aiSkarbiecByOwner` (§7, `main.ts:13268-13332` snapshot / `:17308-17328` restore).
   Rozmiar save rośnie z długością partii — uwzględnić przy testach wydajności.
8. **Parytet AI** — funkcja wyliczająca wartość bieżącą i sumę nie zna `ownerId` (czysta funkcja nad
   listą + numerem tury); `ownerId` służy wyłącznie do wyboru mapy.
9. **UI — silnie zalecane** (nie opcjonalne V2): skoro Wiarygodność już nigdy w pełni nie wraca do
   wartości startowej, gracz musi rozumieć dlaczego. Pokazać rozbicie: „trwały życiorys" (suma śladów,
   na stałe) vs „bieżące uczynki" (świeże, jeszcze wygasające zdarzenia), np. *„zdrada sojusznika: −2,5
   na stałe + jeszcze aktywna kara −6,2 z −25, wygasa za 34 tury"*.
10. **Twarde klamrowanie do −100…+100 jest TERAZ OBOWIĄZKOWE**, nie tylko rekomendacja — na etapie
    WYŚWIETLANIA i WSZĘDZIE tam, gdzie liczba wchodzi do wzorów §5 (strumień do Zaufania, twarde progi).
    Skoro trwałe ślady kumulują się bez naturalnej górnej granicy, wartość może realnie uciec poza zakres
    skali bez klamrowania.

---

## 5. WPŁYW NA ZAUFANIE — cztery dźwignie

### Dźwignia 1 — strumień bezpośredni Wiarygodność → Zaufanie (ZASTĘPUJE mnożnik tempa)

Pierwotny pomysł „mnożnik tempa wzrostu/spadku Zaufania" jest ANULOWANY i zastąpiony bezpośrednim
strumieniem: Wiarygodność nie mnoży już delty Zaufania — zwiększa/zmniejsza je BEZPOŚREDNIO co turę,
niezależnie od pozostałych składników `dZ`.

**Wzór finalny (dzielnik skorygowany z 10 na 20):**

```
ΔZaufanie na turę = Wiarygodność / 20
```

| Wiarygodność | ΔZaufanie/turę |
|---|---|
| +100 | +5,0 |
| +50 | +2,5 |
| +20 | +1,0 |
| 0 | 0 |
| −50 | −2,5 |
| −100 | −5,0 |

Uzasadnienie dzielnika 20 (nie 10): istniejące per-turowe składniki Zaufania razem dają +1…+3
(`tickDiplomacy`, `game/diplomacy.ts:1403-1452`: handel +1, sojusz +3/NAP +2/pokój +1, dobra wola +1,
wspólny wróg +1, religia ±0,5, ekspansja przy granicy −2). Przy /10 strumień dawałby do +10/turę —
trzykrotnie więcej niż wszystko inne razem, dominując cały tick. Przy /20 Wiarygodność pozostaje
NAJSILNIEJSZYM pojedynczym czynnikiem (+5 vs +3 dla sojuszu), ale współgra z resztą.

**C-WIAR-SUMA = A — strumień DODAJE SIĘ**, nie zastępuje żadnego istniejącego składnika `dZ`. Wszystkie
istniejące per-turowe składniki (pokój +1, sojusz +3, NAP +2, handel +1, dobra wola +1, wspólny wróg +1,
religia ±0,5, ekspansja −2) zostają NIETKNIĘTE. Nowy strumień to jeden dodatkowy człon w tej samej sumie
`dZ` w `tickDiplomacy`.

**C-WIAR-WOJNA = B — strumień działa TAKŻE podczas wojny**, w przeciwieństwie do dzisiejszego zachowania
(`resolvePokojTrustTier` zwraca `undefined` przy `atWar`, `game/diplomacy-treaties.ts:281` —
`pokoj_zaufanie_perTura` i cały tier sojusz/nap/pokój zeruje się dziś w wojnie). Nowy strumień ma tę
bramkę OMIJAĆ — wpięty jako osobny składnik `dZ`, niezależny od `resolvePokojTrustTier`.

**⚠️ C-WIAR-WROG = A — nowa decyzja (2026-07-26, jeszcze nie w dokumencie źródłowym), rozstrzyga
wcześniej otwarte podpytanie:** strumień Wiarygodność→Zaufanie **NIE działa wobec pary, z którą
AKTUALNIE trwa wojna** — wobec WSZYSTKICH pozostałych działa normalnie, niezależnie od tego, że gdzieś
indziej toczy się wojna. Innymi słowy: wojna z cywilizacją X blokuje przyrost strumienia TYLKO w relacji
z X; wszystkie inne relacje (w tym z sojusznikami, z którymi nie ma wojny) dostają strumień normalnie,
także w trakcie tej wojny z X.

**Zakres par:** tylko odkryte (`diplomaticallyDiscoveredOwners`, bramka `main.ts:14757-14760`). Dla
AI↔AI dyplomacja ma dziś węższy zakres niż gracz↔AI (`AUDYT-PARYTET-AI-2026-07-24.md` pkt 3) — to samo
ograniczenie dotyczy nowego strumienia.

**Parametr strojeniowy:** `wiarygodnoscZaufanieDzielnikPerTura: 20` w `DIPLOMACY_PARAMS`
(`game/diplomacy.ts:65-242`, sekcja „per-turn Zaufanie deltas", linie 100-122), lub odpowiadający wpis
w `gra/data/diplomacy.json`.

**Klamrowanie wyniku:** istniejący `clamp(zaufanie + dZ, 0, 100)` (`game/diplomacy.ts:1442`) obsługuje
każdą wielkość `dZ` automatycznie — nie trzeba nowego klampowania w `tickDiplomacy`.

**Miejsce integracji:** prawdopodobnie nowy opcjonalny parametr `wiarygodnoscSelf?: number` w `TickCtx`
(`game/diplomacy.ts:1356-1378`), dodający `wiarygodnoscSelf/20` do `dZ`.

### Dźwignia 2 — wpływ na istniejący SUFIT Zaufania

⚠️ **NIE PROJEKTUJEMY nowego sufitu ani nie ruszamy mechaniki Zaufania.** Sufit zaufania i ochrona przed
kupowaniem go darami JUŻ ISTNIEJĄ i działają — zostają nietknięte. Rola Wiarygodności: wchodzi jako
WEJŚCIE do istniejącego mechanizmu sufitu, obniżając go dla cywilizacji o złej reputacji. Implementacja:
znaleźć miejsce, gdzie sufit zaufania jest dziś wyliczany, i dołożyć tam człon zależny od W — bez zmiany
reszty wzoru i bez dotykania pozostałych ścieżek zaufania.

**⚠️ Jeśli w trakcie implementacji okaże się, że ta dźwignia wymaga przebudowy Zaufania — ZATRZYMAJ SIĘ
i zapytaj Macieja**, zamiast przebudowywać.

### Dźwignia 3 — twarde progi blokujące

Poniżej wartości AI odmawia z zasady, bez negocjacji, NIEZALEŻNIE od Zaufania i Respektu:

- **Sojusz** wymaga **W ≥ 0**
- **Pakt o nieagresji** wymaga **W ≥ −40**

⚠️ Uwaga dla wykonawcy: wcześniejsza wersja tego samego pomysłu (WIAR-Q3, §4.2 pierwotne) wskazywała
jako drugą bramkę Wasalizację/żądanie Trybutu (nie NAP), z progami na starej skali 0–100. Powyższe dwie
bramki (Sojusz, NAP) pochodzą z późniejszej, nadrzędnej sekcji źródła i są wersją obowiązującą — ale
rozbieżność między „Trybut" a „NAP" jako drugą bramką nie została w źródle wprost wyjaśniona. Jeśli przy
implementacji okaże się to istotne, potwierdzić z Maciejem, czy bramka na Wasalizację/Trybut ma również
powstać OBOK bramki NAP, czy zamiast niej.

Hak: `ProposalEvalContext` (`game/diplomacy-proposals.ts:115-140`) dostaje pola `proposerWiarygodnosc?:
number`, `responderWiarygodnosc?: number`, wypełniane w `buildProposalEvalContext` (`main.ts:8697-8738`)
tą samą funkcją, co dziś liczy `proposerRespekt`/`responderRespekt` (linie 8701-8702). Bramka sojuszu:
`game/diplomacy-proposals.ts:371-420` (case `'sojusz_defensywny'`/`'sojusz_pelny'`), warunek PRZED
istniejącymi sprawdzeniami Zaufania/Relacji (linie 398-412).

### Dźwignia 4 — pierwszy kontakt

Startowe nastawienie nowo spotkanej cywilizacji zależy od globalnej Wiarygodności gracza — zdrada na
drugim końcu mapy oznacza chłodne powitanie u nowego sąsiada. To realizuje sens decyzji „globalna" —
bez tego Wiarygodność byłaby drugą kopią Zaufania.

### Status dźwigni 2–4 przy nowym strumieniu

Dźwignie 2, 3, 4 NIE są ruszane przez wprowadzenie Dźwigni 1 (strumienia) — zostają w mocy równolegle.
Czy wymagają dodatkowego przeglądu w świetle nowego strumienia (zwłaszcza Dźwignia 2, koncepcyjnie
bliska nowemu mechanizmowi) — patrz pytania otwarte, §9.

---

## 6. ZASADY NADRZĘDNE (obowiązują CAŁY mechanizm)

1. **Żadnej kary bez uprzedzenia** — patrz §2. Modal/ostrzeżenie z jawnym kosztem PRZED akcją gracza;
   czytelny komunikat w momencie naliczenia kar pasywnych.
2. **Parytet AI** — mechanizm musi działać identycznie dla gracza (`ownerId=0`) i każdego AI
   (`ownerId≠0`), kod ownerId-agnostyczny, zero gałęzi `if (ownerId===0)`.
   - **Przechowywanie: jedna wspólna mapa, nie osobne pola gracza/AI.** Wzorzec `aiSkarbiecByOwner`
     (`main.ts:4140`, `Map<number, number>`) — ALE **REKOMENDACJA: jedna mapa
     `wiarygodnoscByOwner`/`wiarygodnoscZdarzeniaByOwner: Map<number, …>` obejmująca TAKŻE `ownerId=0`**,
     bez osobnego pola na graczu (nie powielać rozgałęzienia `ownerId === 0 ? player.skarbiec :
     aiSkarbiecByOwner.get(ownerId)` z `main.ts:12136-12141` — Wiarygodność nie ma dziś żadnego pola na
     `player`, więc nie ma czego naśladować).
   - **Waga zdarzenia NIE różni się gracz/AI** — w przeciwieństwie do dzisiejszej kary Zaufania
     (`zlamanaPaktGracz_zaufanie=-40` vs `zlamanaPaktAI_zaufanie=-20`, `game/diplomacy.ts:76-78`,
     świadoma asymetria specyficzna dla Zaufania per-parowego). Wiarygodność jako publiczna, globalna
     metryka karze/nagradza JEDNAKOWO niezależnie kto złamał słowo.
   - Wszystkie haki zdarzeń już dziś przyjmują `ownerId` jako goły parametr (`breakTreatiesOnWar`,
     `breakTreatyVoluntarily`, `applyAllianceObligationsOnWar`, `tickCyclicResourceTradeDeals` —
     wszystkie ownerId-agnostyczne w otaczającej funkcji) — dopisanie wywołania Wiarygodności w tych
     miejscach jest z definicji ownerId-agnostyczne.
   - AI musi reagować na Wiarygodność gracza I na wiarygodność innych AI, tą samą ścieżką
     (`buildProposalEvalContext`, `main.ts:8697-8738`, już dziś liczy dla DOWOLNEJ pary
     `proposerId`/`responderId`).
   - **Test parytetu obowiązkowy:** ten sam event zaaplikowany raz z `ownerId=0`, raz z `ownerId=N`, musi
     dać identyczną deltę Wiarygodności / identyczny wpływ na Zaufanie.
3. **Kara tylko dla winnego, nigdy dla ofiary** — dotyczy N2 (sprawca ≠ para), N4 (odmawiający ≠ opuszczony
   sojusznik), N5 (inicjator zerwania), N6 (strona, która nie dostarczyła, przy barterze możliwe że obie
   winne jednocześnie, ale nigdy strona gotowa do dostawy).
4. **Atomowość handlu** — patrz C-HANDEL-3 w §2 (N6): wymiana w całości albo wcale, walidacja obu stron
   przed transferem, zero stanów pośrednich, zero dostaw częściowych.
5. **Zwiadowcy wyłączeni z obu kar** (Wiarygodność N7 + istniejąca kara Zaufania za przemarsz) —
   `C-WIAR-SKAUT=A`, jedyny zatwierdzony wyjątek od zasady „nie zmieniamy istniejących mechanizmów".
6. **Odwet nie karze** — N1/N2 nie naliczane przez 10 tur od cudzego N1/N2/N4 wobec nas (`C-WIAR-ODWET=A`).
7. **N3 rozszerzone karze za ATAK, nie za samo zakończenie porozumienia** — `C-WIAR-N5KONF=B`: „wypowiedzieć
   wolno, uderzyć od razu nie".
8. **Nie zmieniamy istniejących mechanizmów Zaufania poza jawnie zleconymi punktami** (dźwignie, konkretne
   dopisane haki). Jeśli implementacja wymaga więcej — zatrzymać się i zapytać Macieja, nie przebudowywać
   samodzielnie.
9. **Przy niejednoznaczności lub sprzecznych danych — pytać, nie zgadywać** (zasada nadrzędna repo Civ).

---

## 7. WYMAGANIA IMPLEMENTACYJNE

### Struktury danych

- **Nowy plik** `game/diplomacy-credibility.ts` (pure moduł, wzorowany na `game/diplomacy-factors.ts` —
  zero DOM/THREE, zero side-effects):
  - `type WiarygodnoscBand = 'wiarolomny' | 'chwiejny' | 'uczciwy' | 'wzor_cnoty'`
  - `function wiarygodnoscBand(w: number): WiarygodnoscBand` + `function wiarygodnoscLabelPl(w: number):
    string` (4 etykiety §1, na skali −100…+100)
  - `type CredibilityEvent = 'wypowiedzenie_wojny_bez_ostrzezenia' | 'zlamanie_paktu_nap' |
    'zlamanie_paktu_sojusz' | 'atak_w_oknie_karencji' | 'odmowa_obowiazku_sojuszu' |
    'zerwanie_dobrowolne_traktat' | 'zerwanie_dobrowolne_handel' | 'niedotrzymanie_handlu_cyklicznego' |
    'nieautoryzowany_przemarsz' | 'dotrwanie_sojuszu' | 'dotrwanie_nap' | 'dotrwanie_handlu' |
    'splata_handlu_cyklicznego' | 'wieloletni_pokoj' | 'pomoc_sojusznikowi_realna'` (nazwy do
    doprecyzowania przy implementacji — powyższe wynikają z tabel §2/§3)
  - `function applyCredibilityEvent(...)`, `function wartoscBiezaca(zdarzenie, tura, poziomTrudnosci):
    number` (wzór §4), `function sumaWiarygodnosci(zdarzenia[], startowa, tura, poziomTrudnosci): number`
    (klamrowana do −100…+100)
  - `function strumienWiarygodnoscDoZaufania(wiarygodnosc: number): number` (wzór §5, `/20`)
- **`wiarygodnoscZdarzeniaByOwner: Map<number, CredibilityEventRecord[]>`** dla zdarzeń jednorazowych
  (N1–N7, FINISZ, CZYNY) — zastępuje pierwotny prostszy plan „jedna liczba + licznik blizny".
- Osobna, prostsza struktura dla wpisów STRUMIENIA (S1–S4) — bez trwałej podłogi, konsolidowalna/usuwalna
  po zakończeniu zobowiązania (patrz §3).
- Rozszerzyć `DIPLOMACY_PARAMS` (`game/diplomacy.ts:65-242`) o wszystkie wagi z §2/§3, czasy zapomnienia,
  podłogę 10%, dzielnik 20, progi twarde — jako osobne stałe, eksportowane też do
  `gra/data/diplomacy.json` przez Panel-D Excela (poza zakresem tego dokumentu, zaznaczyć w kodzie).

### Nowe pola w `DiploPairMeta` (`game/diplomacy-pn-engine.ts:20-23`, dziś tylko
`trustPnGainedThisTurn`/`dobraWolaRemainingTur`) — budować RAZ, WSPÓLNIE:

- `wojnaOdTury?: number` (N1 — karencja jednej tury po wypowiedzeniu wojny)
- `pokojOdTury?: number` (N3 — atak zaraz po pokoju)
- pole zakończenia porozumienia bezterminowego: typ + kto + kiedy (N3 rozszerzone)
- `ostatniePrzewinienieWobecNas?: { turn: number; typ: CredibilityEvent }` (odwet)
- licznik `turyPokojuZRzedu?: number` (CZYN P4, wieloletni pokój — jeśli per para; patrz pytanie otwarte
  §9 o zasięgu globalnym/per para)

### Save/load

- **Snapshot** (`main.ts:13268-13332`, blok `meta:{...}`) — dopisać `Array.from(...)` dla
  `wiarygodnoscZdarzeniaByOwner` i struktury strumienia, wzorem `aiSkarbiecByOwner: Array.from(...)`
  (`main.ts:13332`).
- **Restore** (`main.ts:17308-17328`) — mirror wzorca `aiSkarbiecByOwner` (linie 17311-17314).
- **Czyszczenie przy eliminacji cywilizacji** — `main.ts:12397-12404` już czyści analogiczne mapy dla
  wyeliminowanego `ownerId` — dopisać tamże.
- **Reset nowej gry** — wszystkie miejsca z `diplomacyRelations.clear()` bez odpowiadającego restore
  (`main.ts:16132, 16381, 16606, 16805`) potrzebują też czyszczenia nowych map Wiarygodności.

### UI

- **Audiencja** (`ui/diplomacyAudience.ts`) — globalny badge przy `da-civtitle` gracza (linia 583)
  i rozmówcy (linia 617), NIE w sekcji „Relacje z Tobą" (linie 625-630). Nowa funkcja
  `wiarygodnoscBadgeHtml(value: number): string`, tooltip z etykietą pasma + rozbicie „trwały życiorys"
  vs „bieżące uczynki" (§4, silnie zalecane).
- **Panel relacji** (`ui/diplomacyPanel.ts`) — `renderRow` (linie 202-229), dopisać wartość do `cd-stats`
  (linia 212-214) albo osobny badge.
- **Ranking Potęgi** (`ui/powerOverlayHud.ts`) — `PowerRankingRow` (linie 17-22), opcjonalne pole
  `wiarygodnosc?: number`.
- **Tooltip** — `wiarygodnoscTooltipPl()` w `diplomacy-display.ts`, analogiczna do `respektTooltipPl()`
  (linie 192-194).
- **Rejestr czynników** — analogicznie do `buildRelationBreakdown` (`game/diplomacy-factors.ts:147-188`)
  — globalny rejestr per cywilizacja pokazujący „za co Twoja Wiarygodność jest taka, jaka jest" (ten sam
  wzorzec co `diplomacyFactorLog`, `main.ts:4125`) — teraz silnie zalecane, nie opcjonalne V2, ze względu
  na model z trwałą podłogą (§4, punkt 9).

### Testy (bramki)

- `npx tsc --noEmit` = 0 błędów (z katalogu `gra`).
- Nowy harness `tools/wiarygodnosc-test.cjs` (wzorem `tools/tech-tree-test.cjs`), pokrywający:
  - klamrowanie wyniku do [−100,100] dla skrajnych wartości i sum;
  - krzywą zapominania: wartość w chwili 0 = pełna, w chwili ≥czasZapomnienia = dokładnie 10% (podłoga),
    liniowość pomiędzy;
  - `wiarygodnoscLabelPl`/`wiarygodnoscBand` na granicach pasm (−40/−39, −1/0, 39/40);
  - save/load roundtrip listy zdarzeń;
  - **test parytetu** (kluczowy): ten sam event z `ownerId=0` i `ownerId=N` daje identyczną deltę;
  - test atomowości handlu cyklicznego (C-HANDEL-2/3) i zniknięcia bugu „Praca z niczego" (N6, §2).
- Test manualny (playtest, po UI): (a) zerwij traktat jako gracz → Wiarygodność spada, widoczna u
  WSZYSTKICH odkrytych AI (nie tylko partnera) — test odróżniający Wiarygodność od Zaufania; (b) AI
  o niskiej Wiarygodności ma trudniej zawrzeć sojusz z innym AI (parytet); (c) dotrwanie NAP do końca
  podnosi Wiarygodność (strumień + finisz); (d) save/load zachowuje wartość i listę zdarzeń.

---

## 8. HAKI ZDARZEŃ — status w kodzie

Duża część zdarzeń, których Wiarygodność ma dotyczyć, jest dziś w kodzie zdefiniowana jako TYP, ale
NIGDY nie wywoływana (`'zdrada'`, `'wspolny_wrog'`, `'pomoc_sojusznikowi'`, zero wywołań w `main.ts`,
zweryfikowane grepem). Część haków trzeba dopiero dobudować, nie tylko podłączyć się pod istniejące.

| Zdarzenie | Status | Plik : funkcja |
|---|---|---|
| N1 (wypowiedzenie bez ostrzeżenia) | ❌ NOWY HAK — wymaga namierzenia punktu inicjacji walki | brak dziś rozróżnienia „zaatakowałem bez ostrzeżenia" |
| N2 (złamanie NAP/sojuszu wojną) | ✅ ISTNIEJE dla Zaufania, dopisać Wiarygodność | `main.ts:8510-8521` `breakTreatiesOnWar` |
| N3 (atak w oknie karencji) | ❌ NOWY HAK — brak pola „kiedy" | `DiploPairMeta` rozszerzyć (`game/diplomacy-pn-engine.ts:20-23`); `'pokoj'` w `main.ts:7703`, `:9049` |
| N4 (odmowa pomocy) | ❌ NOWY HAK (wykrycie już jest, kara nie) | `game/diplomacy-treaties.ts:217-231` `treatiesBrokenByRefusal`; `main.ts:8523-8577` |
| N5 (zerwanie dobrowolne) | ✅ ISTNIEJE dla Zaufania, dopisać Wiarygodność | `main.ts:8181-8205` `breakTreatyVoluntarily` |
| N6 (handel cykliczny — kara) | ❌ NOWY HAK + naprawa atomowości | `main.ts` ~8631-8663 `tickCyclicResourceTradeDeals` |
| N7 (przemarsz) | ✅ ISTNIEJE dla Zaufania (per turę), Wiarygodność jednorazowo | `game/diplomacy-border-march.ts`, `main.ts:2605` |
| S1–S4 (strumień pozytywny) | ❌ NOWE HAKI | wpiąć w cykl tur, warunkowo dla S3 na wyniku `tickCyclicResourceTradeDeals` |
| P1/P2 (finisz sojusz/NAP/handel) | ❌ NOWY HAK | `main.ts:8629-8637` `runDiplomacyTurnTick`, porównanie `dealsBeforeExpire` |
| P3 (finisz handel cykliczny 100%) | ❌ NOWY HAK, wymaga licznika dostaw | jw., wspólnie z N6 |
| P4 (30 tur bez wojny) | ❌ NOWY HAK, wymaga licznika kolejnych tur pokoju | wzorem zaniku `urazyHistoryczne` co 20 tur, `game/diplomacy.ts:1425-1433` |
| P5 (pomoc sojusznikowi) | ❌ NOWY HAK, dane już policzone | `main.ts:8523-8577`, `joinedWarOwnerIds.push`, linie 8531/8556 |
| Strumień Wiarygodność→Zaufanie (§5) | ❌ NOWY HAK | `tickDiplomacy`, `game/diplomacy.ts:1403-1452`, nowy składnik `dZ` |
| Sufit Zaufania (Dźwignia 2) | ❌ NOWY HAK, znaleźć istniejące miejsce liczenia sufitu | do namierzenia przy implementacji |
| Twarde progi (Dźwignia 3) | ❌ NOWY HAK | `game/diplomacy-proposals.ts:371-420` (sojusz), bramka NAP do namierzenia analogicznie |
| Pierwszy kontakt (Dźwignia 4) | ❌ NOWY HAK | miejsce nawiązania kontaktu dyplomatycznego, do namierzenia |

**Zdarzenia świadomie POMINIĘTE** (poza zakresem tego projektu): szpiegostwo wykryte (brak systemu
szpiegostwa w grze), ultimatum spełnione/bezpodstawne (event zdefiniowany, zero wywołań, Maciej nie
wymienił jako kandydata).

---

## 9. PYTANIA OTWARTE

### ✅ ODPOWIEDZIANE 2026-07-26 (paczka 1/4) — wdrażać zgodnie z tym

- **§9.2 kumulacja przyrostu strumienia = C — BEZ LIMITU.** Przyrosty Wiarygodności z jednocześnie
  utrzymywanych zobowiązań sumują się bez sufitu na turę (Sojusz + pakt + handel = +1,8 pkt
  Wiarygodności na turę z jednym partnerem; przy pięciu partnerach ponad +3 pkt/turę). Właściciel
  świadomie przyjmuje, że sufit +100 pkt jest osiągalny w ~30 tur przy intensywnej dyplomacji.
  **Konsekwencja do obserwacji w playteście:** uczciwi gracze szybko siadają na suficie, więc
  różnicowanie przenosi się na stronę kar. Nie dokładać limitu bez nowej decyzji.
- **§9.3 „30 tur bez wojny" (CZYN P4) = A — GLOBALNIE.** Jeden licznik: 30 tur bez wojny
  z kimkolwiek. Spójne z globalnym zasięgiem Wiarygodności (WIAR-Q1 = A). Każda wojna — także
  obronna i wynikająca z sojuszu — zeruje licznik.
- **§9.4 strumień POZYTYWNY podczas wojny = A — DZIAŁA NORMALNIE.** Dotrzymywanie zobowiązań wobec
  stron niezaangażowanych nalicza Wiarygodność także w trakcie wojny. Spójne z C-WIAR-WOJNA = B.

- **§9.1 pakt o nieagresji — decyzja właściciela (jego słowa):** „powinna być opcja zarówno
  terminowego zawarcia paktu o nieagresji, jak i bezterminowego." → gracz wybiera przy zawieraniu:
  **wariant terminowy (10–20 tur)** albo **bezterminowy**. Bezterminowy jest drugą twardą bramką
  Dźwigni 3 (patrz §9.10) i podlega karze N3-rozszerzonej przy zerwaniu.
- **§9.6 kumulacja trwałych śladów = A — BEZ LIMITU.** Suma trwałych śladów nie ma dna: 10 zdrad
  sojusznika × (−2,5 pkt) = −25 pkt na stałe, 40 zdrad = −100 pkt (dno skali) z samych śladów.
  Seryjny zdrajca ma trwale zrujnowaną reputację — świadomy wybór właściciela.
- **§9.10 druga twarda bramka Dźwigni 3 = A — PAKT O NIEAGRESJI** (nie wasalizacja/trybut).
- **§9.5 dźwignie 2–4 = C — PRZEGLĄD WSZYSTKICH TRZECH** przed wdrożeniem strumienia (Dźwignia 1).
  Sufit Zaufania (2), twarde progi (3) i modyfikator pierwszego kontaktu (4) mają zostać przejrzane
  w świetle nowego strumienia, żeby nie karać reputacji dwa razy za to samo. **To blokuje start
  implementacji Dźwigni 1** — przegląd najpierw.

- **§9.7 skrajne wartości Zaufania = A — PROSTE PRZYCIĘCIE 0–100.** Bez malejącego przyrostu przy
  granicach i bez bufora nadwyżki. Wracamy do tematu tylko wtedy, gdy playtest pokaże, że wszyscy
  partnerzy siedzą na maksymalnym Zaufaniu (przy §9.2 = bez limitu przyrostu zobaczymy to szybko).
- **§9.8 i §9.9 — rozstrzygnięcia techniczne integratora** (właściciel zgodził się, żeby nie zajmować
  nimi jego czasu; gdyby miał inne zdanie, wystarczy powiedzieć):
  - **§9.8 zaokrąglanie:** wartości ułamkowe strumienia **akumulujemy jako ułamek**, tak jak działa
    dziś `wspolnaReligia_zaufanie_perTura = 0,5` — zero zaokrąglania na wejściu, zaokrąglenie tylko
    przy wyświetlaniu (wspólny `formatLiczbaPl`, patrz commit 6667cfa).
  - **§9.9 odświeżanie W:** wartość Wiarygodności liczona **na żywo raz na turę**, tuż przed
    `tickDiplomacy`, bez osobnego cache — lista zdarzeń jest krótka (jedno zdarzenie na czyn), więc
    koszt jest pomijalny, a cache wymagałby jawnego miejsca unieważniania przy każdym nowym zdarzeniu.

### Nadal nierozstrzygnięte — nie zgadywać, nie wdrażać, dopóki Maciej nie odpowie.

1. **Niespójność „NAP jako bezterminowy".** W kodzie NAP ZAWSZE ma termin (10–20 tur) — przykład Macieja
   o „bezterminowym pakcie o nieagresji" (cytat przy N3 rozszerzone, §2) nie ma dziś odpowiednika.
   Bezterminowe są dziś tylko: Sojusz, Otwarte Granice/Prawo Przemarszu, Wasalizacja przez `'wasal'`.
   Do potwierdzenia: czy N3-rozszerzone i twarde progi (Dźwignia 3, NAP jako druga bramka) mają w praktyce
   dotyczyć innego zestawu traktatów niż dosłowny przykład Macieja sugerował.
2. **Kumulacja zobowiązań w strumieniu (§3).** Sojusz + pakt + handel jednocześnie = +1,8/turę. Przy
   pięciu partnerach łatwo przekroczyć +3/turę → maksimum osiągalne w ~30 tur, po czym wszyscy uczciwi
   partnerzy siedzą na suficie i mechanizm przestaje różnicować. Warianty: (a) limit łącznego przyrostu
   na turę, (b) malejące przyrosty przy wielu jednoczesnych umowach, (c) bez limitu.
3. **Czy „30 tur bez wojny" (CZYN P4) liczy się globalnie (żadnej wojny z nikim) czy per para** (30 tur
   bez wojny z KONKRETNĄ stroną)? Skoro Wiarygodność jest globalna (WIAR-Q1=A), zasadność „per para"
   wymaga potwierdzenia.
4. **Czy strumień POZYTYWNY (S1–S4, zasila listę Wiarygodności) działa podczas wojny?** Odrębne pytanie
   od strumienia Wiarygodność→Zaufanie (ten już rozstrzygnięty, C-WIAR-WOJNA=B + C-WIAR-WROG=A) — nie
   zakładać automatycznie tej samej odpowiedzi bez potwierdzenia.
5. **Los Dźwigni 2–4 razem z nowym strumieniem Dźwigni 1.** Dokument źródłowy stwierdza, że nie są
   ruszane, ale jednocześnie flaguje to jako pytanie do potwierdzenia — zwłaszcza Dźwignia 2 (sufit
   Zaufania), koncepcyjnie bliska nowemu strumieniowi (obie dotyczą tego, jak Wiarygodność ogranicza
   Zaufanie). Czy wymagają przeglądu w świetle nowego mechanizmu?
6. **Kumulacja trwałych śladów bez limitu (§4).** 10 zdrad sojusznika × (−2,5 trwałego śladu) = −25 na
   stałe; 40 takich zdrad = −100 (dno skali) wyłącznie ze śladów, bez żadnego świeżego zdarzenia. Czy to
   zamierzone (seryjny zdrajca ma trwale zrujnowaną reputację) czy potrzebny górny/dolny limit na SUMĘ
   trwałych śladów?
7. **Sufit/podłoga Zaufania przy skrajnych wartościach strumienia** — czy przy Wiarygodności bliskiej
   ±100 chcemy czegoś subtelniejszego niż prosty `clamp(0,100)` (np. malejący krańcowy przyrost blisko
   granic)? Brak dziś mechanizmu diminishing returns w `tickDiplomacy`.
8. **Zaokrąglanie ułamkowych wartości strumienia** (np. W=+10 → +0,5/turę) — akumulować jako ułamek (jak
   dziś `wspolnaReligia_zaufanie_perTura=0.5`) czy zaokrąglać? Prawdopodobnie nieproblematyczne, ale
   niepotwierdzone.
9. **Miejsce odświeżania wartości W dla strumienia Wiarygodność→Zaufanie** — czytać W wyliczone NA ŻYWO
   z listy zdarzeń co turę (kosztowniej, zawsze aktualne) czy z wartości cache'owanej raz na turę
   (taniej, wymaga jawnego miejsca odświeżenia przed `tickDiplomacy` dla wszystkich par)?
10. **Waga bramki 2 Dźwigni 3 — NAP czy Wasalizacja/Trybut?** Patrz zastrzeżenie w §5 — źródło zawiera
    dwie różne wersje drugiej twardej bramki bez wyraźnego pojednania.

---

## 10. STATUS

### Komplet decyzji Macieja (chronologicznie, stan ostateczny stosowany w tym dokumencie)

| Decyzja | Wynik |
|---|---|
| WIAR-Q1 (zasięg) | **A — globalna per cywilizacja** |
| WIAR-Q2/Q3 (regeneracja / wpływ na Zaufanie) | zastąpione modelem finalnym (§4, §5) — patrz niżej |
| WIAR-Q4 (widoczność) | **A — jawna zawsze** |
| WIAR-Q5 (surowość) | **B — umiarkowanie** (zdrada boli, ale reputacja odbudowywalna) |
| WIAR-Q6 (start) | zmienione: **zależny od trudności** (+40/+20/0), nie „wszyscy 70" |
| Skala | **−100…+100** (nie 0–100) |
| C-WIAR-N4 | **B — odmowa pomocy sojusznikowi: −15** |
| C-WIAR-SKAUT | **A — zwiadowcy wyłączeni z obu kar** |
| C-WIAR-ODWET | **A — odwet nie karze N1/N2 przez 10 tur** |
| C-HANDEL-1/2/3 | **B / A / zasada atomowości** — naprawa handlu RAZEM z Wiarygodnością |
| C-WIAR-KRZYWA | **A — krzywa liniowa z trwałą podłogą 10%, NIE do zera** |
| C-WIAR-TEMPO | **40/80/120 tur** (kara/nagroda wg trudności) |
| C-WIAR-SKALA | **dzielnik strumienia Zaufania = 20** (nie 10) |
| C-WIAR-WOJNA | **B — strumień działa też podczas wojny** (z niezaangażowanymi stronami) |
| C-WIAR-SUMA | **A — strumień dodaje się** do istniejących składników `dZ` |
| Strona pozytywna | **STRUMIEŃ (S1–S4) + FINISZ (P1–P3) + CZYNY (P4/P5)** — zastępuje starą tabelę P1–P5 |
| **C-WIAR-N5KONF** (nowa) | **B — N5 bez zmian; N3-rozszerzone karze tylko atak w oknie 10 tur, nie samo zerwanie bezterminowego porozumienia** |
| **C-WIAR-SLAD** (nowa) | **A — trwały ślad 10% tylko od CZYNÓW jednorazowych (kary + FINISZ + CZYNY); STRUMIEŃ gaśnie do zera** |
| **C-WIAR-WROG** (nowa) | **A — strumień Wiarygodność→Zaufanie nie działa wobec aktualnego przeciwnika wojennego, działa normalnie wobec reszty** |

### Co zatwierdzone

Cały model (§1–§8) jest zatwierdzony do implementacji: zasięg globalny, skala −100…+100, start wg
trudności, tabela kar N1–N7 z ostatecznymi wagami i regułami (odwet, sumowanie, modal-ostrzeżenie),
trzy tabele nagród (strumień/finisz/czyny), model zapominania z trwałą podłogą 10% (tylko dla zdarzeń
jednorazowych), cztery dźwignie wpływu na Zaufanie (strumień W/20 + sufit + progi + pierwszy kontakt),
naprawa atomowości handlu cyklicznego razem z wdrożeniem, parytet AI jako zasada nadrzędna wszędzie.

### Co czeka na Macieja

10 pytań z §9 — żadne nie blokuje STARTU prac nad rdzeniem (Etap 0: struktury danych, typy), ale
blokują konkretne haki/dźwignie tam, gdzie są wymienione. Kolejność realizacji: rdzeń → haki kar →
haki nagród → wpływ na Zaufanie → save/load → UI → reakcje AI (wzorem planu etapowego w dokumencie
źródłowym, §7 tamże — role w tym dokumencie nie powtórzone, bo bez zmian merytorycznych).

**Parytet AI obowiązuje wszędzie, bez wyjątków.**

---

*Dokument źródłowy z pełną historią decyzji i uzasadnieniami: `PROJEKT-WIARYGODNOSC-CYWILIZACJI.md`.
W razie rozbieżności OBOWIĄZUJE NINIEJSZA SPECYFIKACJA.*
