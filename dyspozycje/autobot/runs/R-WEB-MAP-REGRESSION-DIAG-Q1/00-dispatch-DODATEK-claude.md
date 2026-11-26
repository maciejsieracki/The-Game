# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Test: gra/tools/map-gen-regression-test.cjs — SEEDS [42,123,777,7,2026] × TYPES [kontynenty,pangea,wyspy,ziemia] × 2 gęstości rzek; sekcje: bench czasu generacji (standardowy 168×120, duży 240×168), „Rzeki bez ujścia” (mała mapa; countBadRiverPaths: badOutlet/badReal), „Sieć rzek + dopływy” (standardowy; verifyRiverNetworkConnectivity orphanCount, checkTributaryJunctions) i dalsze; końcowe „poprawność generatora: FAIL (N twardych naruszeń)” = licznik fail. Całość ~65 min na obciążonej maszynie; dep3 wypisał tylko ostatnie 2 linie, więc szczegóły naruszeń NIE ZOSTAŁY ZAPISANE. Kandydat MAPFIX: f781bbd0a (zmiany: gra/src/map/generator.ts przebieg 3e-final, gen-helpers.ts cutBackEarthLandOutsideMask, earth-land-mask.ts — izolowany heks szablonu nie jest lądem maski). Wcześniejsze pełne przebiegi tego testu w historii projektu (rejestr) kończyły się „zero FAIL”.
## Zadanie
1. Zrób dwa worktree (kandydat f781bbd0a, baza 690947a2a) z gra/node_modules (npm ci --ignore-scripts w jednym, symlink do drugiego, usuń po pracy). Przygotuj w dyspozycje/analizy/map-regression-diag/ skrypt, który uruchamia SEKCJE testu osobno (kopia testu z parametrem sekcji albo osobne pętle) i zapisuje WSZYSTKIE linie FAIL do pliku, z możliwością wznowienia (każde wywołanie Bash ≤ 590 s, bez run_in_background; wyniki w plikach).
2. Uruchom sekcje generujące naruszenia na KANDYDACIE (zacznij od „Rzeki bez ujścia” mała mapa i „Sieć rzek + dopływy”), zbierz listę naruszeń (seed/typ/gęstość/rodzaj/liczby). Potem TE SAME seedy/typy/gęstości na BAZIE. Pomiń sekcje bench czasu (wolne).
3. Klasyfikacja każdego naruszenia: NOWE / ISTNIEJĄCE / NIEDETERMINISTYCZNE (jeśli różni się między powtórzeniami). Jeśli naruszenia są NOWE — wskaż, który przebieg MAPFIX je powoduje (ślad etapów: z/bez przebiegu 3e-final, z/bez zmiany maski) i zaproponuj minimalną poprawkę (opis; kod NIE jest w allowliście).
4. Wynik: dyspozycje/analizy/MAPREGDIAG-2026-11-26.md (tabela, wniosek: „MAPFIX bezpieczny do wdrożenia” / „MAPFIX powoduje N nowych naruszeń: …”).
## Allowlista
dyspozycje/analizy/map-regression-diag/** (skrypty, wyniki), dyspozycje/analizy/MAPREGDIAG-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-MAP-REGRESSION-DIAG-Q1/**. Zero zmian gra/src, gra/data, gra/tools.
## Zakazy
gra/src/**, gra/data/**, gra/tools/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela.
## Binarne kryterium
Lista naruszeń kandydat vs baza z klasyfikacją NOWE/ISTNIEJĄCE; jednoznaczny wniosek o wdrożeniu MAPFIX; dokument zapisany.
