# R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES (poprawki i nowy test gotowe; pełne bramki rundy 1 nie powtórzone w tej rundzie, patrz TESTY)
DOMAIN: GAME (tekst/dane opisowe, bez zmiany zachowania)
TEMAT: R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1
GOAL: opisy w gra/data/diplomacy.json zgodne z kodem/params; zero zmian wartości czytanych przez kod.
BAZA: 52fc1d5cf (dispatch podaje „52fc1d5ca” — taki obiekt nie istnieje; ZAŁOŻENIE: 52fc1d5cf).
KANDYDAT RUNDY 1: cb981436b (kod b55db098c). Start rundy 2: cb981436b.

## ZMIANY-COMMIT
Allowlista: gra/data/diplomacy.json, gra/tools/diplo-json-descriptions-sync-test.cjs, raport 30-obrona-claude.md. Brak zmian w gra/src/ (diplomacy.ts identyczny z cb981436b).
- diplomacy.json, akcja „3. Sojusz” (Efekt): „(lub odmowa: −15 Zaufanie)” → „(lub odmowa: −15 Wiarygodności, kara tylko dla odmawiającego)”. Dowód: params.wiarygodnoscN4OdmowaObowiazkuSojuszu = −15 (diplomacy.ts, DIPLOMACY_PARAMS, komentarz „kara WYŁĄCZNIE dla odmawiającego”).
- diplomacy.json, akcja „11. Wypowiedzenie wojny” (Efekt): „Bez c.b.: −25 Relacja u wszystkich, −20 Zaufanie, flaga agresor” → „Bez c.b.: sama deklaracja nie zmienia Zaufania ani Relacji; kara Wiarygodności N1 (−10 pkt, jednorazowo, gdy atak w tej samej turze lub w karencji), flaga agresor”. Dowód: diplomacy.ts, case 'wojna_wypowiedziana' (ok. l.933–937) ustawia tylko newStatus, bez dZ/dR; komentarz ok. l.1040; params.wiarygodnoscN1BezOstrzezenia = −10. W kodzie nie ma żadnego „−25” ani „−20 Zaufanie” dla samej deklaracji.
- diplomacy.json, tabela zdarzeń „Złamany pakt przez gracza” (Uwagi): „Informacja rozchodzi się do sąsiadów (-5 Relacja u każdego)” → „Kara na relację z poszkodowanym (zdarzenie zlamana_obietnica). W kodzie nie znaleziono rozchodzenia się informacji do sąsiadów (brak −5 Relacja u każdego)”. Dowód: diplomacy.ts case 'zlamana_obietnica' (ok. l.960–962) daje tylko dZ = zlamanaPaktGracz_zaufanie (−40); grep „sąsiad/sasiad/rozchod” w src/game/diplomacy.ts i wywołań applyDiploEventTracked w main.ts (ok. l.24043) nie znajduje mechanizmu rozchodzenia się kary.
- Test: gra/tools/diplo-json-descriptions-sync-test.cjs — dodano sekcje 5b (odmowa sojuszu = Wiarygodność N4, bez „odmowa: −15 Zaufanie”) i 5c (wypowiedzenie wojny: bez „−20 Zaufanie”, obecna kara N1 −10 pkt) oraz 2 mutacje (odmowa sojuszu Wiarygodność→Zaufanie; powrót −20 Zaufanie w wojnie). Test nie zmienia danych.

## Odpowiedzi na zarzuty Evaluatora (ef995185d)
1. (Akcja 11, Efekt, l.321) PRZYJMUJĘ. Poprawka, dowód (diplomacy.ts ok. l.933–937 i ok. l.1040, params N1), test 5c.
2. (Akcja 3, Efekt, l.249) PRZYJMUJĘ. Poprawka na Wiarygodność N4 (−15), test 5b. W rundzie 1 Operator świadomie tego nie poprawił — to był błąd zaniechania.
3. Przemarsz / l.305 / l.471:
   a. „Nieautoryzowany przemarsz −5 Zaufanie/tura” — PRZYJMUJĘ korektę mojego raportu rundy 1 (linia 50: „w kodzie nie znaleziono” było BŁĘDNE). Dowód: gra/src/game/diplomacy-border-march.ts:60 (DEFAULT_KARA = 5), :184 (`kara = params.karaPrzemarszNieautoryzowany_zaufanie_perTura`), gra/data/diplomacy.json params (`karaPrzemarszNieautoryzowany_zaufanie_perTura: 5`). Tekst w JSON jest zgodny; nie zmieniano.
   b. l.305 „Ultimatum: spełnienie −5 Relacja u adresata” — ODRZUCAM. Dowód: diplomacy.ts case 'ultimatum_spelnione' (ok. l.1045–1047): dZ = −5; komentarz w kodzie „−5 Relacja → −5 Zaufanie”; diplomacy.ts ok. l.1075: „Relacja = Zaufanie + Respekt”. Zmiana Zaufania o −5 przy dR = 0 to dokładnie −5 Relacji, więc tekst jest zgodny z kodem.
   c. l.471 „−5 Relacja u każdego” — PRZYJMUJĘ (poprawka Uwagi, patrz wyżej).
4. Komentarze diplomacy.ts:871 („tarcia_graniczne … one-shot -2”) i :892 („zerwanie_handlu … szablon §1.5: −15 Relacja”) — ODRZUCAM jako poza zakresem tego tematu. Dowód: dispatch (DODATEK pkt 4) zawęża komentarze do ok. l.985–993 i l.1103–1108; l.871 i l.892 leżą poza tymi zakresami i poza allowlistą kandydata. Komentarze nie wpływają na zachowanie. Proponuję osobny temat (np. R-WEB-DIPLO-COMMENTS-STALE-NUMBERS-Q1) — decyzja orkiestratora.

## NIE_ZMIERZONO / luki (ZAŁOŻENIA)
- Pełny przegląd pkt 5 (wszystkie liczby w diplomacy.json i diplomacy-war-peace-params.json) nie został wykonany w całości: przejrzane są sekcje dotknięte rundami 1 i 2 oraz l.249/305/321/471.
- Zdarzenie `wspolna_religia` (dZ=1) w kodzie — czy jest wywoływane, NIE_ZMIERZONO (poza zakresem; tabela już podaje 0).
- Zdarzenie `pokoj` (dZ=5 vs pokoj_zaufanie_ustawienie=20) — NIE_ZMIERZONO (logika, poza zakresem).
- Wygenerowane bundle i pliki HTML (gra-robocza, Gra-podglad-*.html, gra/tools/.*-bundle.cjs, Dyplomacja-szablon.md, Civ-UNITS) zawierają stare teksty. Są poza allowlistą i nie są źródłem gry; NIE_ZMIERZONO.

## TESTY
- Nowy test: `node gra/tools/diplo-json-descriptions-sync-test.cjs` → WYNIK: 36/36 OK, FAIL: 0 (28 sprawdzeń opisów, 0 niezgodności; 6 mutacji wykrytych).
- Walidacja JSON: `JSON.parse(gra/data/diplomacy.json)` → json ok.
- `git diff --check` (worktree, po zmianach) → bez błędów.
- Wartości czytane przez kod: `JSON.stringify(params)` przed (cb981436b) i po — identyczne (true). Zmienione klucze najwyższego poziomu: tylko `akcje_dyplomatyczne` i `zmiany_parametrów` (teksty opisowe).
- diplomacy.ts: brak zmian względem cb981436b (git diff --stat: tylko json + test).
- Pełne bramki rundy 1 (tsc, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, diplomacy-test 148/0, diplo-civpedia-values 129 OK, admin-panstwo 26/0, audience-actions 20/0): NIE_ZMIERZONO w tej rundzie. Nie uruchomiono npm ci (dysk 2,8 GB wolnego; reguła weba wymaga ≥4 GB przed startem). Uzasadnienie: diplomacy.ts i kod nie zmieniły się; grep pokazuje, że diplomacy-test, diplo-civpedia-values-test i wiarygodnosc-test nie asertują na edytowanych tekstach Efekt/Uwagi. Evaluator odtworzył bramki rundy 1 na tym samym kodzie (zielone).

## RUNDY
Obrona Operatora, runda 2 (po PASS-WITH-NOTES rundy 1 z zarzutami 1–4).

## NASTĘPNY KROK
Evaluator: sprawdzić commit rundy 2 (diff 2 plików danych/testu + raport). Orkiestrator: decyzja o temacie komentarzy (zarzut 4) i o dwóch NIE_ZMIERZONO (wspolna_religia, pokoj).

## DEPLOY/PUSH: NIE WYKONANO
