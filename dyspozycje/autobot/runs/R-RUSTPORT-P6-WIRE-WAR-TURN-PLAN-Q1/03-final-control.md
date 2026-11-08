STATUS: FAIL
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1
GOAL: Final Control planu P6-WIRE-WAR-TURN-PLAN.md (Operator r2 = c2c8c0b89) po zarzutach Evaluatora r1 i Obronie.
ZMIANY/COMMIT: oceniany `c2c8c0b89` (gałąź `rustport-p6-wire-war-turn-plan-q1-r2`), rodzic `1dbc66013`, baza `730cd6f18` = obecny `origin/rust-port/parity-v2`. `git diff --stat 730cd6f18 c2c8c0b89`: 3 pliki (plan + 01-operator-r1.md + 01-operator-r2.md), wszystkie w allowliście; brak zmian w `gra/**` i `rust-port/**`; `git diff --check` czysto. Ten plik: 03-final-control.md (commit FC na gałęzi `rustport-p6-wire-war-turn-plan-q1-fc`, rodzic c2c8c0b89).
TESTY: Dokumentacja, bez cargo. Samodzielna weryfikacja numerów linii na `git show 60a18c60d:gra/src/main.ts` (45 671 linii): pruneForcedWarWaves 39335; prepareAiGeneralWarCampaign 7480/39353; tickDiplomacy 39726 (+11119 w brake); decideAIDiplomacy 40130; decideAITurn 40470; runDiplomacyTurnTick 23101/36618; tickDiploAiAiPairsWithBrake 11115/23195; sweepStaleForcedWarEntries 11245 (def.) / 38872 (wywołanie); scanAutoSiegesAfterAiTurn 41391; shouldAIPurchaseUnit 41206; advanceCityEconomy 36757; checkVictory 41805; ownerLoop 39152; runAiPhase def. 38752, await 41394; siege* w zapisie 35705-35707; diploBrakeBonusFlags 11004/39712 — wszystkie zgodne z planem. Korekty r2 zarzutów 1, 2, 3 i błąd numeryczny z zarzutu 4 uznaję za naprawione prawidłowo.

WERDYKT PER ZARZUT (Evaluator r1):
1. Kolejność ownerLoop: ODDAL (naprawione w r2, zweryfikowane).
2. Brak `diplomacy_tick_war_brake` w partiach: ODDAL (W6, wołający poprawiony na runDiplomacyTurnTick -> tickDiploAiAiPairsWithBrake).
3. Stan oblężenia w W1/tabeli 4: ODDAL (siege* dodane, pełny przegląd 35587-35890 zadeklarowany).
4. Nieścisłości numeryczne/ścieżki: ODDAL.

NOWE ZARZUTY FC (wykryte przy weryfikacji r2):
A. NAPRAW — sprzeczność wewnętrzna D7 (sekcja 7). Opcja A (R) brzmi „w W6”, a r2 przeniósł zakup jednostki AI do W4 (tabela partii W4/W6, sekcja 3, 01-operator-r2.md). Orkiestrator zada właścicielowi ABC na podstawie sekcji 7, więc rekomendacja wskazuje partię, która już zakupu nie zawiera. Obrona twierdzi, że D2 i W8 zaktualizowano, ale D7 pominięto. Poprawić na „w W4” (oraz sprawdzić `grep -n 'W6'` pod kątem pozostałych odwołań do zakupu).
B. NAPRAW — niespójna arytmetyka w komentarzu pod tabelą partii (sekcja 6): „Suma ≈ 4 230 (r1 = 4 040), różnica: +70 W1, +84 zakup do W4 bez zmiany sumy, +136 wiring brake w W6”. Rzeczywiste różnice wg tabeli: W1 +70 (450->520), W4 +84 (450->534), W6 +36 (550->586), razem +190 = 4230-4040; wyjaśnienie podaje 290 i jest wewnętrznie sprzeczne („bez zmiany sumy”). Sama suma 4230 jest poprawna (520+550+500+534+580+586+560+400). Zapisać: +70/+84/+36 = +190, z jednozdaniową uwagą o przesunięciu zakupu W6->W4 (szacunek NIE_ZMIERZONO).

Oba naprawy są drobne (dokumentacyjne, 2 zdania), ale dotyczą tekstu, który orkiestrator przekaże właścicielowi do decyzji D7; stąd FAIL zgodnie z regułą „choć jeden NAPRAW -> FAIL”. Pozostałe uwagi (ODDAL/informacja, bez wymogu): opis D2-B jest nieprecyzyjny, ale jest tylko alternatywą; „brak wołającego w Rust” dla r2 przyjęte z r1 jako założenie (jawnie zapisane) — akceptuję.

BLOKADY: brak
RUNDY: 2/5 zużyte; następna runda 3/5 tego samego ID, Operator dostaje wyłącznie zarzuty A i B (poprawka erraty, bez nowego pomiaru).
NASTĘPNY KROK: Operator r3 (Haiku wystarczy) na bazie c2c8c0b89 (gałąź rustport-p6-wire-war-turn-plan-q1-r2 lub FC `rustport-p6-wire-war-turn-plan-q1-fc`): poprawić D7 i komentarz sumy; Evaluator r3 sprawdza tylko te dwa miejsca + `git diff --stat` do allowlisty; po PASS integracja i ABC D1-D8.
KOLEJNOŚĆ WZGLĘDEM origin/rust-port/parity-v2: `730cd6f18` jest przodkiem c2c8c0b89 (merge-base --is-ancestor = tak); parity-v2 nie zmienił się od bazy (nadal 730cd6f18), więc integracja = fast-forward parity-v2 -> (SHA po r3 PASS); ten FAIL nie jest do integracji. SHA końcowy do integracji: BRAK (czeka na r3).
DEPLOY/PUSH: NIE WYKONANO
