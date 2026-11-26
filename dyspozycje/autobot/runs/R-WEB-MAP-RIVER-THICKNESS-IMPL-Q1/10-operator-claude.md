STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1
GOAL: na ROBOCZEJ trzy poziomy rzek wyraźnie różne grubością: dopływy ok. 0,45, średnie ok. 0,6–0,8 szerokości głównej, główne bez zmian; hierarchia main > medium > tributary w każdej szerokości kadru.
ZMIANY/COMMIT: baza 690947a2adfb7c78e656959fea77fe50d864dda2 (origin/main). Allowlista: gra/src/render/scene.ts (riverWidthMulForKind, tylko szerokości), gra/tools/river-render-levels-test.cjs (asercje szerokości przepięte, dodana asercja wzoru), docs/obieg/MAPA-RZEKI-SPEC.md (dopisana jedna sekcja o szerokościach), dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/10-operator-claude.md. Brak zmian w gra/src/map/** i gra/data/**.
Wybrane wartości (wzór):
- main = min(1,35; 0,85 + L×0,008) — bez zmian;
- medium = 0,7 × main(L) — w kadrze ≈0,595 (L=2) do 0,945 (L≥63); stosunek do głównej dokładnie 0,7;
- tributary i short = 0,45 (stała) — stosunek do głównej ≈0,33–0,53;
- najmniejsze medium 0,595 > tributary 0,45 + 0,1, więc wymuszenie z dispatchu nie było potrzebne.
Stara wartość: medium ≤0,49 (≈0,5× główna), tributary 0,30. Zmiana w grze: dopływy o 50% grubsze, średnie o ok. 40–60% grubsze.
TESTY:
- node tools/river-render-levels-test.cjs (w gra/): 19 OK / 0 FAIL (wcześniej 18 asercji).
- Mutacja czerwona (tributary = 0,9, hierarchia odwrócona): 16 OK / 3 FAIL; po przywróceniu 19 OK / 0 FAIL.
- npx tsc --noEmit (gra/): exit 0.
- vite build do katalogu poza repo (scratchpad, bez npm run build): built in 27.13s, exit 0.
- git diff --check: czysto.
- NIE ZMIERZONO (bramki ogólne z dispatchu: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, river-fog-visibility-test 31/0): nie uruchamiane w tej rundzie; zmiana dotyka tylko funkcji szerokości renderu. Orkiestrator decyduje o uruchomieniu w integracji.
- NIE ZMIERZONO (RIVVISUAL): zrzuty PRZED/PO, zbliżenia 2×/4×/8×, pomiar pikseli per poziom w kadrze 8×, FPS 5×20 s. Powód: skrypt rivers-live-measure.cjs nie jest w tym checkoucie (brak w git ls-files; ścieżka dyspozycje/analizy/rzeki-render-r3a/ nie istnieje). gra/node_modules zainstalowano przez npm ci (bez build/dev) i po pracy usunięto. Chromium z /opt/pw-browsers jest dostępny, ale bez skryptu pomiarowego pomiaru nie wykonano.
BLOKADY:
1. Bramka wizualna RIVVISUAL nie zamknięta: brak skryptu pomiarowego w repo. Wymaga dostarczenia skryptu albo osobnej rundy z jego ścieżką.
2. Czytelność grubszych rzek w zbliżeniach (zasłanianie terenu i miast) nie oceniona. Zgodnie z pkt 4 dispatchu nie rozstrzygam sam; decyzja po zrzutach.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje kod, test i zakres allowlisty. Przed Final Control trzeba dostarczyć skrypt RIVVISUAL albo świadomie zamknąć bramkę wizualną bez pomiaru pikseli.
UWAGI-DLA-ORKIESTRATORA: Tabela w docs/obieg/MAPA-RZEKI-SPEC.md §5 nadal podaje dopływ 50% (dane sprzed RIVERS3A). Zostawiłem ją bez zmian, poza dopisaną sekcją o szerokościach.
DEPLOY/PUSH: NIE WYKONANO
