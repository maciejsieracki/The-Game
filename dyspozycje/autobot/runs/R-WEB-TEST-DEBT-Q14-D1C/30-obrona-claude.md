STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D1C
GOAL: obrona kandydata 79d6972c2 (baza a0939760d) — odpowiedź na 2 zarzuty Evaluatora (b49b639): zarzut 1 (pkt 6 tmpdir), zarzut 2 (pkt 3 pasture: FALA 883/890 i rozstrzygnięcie przyczyny).
ZMIANY-COMMIT: tylko ten raport (brak zmian w gra/tools, gra/src, gra/data). Kod testów bez zmian względem 79d6972c2.
TESTY: pkt 3 — dowody z surowego wyjścia `PI_SRC_DIR=<snapshot> node tools/autoimprove-pasture-irrigation-q2-bisect.cjs` (GRA=`/home/user/The-Game/.claude/worktrees/wf_1d989377-d7c-3/gra`, snapshoty `git archive` w katalogu poza repo):
  - bdae76b7e (ostatni dobry): {"starved":0,"firstPast":2,"firstIrr":3,"pool":300}
  - 141a2bc56 (FALA 878 merge): {"starved":3,"firstPast":3,"firstIrr":27,"pool":340}
  - 6eac2e652^1 (pre-FALA 890, = a6fb5061a): {"starved":3,"firstPast":3,"firstIrr":27,"pool":340}
  - 6eac2e652 (FALA 890 merge): {"starved":3,"firstPast":3,"firstIrr":27,"pool":340}
  - 79d6972c2 (kandydat): {"starved":3,"firstPast":3,"firstIrr":27,"pool":340}
  - 79d6972c2 + gra/data/improvement-cost-params.json `kosztUlepszenWgEpokiWlasciciela=false` (kopia poza repo): {"starved":0,"firstPast":2,"firstIrr":3,"pool":300} — identycznie jak bdae76b7e.
  - pkt 6: `node tools/bramki-tmpdir-unikalnosc-test.cjs` na 79d6972c2 — PASS=2 FAIL=1, 171 trafień, skan 418 plików z tmpdir (1946 .cjs).
  - npm ci w gra/ wykonane tylko na potrzeby bisectu; gra/node_modules usuwane po raporcie.
BLOKADY: brak blokad technicznych. Zarzut 1 odrzucony z dowodem (patrz niżej), nie z powodu blokady.
RUNDY: Obrona 1/5 (runda 2 całego tematu).

## Odpowiedź na zarzut 1 (pkt 6, bramki-tmpdir) — ODRZUCAM naprawę w tej rundzie; PRZYJMUJĘ korektę liczb

Korekta (PRZYJMUJĘ): liczba 261 z raportu Evaluatora to wynik zwykłego grepa `os.tmpdir(), '` (284 pliki z literalną nazwą), a nie liczba trafień bramki. Bramka `bramki-tmpdir-unikalnosc-test.cjs` liczy 171 trafień w 98 plikach: R1 = 38 (literalna nazwa w path.join), R3 = 117 (nazwa ze zmiennej/szablonu bez znacznika unikalności w wyrażeniu), R5 = 16 (dosłowna ścieżka /tmp/...). Operator r1 podał 261 plików / 281 wystąpień — to był zawyżony, niezmierzony zakres; poprawna wartość to 98 plików / 171 trafień (surowe wyjście bramki).

Odrzucenie (DOWÓD): dispatch dopuszcza naprawę tylko, gdy „nie zmienia zachowania testów”. Naiwna zamiana `'nazwa'` na `` `nazwa-${process.pid}` `` tego warunku nie spełnia, bo część literalnych nazw jest WSPÓLNA dla par producent–konsument:
  - `ai-economy-dist` jako domyślna ścieżka w 4 plikach: tools/ai-ai-treaty-live-proof-wiring-run.cjs:63, tools/ai-economy-measure-hook-test.cjs:46, tools/ai-economy-measure-run.cjs:69, tools/endturn-t57-repro.cjs (odwołanie). Zmiana na per-pid rozłączy uruchomienia, które dzielą katalog wyjściowy.
  - `ai-economy-profile` w 3 plikach (ai-ai-treaty-live-proof-wiring-run.cjs:64, ai-economy-measure-run.cjs:70, ai-economy-measure-hook-test); `diag.png` w 4 plikach perf-*-live-test.cjs:674/676/739 (zapis zrzutu, nazwa nadpisywalna przez PERF_SHOT).
  - R3 (117 trafień) wymaga analizy źródła identyfikatora w każdym miejscu (`${id}`, `${RUN_ID}`, argumenty), nie mechanicznej zamiany.
  - Weryfikacja zmiany wymagałaby uruchomienia testów live (Chromium/build) dla każdego pliku; w tej rundzie nie wykonano ani jednej paczki, więc „brak zmiany zachowania” nie ma dowodu.
Stan pkt 6: NIE-ZMIERZONO (zakres: 98 plików / 171 trafień: R1 38, R3 117, R5 16), zgodnie z klauzulą dispatchu „inaczej NIE-ZMIERZONO z liczbą plików”. Propozycja: osobny temat higieny z dispatchem per-para plików (najpierw grupy współdzielone: ai-economy-*, diag.png), nie w tej rundzie.

## Odpowiedź na zarzut 2 (pkt 3, pasture) — PRZYJMUJĘ; wykonano brakujące badanie i rozstrzygnięto przyczynę

FALA 890 (PRZYJMUJĘ brak badania, uzupełnione): kandydat 6eac2e652 (merge FALI 890, feature aa96cfc61 wewnątrz zakresu) i jego pierwszy rodzic 6eac2e652^1 dają identyczny wynik: starved 3, pool 340, firstIrr 27. Czyli FALA 890 NIE zmienia wyniku testu (e) — jest neutralna dla tego kryterium.

FALA 883 (z dispatchu): wykluczona w raporcie r1 (28f19d134 = starved 3 jak 28f19d134^); potwierdzona też wynikiem powyżej (pre/post 890 nie różnią się).

Przyczyna (ROZSTRZYGNIĘTA dowodem): wyłączenie flagi `kosztUlepszenWgEpokiWlasciciela` (gra/data/improvement-cost-params.json) na kandydacie przywraca wynik bdae76b7e (starved 0, pool 300). Zatem przyczyną jest wyłącznie FALA 878 (koszt budowy wg epoki WŁAŚCICIELA), a nie FALA 890 ani 883.

Cytat reguły (dla rozstrzygnięcia czy to regres czy skutek zatwierdzonej reguły): dyspozycje/WERSJE.md, wpis „ROBOCZA e1cfe6b0 — 2026-11-18 — FALA 878”, linia 105: „R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1 (decyzja wlasciciela 2026-11-19 B): koszt budowy ulepszenia liczony wg epoki WLASCICIELA … z jednej funkcji (gracz, AI, auto-ulepszenia, karta) …”. Decyzja nie zawiera wyjątku dla ulepszeń żywnościowych. Parametr gra/data/improvement-cost-params.json _opis: koszt BUDOWY (Praca) wg epoki właściciela; utrzymanie nieobjęte.

ZAŁOŻENIE (luka, rozstrzygnięte założeniem zgodnie z dispatchem): decyzja B obejmuje także farmy/trzodę/irygację, bo jej tekst nie zawiera wyjątku. Wtedy starved 3 jest SKUTKIEM zatwierdzonej reguły kosztu, a nie błędem implementacji (kod realizuje decyzję B dla wszystkich ulepszeń), a asercja testu (e) z 0 głodzonych tur pochodzi sprzed FALI 878 i jest w konflikcie z tą decyzją.

Klasyfikacja pkt 3 (zmiana): konflikt zatwierdzonej reguły z kryterium Q2 — NIE BŁĄD-GRY w sensie regresu kodu; test (e) ZOSTAJE CZERWONY (asercji nie osłabiano, nie zmieniano kryterium bez decyzji). Decyzja wymagana od właściciela (orkiestrator): (a) wyjątek dla ulepszeń żywnościowych (koszt wg epoki tylko dla surowców), (b) akceptacja spowolnienia farm w Brązie/Żelazie i korekta kryterium Q2, (c) inna. Kandydat roboczy: R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-OWNER-ERA-COST-Q1.

## Pozostałe pkt (bez zmian względem r1, nie były zarzutami)
- pkt 1, 2, 4, 7: zielone naprawy STARY-PIN z raportu r1, bez zmian w tej rundzie.
- pkt 5 (cluster-plan-name, 2/4): NIE-ZMIERZONO po POLAR A1 — bez zmian.

## UWAGI-DLA-ORKIESTRATORA
1. Pkt 3: decyzja właściciela (wyjątek dla żywności vs akceptacja) — patrz wyżej; nie rozstrzygam sam.
2. Pkt 6: zakres poprawiony do 98 plików / 171 trafień; osobny temat higieny w paczkach per para plików.
3. Proces: `git archive` snapshoty i kopie flagOFF żyją w katalogu poza repo (/home/user/scratch-pi); usunięte po raporcie.

NASTĘPNY KROK: Evaluator r2 (weryfikacja odpowiedzi na zarzut 2 dowodem flagOFF i zarzut 1 odrzuceniem z dowodem); decyzja właściciela o pkt 3.
DEPLOY/PUSH: NIE WYKONANO
