STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-BITWA-OBRONCY-PRZED-MUREM-Q1
GOAL: Zdiagnozuj i napraw przypadek, w którym jednostki obrońcy w bitwie z murem oblężniczym
stoją PRZED murem (po stronie atakującego, w otwartym polu) zamiast NA murze lub ZA murem
(po stronie miasta).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dwa zrzuty ekranu): pierwszy pokazuje mur oblężniczy (czerwona
  ściana + zielona wieża) z domami miasta PO WSCHODNIEJ stronie (strona obrońcy/miasta) i
  otwartym polem PO ZACHODNIEJ stronie (strona atakującego) — dwie flagowane jednostki stoją
  PO ZACHODNIEJ stronie muru, czyli po stronie atakującego, nie miasta. Drugi zrzut (ten sam
  typ bitwy, z pełnym HUD: "Perykles atakujący" vs "Cheng Tang obrońca") pokazuje armię
  atakującą Peryklesa na zachodzie i potwierdza że obrońca (Cheng Tang, siły 0×2·0×2=2) ma
  jednostki daleko na wschodzie ORAZ dwie widoczne blisko/przed murem po niewłaściwej
  (zachodniej) stronie. Właściciel: "Jednostki obrońcy zamiast stać na murze lub za murem,
  stoją przed murem, co jest totalną bzdurą."
- Świeżo zweryfikowany przez orkiestratora, ISTNIEJĄCY mechanizm rozmieszczania jednostek przy
  murze oblężniczym w `gra/src/battle/battleScene.ts` (numery linii mogą się przesunąć,
  zweryfikuj świeżo):
  - Komentarz ok. linia 4080-4085: "Melee (Wrecz) units: placed ON the wall walkway (col =
    siegeWallCol). All other units: placed BEHIND the wall (columns > siegeWallCol)."
  - Komentarz ok. linia 5161-5165: "Dystans od frontu (kol 2) do siegeWallCol (kol ~23)...
    Obrońcy: wrecz NA MURZE (siegeWallCol), reszta za murem."
  - `ru.side === 'def' && this.siegeWallCol >= 0` (ok. linia 5572) — osobna gałąź logiki dla
    strony obrony przy aktywnym murze oblężniczym.
  - NA PIERWSZY RZUT OKA logika WYGLĄDA poprawnie zaprojektowana (obrońca na/za murem,
    kolumny > `siegeWallCol`) — to jest DOKŁADNIE ten rodzaj rozbieżności "kod wygląda
    dobrze na papierze, właściciel widzi inaczej w praktyce", którego NIE rozstrzygniesz
    samym czytaniem kodu. Musisz odtworzyć żywą bitwę oblężniczą i sprawdzić RZECZYWISTĄ
    kolumnę przypisaną każdej jednostce obrony względem `siegeWallCol`.
- Kandydatury do zweryfikowania (nie zakładaj z góry, sprawdź wszystkie):
  a. Możliwe że konkretne dwie jednostki ze zrzutu NIE przechodzą przez tę gałąź w ogóle
     (np. są to jednostki spoza głównej armii obrony — wzmocnienie/patrol/jednostka
     miasta-państwa sprzymierzonego — z INNĄ ścieżką inicjalizacji pozycji, która nie
     uwzględnia `siegeWallCol`).
  b. Możliwe że `this.siegeWallCol` w momencie przypisywania pozycji tych konkretnych
     jednostek ma wartość `-1` (mur jeszcze nieustawiony) przez błąd kolejności inicjalizacji
     — jednostki dostają pozycję PRZED ustawieniem `siegeWallCol`, więc warunek `>= 0` nigdy
     nie działa dla nich.
  c. Możliwe że oznaczenie strony (`ru.side === 'def'`) jest błędnie przypisane dla tych
     konkretnych jednostek (np. przez pomyłkę w przypisaniu właściciela/sprzymierzeńca).
  d. Możliwe że to jednostki, które WYSZŁY zza muru w ramach jakiejś innej logiki (wypad
     obronny, kontratak) i po tym manewrze nie wracają/nie są poprawnie cofane, a scena
     zrzutu to stan PO takim wyjściu, nie stan początkowy — sprawdź czy istnieje mechanizm
     "wypadu" i czy jest tu zaangażowany.

ZADANIE:
1. Odtwórz problem z dowodem — żywa bitwa oblężnicza (Chromium albo `testBattle.ts` jeśli się
   nadaje) z murem i obrońcą mającym więcej niż jedną jednostkę: zweryfikuj DLA KAŻDEJ
   jednostki obrony jej rzeczywistą kolumnę startową względem `this.siegeWallCol` w chwili
   rozpoczęcia bitwy (nie w trakcie, żeby wykluczyć kandydaturę (d) na starcie).
2. Ustal DOKŁADNĄ przyczynę (może być więcej niż jedna z czterech kandydatur wyżej) z dowodem.
3. Napraw źródło problemu z dowodem PRZED/PO (ta sama symulacja/scena, obrońca faktycznie
   startuje na/za murem, nie przed nim).

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt przyczyny (z dowodem — pomiar kolumn w
żywej scenie, nie domysł z czytania kodu). Wszystkie jednostki obrony w bitwie oblężniczej
startują z kolumną >= `siegeWallCol` (na murze lub za nim), potwierdzone PRZED/PO. `tsc
--noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy bitwy oblężniczej (jeśli
są, plik z "siege"/"oblezenie" w nazwie w `gra/tools/`) nadal zielone lub świadomie
rozszerzone.

ALLOWLISTA:
- `gra/src/battle/battleScene.ts` (WYŁĄCZNIE logikę przypisywania pozycji startowej jednostek
  obrony przy murze oblężniczym, wskazaną świeżo diagnozą)
- `gra/tools/*-test.cjs` (nowa bramka dowodu jeśli da się ją sensownie napisać; jeśli nie,
  opisz dlaczego zamiast wymuszać sztuczny test)
- `dyspozycje/autobot/runs/P-BITWA-OBRONCY-PRZED-MUREM-Q1/*`
Zakaz `git add -A`. Zakaz zmiany geometrii/renderu samego muru (`gra/src/battle/siegeWall.ts`)
— temat dotyczy WYŁĄCZNIE pozycji jednostek, nie wyglądu muru.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej,
żywej sceny bitwy (nie samo czytanie kodu — komentarze w kodzie WYGLĄDAJĄ poprawnie, to
właśnie dlatego problem wymaga żywego dowodu, nie inspekcji). Zakaz deklaracji "naprawiono"
bez dowodu PRZED/PO pokazującego rzeczywiste kolumny jednostek.

IZOLACJA: worktree `/home/user/wt-bitwa-obroncy-mur`, gałąź
`autobot/P-BITWA-OBRONCY-PRZED-MUREM-Q1`, baza `origin/main` @ `2b475bb9`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium (jeśli potrzebna): `node ./node_modules/vite/bin/vite.js build --outDir
<poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny/logiki walki, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
