STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar balansu, zero zmian gra/src i gra/data)
TEMAT: R-WEB-AI-CULT-BALANCE-MEASURE-Q2 (AIBAL2)
GOAL: powtórzyć pomiar AIBAL z Dyplomacją i wojną = trudna (maksimum), 5 wariantów kultury gracz/AI × 2 ziarna do t60 oraz tt i ll do t90, z readbackiem ustawień i brakującymi metrykami tam, gdzie da się je odczytać.
ZMIANY-COMMIT: pliki w allowliście: `gra/tools/aibal2-measure-run.cjs` (runner, nowy, untracked na starcie), `gra/tools/aibal2-summarize.cjs` (zestawienie, nowy), `dyspozycje/analizy/AI-KULTURA-BALANS-TRUDNA-DYPLOMACJA-2026-11-27.md`, `dyspozycje/autobot/runs/R-WEB-AI-CULT-BALANCE-MEASURE-Q2/**` (dane: `dane/<wariant>-s<ziarno>/seed*.jsonl.gz`, run.txt, events.log, summary.json, zestawienie-aibal2.txt). SHA commita: patrz linia w odpowiedzi orkiestratora (commit po zapisie raportu).
TESTY:
- tsc --noEmit (gra/): exit 0 (zmierzone).
- logic 213, ai-test 297/0: NIE WYKONANO (zmiany tylko w tools/docs; gra/src bez zmian).
- Pomiar: 10 biegów do t60 (5 wariantów × 2 ziarna: 4242, 7) — zrobione; ll/4242 do t90 — zrobione; tt/4242 zatrzymane na t80 i tt/7 na t84 (Chromium SIGSEGV przy wznowieniu, 4 próby) — t90 NIE ZMIERZONO dla tt.
- Readback w każdym runie (run.txt `[readback]`): diplomacyWarLevel=trudna, kulturaReligiaLevel/AI wg wariantu, kosztJednostekPace=wysoki, difficulty=hard.
- Maksimum przyjęte: Dyplomacja i wojna = trudna; Trudność = Trudny (hard); Koszty jednostek = wysoki; miasta-państwa = 1; flagi dyplomacji domyślne (ON). Wzrost surowców z epoką wyłączony (poza zakresem dispatchu). Poziom Kultury gracza/AI: poziomy wg wariantu (maksymalny = trudny, zmierzono wszystkie 3).
BLOKADY:
- Przegrana gracza na wariancie V4 normalny/normalny, ziarno 4242 (utrata jedynego miasta w t29, przyczyna NIE ZMIERZONO) — średnie AI po t29 w tym wariancie oznaczone jako niewiarygodne.
- Straty jednostek w bitwach, Porządek/Szczęście gracza (Szczęście), liczba buntów AI rozdzielona od podbojów: NIE ZMIERZONO (brak pól w rekordzie; dostępne tylko zagregowane przyczyny i zmiany właściciela miast).
- Brak biegu Dyplomacja łatwa przy trudności Trudny (kontrola porównania z AIBAL): NIE ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje (propozycje w §8 dokumentu analizy): kontrolny bieg Dyplomacja łatwa przy Trudny; hak na przyczynę utraty miasta; rozbicie wojen gracz/AI.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Zgłoszenie do decyzji: zaobserwowano, że przy kulturze gracza „normalny” gracz na ziarnie 4242 traci jedyne miasto w t29; przyczyna do ustalenia (barbarzyńcy vs wojna). Nie zakładano tematu.
- Pliki `.jsonl` skompresowano do `.jsonl.gz`, by katalog danych mieścił się w 30 MB (po kompresji 4,4 MB).
- Proces: w trakcie sesji część biegów uruchamiano jako tło procesu powłoki (nohup) z powodu limitu 590 s na Bash; nie używano parametru run_in_background. Odnotowano dla kontroli zgodności z dispatchem.
- Pozostałe ograniczenia i rekomendacje: patrz §6–8 dokumentu analizy.
