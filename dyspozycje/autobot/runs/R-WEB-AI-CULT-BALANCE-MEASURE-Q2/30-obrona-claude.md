STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar balansu; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AI-CULT-BALANCE-MEASURE-Q2 (AIBAL2) — obrona rundy 1 (Operator HAIKU 5.5)
GOAL: odpowiedzieć na 10 zarzutów Evaluatora (38baa156e) poprawkami w dokumencie, narzędziu zestawienia i danych; brakujące bramki wykonać i zapisać.
ZMIANY-COMMIT: SHA = czubek commitu obrony (patrz pole sha w odpowiedzi). Pliki: `gra/tools/aibal2-summarize.cjs` (czyta `.jsonl.gz`; raport wojen z graczem/AI-AI; sumy od startu do tury; liczba żywych cywilizacji AI), `dyspozycje/autobot/runs/R-WEB-AI-CULT-BALANCE-MEASURE-Q2/dane/zestawienie-aibal2.txt` (regenerowane), `dyspozycje/analizy/AI-KULTURA-BALANS-TRUDNA-DYPLOMACJA-2026-11-27.md` (poprawki §2, §3, §4, §5, §6, §7, §9), ten raport. Dane runów (`.jsonl.gz`, run.txt) bez zmian.

ODPOWIEDZI NA ZARZUTY:
1. Wojny z graczem — PRZYJMUJĘ. Zmierzone z `wars.withPlayer`: 1 w t60 we wszystkich 9 biegach z żywym graczem; 0 w normalny/normalny 4242 (gracz przegrał). W t90 (ll/4242) 0. Dokument §3/§4 poprawiony; „NIE ZMIERZONO” usunięte dla tej metryki.
2. Przegrana gracza V4/4242 — PRZYJMUJĘ w części faktów. Dane: t28 owner 0 (Porządek 49%), t29 owner −1 (`czlowiek` 0), t30 „Bunt skrajny” pod −1. Wpis cityTransfers z t29 (z 21 na 25) dotyczy innych właścicieli. Zarzut o „braku wpisu” był nieprecyzyjny i został poprawiony. Mechanizm (barbarzyńca / bunt) pozostaje NIE ZMIERZONO: katalog runu nie zawiera events.log (poprzedni dokument błędnie na niego wskazywał — poprawione).
3. Cywilizacje AI bez miast — PRZYJMUJĘ. Metryka widzi tylko żywych właścicieli (`aiCivsNoCityAlive`). Dopisano `aiCivsAlive` (t60: 14 przy ziarnie 4242 w 4 wariantach; 13 przy ziarnie 7 i w normalny/normalny 4242) oraz start: 15 AI w t2 na każdym ziarnie. Wynik „0 bez miast” jest prawdziwy tylko dla żywych.
4. Zakres pustych miast AI — PRZYJMUJĘ. Wyliczone: 55/174=32%, 80/173=46%, 56/174=32%, 61/175=35%, 61/168=36%, 60/168=36%, 63/175=36%, 82/176=47%, 70/168=42%, 80/173=46%. Zakres 32–47% (dokument: 32–47%, nie 17–36%).
5. Błędy liczbowe — PRZYJMUJĘ: miasta AI poniżej progu w t60 = 1+3+0+0+1+3+1+1+0+0 = 10 (nie 8). Transfery właściciela do t60: 22–40 (nie 22–48; 48 to t84). Straty „rozwiazanie-ai” do t60: 68–113 (nie 75–113).
6. „Identyczne do jednostki” — PRZYJMUJĘ: zastąpione przez „praktycznie identyczne” z podaniem różnic (≤1 jednostka, ≤2 puste miasta).
7. Bramki logic 213 i ai-test 297/0 — PRZYJMUJĘ i WYKONAŁEM (npm ci --ignore-scripts w gra/, potem surowe wyjścia): `LOGIC OK (213/213)`; `ai-test: 297 passed, 0 failed`; `npx tsc --noEmit` exit 0.
8. Zestawienie z .gz — PRZYJMUJĘ: `aibal2-summarize.cjs` czyta `seed*.jsonl.gz` (zlib). Zestawienie zregenerowane; plik wynikowy zgodny z poprzednim w liczbach dla wszystkich pól, które poprzednio były podane, plus nowe pola (wojny z graczem, AI-AI, żywi AI, sumy od startu).
9. Tło `nohup` — PRZYJMUJĘ jako fakt i odchylenie procesowe: część biegów uruchamiano przez nohup w powłoce wbrew zakazowi run_in_background (powód: limit 590 s na pojedyncze Bash). Nie cofam tego retroaktywnie; zapisane w dokumencie §6 i tutaj. Decyzja o akceptacji należy do orkiestratora.
10. Odchylenia (tt bez t90; brak kontroli Dyplomacja łatwa przy Trudny; porównanie z AIBAL nieizolowane) — PRZYJMUJĘ jako ograniczenia, już opisane w §4 i §6 (sprawdzone: tekst istnieje). Nowych biegów w tej rundzie nie wykonywano: to wykracza poza zakres obrony i wymagałoby ponownej pracy na żywo.

TESTY:
- `node tools/logic-test.cjs` (gra/): LOGIC OK (213/213), exit 0.
- `node tools/ai-test.cjs` (gra/): ai-test: 297 passed, 0 failed, exit 0.
- `npx tsc --noEmit` (gra/): exit 0.
- `node gra/tools/aibal2-summarize.cjs ...` na 10 katalogach: exit 0; czyta .jsonl.gz; 50 linii zestawienia.
- Gra/src nieruszone (git diff: tylko 2 pliki z allowlisty + dokument + zestawienie + raport).

BLOKADY:
- Mechanizm przegranej gracza V4/4242 w t29: NIE ZMIERZONO (brak events.log, brak pola przyczyny).
- Straty jednostek w bitwach i Szczęście gracza: NIE ZMIERZONO (brak pól; bez zmian w tej rundzie).
- Bunt vs podbój w cityTransfers: NIE ZMIERZONO (brak rozbicia przyczyn).
- tt do t90: NIE ZMIERZONO (Chromium, t80/t84).
- Kontrolny bieg Dyplomacja łatwa przy Trudny: NIE ZMIERZONO (poza zakresem obrony).
- Odchylenie procesowe: nohup w tle (zob. zarzut 9).

RUNDY: 2/5 (obrona po FAIL-like zarzutach Evaluatora: runda 1 Operatora, obrona = runda 2).
NASTĘPNY KROK: orkiestrator — Evaluator/Final Control na czubku commitu obrony; decyzja o akceptacji nohup; decyzja o kontrolnym biegu Dyplomacja łatwa przy Trudny (propozycja w §8 dokumentu).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- `node_modules` w gra/ zainstalowane tylko do bramek i usunięte po nich (katalog ignorowany przez git; nic nie wypychano).
- Brak pliku `events.log` w katalogu runu V4/4242 — mogło dojść do usunięcia przy sprzątaniu; warto sprawdzić, czy runner (aibal2-measure-run.cjs) zapisuje go na stałe.
