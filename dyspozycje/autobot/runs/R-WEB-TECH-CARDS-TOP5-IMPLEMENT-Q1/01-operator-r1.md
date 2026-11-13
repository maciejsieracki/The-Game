STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — karty odkryć (UI + dane treści)
TEMAT: R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Wdrożenie etapu 1 kart odkryć: Top 5 bezpośrednio po Rysie historycznym, CMZ jako CZYNNOŚĆ → KORZYŚĆ, efekty martwe ukryte. Źródło treści: odkrycia-top5.csv (FC 58339997b).

ZMIANY-COMMIT (baza origin/main 397f84f29; commit kodu dc4a76d34, raport i poprawka testu w commicie tego raportu):
- `gra/src/ui/entityCards/technologyAdapter.ts`: nowa sekcja `top5` („Top 5 korzyści”, layout `top3`) na indeksie 2 tablicy `sections`, więc renderer (HISTORIA_SECTION_INDEX=2, bez zmian) stawia ją zaraz po Rysie. CMZ czytane z danych (layout `prose`). Fallback na stare szablony tylko wtedy, gdy brak wpisu (dziś 0/32). Usunięty wiersz „Nie oznacza”. Efekty martwe ukryte: `ukryte` oraz reguła `suppressed` / `epokaWejscia>3`. Ulepszenia czytane z `terrain-improvements.json` (`terrainUnlockLabelsForTech`). Nowa sekcja „Cuda” z oznaczeniem narodowy/wyścig i „maks. 1 na świecie”. Eksport `techCardContentOf` i `cmzSentence`.
- `renderer.ts`: tylko CSS bloku Top5 (pozycja 1 wyróżniona). Logika wstawiania bez zmian.
- `techDiscoveryNotice.ts` (ścieżka zapasowa): CMZ i Top5 z tych samych danych, bez „Nie oznacza”.
- `gra/data/tech-cards-top5.json` (nowy, 32 wpisy).
- `gra/tools/gen-tech-cards-top5.cjs` + `.zdania.json`: odtwarzalny generator (`--check`). Zdania, nadpisania i pominięcia mają zapisany powód. Kopia CSV: `runs/<ID>/zrodlo/odkrycia-top5.csv` (sha256 1c3b9a14…).
- `gra/tools/tech-cards-top5-test.cjs` (nowy).
- Świadome zmiany asercji w istniejących testach: `karta-technologia-uklad-real-render-test.cjs` (nowa kolejność sekcji: +top5, +wonders) i `entity-card-cross-links-nested-overlay-test.cjs` [4] (`scrollIntoView` przed klikiem, bo karta urosła; asercja bez zmian).

POMIAR (A): kolejność sekcji jest w `technologyAdapter.ts`, a Rys wstawia `renderer.ts:461-495`. `techDiscoveryNotice.ts:200-225` miał własne szablony CMZ, teraz ujednolicone. `wikiBundle.json` nie zawiera treści karty (grep „Co możesz teraz” = 0), więc Cywilopedia renderuje ten sam adapter.

ZAŁOŻENIA (do potwierdzenia przez właściciela):
1. Q3: wiersz „Nie oznacza” usunięty. Q5: ulepszenia z `terrain-improvements.json` (doszły Kopalnie miedzi, cyny i żelaza oraz Stadnina). Q6: sekcja „Cuda” jest.
2. Zdania wyjaśniające (decyzja Q1) zredagował Operator na podstawie ANALIZY i turniejów. CSV ich nie zawierało.
3. Astronomia ma 0 realnych pozycji: jej jedyny efekt (Obserwatorium) jest ukryty, a CMZ = NIE_USTALONO. Sekcje Top5 i CMZ nie są renderowane. To jedyny jawny wyjątek od reguły „1–5 pozycji”.
4. Astronomia nie występuje jako cel „otwiera…” (Matematyka Top1, Religia Top3). W „Kolejnych technologiach” zostaje, bo jest realną technologią.
5. Mennica: tytuł zapisany jako „×1,50”, a w CMZ „×1,5” zamieniono na „×1,50” dla spójności.
6. Ukryte: Teatr, Wielka odlewnia, Wielka Kuźnia, Obserwatorium, Lazaret.

TESTY:
- `tech-cards-top5-test.cjs`: 563 pass / 0 fail (32/32, Top5 po Rysie, CMZ w schemacie, zero zakazanych fraz, fallback 0/32, Mennica ×1,50 + handel, generator `--check` OK).
- `npx tsc --noEmit`: 0. `logic-test`: 213/213. `ai-test`: 289/0. `tech-tree-test`: 19/0. `research-test`: ALL GREEN.
- Karty, zielone: entity-card-contract 75/0, karta-technologia-uklad 11/0, technology-discovery-card-visual 48/0, entity-card-historia-section 36/0, tech-discovery-card-click 13/0, real-click 12/0, tech-unlock-units 129/0, civpedia-* (spojnosc 24/0, caly-wiersz OK, rys-historyczny GREEN, historia-infra 18/0), entity-card-single-dialog 25/0, entitycard-civpedia-klik 71/0, cross-links-nested 24/0, scrollbar (xvfb) 29/0, improvement-card-* 36/0 i 12/0.
- Czerwone przed tematem (zmierzone na bazie 397f84f29 z oryginalnymi plikami): tech-discovery-badge-diorama 61/2, civpedia-karty-nazwa-przyciskiem 25/2, entity-card-action-buttons 30/1, building-detail-card-migration 54/1. Wyniki identyczne przed i po zmianie.
- Uwaga: jedno uruchomienie cross-links przez runner dało niestabilne niepowodzenia [2] na karcie jednostki. Bezpośrednie uruchomienia po poprawce: 24/0 (dwa razy).

WERYFIKACJA WIZUALNA (E): Chromium 1194 (Playwright), harness esbuild z prawdziwym adapterem i rendererem, ikony brandAssets podmienione na stub. Zrzuty w `screens/` (waluta, wojskowosc, brazownictwo, astronomia, medycyna, matematyka .png).
- Waluta: Top5 zaraz po Rysie, pozycja 1 „Mennica: ×1,50 podatku (handlu)…” wyróżniona, potem 2 zdania CMZ.
- Brązownictwo: 5 pozycji, 4 zdania CMZ, Ulepszenia: Kopalnia miedzi i Kopalnia cyny.
- Matematyka: Top1 „Otwiera drogę do Budownictwa, Waluty i Oblężnictwa”, sekcja Cuda (Ziggurat, Mundo Perdido jako cuda narodowe).
- Astronomia: tylko Wymagania, Charakterystyka i Rys.
- Medycyna: 2 pozycje, bez Lazaretu.
Żywej gry (main.ts, popup po odkryciu) NIE_ZMIERZONO: dispatch zabrania `npm run build/dev`.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator. Właściciel potwierdza założenia 1–6, w tym tekst zdań i wyjątek Astronomii.
DEPLOY/PUSH: NIE WYKONANO
