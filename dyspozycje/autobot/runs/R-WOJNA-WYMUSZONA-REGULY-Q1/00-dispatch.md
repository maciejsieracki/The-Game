TEMAT:  R-WOJNA-WYMUSZONA-REGULY-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat LOGIKI AI/WOJNY (nie wizualny) — Operator
Sonnet 5 effort=high / Evaluator Sonnet 5 effort=high / Final Control
Sonnet 5 effort=high. Effort podniesiony na obu pierwszych rolach — zmiana
dotyka rdzenia mechanizmu wojny wymuszonej w `main.ts` (bardzo wysokie
ryzyko regresji), dotyka serializacji zapisu gry (nowe pole stanu) i ma
CZTERY częściowo niezależne, częściowo powiązane wymagania.

## WYZWALACZ
Właściciel, zrzut panelu relacji (cywilizacja w stanie wojny jednocześnie z
Inkami, Rzymianami i Sumerami): "Wymuszona wojna czasem powoduje sytuację,
że jedna cywilizacja może mieć nawet trzech przeciwników. Przyjmijmy
zasadę, że jedna cywilizacja wypowiada wojnę Jednej cywilizacji. Jeżeli
jakaś cywilizacja nie ma kogo zaatakować, bo ktoś już prowadzi inną wojnę,
to stara się wypowiedzieć wojnę graczowi. Gracz natomiast też powinien mieć
tylko jedną wojnę z jedną cywilizacją. Na poziomie normal, na poziomie hard
może mieć więcej niż jedną wojnę, a na poziomie easy nikt nie wypowiada
wojny z powodu wojny epoki. Dodatkowo zmieńmy czas wybuchu wojny na 25 tur
od początku epoki, zarówno dla kamienia, jak i dla brązu. Wojna może trwać
do 25 tur, potem ustaje i cywilizacje pomiędzy sobą zawierają pokój,
niezależnie od tego, czy zdobędą jakieś tereny, czy nie."

## RECON (wykonany, nie powtarzaj)

**Zakres: WYŁĄCZNIE Kamień i Brąz** — właściciel nazwał explicite tylko te
dwie epoki dla progu 25 tur. Żelazo (`forced-war-iron.ts`) ma JUŻ dziś
świadomie ODRĘBNY mechanizm (nie licznik tur od startu epoki, tylko
jednorazowe wyzwolenie PRZY AWANSIE do Żelaza + cykliczne po odpoczynku,
`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`) — POZA ZAKRESEM tego dispatchu, nie
dotykaj `forced-war-iron.ts` ani gałęzi Żelaza w `main.ts` bez jawnego
uzasadnienia w raporcie.

**Dzisiejszy próg startu:**
- Kamień: `WOJNA_KAMIEN_WYMUSZONA_START_TURY = 20` (`forced-war-stone.ts:13`),
  sprawdzane jako `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` (`main.ts:28887`)
  — GLOBALNY licznik tur gry, nie "tur od wejścia w epokę". Działa poprawnie
  DLA KAMIENIA WYŁĄCZNIE dlatego, że każda cywilizacja zaczyna grę w
  Kamieniu w turze 0 — global-turn i turns-since-era-start są tu tożsame.
- Brąz: BRAK odpowiednika progu tur. Wyzwolenie jest NATYCHMIASTOWE przy
  awansie do Brązu (`bronzeForceWarPendingOwners`, ustawiane w
  `syncOwnerEraFromResearch` w chwili awansu) — zero opóźnienia. Żeby
  zrealizować "25 tur od początku epoki" dla Brązu, trzeba DODAĆ nowy
  mechanizm: zapamiętać turę wejścia w Brąz per-owner (sprawdź najpierw,
  czy taki znacznik już gdzieś istnieje w stanie gry, np. przy okazji
  `syncOwnerEraFromResearch` — nie zgaduj, poszukaj) i opóźnić właściwe
  wyszukiwanie celu do `turn - turaWejsciaWBraz >= 25`, analogicznie do
  gałęzi Kamienia.

**Brak koordynacji między napastnikami — źródło "trzech przeciwników":**
Selekcja celu (`main.ts` ok. 28846-28960, `stoneCandidates`/`bronzeCandidates`)
biegnie NIEZALEŻNIE dla każdego `ownerId` w pętli głównej AI. Blokada celu
dziś to WYŁĄCZNIE: pakt nieagresji / `isPeaceLockedBetween` / sojusz formalny
(`stoneBlockedOwnerIds`/`bronzeBlockedOwnerIds`, linie ~28863-28871 i
~28945-28953). NIE ma żadnego sprawdzenia, czy kandydat jest już w innej
aktywnej wojnie — stąd wielu różnych napastników może niezależnie wybrać
TEGO SAMEGO celu (w tym gracza) w tej samej lub różnych turach, dając mu
kilku przeciwników naraz. Po stronie NAPASTNIKA taka ochrona już istnieje
(`alreadyAtWarAnyRole = countActiveWarsForOwnerExcludingBarbarians(ownerId)
> 0` blokuje SZUKANIE nowego celu, gdy sam napastnik już walczy) — brakuje
LUSTRZANEJ ochrony po stronie CELU.

**Funkcja `countActiveWarsForOwnerExcludingBarbarians(ownerId)`** (już
istniejąca, używana po stronie napastnika) — naturalny punkt do reużycia
też jako filtr kandydatów (sprawdź `countActiveWarsForOwnerExcludingBarbarians(candidateId)
> 0` dla KAŻDEGO kandydata, nie tylko napastnika).

**Poziom trudności:** `poziomTrudnosci?: 1 | 2 | 3` (opcjonalne pole w
kontekście AI, `game/ai.ts:240` i inne miejsca) — `1` = Łatwy, `2` =
Normalny, `3` = Trudny (potwierdzone wzorcem `poziomTrudnosci === 3`
używanym gdzie indziej dla zachowań "tylko Trudny", np.
`colonizationSourceMinPop`). Sprawdź, jak inne miejsca w kodzie traktują
`undefined` (domyślnie Normalny, `2`, jest najczęstszą konwencją w tym
projekcie — potwierdź, nie zgaduj).

**Stan pary wojny wymuszonej — brak pola czasu startu:**
`ForcedWarPairState` (`forced-war-common.ts:9-14`, WSPÓLNY typ dla Kamienia
i Brązu): `{ attackerId, targetId, capturedByAttacker, capturedByDefender }`
— BRAK pola tury rozpoczęcia. Dziś jedyny mechanizm auto-pokoju to PRÓG
LICZBY ZDOBYTYCH/STRACONYCH MIAST (`shouldEndBronzeForcedWarByCityCount`/
`shouldEndStoneForcedWarByCityCount`, wołane z
`maybeResolveBronzeForcedWarOnCityCapture`/`maybeResolveStoneForcedWarOnCityCapture`,
`main.ts:24611-24664`, uruchamiane WYŁĄCZNIE przy zdarzeniu przejęcia
miasta). ABY dodać limit 25 tur NIEZALEŻNY od zdobyczy terytorialnych,
trzeba: (a) dodać pole czasu startu do `ForcedWarPairState` (np.
`startTurn: number`), wypełniane przy tworzeniu wpisu (`main.ts` ok.
29150/29162/29175, trzy miejsca budujące `{ attackerId: ownerId, targetId,
capturedByAttacker: 0, capturedByDefender: 0 }` dla Kamienia/Brązu/Żelaza —
ZMIEŃ WYŁĄCZNIE gałęzie Kamienia i Brązu, Żelazo poza zakresem); (b) dodać
sprawdzenie CO TURĘ (nie tylko przy przejęciu miasta) kończące wojnę przez
`finalizePeaceTreatyBetween`, gdy `turn - st.startTurn >= 25` — potrzebuje
punktu iteracji PO WSZYSTKICH wpisach `stoneForceWarActiveByPairKey`/
`bronzeForceWarActiveByPairKey` raz na turę (poszukaj naturalnego miejsca w
pętli tury, np. obok istniejącego przetwarzania `stoneForceWarPendingOwners`
albo w osobnym kroku fazy AI/dyplomacji — Twój wybór, uzasadniony).
**UWAGA KOMPATYBILNOŚCI ZAPISU:** stare zapisy gry NIE będą mieć pola
`startTurn` w zserializowanym stanie — wczytanie starego zapisu NIE MOŻE
się wywalić; potraktuj brakujące pole jako fallback (np. `st.startTurn ??
turn` przy pierwszym odczycie po wczytaniu, albo inny bezpieczny domyślny
wybór — uzasadnij w raporcie).

**Kontekst projektowy (nie zmieniaj sensu):** `forced-war-iron.ts:12-15`
cytuje jawną decyzję właściciela: "wymuszone wojny w każdej epoce powinny
być wyłączone całkowicie z ogólnych reguł prowadzenia wojny. Inaczej nigdy
nie nastąpiłaby wojna pomiędzy cywilizacjami" — mechanizm istnieje po to,
żeby GWARANTOWAĆ, że jakaś wojna między cywilizacjami faktycznie wybucha
(AI samo z siebie zbyt rzadko decyduje się na wojnę). Nowe reguły z tego
dispatchu mają uczynić to ZDROWSZYM (jeden wróg naraz, ograniczony czas),
NIE wyłączać mechanizmu ani nie czynić go w praktyce nieosiągalnym.

## GOAL — cztery części, opisane w kolejności zależności

**Część A — próg startu 25 tur od początku epoki, Kamień i Brąz:**
- Kamień: `WOJNA_KAMIEN_WYMUSZONA_START_TURY` z `20` na `25`
  (`forced-war-stone.ts`) — jedna stała, zero zmian mechanizmu (już liczy
  od startu gry = startu epoki dla Kamienia).
- Brąz: dodaj analogiczny próg 25 tur OD TURY WEJŚCIA W BRĄZ (nie od startu
  gry) — nowy mechanizm śledzenia tury awansu per-owner (patrz RECON),
  opóźniający moment, w którym `bronzeForceWarPendingOwners`/cykliczne
  wyszukiwanie faktycznie zaczyna szukać celu.

**Część B — jeden przeciwnik naraz (koordynacja między napastnikami) +
fallback na gracza + limity zależne od trudności:**
- Rozszerz filtr kandydatów (`stoneBlockedOwnerIds`/`bronzeBlockedOwnerIds`)
  o wykluczenie kandydatów, którzy JUŻ są w jakiejkolwiek aktywnej wojnie
  (`countActiveWarsForOwnerExcludingBarbarians(candidateId) > 0`) — obok
  istniejącego wykluczenia NAP/peaceLocked/sojusz.
- Gdy po tym wykluczeniu lista kandydatów jest PUSTA — spróbuj gracza
  (`ownerId===0`) jako celu ostatniej szansy, NIEZALEŻNIE od tego, czy
  gracz akurat prowadzi inną wojnę — z zastrzeżeniem limitu trudności
  niżej.
- Limity zależne od `poziomTrudnosci`:
  - Łatwy (`1`): CAŁY mechanizm wojny wymuszonej (Kamień + Brąz) wyłączony
    — żadna cywilizacja nie szuka celu z tego powodu (ani gracza, ani AI).
  - Normalny (`2`, też `undefined` jeśli tak traktowane gdzie indziej w
    kodzie): gracz może mieć NAJWYŻEJ JEDNĄ aktywną wojnę wymuszoną
    (Kamień+Brąz łącznie) naraz — jeśli już ma, fallback na gracza NIE
    dodaje kolejnej (napastnik zostaje bez celu na tę turę, spróbuje
    ponownie później, tak jak dziś działa "wszyscy kandydaci zablokowani").
  - Trudny (`3`): brak limitu liczby wojen wymuszonych gracza.
Zero zmian w ochronie napastnika (`alreadyAtWarAnyRole` blokujące
SZUKANIE nowego celu przez kogoś, kto już walczy) — to zostaje.

**Część C — limit czasu trwania 25 tur, Kamień i Brąz:**
Dodaj pole czasu startu do `ForcedWarPairState` (wspólny typ) i nowe,
CO-TUROWE sprawdzenie kończące wojnę auto-pokojem po 25 turach od
rozpoczęcia TEJ KONKRETNEJ pary wojny — NIEZALEŻNIE od liczby zdobytych/
straconych miast (próg miastowy zostaje jako DODATKOWY, wcześniejszy
warunek zakończenia — który z dwóch warunków spełni się pierwszy, kończy
wojnę). Reużyj `finalizePeaceTreatyBetween` (ten sam mechanizm co dziś).
Zapewnij bezpieczne wczytanie starych zapisów bez pola `startTurn`.

**Część D — dokumentacja w raporcie:** jawnie opisz, jak `undefined`
`poziomTrudnosci` jest traktowany i dlaczego to jest bezpieczny wybór
(spójny z resztą kodu, nie wymyślony na miejscu).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywa symulacja (rozszerzony/nowy test w `gra/tools/`, na wzór
   istniejących testów wojny wymuszonej): scenariusz z 3+ głównymi
   cywilizacjami AI w epoce Kamień/Brąz po turze progu — WSZYSTKIE trzy
   niezależnie próbujące wybrać cel — co najwyżej JEDNA z nich faktycznie
   atakuje danego konkretnego kandydata (w tym gracza) w danym oknie czasu;
   pozostałe albo czekają, albo trafiają w innych, wolnych kandydatów.
2. Żywa symulacja: scenariusz, w którym WSZYSCY kandydaci AI są już w
   innej wojnie — napastnik wybiera gracza jako cel (Normalny/Trudny), o
   ile limit trudności na to pozwala.
3. Żywa symulacja: na Normalnym gracz z jedną aktywną wojną wymuszoną NIE
   dostaje drugiej (fallback na gracza nie aktywuje się ponownie, dopóki
   pierwsza trwa); na Trudnym gracz MOŻE dostać więcej niż jedną.
4. Żywa symulacja: na Łatwym mechanizm wojny wymuszonej Kamienia/Brązu w
   ogóle się nie uruchamia (zero nowych wypowiedzeń wojny z tego powodu),
   bez zmiany innych powodów wojny (np. gracz sam wypowiada wojnę — to
   nadal działa normalnie).
5. Żywa symulacja: próg startu — Kamień uruchamia się od tury 25 (nie 20),
   Brąz uruchamia się 25 tur PO wejściu danej cywilizacji w epokę Brąz
   (zmierzone niezależnie dla cywilizacji, która weszła w Brąz w różnych
   turach gry).
6. Żywa symulacja: aktywna wojna wymuszona Kamienia/Brązu, żadna ze stron
   nie zdobywa miast — po 25 turach od rozpoczęcia TEJ wojny następuje
   auto-pokój (dokładnie tak jak dziś działa próg miastowy, ale
   niezależnie od niego).
7. Żywy dowód braku regresu: próg miastowy (`shouldEndBronzeForcedWarByCityCount`/
   `shouldEndStoneForcedWarByCityCount`) nadal poprawnie kończy wojnę
   WCZEŚNIEJ, jeśli terytorium zmienia właściciela przed upływem 25 tur.
8. Żywy dowód: wczytanie zapisu gry sprzed tej zmiany (bez pola
   `startTurn` w stanie wojny wymuszonej) NIE powoduje błędu/wyjątku.
9. Żywy dowód braku regresu: Żelazo (`forced-war-iron.ts` i jego gałąź w
   `main.ts`) NIETKNIĘTE — identyczne zachowanie przed/po.
10. Diff ograniczony do plików w ALLOWLIŚCIE.
11. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
    + istniejące testy wojny wymuszonej w `gra/tools/` (znajdź po nazwie,
    np. `*forced-war*`, `*wymuszona*`) bez regresu + nowe testy dowodzące
    kryteriów 1-9.

## ALLOWLISTA — nic poza tym
`gra/src/game/forced-war-stone.ts`, `gra/src/game/forced-war-bronze.ts`,
`gra/src/game/forced-war-common.ts` (WYŁĄCZNIE `ForcedWarPairState` + nowe
pole), `gra/src/main.ts` (WYŁĄCZNIE gałęzie Kamienia i Brązu mechanizmu
wojny wymuszonej — selekcja kandydatów, tworzenie wpisu stanu, ewentualny
nowy punkt co-turowego sprawdzenia limitu czasu; ZERO zmian w gałęzi
Żelaza ani niepowiązanej logice), nowy/rozszerzony plik testowy w
`gra/tools/`. Jeśli funkcja serializacji zapisu (`game/save.ts` lub
podobny) wymaga zmiany dla nowego pola `startTurn` — dozwolone WYŁĄCZNIE
w zakresie tego jednego pola, udokumentuj. Zakazane bezwzględnie:
`gra/src/game/forced-war-iron.ts`, gałąź Żelaza w `main.ts`, `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-WOJNA-WYMUSZONA-REGULY-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz zgadywania jak `undefined poziomTrudnosci` jest dziś traktowany w
innych miejscach — sprawdź i zacytuj konkretny precedens. Zakaz
zakładania, że stary zapis zawsze ma pole `startTurn` — zbuduj i
przetestuj żywo scenariusz wczytania zapisu SPRZED tej zmiany. Zakaz
uznania kryteriów 1-9 za spełnione bez REALNEJ symulacji wielu tur
silnika (nie ręcznych wyliczeń). Zakaz naruszenia fundamentalnego celu
mechanizmu (gwarancja że wojna między cywilizacjami faktycznie wybucha) —
jeśli nowe reguły (zwłaszcza limit gracza na Normalnym) prowadzą w
symulacji do sytuacji, w której ŻADNA wojna wymuszona nigdy nie wybucha
przez wiele dziesiątek tur (bo wszyscy kandydaci zawsze zablokowani) —
zgłoś to jako DECISION_REQUIRED zamiast cicho zostawić mechanizm martwym.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high,
zarzuty, lista może być pusta) → Operator (Obrona, Sonnet 5, tylko gdy
zarzuty niepuste) → Final Control (Sonnet 5, osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
