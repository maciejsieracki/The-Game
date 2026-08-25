# R-ZELAZO-MODELE-BRAKUJACE-Q1 — brakujące/zdublowane modele 3D jednostek epoki Żelazo

**Status:** W TRAKCIE (2026-08-24)

## Sytuacja

Właściciel poprosił o sprawdzenie, które jednostki wojskowe nie były jeszcze poprawione
przez proces „Opus 5" (seria bespoke, historycznie uzasadnionych modeli 3D — konwencja
plików `<epoka>-<jednostka>-opus5.ts`, precedens: `docs/decyzje/R-BRAZ-SUPER-DISPATCH-Q1.md`,
który zamknął ten sam problem dla epoki Brąz: „Wszystkie 40 jednostek epoki Brąz mają dziś
indywidualną grafikę (...) Nic obecnie nie jest znane jako brakujące w epoce Brąz").

Dla epoki **Żelazo** taki audyt nigdy nie był wykonany. Orkiestrator zlecił subagentowi
(Explore) pełny przegląd dispatchu modeli w `gra/src/render/units.ts` dla wszystkich 25
jednostek epoki Żelazo (`gra/data/units.json`, pole `Epoka`="Żelazo"). Wynik audytu
(2026-08-24):

### Jednostki BEZ dedykowanego modelu (generyczny fallback) — 4/25

| Jednostka | Kultura | Dzisiejszy model |
|---|---|---|
| Falanga | Grecka | `buildCategoryModel('falanga')` — bez akcentu kulturowego (kategoria jawnie wyłączona z nadpisań, `NEW_BESPOKE_CATEGORIES`) |
| Jeździec z oszczepami | Słowianie | generyczny model konnicy z kopią — „Słowianie" w ogóle nie są rozpoznaną `Culture` w silniku renderowania |
| Konnica lancowa asyryjska | Asyria | ten sam generyczny model konnicy co wyżej — Asyria też nierozpoznana kultura |
| Konnica łucznicza asyryjska | Asyria | **ten sam** generyczny model konnicy z kopią — mimo że to jednostka *łucznicza*, model dzierży broń drzewcową, nie łuk (realna niespójność wizualna, nie tylko brak akcentu) |

### Jednostki z ZDUBLOWANYM modelem (dispatch po nazwie jawny, ale wynik wizualny identyczny)

| Jednostka | Kultura | Współdzielony model |
|---|---|---|
| Soldurii | Celtowie | `buildCeltWarrior()` — identyczny z Gaesatae |
| Gaesatae | Celtowie | `buildCeltWarrior()` — identyczny z Soldurii |

Historycznie to DWIE bardzo różne jednostki (Soldurii — elitarna gwardia przysięgła,
uzbrojenie/pancerz zamożnego wojownika; Gaesatae — najemnicy słynący z walki nago/półnago,
uzbrojeni w gaesum, znani z bitwy pod Telamon 225 p.n.e.) i dziś są nierozróżnialne na mapie.

### Poza zakresem tego tematu (nie są brakiem grafiki)

`Evocati`, `Triari`, `Wojownik germański` (super-jednostki) mają bespoke modele, tylko
docierają do nich inną ścieżką (`buildSuperUnit()` zamiast whitelisty
`SUPER_Z_MODELEM_NAZWANYM`) — formalnie dedykowane, nie wymagają nowej grafiki. Martwy kod
(`buildHierosLochos`, `buildGermanWarrior` — nieosiągalne funkcje w `units.ts`) to porządek
kodu, nie luka wizualna — nie wchodzi w zakres tego tematu.

## ECHO właściciela (2026-08-24, główny czat orkiestratora)

> „tak ponieważ dla epoki żelaza tej jednostki nie były poprawiane więc wszystkie trzeba
> zrobić porządnie za pomocą opus 5 od nowa tak żeby zachowywały jak najlepiej odzwierciedlały
> kwestie historyczne"

Decyzja: wszystkie 6 jednostek z tabel wyżej (4 bez modelu + 2 zdublowane) dostają nowe,
dedykowane modele 3D w stylu serii Opus 5 (bespoke geometria, dokumentacja historyczna
w komentarzach analogiczna do `braz-konnica-opus5.ts`/`braz-wlocznik-opus5.ts`/
`hastati-opus5.ts` — sekcja „ZGODNOŚĆ HISTORYCZNA" z numerowanymi punktami uzasadnienia).
Właściciel dał też jawną, opt-in zgodę na pracę w pełni autonomiczną: „działaj samodzielnie
w pętli aż do skończenia tematu (...) jak do tego dojdzie to zrób deploy do roboczej i zrób
mi push" — bez dalszych check-inów.

## Podział na tematy AutoBot

Wszystkie 6 jednostek dotykają wspólnego pliku dispatchu `gra/src/render/units.ts`
(dodanie gałęzi rozpoznania nazwy + importu) — sekwencyjne dispatchowanie na tych samych
plikach (`R-PROC-AUTOBOT.md` §2b), jeden temat na raz, merge przed startem następnego.

| Temat | Jednostki | Kultura | Uzasadnienie grupowania |
|---|---|---|---|
| T1 | Konnica lancowa asyryjska + Konnica łucznicza asyryjska | Asyria | ta sama kultura, wspólny plik docelowy, kluczowe żeby łucznicza faktycznie dzierżyła łuk (dziś ma kopię) |
| T2 | Soldurii + Gaesatae | Celtowie | ta sama kultura, cel = wyraźne wizualne rozróżnienie dwóch różnych historycznie jednostek |
| T3 | Falanga | Grecja (Żelazo) | samodzielna, formacja hoplicka/falangowa — odrębna sylwetka od reszty greckiej piechoty |
| T4 | Jeździec z oszczepami | Słowianie | samodzielna, kultura dziś w ogóle nierozpoznawana przez silnik — może wymagać decyzji, czy dodać `'slowianie'` do typu `Culture` czy potraktować jako bespoke bez wpięcia w system kultur |

## Kryteria wspólne dla wszystkich T (obowiązują każdy dispatch)

1. Model bespoke, nie generyczny — jawne rozpoznanie po nazwie jednostki w `units.ts`,
   analogicznie do istniejącej rodziny `<epoka>-<jednostka>-opus5.ts`.
2. Sekcja „ZGODNOŚĆ HISTORYCZNA" w komentarzu na górze nowego pliku, w stylu
   `braz-konnica-opus5.ts` (numerowane punkty uzasadnienia, rama czasowa, źródła/logika
   historyczna dla każdej decyzji projektowej — broń, pancerz, sylwetka, brak anachronizmów).
3. Zero regresji dla innych jednostek/kultur — potwierdzone testem regresji + 5 bramek
   referencyjnych.
4. Real render Playwright/Chromium (bezwarunkowy wymóg dla tematu wizualnego,
   `R-PROC-AUTOBOT.md` §9 poz. 6a) — dowód, że nowy model faktycznie renderuje się w grze,
   zmierzone proporcje względem `HEX_R` (wzorem serii Opus 5), zrzut PRZED/PO.
5. `tsc --noEmit` i `vite build` (C-001) czyste.
6. Model/effort: **Opus 5 High dla Operatora i Evaluatora** (temat czysto wizualny,
   `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Postęp implementacji

- **T1 — ZINTEGROWANE (2026-08-25, 2 rundy).** Konnica lancowa i łucznicza asyryjska
  dostały dedykowane modele 3D (`zelazo-konnica-asyryjska-opus5.ts`) — łucznik
  dzierży realny łuk kompozytowy w naciągu z kołczanem, lancer lancę z żelaznym
  grotem i tarczę. Runda 1 FAIL z powodu błędu orkiestratora (dispatch modelu w
  skrypcie Workflow — patrz `R-PROC-AUTOBOT.md` C-062), nie treści pracy. Runda 2
  (Opus 5 High potwierdzony) znalazła i naprawiła 4 twarde błędy geometrii rundy 1
  (lanca w udzie, łuk w grzbiecie konia, ramię naciągu bez zgięcia, obręcz tarczy
  źle zorientowana) niewykrywalne przez testy mierzące same nazwy mesh — nowa
  sekcja testów (H) mierzy relacje geometryczne. Zmergowane do `main`, commit
  `0b2b091f`. 3 kosmetyczne uwagi zarejestrowane osobno w rejestrze (§3b).
- **T2 — ZINTEGROWANE (2026-08-25, 1 runda).** Soldurii i Gaesatae, dotąd
  identyczne (`buildCeltWarrior()`), są teraz wizualnie wyraźnie różne. Gaesatae
  wywołuje wcześniej martwy `buildGaesatae()` (naga skóra, gaesum, torc złoty —
  Polibiusz II.28-30). Soldurii dostał nową `buildSoldurii()` (kolczuga, hełm
  Montefortino, brązowy torc, długi miecz — Cezar III.22). Operator naprawił 4
  zmierzone błędy geometrii, w tym orientację tarczy niewidocznej dla kamery gry
  u obu jednostek. Naprawa objęła współdzielone helpery poza literalną allowlistą
  — ratyfikowane przez orkiestratora (§10, zero promienia rażenia poza tematem,
  zmierzone przez Final Control). Zmergowane do `main`. 2 znaleziska danych
  (`units.json` Gaesatae `Uwagi`/`Typ` nieaktualne po wcześniejszym rename)
  zarejestrowane osobno.
- T3–T4: patrz `dyspozycje/autobot/runs/R-ZELAZO-MODELE-BRAKUJACE-Q1-T{3..4}/`.
