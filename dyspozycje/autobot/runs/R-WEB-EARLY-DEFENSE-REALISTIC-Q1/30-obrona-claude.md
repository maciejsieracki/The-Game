STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-REALISTIC-Q1
GOAL: zmierzyć przeżywalność pierwszych 20 tur przy grze rozsądnego gracza na maksimum (inwentarz obrony startu, P0, P1 >= 20/ziarno, P2/P3). Obrona runda 2 (kandydat 46df6479a, raport Evaluatora 0f67fdc7f): odpowiedź na 12 zarzutów.
ZMIANY/COMMIT: baza 46df6479a (detach). W worktree przy starcie był niezacommitowany diff gra/tools/realdef-live.cjs (poprawka `opened`, pola barbNearStartUtraty/wiarygodny/definicjaTury); zweryfikowany i wliczony w ten commit. Zmienione: gra/tools/realdef-live.cjs; dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md (przepisany); dane/dane-r2-p0-p1.jsonl i dane/dane-r2-testy-kontrolne.jsonl (dopisane pola wiarygodny/powod_niewiarygodnosci, bez zmiany wartości pomiarów); ten raport. Zero zmian gra/src, gra/data, testów, WERSJE.md, manifestu, rust-port.
TESTY (surowe wyniki z tej sesji):
- node --check gra/tools/realdef-live.cjs: OK.
- npm ci --ignore-scripts (gra/): instalacja OK (komunikat audytu npm, bez wpływu na bramki).
- npx tsc --noEmit -p tsconfig.json: exit 0.
- node tools/logic-test.cjs: "LOGIC OK (213/213)".
- node tools/ai-test.cjs: "ai-test: 297 passed, 0 failed", exit 0.
- Fisher dwustronny P0 (11 utrat / 1 przeżycie) vs DEFEAT r2 (34 / 3): p = 1,0 (obliczenie ponowione w tej rundzie).
- Ponowne sprawdzenie danych: 24/24 wierszy ma tura_utraty = tury_ukonczone + 1; P0 12 wierszy wiarygodnych (zdobywca owner −1 lub przeżycie), P1 12 wierszy oznaczonych wiarygodny=false.
- Nowe pomiary live: NIE WYKONANO w tej rundzie (patrz BLOKADY).
ODPOWIEDZI NA ZARZUTY:
1. P1 n=8/4 zamiast >=20/ziarno — PRZYJMUJĘ. Dodatkowe biegi P1 w obecnym harnessie nie dałyby dowodu, bo utrata z owner=null i zależność od czasu rzeczywistego pozostają nierozstrzygnięte (zarzut 8). Status BLOCK.
2. Teza „P0 seed 4242 +2, seed 7 +1; 12 Pieniądz w t7” — PRZYJMUJĘ, błędna. Tempo jest losowe per przebieg. Przyrost t2→t3 = +2 w 4/12 P0 (4242 r1; 7 r3, r5, r6), +1 w 8/12. Skarb >= 12 po raz pierwszy w t7 w 4/12 P0 (nie 1/12; liczba 1/12 dotyczyła równości ==12), w t12 w 1/12, w 7/12 nie do t20. Tabela w dokumencie §3(b).
3. Teza „otwarcie panelu zmienia dochód z +2 na +1” — PRZYJMUJĘ i ODRZUCAM tezę. Przyczyna: rozkład losowy. Dowód: P0 +1 w 8/12, P1 +2 w 2/12 (4242 r6; 7 r4); kontrole r11 +2, r12 +1 mieszczą się w rozkładzie. Teza wycofana z dokumentu.
4. Inwentarz (a)–(d) niekompletny — PRZYJMUJĘ. W dokumencie §3 oznaczono jako NIE ZMIERZONO: czas produkcji, Drewno w ekonomii bez panelu, badanie najtańszej technologii, fort (realna budowa), awans Zwiadowcy, generał, oraz czy zlecenie jednostki bez wymogu jest możliwe (przyciski wyłączone).
5. Mury (80+80) i Koszary (40+40) „poza zasięgiem w t1–7” bez pomiaru Drewna/Kamienia — PRZYJMUJĘ. Zdanie zastąpione: wpływ NIE ZMIERZONO (§3(c), §8).
6. Niespójna definicja tury — PRZYJMUJĘ jako uwagę o kodzie i ODRZUCAM tezę o niezgodności danych. Dowód: 24/24 wierszy spełnia tura_utraty = tury_ukonczone + 1. Dodano w runnerze pole definicjaTury i komentarz. Różnica zakresów P0 (8–14) i P1 (5–7) wynika z zniekształcenia P1, nie z definicji.
7. Metryka barbarzyńców w pobliżu = 0 / null — PRZYJMUJĘ. Runner zapisuje teraz barbNearStartUtraty (pomiar z początku tury utraty) i barbNearAtLoss. W commitowanych danych r2 pola nie ma: metryka NIE ZMIERZONO, nie rozstrzyga. Liczba jednostek i siła nie są mierzone.
8. Przyczyna owner=null nieustalona; brak oznaczenia niewiarygodności — PRZYJMUJĘ. Wszystkie wiersze z zdobywca_owner=null (12 P1, 4 kontrolne) oznaczono wiarygodny=false z powodem; przyczyna NIE ZMIERZONA. Runner zapisuje od teraz pola wiarygodny i powodNiewiarygodnosci.
9. Niezdefiniowana zmienna `opened` w recruit-error — PRZYJMUJĘ. Potwierdzone w HEAD (gra/tools/realdef-live.cjs linia 207: `opened` bez deklaracji, ReferenceError). Poprawione: `tabClicked: false`. node --check OK.
10. P1 nie zamyka panelu („Wróć na mapę”) — PRZYJMUJĘ jako ograniczenie P1 (§5, pkt 3). Zgłoszony defekt „klik niszczy stan” bez repro; NIE wyodrębniono tematu w tej rundzie (wniosek dla orkiestratora w UWAGACH).
11. Doc §10 („12 przebiegów zamiast 6 na ziarno”) i brak tabeli 2×2 dla Fishera — PRZYJMUJĘ. Poprawiono §10 i §4 (tabela 11/1 vs 34/3, p = 1,0).
12. Brak jednozdaniowego DECISION_REQUIRED — PRZYJMUJĘ częściowo. Status BLOCK (nie DECISION_REQUIRED), bo inwentarz nie dowodzi braku środków przed t8: Drewno i czas produkcji są NIE ZMIERZONE. Patrz DECYZJA poniżej.
BLOKADY:
1. P1 niewiarygodny w obecnym harnessie: n=12 (< 20/ziarno), 0 zakupów, owner=null, zależność od czasu rzeczywistego (1,6 s/turę zmienia wynik kontroli r22). Bez naprawy harnessu P1, P2 i P3 nie są mierzalne. Naprawa (poza tą rundą, wymaga osobnego tematu): sterowanie tury bez stałych opóźnień (czekanie na gateInfo), probe listy miast po każdej turze i przyczyna owner=null.
2. Drewno i czas produkcji w ekonomii bez panelu: NIE ZMIERZONO (do pomiaru w osobnym temacie).
3. P2 i P3: zależą od P1; NIE ZMIERZONO.
RUNDY: 3/5 (runda obrony po FC r2; zgodnie z dispatchem bez zmiany logiki gry).
DECYZJA WYMAGANA (techniczna, dla orkiestratora, nie dla właściciela): zlecić osobny temat naprawy harnessu P1 (bez zależności od czasu rzeczywistego i z diagnozą owner=null) przed ponowieniem R-WEB-EARLY-DEFENSE-REALISTIC-Q1; tak / nie.
NASTĘPNY KROK: temat naprawy harnessu P1 i pomiar Drewna oraz czasu produkcji w ekonomii bez panelu; po nim P1 >= 20/ziarno, potem P2/P3.
UWAGI-DLA-ORKIESTRATORA:
- Przycisk „Wróć na mapę” w panelu miasta: pilotaż z kliknięciem kończył grę bez miast; powtórne repro NIE ZMIERZONO. Może to być realny defekt stanu sesji — warto osobnego sprawdzenia, jeśli da się odtworzyć.
- Uncommitted diff przy starcie worktree został zweryfikowany i wliczony w ten commit (nie był dziełem tej rundy).
- Node_modules w gra/ zainstalowane na potrzeby bramek; usuwane po zakończeniu.
DEPLOY/PUSH: NIE WYKONANO
