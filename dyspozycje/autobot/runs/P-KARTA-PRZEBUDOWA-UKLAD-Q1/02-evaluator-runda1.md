STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-Q1
GOAL: Wdrożyć zaakceptowany nowy układ (kolejność sekcji) kart budynków i jednostek w
`gra/src/ui/entityCards/` — infrastruktura/renderer/adaptery, bez autorstwa nowej treści.

ZARZUTY:

1. [KRYTYCZNY, potwierdzony żywym Chromium — nie ufając deklaracji Operatora] Sekcja
   „Rys historyczny" NIE jest renderowana jako własna nazwana sekcja — nigdzie w DOM
   karty nie istnieje tekst „Rys historyczny" (ani jako nagłówek, ani jako `aria-label`,
   ani w żadnej innej formie). `renderer.ts::buildHistoriaEl` (linie 462–471) tworzy
   wyłącznie `<div class="entity-card-historia"><div class="entity-card-historia-sep">
   </div><p class="entity-card-historia-text">…</p></div>` — separator dekoracyjny +
   akapit tekstu, bez żadnego elementu tytułowego. Zweryfikowałem to własnym, niezależnym
   renderem Playwright/Chromium (ten sam bundling co istniejący test, ale sprawdzający
   wprost `card.textContent.includes('Rys historyczny')`): dla `building/stolarnia` i
   `unit/falanga` wynik to `fullTextContainsLabel: false` w obu przypadkach. Potwierdza to
   też wizualnie każdy z 4 dostarczonych zrzutów `dowody/01-04*.png` — po sekcji
   „Wymagania" następuje nieopisany kursywny akapit bez żadnego widocznego nagłówka, we
   WSZYSTKICH 4 sprawdzonych rodzajach kart (budynek/jednostka/technologia/ulepszenie).
   To jest bezpośrednie naruszenie dosłownego, dwukrotnie powtórzonego w `00-dispatch.md`
   wymogu: „Rys historyczny (…) WŁASNA nazwana sekcja — NIE 'Historia'/'Historical note'
   bez etykiety, dosłownie nazwana 'Rys historyczny'" (punkt 4 układu karty budynku i
   jednostki) oraz w ABC właściciela („Rys historyczny jako WŁASNA nazwana sekcja na
   pozycji 4"). Sam kryterium POZYCJI (indeks 2 tablicy `sections`, zaraz po Opisie)
   jest spełnione poprawnie — zarzut dotyczy WYŁĄCZNIE braku widocznej/dostępnej nazwy
   sekcji, nie pozycji.
   Dowód pomocniczy — `gra/tools/entity-card-historia-section-test.cjs` (35/0 PASS,
   liczby zgodne z raportem Operatora) w ŻADNYM z 8 asercji nie sprawdza obecności
   literalnego tekstu „Rys historyczny" w DOM — testuje wyłącznie klasę
   `.entity-card-historia`, jej pozycję i treść akapitu. Zielony wynik testu nie jest
   więc dowodem spełnienia tego konkretnego punktu dispatchu i nie powinien był zostać
   odczytany jako taki dowód w raporcie Operatora.
   Wymaga decyzji: czy właściciel akceptuje bieżącą, czysto stylistyczną (kursywa +
   separator) formę odróżnienia sekcji bez tekstowej etykiety, czy wymaga dosłownego
   nagłówka „Rys historyczny" jak napisano w dispatchu — w tym drugim przypadku to jest
   defekt do poprawki, nie kwestia interpretacji.

Poza powyższym, żadnego innego niespełnienia nie znalazłem:
- Kolejność sekcji (poza etykietą z zarzutu 1) zgodna z zaakceptowanym układem dla obu
  sprawdzonych kart: karta budynku (`stolarnia`) — Nagłówek→Wymagania→[Opis: puste, pominięte]
  →Rys historyczny→[Top3: puste, pominięte]→Charakterystyka→Plony i efekty→Koszt budowy→
  Koszt utrzymania→Poziomy→Więcej informacji; karta jednostki (`falanga`) — analogicznie,
  kończąc Statystyki bojowe (Podstawowe zawsze widoczne, Zaawansowane collapsible)→Kontry→
  Koszt rekrutacji→Utrzymanie→(Statusy, świadomie poza nowym układem per dispatch blocker c)
  →Więcej informacji. Potwierdzone niezależnie testem `[6]` w
  `entity-card-historia-section-test.cjs` i moim własnym odczytem DOM.
- Rys historyczny renderuje się na wspólnym indeksie 2 tablicy `sections`
  (`HISTORIA_SECTION_INDEX`) dla WSZYSTKICH 5 kinds jednym punktem w `renderer.ts`, nie
  osobno per adapter — sprawdziłem żywym zrzutem także kartę technologii (`Łowiectwo`) i
  ulepszenia (`Farma`): w obu przypadkach akapit historii ląduje bezpośrednio po pierwszej
  widocznej sekcji, zgodnie z zamierzonym przesunięciem „dla wszystkich typów encji" —
  brak regresji. `technologyAdapter.ts`/`improvementAdapter.ts`/`wonderAdapter.ts` mają
  zerowy diff względem `origin/main` (potwierdzone `git diff`), zgodnie z allowlistą.
- `statuses` (unitInfoCard.ts:86) bez regresji: plik `unitInfoCard.ts` ma zerowy diff
  względem `origin/main`; karta jednostki nadal pokazuje sekcję „Statusy" (widoczna na
  zrzucie `02-karta-jednostki-falanga.png`, badge „wymaga technologii z danych").
- Brak wymyślonej nowej treści opisowej: `buildingAdapter.ts`/`unitAdapter.ts` czytają
  `opis`/`Opis`/`top3` z istniejących danych encji (funkcje `top3Of`/`extra(...,'Opis')`),
  zero zahardkodowanych łańcuchów opisowych w diffie; sekcje Opis/Top3 puste dla
  sprawdzonych encji, zgodnie z raportem 0/42 i 0/75.
- `tsc --noEmit`: 0 błędów (uruchomione samodzielnie). `entity-card-contract-test`
  (75/0), `entity-card-historia-section-test` (35/0),
  `building-detail-card-entitycard-migration-test` (54/1),
  `unit-detail-card-entitycard-migration-test` (38/2) — uruchomione samodzielnie, wyniki
  identyczne z raportem Operatora. Oba FAIL-e dotyczą `playerFacingNote`/„Uwagi" w
  `cityPanel.ts`, który ma zerowy diff względem `origin/main` w tym temacie (plik poza
  allowlistą, nietknięty) — nie mogą więc być regresją tego tematu.
- Allowlista i granice §9: `git diff --stat origin/main...HEAD` pokazuje wyłącznie pliki
  z allowlisty (`types.ts`, `renderer.ts`, `buildingAdapter.ts`, `unitAdapter.ts`, 3 pliki
  `gra/tools/*-test.cjs`, oraz `dyspozycje/autobot/runs/P-KARTA-PRZEBUDOWA-UKLAD-Q1/*`).
  Brak `npm run build`/`dev` w historii poleceń tej weryfikacji.

TESTY: Samodzielnie uruchomione (nie tylko odczytane z raportu): `tsc --noEmit` (0 błędów),
`entity-card-contract-test.cjs` (75/0), `entity-card-historia-section-test.cjs` (35/0),
`building-detail-card-entitycard-migration-test.cjs` (54/1, pre-istniejący FAIL poza
zakresem), `unit-detail-card-entitycard-migration-test.cjs` (38/2, pre-istniejące FAIL-e
poza zakresem). Własny adwersaryjny skrypt Playwright/Chromium (tymczasowy, usunięty po
użyciu, worktree czysty — `git status --short` puste) potwierdzający brak literalnego
tekstu „Rys historyczny" w DOM dla `building/stolarnia` i `unit/falanga`.

BLOKADY: Zarzut 1 wymaga decyzji właściciela (czy forma bez etykiety jest akceptowalna,
czy wymagana jest dosłowna poprawka nazwy sekcji) — reszta ustaleń dispatchu spełniona.

RUNDY: 1/5
NASTĘPNY KROK: Właściciel/ABC — decyzja co do zarzutu 1 (etykieta sekcji „Rys
historyczny"); po decyzji albo poprawka Operatora (jeśli wymagana) na TYM SAMYM ID/gałęzi,
albo przejście do Final Control z jawną notatką o świadomie zaakceptowanym braku etykiety.
DEPLOY/PUSH: NIE WYKONANO
