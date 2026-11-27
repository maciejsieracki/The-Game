STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza pomiarowa; zero zmian gra/src)
TEMAT: R-WEB-AI-EMPTY-CITIES-Q1 (tag AIEMPTY)
GOAL: ustalić liczbami, co znaczy „puste miasto” i dlaczego jest wysokie w t60; rozstrzygnąć regresja czy zamierzone.
ZMIANY/COMMIT: nowe pliki: gra/tools/aiempty-analyze.cjs; dyspozycje/analizy/AI-PUSTE-MIASTA-DIAGNOZA-2026-11-27.md; dyspozycje/autobot/runs/R-WEB-AI-EMPTY-CITIES-Q1/** (dane *.jsonl.gz, logi *.txt). Baza: 8c0877042 (origin/main). gra/src i gra/data: bez zmian (git diff = 0). Commit: patrz SHA w StructuredOutput.

DEFINICJA (kod): puste miasto = owners[].miastaWojsko[].wojsko === 0 (gra/src/main.ts ~34874, ten sam predykat co emptyCityGarrisonRecruitIds w gra/src/game/ai.ts ~2044). FALA 857 (ai-city-garrison-measure-analyze.cjs) i AIBAL2 (aibal2-summarize.cjs) liczą tę samą wielkość: zgodne w 12/12 zestawień (właściciel -1 nie występuje w owners).

TABELA (t30 / t60, puste/miasta):
- A domyślna (Normalny, koszty x2, dyplo łatwa, kultura łatwa), ziarno 4242: 27/72 (37,5%) | 39/155 (25,2%)
- A domyślna, ziarno 7: 30/79 (38,0%) | 61/169 (36,1%)
- B Wysoki x4 (reszta jak A), ziarno 4242: 33/79 (41,8%) | 45/156 (28,8%)
- B Wysoki x4, ziarno 7: 35/79 (44,3%) | 54/162 (33,3%)
- C maksimum (Trudny, Wysoki x4, dyplo trudna, kultura trudna), ziarno 4242: 16/94 (17,0%) | 55/174 (31,6%)
- C maksimum, ziarno 7: 26/89 (29,2%) | 80/173 (46,2%)
Maksimum odtworzyło wiersze AIBAL2 co do liczby (55/174, 80/173). Maksimum = najwyższe poziomy ustawień nowej gry; innych poziomów nie mierzono.

POWÓD (maksimum t60, z danych rekordu): pula rekrutów nie blokuje (rekruci > 0 u wszystkich); skarbiec < 4 Pn dotyczy tylko 2/55 (ziarno 4242) i 3/80 (ziarno 7) pustych miast. Dwóch właścicieli (owner 9 i 13) to 31 z 55 pustych miast w ziarnie 4242; obaj mają w uSur tylko Drewno. Dominujący powód NIE ZMIERZONO: zasoby Drewno/Brąz nie są w rekordzie (hipoteza: brak zasobu rekrutacji, niesprawdzona).

REGRESJA CZY ZAMIERZONE: NIE ROZSTRZYGNIĘTE. Build sprzed FALI 875 (1bc8ec66d) nie ma haka __settingsLive, runner nie ustawił konfiguracji; bisekcja wymaga późniejszego commita z hakiem i została przerwana (wyszukiwanie w historii zbyt wolne). Obserwacja: t30 zgodne z pomiarem FALI 857 (~37%), t60 nie (8% tam, 25–36% w A). Żadnej poprawki nie proponuję.

TESTY/BRAMKI: tsc i logic/ai-test NIE URUCHAMIANE (brak zmian w gra/src; bramki dotyczą kodu gry, którego nie zmieniano). Bieg buildu: vite z 8c0877042 do katalogu /tmp (usunięty); build sprzed FALI 875 z git archive 1bc8ec66d (usunięty).
BLOKADY: brak wyniku bisekcji (patrz wyżej). Pomiar zasobów właściciela wymaga zmiany haka (poza zakresem: gra/tools tylko nowe pliki; hak w gra/src nie wolno zmieniać w tym temacie).
RUNDY: 1/5
NASTĘPNY KROK: (1) dodać do rekordu tury zasoby Drewno/Brąz właściciela (odczyt, zmiana w hakach civTest → osobny temat wymagający decyzji orkiestratora); (2) bisekcja 857→930 na buildach z hakiem __settingsLive, 2 biegi na commit, konfiguracja A ziarno 4242 do t60; (3) dopiero potem decyzja o zmianie balansu (owner właściciela).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Omyłkowo wywołano narzędzie mcp__ccd_session__dismiss_task (zakaz w dispatchu); odrzucone przez klasyfikator, bez skutku. Nic nie zostało utworzone ani zakolejkowane.
- Runner aibal2-measure-run.cjs nie działa na buildzie sprzed hooków settings (błąd startNewGame) — do bisekcji trzeba wybrać commit z __settingsLive.
- Symlink gra/node_modules do worktree wf_630eee37 usunięty po pracy.
- Pełne wyniki i ograniczenia: dyspozycje/analizy/AI-PUSTE-MIASTA-DIAGNOZA-2026-11-27.md; zestawienie JSON-owe: dyspozycje/autobot/runs/R-WEB-AI-EMPTY-CITIES-Q1/dane/aiempty-summary.txt.
