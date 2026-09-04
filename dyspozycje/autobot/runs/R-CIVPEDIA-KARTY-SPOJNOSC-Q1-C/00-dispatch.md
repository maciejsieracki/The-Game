TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (UI wizualne)
ŚCIEŻKA: gra/src/ui/techDiscoveryNotice.ts (WYŁĄCZNIE funkcja
`ensureEntityCardOverrideStyles()` i jej CSS — karta technologii + karta-satelita
otwierana obok niej z linku)
MODEL+EFFORT: claude-opus-5, effort medium (Operator) / claude-opus-5, effort high
(Evaluator) — temat wizualny/UX, R-PROC-AUTOBOT.md §9 punkt 6b. Final Control
zostaje Sonnet 5, effort high jak w regule bazowej.

WYZWALACZ (zgłoszenie właściciela, 2026-09-04, ze zrzutami: karta technologii
„Obróbka drewna" + karta budynku „Stolarnia" otwarta obok niej z linku „Kolejne
technologie"/„Żegluga")
"[...] Po prawej stronie wyświetla się prawidłowo karta tejże technologii. [...]
Stolarnia wyświetla się po prawej stronie, ale jest trochę za wysoka; powinna
mieć tę samą wysokość co karta technologii. Wszystkie karty należy ustawić na tę
samą wysokość [...] Zauważyłem jeszcze jedną rzecz. Karta technologii nie
przewija się odpowiednio i zmienia swoją wysokość – raz jest wyższa, raz niższa.
To powoduje, że gdy rozwinę wszystkie możliwe linijki i trójkąciki, znika sam dół.
I znika też możliwość rozpoczęcia badania. [...] wszystkie karty powinny mieć tę
samą wysokość, uzależnioną od rozdzielczości monitora [...] zapas marginesu od
góry i od dołu w wysokości 10% rozdzielczości monitora. Ta wysokość powinna być
stała. [...] Sugeruję także, aby szerokość wszystkich kart była podobna [...]
Szerokość referencyjna to obecna szerokość karty technologii."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu,
nie powtarzaj, buduj na tym)
Ścieżka AKTYWNA (produkcyjna) to `showTechDiscoveryNoticeViaEntityCard()`
(linia 523) — buduje kartę przez wspólny `renderEntityCard()` (`entityCards/
renderer.ts`) i nadpisuje jego bazowe `ENTITY_CARD_CSS` lokalnie w
`ensureEntityCardOverrideStyles()` (linie 744-772, jedyny zakres tego węzła).
Legacy `_legacyShowTechDiscoveryNotice()` (linia 823+) i jego CSS w
`ensureStyles()`/`.tdn-card` (linie 229-274) to NIEUŻYWANY dziś fallback
awaryjny — POZA ZAKRESEM, nie dotykaj.
Dziś (linie 750-752): `#${HOST_ID} .entity-card{width:min(660px,96vw);
max-height:calc(100vh - 36px);overflow:auto;...}` — to JEST już referencyjna
szerokość 660px, ale `max-height` (nie `height`) oznacza, że krótka treść daje
mniejszą kartę, długa większą (stąd "raz wyższa, raz niższa" ze zgłoszenia —
zależnie od tego, ile sekcji accordion jest rozwiniętych). Karta-satelita
(budynek/jednostka/inna technologia/ulepszenie otwarte klikiem linku wewnątrz
karty technologii — DOKŁADNIE ścieżka pokazana na zrzucie „Stolarnia" obok
„Obróbka drewna", zamontowana przez `openEntityCardBeside()` linia 692-716) ma
WŁASNĄ, mniejszą szerokość: `#${HOST_ID} .tdn-side-card{width:min(434px,96vw);
...}` (linia 762) — DOKŁADNIE stąd różnica szerokości/wysokości „Stolarnia" (434
px) vs „Obróbka drewna" (660px) widoczna na zrzucie właściciela. Próg wąskiego
okna (linia 763-772, `@media (max-width:1160px)`) przełącza układ dwóch kart na
pionowy (jedna nad drugą, `max-height:calc((100vh - 56px) / 2)` każda) — próg
1160px wyliczony pod ZAŁOŻENIE 660+434px; po zmianie szerokości satelity do
660px ten próg trzeba przeliczyć (patrz GOAL pkt 2). Backdrop/scena
(`#${HOST_ID}` linia 234-235, `.tdn-stage` linia 759-760) używają
`align-items:center` bez fallbacku scrolla — ten sam wzorzec bugu naprawiony
gdzie indziej: `gra/src/ui/diplomacyAudience.ts:566-590`
(`P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1`) — `align-items:flex-start` +
`overflow-y:auto` na kontenerze centrującym, `margin:auto 0` na
karcie-dziecku. Tu układ jest ZAGNIEŻDŻONY (host → `.tdn-stage` → karty) —
dostosuj wzorzec do tej struktury (np. `overflow-y:auto`+`align-items:
flex-start` na `#${HOST_ID}`, `margin:auto 0` na samych kartach `.entity-card`
wewnątrz `.tdn-stage`), weryfikując żywo że nic się nie zapętla/nie chowa.

GOAL
1. Karta technologii (`#${HOST_ID} .entity-card`, linia 750-752): zamień
   `max-height:calc(100vh - 36px)` na STAŁĄ wysokość
   `height:min(80vh,calc(100vh - 36px))` (10% marginesu góra+dół = 80%
   wysokości viewportu, z zapasowym dolnym pułapem na bardzo niskie
   viewporty) — `overflow:auto` zostaje. Szerokość 660px zostaje bez zmian
   (już referencyjna).
2. Karta-satelita (`.tdn-side-card`, linia 762): ujednolić szerokość do TEJ
   SAMEJ referencyjnej wartości co karta technologii —
   `width:min(660px,96vw)` (była 434px) — i tę samą stałą wysokość co pkt 1
   (dziedziczy z bazowej reguły `.entity-card`, o ile nie jest osobno
   nadpisywana; jeśli dziś jest nadpisywana gdzieś indziej w tym override,
   ujednolić i tam). Przelicz próg wąskiego okna (linia 763): przy dwóch
   kartach 660px+660px+odstęp 14px+padding hosta 2×18px ≈ 1370px łącznie —
   ustaw nowy próg z rozsądnym zapasem (np. 1400-1440px) i zaktualizuj
   komentarz z arytmetyką progu (linia 763-768) tak, żeby opisywał NOWE
   liczby, nie stare 660+434. W trybie skumulowanym (poniżej progu, linia
   770-771) zamień `max-height:calc((100vh - 56px) / 2)` na `height:
   calc((100vh - 56px) / 2)` (stała wysokość również w układzie pionowym).
3. Zastosuj wzorzec bezpiecznego centrowania (patrz RECON, wzorzec
   `diplomacyAudience.ts:566-590`) do `#${HOST_ID}` i/lub `.tdn-stage` —
   dobierz dokładne umiejscowienie (`overflow-y:auto`/`align-items:
   flex-start` na kontenerze zewnętrznym, `margin:auto 0` na kartach) tak,
   żeby przy niskim viewporcie ANI karta technologii, ANI karta-satelita nie
   ucinały się bez dostępnego scrolla — zweryfikuj żywo w obu układach (jedna
   karta / dwie karty obok siebie / dwie karty jedna nad drugą poniżej progu).

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut Chromium: karta technologii z sekcją o bogatej treści (rozwiń
   WSZYSTKIE sekcje accordion, użyj technologii z wieloma budynkami/
   jednostkami/ulepszeniami/kolejnymi technologiami) ma TĘ SAMĄ wysokość
   (ok. 80% viewportu) jak ta sama karta ze wszystkimi sekcjami zwiniętymi —
   przyciski akcji „Rozpocznij badanie"/„Otwórz drzewo" osiągalne scrollem w
   OBU stanach, nigdy poza ekranem bez dostępu.
2. Żywy zrzut: karta-satelita (np. „Stolarnia" otwarta z linku budynku
   wewnątrz karty technologii) ma DOKŁADNIE tę samą szerokość I wysokość co
   karta technologii obok niej — zmierzone `getBoundingClientRect()` na obu
   kartach jednocześnie w jednym kadrze, różnica ≤ 1-2px.
3. Żywy test na CO NAJMNIEJ 3 szerokościach viewportu obejmujących nowy próg
   (np. 1200px, nowy-próg±20px, 1920px): powyżej progu obie karty widoczne
   OBOK siebie bez nakładania/przycinania; poniżej progu układ pionowy, obie
   karty w pełni dostępne (scroll własny lub scroll hosta), zero elementu
   wychodzącego poza viewport bez ścieżki scrolla.
4. Żywy test na CO NAJMNIEJ 2 wysokościach viewportu (np. 700px, 900px) w OBU
   układach (jedna karta / dwie karty): brak przycięcia treści bez
   dostępnego scrolla (dowód: przewiń do końca, potwierdź że ostatni element
   — przyciski akcji lub ostatnia sekcja satelity — jest w pełni widoczny).
5. `tsc --noEmit` czysty, istniejące testy dotykające karty technologii/
   `techDiscoveryNotice` (grep `gra/tools/*tech-discovery*-test.cjs`,
   `gra/tools/*karta-technologii*-test.cjs`, `gra/tools/*tech-karta*-test.cjs`)
   nadal zielone, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/techDiscoveryNotice.ts (WYŁĄCZNIE wnętrze funkcji
  `ensureEntityCardOverrideStyles()`, linie ~744-772 i bezpośrednio z nią
  związane reguły CSS wymiarów/centrowania; zero zmian w `ensureStyles()`/
  `.tdn-card`/`_legacyShowTechDiscoveryNotice`, zero zmian w logice budowania
  danych karty/`wireSideCardLinks`/`openEntityCardBeside` poza samym CSS).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `entityCards/renderer.ts`/`technologyAdapter.ts`
(własny węzeł -A), zmiana `unitInfoCard.ts` (własny węzeł -B), zmiana
`cityPanel.ts`, dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-civpedia-karty-c, gałąź
autobot/R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryteriów za spełnione przez samo odczytanie wartości CSS w
kodzie źródłowym — zmierz żywo w Chromium, z realną technologią o bogatej
treści (nie testuj tylko na technologii z 1-2 wierszami, która "przypadkiem"
mieści się w każdym wariancie), na kilku szerokościach/wysokościach viewportu,
w OBU układach (pojedyncza karta i para kart). Zakaz porównania "wygląda
podobnie" bez zmierzonych pikselowych wymiarów obu kart w jednym zrzucie.
Zakaz uznania nowego progu wąskiego okna za poprawny bez żywego testu tuż
poniżej i tuż powyżej wybranej wartości.

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
