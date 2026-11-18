STATUS: PASS-WITH-NOTES (obrona Operatora, runda 1/5; werdykt końcowy należy do Final Control)
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-UI-DIPLO-WEARINESS-PEACE-EXPLAIN-Q1
GOAL: wyjaśnienia skali zmęczenia/desperacji/pokoju wymuszonego w panelu audiencji i w Civpedii, bez zmiany reguł i progów.
ZMIANY-COMMIT: baza 99724ec705d636fd21d71f905b671df878859f77 (przodek: TAK). Kandydat wyjściowy e8998c3528c8f938eece935dafe69c16b49dafad. Commit obrony: patrz SHA końcowy w polu sha (commit na gałęzi autobot/R-WEB-UI-DIPLO-WEARINESS-PEACE-EXPLAIN-Q1-obrona). Allowlista: gra/src/game/diplomacy-display.ts, gra/src/ui/diplomacyAudience.ts, gra/tools/diplo-weariness-explain-test.cjs, gra/src/data/wikiBundle.json (regenerowany skryptem gra/tools/bundle-wiki-for-game.cjs, nie ręcznie), docs/encyklopedia/pojecia/zmeczenie-wojna.md, raport 30-obrona-claude.md. Reguły, progi i diplomacy-locks/proposals/AcceptanceBalance/main.ts nietknięte.

ODPOWIEDZI NA ZARZUTY:
1. Dowód live (Chromium + zrzut): NIE ZMIERZONO w tej rundzie. Przeglądarka /usr/bin/chromium istnieje, ale zbudowanie gry i doprowadzenie do wojny z zmęczeniem w przeglądarce nie zostało wykonane. Wpięcie tooltipu i wiersza potwierdzone czytaniem kodu (diplomacyAudience.ts, warWearinessRowHtml). Dług do decyzji FC (domknięcie live albo jawne zaakceptowanie).
2. Wiersz „Pokój wymuszony za ≈N tur”: PRZYJMUJĘ. Dodany widoczny wiersz class="da-rel-row war-weariness-forced" pod zmęczeniem (diplomacyAudience.ts) z wartością z nowej funkcji warWearinessForcedRowPl (diplomacy-display.ts). Przy 100% wartość „już trwa (100%)”. Liczba z pelneTur i progWymuszonyPokoj (war-weariness-params.json). Założenie „stałe tempo, bez zmiany miast” jest w wartości tooltipu.
3. Słabość testu: PRZYJMUJĘ. Test: E3 liczy 100/pelneTur (2,5% z parametrów), E6 liczy tury z (0,5 − poziom) × pelneTur; E10 sprawdza bramki ofertaOdTurWojny (3) i ofertaBezStratOdTur (6) z JSON; E12 nowy: sprawdza hasło Civpedia (skala, progi 50/80/100%, „Nie wymusza pokoju”); E13 i E13b: wiersz pokoju wymuszonego; E11 rozszerzone o klucze JSON. Brak asercji na sztywno w liczbach z parametrów.
4. Drobne: PRZYJMUJĘ część (bramki tur desperacji dodane do tooltipu: „nie wcześniej niż po 3 turach wojny, a bez utraty miast po 6”). ODRZUCAM dublowanie progów: zdanie „Od 50%…” to proza skali, a „Etapy: …” to pełna lista panelu, celowo zostawione. ODRZUCAM zarzut o natywnym title na dotyku: ten sam mechanizm (atrybut title) używają istniejące tooltipy panelu w bazie (warWearinessRowHtml przed zmianą), temat go nie wprowadza.
5. Ryzyko integracji wikiBundle: PRZYJMUJĘ jako uwagę dla orkiestratora. Bundle regenerowany skryptem po ostatniej zmianie Civpedii. Przy integracji z DIPLO-4/DIPLO-5 regenerować bundle na końcu, nie scalać ręcznie.

TESTY (surowe wyniki, worktree na commicie obrony, gra/node_modules z innego worktree przez symlink tylko do odczytu):
- tsc --noEmit: exit 0
- diplo-weariness-explain-test (rozszerzony): 14 pass / 0 fail
- mutacja: plik diplomacy-display.ts z bazy 99724ec70 podstawiony za kopią. Test kończy się wyjątkiem (brak eksportu warWearinessForcedRowPl), exit != 0. Detekcja potwierdzona, ale nie przez asercje semantyczne. Plik przywrócony z kopii, potem 14/0.
- diplo-weariness-display-test: PASSED 54/0
- diplo-weariness-stages-view-test: 22/0
- diplo-trust-war-n6-cleanup-test: 17/0
- diplo-civpedia-values-test: 129 sprawdzeń PASS
- polish-language-audit-q1-guard-test: 7497 ok / 0 fail
- civpedia-oslabienie-docs-guard-test: 7 PASS / 0 FAIL
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6
- Chromium + zrzut: NIE ZMIERZONO (patrz zarzut 1)

BLOKADY: brak techniczna. Dowód live (zarzut 1) otwarty.
RUNDY: 1/5 (obrona). NASTĘPNY KROK: Evaluator (rewalidacja zarzutów 1–5 z dowodami) albo Final Control.
UWAGI-DLA-ORKIESTRATORA: wiersz pokoju wymuszonego dodaje nowy element DOM w panelu audiencji, więc screenshot Chromium powinien pokazać go w pełnej grze (zarzut 1). Przy integracji regenerować wikiBundle na końcu.
DEPLOY/PUSH: NIE WYKONANO
