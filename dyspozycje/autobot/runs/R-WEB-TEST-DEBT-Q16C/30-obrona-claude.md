STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (pomiar, zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q16C (obrona rundy 3, Operator SONNET)
GOAL: odpowiedź na zarzut nr 1 Evaluatora: pytanie B zmierzyć na maksimum i na ziarnach 11 i 7, albo odrzucić z dowodem.

ODPOWIEDŹ NA ZARZUTY
- Zarzut nr 1 (pytanie B nie zmierzone na maksimum ani na ziarnach 11 i 7): PRZYJMUJĘ. Pomiar wykonany: nowa gra z parametrami MAX (Trudny, dyplomacja trudna, kultura trudny, Koszty jednostek wysoki x4, mapa Bardzo ogromny = Super Huge), ziarna 11 i 7, pasywny gracz do t19, plus wariant racja 0 od t17 (ziarno 11). Wynik: skok −108 z sandboxu NIE odtworzono na maksimum. Szczegóły i ograniczenia w DLUG-TESTOWY-Q16C-2026-11-28.md, sekcja „Pytanie B na maksimum (obrona r3)”.
- Dodatkowe ustalenie (nie był zarzutem): wniosek „zamierzone (−133/turę)” z sandboxu nie jest potwierdzony na maksimum. Dokument zmieniono: status pytania B to „sandbox-only, nie potwierdzone na maksimum”.
- Brak rozbicia kosztArmii per jednostka: NIE ZMIERZONO (zaznaczone w dokumencie, bez zmiany wniosku).

ZMIANY-COMMIT
- gra/tools/tdq16c-pytb-max.cjs (nowy, tylko odczyt i ustawienia testowe przez istniejące haki civTest; bez zmian gra/src)
- dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md (status pytania B zmieniony, nowa sekcja maksimum)
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/30-obrona-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/70-pytb-max-s11-sweep.txt, 71-pytb-max-s7-sweep.txt, 72-pytb-max-s11-racja0.txt (surowe wyjścia)
- Commit: patrz pole sha w odpowiedzi strukturalnej.

TESTY (surowe wyniki z plików w runs/)
- Seed 11, sweep, MAX, t1–t19: RESULT ok true, PAGEERRORS 0 (70). Spichlerz: po t15 = 15 (obecny 14), po t16 = 0 (obecny 15), po t17 = 17 (obecny 16), po t18 = 18 (obecny 17). Racja 0/1/6/12 w t15: po 31/23/0/0; w t16: po 16/8/−16/−16. Blokada tury t19: skarbiec (zabraknie 12 złota), nie spichlerz.
- Seed 7, sweep, MAX (71): identyczne liczby jak seed 11 w całym przebiegu.
- Seed 11, racja 0 trwale od t17, MAX (72): po t17 = 17, po t18 = 18, t19 blokada od skarbca. Brak skoku −108.
- Bramki tsc / logic-test / ai-test: NIE URUCHOMIONO w tej rundzie. Zmiana to nowy plik narzędzia w gra/tools, poza gra/src; gra/src nie zmieniono (git diff gra/src gra/data = 0).

BLOKADY
- Maksimum mapy: w pierwszej próbie Super Huge nie ładował świata (brak miasta). Po dodaniu kroku foundFirstCity (wzorzec z grace15fx-active3-live.cjs) ładuje się. Brak niezależnej weryfikacji, że to pełne maksimum wszystkich suwaków.
- Maksimum niejednoznaczne: uznano za maksimum wartości z MAX_PARAMS (istniejące narzędzie max-measure) oraz kosztJednostekPace = wysoki. Koszty budynków zostały na niski, wysoki NIE zmierzono.
- Scenariusz różni się od sandboxu: 1 miasto, 2 jednostki (sandbox: 3), racja auto = true (sandbox: ręczna), inna mapa. Wynik nie jest bezpośrednim odpowiednikiem pomiaru z sandboxu.
- Identyczne liczby dla ziaren 11 i 7: ziarno jest wpięte (params.seed > 0), przyczyna nie zbadana.
- Pytanie B pozostaje otwarte jako „sandbox-only”. Nie jest dowodem defektu ani zamierzonego zachowania na maksimum.

RUNDY
- Runda obrony 3 (Operator SONNET). Bez kolejnych rund.

NASTĘPNY KROK
- Orkiestrator: decyzja o pytaniu B po pomiarze na maksimum. Do rozważenia: powtórzenie na ziarnie 7 z innym scenariuszem (ręczna racja, auto false, 3 jednostki), jeśli właściciel chce pełnego odpowiednika sandboxu. Oddzielnie: FC ma ocenić, czy identyczność ziaren 11 i 7 wymaga osobnego tematu.
- UWAGI-DLA-ORKIESTRATORA: brak nowych znalezisk poza zakresem.

DEPLOY/PUSH: NIE WYKONANO
