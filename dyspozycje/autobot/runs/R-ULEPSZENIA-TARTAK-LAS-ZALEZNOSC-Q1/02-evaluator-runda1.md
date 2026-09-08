STATUS: PASS-WITH-NOTES

DOMAIN: GAME

TEMAT: R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1

GOAL: Część A — strażnik ponownej weryfikacji lasu przy komicie budowy AI tartak/oboz_lowiecki
(naprawa wyścigu). Część B — świadome dołączenie `tartak` do `FOREST_DEPENDENT_IMPROVEMENT_KEYS`.

ZMIANY/COMMIT: Zweryfikowany niezależnie commit `678fd999` na
`autobot/R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1`. Diff main.ts (strażnik ~32588-32591) i
improvement-build.ts (FOREST_DEPENDENT_IMPROVEMENT_KEYS + komentarz) zgodny z opisem raportu
Operatora. Allowlista dotrzymana: dokładnie 9 plików zmienionych (main.ts, improvement-build.ts,
6× gra/tools/*.cjs przekotwiczone, 1× nowy plik testowy), `auto-improvements.ts` NIEdotknięty
(potwierdzone `git show --stat`), `KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` i
`dyspozycje/.../runs/.../` niedotknięte (zgodnie z dyspozycją). Roboczy worktree i git po
weryfikacji czyste (brak osieroconych symlinków/plików tymczasowych).

TESTY (uruchomione niezależnie przeze mnie):
- `tsc --noEmit` (symlink node_modules z głównego drzewa, usunięty po): 0 błędów. Potwierdzone.
- `tartak-oboz-wyscig-race-test.cjs` na kodzie PO zmianie: 8/8 PASS. Potwierdzone.
- Ten sam test uruchomiony przeciw main.ts SPRZED zmiany (odtworzone przez
  `git show 678fd999^:gra/src/main.ts` do osobnego katalogu, `RACE_SRC_DIR`, bez modyfikacji
  worktree Operatora) — dokładnie 4/8 FAIL (A1/A2/B1/B2), 4/8 PASS (C1/C2/D1/D2). Metoda
  ekstrakcji kodu (anchor-based, nie transkrypcja) zweryfikowana jako solidna. Dowód
  nietautologiczności potwierdzony niezależnie.
- `map-improvement-qualify-test.cjs`, `oboz-lowiecki-las-test.cjs`, `oboz-lowiecki-ev-r2-mainpath.cjs`
  uruchomione na WERSJI SPRZED zmiany (Operatora — starymi asercjami, przez `git worktree add`
  na commit `678fd999^`) — dają odpowiednio 1/19/1 pre-istniejących FAIL, identycznie jak w
  raporcie Operatora. Te same 3 pliki + `oboz-lowiecki-fc-r2-nowa-sciezka.cjs`,
  `hodowla-las-test.cjs`, `stadnina-las-test.cjs` uruchomione na kodzie PO zmianie: identyczne
  liczby FAIL (1/19/1/0/0/0) — potwierdzone 0 nowych regresji.
- `oboz-lowiecki-ev-r2-mainpath.cjs`, sekcja D (5 map, 538 heksów z lasem): potwierdzone na żywo —
  "tartak poddany wyrębowi: 538 · tartak ZOSTAŁ: 0" (log zmienił się z "ZOSTAŁ: 538" przed zmianą
  na de facto "znika na WSZYSTKICH" po zmianie) — realny dowód silnika dla kryterium B, nie tylko
  test jednostkowy stałej.
- Kontrakt `auto-improvements.ts` (linie 80-84, spłaszczanie wzgórza pod ulepszeniem, klucz
  `forestKeptUnderImprovement` w main.ts ~12819-12822) odczytany i potwierdzony jako logicznie
  niezależny od `FOREST_DEPENDENT_IMPROVEMENT_KEYS`/`stripImprovementsWhenForestRemoved` — różne
  mechanizmy, zero punktów stycznia w kodzie. Zgadzam się z ustaleniem Operatora.

BLOKADY: brak.

RUNDY: 1/5 (Evaluator).

NASTĘPNY KROK: Evaluator → Final Control (Ścieżka A, Workflow), z uwzględnieniem ZARZUTU #1 niżej.

DEPLOY/PUSH: NIE WYKONANO

ZARZUTY:

1. [UMIARKOWANY — weryfikacja niekompletna, nie potwierdzony żywy bug] Raport Operatora zamyka
temat sprawdzenia "komitu GRACZA" (ZADANIE pkt 1 dyspozycji: "Sprawdzić czy analogiczny brak
dotyczy też komitu GRACZA (nie tylko AI) — jeśli tak, naprawić symetrycznie") zdaniem: "Ścieżka
gracza (applyBuildRequest/commitBuildRequest) zweryfikowana i NIE wymaga symetrycznej łaty (...)
brak okna wyścigu analogicznego do AI". To zdanie sprawdza WYŁĄCZNIE ręczną ścieżkę kliknięcia
gracza. Istnieje jednak DRUGA, całkowicie odrębna ścieżka komitu gracza, którą raport w ogóle nie
wspomina: automat ulepszeń gracza (`main.ts`, ok. linii 30422-30552, blok
"R-AUTO-ULEPSZENIA-Q1=C" — `for (const pick of picks)` na wyniku `pickAutoImprovements`). Dla
`pick.key` w {'tartak','oboz_lowiecki'} ta pętla dopisuje wprost do `placedImprovements` (linie
~30517-30532) BEZ żadnej ponownej weryfikacji `nakladka === Nakladka.Las` tuż przed wpisem —
strukturalnie identyczny wzorzec luki jak w pętli AI SPRZED tej poprawki (plan budowy powstaje
wcześniej — wywołanie `pickAutoImprovements` — a commituje się dopiero w pętli niżej). Miejsce ma
znaczenie: to trzecie miejsce w kodzie piszące tartak/oboz_lowiecki do `placedImprovements` (obok
już zbadanych: pętli AI i `applyBuildRequest`/`commitBuildRequest`), i dyspozycja nie zawężała
weryfikacji do jednej konkretnej funkcji gracza. Moja własna analiza sugeruje, że ta konkretna
ścieżka może być bezpieczna Z INNEGO powodu niż podano w raporcie — `tickHexClearing` gracza
(jedyne źródło INSTANT usunięcia lasu w danej turze dla gracza) wykonuje się wcześniej w TEJ SAMEJ
funkcji (linia ~29231) niż wywołanie `pickAutoImprovements` (linia ~30441), więc `picks` zawsze
widzi już zaktualizowaną nakładkę, a wpisy `wyrab` wewnątrz samej listy `picks` nie usuwają lasu
instant (wieloturowe liczenie) — ale to ustalenie nie zostało nigdzie w raporcie zademonstrowane,
przetestowane ani nawet wspomniane. To dokładnie ten rodzaj luki weryfikacyjnej, przed którym
ostrzega REGUŁA PRZECIW SAMOOSZUKIWANIU tego tematu (twierdzenie o braku okna wyścigu bez pokrycia
wszystkich miejsc zapisu do `placedImprovements`). Rekomendacja dla Final Control: albo Operator
dopisze krótkie uzasadnienie/test pokrywający tę trzecią ścieżkę (nawet jeśli wniosek pozostanie
"bezpieczne, bo kolejność tick→pick"), albo runda zostanie zamknięta z jawnie udokumentowaną,
świadomą luką w zakresie weryfikacji (nie w kodzie).
