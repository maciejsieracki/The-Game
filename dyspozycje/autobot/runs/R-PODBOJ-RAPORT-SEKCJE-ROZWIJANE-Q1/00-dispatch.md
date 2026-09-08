STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-PODBOJ-RAPORT-SEKCJE-ROZWIJANE-Q1
GOAL: (A, bug) Zdiagnozuj i napraw brakującą pozycję surowca (zgłoszenie właściciela:
"Drewno" nie pojawiło się w raporcie "Bilans zdobycia" mimo że powinno było, przy
eliminacji cywilizacji "Trojzena"). (B, redesign UX) Przebuduj panel raportu zdobycia/
eliminacji (`gra/src/ui/cityCaptureNotice.ts` + budowniczy wierszy `buildCityCaptureReportRows`
w `gra/src/main.ts`) tak, żeby GŁÓWNE pozycje (Ludność, Punkty nauki, Pula pracy, Złoto/
Pieniądze) były zawsze widoczne bez klikania, a WSZYSTKIE pozostałe surowce (drewno, kamień,
glina, żelazo i inne z `EMPIRE_STOCK_RESOURCE_KEYS`) trafiały do rozwijanej/zwijanej sekcji
(domyślnie zwinięta, jeden klik pokazuje wszystko) — bo lista surowców może z czasem urosnąć
i panel nie powinien się rozrastać w nieskończoność w pionie. Zasada ogólna: NIC nie może
zniknąć bezpowrotnie — wszystko musi być widoczne, jeśli gracz chce to zobaczyć, tylko
domyślnie zwinięte.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zrzut ekranu właściciela: modal "ELIMINACJA! Trojzena" pokazuje Ludność +1, Kamień +50,
  Glina +130, Punkty nauki +22, Pula pracy +38 — BRAK Drewna, mimo że właściciel jest
  przekonany że miasto miało drewno w magazynie.
- `gra/src/main.ts` `buildCityCaptureReportRows()` (~linia 1432-1509): buduje `CaptureReportRow[]`
  wg trzech zasad (komentarz nad funkcją) — **zasada 1: pozycja o wartości ZEROWEJ NIE POWSTAJE**
  (świadomy design z `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, nie ten dispatch). Surowce
  (~linia 1444-1453): pętla po `EMPIRE_STOCK_RESOURCE_KEYS` + dodatkowo `Object.keys(input.surowce)`
  dla kluczy spoza tej listy, pomija wartości `<= 0`.
- **PRZED naprawą ustal, czy to REALNY bug, czy poprawne zachowanie**: sprawdź świeżo czy
  w momencie tej eliminacji miasto "Trojzena" faktycznie miało >0 drewna w `city.surowce.drewno`
  (np. reprodukcja: nowa gra, doprowadzenie miasta-państwa do posiadania drewna, podbój,
  sprawdzenie czy wiersz się pojawia). Jeśli drewno faktycznie było 0 w tym konkretnym
  przypadku — to NIE jest bug (zasada 1 działa poprawnie, wiersz o wartości 0 nie ma prawa
  się pojawić w DZISIEJSZYM modelu), i część (A) tego tematu kończy się notatką "nie
  potwierdzono, zachowanie zgodne z projektem" zamiast fixem kodu. Jeśli natomiast drewno
  BYŁO >0, a wiersz się nie pojawił — to prawdziwy regres/bug w `buildCityCaptureReportRows`
  albo w miejscu wołającym (np. `input.surowce` nie zawiera klucza `drewno` mimo że powinien) —
  znajdź i napraw punktowo.
- Część (B) jest niezależna od wyniku części (A) — redesign UX ma zastosowanie niezależnie
  od tego, czy "Drewno" akurat tym razem było bugiem czy nie: z rosnącą listą surowców
  (dziś: drewno/kamień/glina/żelazo, w przyszłości więcej) panel z każdym niezerowym
  surowcem jako osobnym, zawsze-widocznym wierszem urośnie ponad rozsądną wysokość.

ZADANIE:
1. Zdiagnozuj część (A) wg instrukcji wyżej — potwierdź lub obal hipotezę bugu, udokumentuj
   dowód (test/reprodukcja), napraw JEŚLI to realny bug.
2. Przeprojektuj `gra/src/ui/cityCaptureNotice.ts` (styl + render wierszy) tak, żeby:
   - Ludność, Punkty nauki, Pula pracy, Złoto (i ich odpowiedniki "utracone" w perspektywie
     ofiary — `mirrorCaptureReportRowsForVictim`) renderowały się ZAWSZE, jako główne wiersze,
     bez klikania.
   - Pozostałe surowce (drewno/kamień/glina/żelazo/przyszłe) renderowały się w osobnej,
     domyślnie ZWINIĘTEJ sekcji z przyciskiem/nagłówkiem rozwijania (np. "Pokaż wszystkie
     surowce (N)"), rozwijanej jednym kliknięciem, BEZ utraty żadnej pozycji.
   - Budynki/Technologie/Moc i inne istniejące grupy (`group: 'przejete'/'lup'/'strata'`)
     — zdecyduj i uzasadnij czy zostają w sekcji głównej czy w rozwijanej, kierując się
     zasadą właściciela: "najważniejsze" na wierzchu, reszta rozwijana. Nie kasuj żadnej
     istniejącej pozycji.
3. Zaktualizuj `buildCityCaptureReportRows()` w main.ts JEŚLI struktura danych (np. nowe
   pole na wierszu rozróżniające "główny" od "dodatkowy") tego wymaga — zachowaj istniejący
   kontrakt `CaptureReportRow` na tyle, na ile się da, rozszerzaj zamiast łamać (sprawdź
   `gra/tools/miasto-zdobycie-raport-test.cjs` — bramka istnieje, NIE może się cofnąć).
4. Żywy dowód Chromium: zrzut PRZED (dzisiejszy wygląd) i PO (nowy layout z sekcją rozwijaną,
   raz zwiniętą raz rozwiniętą) dla przypadku z wieloma surowcami jednocześnie.

BINARNE KRYTERIUM SUKCESU: modal raportu zdobycia/eliminacji pokazuje główne pozycje
(Ludność/Punkty nauki/Pula pracy/Złoto) zawsze, pozostałe surowce w rozwijanej sekcji
(domyślnie zwiniętej, jeden klik = pełna lista, zero utraconych pozycji). Część (A):
jawny werdykt bug/nie-bug z dowodem, fix jeśli bug potwierdzony. Istniejąca bramka
`gra/tools/miasto-zdobycie-raport-test.cjs` (i pokrewne) nadal zielone lub świadomie
zaktualizowane do nowego kontraktu (opisz zmianę w raporcie). `tsc --noEmit` czysty,
5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/ui/cityCaptureNotice.ts`
- `gra/src/main.ts` (WYŁĄCZNIE `buildCityCaptureReportRows`, ewentualnie
  `CaptureReportRow`/`CityCaptureReportInput` interfejsy w tym samym bloku — BEZ dotykania
  funkcji zajętych przez równoległe lany hot-seat, zweryfikuj świeżo `git status` w
  `/home/user/wt-hotseat-etap6e-render`, `/home/user/wt-bitwa-portret-gracza` przed edycją)
- `gra/tools/miasto-zdobycie-raport-test.cjs` (aktualizacja istniejącej bramki, jeśli kontrakt
  się zmienia) + ewentualna nowa bramka wizualna
- `dyspozycje/autobot/runs/R-PODBOJ-RAPORT-SEKCJE-ROZWIJANE-Q1/*`
Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "naprawiono bug drewna" bez dowodu że to
faktycznie był bug (nie świadome pominięcie zera). Zakaz deklaracji redesignu UX bez żywego
zrzutu Chromium PRZED/PO w obu stanach (zwinięty/rozwinięty). Zakaz cichego usunięcia
jakiejkolwiek istniejącej pozycji raportu przy okazji redesignu.

IZOLACJA: worktree `/home/user/wt-podboj-raport-sekcje`, gałąź
`autobot/R-PODBOJ-RAPORT-SEKCJE-ROZWIJANE-Q1`, baza `origin/main` @ `43bd343c`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
