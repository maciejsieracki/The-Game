# R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1 — Obrona Operatora, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — karty odkryć (UI + dane treści)
TEMAT: R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Etap 1 kart odkryć: Top 5 stoi zaraz po Rysie historycznym, „Co możesz teraz zrobić” ma postać CZYNNOŚĆ → KORZYŚĆ, a efekty martwe są ukryte. Dotyczy także ścieżki zapasowej popupu.

Stan odtworzony z commita Operatora `ed87b5091` (rodzic `dc4a76d34`, baza `397f84f29`). Obrona dodaje jeden commit na wierzchu (SHA w raporcie końcowym Workflow).

## Odpowiedzi na zarzuty Evaluatora

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Z1: brak `entitycard-sufit-dwoch-kart` 58/9 na liście czerwonych | **PRZYJMUJĘ** (raport) | Pełna lista czerwonych testów przed tematem jest niżej. Wynik 58/9 jest taki sam na bazie `397f84f29` (pomiar Evaluatora), więc to nie regresja. |
| Z2: niestabilny `civpedia-caly-wiersz-przyciskiem` (1 FAIL na 3) | **PRZYJMUJĘ** (raport) | Test nie jest „OK”, tylko „niestabilny, 1 FAIL na 3 uruchomienia (pomiar Evaluatora)”. Mają ten sam charakter co `cross-links` [2]. Proponuję osobny temat dla niestabilnych testów kart w przeglądarce. Kodu nie zmieniam, bo test nie należy do allowlisty tego tematu. |
| Z3: Waluta — Top 5 (Mennica +3, 1 złota/turę) przeczy sekcji „Zmiany ekonomiczne” (pieniadz +2, utrzymanie 2) | **ODRZUCAM w tym temacie, diagnozę przyjmuję** | Sekcja „Zmiany ekonomiczne” zostaje bez zmian. Wymaga tego komentarz w `technologyAdapter.ts`: Q1 właściciela, kolejność sekcji niezmieniona, a dispatch C tej sekcji nie obejmuje. Liczby pochodzą z `buildings.json` (Mennica: `baza.pieniadz 3`, `przyrost.pieniadz 2`, `utrzymanie 2`), a ten plik jest na liście zakazanych. Trzeba zdecydować, którą wartość pokazać: bazę czy przyrost (ANALIZA §2.3 i §7 pkt 11). To decyzja o treści dla właściciela lub osobnego tematu. Proponowany temat: `R-WEB-TECH-CARDS-ECON-SECTION-BASE-Q1`. |
| Z4: ścieżka zapasowa `techDiscoveryNotice.ts` wypisuje martwe budynki | **PRZYJMUJĘ** (poprawka) | Allowlista dopuszcza w tym pliku zmiany dla „spójności CMZ/Top5”. Lista `ukryte` jest częścią danych Top 5, a dispatch wymaga, żeby „ten sam efekt był spójny”. Poprawka: `technologyAdapter.ts` eksportuje `isDeadTechCardBuilding` (ta sama reguła, `isDeadBuilding` z niej korzysta). `buildBody()` w ścieżce zapasowej filtruje teraz budynki, jednostki, kolejne technologie i ulepszenia według `ukryte` i tej reguły. Lista ulepszeń zapasu nadal pochodzi z `tech.json`, bo przejście na `terrain-improvements.json` to nie spójność Top 5. |
| Z5: regex „aby” w teście CMZ jest tautologiczny | **PRZYJMUJĘ** (poprawka) | `tech-cards-top5-test.cjs` [C] nie korzysta już z regexu. Teraz sprawdza: (1) dane: `czynnosc` i `korzysc` są niepuste, różne, mają co najmniej 2 słowa, czynność zaczyna się wielką literą, w polach nie ma spójnika „aby/w celu/żeby” ani interpunkcji z szablonu; (2) każde wyrenderowane zdanie jest równe `${czynnosc}, aby ${korzysc}.` dla danego indeksu. Mutacja kontrolna (do `korzysc` w Walucie dopisane „aby ”) daje 592/2 (FAIL [C] dane CMZ oraz FAIL [A] generator). Po przywróceniu danych: 594/0. |
| Z6: testy diorama/tdn nadpisują PNG w `R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/` | **PRZYJMUJĘ** (do wiadomości integratora) | Commit Obrony zawiera wyłącznie pliki wymienione niżej. Po uruchomieniu testów `git status` nie pokazuje zmian poza nimi. Integrator nie dodaje tych PNG. |

## ZMIANY-COMMIT

Pliki zmienione w commicie Obrony (allowlista):
- `gra/src/ui/entityCards/technologyAdapter.ts`: eksport `isDeadTechCardBuilding` (+8/−1, bez zmiany zachowania karty);
- `gra/src/ui/techDiscoveryNotice.ts`: filtr martwych efektów w `buildBody()` ścieżki zapasowej (Z4);
- `gra/tools/tech-cards-top5-test.cjs`: asercje CMZ bez tautologii (Z5);
- `dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/02-operator-obrona-r1.md` (ten raport);
- `dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/obrona-r1-z4-harness/`: harness dowodowy Z4. Podmienia `entityCards/renderer` tylko dla `techDiscoveryNotice.ts` na stub, który rzuca wyjątek, co wymusza ścieżkę zapasową w Chromium.

Bez zmian: `buildings.json`, `tech.json`, `units.json`, `terrain-improvements.json`, `src/game/**`, `renderer.ts`.

## TESTY (Chromium /opt/pw-browsers, worktree Obrony)

- Harness Z4 (`node obrona-r1-z4-harness/run.cjs <gra>`):
  - po poprawce: **10/0** (Filozofia bez Teatru, Obróbka żelaza bez Wielkiej odlewni i Wielkiej Kuźni, Medycyna bez Lazaretu, Astronomia bez Obserwatorium, Waluta z Top 5 i Mennicą);
  - na `ed87b5091`: **7/3** (Teatr, Wielka odlewnia i Wielka Kuźnia widoczne). To dowód, że zarzut był realny, a poprawka działa.
- `tech-cards-top5-test`: **594/0** (wcześniej 563/0; doszło 31 nowych asercji CMZ).
- `tsc --noEmit`: **0**.
- `logic-test`: **213/213**.
- `ai-test`: **289/0**.
- `tech-tree-test`: **19/0**.
- `research-test`: **ALL GREEN**.
- `entity-card-contract-test`: **75/0**.
- `karta-technologia-uklad-real-render-test`: **11/0**.
- `tech-discovery-card-click-test`: **13/0**.
- `tech-discovery-card-real-click-test`: **12/0**.
- `tech-discovery-badge-diorama-test`: **61/2**, tak samo jak na bazie (B2 Hutnictwo żelaza, c1 diorama 190px), więc nie jest to regresja.

Czerwone przed tematem, z identycznym wynikiem na bazie `397f84f29` (pełna lista, Z1):
- `tech-discovery-badge-diorama` 61/2;
- `civpedia-karty-nazwa-przyciskiem` 25/2;
- `entity-card-action-buttons` 30/1;
- `entitycard-sufit-dwoch-kart` 58/9 (szerokość 670 zamiast 660);
- `building-detail-card-entitycard-migration` 54/1.

Niestabilne (Z2):
- `civpedia-caly-wiersz-przyciskiem`: 1 FAIL na 3 uruchomienia (pomiar Evaluatora, krok [6] kind=unit);
- `entity-card-cross-links-nested-overlay`: [2] w jednym uruchomieniu przez runner (pomiar Operatora r1).

Żywa gra: NIE_ZMIERZONO (dispatch zabrania `npm run build/dev`).

## ZAŁOŻENIA

Bez zmian względem r1 (1–5 Operatora). Nowe:
- Z-O1: ukrywanie martwych efektów w ścieżce zapasowej mieści się w „spójności Top5” z allowlisty `techDiscoveryNotice.ts`.

BLOKADY: brak
RUNDY: 1/5 (Obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control. Właściciel potwierdza założenia 1–5 i Z-O1. Proponowane osobne tematy: sekcja „Zmiany ekonomiczne” (Z3) i niestabilne testy kart w przeglądarce (Z2).
DEPLOY/PUSH: NIE WYKONANO
