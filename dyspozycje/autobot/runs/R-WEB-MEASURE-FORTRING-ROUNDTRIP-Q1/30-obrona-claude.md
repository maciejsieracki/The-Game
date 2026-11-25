STATUS: BLOCK
DOMAIN: GAME (pomiar; bez zmian logiki gry i bez zmian gra/src)
TEMAT: R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1
GOAL: powtórka round-trip zapisu ON/OFF (różnica cityProd), bieg ciągły seed 4242 do t60 ON/OFF, test gate, dokument wyników. Kryterium binarne NIESPEŁNIONE (patrz BLOKADY).
ZMIANY/COMMIT: baza bb3a824ca (origin/main); kandydat Evaluatora 7a9c42a89. Zmiany obrony: dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-2026-11-25.md (korekta: usunięto błędne twierdzenie o trwającym PID 11723, dodano jawne NIE ZMIERZONO, wyjaśnienie turnsDone) oraz ten raport. Kod gry i gra/tools nie zmienione. SHA czubka: patrz pole sha w wyniku.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. Round-trip tylko przy t8, rozbieżność przy t59/t60, powtarzalność i minimalne odtworzenie NIE ZMIERZONO. PRZYJMUJĘ. Dowód: state.json rt-on-2, rt-on-3, rt-off-1, rt-off-2b, rt-off-3 — wszystkie lastTurn=8, identical=true, forty 0/0, diff []. Dokument teraz mówi wprost, że pięć tożsamych skrótów przy t8 to kontrola, a nie dowód braku różnicy. Nie wykonano powtórek przy t59/t60 (koszt: tura ok. 40 s, Chromium przerywa przebiegi między t9 a t18).
2. Bieg ON do t60 niewykonany; dokument błędnie pisał, że PID 11723 trwa. PRZYJMUJĘ. Dowód: `ps` nie pokazuje procesu fortring-measure; fr-on2/run.log kończy się na turze 18 ("Target page, context or browser has been closed", sec=1145, chunk lastTurn=0 done=false). Błędne zdanie usunięte z dokumentu. Czasy tur podane z logu: tury 2–18, 32,2–47,2 s (17 pomiarów, bez tury 1).
3. Test gate niewykonany; hak stawiający fort nie dodany; forty=0. PRZYJMUJĘ. Dowód: diff bb3a824ca..7a9c42a89 — 2 pliki dokumentacyjne, gra/ bez zmian. Gate i wpływ pierścienia pozostają NIE ZMIERZONO. Nie dodałem haka: dispatch warunkował go na tym, że forty nadal się nie pojawiają, a bez pełnego biegu do t60 nie da się tego stwierdzić.
4. STATUS PASS-WITH-NOTES przy niespełnionym kryterium binarnym. PRZYJMUJĘ. Status zmieniony na BLOCK. Kryterium binarne spełnione częściowo: punkt round-trip (3 powtórzenia na wariant) nie spełniony w pełni, bieg t60 nie spełniony, gate nie spełniony, dokument z uczciwym NIE ZMIERZONO tak.
5. Drobne: turnsDone=7 przy lastTurn=8; pięć tożsamych hashy to kontrola. CZĘŚCIOWO ODRZUCAM z dowodem: rozbieżność licznika wyjaśniona. Wiersz 1 w rt-on-2/fortring-on-seed4242.rows.jsonl to kind "start" bez ms; runner (gra/tools/fortring-measure.cjs linia 293) liczy tylko wiersze "turn" z ms, czyli tury 2–8 = 7. Nie ma niespójności licznika. Hash tury 8 jest w rows.jsonl (stateSha256). Zgoda, że pięć tożsamych hashy to kontrola poprawności, a nie dowód braku błędu.

BLOKADY:
- Bieg ciągły ON do t60 nie został ukończony (Chromium padł na t18). Bieg OFF do t60 nie wykonany.
- Round-trip przy t59/t60 i powtarzalność różnicy cityProd: NIE ZMIERZONO.
- Test gate (30 tur): NIE ZMIERZONO.
- Wpływ pierścienia fortów (0 fortów we wszystkich biegach): NIE ZMIERZONO.
- Chromium headless przerywa przebiegi (4 z 9 w tej serii): przyczyna NIE ZMIERZONA.
- Brak minimalnego odtworzenia (kandydat BŁĄD-GRY): nie zgłaszam, bo nie ma dowodu powtarzalności.

TESTY: nie uruchamiano bramek (tsc, logic, ai-test, fortring-civtest-hook, war-rules-multiwar-main-guard, hotseat e-source, bramki-tmpdir) — dispatch wymaga tsc tylko przy zmianie src, a src nie zmieniono. Wyniki pomiarów: źródło = state.json i rows.jsonl w scratchpadzie (fr-*/rt-*), liczby wyżej.
RUNDY: 2/5 (runda 1 FAIL: brak commita; runda 2 = ta obrona; Evaluator r2 zarzuty 1–5).
NASTĘPNY KROK: FC ocenia wynik CZĘŚCIOWY. Do zamknięcia tematu potrzebne: (a) bieg ON i OFF do t60 w osobnych przebiegach z restartem Chromium między chunkami (zamiast wznowień ze slotu), (b) round-trip x3 przy t59/t60 na tym samym stanie, (c) gate 30 tur, (d) ewentualny hak stawiający fort pod ?civTest=1. Decyzja o zakresie i budżecie czasu po stronie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: scratchpad fr-on2 i pozostałe katalogi rt-* są poza repo i nie zostały usunięte (potrzebne jako dowód). Nie uruchomiono żadnego procesu w tle po tej rundzie.
