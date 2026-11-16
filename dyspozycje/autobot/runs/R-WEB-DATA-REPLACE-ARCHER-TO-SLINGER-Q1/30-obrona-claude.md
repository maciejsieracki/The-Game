STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1
GOAL: Łucznik (standard, Kamień, Typ=Distance) może zostać zamieniony przez „Zastąp” na Procarza (standard, Brąz, Typ=Slinger); dla Inków dostępny także Procarz (Huaracoc). Kierunek wyłącznie Łucznik → Procarz. (Bez zmian względem dispatchu; obrona r1 domyka testy, nie zmienia danych ani silnika.)
BAZA: cb077b588ee37abcf210ed5c00e893de30aa27b9 (origin/main). Kandydat Operatora: 4861293d50aca17b0886edf4efd692f406a82a0b. Obrona startuje od kandydata.

ZMIANY/COMMIT:
- a546ca474990cf1661a0c32f37850a5e5a3ef3af — obrona r1 (tylko pliki testów, git add po ścieżce):
  - gra/tools/unit-replace-archer-slinger-test.cjs: dodane asercje 7 (Brąz bez Koszar: brak Procarza), 8 (ścieżka AI: promoteAiUnitForEra z tabelą zamienników z realnego availableReplacementsFor i pełnym kosztem Pieniądz 4 + Drewno 25: awans w Brązie, brak awansu w Kamieniu, klasa armii „dystans” zachowana), 9 (Łucznik egipski w Brązie: brak Procarza, pinowany zakres zgodny z dispatchem, decyzja ABC otwarta).
  - gra/tools/unit-replace-promotion-table-test.cjs: poprawiony nagłówek (tabela nie jest już „tylko piechotą”; wyjątek ARCHER_EXCEPTIONS).
- Dane (units.json), silnik (gra/src), rust-port, manifest, WERSJE.md: BEZ ZMIAN. git diff --name-only względem cb077b588 w gra/src: pusto.
- Ten raport: dyspozycje/autobot/runs/R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1/30-obrona-claude.md (osobny commit, SHA w polu sha odpowiedzi).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
- Zarzut 1 (d, zrzut pickera Chromium 1280×720): PRZYJMUJĘ jako OTWARTE. NIE ZMIERZONO w tej rundzie (nie uruchamiano Chromium ani builda Vite poza repo). Kryterium (d) NIE jest zaliczone; nie wolno go liczyć jako PASS.
- Zarzut 2 (c, wpływ na AI): PRZYJMUJĘ CZĘŚCIOWO. Dodany test na realnej funkcji awansu AI (promoteAiUnitForEra z realnymi kandydatami i kosztami) — ZMIERZONO w teście: awans Łucznik→Procarz w Brązie (ok, Pieniądz 100→96, Drewno 100→75), brak awansu w Kamieniu, klasa „dystans” zachowana. NIE ZMIERZONO: ilościowy efekt w grze (ile łuczników AI zamieni na turę przy limicie 10% armii i rezerwie utrzymania). To wymaga pomiaru w harnessie i pozostaje otwarte.
- Zarzut 3 (Inkowie widzą OBA warianty Procarz i Procarz (Huaracoc)): ODRZUCAM jako defekt tego tematu, wynik ABC. Dowód: dispatch GOAL mówi „dla Inków — na Procarz (Huaracoc) zgodnie z istniejącą regułą wariantu narodowego”, ale ta reguła w silniku nie ukrywa wspólnych wpisów standardowych: sonda availableReplacementsFor dla Inków w koszarach daje „Oszczepnik:3, Oszczepnik (Estólica):5, Procarz:8, Procarz (Huaracoc):8” (ten sam mechanizm dla wszystkich nacji, np. Egipt widzi Łucznika standardowego obok nubijskiego). Ukrycie standardowego Procarza dla Inków wymagałoby nowej reguły w availableReplacementsFor (poza allowlistą tematu). Pytanie do właściciela (ABC): A) zostawić oba warianty (stan obecny), B) ukryć standardowego Procarza dla Inków (nowa reguła silnika).
- Zarzut 4 (narodowi łucznicy bez przejścia na Procarza): ODRZUCAM w tym temacie. Dowód: dispatch ALLOWLISTA/GOAL: „zrób wpis tylko dla Łucznika standardowego i opisz resztę jako propozycję (nie wymyślaj nowego mechanizmu)”. Test 9 pinuje ten zakres. Propozycja do ABC: Łucznik egipski/nubijski (Egipt), sumeryjski/akadyjski (Sumer), asyryjski (Asyria) → Procarz; to jest zmiana danych w „Zastąp specjalnie” i nie wymaga silnika, ale poszerza zakres decyzji właściciela (2026-11-16: tylko Łucznik → Procarz).
- Zarzut 5 (luki testu): PRZYJMUJĘ i naprawiam w a546ca474: asercja „Brąz bez Koszar → brak Procarza” (test 7), asercje ścieżki AI (test 8), asercja zakresu narodowego (test 9), nagłówek promotion-table-test. Mutacja na units.json z bazy: 9 OK / 6 FAIL, exit 1 (wykrywa brak wpisu).
- Zarzut 6 (f, „stała lista deployu”): PRZYJMUJĘ jako zweryfikowane NIE do końca. Sprawdzone: git grep po kandydacie — nazwy plików unit-replace-full-cost-test i unit-replace-promotion-table-test występują tylko w swoich plikach, w komentarzach src/game/unit-replace-cost.ts i w dokumentacji procesu. unit-replace-test.cjs jest wymieniony wyłącznie w dokumentach skilli: .claude/skills/civ-autobot/SKILL.md:253 (lista bramek) i .claude/skills/civ-autobot-workflow/SKILL.md:313 (bramki). Nie znaleziono pliku manifestu wykonującego testy automatycznie. Nowy test unit-replace-archer-slinger-test.cjs NIE jest wpisany do tych list bramek. Nie dopisuję go, bo pliki skilli są poza allowlistą tematu. Decyzja dla orkiestratora: czy dopisać go do listy bramek w skillu (osobny temat dokumentacyjny).
- Zarzut 7 (dług Rust REPIN): PRZYJMUJĘ. Dług do rejestru: REPIN tabeli zamian „Łucznik → Procarz” (+ Procarz (Huaracoc) dla Inków) w rust-port, po wdrożeniu na ROBOCZĄ. rust-port NIETKNIĘTY (git diff: brak zmian). Uwaga: git grep po rust-port na wzorce „Zastąp/Zmiana na/REPLACE” nie zwrócił trafień, więc miejsce danych w Rust trzeba ustalić przy REPIN (temat R-RUSTPORT-REPIN-UNIT-REPLACE-Q1 z listy zadań jest już zakończony; sprawdzić, czy obejmował tabelę wpisów).

TABELA Z → NA (dane po zmianie, bez zmian w obroni r1; ZMIERZONO z units.json):
| Z | Na | Uwagi |
|---|---|---|
| Łucznik (Kamień, Distance, Standardowa) | Procarz (Brąz, Slinger, Standardowa); Procarz (Huaracoc) (Brąz, Slinger, Inkowie) | ZMIENIONE |
| Łucznik egipski / nubijski / sumeryjski / akadyjski / asyryjski | — | bez zmian (decyzja ABC otwarta, zarzut 4) |
| Procarz (Brąz) / Procarz (Huaracoc) | — | bez zmian (brak kierunku odwrotnego) |

TESTY (surowe wyniki z tej rundy):
- npm ci (gra/): added 71 packages, exit OK.
- npx tsc --noEmit → TSC=0.
- node tools/unit-replace-archer-slinger-test.cjs → 15 OK, 0 FAIL, exit 0 (kandydat).
- node tools/unit-replace-archer-slinger-test.cjs na danych bazy cb077b588 (mutacja units.json) → 9 OK, 6 FAIL, exit 1; plik units.json przywrócony z HEAD (git checkout).
- node tools/unit-replace-promotion-table-test.cjs → PASS: 24 wpisów źródłowych, 55 krawędzi, brak cykli, exit 0.
- node tools/unit-replace-test.cjs → exit 0 (ostatnie OK: „ctx z pustym empireResourceStock NIE odblokowuje Evocati”).
- node tools/unit-replace-army-multi-select-test.cjs → exit 0.
- node tools/unit-replace-full-cost-test.cjs → 39 passed, 1 failed, exit 1. FAIL: „performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa”. Test czyta źródło src/, a diff gra/src względem cb077b588 jest pusty, więc wynik jest taki sam jak na bazie z konstrukcji. NIE ZMIERZONO bezpośrednio na checkout bazy w tej rundzie. Dług bazowy, nie regresja tego tematu.
- node tools/ai-era-unit-promotion-test.cjs → 17 passed, 0 failed, exit 0.
- node tools/ai-unit-replace-same-rules-test.cjs → 45 passed, 0 failed, exit 0.
- Bramki referencyjne: logic-test → LOGIC OK (213/213), exit 0; tech-tree-test → 20 pass, 0 fail, exit 0; research-test → PASSED 33/33 ALL GREEN, exit 0; combat-test → 6/6 pass, exit 0; load-game-regression-test → 34 PASS / 0 FAIL, exit 0.
- git diff --check → czysto (brak wyjścia).
- Nie zmierzono: (d) picker UI Chromium; (c) ilościowy efekt AI; wpięcie testu do listy bramek.

BLOKADY: brak blokad technicznych tematu. Do decyzji ABC właściciela (nie blokują integracji, ale blokują PASS kryteriów (c) i (d) oraz zakres):
1. Inkowie: zostawić oba warianty Procarza (A) czy ukryć standardowego dla Inków (B, nowa reguła silnika).
2. Narodowi łucznicy (Egipt, Sumer, Asyria) → Procarz: tak/nie (zmiana danych, poszerzenie decyzji).
3. Pomiar wpływu AI (ile zamian na turę, limit 10% armii) przed deployem.
4. Zrzut pickera Chromium (kryterium d) — do zrobienia przed deployem albo jawnie odroczone przez właściciela.

RUNDY: 1/5 obrony (Operator Haiku 5.5 → Obrona Haiku 5.5). Kolejna runda Evaluatora po tym commicie.
NASTĘPNY KROK: Evaluator (Sonnet) — ponowna weryfikacja a546ca474 (testy 7–9, nagłówek) i odpowiedzi na zarzuty 1–7; następnie Final Control. Orkiestrator: pytania ABC 1–4 oraz wpis długu Rust (zarzut 7) do rejestru.
DEPLOY/PUSH: NIE WYKONANO
