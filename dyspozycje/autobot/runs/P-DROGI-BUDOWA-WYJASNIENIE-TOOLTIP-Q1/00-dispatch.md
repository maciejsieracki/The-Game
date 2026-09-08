STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1
GOAL: Zgłoszenie właściciela — niezrozumiałe dla gracza ograniczenie miejsc budowy drogi
("Nie wiem z jakiego faktu i ograniczenia wynika, że drogę można budować tylko w niektórych
wyznaczonych miejscach. Po wybudowaniu jednej nitki można kontynuować, ale istnieje jakieś
ograniczenie."). Orkiestrator ZWERYFIKOWAŁ ŚWIEŻO że to jest ŚWIADOME, poprawnie działające
ograniczenie (sieć dróg musi być spójna — nowy heks drogi musi sąsiadować z istniejącą drogą
albo z miastem), NIE bug — ale gra dziś NIE tłumaczy tego graczowi w żaden sposób (brak
tooltipa/komunikatu przy próbie budowy w niekwalifikującym się miejscu). Zadanie: dodaj
graczowi czytelne wyjaśnienie tej reguły w UI, zero zmian w logice budowy dróg.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Reguła (`gra/src/map/improvement-build.ts`, świeżo zweryfikuj numery linii — mogły się
  przesunąć):
  - `case 'droga': return TERENY_LADU.has(teren) && inPlayerTerritory(q, r) &&
    isRoadQualified(q, r);` (ok. linia 1038-1039).
  - `isRoadQualified(q, r)` (ok. linia 932-946): heks kwalifikuje się do drogi TYLKO jeśli
    sąsiaduje z (a) innym heksem drogi już postawionym w tej sesji budowy (`roadKeys`),
    (b) heksem z istniejącą drogą na mapie (`hexHasRoad`), albo (c) węzłem miasta
    (`cityNodes`, dystans 1). Czyli: droga MUSI zaczynać się od miasta i rozszerzać się
    wyłącznie przez sąsiedztwo z już istniejącą siecią — nie da się postawić izolowanego
    odcinka drogi w dowolnym miejscu terytorium. To jest standardowy, celowy mechanizm
    spójności sieci drogowej (typowy dla gier 4X) — orkiestrator NIE znalazł żadnego śladu
    że to błąd; NIE zgaduj inaczej bez nowego dowodu.
  - `droga_brukowana` (bruk, ulepszenie drogi) ma DODATKOWY, OSOBNY wymóg: wymaga już
    istniejącej zwykłej `droga` na TYM SAMYM heksie (ok. linia 972-978) — to jest INNA reguła,
    nie myl jej z `isRoadQualified`; jeśli natrafisz na nią w UI, można ją też skrótowo
    wspomnieć, ale GŁÓWNYM tematem jest `isRoadQualified`.
- Sprawdź świeżo w UI budowy ulepszeń (build mode / panel wyboru ulepszenia terenu — znajdź
  właściwy plik, prawdopodobnie w okolicach `gra/src/ui/` lub `gra/src/render/` obsługujących
  tryb budowy, oraz `gra/src/ui/hexContextTooltip.ts` który już wygląda na istniejący
  mechanizm tooltipów przy najechaniu na heks) — czy dziś gracz widzi JAKIKOLWIEK komunikat
  gdy heks nie kwalifikuje się do drogi (np. wyszarzona opcja bez wyjaśnienia, czy zero
  informacji), i czy istnieje już ogólny wzorzec pokazywania "dlaczego nie można budować tu
  X" dla innych ulepszeń (jeśli tak — użyj TEGO SAMEGO wzorca, nie wymyślaj nowego UI).

ZADANIE:
1. Zlokalizuj dokładne miejsce w UI, gdzie gracz próbuje wybrać "droga" na niekwalifikującym
   się heksie (build mode / tryb budowy ulepszeń) i sprawdź świeżo co dziś się dzieje
   (nic / wyszarzone bez opisu / inne).
2. Dodaj zwięzłe, po polsku, bez żargonu wyjaśnienie reguły — np. tooltip przy wyszarzonej
   opcji "Droga" na niekwalifikującym się heksie: "Droga musi łączyć się z miastem lub już
   istniejącą drogą" (albo analogiczny tekst pasujący stylistycznie do istniejących
   komunikatów w tym samym panelu). Jeśli panel budowy ma już ogólny mechanizm "powód
   niedostępności" dla innych ulepszeń — podłącz się pod niego zamiast tworzyć nowy.
3. Żywy dowód Chromium: zrzut ekranu pokazujący ten tooltip/komunikat faktycznie widoczny
   przy próbie/najechaniu na niekwalifikujący się heks w trybie budowy drogi.

BINARNE KRYTERIUM SUKCESU: gracz w trybie budowy ulepszeń widzi czytelne wyjaśnienie reguły
"droga musi łączyć się z miastem lub istniejącą drogą" przy niekwalifikującym się heksie,
potwierdzone żywym zrzutem Chromium. Zero zmian w `isRoadQualified`/logice budowy dróg —
temat czysto opisowy/UX.

ALLOWLISTA:
- Plik(i) UI trybu budowy ulepszeń terenu, znalezione świeżo w kroku 1 (prawdopodobnie
  `gra/src/ui/*` i/lub `gra/src/render/*` — NIE zgaduj z góry, zweryfikuj)
- `gra/src/ui/hexContextTooltip.ts` (jeśli to właściwe miejsce)
- `gra/tools/*-test.cjs` (nowa bramka jeśli zasadna)
- `dyspozycje/autobot/runs/P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1/*`
Zakaz `git add -A`. Zakaz JAKIEJKOLWIEK zmiany w `gra/src/map/improvement-build.ts`
(`isRoadQualified`, warunek `case 'droga'`) — ta reguła zostaje bez zmian, to nie jest bug.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "tooltip widoczny" bez żywego zrzutu
Chromium. Jeśli w trakcie pracy znajdziesz dowód że `isRoadQualified` FAKTYCZNIE jest
błędna (np. sprzeczna z jakąś udokumentowaną wcześniejszą decyzją) — zatrzymaj się i zgłoś
to jako osobną obserwację (DECISION_REQUIRED), nie zmieniaj logiki w ramach tego tematu.

IZOLACJA: worktree `/home/user/wt-drogi-tooltip`, gałąź
`autobot/P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1`, baza `origin/main` @ `c814ab1f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
