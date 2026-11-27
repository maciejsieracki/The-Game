STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-REALISTIC-Q1
GOAL: rozstrzygnąć, czy rozsądny gracz na maksimum może mieć obrońcę przed utratą jedynego miasta (tura 10–13 wg P0); obrona rundy 3 po ocenie Evaluatora 307db1ff8 (kandydat 4be8bb0fc).
ZMIANY/COMMIT: baza 4be8bb0fc (detach). Zmienione wyłącznie: dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md (przepisany) i ten raport. Zero zmian gra/src, gra/data, testów, WERSJE.md, manifestu, rust-port, runnerów i danych JSONL.
TESTY: bramek nie uruchamiano ponownie (brak zmian kodu). Wynik kandydata wg Evaluatora 307db1ff8: tsc exit 0; LOGIC OK (213/213); ai-test 297 passed, 0 failed. Przeliczenie JSONL podczas obrony (surowe wyjście):
- p0 s4242 n=13, lossTurn=10 w 13/13, turnsCompleted=9; p0 s778899 n=10, lossTurn=13 w 10/10, turnsCompleted=12; p0 s7 n=10, lossTurn=null, turnsCompleted=14.
- Unikalne serie skarbu P0 per ziarno: 3 (po jednej na ziarno) — potwierdza pseudoreplikację (zarzut 1).
- Skarb P0 w turze 12: ziarno 7 = 12 (zmierzone), ziarno 778899 = 12 (zmierzone), ziarno 4242 niezmierzone (przebieg do tury 9).
- P2 4242 Drewno: t5 16 → zakup → t6 7 → t7 0 (niewyjaśnione).
BLOKADY: (1) P1 na ziarnach 4242 i 778899 niezmierzony (wnioskowany z inwentarza); P1 n=3 tylko ziarno 7; zero ≥20/ziarno. (2) P2 wykonany hakiem setTaxSplit (zakaz z dodatku r2) — wynik informacyjny. (3) Przyczyna braku Drewna na 778899 i spadku Drewna w P2 4242 nie zbadana. (4) Diagnoza owner=null wnioskowana z logów czasu i danych NIEWAZNE; poprawka nie zweryfikowana na pełnym zestawie. (5) DEFEAT i realdef r1–r2 nie uruchomione ponownie. (6) Liczebność barbarzyńców w turze utraty: NIE ZMIERZONO.
RUNDY: 3/5 (runda obrony po ocenie Evaluatora r3).
ODPOWIEDZI NA ZARZUTY:
1. Pseudoreplikacja — PRZYJMUJĘ. Dowód: 33 przebiegi P0 = 3 serie (po jednej na ziarno). Fisher usunięty, „23/23” usunięte z DECISION_REQUIRED.
2. Cel 20 tur / P1 ≥20 na ziarno — PRZYJMUJĘ. P1 n=3 (ziarno 7), P2 n=4/1/2; horyzont 14 tur; NIE ZMIERZONO jawnie.
3. Ekstrapolacje — PRZYJMUJĘ z rozróżnieniem: „tura 12” dla 4242 oznaczona jako ekstrapolacja; dla 7 i 778899 Skarb 12 zmierzony (przebiegi do t12–14). Budowa Palisady/Murów oznaczona jako wyliczenie, niepróbowana. Brak Drewna na 778899 niezbadany; wniosek ograniczony do tur 1–12.
4. Hak P2 i „nieutrzymywalny” — PRZYJMUJĘ. P2 oznaczony jako informacyjny (zakaz haków z dodatku r2); teza „nieutrzymywalny” wycofana na rzecz „blokada końca tury w 1–2 turach, dłuższy horyzont NIE ZMIERZONO”; spadek Drewna w P2 oznaczony jako niewyjaśniony.
5. Diagnoza harnessu i definicja tury — PRZYJMUJĘ. Nagłówek przepisany na „wnioskowane”; DEFEAT i r1–r2 niezweryfikowane; definicja tury opisana, zgodność z DEFEAT nieuzgodniona.
6. Pole infra i barbarzyńcy — PRZYJMUJĘ. infra=false 46/46; mechanizm niewiarygodności nieprzetestowany pozytywnie w nowym świecie; liczebność barbarzyńców NIE ZMIERZONO (tylko lastBarbNear).
Zarzuty odrzucone z dowodem: brak.
NASTĘPNY KROK: orkiestrator decyduje o DECISION_REQUIRED (§7 dokumentu: jedno zdanie + warianty A/B/C). Przed wnioskiem o utrzymaniu: potwierdzić suwak podatku w UI (nie hakiem), zbadać spadek Drewna w P2 i przyczynę braku Drewna na 778899, zmierzyć P1 ≥20/ziarno po naprawie diagnozy owner=null.
UWAGI-DLA-ORKIESTRATORA:
- Runnery defeat-cause-live.cjs, realdef-live.cjs i inne z tym samym wzorcem startu (startNewGame → od razu awaitingFirstPlayerCity) nie są zweryfikowane co do świata; DEFEAT 34/37 wymaga ponownego biegu na świecie nowej gry.
- Model: dispatch rundy 3 nazywał rolę „Operator Sonnet”, ale to wykonanie działa na claude-haiku-5-5. Zapisuję to jawnie; orkiestrator decyduje, czy zmiana modelu jest zgodna z zasadą ról.
DEPLOY/PUSH: NIE WYKONANO
