STATUS: BLOCK
DOMAIN: GAME (recon, bez zmian kodu)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2× źródeł), zero zmian w gra/**
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md (przepisany po zarzutach) + ten raport; baza kandydata 63577fad2 (przodek = f341dd5), kod gry bez zmian. SHA czubka: patrz pole sha w odpowiedzi.
TESTY:
- Pomiar ponowiony (ZMIERZONO, bundle esbuild z gra/src/map/generator, `generateMap(w,h,seed,'kontynenty',{worldDensity.rivers:'medium',…})`): 240×168 seed 99 = main 203/2684 hex, medium 103/1466, tributary 118/1879, czas 205 016 ms; 240×168 seed 2026 = main 234/2917, medium 96/1338, tributary 103/1554, czas 213 193 ms. Zgodne z poprzednim pomiarem (seed 99: 207 031 ms; seed 2026: 211 042 ms).
- `node tools/medium-river-test.cjs` (lekki, ZMIERZONO): `medium-river-test: 38 pass, 0 fail`, EXIT 0.
- Nie uruchomiono: river-path-adjacency-test (15 map, ~20 min), river-density-test, river-grid-coverage-test (ciężki, 336×238), river-mouth-gap-enforce-test (tylko w gałęzi bde050bcf). NIE ZMIERZONO.
- `git status` po zakończeniu: jedyna zmiana to dokument analizy; `gra/**` nietknięte; gra/node_modules i wygenerowane pliki .medium-river-* usunięte.

ODPOWIEDZI NA ZARZUTY (raport Evaluatora 9b89215e7, FAIL, 8 zarzutów):

1. PRZYJMUJĘ. Pkt 3 dispatchu (podwojenie źródeł, N/√2, 15 map + mapy stałe/Ziemia) NIE wykonany: nie ma zmiany w kodzie ani w skrypcie pomiarowym dla wariantu 2×. Dokument mówi to wprost (sekcja 3–4, NIE ZMIERZONO). Brak dowodu → przyjęte.

2. PRZYJMUJĘ. Wpływ bde050bcf na liczbę rzek i czas NIE ZMIERZONO (wymaga checkoutu gałęzi, nie wykonano). Kolizje z 2× źródłami, buforem od morza i odstępem ujść: NIE ZMIERZONO. Liczba „+12%” pochodzi z wiadomości commita bde050bcf („wydajnosc +12% potwierdzona”) i została oznaczona w dokumencie jako twierdzenie autora, nie fakt zweryfikowany. Usunięto sformułowanie sugerujące potwierdzenie.

3. PRZYJMUJĘ. Lekkie testy rzek: uruchomiono tylko `medium-river-test.cjs` (38/0). Pozostałe nie uruchomiono. Przypisanie testów do zmian (a)/(b)/(c) w sekcji 6 dokumentu oznaczono jako hipoteza po nazwie; progi podano z linii plików (grep), nie z wyniku. Dla river-density-test (l.63–64: ≥120 tras, ≥600 heksów) i river-grid-coverage-test (l.156 hexMin 0,75/0,5; l.160 masa 150/200) dodano linie, a nie wyniki.

4. PRZYJMUJĘ. Warianty przepisane na trzy zgodnie z dispatchem: A = trzeci poziom jako `short` (etap 3 domyślnie), B = pokazać domyślnie `tributary` bez nowego typu, C = nowy czwarty typ. Wariant B ma liczby widoczności z pomiaru (240×168 seed 99: 306 → 424; seed 2026: 330 → 433; 168×120 seed 42: 162 → 229). Koszt generowania i liczba `short` po włączeniu etapu 3: NIE ZMIERZONO, oznaczono. Ryzyko dla pinów: wskazane w sekcji 6 jako hipoteza po nazwie.

5. ODRZUCAM CZĘŚCIOWO Z DOWODEM. Przeszukano `docs/archiwum/**`, `docs/decyzje/**`, `docs/obieg/**`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `dyspozycje/PYTANIA-OTWARTE.md` słowami: `trzeci poziom`, `trzeciego poziomu`, `poziom 3`, `krótk… rzek`, `dopływ`, `tributary`, `AC-7`, `FALA 170`, `monoton…` (grep -rnE, wyniki w dokumencie: trafienia dotyczą innych tematów — `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md:118`, `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md:102,210`, `docs/decyzje/A3-SPEC-WDROZENIA.md:95`). Cytaty linii dodano: `MAPA-RZEKI-SPEC.md:29,32–35,38,69–78,126`; `MAPA-KANON-GENERATOR.md:34–35`; `PYTANIA-OTWARTE.md:1580–1587, 1793, 1809–1811, 1969–1970`. Wniosek „trzeci poziom NIE ZNALEZIONO” utrzymany. Zastrzeżenie: REJESTR (~1500 linii) nie został przeczytany w całości — wniosek dotyczy wyników grepa.

6. PRZYJMUJĘ Z UZUPEŁNIENIEM. Rozbieżność N=15 (spec §2, tier „Normalnie”, opisany jako „woda + miedź”, `MAPA-FAIR-PLAY-SIATKA.md` 15×15 = woda) vs `mainCell=5` (`newGameMapDefaults.ts:281–285`, komentarz „Maciej 2026-08-01: medium 10→5”) — dokument przedstawia dowód: kod jest nowszy od wpisu specu (2026-07-04). Dokument wdrożenia „20:34” NIE odczytany → rozstrzygnięcie NIE ROZSTRZYGNIĘTE. Fallback `gen-helpers.ts:8600–8602` (bez w,h) zwraca 10 dla medium — niespójność w kodzie, zapisana.

7. PRZYJMUJĘ. Niespójności w dokumencie poprawiono: zakres dopływów to 8–146 (min. z tabeli: 84×60 seed 1 = 8); „13 pomiarów” zastąpiono opisem 15 map (13 z poprzedniej rundy, 2 ponownie zmierzone w tej); „Dla 4 wariantów” → trzy warianty A/B/C; czas 240×168 seed 1 = 219 828 ms (nie 207–211 s — tamte wartości to seedy 99 i 2026); etykieta rundy ujednolicona do „runda 2”; stała min. odstępu źródeł (~0,8·N) wskazana ze specu §2 (`MAPA-RZEKI-SPEC.md`), quota z pkt 4 nie wskazana w kodzie — dopisano jako NIE ZNALEZIONO w kodzie (zakres: `resolveRiverMapParams` i `riverGridCellSizeForTier` nie zawierają quoty).

8. PRZYJMUJĘ. Pomiar był nieodtwarzalny z repo. Dodano metodę (esbuild bundle `generateMap`, parametry wywołania, pliki listy map `gra/tools/river-path-adjacency-test.cjs:25–29`) i ponownie wykonano 2 z 15 map w worktree kandydata (wyniki zgodne). Skrypt pozostaje w scratchpadzie sesji (poza allowlistą, nie commitowany). Czasy: pojedyncze przebiegi, oznaczone.

## Dowody (surowe wyjścia skrócone)
- `[civ] riverGenPhase: main+medium (główne+średnie; pełny tor: ?riverGenPhase=all)` (240×168 seed 99)
- `{"w":240,"h":168,"seed":99,"ms":205016,"cnt":{"main":{"n":203,"hex":2684},"medium":{"n":103,"hex":1466},"tributary":{"n":118,"hex":1879}}}`
- `{"w":240,"h":168,"seed":2026,"ms":213193,"cnt":{"main":{"n":234,"hex":2917},"medium":{"n":96,"hex":1338},"tributary":{"n":103,"hex":1554}}}`
- `medium-river-test: 38 pass, 0 fail`
- `gra/src/render/scene.ts` — `return 2; // FALA 174: główne + średnie (Maciej playtest)` oraz `filterRiverPathsForStage` (stage ≥3 dodaje `short` i `tributary`).

## Co pozostało niezrobione (blokady)
- Pkt 3/4: liczba rzek i czas po 2× źródłach (N/√2 albo 2 starty na komórkę) na 15 mapach — NIE ZMIERZONO.
- Pkt 4: wpływ bde050bcf na liczbę rzek i czas; kolizje z sąsiedztwem/buforem/odstępem ujść — NIE ZMIERZONO.
- Pkt 5: koszt generowania wariantów A/C i liczba `short` z etapem 3 — NIE ZMIERZONO.
- Pkt 7: lekkie testy rzek poza `medium-river-test` (river-path-adjacency, river-sea-buffer, river-confluence-edge itd.) i piny/hashe — NIE ZMIERZONO.
- Decyzje wymagane od właściciela (nie rozstrzyga Operator): wariant A/B/C; widoczność `tributary` domyślnie; N=15 vs 5 dla siatki rzek.

RUNDY: 3/5 (ta runda = obrona r2 po FAIL Evaluatora; dokument przepisany, pomiar 2 map ponowiony, lekki test 38/0).
NASTĘPNY KROK: Evaluator/Final Control ponownie ocenia kryterium; przy braku pkt 3/4/7 wynik pozostaje BLOCK. Do odblokowania potrzebna runda z wariantem 2× źródeł (zmiana w scratch-kopii, nie w gra/**) i uruchomieniem river-path-adjacency-test oraz river-density-test.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Gałąź RIVMOUTH-wip/fc3 (bde050bcf) jest oparta na starszym main: NIE scalać całościowo; integracja tylko cherry-pick gen-helpers.ts (+101) i river-mouth-gap-enforce-test.cjs (+106) na aktualny main.
- Wiadomość commita bde050bcf zawiera „wydajnosc +12% potwierdzona” — nie zweryfikowano w tej rundzie.
- Rozbieżność N=15 (spec §2) vs mainCell=5 (kod, od 2026-08-01) wymaga decyzji właściciela lub odczytu dokumentu „20:34”.
- Niespójność fallbacku `riverCoverageCellSize` (10 dla medium bez w,h) vs 5 w `riverGridCellSizeForTier` — do osobnego zgłoszenia.
