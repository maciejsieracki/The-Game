STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-GRANARY2-PISMO-ROYAL-RENAME-Q1
GOAL: Spichlerz II (id `spichlerz_ii`) odblokowuje się technologią Pismo i nazywa się „Spichlerz Królewski". Id i logika bez zmian.
ZMIANY/COMMIT: baza origin/main 3aa1b3a2a; kod 4188954d6, raport r1 8cafe8463, obrona r2 6062de9bc (SHA końcowy do integracji: 6062de9bc + commit tego raportu). Diff 17 plików: buildings.json, tech.json, econ-params.json (tylko opisy), resources.json (Uwagi), wikiBundle.json (tylko napisy), empireDetailTypes.ts, hud.ts, granary2-tech-data-guard-test.cjs, 5 plików docs (poradnik 07/08/45, encyklopedia spichlerz/pismo), run + 3 zrzuty. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle, gra/src/game. Allowlista rozszerzona założeniem (docs/econ-params/resources) — akceptuję, GOAL wymienia wprost opisy data/*.json i wiki/poradnik.
ORZECZENIA:
1. Brak pełnego panelu z czerwonym chipem Pismo: ODDAL. Logika chipa (techUnlock -> missingTech) nie zmieniona; strażnik danych 14/0 dowodzi techUnlock=Pismo i missingTech; harness Chromium (renderBuildList z realnym buildings.json) pokazuje wiersz zablokowany bez Pisma i aktywny z Pismem. Pełny panel wymagałby vite build (zakaz). NIE_ZMIERZONO: kolor chipa w pełnym CSS.
2. Nawias w uwagi spichlerz_ii: NAPRAWIONE w r2 (zweryfikowane, JSON parsuje się).
3. Rozjazd docs/bundle/data: NAPRAWIONE w r2 (bundle bez „Spichlerz II": 0 trafień; docs/data zsynchronizowane).
4. Komentarze w gra/src: ODDAL. Sprawdzone grepem: wszystkie trafienia „Spichlerz II" w gra/src to komentarze/JSDoc; stringów widocznych dla gracza brak.
TESTY (odtworzone samodzielnie po npm ci --ignore-scripts, node_modules usunięte):
- granary2-tech-data-guard-test PASS 14 / FAIL 0, EXIT=0
- tsc --noEmit EXIT=0
- 20 testów (ai-granary-prog-populacji-spojnosc, building-resource-visibility(+ui), civpedia-budynki-historia, civpedia-technologie-rys-historyczny, deposit-building-gate, entitycard-civpedia-klik, grupy-budynkow, owned-building-inactive, population-growth-v85-bonus, popcap-spichlerz2-akwedukt20, pr141-matrix-only-data-wiki, 8x spichlerz-*): EXIT=0 każdy
- ai-test 274 passed / 20 failed = baseline
- git diff --check czysto
- koszty-surowcowe 3 FAIL i budynek-garnizon 1 FAIL: dług sprzed tematu (pliki poza diffem), wg Operatora/Obrony; nie ponawiane.
BLOKADY: brak blokujących. Notatki: (a) NIE_ZMIERZONO kolor chipa w pełnym panelu; (b) rozbieżność poza tematem: encyklopedia pismo.md koszt 90 vs tech.json 180 — do osobnego tematu; (c) komentarze gra/src ze starą nazwą — kosmetyka.
RUNDY: 2/5 (Final Control: werdykt końcowy)
NASTĘPNY KROK: integracja orkiestratora na świeżym origin/main (3aa1b3a2a). Kolejność względem origin/rust-port/parity-v2 (b520768b0): najpierw main (ten temat), potem REPIN Rust po zmianach weba; brak konfliktu plików (zero zmian w rust-port).
DEPLOY/PUSH: NIE WYKONANO
