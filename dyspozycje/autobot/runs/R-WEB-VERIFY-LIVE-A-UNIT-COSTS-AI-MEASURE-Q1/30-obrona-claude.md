STATUS: PASS-WITH-NOTES
DOMAIN: GAME (POMIAR; obrona: test pinujący hak + przeliczenie z JSONL, bez zmian w grze i balansie)
TEMAT: R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1
GOAL: zmierzyć, czy „Koszty jednostek” Normalny ×2 powoduje rozpad armii AI lub trwały deficyt/głód, względem Niski ×1.
BAZA: 813eb85df (kandydat r1); gra/src/main.ts NIE zmieniony w tej rundzie.
ZMIANY-COMMIT: gra/tools/ai-economy-measure-hook-test.cjs (asercje haka tempa i zywnoscArmiiTura, mutacja dowodowa); dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/analyze-pace.cjs (nowy: przeliczenie z JSONL); dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md (korekta §4, nowa §7); dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/30-obrona-claude.md. Commit: patrz pole sha.

TESTY:
- tsc --noEmit: EXIT 0 (bez błędów).
- ai-economy-measure-hook-test (pełny, bundle vite poza repo, Chrome /usr/bin/google-chrome): 25/25 zielone, w tym 2 nowe asercje (hak tempa: niski=168, wysoki=672 zywnoscArmiiTura, sumy po właścicielach).
- Mutacja dowodowa (setUnitCostPace ignoruje argument, bundle w scratchpadzie, main.ts przywrócony `git checkout`): 23/25, CZERWONE obie nowe asercje (niski=168 wysoki=168).
- Pozostałe bramki (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6) NIE URUCHOMIONO w tej rundzie (obrona dotyczy testu i analizy; brak zmian w kodzie gry).
- analyze-pace.cjs: liczby z surowego wyjścia node, patrz analizy §7.

ODPOWIEDZI NA ZARZUTY:
1. (per epoka nieodtwarzalne) PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONE. analyze-pace.cjs liczy jednostki per epoka z owner.hud.epoka z committowanego JSONL: t90 Niski Brąz 162 / Żelazo 303; Normalny Brąz 191 / Żelazo 126. Utrzymanie per owner per epoka NIE rozbite (są sumy AI). Liczba właścicieli per epoka w Żelazie nie przeliczona ponownie (zostaje wartość z r1: 7 i 5, NIE ZWERYFIKOWANO w tej rundzie).
2. (brak licznika rozwiązanych jednostek) PRZYJMUJĘ, NIE NAPRAWIONE. Dane z JSONL nie rozróżniają dezercji od walki; wpisanie licznika wymaga zmiany hooka w grze i nowego biegu. Proxy (spadki liczby jednostek właściciela między turami): Niski 14 zdarzeń / 20 jednostek, Normalny 18 / 20. NIE ZMIERZONO jako dezercja.
3. (próg, mechanizm, mnożnik; porównanie niewspółmierne) PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONE. Dodano przeliczenie na WSPÓLNYCH właścicielach: t60 −23,6% (15 wsp.), t90 −32,3% (14 wsp.). t30 wspólnych ma kierunek ODWROTNY (Niski 23 vs Normalny 40), więc szum jednego ziarna jest tego samego rzędu co efekt. Mechanizm (plik:linia) NIE ZMIERZONO; mnożnika NIE wskazuję. Ścieżki do dalszego badania: rekrutacja `applyUnitCostPace` (gra/src/game/production.ts:679) i utrzymanie `mnoznikUtrzymaniaJednostek` (gra/src/game/unit-cost-tempo.ts:48, używane w gra/src/game/economy-upkeep.ts:1199).
   KOREKTA NOWEGO BŁĘDU W r1 (wykryte przy przeliczeniu, nie było w zarzutach): zdanie „0 AI w głodzie wojska w każdej turze” było FAŁSZYWE. Flaga glodWojska w Normalnym występuje u 1–4 z 41 AI w turach 2–23 (58 par właściciel-tura; szczyt 4 w t8–t15; po t23 zero). Niski: 0 w całym przebiegu. Poprawiono analizy §4. Próg „>50% AI w deficycie/głodzie” nadal NIE przekroczony (max ≈10%). Głód wczesny może być częścią różnicy w t20–35.
4. (brak testu pinującego) PRZYJMUJĘ, NAPRAWIONE. Hook-test: asercje setUnitCostPace/unitCostPaceState (niski/wysoki, odrzucenie wartości spoza zbioru, przywrócenie normalny) i zywnoscArmiiTura (wysoki > niski); pole dodane do OWNER_KEYS. Mutacja dowodowa czerwona.
5. (pierwszy odcinek bez flag Chromium; seed 7) PRZYJMUJĘ jako ograniczenie, NIE NAPRAWIONE. Wpływu flag NIE ZMIERZONO; seed 7 NIE wykonany (wymaga ~2 pełnych biegów, poza tą rundą).

NASTĘPNY KROK: (a) dopisać w runnerze licznik rekrutacji i rozwiązań jednostek (wymaga hooka w grze, osobny temat); (b) powtórzyć pomiar na seed 7 (oba tempa) z liczeniem tylko wspólnych właścicieli; (c) rozbić utrzymanie per epoka w analyze-pace.cjs. Decyzja o mnożniku — po (a)/(b), NIE w tej rundzie.
RUNDY: 2/5 (obrona r1 -> ta runda). Ostatni werdykt: brak (dispatch r1 nie dostał FC).
BLOKADY: brak blokad technicznych. Pełne przebiegi NIE wykonane w obronie (dane z r1 nie zmieniane).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Worktree: do uruchomienia testu zainstalowano `gra/node_modules` (npm ci --ignore-scripts, ignorowane przez .gitignore; nie commitowane). Bundle vite do scratchpadu sesji.
- Surowe wyniki hook-testu: scratchpad sesji, pliki hooktest-full.log i hooktest-mut.log.
- Kod gry nie zmieniony (gra/src/main.ts: git diff puste po przywróceniu).
