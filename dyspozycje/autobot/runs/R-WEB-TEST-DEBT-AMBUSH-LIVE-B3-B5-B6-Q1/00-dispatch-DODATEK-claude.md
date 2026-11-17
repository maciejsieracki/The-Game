
## DODATEK 1 (runda 2 po FC FAIL r1, 2026-11-17) — BAZA = pełne SHA z `git rev-parse f017f50a2` (kandydat r1; zawiera poprawkę B6 `03fdecd25`)

Final Control r1: FAIL — B3 i B5 nadal czerwone (24 PASS / 2 FAIL); B6 naprawiony (sterownik testu: przycisk AUTO w oknie przedbitewnym zamiast dopasowania `/szybk/` trafiającego w SZYBKA WYMIANA — zostaje). **Przyczyna B3/B5 ustalona przez Obronę: geometria fixture, nie defekt kodu** — AI atakuje garnizon miasta Rzym (16,17) z (16,16) zwykłym rozkazem `attack`, a zasadzka (18,15) leży poza jego trasą, więc ujawnienie (`resolveAmbushAfterMove`, `ambushMove.ts:107-118`: wymaga dystansu 1 do heksu zasadzki) nie zachodzi. To NIE jest decyzja produktowa — FC: NAPRAW.

ZADANIE (jedno): przebuduj `setupAi` (fixture scenariusza B w `gra/tools/ambush-live-test.cjs` / `ambush-live-vite.config.ts`) tak, aby zasadzka leżała NA TRASIE ruchu AI (np. zasadzka w heksie przylegającym do ścieżki AI do jego celu — odczytaj trasę z logu komend AI/pozycji jednostek AI w kolejnych turach, nie zgaduj), i B3/B5 wykazały realne ujawnienie zasadzki przy ruchu AI. Wymagania:
1. Dowód logiem: zapisz w raporcie pozycje AI w turach 2–3 i komendy AI (np. `[AI 1] ...`), z których wynika, że trasa AI przechodzi obok zasadzki (dystans 1 po ruchu).
2. B3/B5 zielone (cel 26/26), każda zmieniona asercja ma dowód mutacyjny (kopia pliku, NIE `git checkout`): odwrotne zachowanie (zasadzka poza trasą) → czerwień.
3. Nie osłabiaj asercji ani nie zmieniaj reguł zasadzek/AI (`gra/src` bez zmian); jeśli fixture nie da się zmusić po 2 różnych podejściach — jawnie BLOCK z logiem, nie zgaduj.
4. Pozostałe testy bez zmian: ambush-core 48/0, save-roundtrip 7/0, ui-reason 10/0, wiring 28/0, realstep 16/0.
5. ZAKAZY (r1 je naruszył): **żadnych `rm`, `rm -rf`, `rmdir`, `unlink`** — także na katalogach scratchpad/tmp i skryptach tymczasowych (orkiestrator sprząta); używaj nowych unikalnych ścieżek w /tmp. Katalogi `/tmp/ambush-live-dist-*` zostają dla orkiestratora.
Zakazy bez zmian: `git add -A`, `npm run build/dev` w `gra/`, PNG nie do repo, nie wypychaj. Model Operatora: HAIKU (r2 tego ID; Sonnet dopiero po 2 nieudanych rundach Haiku — to dopiero 1. nieudana pełna runda).
