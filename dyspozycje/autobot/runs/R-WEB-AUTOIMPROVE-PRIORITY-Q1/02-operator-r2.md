STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-PRIORITY-Q1
GOAL: Odpowiedź Operatora rundy 2 na zarzuty Obrony (FAIL rundy 1): deadlock tartak/obóz na rzece, pokrycie testem wariantu właściciela, kolejność E1–E4, Objaw B.
ZMIANY-COMMIT: baza = 1ea09a182 (poprzednia runda Operatora, branch wf-r2-operator). SHA rundy 2: patrz `git log` (commit „fix(auto-improvements): runda 2 …"). Zmienione: `gra/src/game/auto-improvements.ts`, `gra/tools/wyrab-rzeka-r2-test.cjs` (nowy), `gra/tools/wyrab-r2-kolejnosc-measure.cjs` (nowy, pomiar), pliki runu tej rundy.

ODPOWIEDZI NA ZARZUTY
Z1 (deadlock: bramka tartak/obóz nie sprawdza `lesneMinSpelnione`) — PRZYJMUJĘ. Potwierdzone: w 1ea09a182 i w bazie 914daa502 tartak+obóz wchodzą na 13,12 i wycinki = 0 (test r2, mutacja: `gate-r2-mutacja-commit-1ea09a182.txt`, `gate-r2-mutacja-base-914daa502.txt`). Naprawa: jedna funkcja `riverKrok0Ok(q,r)` (auto-improvements.ts, przed FAZĄ 1) zawiera dokładne warunki wyrębu na heksie rzeki (wyrab włączony, tech+civGate, hexAllowsKey, qualifies, brak tartaku/obozu, las). Jest użyta RAZEM w KROKU 0 i w bramce tartak/obóz, więc bramka nie może zablokować tartaku, gdy wycinka i tak nie zajdzie. Budżet pominięty celowo (przejściowy). `lesneMinSpelnione` i próg lasu nie dotyczą już heksów rzeki (E2 wiążące: wyciąć najpierw). Wynik: test r2 scen. 1–2 PASS (wycinka w turze 1, na rzece nie stoi nic przed wycinką).
Z2 (test jednoscenariuszowy, worked zawiera las 11,13) — PRZYJMUJĘ. Nowy test `wyrab-rzeka-r2-test.cjs`: scen. 1 = obywatel na rzece, ZERO innego lasu, worked bez lasu poza rzeką; scen. 2 = wariant właściciela (rzeka + 1 inny las, 2 < progu 3); scen. 3 = regresja rundy 3 (5 lasów); scen. 4–5 = Objaw B i E3. Wynik final: 10 PASS / 0 FAIL.
Z3 (główny przypadek właściciela — mało lasu w promieniu — niezałatwiony) — PRZYJMUJĘ. Ten sam mechanizm co Z1: próg `WYRAB_MIN_FOREST_IN_RADIUS` nie dotyczy heksu rzeki w `riverKrok0Ok`. Scen. 1 i 2 (2 lasy w promieniu = poniżej progu) dają wycinkę. Przyczyna zmierzona: bramka progu + `lesneMinSpelnione` (auto-improvements.ts, dawne ~1015 i ~875) blokowały wycinkę rzeki bez tartaku. ZAŁOŻENIE: wyrąb poza rzeką zachowuje lesneMin i próg (bez zmian).
Z4 (FAZA 1 nie przebudowana do E1–E4) — CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM w tej rundzie:
  - PRZYJMUJĘ część E3 (zmierzone): w 1ea09a182 jedna tura stawiała bydło na 4 heksach BEZ rzeki (12,12; 11,12; 11,13; 12,11; 12,13 → farma+bydło). Poprawka: bydło/owce/lama tylko na `riverHexKeys` (FAZA 1, po `hexAllowsKey`). Pomiar po poprawce: `measure-r2-kolejnosc.txt` — bydło tylko na 13,12. Zgodność z zamkniętymi testami: auto-improvements 45/0, ai-improvements 53/0 (bez zmian).
  - ODRZUCAM przebudowę do etapów „po typach" (E1→E4 globalnie) w tej rundzie: to zmiana kolejności całej FAZY 1, nie łatka. Nie zmierzono konfliktu z zamkniętymi testami R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, bo przebudowy nie wykonano. Zgłaszam DECISION_REQUIRED (propozycja niżej).
  - NIE_ZMIERZONO: E4 (irygacja przed farmą na innym heksie) — scenariusz pomiarowy nie wygenerował irygacji.
Z5 (Objaw B nie odtworzony na realnej ścieżce) — CZĘŚCIOWO. Ścieżka: `pickAutoImprovements` (ta sama funkcja dla gracza i AI). Pomiar (test r2 scen. 4): z „Oswojenie zwierząt" bydło stoi na rzece po farmie (PASS); bez tej technologii bydło NIE powstaje (PASS). Przyczyna w pickerze: tech `bydlo` = „Oswojenie zwierząt" (data/terrain-improvements.json, klucz `bydlo.tech`). Uwaga: tekst `surowiecOdblokowany_uwaga` („dostęp dopiero po złożu trzody") jest ROZBIEŻNY z kodem (`livestock-unlock.ts`, nagłówek: „Bydło/owce/lama: czyste ulepszenie bez złoża") — dane mogą być nieaktualne. Realny stan gracza (save, czy Oswojenie odblokowane): NIE_ZMIERZONO. Wywołania `main.ts:32186` i `ai.ts:~2594` (opcje, override miasta) NIE_ZMIERZONO w tej rundzie.
Z6 (mutacja) — PRZYJMUJĘ, potwierdzone: cofnięcie do 1ea09a182 → 4 PASS / 6 FAIL; cofnięcie do 914daa502 → 2 PASS / 7 FAIL (`gate-r2-mutacja-*.txt`).
Z7 (odtworzenie bramek) — PRZYJMUJĘ: wszystkie zgodne z zarzutem (rerun na finalnym kodzie poniżej).

BRAMKI NA FINALNYM KODZIE (ten commit):
- tsc --noEmit: EXIT=0 (`gate-r2-tsc.txt`)
- wyrab-rzeka-krok0-test: 3 PASS / 0 FAIL
- auto-improvements-test: 45 passed, 0 failed (baza 45/0)
- ai-improvements-test: 53 passed, 0 failed (baza 53/0)
- wyrab-wycinka-nazwa-live-test: 49 PASS / 0 FAIL
- wyrab-rzeka-r2-test: 10 PASS / 0 FAIL

DECISION_REQUIRED (nie zmieniano):
1. Wyrąb poza rzeką przy małym lesie: propozycja — zachować obecne progi (lesneMin + próg 3) dla terenów poza rzeką (stan obecny), do decyzji właściciela.
2. E1 vs Zasada 2: pusty heks rzeki bez obywatela nie dostaje farmy przy onlyWorked=true. Propozycja: farma E1 także na rzece bez obywatela.
3. Po E1–E2: czy wycinać lasy i stawiać farmy poza rzeką (`wolnoKarczowacPozaRzeka`), gdy rzeki zagospodarowane. Obecnie tak, na heksach z obywatelem.
4. Kolejność „po typach" (E1→E4 globalnie) zamiast „heks po heksie". Propozycja: osobny temat z przebudową FAZY 1 i testem czerwonym przed zmianą.

BLOKADY: brak. Objaw B realnego stanu gracza: NIE_ZMIERZONO.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) weryfikuje test r2 i mutacje; Final Control po Evaluatorze. Decyzje 1–4 do właściciela.
DEPLOY/PUSH: NIE WYKONANO
