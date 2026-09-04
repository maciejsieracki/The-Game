TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (UI wizualne)
ŚCIEŻKA: gra/src/ui/unitInfoCard.ts (WYŁĄCZNIE CSS wymiarów/backdropu karty
jednostki otwieranej z mapy)
MODEL+EFFORT: claude-opus-5, effort medium (Operator) / claude-opus-5, effort high
(Evaluator) — temat wizualny/UX, R-PROC-AUTOBOT.md §9 punkt 6b. Final Control
zostaje Sonnet 5, effort high jak w regule bazowej.

WYZWALACZ (zgłoszenie właściciela, 2026-09-04, ze zrzutem karty jednostki „Taran")
Karta jednostki (widoczna na zrzucie: obrazek u góry, „Taran", statystyki bojowe,
koszty) ucina się na samym dole ekranu bez możliwości przewinięcia — sekcja
"Wymagania i kontry / Technologia" widoczna tylko częściowo. Cytat pełnego
zgłoszenia (dotyczy wszystkich typów kart, ten węzeł realizuje część dot. karty
jednostki): "Taran znowu wychodzi poza linię. Więc nie będzie widoczne na
niektórych monitorach. Powinno być tak samo wysokie, jak wszystkie karty [...]
Wszystkie karty należy ustawić na tę samą wysokość i ewentualnie dodać pasek
przewijalny, gdy nie mieści się. [...] wszystkie karty powinny mieć tę samą
wysokość, uzależnioną od rozdzielczości monitora, tak aby mieściły się i aby był
zapas marginesu od góry i od dołu w wysokości 10% rozdzielczości monitora. Ta
wysokość powinna być stała. Nadmiar tekstu i informacji powinien mieścić się w
przesuwaku [...] Szerokość referencyjna to obecna szerokość karty technologii."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu,
nie powtarzaj, buduj na tym)
Ta konkretna karta (obrazek/diorama u góry, pełnoekranowy dialog, otwierana
klikiem jednostki NA MAPIE — `showUnitInfoCardDialog()`, wywoływane z
`gra/src/main.ts:20068`) renderowana jest przez `gra/src/ui/unitInfoCard.ts`
(WŁASNY, niezależny arkusz `UNIT_INFO_CARD_CSS`, linia 330), nie przez wspólny
`entityCards/renderer.ts` — to osobna implementacja z tym samym, ale
NIEZALEŻNYM zestawem klas: `.unit-info-card-backdrop`/`.unit-info-card-dialog`/
`.unit-info-card` (linie 330-337). Dokładnie ten sam wzorzec bugu co karta
technologii/budynku (`R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A`, dispatchowany równolegle,
zero nakładania plików): `.unit-info-card-dialog{max-height:calc(100vh - 32px);
overflow:auto;}` (max-height zamiast height — karta hugguje treść zamiast mieć
stałą wysokość), `.unit-info-card{width:min(434px,calc(100vw - 32px));...}`
(434px, węższa niż referencyjna karta technologii 660px), `.unit-info-card-
backdrop{...align-items:center...}` (brak fallbacku scrolla przy braku miejsca —
to jest DOKŁADNIE ten mechanizm, który tnie kartę Taran na dole bez przewijania:
`align-items:center`, tzw. "unsafe" centrowanie flex, obcina nadmiar
SYMETRYCZNIE góra/dół bez żadnej ścieżki scrolla). Gotowy, już zweryfikowany
wzorzec naprawy identycznego bugu: `gra/src/ui/diplomacyAudience.ts:566-590`
(`P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1`) — backdrop dostaje
`align-items:flex-start;overflow-y:auto`, boks-dziecko dostaje `margin:auto 0`
zamiast polegania wyłącznie na `align-items:center` — przy braku miejsca
margines auto nie schodzi poniżej 0, boks przykleja się do góry, nadmiar
osiągalny scrollem backdropu.

GOAL
1. `.unit-info-card{width:...}` → szerokość referencyjna
   `min(660px,calc(100vw - 32px))` (była 434px), zgodnie z żądaniem
   właściciela "szerokość referencyjna to obecna szerokość karty technologii"
   (660px, `techDiscoveryNotice.ts:750` — poza allowlistą tego węzła, tylko
   punkt odniesienia liczbowego, nie plik do zmiany).
2. `.unit-info-card-dialog`: zamień `max-height:calc(100vh - 32px)` na STAŁĄ
   wysokość `height:min(80vh,calc(100vh - 32px))` (10% marginesu góra+dół =
   80% wysokości viewportu, z zapasowym dolnym pułapem na bardzo niskie
   viewporty) — `overflow:auto` zostaje (przesuwak na nadmiar treści).
3. `.unit-info-card-backdrop`: zastosuj wzorzec bezpiecznego centrowania z
   `diplomacyAudience.ts:566-590` (patrz RECON) — `align-items:flex-start` +
   `overflow-y:auto` na backdropie, `margin:auto 0` na `.unit-info-card-
   dialog` — usuwa dokładnie ten bug, który zgłosił właściciel (Taran ucięty
   bez scrolla).

KRYTERIA KOŃCA (binarne)
1. Żywy test na CO NAJMNIEJ 3 wysokościach viewportu (np. 700px, 900px,
   1200px), z jednostką o BOGATEJ treści (np. jednostka z wieloma statystykami/
   wymaganiami — użyj realnej jednostki z danych gry o największej liczbie
   pól, żeby test był realny, nie sztucznie krótki): karta jednostki mieści
   się CAŁA w scrollu, zero przycięcia bez dostępnego paska przewijania —
   dowód: przewiń do samego dołu, potwierdź że ostatnia sekcja ("Wymagania i
   kontry"/"Technologia") jest w pełni widoczna po przewinięciu.
2. `.unit-info-card-dialog` ma TĘ SAMĄ wysokość (ok. 80% viewportu) na każdej
   z testowanych jednostek niezależnie od ilości treści — krótka jednostka
   (np. bez statystyk dystansowych) i długa (super-jednostka z pełnym
   kompletem pól) dają IDENTYCZNĄ wysokość dialogu, różni się tylko to, ile
   trzeba przewinąć.
3. `.unit-info-card` ma szerokość referencyjną (660px lub
   `calc(100vw-32px)` na wąskich viewportach) — zmierzone `getBoundingClientRect()`
   na żywej, otwartej karcie, nie odczytane z samego kodu źródłowego.
4. Zero regresji: karta nadal otwiera się/zamyka poprawnie (Esc, przycisk ✕,
   klik w backdrop poza kartą), pozycjonowanie 3D-podglądu jednostki
   (`.unit-info-card-3d-slot`) i pozostałych sekcji bez zmian wizualnych poza
   samą wysokością/szerokością/centrowaniem.
5. `tsc --noEmit` czysty, istniejące testy dotykające karty jednostki (grep
   `gra/tools/*unit-info*-test.cjs`, `gra/tools/*karta-jednostki*-test.cjs`)
   nadal zielone, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/unitInfoCard.ts (WYŁĄCZNIE reguły CSS `.unit-info-card`/
  `.unit-info-card-dialog`/`.unit-info-card-backdrop` w `UNIT_INFO_CARD_CSS`;
  zero zmian poza tymi trzema regułami i zero zmian w logice budowania karty/
  DOM/listenerach/3D-podglądzie).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `entityCards/renderer.ts` (własny węzeł -A),
zmiana `techDiscoveryNotice.ts` (własny węzeł -C), zmiana `cityPanel.ts`
(karta jednostki w panelu miasta to inny punkt wejścia, poza zakresem tego
zgłoszenia — dotyczy wyłącznie karty otwieranej z mapy), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-civpedia-karty-b, gałąź
autobot/R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryteriów za spełnione przez samo odczytanie wartości CSS w
kodzie źródłowym — zmierz żywo w Chromium, na kilku wysokościach viewportu,
z realną jednostką o bogatej treści (nie testuj tylko na krótkiej karcie,
która "przypadkiem" mieści się w każdym wariancie). Zakaz uznania kryterium 1
za spełnione bez zrzutu POKAZUJĄCEGO scrollbar i faktyczne przewinięcie do
ostatniej sekcji na niskim viewporcie (np. 700px) — sam brak błędu w konsoli
nie jest dowodem, że treść jest osiągalna.

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
