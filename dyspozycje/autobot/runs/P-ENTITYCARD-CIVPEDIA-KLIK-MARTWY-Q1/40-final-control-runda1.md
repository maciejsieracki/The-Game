# P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — Final Control, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`
GOAL: Klik w „Więcej informacji (Civpedia)" otwiera właściwe hasło dla wszystkich rodzajów
kart; brak hasła daje czytelny komunikat, nie ciszę.
RUNDA: 1/5

## Guard izolacji

HEAD `8d194daa`, gałąź `autobot/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`, drzewo czyste.
Zgodne z oczekiwaniem (po Evaluatorze i Obronie) — praca podjęta.

## WERDYKTY per zarzut

**1 → ODDAL.** Zarzut był zasadny (raport dawał agregat zamiast listy 26 pozycji), ale został
w pełni naprawiony. Wyznaczyłem listę SAM tym samym grepem — **26 bramek, nazwy identyczne
co do sztuki** z tabelą w obronie. Uruchomiłem wszystkie 26 u siebie: **22 zielone,
4 czerwone** — `building-detail-card-entitycard-migration` 51/1,
`entity-card-action-buttons-real-render` 30/1, `entity-card-cross-links-nested-overlay` 16/8,
`unit-detail-card-entitycard-migration` 37/2. **Liczby identyczne z tabelą obrony, co do
jednej.** Zastanie czerwieni sprawdziłem NIEZALEŻNIE: podstawiłem KOPIAMI wersje bazowe
sześciu plików z `f4cc06cd^`, usunąłem `civpediaOpenGate.ts`, uruchomiłem te cztery ponownie
— **51/1, 30/1, 16/8, 37/2, identycznie**. Czerwień jest sprzed tematu. Drzewo przywrócone
kopią, `git diff --quiet` zielony. Nic do naprawy.

**2 → ODDAL.** Brak był realny (na `f4cc06cd` w katalogu runu nie było raportu Operatora).
Obrona uzupełnia wymaganą treść G1: wzorzec = szew, precedens = `unitCtxDockDiploGate.ts`.
Sprawdziłem precedens w kodzie — kształt się zgadza (moduł-liść, rejestracja dostawcy).
Sprawdziłem też oba twarde uzasadnienia odrzucenia kandydatów: `civpediaOpenGate.ts` ma
**zero importów**, `entityCards/slug.ts` też jest liściem — więc nowe importy w
`wikiHubHud.ts` nie mogą wywrócić bundlowania esbuildem; `grep 'document.dispatchEvent'`
w `gra/src` = 0 trafień. Argumentacja jest sprawdzalna, nie deklaratywna.

**3 → ODDAL.** Obie części ujawnione i zgodne z dowodem. Głębsze ustalenie potwierdziłem
sam: `_pomiar-przed.json` ma `hasButton:false` dla 02/03/04 i `true` tylko dla 01/05, a na
zrzucie `02-jednostka-przed-po-kliku.png` **stopki z przyciskiem nie ma w ogóle** — defekt
był głębszy niż RECON dispatchu. Jawna lista 7 plików zgadza się co do sztuki z
`git diff --name-only main...HEAD`.

**4 → ODDAL, łącznie z częścią merytoryczną.** Sekcja POMIARY istnieje, a komentarze wskazują
na nią pełną ścieżką. **Liczbę odtworzyłem sam:** `gra/data/buildings.json` = **41** budynków,
`docs/encyklopedia/budynki/` = **25** haseł → **brakuje 16**. Sprostowanie dispatchu
(„25 z 42" → 16 z 41) jest poprawne. Poprawka merytoryczna komentarza w `buildEntityCardData`
jest rzetelna: gwarancja normalizacji naprawdę nie obejmuje ścieżek wołających adapter
bezpośrednio, i komentarz mówi to teraz wprost. Diff commitu `8d194daa` w `gra/src/` to
**wyłącznie komentarze** — zero zmian zachowania, potwierdzone bramką 71/0 i tsc 0 błędów.

## Weryfikacja własna, poza zarzutami

**Zrzuty — obejrzane, nie policzone (§9 poz. 6b, wymóg wprost w dyspozycji Final Control).**
Otworzyłem wszystkie pięć `*-po-po-kliku.png`:
- 01 — panel CIVPEDIA otwarty, hasło **„Biblioteka"** (Co robi / Koszty / Strategia gracza /
  Typowe błędy / Rys historyczny), tytuł hasła = tytuł karty;
- 02 — **„Włócznik"** (Rola / Rekrutacja / Countery i taktyka / Rys historyczny);
- 03 — **„Brązownictwo"** (Wymagania / Co odblokowuje / Postęp epoki);
- 04 — **„Farma"** (Co robi / Strategia / Rys historyczny);
- 05 — **przycisk NADAL JEST** (zakaz ukrywania dochowany), pod nim żółty komunikat
  „Civpedia nie ma jeszcze hasła „Akwedukt". Ten wpis czeka na napisanie."
Kontrola negatywna `02-jednostka-przed-po-kliku.png`: brak panelu **i brak przycisku** —
zrzuty „po" nie są tą samą sceną.

**Pięć własnych mutacji (kopia pliku, nigdy `git checkout`; po każdej `git diff --quiet`):**
1. *(kryterium 4A, odtworzone samodzielnie)* wyłączona rejestracja `addEventListener` na
   przycisku CivPedii → bramka **38 PASS / 9 FAIL, exit 1** — liczba identyczna z Operatorem
   i Evaluatorem.
2. *(kryterium 4B, odtworzone samodzielnie)* slug → `id + '_nieistniejacy_mutFC'` w
   `buildEntityCardData` → **zero wyjątków**, wszystkie asercje „klik nie rzuca wyjątku" PASS,
   ścieżka „brak hasła" zadziałała; bramka czerwienieje 47/24, bo wykrywa mutację — zgodnie
   z wymaganiem kryterium 2, nie wbrew niemu.
3. *(własna)* usunięty **trzeci stopień** dopasowania w `findEncyEntryForGameId` (klucz
   znormalizowany) → **68/3**, czerwienią się dokładnie: „jednostki: osiągalnych haseł **14**
   (próg >= 45)" oraz „hub pokazuje WŁAŚCIWE hasło „Włócznik" — „Biblioteka"". Dowodzi, że
   druga część defektu (rozjazd slug↔id) jest realna, naprawa nośna, a bramka ją pilnuje —
   i że przy braku dopasowania hub otwierałby **cudze hasło**, nie tylko żadne.
4. *(własna)* usunięta rejestracja w szwie (`setCivpediaEntryOpener`) → **55/16**, handler
   zwraca `unavailable` dla wszystkich rodzajów. Szew jest pilnowany, nie tylko listener.
5. *(własna, przeciw „Trybowi czwartemu")* podmiana komunikatu na **ciche ukrycie przycisku**
   → bramka czerwona (**70/1**): „brak hasła: komunikat jest WIDOCZNY po kliku (nie cisza)".
   Odrzucony przez właściciela wariant jest zablokowany bramką.

**Zakres.** `git diff --name-only main...HEAD` = 35 plików, wszystkie w allowliście
(7 plików `gra/src/` wypisanych jawnie w obronie, nowa bramka, katalog runu). Grep po
ścieżkach zakazanych (`gra/src/main.ts`, `gra/data/`, `docs/encyklopedia/`, `docs/decyzje/`,
`WERSJE.md`, `gra-robocza/`, `ROBOCZA-MANIFEST`, `playbook.json`) — **brak naruszeń**.
`wikiHubHud.ts`: diff wobec bazy ma **zero usuniętych linii** — czysta addycja, zakaz zmiany
zachowania dla istniejących wołających dochowany.

**Bramki u mnie.** `tsc --noEmit` exit 0. Bramka tematu **71/0**. Pięć referencyjnych:
logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**,
combat **6/6**. Rodzina 26 — jak wyżej.

**Potwierdzam ostrzeżenie eksploatacyjne (C-001).** Przebieg rodziny zabrudził 13 plików
spoza allowlisty: `gra/src/data/wikiBundle.json` (`civpedia-gra-id-mostek-test.cjs`) oraz
12 zrzutów w `runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/`
(`entity-card-diorama-real-render-test.cjs` pisze do cudzego katalogu dowodów). Przywróciłem
jawnymi ścieżkami. To zastany defekt infrastruktury bramek, wart osobnego zgłoszenia — nie
tego tematu.

## Uwagi bez rangi zarzutu (nie blokują integracji)

1. Komentarze w `improvementAdapter.ts` i `wonderAdapter.ts` nadal mówią, że rozjazd
   placeholdera jest „niemożliwy". Dla tych dwóch adapterów to dziś **prawda** (nie są
   wołane bezpośrednio — zweryfikowane), a precyzyjny zasięg gwarancji stoi w
   `buildEntityCardData`. Przy następnym dotknięciu tych plików warto dopisać odsyłacz.
2. `civpediaOpenGate.ts` — w bloku komentarza został nadmiarowy nawias zamykający
   („brakuje 16);"). Kosmetyka wewnątrz `/** */`, tsc zielony.
3. Etykieta w bramce „przed naprawą: 13" — moja mutacja 3 daje 14, bo zostawia mostek
   `gameIds`. Różnica jednego trafienia, próg regresji to `>= 45`. Bez znaczenia dla wyniku.

## Ocena zgodności z GOAL

GOAL osiągnięty i udowodniony na trzech niezależnych warstwach: żywy Chromium (5 zrzutów,
obejrzane), bramka uruchamiająca kartę i klikająca realnie (71/0, odporna na 5 mutacji),
oraz brak regresji w rodzinie i bramkach referencyjnych. Cztery zarzuty dotyczyły wyłącznie
śladu procesowego i zostały naprawione w sposób sprawdzalny — żaden nie wymaga rundy 2.

ZMIANY/COMMIT: `dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/40-final-control-runda1.md`
(ten raport). Zero zmian w kodzie, w bramkach i w dowodach.
TESTY: bramka tematu 71/0; mutacje własne 38/9, 47/24 (bez wyjątków), 68/3, 55/16, 70/1;
tsc 0 błędów; referencyjne 213/19/33/13/6; rodzina 26 bramek — 22 zielone, 4 czerwone
potwierdzone jako zastane na `f4cc06cd^` własnym podstawieniem.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (allowlista jak wyżej), potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO.
