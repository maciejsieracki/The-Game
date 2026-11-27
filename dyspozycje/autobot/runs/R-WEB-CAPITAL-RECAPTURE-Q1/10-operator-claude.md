STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-RECAPTURE-Q1 (tag CAPRECAP)
GOAL: zmierzyć ścieżki odzyskania zbuntowanej stolicy AI i naprawić tylko po odtworzeniu błędu.
ZMIANY/COMMIT: nowe: gra/tools/capital-recapture-stale-designation-test.cjs, dyspozycje/analizy/STOLICA-ODBICIE-PO-BUNCIE-2026-11-27.md, ten raport. Zero zmian gra/src (poprawka NIE wdrożona: błąd odtworzony tylko na module czystym, nie live). Baza af3e0f141; commit = czubek gałęzi (SHA w odpowiedzi orkiestratorowi).
TESTY:
- Odczyt kodu: main.ts:2479, 40167 (capitalCityIdForOwner), 41828 (transferCityToRebelFactionWithLedger), 40764 (surowy designatedCapitalId), game/capital-capture.ts:102 (wasCapitalOfOldOwner).
- capital-recapture-stale-designation-test.cjs (esbuild z ESBUILD_DIR, bez przeglądarki): S1-po-buncie efektywna stolica city1, surowy wpis city2 (nieważny); S1-przejęcie efektywnej stolicy: wynik capture = null (NIEZGODNE z resolverem); KONTROLA z wyczyszczonym wpisem: przejecie_stolicy (OK); S2 odzyskanie city2: stolica wraca na city2 automatycznie.
- Bramki z dispatchu (tsc, logic, ai-test, capital-capture-test, wiring...): NIE URUCHAMIANO — brak zmian gra/src, nic do bramkowania.
- Scenariusze live S1–S5 (Chromium, Trudny, Wysoki x4, seed 4242 i 7, 3 konfiguracje): NIE ZMIERZONO. Powód: w tej rundzie nie zbudowano wersji live i nie odtworzono przejęcia stolicy armią (cesja hakiem nie idzie ścieżką applyCapitalCapturePlunder).
- Mennica/efekty stolicy po przejęciu, round-trip zapisu (S5): NIE ZMIERZONO.
BLOKADY: brak twardej blokady. Otwarte: pomiar live S1–S5; decyzja, czy przejęcie faktycznej stolicy AI ma uruchamiać plunder i sukcesję (zmiana zachowania gry — pytanie ABC, nie decyzja inżynierska).
RUNDY: 1/5
NASTĘPNY KROK: (a) orkiestrator decyduje, czy wdrożyć poprawkę (czyszczenie wpisu stolicy przy zmianie właściciela w transferCityToRebelFactionWithLedger i ścieżce cesji; szczegóły w analizie §5) po odpowiedzi na pytanie o zamierzone skutki przejęcia; (b) osobna runda live S1 z przejęciem stolicy armią, żeby potwierdzić rozjazd w grze.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Odnaleziony defekt (potwierdzony kodem i modułem czystym): surowy wpis capitalCityIdByOwner po buncie stolicy AI wskazuje miasto -99, a wasCapitalOfOldOwner używa go jako całego kryterium. Przejęcie faktycznej stolicy (fallback = najstarsze miasto) nie daje plunderu/sukcesji i nie pokazuje zdarzenia „przejęcie stolicy”. Skutek w grze do potwierdzenia live.
- Narzędzie pomiarowe przyjmuje ESBUILD_DIR; bez niego szuka gra/node_modules (nieobecne w worktree).
