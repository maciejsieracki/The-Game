TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (UI wizualne)
ŚCIEŻKA: gra/src/ui/entityCards/renderer.ts (bazowe wymiary/backdrop kart) +
gra/src/ui/entityCards/technologyAdapter.ts (widoczność przycisków linków)
MODEL+EFFORT: claude-opus-5, effort medium (Operator) / claude-opus-5, effort high
(Evaluator) — temat wizualny/UX, R-PROC-AUTOBOT.md §9 punkt 6b. Final Control
zostaje Sonnet 5, effort high jak w regule bazowej.

WYZWALACZ (zgłoszenie właściciela, 2026-09-04, ze zrzutami ekranu karty
technologii „Obróbka drewna", karty jednostki „Taran", karty budynku „Stolarnia")
"Zerknij na przycisk „Żegluga" – to są kolejne technologie, a także na budynki i
jednostki. One nie mają przycisku, który się podświetla. Warto, żeby wszystkie
karty mogły być otwierane w ten sposób, czyli zarówno brązownictwo, taran, jak i
palisada drewniana oraz stolarnia, też powinny mieć taki przycisk, a nie tylko
najechanie na linię. […] Wniosek jest taki: wszystkie karty powinny mieć tę samą
wysokość, uzależnioną od rozdzielczości monitora, tak aby mieściły się i aby był
zapas marginesu od góry i od dołu w wysokości 10% rozdzielczości monitora. Ta
wysokość powinna być stała. Nadmiar tekstu i informacji powinien mieścić się w
przesuwaku, który można rolować w dół i w górę. […] Szerokość referencyjna to
obecna szerokość karty technologii. Wszystkie karty – budynków, jednostek,
ulepszeń terenu, technologii – należy sprawdzić i poprawić."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu,
nie powtarzaj, buduj na tym)
(1) PRZYCISKI LINKÓW — `renderer.ts` już stylizuje KAŻDĄ niepustą `value` wiersza
z `linkTo` jako spójny, widoczny przycisk: obwódka+tło+hover, wspólne dla
wariantów grid/badge/pill/civpedia-link (`renderer.ts:630-653`). Jedyny powód
braku widoczności dla budynków/jednostek/„Kolejne technologie" (gałąź z innymi
prereq)/„Wymagania": `technologyAdapter.ts` świadomie zostawia dla nich
`value:''` — budynki (linie 162-167), jednostki (173-181), kolejne-technologie
gałąź z `otherPrereqs.length>0` (228-232), wymagania-pigułki (276-283). Pusty
przycisk jest CELOWO niewidoczny (`renderer.ts:664`,
`button.entity-card-row-value:empty{border:0;background:none;box-shadow:none;
padding:0;}`) — decyzja z `P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1` („cały
wiersz już klikalny przez hover-fallback `.entity-card-row--linked`, widoczna
wartość zbędna"). **TO ZGŁOSZENIE JEST ŚWIADOMYM ODWRÓCENIEM TAMTEJ DECYZJI**,
podjętym teraz wprost przez właściciela (cytat wyżej) — nie jest regresją do
cichej naprawy, tylko nową, nadrzędną dyspozycją. Ulepszenia terenu mają widoczny
„Szczegóły →" bo POZA tym plikiem, w `techDiscoveryNotice.ts:568-578`, nadpisuje
się ich `value` punktowo (poza allowlistą tego węzła, zostaw nietknięte). „Możesz
badać" (gotowe-do-badania technologie, `technologyAdapter.ts:213-217`) mają
widoczny przycisk bo ich `value` to nazwa technologii — niepusta z natury, nie
wymaga zmian.
(2) WYMIARY/BACKDROP — `entityCards/renderer.ts:559-566`: `.entity-card-backdrop
{...align-items:center...}` (brak fallbacku scrolla), `.entity-card-dialog
{position:relative;max-height:calc(100vh - 32px);overflow:auto;}` (max-height,
NIE height — stąd krótka treść daje mniejszą kartę, długa większą, różne karty
różnej wysokości), `.entity-card{width:min(434px,calc(100vw - 32px));...}`
(434px, węższa niż referencyjna karta technologii 660px). Ta baza jest jedynym
CSS używanym wprost przez kartę ulepszenia terenu (brak dla niej dedykowanego
pliku/override — `openEntityCard('improvement', key, {mode:'dialog'})` wprost).
Wzorzec „bezpiecznego centrowania" (naprawiający dokładnie ten sam bug — treść
ucina się symetrycznie góra/dół bez scrolla przy braku miejsca) jest już
zaimplementowany gdzie indziej: `gra/src/ui/diplomacyAudience.ts:566-590`
(`P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1`) — backdrop dostaje
`align-items:flex-start;overflow-y:auto`, boks-dziecko dostaje `margin:auto 0`
(zamiast polegania wyłącznie na `align-items:center`) — przy braku miejsca
margines auto nie schodzi poniżej 0, boks przykleja się do góry, nadmiar
osiągalny scrollem backdropu. Ten sam wzorzec do powielenia tutaj.

GOAL
1. `technologyAdapter.ts`: nadaj wierszom budynków, jednostek, „Kolejne
   technologie" (gałąź z `otherPrereqs.length>0`) i „Wymagania" WIDOCZNY
   przycisk-link, wizualnie SPÓJNY z już istniejącym „Szczegóły →" ulepszeń
   terenu (ta sama etykieta/ikona, nie cztery różne style) — ustaw dla nich
   niepuste `value` (renderer.ts CSS zadziała automatycznie, bez zmian w nim
   dla tej części). Zero zmian w renderowaniu DOM/atrybutach/listenerach —
   wyłącznie treść `value`. Sekcja „Zmiany ekonomiczne" (`econRows`) NIE jest w
   zakresie — jej `value` to własne dane wiersza (efekt/utrzymanie), nie
   duplikat celu linku, i już jest klikalna całym wierszem bez potrzeby zmiany.
2. `entityCards/renderer.ts`: `.entity-card{width:...}` → szerokość referencyjna
   `min(660px,calc(100vw - 32px))` (była 434px — dotyczy WSZYSTKICH kart
   używających tej bazy wprost, w tym ulepszeń terenu).
3. `.entity-card-dialog`: zamień `max-height:calc(100vh - 32px)` na STAŁĄ
   wysokość `height:min(80vh,calc(100vh - 32px))` (10% marginesu góra+dół =
   80% wysokości viewportu, z zapasowym dolnym pułapem na bardzo niskie
   viewporty) — `overflow:auto` zostaje (to on daje przesuwak na nadmiar
   treści, zgodnie z żądaniem właściciela). Karta ma mieć TĘ SAMĄ wysokość
   niezależnie od tego, ile sekcji accordion jest rozwiniętych.
4. `.entity-card-backdrop`: zastosuj wzorzec bezpiecznego centrowania z
   `diplomacyAudience.ts:566-590` (patrz RECON pkt 2) — `align-items:
   flex-start` + `overflow-y:auto` na backdropie, `margin:auto 0` na
   `.entity-card-dialog` — żeby przy nietypowym viewporcie (zoom przeglądarki,
   wewnętrzny zoom UI gry) treść była zawsze osiągalna scrollem, nigdy ucięta
   bez śladu.

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut Chromium: karty budynku, jednostki i „Kolejne technologie"
   (gałąź z wieloma prereq) oraz „Wymagania" wewnątrz karty technologii
   pokazują WIDOCZNY przycisk (obwódka+tło, jak dziś „Szczegóły →" ulepszeń
   terenu) — nie tylko podświetlenie całego wiersza na hover. Ten sam wizualny
   styl/etykieta na wszystkich czterech typach wierszy (spójność, nie 4 różne
   napisy).
2. Klik w każdy z tych wierszy nadal otwiera poprawną kartę docelową — zero
   regresji funkcjonalnej (sprawdź żywo, nie zakładaj z samej zmiany CSS/danych).
3. Żywy test: `.entity-card` ma `width` = referencyjna wartość (660px lub
   `calc(100vw-32px)` na wąskich viewportach) niezależnie od typu encji
   (budynek/jednostka/ulepszenie terenu otwarte przez tę bazę wprost — bez
   przechodzenia przez węzeł -B/-C, które testują własne pliki).
4. Żywy test na CO NAJMNIEJ 3 wysokościach viewportu (np. 700px, 900px,
   1200px): `.entity-card-dialog` ma TĘ SAMĄ wysokość (ok. 80% viewportu)
   niezależnie od ilości treści/stanu accordion (rozwiń wszystkie sekcje
   testowej karty z wieloma wierszami — wysokość dialogu się NIE zmienia,
   nadmiar przewija się w środku). Zero przycięcia bez dostępnego scrolla przy
   niskim viewporcie (dowód: symuluj viewport 700px wysokości, potwierdź że
   cała treść jest osiągalna scrollem backdropu i/lub dialogu).
5. `tsc --noEmit` czysty, istniejące testy dotykające `entityCards`/kart
   technologii/budynków/jednostek/ulepszeń (grep `gra/tools/*entity*-test.cjs`,
   `gra/tools/*karta*-test.cjs`, `gra/tools/*civpedia*-test.cjs`) nadal
   zielone, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/entityCards/renderer.ts (WYŁĄCZNIE: `.entity-card`/
  `.entity-card-dialog`/`.entity-card-backdrop` w `ENTITY_CARD_CSS`; zero zmian
  poza tymi trzema regułami CSS i zero zmian w logice/DOM/listenerach).
- gra/src/ui/entityCards/technologyAdapter.ts (WYŁĄCZNIE: pola `value` wierszy
  budynków/jednostek/kolejne-technologie-z-prereq/wymagania; zero zmian w
  strukturze sekcji, kolejności, `linkTo`, `openDefault`).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `techDiscoveryNotice.ts` (własny węzeł -C — jego
nadpisanie linii 568-578 dla ulepszeń terenu zostaje NIETKNIĘTE, nadal poprawnie
zadziała obok tej zmiany), zmiana `unitInfoCard.ts` (własny węzeł -B), zmiana
`cityPanel.ts`/`cityUxFrame.ts` (hover-dock panelu miasta już poprawnie przewija,
poza zakresem), zmiana sekcji „Zmiany ekonomiczne" w `technologyAdapter.ts`,
zmiana `buildingAdapter.ts`/`unitAdapter.ts`/`improvementAdapter.ts`,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-civpedia-karty-a, gałąź
autobot/R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione przez samo ustawienie niepustego `value`
bez zrzutu z żywego Chromium pokazującego wszystkie 4 typy wierszy obok siebie w
jednym kadrze. Zakaz uznania kryterium 3/4 (wymiary) za spełnione przez samo
odczytanie wartości CSS w kodzie źródłowym — zmierz `getBoundingClientRect()`/
`getComputedStyle()` na żywej, otwartej karcie w Chromium, na kilku wysokościach
viewportu, z co najmniej jedną kartą o TYLE treści, że przy starym `max-height`
faktycznie by się skurczyła/rozciągnęła (nie testuj tylko na krótkiej, pustej
karcie, która "przypadkiem" mieści się w każdym wariancie).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Opus 5, effort medium) → Evaluator (Opus 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.
