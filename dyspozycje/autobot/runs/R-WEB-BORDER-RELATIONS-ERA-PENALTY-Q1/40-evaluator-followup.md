# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — niezależny evaluator follow-up

STATUS: BLOCK — runtime dowód zamyka lukę z `20-evaluator.md`, lecz nowy hook nie jest ograniczony do trybu testowego.
KANDYDAT: `315672e5bb2b0c97a71a595bab01eef4313586eb` (`codex/border-era-penalty`)
RUNDY: 2/5 (follow-up po runtime defense)

## Niezależne odtworzenie runtime

Uruchomiłem build kandydata przez Vite na `127.0.0.1:18914` i ponownie wykonałem `diplomacy-border-era-penalty-live-test.cjs` w Chromium, na własnym profilu i porcie. Gate wystartował nową grę, założył miasto gracza, wybrał istniejących AI ownerów 1/3 (Inkowie/Grecja), a fixture potwierdził po 4 miasta każdego ownera oraz prawdziwą wspólną granicę na lądowych hexach.

Wyniki odtworzone niezależnie:

- Epoki Bronze/Iron: produkcyjny `buildDiplomacyTickCtxForPair` podał stawkę `−4`; produkcyjny breakdown podał `−4`; podgląd `−3.51`; rzeczywisty `tickDiplomacy` zmienił zaufanie `19 → 15.49` (`−3.51`).
- Zapis/odczyt: `persistSaveToSlot` utworzył rzeczywisty slot IndexedDB; `loadFromLocal` odczytał go, a `loadGameFromSlot` odtworzył grę. W readbackie były roster `[[1,"inkowie"],[3,"grecy"]]`, epoki `[[1,2],[3,3]]` i 12 zapisanych technologii ownera 3. Po przywróceniu epok z zapisu produkcyjny kontekst i breakdown nadal wynosiły `−4`, a tick po loadzie zgadzał się z podglądem (`−3.51`).
- Po ustawieniu obu ownerów na Bronze stawka i breakdown wynosiły `−3` dla `(1,3)` oraz `(3,1)`. Po przeniesieniu miast ownera 3 na istniejące lądowe hexy bez wspólnej granicy, przy nadal >2 miastach obu stron, breakdown nie zawierał czynnika (`null`).
- Gate zakończył się `RESULT PASS`; nie zgłosił page errors. Chromium wypisał ostrzeżenia WebGL oraz zasób 404.

Gate rzeczywiście wywołuje funkcje produkcyjne zamknięte w `main.ts`: kontekst pary, `computeTickZaufanieDelta`, `getRelationBreakdown`, `tickDiplomacy`, zapis i load slotu. Nie ma kopii resolvera stawki ani warunku granicy w hooku. To zamyka konkretny brak wskazany w 20: pair context, wyliczenie delty z tym kontekstem oraz zachowanie po produkcyjnym restore nie są już potwierdzane samymi regexami. Test uruchamia obliczenie preview i produkcyjny breakdown, ale nie sprawdza screenshotem ani DOM-em widocznego tekstu całego panelu.

## Granica fixture

To jest runtime test z prawdziwym modułem gry, prawdziwym zapisem IndexedDB i prawdziwym loadem, ale stan wejściowy jest kontrolowanym fixture, a nie pełną organiczną kampanią. Hook dodaje kopie istniejących rekordów `City` na wybrane lądowe hexy i ustawia AI badania/cuda jako wejściowy stan uzasadniający epokę; potem prawdziwe `syncOwnerEraFromResearch` oblicza Bronze/Iron, a zapis obejmuje tę fixture. Ścieżka odtworzenia po load jest rzeczywista. Nie dowodzi to, że AI w kampanii naturalnie zdobędzie te technologie lub cuda, ani nie testuje wielu kolejnych tur. Para runtime to AI↔AI; player↔AI fallback pozostaje pokryty testem jednostkowym.

## Blokada: brak test-gate dla mutującego hooka

Nowy `window.__borderEraPenaltyRuntimeTestDebug` w `gra/src/main.ts` jest przypisywany bezwarunkowo; wokół assignmentu nie ma `isCivTestEnabled(...)` ani sprawdzenia URL. Niezależny gate uruchomił go pod `?playtest=mapa`, bez `?civTest=1`, więc stan test-flag=false już ujawnił hook. Assignment nie zależy od trybu URL, więc standardowa sesja gry również dostaje ten global.

Hook nie jest tylko odczytowy: udostępnia `setupFixture` (modyfikuje tablicę miast), `moveFixtureAwayForTest` (przenosi miasta), `setOwnerEraForTest` (zmienia badania, cuda i epokę), `applyProductionTick`, `quickSave` i `loadSlot`. Komentarz „WYŁĄCZNIE live-test hook” ogranicza intencję, nie ekspozycję. To narusza uzgodniony zakres test-only i oznacza, że obecny kandydat nie pozostawia normalnej gry bez nowego API mutującego stan.

Oczekiwane sprawdzenie po poprawce jest dwustanowe: przy `?civTest=1` hook istnieje, a bez flagi `window.__borderEraPenaltyRuntimeTestDebug === undefined`. Browser gate powinien dodawać `civTest=1`; zwykły URL bez flagi ma potwierdzić brak hooka. Wymagana zmiana jest ograniczona do osłonięcia tego assignmentu i URL gate'a testu.

## Zakres i kontrole

- `node tools/diplomacy-border-era-penalty-test.cjs`: PASS, 39/39.
- `npm run typecheck`: PASS (`tsc --noEmit`).
- `git diff --check`: PASS.
- Przegląd zmiany kandydata: `main.ts`, nowy live-test gate oraz artefakty diagnozy/runtime. Test-hook i gate pasują do uzgodnionej allowlisty; problemem jest bezwarunkowa ekspozycja hooka, nie niepowiązana zmiana balansu.
- Nie zmieniałem `20-evaluator.md` (pozostaje BLOCK), źródeł, stage ani commita. Nie wykonano push/merge/deploy.

DEPLOY/PUSH/MERGE: NIE WYKONANO
