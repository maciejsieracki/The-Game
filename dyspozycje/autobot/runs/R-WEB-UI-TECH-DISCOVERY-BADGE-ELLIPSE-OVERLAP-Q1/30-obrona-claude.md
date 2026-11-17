# R-WEB-UI-TECH-DISCOVERY-BADGE-ELLIPSE-OVERLAP-Q1 — obrona Operatora (runda 1/5, odpowiedź na raport Evaluatora 4af00a516)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI okna odkrycia technologii, CSS odznak)
TEMAT: R-WEB-UI-TECH-DISCOVERY-BADGE-ELLIPSE-OVERLAP-Q1
GOAL: odznaki `.tdn-badge` nie nachodzą na elipsę gruntu ponad limit testu B2 (0 px dla `completion`, <=4 px dla `era`/`preview`) dla technologii z listy TECHS i wariantów mierzonych przez test; zmiana punktowa w CSS.
BAZA: ac0904f34305e28100e0a459d652e1bf22fb1a78 (origin/main)
KANDYDAT: a51126e34abe7c57c8d7c035273e1a5c6ca9414f (rodzic = baza, potwierdzone `git log`)

## Odpowiedzi na zarzuty Evaluatora (4af00a516)

Zarzut 1 — test bada tylko 3 technologie (TECHS), nie ~29 pozostałych: ODRZUCAM.
- Dowód: `gra/tools/tech-discovery-badge-diorama-test.cjs` l. 87: `TECHS = Array.from(new Set([TECH, Hutnictwo żelaza lub LONGEST, LONGEST]))`; komentarz l. 80-86 uzasadnia wybór (krótka nazwa, nazwa z dowodu konieczności, najdłuższa nazwa w danych).
- GOAL brzmi „technologie z listy TECHS", nie „wszystkie technologie w danych". Rozszerzenie na wszystkie ~29 technologii to zmiana zakresu tematu, nie poprawka.
- ZAŁOŻENIE (luka): dla technologii spoza TECHS brak dowodu z testu. Nie zgłaszam tego jako błędu tematu; pełne pokrycie wymagałoby osobnego tematu do decyzji orkiestratora.

Zarzut 2 — brak bisektu sprawcy 57d1c7d3b: ODRZUCAM.
- Bisekt nie jest kryterium zakończenia tematu. Dispatch główny (`00-dispatch.md`) nie istnieje w `origin/main` (`git show` zwrócił „path does not exist"). W dostępnym DODATKU-claude (`origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`) nie ma wymogu bisektu, jest tylko wskazanie kandydata i zmiany w src.
- ZAŁOŻENIE: sprawca regresu jest poza zakresem punktowej poprawki CSS. Bisekt pozostaje notą NIE ZMIERZONO.

Zarzut 3 — 1 z 12 zrzutów obejrzana; 3 czerwone testy nie uruchomione przez Evaluatora: PRZYJMUJĘ w zakresie dowodu na czerwone testy; ODRZUCAM żądanie obejrzenia wszystkich 12 zrzutów jako wymogu GOAL.
- Uruchomiłem trzy testy osobno (surowy exit code) na kandydacie `a51126e34` i na bazie `ac0904f34`:
  - `wydarzenia-zbadano-karta-tech-real-render-test.cjs`: kandydat exit 1; baza exit 1.
  - `era-change-toast-live-test.cjs`: kandydat exit 1; baza exit 1.
  - `ai-economy-measure-hook-test.cjs`: kandydat exit 1; baza exit 1.
- Wniosek: wszystkie trzy są czerwone również bez zmiany, czyli są przedistniejące (zgodnie z deklaracją Operatora).
- NIE ZMIERZONO: porównania linia po linii zestawu asercji obu przebiegów. Wiadomo tylko, że oba kończą się kodem 1; zestaw FAIL różni się szczegółowo (w bazie `wydarzenia` wypisuje FAIL na odznakach B1/B2, na kandydacie FAIL (0c)/(A1)).
- Zrzuty: 24 PNG w `zrzuty/` zostają bez zmian. Obejrzana para z Evaluatora nie była kryterium GOAL.

## ZMIANY / COMMIT
- Commit obrony zawiera tylko ten plik raportu. Kod bez zmian względem `a51126e34` (`gra/src`, `gra/tools`, zrzuty nietknięte).
- Lokalnie zainstalowano `gra/node_modules` (`npm ci`, 71 pakietów) na potrzeby testów; po testach usunięto.

## TESTY (ten przebieg, surowe wyniki)
- Trzy czerwone testy, kandydat `a51126e34` i baza `ac0904f34`: exit 1 w obu przebiegach (patrz wyżej).
- Test B2 na kandydacie (63 PASS / 0 FAIL) NIE ponowiony w tej rundzie; wynik pochodzi z raportu Evaluatora 4af00a516 i z raportu Operatora (ZMIERZONO tam, nie tutaj).

## BLOKADY
Brak blokad kodu. Otwarte NIE ZMIERZONO: bisekt sprawcy 57d1c7d3b; pokrycie technologii spoza TECHS; porównanie asercji trzech czerwonych testów linia po linii.

## RUNDY
1/5 (obrona odpowiedziała na zarzuty r1; kod bez zmian).

## NASTĘPNY KROK
Final Control (Sonnet) na kandydacie `a51126e34` z raportem obrony.

## DEPLOY/PUSH
NIE WYKONANO
