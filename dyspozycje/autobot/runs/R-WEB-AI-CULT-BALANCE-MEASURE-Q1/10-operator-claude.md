STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AI-CULT-BALANCE-MEASURE-Q1 (tag AIBAL)
GOAL: tabela skutków poziomów „Kultura i religia” gracza i AI po FALI 930 (baza c0a55450945535a0680b569b0cf5c650314c86f9), przy poziomie maksymalnym reszty ustawień (Trudny, Koszty jednostek Wysoki ×4, pace wysoki, miasta-państwa 1); wnioski opisowe z liczbami.
ZMIANY/COMMIT: pliki w commicie tego tematu: `dyspozycje/analizy/AI-KULTURA-BALANS-PO-FALI-930-2026-11-27.md` (nowy dokument z tabelą i wnioskami), `dyspozycje/autobot/runs/R-WEB-AI-CULT-BALANCE-MEASURE-Q1/**` (ten raport i `dane/`: jsonl, state, summary, `run.txt`, `zestawienie-flow.txt`, `zestawienie-wojny-miasta.txt`), `gra/tools/ai-cult-rel-measure-run.cjs` (jedna linia: log `[readback]` ustawień po starcie; narzędzie pomiaru, nie gra). Commit SHA: patrz pole sha w odpowiedzi orkiestratora (czubek brancha po commicie). gra/src i gra/data bez zmian.
TESTY:
- tsc --noEmit (worktree, gra/): exit 0 (surowe wyjście puste).
- Pomiar: 6 wariantów/ziaren, zob. tabelę w dokumencie. Readback każdego biegu w `run.txt`: kulturaReligiaLevel i kulturaReligiaLevelAI zgodne z wariantem, kosztJednostekPace=wysoki, difficulty=hard.
- Kontrola powtarzalności: tt t60 vs wcześniejszy PO (AI-PLUS10): jednostki 216/262 vs 214/259, Porządek 55,5/52,3 vs 55,4/52,4 (zgodne).
- logic 213 i ai-test 297/0: NIE ZMIERZONO (gra/src bez zmian; nie uruchomione w tej rundzie).
BLOKADY:
- Poziom „Dyplomacja i wojna” = latwa (domyślny) w każdym biegu; runner nie ustawia go, a ustawienie wymaga zmiany startGame w gra/src (zakaz). Najwyższy poziom to `trudna`: NIE ZMIERZONO.
- Wariant „latwy/trudny” (gracz łatwy, AI trudny) i „normalny/normalny”: NIE ZMIERZONO (brak czasu).
- Seed 7 wariantów tl i ll oraz wszystkie warianty ll/tl na ziarnie 4242 powyżej t60: NIE ZMIERZONO. tt/4242 zrobiony do t90, tt/7 do t60.
- Straty jednostek, zakończone bunty AI, Porządek i Szczęście gracza: runner ich nie zapisuje w jsonl; NIE ZMIERZONO.
- Chromium: biegi kończyły się SIGSEGV przy wznowieniu w openGame (kilka razy); ponowiono ze slotu, każdy segment dokończono (łącznie około 6 ponowień; ślad w `run.txt`).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o DECISION_REQUIRED (sekcja w dokumencie). Jeśli potrzebne są warianty normalny/normalny i latwy/trudny oraz seed 7 do t90, osobny temat pomiarowy na dłuższym czasie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wnioski skrócone: poziom kultury AI słabo zmienia AI (przy graczu trudnym: AI trudny ma 4–6% mniej jednostek i ok. 2 pkt mniej Porządku niż AI łatwy; miasta poniżej 14% równe). Względem bazy PRZED (AI-PLUS10, t60): AI jest po FALI 930 silniejsze w sensie Porządku (19% → 52–55%) i ma +50–95% jednostek. Po t60 pojawiają się bunty (tt/4242 t90: 5 miast poniżej 14%, 3 w buncie).
- Dispatch wskazywał bazę „przed FALĄ 926” z dokumentów; użyto tabeli PRZED z AI-PLUS10 (bundle 3608af1ce), która nie jest dokładnie przed 926. Nie zweryfikowano, czy różnica ma znaczenie.
- Runner `ai-cult-rel-measure-run.cjs` nie ustawia poziomu „Dyplomacja i wojna”; to luka pomiarowa wobec zasady „maksimum”, do rozważenia w osobnym temacie (wymaga zmiany hooka, czyli dostępu spoza zakazu tego tematu).
- Dane surowe są w repo (~24 MB), nie w /tmp. Build dist i profile w /tmp/aibal-* usunięte po zakończeniu.
