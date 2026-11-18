# R-WEB-TEST-DEBT-Q6 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (tylko testy; dane i logika nietknięte)
TEMAT: R-WEB-TEST-DEBT-Q6
GOAL: spłata długu testowego po FALACH 840–846 bez zmian zasad gry, logiki i asercji.
BAZA: e29f8c8b3 (origin/main), worktree wf_1bf9e5b0-744-1, `npm ci --ignore-scripts` w gra/.

ZMIANY-COMMIT (allowlista):
- gra/tools/ai-economy-measure-hook-test.cjs: bez `--dist` test sam buduje bundle `npx vite build --outDir <os.tmpdir()/ai-economy-dist-…> --emptyOutDir` (bez prebuild, poza repo). Z `--dist` zachowanie bez zmian. Asercje nietknięte.
- gra/tools/card-resource-purpose-test.cjs: dwa nieaktualne regexy dopasowane do aktualnego kodu, ta sama treść sprawdzana. (a) `[W]` etykieta `pieniadz` = „Podatek”: kod ma `{ key: 'pieniadz', label: 'Podatek', chip: 'podatek' }`, stary regex wymagał `}` zaraz po etykiecie. (b) `[B]` utrzymanie budynku w Pieniądzu: kod renderuje chip `{ id: 'pieniadz', amount: gold }` (R-WEB-UI-RESOURCE-ICONS), a nie tekst „N Pieniądza”.

TESTY (liczby z surowego wyjścia):
- ai-economy-measure-hook-test (bez argumentów): przed BLAD ERR_FILE_NOT_FOUND (brak DIST); po 23/23 ZIELONE, exit 0.
- card-resource-purpose-test: przed 101 pass / 2 fail; po 103 pass / 0 fail, exit 0.
- Mutacje kopii (poza repo): M1 etykieta „Podatek” -> „Pieniądz” = 102 pass / 1 fail (czerwone); M2 `id:'pieniadz'` -> `'zywnosc'` w utrzymaniu = 102 pass / 1 fail (czerwone).
- building-cards-top5-test: przed 1207 pass / 1 fail; po 1207 pass / 1 fail, exit 1. Jedyna czerwień: [B] spichlerz „każda pozycja ma tytuł i jedno zdanie”. top5[0].zdanie = „Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców. Spichlerz zużywa 10 ceramiki na turę.” ma dwa zdania. Źródło to korekty generatora (poza allowlistą); dane karty nietknięte.
- gen-building-cards-top5.cjs --check: exit 0 (po cofnięciu zmiany CSV, pkt 2 poniżej).
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test exit 0 („All sanity checks passed”).

BLOKADY / DECISION_REQUIRED:
1. Spichlerz (building-cards-top5). Pytanie do właściciela: (A) przepisać top5[0].zdanie na jedno zdanie w korektach generatora i wygenerować dane ponownie (zmiana treści karty, poza allowlistą tematu) albo (B) poluzować regułę testu do „jedno zdanie główne”. Rekomendacja Operatora: A, bo test wymaga jednego zdania, a tekst go łamie. Asercji nie osłabiam samodzielnie.
2. Wiersz 13 CSV „Garncarnia … do 50” (dyspozycje/analizy/karty-budynkow/budynki-top5.csv): NIE zmieniono. Wartość 50 jest nieaktualna względem econ-params (30 w epoce 1, 50 w epoce 2, +20 na epokę; decyzja 2026-11-14). Generator kotwiczy jednak korekty (card-text-corrections.cjs, klasa R) na dokładnej frazie „do 50 sztuk na turę” w tym CSV. Próba poprawki CSV złamała `gen-building-cards-top5.cjs --check` (exit 1), więc cofnięto. Poprawny ruch to osobny temat korekt generatora.

UWAGI-DLA-ORKIESTRATORA:
- Testy mutacyjne na kopii wymagały katalogów dyspozycje/ i docs/ w kopii, bo testy czytają ścieżki względem repo. To ograniczenie harnessu, nie błąd.
- Nie uruchamiano narzędzi tworzących sesje, zadania ani harmonogramy.

NASTĘPNY KROK: decyzja właściciela (pkt 1). Potem runda 2: Spichlerz + generator; te same bramki.
DEPLOY/PUSH: NIE WYKONANO
