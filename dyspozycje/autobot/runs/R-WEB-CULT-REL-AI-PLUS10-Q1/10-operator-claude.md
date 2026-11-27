# R-WEB-CULT-REL-AI-PLUS10-Q1 — raport Operatora, runda 3/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1 (tag AIPLUS10)
GOAL: domknąć dwie blokady FC r2 przed READY_FOR_DEPLOY: (1) weryfikacja żywa D/G i round-trip zapisu, (2) naprawa testu kreatora reposition; oraz pomiar PRZED/PO z `--pace wysoki` na seedach 4242 i 7 plus wariant „AI łatwy”.
BAZA: args.cand = c67af3665 (FC r2). Kandydat rundy 3 = `85b8e79a9`. `git merge-base --is-ancestor c67af3665 HEAD` = TAK. Merge `origin/main` = `99375f77e` (ancestor TAK). UWAGA: origin/main ruszył do `3608af1ce` po starcie rundy; nie scalony (integracja orkiestratora musi ponowić merge).
SHA (czubek pracy): `85b8e79a9`; merge: `3aff4be25`; poprawka testu kreatora: `85b8e79a9`.

ZMIANY-COMMIT:
- `3aff4be25` merge `origin/main` (99375f77e) do kandydata; `git merge-tree` był czysty, merge bez konfliktów.
- `85b8e79a9` `gra/tools/newgame-settings-layout-reposition-test.cjs`: `ADV_ORDER` podniesiony z 14 do 18 pozycji = faktyczna lista okna zaawansowanego (wynik rzeczywisty z przeglądarki): Zasięg ruchu, Limit miast zakładanych (baza), Bitwy, Trafienia, Wzrost surowców z epoką, Dyplomacja i wojna, Kultura i religia — dla gracza, Kultura i religia — dla komputera (AI), Wymagaj rozpatrzenia…, Wzrost ludności, Koszty budynków, Koszty jednostek, Jakość grafiki mapy, Surowce na mapie, Rzeki, Pustynie, Las, Góry i wzgórza. Uzasadnienie: 4 nowe pozycje mają zamierzone źródło (Wzrost i Dyplomacja z wcześniejszych tematów, dwa selektory Kultury z DODATKU 3); pin, nie osłabienie asercji; oczekiwany komunikat zmieniony z „14” na „18”.
- `dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md`: nowa sekcja „Runda 3” z tabelą PRZED/PO (pace wysoki) i listą NIE ZMIERZONO.
- Kod gry (`gra/src`) w tej rundzie NIE zmieniony (weryfikacja nie wykazała błędu do poprawy).
- Nie zmieniano: gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, progów, wartości D/G.

TESTY (surowe wyniki, `gra/` po `npm ci`, HEAD = `3aff4be25` dla kodu gry; po poprawce testu `85b8e79a9`):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- culture-religion-level-test: 108 pass / 0 fail
- ai-plus10-culture-test: 72 pass / 0 fail
- ai-plus10-matrix-test: 190 pass / 0 fail
- ai-plus10-wizard-ui-test: 6 pass / 0 fail (parametry startu kulturaReligiaLevel=trudny, kulturaReligiaLevelAI=latwy)
- culture-religion-test: 65 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-order-need-wiring-test: 267 passed, 0 failed (of 267)
- ai-city-rebellion-gate-test: PASS=37 FAIL=0
- ai-city-rebellion-news-test: PASS 24/0
- diplo-world-news-test: PASS 67/0
- newgame-settings-layout-reposition-test: PRZED: exit 1 (18 vs 14 pozycji); PO poprawce: exit 0, PASS
- Nie uruchomiono ponownie: ai-city-order-need-test (35/0 w r2, zmiana tylko w pinie testu kreatora i w kodzie z r2 bez zmian w tej rundzie) — NIE ZMIERZONO w tej rundzie.

WERYFIKACJA ŻYWA (checklist DODATKU 5 pkt 1):
- Odczyt D/G (civTest) gracz/AI, epoki 1–3: NIE ZMIERZONO. Powód techniczny: w `gra/src` nie ma istniejącego haka zwracającego rozbicie Kultury i Religii per właściciel; dodanie go to zmiana `gra/src` spoza zakresu tej rundy. Wartości potwierdzone testami jednostkowymi (matrix 190/0, plus10-culture 72/0, culture-religion-level 108/0), w tym 3×3 poziomów i mutacje czerwone z rundy 2.
- Round-trip zapisu/wczytania (`kulturaReligiaLevelAI`): przeglądem kodu — `setCulturaReligiaLevel(raw, rawAi)` (culture-religion-level.ts:74) daje AI = poziom gracza, gdy pola brak (legacy), a `null` (zgodność) zostaje `null`; zapis w `getSettings` (main.ts ~34502) i wczytanie (main.ts ~52290). Test żywy NIE ZMIERZONO (brak runnera zapisu z dwoma poziomami). To jest BLOKADA dla READY_FOR_DEPLOY wg FC r2.
- Zrzut kreatora z dwoma selektorami: z rundy 2 (`dane/kreator-dwa-selektory-kultura.png`); nie powtórzono w rundzie 3.

POMIAR (PRZED/PO, poziom maksymalny: gra Trudny, Kultura gracza Trudny, Kultura AI Trudny, Koszty jednostek Wysoki ×4 = `--pace wysoki`, `unitCostPace=wysoki` potwierdzone w każdym rekordzie, 60 tur, `--city-state 1 --unit-flow 1`):
- PRZED = baza `44649038c` (osobny build z git archive), PO = kod `3aff4be25`.
- s4242 PRZED t10/t30/t60: jednostki AI 57/118/159; miasta AI 42/68/153; poniżej 14%: 14/6/60; Porządek AI śr. 19,3/33,9/21,2.
- s4242 PO t10/t30/t60: jednostki AI 57/172/214; miasta AI 42/126/187; poniżej 14%: 0/0/1; Porządek AI śr. 65,8/62,9/55,4.
- s7 PRZED t10/t30/t60: jednostki AI 57/111/138; miasta AI 42/71/149; poniżej 14%: 15/9/75; Porządek AI śr. 20,8/31,6/19,1.
- s7 PO t10/t30/t60: jednostki AI 56/190/262; miasta AI 44/127/184; poniżej 14%: 0/0/0; Porządek AI śr. 65,4/66,0/51,8.
- Wariant „AI łatwy, gracz trudny” (PO, s4242, `--kr trudny --kr-ai latwy`): t60 jednostki AI 236, miasta AI 193, poniżej 14%: 1, Porządek AI śr. 57,4. PRZED dla tego wariantu NIE ZMIERZONO.
- Zastrzeżenie: baza 44649038c nie ma FALI 928–929 (AIREBEL); różnica PRZED/PO obejmuje też tę zmianę.
- Pomiar wartości gracza w grze: NIE ZMIERZONO.

BLOKADY:
- (a) Odczyt D/G w żywej grze i round-trip zapisu/wczytania w żywej grze — NIE ZMIERZONO (patrz wyżej). Wymagane przed READY_FOR_DEPLOY wg FC r2; wymaga decyzji orkiestratora: osobny temat z hakiem odczytu, albo przyjęcie długu z weryfikacją po deployu.
- (b) origin/main przesunął się do `3608af1ce` po scaleniu `99375f77e`. Integracja orkiestratora musi ponowić merge i bramki.

UWAGI-DLA-ORKIESTRATORA:
- Test reposition jest zielony po pinie 18 pozycji; wcześniejszy opis w dispatchu („16 pozycji”) nie odpowiadał stanowi — faktyczna liczba to 18.
- Biegi z `--pace normalny` (domyślny runnera) nie są używane w tym raporcie; wszystkie liczby powyżej są z `--pace wysoki`.
- Dane surowe poza repo: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (out-base-4242, out-cand-4242, out-base-7, out-cand-7, out-cand-4242-aiL; pliki `seed*.jsonl`) oraz `summ.py` (zestawienie).
- Zakaz spawn_task/create_session/create_trigger/send_later nie był użyty; nie użyto run_in_background; push i deploy NIE WYKONANO.

RUNDY: 3/5 (ten werdykt kończy rundę 3; wynik: PASS-WITH-NOTES, blokady a–b otwarte dla orkiestratora)
NASTĘPNY KROK: orkiestrator decyduje o blokadzie (a) (osobny temat live D/G + round-trip, albo akceptacja długu z weryfikacją po deployu) i ponawia merge z aktualnym origin/main przed FC r3.
DEPLOY/PUSH: NIE WYKONANO
