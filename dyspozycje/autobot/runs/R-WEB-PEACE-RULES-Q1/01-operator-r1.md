STATUS: PASS-WITH-NOTES (etap Operatora; werdykt końcowy: Evaluator + Final Control)
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-PEACE-RULES-Q1
GOAL: Runda 3 wg dispatchu (kryterium 9 + zarzut 8 FC r2): żywa weryfikacja w Chromium (odmowa „silniejsze" + ostrzeżenie hamulca), mutacje, spójność zmęczenia, premia profilu +0.05. Bez zmian logiki silnika.
RUNDA-NUMERACJA: dispatch mówi RUNDA 3/5; polecenie workflow mówiło „Runda 1/5" i nazwę 01-operator-r1.md. Wykonano zakres dispatchu (r3); nazwa pliku zgodna z poleceniem. Rozbieżność do rozstrzygnięcia przez orkiestratora.

ZMIANY/COMMIT: baza 6650dc0c9 (detach). Allowlista: gra/data/diplomacy-war-peace-params.json (premiaProfilObronny 0 → 0.05, komentarz ZALOZENIE → DECYZJA ADM.); gra/tools/diplo-war-peace-profile-unit-test.cjs (oczekiwania Zulusi 0.33 / Chińczycy 0.54 + pętla D4 dla 15 cywilizacji); gra/src/main.ts (TYLKO nowy blok testowy `__peaceRulesTestDebug` przed `__aiWojnyZwykleCapTestDebug`-podobnym haczykiem; 66 linii dodanych, 0 usuniętych); gra/tools/diplo-war-peace-live-test.cjs (NOWY, 13 asercji live); dyspozycje/autobot/runs/R-WEB-PEACE-RULES-Q1/evidence/ (3 zrzuty PNG) i ten raport. Brak zmian w gra-robocza, WERSJE.md, forced-war-*, rust-port. SHA: patrz commit (podany w odpowiedzi orkiestratorowi).

TESTY (lokalnie, po wszystkich zmianach):
- tsc --noEmit: PASS (rc 0)
- diplo-war-peace-profile-unit: 198/0 (153 bazowe + 45 nowych D4)
- diplo-war-peace-gate 11/0; main-guard 28/0; sim 19/0 (S7 spójność: 0 naruszeń); d7 8/0
- diplo-tick-war-brake 51/0; unit 69/0; mutation 17/0 (baza + 16)
- diplomacy-test 148/0; diplomacy-peace-lock 9/0; war-rules-multiwar-main-guard 21/0
- NOWE diplo-war-peace-live-test (Chromium, ?playtest=mapa, vite build poza repo, bez npm run build): 13/0
  - A1: AI 2 silniejsza (rw 0.934), 5 tur wojny, 0 utraconych miast → realny evaluateProposal('pokoj') = odmowa „AI czuje się silniejsze…"
  - A2: ta sama para po 10 turach → odmowa „silniejsze" nie występuje
  - B1: AI 1 z miastami, bez wojny, łączna Relacja 0 ≤ 15, licznik 3→4 (= warnAt) realnym endTurn → w panelu wydarzeń (DOM, po włączeniu chipu „Inne cyw.") widoczne „Ryzyko wojny z Grecy: 2 tur do wypowiedzenia (łączna Relacja ≤ 15)"; zrzut live-B1-ostrzezenie-hamulca.png
  - B2 (D7): ten sam scenariusz, gracz silniejszy (2847 vs 275) → brak ostrzeżenia, licznik dobija do progu (tick działał)
  - C: 0 pageerror / console.error
- MUTACJE (live test musi być czerwony): M1 `if (false && isFeelingStronger…)` w diplomacy-war-peace-profile.ts:353 → FAIL „powód czuje się silniejsze" (1 fail). M2 `&& true` zamiast `warOutcome.mayDeclare` w main.ts:10342 → FAIL B2 (ostrzeżenie mimo silniejszego gracza). Oba zdjęte, przywrócone (git diff main.ts: tylko dodany hak).
- Spójność zmęczenia (r3 pkt 2): profile-unit dla 15 cywilizacji: warWearinessFraction(T,T)=1 i (T−1,T)<1, T≤20; sim S7 0 naruszeń „AI proponuje to, czego sama by nie przyjęła". Nie zmieniano progów sygnału (e) — ZAŁOŻENIE: S7 już spójność pokrywa.
- Wiring diploBrakeWarParams (pkt 3): wykonywalnie w live teście (warnAt=4 wynika z n=6 zwróconego przez main.ts).

TABELA 15 CYWILIZACJI (premia profilu +0.05 uwzględniona):
civ|progWojnyRelacji|progPokojSlabosc|progKrytyczny|progZdrowia|minTurWojny|T|hamulecN
grecy|30|0.48|0.27|0.42|4|19|6 · rzymianie|58|0.36|0.19|0.34|7|20|4 · chinczycy|16|0.54|0.31|0.46|2|17|7 · inkowie|32|0.48|0.27|0.42|4|19|6 · zulusi|63|0.33|0.17|0.32|7|20|4 · egipt|28|0.48|0.27|0.42|4|19|6 · sumer|23|0.51|0.29|0.44|2|18|7 · celtowie|46|0.42|0.23|0.38|4|20|5 · germanie|46|0.42|0.23|0.38|4|20|5 · harappa|22|0.54|0.31|0.42|2|17|7 · hetyci|37|0.45|0.25|0.42|4|20|6 · slowianie|44|0.42|0.23|0.42|4|20|5 · babilonia|28|0.46|0.29|0.42|3|18|6 · asyria|65|0.31|0.19|0.42|8|20|4 · fenicjanie|25|0.46|0.29|0.44|3|18|7

BLOKADY / OTWARTE (jawnie):
1. Odmowa „silniejsze" NIE jest zweryfikowana na ekranie negocjacji: live test wywołuje realny evaluateProposal i sprawdza zwrócony powód, ale nie otwiera panelu negocjacji gracza. Kryterium 9 („zrzut z widocznym komunikatem odmowy") w tej części NIEZAMKNIĘTE.
2. UX (do decyzji właściciela, poza allowlistą): ostrzeżenie hamulca trafia do panelu wydarzeń jako wpis „Wydarzenie" i jest DOMYŚLNIE UKRYTE filtrem chipu „🌍 Inne cyw." (OFF). Gracz widzi je dopiero po włączeniu chipu. Nie zmieniano filtra.
3. Playtest mapa: tylko AI 1 ma miasta w praktyce testu (AI 2–6 mają moc 0 po turze 1; liczba miast AI 2–6 NIEZMIERZONO). Po turze 2 kolejny endTurn bywa blokowany („Zakończ ekran bitwy”), dlatego każdy scenariusz B działa na świeżej stronie z jednym endTurn.
4. Hak `__peaceRulesTestDebug` w main.ts: wyłącznie test; asercje na silniku, nie na reimplementacji.
5. R8/R9 nie ruszane (zgodnie z dispatchem).

RUNDY: 3/5 (wg dispatchu; r1 Operator+Evaluator FAIL, r2 Obrona, FC r2 FAIL tylko za kryterium 9).
NASTĘPNY KROK: Evaluator (Sonnet) — sprawdzić zrzut i test live, mutacje M1/M2, tabelę; rozstrzygnąć pkt 1 (odmowa na ekranie) i pkt 2 (chip „Inne cyw.”). Potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
