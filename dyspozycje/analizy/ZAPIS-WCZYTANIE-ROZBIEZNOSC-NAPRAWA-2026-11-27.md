# ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA — przyczyna i poprawka (R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1, runda 3)

**Stan wiążący (2026-11-27, runda 3, Operator SONNET):** przyczyna ZNALEZIONA z dowodem i NAPRAWIONA.
Po poprawce przebieg po wczytaniu jest identyczny z ciągłym przez 6 tur w 4 zmierzonych punktach (patrz tabela);
mutacja czerwona potwierdzona; zgodność wsteczna potwierdzona. Reszta macierzy: NIE ZMIERZONO (jawnie niżej).

## 1. Przyczyna (jedno zdanie)

Wczytanie zapisu z **menu pauzy tej samej gry** (ten sam seed, rozmiar i typ świata) NIE odtwarzało mapy z zapisu:
`loadNeedsMapRebuild` zwracało `false` i zostawała ŻYWA mapa — razem ze zmianami zrobionymi PO zapisie.
Stan miast i jednostek wracał do zapisu, a heksy mapy nie. Rozbieżność jest więc w MAPIE, nie w polach AI/silnika
(wszystkie wcześniejsze hipotezy o mapach modułu, `ownerBonusy`, kolejności iteracji itd. były błędne).

Ten sam mechanizm odtwarza harness `__detHarness.restoreJson` w świeżej sesji (świeża gra tego samego ziarna = „ta sama sesja”):
`restoreGameFromSave` nie dotyka `map` (mapę odbudowuje wyłącznie `loadGameFromSlot` → `regenerateWorldForLoad`).
Wniosek wiążący: SAVEDIGEST mierzył rzeczywisty błąd ścieżki „wczytaj z pauzy”, nie artefakt tożsamy z digestem.
(Wczytanie z menu głównego — `fromInGamePause = false` — zawsze odbudowuje mapę z `mapSnapshot` i NIE było dotknięte.)

## 2. Dowód (łańcuch przyczynowy, seed 4242, cfg max, zapis po t3)

1. Instrumentacja Proxy na `city.surowce.drewno` w pierwszej turze po wczytaniu, sesja A (ciągła) vs F (świeża + `restoreJson`):
   w F pierwszy zapis drewna miasta `city25` to `creditOwnerResourceStock` z `tickEmpireResourcePipeline` (+15, wpływ z mapy),
   w A tego wpisu nie ma. Dalej w F: `purchaseRecruitmentUnit` zużywa drewno inaczej, potem `runAiPhase` dopisuje 50 (stąd „50 drewna”).
2. Źródło +15: `computeWorkedMagazynYieldsByCity` — w F obrabiane pole miasta ma plon drewna 15 (las), w A ma 0.
3. Zrzut `map.hexes` A@t3 vs F po restore (20160 heksów): różnią się **2 heksy** — `115,79` i `35,80`: `nakladka` **A=`brak`, F=`las`**.
   W grze ciągłej las na tych heksach był już wycięty w chwili zapisu (A@t3 ma `brak`, zapis też), a świeża gra ma `las` z generatora,
   bo `restoreGameFromSave` nie zastosował `mapSnapshot`.
4. `buildGameMapFromSnapshot(zapis.mapSnapshot)` == mapa A@t3 (0 różnic) — zapis jest poprawny, brakuje tylko jego zastosowania.
5. Dowód odwrotny: harness `restoreJsonAsPauseLoad` (nowy, podmienia heksy z `mapSnapshot` PRZED `restoreGameFromSave`) →
   miasta i jednostki zgodne z A w t4 (`pula` 3,9 = 3,9; drewno 8 = 8; manpower 40 = 40) i w kolejnych turach.

Odrzucone w tej rundzie (dowód: brak efektu lub brak różnic): zapis map cudów AI, 17 map modułu (runda 2), kolejność iteracji, `Math.random`.

## 3. Poprawka (`gra/src/main.ts`)

- Nowa funkcja `liveMapDiffersFromSave(saved)`: porównuje `JSON.stringify(serializeMapForSave(map))` z `JSON.stringify(saved.mapSnapshot)`.
  Zapis bez poprawnego `mapSnapshot` (legacy) → `false` (zachowanie bez zmian). Błąd serializacji → `true` (bezpiecznie: odbuduj z zapisu).
- `loadGameFromSlot`: `mustRebuildMap = loadNeedsMapRebuild(...) || (fromInGamePause && loadParams && liveMapDiffersFromSave(saved))`.
  Gdy żywa mapa jest identyczna z zapisem, szybka ścieżka pauzy zostaje (bez przebudowy sceny 3D). Gdy się różni — ta sama ścieżka co przy
  wczytaniu z menu (`regenerateWorldForLoad` z `mapSnapshot`), już używana dla innych seedów.
- Koszt porównania: zmierzone w Node na mapie standardowej 20160 heksów: 36–61 ms (serializacja + 2× stringify, 565 KB JSON). W przeglądarce NIE ZMIERZONO.
- Nowy hak civTest (`?civTest=1`) `__detHarness.restoreJsonAsPauseLoad(json)`: ta sama decyzja co `loadGameFromSlot`; gdy trzeba odbudować mapę,
  podmienia heksy IN PLACE z `mapSnapshot` (zamiennik `regenerateWorldForLoad` bez sceny 3D) i woła `restoreGameFromSave`. Zwraca `{ rebuild }`.
- Nic poza ścieżką wczytania zapisu nie zmienia zachowania gry. Format zapisu bez zmian (zero nowych pól) — stare zapisy wczytują się jak dotąd.

## 4. Wyniki (maksymalne ustawienia nowej gry = cfg `max`: Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny/AI trudny; K = 6 tur po wczytaniu)

Porównanie per tura: pełny zrzut jednostek i miast (`__detHarness.full()`), znormalizowany (pola domyślne i `stackGroupId` pominięte po obu stronach).
A = ciągła gra bez wczytania; B = świeża sesja + `restoreJsonAsPauseLoad`.

| Konfiguracja | Ziarno | Zapis po | Odbudowa mapy | Tury po wczytaniu | Wynik |
|---|---|---|---|---|---|
| max | 4242 | t3 | tak | t4–t9 | 6/6 identyczne |
| max | 7 | t3 | tak | t4–t9 | 6/6 identyczne |
| default | 4242 | t3 | tak | t4–t9 | 6/6 identyczne |
| max | 4242 | t10 | tak | t11–t16 | 6/6 identyczne |

Dane: `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/dane/r3-b-*.json` (0 błędów strony we wszystkich).

- **Mutacja czerwona** (`--restore plain` = stary `restoreJson`, odwzorowuje ścieżkę pauzy sprzed naprawy): max/4242/t3 — 6/6 tur ROZJAZD
  (t4: drewno city16 8 vs 13, city25 8 vs 50, `pula` 3,9 vs 3,6375; od t5 inna kategoria jednostki rekrutowanej w city25). Test w trybie `--expect diff` = PASS.
- **Zgodność wsteczna** (`--legacy 1`: migawka BEZ `mapSnapshot`): wczytuje się bez błędu, `rebuild=false` (zachowanie jak przed naprawą), tura t4 się wykonuje, 0 błędów strony.
  Równości z A tu nie oczekujemy (stary zapis nie niesie mapy).
- Zapis→wczytanie realną ścieżką `persistSaveToSlot` + `loadGameFromSlot` w żywej grze: `ai-plus10-live-roundtrip-test` 4/4 zielone (czy ta ścieżka weszła w odbudowę mapy: NIE ZMIERZONO).

## 5. Bramki (po commicie z poprawką)

`tsc --noEmit` 0 błędów; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; society-breakdown 56/0;
culture-religion-level 108/0; ai-plus10-culture 72/0; ai-plus10-matrix 190/0; ai-city-rebellion-gate 37/0; ai-city-rebellion-news 24/0;
diplo-world-news 67/0; ai-plus10-live-roundtrip 4/4; determinism-save-load-resume-test PASS; save-load-sort 4/4; save-load-ledger-history 4/0;
save-load-budowa-priorytet-on-load 6/0; save-load-player-owned-city-test PASS. „wiring 267/0”: NIE rozpoznano, który test to jest — NIE ZMIERZONO.

## 6. NIE ZMIERZONO (jawnie)

- Macierz z dispatchu 4 konfiguracje × 2 ziarna × 2 punkty zapisu: zmierzono 4 z 16 komórek (tabela wyżej). Brak: `aionly`, `bunt`, seed 7 t10, seed 7 default/aionly/bunt, default t10 itd.
  (jedna para A+B w Chromium to ok. 9–12 min przy obciążonej maszynie, limit narzędzia ok. 10 min na wywołanie).
- Pełna ścieżka UI z przebudową sceny 3D (`regenerateWorldForLoad` po decyzji `liveMapDiffersFromSave`): w harnessie zastąpiona podmianą heksów in place;
  realne wczytanie w swiftshader bywa SIGSEGV (znane). Ścieżka `regenerateWorldForLoad` jest już używana dla wczytań z innym seedem.
- Czas porównania w przeglądarce, rendering po odbudowie (czy mesh lasu/ulepszeń odpowiada zapisowi po wczytaniu z pauzy): NIE ZMIERZONO.
- Zapis z menu głównego nie był dotknięty (zawsze odbudowa) — wnioskowane z kodu, nie zmierzone osobnym przebiegiem.

## 7. Kandydat BŁĄD-GRY (do decyzji orkiestratora, nie do pytania ABC)

Przed poprawką „Wczytaj” z pauzy po dłuższej grze (ten sam seed) zostawiało w grze mapę z późniejszych tur (np. las wycięty po zapisie nie wracał,
plon drewna z miast liczony z mapy innej niż w zapisie). To realny błąd gry; poprawka wymaga wdrożenia jako FALA (bez zmian balansu).
