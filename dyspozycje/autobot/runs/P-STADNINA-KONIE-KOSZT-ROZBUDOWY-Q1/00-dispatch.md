STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Zamień dzisiejszy mechanizm "pierwsza stadnina na złożu konia -> WSZYSTKIE kolejne
stadniny darmowe gdziekolwiek w imperium" (Model B, ABC-18, 2026-07-09) na model płatny:
stadnina poza złożem konia wymaga zapłaty 50 sztuk surowca "Koń" z magazynu imperium
(jednorazowy koszt przy budowie, nie stała bramka odblokowania), a cywilizacja bez
naturalnego dostępu do koni może dobić do 50 sztuk drogą handlu.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne, 2026-09-08): "w sytuacji, gdy dana cywilizacja odkryje
  poprzez stadniny konie, może zakładać kolejne stadniny niekoniecznie na polach związanych
  z koniem. Zasada jest taka, że jeżeli jest ikona konia, nie potrzeba w stadninie surowca
  koń, ale w innych miejscach, jeśli chcemy założyć stadninę, musimy zapłacić 50 koni. Czyli
  można replikować konie w innych miejscach, niekoniecznie mając dostęp tylko tam, gdzie jest
  koń. To samo dotyczy innych cywilizacji. Na przykład, jeśli nie ma dostępu do koni, można
  w drodze handlu kupić lub wymienić konie. Gdy w surowcach będzie 50 koni, można postawić
  u siebie stadninę i potem zakładać kolejne stadniny dalej."
- TA ZMIANA JEST ŚWIADOMYM, JAWNYM ODWRÓCENIEM CZĘŚCI wcześniejszej, udokumentowanej decyzji
  właściciela "Model B" (ABC-18, 2026-07-09, `gra/src/game/livestock-unlock.ts` nagłówek pliku):
  tam PIERWSZA stadnina na złożu konia odblokowuje WSZYSTKIE kolejne stadniny DARMO,
  gdziekolwiek w imperium (`computeEmpireLivestockUnlocks`/`isLivestockUnlockedForPlacement`
  — patrz `empireUnlocks.has('kon')`, zero kosztu). Właściciel dziś wprost mówi "musimy
  zapłacić 50 koni" — czyli darmowe odblokowanie ma się skończyć, zastąpione JEDNORAZOWYM
  KOSZTEM SUROWCOWYM za każdą stadninę poza złożem. Traktuj to zgłoszenie jako pełnoprawną
  ABC nadpisującą Model B WYŁĄCZNIE dla stadniny/konia — bydło/owce/lama (Model B, ta sama
  funkcja rodzina) NIE są w zakresie tego tematu i mają zostać bez zmian (nadal czyste
  ulepszenie bez kosztu, jak farma).
- Świeżo zweryfikowane przez orkiestratora (nie zakładaj bez własnej weryfikacji, kod mógł się
  przesunąć):
  - `gra/src/game/livestock-unlock.ts`: `computeEmpireLivestockUnlocks` (zbiera `empireUnlocks`
    per owner, dziś WYŁĄCZNIE boolean "czy 'kon' odblokowany", zero ilości/kosztu),
    `isLivestockUnlockedForPlacement` (dziś: `hexHasHorseDeposit(hex) || empireUnlocks.has('kon')`
    — DRUGI człon trzeba zastąpić realnym sprawdzeniem stanu magazynu >= 50 I DEDUKCJĄ 50 przy
    potwierdzeniu budowy, nie tylko odczytem boolean).
  - `gra/src/map/improvement-build.ts` (~linia 1023-1030, case `'stadnina'`): `terrainOk` używa
    `isLivestockUnlockedForPlacement` jako czystej bramki boolean (czy budowa jest w ogóle
    dozwolona na tym heksie) — TU nie ma dziś ŻADNEGO mechanizmu odejmowania surowca przy
    potwierdzeniu budowy ulepszenia (w przeciwieństwie do kosztów budynków/jednostek). Trzeba
    znaleźć / dodać hak "przy faktycznym potwierdzeniu budowy tego ulepszenia, jeśli poza
    złożem, odejmij 50 'kon' z magazynu imperium (ten sam magazyn co `citySurowceSumForOwner`
    w `main.ts`, ten sam co czyta `buildEmpireResourceRows`)" — ustal najpierw GDZIE w
    przepływie UI→silnik faktycznie następuje commit budowy ulepszenia terenu (prawdopodobnie
    gdzieś w `main.ts` albo w handlerze kliknięcia w `improvement-build.ts`/UI budowy), żeby
    umieścić odjęcie w JEDNYM, właściwym miejscu (nie w samej funkcji-bramce, która jest wołana
    wielokrotnie do samego SPRAWDZANIA czy przycisk ma być aktywny, nie tylko przy realnym
    kliknięciu "buduj").
  - `gra/src/game/empire-diplo-resource-flow.ts::empireDiploResourceFlowPerTurn`: generyczny
    mechanizm cyklicznych transakcji handlowych PO DOWOLNYM kluczu surowca (`item.surowiecKey`),
    już bez specjalnego wykluczenia dla 'kon' — sprawdź świeżo, czy UI handlu
    (`diplomacyTradeBasket.ts` i pokrewne) faktycznie POZWALA dodać 'kon' do koszyka
    wymiany cyklicznej między cywilizacjami (czy jest na liście tradowalnych surowców w UI,
    czy tylko silnik to obsłuży jeśli dane tam trafią). Jeśli UI dziś nie pozwala wybrać
    'kon' jako pozycji handlu, to jest brakujący kawałek do dodania (bez tego "kupić konie"
    z zgłoszenia właściciela jest fizycznie niemożliwe) — zweryfikuj i, jeśli brakuje, dodaj
    analogicznie do istniejących tradowalnych surowców (np. żelazo/drewno wzorem, nie
    wymyślaj nowego UI od zera).
  - `gra/src/ui/hexContextTooltip.ts` (linia ~465, komentarz o `isLivestockUnlockedForPlacement`)
    — miejsce, gdzie dziś UI tłumaczy dostępność stadniny właścicielowi; będzie wymagało
    dopisania informacji o koszcie 50 koni / stanie magazynu, żeby gracz rozumiał DLACZEGO
    przycisk budowy jest zablokowany (nie tylko "brak dostępu", tylko "masz X/50 koni").

ZADANIE:
1. Potwierdź świeżo (czytaniem + jeśli możliwe małą żywą próbą) DOKŁADNY dzisiejszy przepływ:
   gdzie w kodzie następuje faktyczne ZATWIERDZENIE budowy ulepszenia terenu (nie tylko
   sprawdzenie czy jest dozwolone) — to jest miejsce do dopisania kosztu.
2. Zaimplementuj: stadnina NA złożu konia — bez zmian, całkowicie darmowa, bez warunku
   magazynu. Stadnina POZA złożem konia — dozwolona wyłącznie gdy magazyn imperium (ten sam
   co czyta panel Surowców) ma >= 50 sztuk 'kon' W CHWILI potwierdzenia budowy; przy
   potwierdzeniu odejmij dokładnie 50 z magazynu (jednorazowo, per postawiona stadnina — NIE
   jest to stała bramka odblokowania, każda kolejna stadnina poza złożem płaci OSOBNE 50).
3. Sprawdź i, jeśli brakuje, dodaj możliwość handlu surowcem 'kon' (kupno/wymiana ilościowa,
   nie tylko boolean dostęp) w UI dyplomacji/handlu, żeby cywilizacja bez naturalnego dostępu
   do koni mogła realnie dobić do 50 sztuk drogą handlu, zgodnie wprost ze zgłoszeniem
   właściciela.
4. Zaktualizuj UI (tooltip/panel budowy) tak, żeby przy próbie budowy stadniny poza złożem
   pokazywał jawnie koszt "50 koni" i aktualny stan magazynu (np. "23/50 koni — brakuje 27"),
   zamiast tylko cichego zablokowania przycisku.
5. Żywy dowód PRZED/PO (headless symulacja lub Chromium, wg tego co się lepiej nadaje do tego
   konkretnego mechanizmu): (a) stadnina na złożu konia buduje się bez żadnego warunku
   magazynu i bez odjęcia; (b) próba budowy stadniny poza złożem z magazynem < 50 jest
   zablokowana z czytelnym komunikatem; (c) z magazynem >= 50 budowa się udaje i magazyn
   spada dokładnie o 50; (d) cywilizacja bez naturalnego dostępu do koni potrafi realnie
   zgromadzić 50 sztuk drogą handlu (aktywna umowa cykliczna z inną cywilizacją) i następnie
   postawić stadninę poza złożem.

BINARNE KRYTERIUM SUKCESU: wszystkie 4 punkty żywego dowodu z ZADANIA pkt 5 potwierdzone.
Bydło/owce/lama (Model B, ta sama rodzina funkcji) bez żadnej zmiany zachowania — potwierdź
to też żywym dowodem (regresja), nie tylko deklaracją. `tsc --noEmit` czysty, 5 bramek
referencyjnych zielone, istniejące testy stadniny/hodowli (plik z "stadnina"/"livestock"/
"hodowla" w nazwie w `gra/tools/`) nadal zielone lub świadomie rozszerzone o nowy mechanizm.

ALLOWLISTA:
- `gra/src/game/livestock-unlock.ts` (mechanizm kosztu/odblokowania — WYŁĄCZNIE stadnina/kon,
  bydło/owce/lama bez zmian)
- `gra/src/map/improvement-build.ts` (bramka terrainOk dla case 'stadnina' + miejsce commitu
  budowy jeśli tam faktycznie leży, do potwierdzenia świeżą diagnozą)
- `gra/src/game/empire-diplo-resource-flow.ts` (WYŁĄCZNIE jeśli diagnoza pokaże że mechanizm
  silnika już wspiera dowolny klucz łącznie z 'kon' bez zmian — nie modyfikuj bez potrzeby)
- pliki UI handlu (`gra/src/ui/diplomacyTradeBasket.ts` i bezpośrednio powiązane) — WYŁĄCZNIE
  jeśli diagnoza potwierdzi że 'kon' faktycznie brakuje na liście tradowalnych surowców w UI
- `gra/src/ui/hexContextTooltip.ts` (komunikat kosztu/stanu magazynu)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1/*`
Zakaz `git add -A`. Zakaz zmiany zachowania bydła/owiec/lamy (Model B pozostaje bez zmian dla
tych trzech — wyłącznie stadnina/koń jest w zakresie tego tematu). Zakaz zmiany wartości 50
(to jest jawna liczba właściciela z tego zgłoszenia, nie licz jej samodzielnie na nowo).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "zaimplementowano" bez żywego dowodu
faktycznego odjęcia 50 z magazynu przy potwierdzeniu budowy (nie tylko czytanie warunku w
kodzie). Zakaz założenia, że UI handlu już wspiera 'kon' bez sprawdzenia na żywo (klik przez
UI albo bezpośrednia inspekcja listy tradowalnych surowców) — jeśli okaże się że nie wspiera,
dodaj to jako część tego samego tematu, nie zostawiaj jako "osobny temat do zrobienia kiedyś"
(bez tego zgłoszenie właściciela pozostaje częściowo niespełnione).

IZOLACJA: nowy worktree `/home/user/wt-stadnina-koszt`, gałąź
`autobot/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1`, baza `origin/main` @ najświeższy commit w
chwili startu (sprawdź `git fetch origin main` przed założeniem worktree).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium (jeśli potrzebna): `node ./node_modules/vite/bin/vite.js build --outDir
<poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry + ekonomii + UI, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
