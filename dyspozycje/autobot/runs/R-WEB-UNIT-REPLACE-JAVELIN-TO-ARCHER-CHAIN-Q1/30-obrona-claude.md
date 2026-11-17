STATUS: PASS-WITH-NOTES
DOMAIN: GAME (Zastąp, dane/tabela zamian, testy)
TEMAT: R-WEB-UNIT-REPLACE-JAVELIN-TO-ARCHER-CHAIN-Q1
GOAL: obrona zarzutów Evaluatora (raport 0c63f5f59fc3cca570ca57b814809d777b5f48e4) dla kandydata 95dab45fd. Łańcuch Oszczepnik -> Łucznik -> Procarz bez zmiany decyzji (Estólica = DECISION_REQUIRED).
BAZA: bc4d623655f71c36eee1621389357961bc6d2641 (origin/main). KANDYDAT: 95dab45fd3b0d86239b6ac00cec0869bad510b35. COMMIT OBRONY (testy): 925322f90.
DODATEK: 00-dispatch-DODATEK-claude.md NIE ISTNIEJE w origin/main, origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 ani w 95dab45fd (git ls-tree oraz git log --all -- '*DODATEK*' nie dają pliku tego runu). Dispatch 00-dispatch.md istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.

ZMIANY-COMMIT:
- 925322f90 gra/tools/unit-replace-archer-slinger-test.cjs: asercje pól danych (units.json „Zastąp specjalnie” = „Łucznik” dla Oszczepnika i Oszczepnika Zulu), asercja AI Zulu -> Łucznik (Kamień, obniżka klasy), dopisek dokumentacyjny przy asercji Procarza.
- Kod gry (units.json, ai-era-unit-promotion.ts) bez zmian w tej obronie.
- Raport: dyspozycje/autobot/runs/R-WEB-UNIT-REPLACE-JAVELIN-TO-ARCHER-CHAIN-Q1/30-obrona-claude.md (osobny commit).

ODPOWIEDZI NA ZARZUTY:
1. DODATEK nieistniejący — PRZYJMUJĘ jako fakt. Kryteriów z DODATKU nie da się zweryfikować (NIE_ZMIERZONO); ocena wg 00-dispatch.md. Decyzja w gestii orkiestratora.
2. Chromium/xvfb (kryterium c) — PRZYJMUJĘ, nie zamknięte. /usr/bin/chromium i /usr/bin/xvfb-run są w systemie, ale żywego przejścia w oknie Zastąp w tej rundzie nie uruchomiono. Stan: NIE ZMIERZONO.
3. Civpedia/wiki i wikiBundle (krok 5) — ODRZUCAM jako wymóg do wykonania w tym temacie. Dowód: docs/encyklopedia/jednostki/oszczepnik.md, oszczepnik-zulu-izijula.md, oszczepnik-estolica.md oraz docs/PORADNIK-GRACZA/57-katalog-jednostek.md nie opisują przejść „Zastąp” (grep „zastąp”/„procarz”/„łucznik” bez trafienia w tym łańcuchu). Katalog docs/ nie jest na allowliście. Generator gra/tools/bundle-wiki-for-game.cjs czyta te pliki, a ich treść się nie zmienia, więc regeneracja wikiBundle nie jest wymagana. Opis łańcucha w wiki = osobny temat po decyzji o Estólicy.
4. Dług Rust REPIN tabeli zamian (kryterium d) — PRZYJMUJĘ częściowo: zapisany w BLOKADACH i UWAGACH. Założenie tematu wymaga narzędzia tworzącego sesje/zadania, którego ten Operator nie może użyć (zakaz). Orkiestrator zakłada temat.
5. Estólica DECISION_REQUIRED — PRZYJMUJĘ bez zmiany kodu. Uwaga do ABC: argument „sprzeczność klasowa” (Specjalna -> Standardowa) jest słabszy niż przy Zulu, gdzie ta sama zmiana klasy została dopuszczona. Rekomendacja A (Estólica -> Łucznik) pozostaje. Decyzja należy do właściciela.
6. Brak asercji AI dla Zulu -> Łucznik — PRZYJMUJĘ, naprawione w 925322f90: aiPromote('Oszczepnik Zulu (Izijula)', Zulu, Kamień) -> ok, typeId „Łucznik”.
7. Trywialna asercja Procarza i brak wykrycia mutacji units.json — PRZYJMUJĘ, naprawione: asercje bezpośrednio na polu danych units.json. Asercja Procarza oznaczona jako dokumentacyjna (nie dowód logiki). Mutacje M1/M2 są teraz wykrywane przez archer-slinger.
8. Mutacja wykonana przez Evaluatora (NIE_ZMIERZONO u operatora) — PRZYJMUJĘ jako dowód; własne mutacje M1–M3 poniżej, wszystkie czerwone, pliki przywrócone.

TESTY (surowe wyniki, na 925322f90, z gra/, po npm ci --ignore-scripts):
- node tools/unit-replace-archer-slinger-test.cjs -> 51 OK, 0 FAIL; exit 0 (przed zmianą: 47 OK)
- node tools/unit-replace-promotion-table-test.cjs -> PASS: 32 wpisów źródłowych, 64 krawędzi, brak cykli; exit 0
- node tools/logic-test.cjs -> LOGIC OK (213/213); exit 0
- node tools/tech-tree-test.cjs -> 20 pass, 0 fail; exit 0
- node tools/research-test.cjs -> PASSED: 33 / FAILED: 0; exit 0
- node tools/unit-replace-test.cjs -> WSZYSTKIE TESTY ZIELONE (21/21); exit 0
- node tools/combat-test.cjs -> All sanity checks passed; exit 0
- node tools/ai-era-unit-promotion-test.cjs -> 17 passed, 0 failed; exit 0
- node tools/ai-unit-replace-same-rules-test.cjs -> 45 passed, 0 failed; exit 0
- node tools/unit-replace-full-cost-test.cjs -> 39 passed, 1 failed; exit 1 = dług bazowy z dispatchu (nie naprawiany)
- npx tsc --noEmit -> exit 0

MUTACJE (surowe wyniki; po każdej plik przywrócono przez git checkout):
- M1: units.json l.192 Oszczepnik „Zastąp specjalnie” Łucznik -> „—”: promotion-table exit 1 (FAIL (1)); archer-slinger 50 OK, 1 FAIL ([FAIL] units.json: pole Zastąp specjalnie Oszczepnika = "Łucznik" -- —); exit 1.
- M2: units.json l.1286 Zulu -> „—”: promotion-table exit 1; archer-slinger 50 OK, 1 FAIL ([FAIL] ... Oszczepnika Zulu = "Łucznik" -- —); exit 1.
- M3: ai-era-unit-promotion.ts: usunięty warunek !javelinToArcherOk: archer-slinger 49 OK, 2 FAIL ([FAIL] AI Oszczepnik (Kamień) -> Łucznik ... ok:false; [FAIL] AI Oszczepnik Zulu (Kamień) -> Łucznik ... ok:false); exit 1.

BLOKADY:
- Kryterium (c) Chromium/xvfb: NIE ZMIERZONO.
- Estólica: DECISION_REQUIRED (opcje A/B/C w 10-operator-claude.md; rekomendacja A).
- Civpedia/wiki: bez zmian (odpowiedź 3).
- Dług Rust REPIN tabeli zamian: do założenia przez orkiestratora.
- Dług bazowy unit-replace-full-cost-test 39/1: nietknięty.

RUNDY: 2/5 (Operator obrona, Haiku 5.5). Ostatni werdykt: PASS-WITH-NOTES (Evaluator, 0c63f5f59).
DECYZJA WYMAGANA: Estólica (Inkowie): wpis „Procarz/Procarz (Huaracoc)” -> A / B / C.

UWAGI-DLA-ORKIESTRATORA:
- Brak pliku 00-dispatch-DODATEK-claude.md w żadnej gałęzi: proszę o potwierdzenie, czy kryteria z DODATKU obowiązują (wtedy wymagany ponowny dispatch).
- Argument klasowy przy Estólicy jest niespójny z decyzją dla Zulu (ta sama zmiana klasy dopuszczona); warto to podać właścicielowi przy ABC.
- Zakaz nowych sesji zachowany: nie wywołano spawn_task, dismiss_task, create_session, create_trigger, send_later ani innych narzędzi tworzących sesje.

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje 925322f90 i mutacje M1–M3; orkiestrator zbiera decyzję o Estólicy i kryteria DODATKU; Chromium do osobnej rundy lub decyzji.
DEPLOY/PUSH: NIE WYKONANO
