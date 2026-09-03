TEMAT: R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI + dane)
ŚCIEŻKA: gra/src/ui/techDiscoveryNotice.ts, gra/data/terrain-improvements.json (WYŁĄCZNIE pole
`warunek` tam gdzie zawiera notatki deweloperskie)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, ze zrzutem ekranu)
Scenariusz: otwiera kartę technologii "Łowiectwo", w sekcji "Ulepszenia terenu" jest wiersz
"Obóz łowiecki" z przyciskiem "Szczegóły →". "po kliknięciu w szczegóły pojawia się karta, tak
jak pierwotnie planowano. Problem polega na tym, że karta wychodzi poza zakres ekranu i trzeba
ją poprawić, aby zmieściła się w granicach karty badań i nie była większa niż ona. Niemniej
jednak, po kliknięciu ponownie po lewej stronie w obóz łowiecki, a nie w szczegóły, pojawia się
druga karta pod spodem. To powinno zostać zmienione tak, aby obóz łowiecki był przyciskiem, a po
jego naciśnięciu szczegóły pojawiały się obok, a nie pod spodem."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym; oparte na
analizie kodu, NIE na żywym Chromium — Operator MUSI zweryfikować żywo w ramach kryteriów końca)

**Przyczyna 1 — overflow ekranu.** `gra/src/ui/entityCards/improvementAdapter.ts:137` renderuje
pole `improvement.warunek` jako wiersz "Warunek" na karcie ulepszenia. Dla `oboz_lowiecki`
(`gra/data/terrain-improvements.json:161`) to pole to SUROWA NOTATKA DEWELOPERSKA (~700 znaków,
zaczyna się od ID tematu `R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1 (właściciel): nie budujemy
obozu łowieckiego, dopóki...` — cytaty ECHO, ID tematów, uzasadnienia decyzji z historii projektu)
— tekst przeznaczony dla deweloperów/agentów AI, NIE dla gracza. Ten długi, nieprzenoszony token
rozpycha kartę boczną poza breakpoint 1160px (`techDiscoveryNotice.ts:756-759`, przełącza układ
dwóch kart obok siebie na pionowy dopiero poniżej tej szerokości — dla szerszych okien karta
mimo to wychodzi poza viewport, bo pojedynczy long-token nie zawija się w dostępnej szerokości
kolumny). Klasa problemu ZNANA z wcześniejszego tematu `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (wyciek
notatek deweloperskich do UI gracza) — TU NIE BYŁA dotąd naprawiona dla pola `warunek` w
`terrain-improvements.json`.

**Przyczyna 2 — regresja stackowania (2 niedopasowane commity).**
`wireSideCardLinks()` (`techDiscoveryNotice.ts:665-677`, mechanizm "karta obok" z WCZEŚNIEJSZEGO
tematu `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`, commit `57006261`) w fazie CAPTURE łapie
WYŁĄCZNIE `target?.closest('button[data-entity-kind][data-entity-id]')`. `P-CIVPEDIA-KARTY-CALY-
WIERSZ-PRZYCISKIEM-Q1` (commit `5b05773c`, zintegrowany TEGO SAMEGO dnia co ten recon) rozszerzył
klikalność na CAŁY `<div class="entity-card-row" data-row-entity-kind>` (`renderer.ts:buildGridRowEl`,
linie 137-148) — element ten NIE jest `<button>`. Skutek: klik na LEWĄ część wiersza (etykietę
"Obóz łowiecki", `<span class="entity-card-row-key">`, NIE przycisk "Szczegóły →") omija selektor
capture-listenera `wireSideCardLinks` (zwraca `null`, brak `stopPropagation()`) → zdarzenie leci
do bubble-fazy → łapie je własny, delegowany listener `renderEntityCard` (`renderer.ts:409-434`,
gałąź fallback `.entity-card-row[data-row-entity-kind]`) → wywołuje
`openEntityCard('improvement','oboz_lowiecki',{mode:'dialog'})` → `openDialog()` → backdrop
`z-index:520` (`renderer.ts:560`) renderuje się POD hostem karty bocznej `z-index:940`
(`techDiscoveryNotice.ts:234`) — stąd wrażenie "karta pod spodem". Te dwa commity nigdy nie
zostały ze sobą uzgodnione.

GOAL
1. **Napraw selektor `wireSideCardLinks()`** (`techDiscoveryNotice.ts:665-677`) tak, żeby łapał
   KAŻDY klik w obrębie wiersza z `linkTo` — nie tylko `<button[data-entity-kind]>`, ale też
   `.entity-card-row[data-row-entity-kind]` (fallback z P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1).
   Klik GDZIEKOLWIEK w wierszu "Obóz łowiecki" (etykieta, przycisk "Szczegóły", dopełnienie) MA
   otwierać kartę BOCZNĄ (obok, przez `wireSideCardLinks`/mechanizm `57006261`), NIGDY dialog
   (`openDialog`/backdrop). Sprawdź czy potrzebne jest odczytanie `data-row-entity-kind`/
   `data-row-entity-id` z `closest('.entity-card-row[data-row-entity-kind]')` jako fallback, gdy
   `closest('button[data-entity-kind]')` zwraca null.
2. **Napraw overflow karty bocznej.** Pole `improvement.warunek` w `terrain-improvements.json`
   dla `oboz_lowiecki` (i przeszukaj CAŁY plik `terrain-improvements.json` pod kątem innych
   wpisów `warunek` zaczynających się od wzorca ID-tematu typu `R-[A-Z-]+-Q\d+` lub zawierających
   frazy typu "ECHO", "właściciel", "RUNDA \d" — to sygnatura notatki deweloperskiej, nie opisu
   dla gracza) — zredukuj do KRÓTKIEGO, czytelnego dla gracza zdania opisującego faktyczny
   warunek (np. dla `oboz_lowiecki`: "Wymaga ukończonego Tartaku na tym samym heksie lasu.").
   Zachowaj PEŁNĄ historię/uzasadnienie decyzji GDZIEŚ w repo (np. jako komentarz JSON obok pola,
   jeśli format na to pozwala, LUB w osobnym polu nie renderowanym w UI, jeśli takie już istnieje
   w schemacie — zbadaj `improvementAdapter.ts` czy jest już pole na notatki deweloperskie
   ukryte przed graczem, wzorem wcześniejszego tematu `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`; jeśli
   nie ma, NIE wymyślaj nowego schematu w tej rundzie — po prostu skróć tekst do treści dla
   gracza i zostaw historyczne uzasadnienie WYŁĄCZNIE w rejestrze/dispatchach, nie w danych gry).
3. Dowieść oba fixy ŻYWO w Chromium (poprzedni recon tego tematu był analizą kodu, BEZ
   uruchomienia gry — wymagane teraz jako dowód, nie założenie).

KRYTERIA KOŃCA (binarne)
1. Żywy test Chromium: otwarcie karty "Łowiectwo", klik na LEWĄ część wiersza "Obóz łowiecki"
   (etykietę, nie przycisk) → otwiera się karta BOCZNA obok pierwszej (potwierdzone: ZERO
   `.entity-card-backdrop` w DOM, karta boczna widoczna w `.tdn-side-card` lub analogicznym
   kontenerze obok, nie pod spodem).
2. To samo dla kliku na przycisk "Szczegóły →" — identyczny efekt (karta boczna), zero regresji
   istniejącego zachowania.
3. Żywy test Chromium: karta boczna dla "Obóz łowiecki" (i inne rozwinięte sekcje/warunki) mieści
   się w granicach viewportu przy typowych szerokościach (np. 1280px, 1440px, 1920px) —
   `getBoundingClientRect().right <= window.innerWidth` dla karty bocznej, potwierdzone
   pomiarem, nie założeniem.
4. Tekst pola "Warunek" widoczny graczowi dla `oboz_lowiecki` NIE zawiera ID tematu, słowa
   "ECHO", "właściciel", "RUNDA" — jest krótkim, czytelnym zdaniem opisującym faktyczny warunek
   budowy.
5. Analogiczny audyt (nie zgadywanie) POZOSTAŁYCH wpisów `warunek` w `terrain-improvements.json`
   — jeśli znaleziono inne przypadki wycieku notatek deweloperskich, napraw je też w tej samej
   rundzie; jeśli brak innych przypadków, jawnie to stwierdź w raporcie z dowodem (np. grep po
   wzorcu sygnatury).
6. `tsc --noEmit` czysty, istniejący test `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs`
   nadal zielony (rozszerzony o nowe scenariusze 1-3 powyżej, zgodnie z rekomendacją poprzedniego
   reconu), 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/techDiscoveryNotice.ts (WYŁĄCZNIE `wireSideCardLinks()` i bezpośrednio powiązana
  logika selektora).
- gra/data/terrain-improvements.json (WYŁĄCZNIE pole/pola `warunek` zidentyfikowane jako wyciek
  notatki deweloperskiej — nie zmieniaj innych pól, nie zmieniaj logiki qualifikacji).
- gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs (rozszerzenie istniejącego testu).
Zakazane bezwzględnie: gra/src/ui/entityCards/renderer.ts (delegowany listener `openDialog`
zostaje NIETKNIĘTY — problem NIE jest w nim, jest w tym że `wireSideCardLinks` nie łapie zdarzenia
PRZED nim; jeśli Operator uzna że jednak trzeba tam coś zmienić, DECISION_REQUIRED zamiast
edycji), gra/src/ui/entityCards/improvementAdapter.ts (logika renderowania — problem jest w
DANYCH, nie w kodzie renderującym), logika kwalifikacji budowy obozu łowieckiego
(`isImprovementBlockedOnForest`/`qualifies` i pokrewne — ZERO zmian zachowania budowy, wyłącznie
tekst wyświetlany graczowi), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-tech-karta-boczna-klik-wiersz, gałąź
autobot/R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Poprzedni recon tego tematu był analizą KODU BEZ uruchomienia żywej gry (jawnie zastrzeżone przez
tamten subagent) — zakaz przyjęcia jego wniosków (b)/(c) jako faktu bez własnej, żywej weryfikacji
w Chromium. Zakaz uznania kryterium 3 (overflow) za spełnione bez faktycznego pomiaru
`getBoundingClientRect()` przy kilku szerokościach — sam fakt skrócenia tekstu nie jest
automatycznym dowodem że karta mieści się w viewport (mogą być inne długie pola w innych
ulepszeniach/sekcjach). Zakaz pominięcia kryterium 5 (audyt pozostałych wpisów) — "prawdopodobnie
nie ma innych" bez faktycznego grepu jest niedopuszczalne.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
