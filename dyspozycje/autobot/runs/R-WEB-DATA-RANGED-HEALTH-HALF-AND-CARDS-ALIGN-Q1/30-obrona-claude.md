# R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1 — raport Obrony Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1
GOAL: zdrowie dystansowych x0,5, Zulu/Estólica atak 5, karty = silnik, łańcuch „Zastąp” (Estólica → tylko Łucznik). Obrona: odpowiedź na zarzuty Evaluatora (ac479b609, 20-evaluator-claude.md).
BAZA: cc3c80b171b9c625f1060ea4e316dbefa061a832 (origin/main). KANDYDAT Operatora: fb17e765a06f7f2ba02fd046bce5775a97142279. POPRAWKA Obrony: ad372cdb6 (na fb17e765a).

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — cache fieldPower oszczepników: PRZYJMUJĘ
- Dowód rozjazdu (zgodny z pomiarem Evaluatora): Oszczepnik health 8, cache 12 (stary wzór: 16/2 = 8 zdrowia w mocy), `fieldPower()` = 8. Zulu health 10, cache 16, `fieldPower()` = 11,5. Estólica health 10, cache 12, `fieldPower()` = 9,5.
- Powód techniczny: `armyFieldPower` (src/game/unit-power.ts, ok. l.186–195) zwraca cache, gdy `rangedDamageMultFor(u) === 1`. Oszczepnicy mają mnożnik 1, więc czytają zawyżony cache. Odświeżenie 8 łuczników/procarzy zrobiono wcześniej; te trzy były niespójne.
- Poprawka (commit ad372cdb6, gra/data/units.json, tylko pola `fieldPower`, 3 linie):
  - Oszczepnik (l.202): 12 → 8
  - Oszczepnik Zulu (Izijula) (l.1296): 16 → 11.5
  - Oszczepnik (Estólica) (l.1661): 12 → 9.5
  - Pola `health` i `missileAttack` nie zmieniono (potwierdzone przed edycją: 8/4, 10/5, 10/5).
- Zakres: `fieldPower` nie było w wprost wymienionej allowlistcie. Przyjmuję to jako pochodną cache dla tych samych trzech jednostek, które zmieniły health i atak. Bez tego karta i AI nie zgadzałyby się z silnikiem. Odnotowuję to jako odstępstwo od allowlisty.
- Test `gra/tools/ranged-damage-mult-test.cjs`: stara asercja „armyFieldPower Oszczepnik (cache 12) bez zmian” utrwalała stan niespójny (porównanie cache z samym sobą). Zastąpiona asercjami wartości 8 / 11,5 / 9,5 oraz asercjami „cache == fieldPower().total” dla tych trzech jednostek. Zmiana w tym samym commicie ad372cdb6.

### Zarzut 2 — brak pomiaru Chromium i pomiaru „przed” (skutek balansowy): PRZYJMUJĘ JAKO NIE_ZMIERZONO
- Chromium (karta Łucznika, Estólicy, Drużynnika): NIE ZMIERZONO. W tym runie nie uruchomiono przeglądarki (xvfb). Dispatch dopuszcza NIE_ZMIERZONO (d).
- Pomiar skutku (e) 10 vs 10 Łucznik vs Wojownik, tryb „pewne”: NIE ZMIERZONO jako miara skutku zdrowia x0,5. Evaluator słusznie wskazał, że `hit-mode-archers-vs-warrior-sim.cjs` daje identyczny wynik przed i po (wynik bazy: „lucznicy wygrywaja 100% | wojownicy 0%”). Symulacja nie czyta zmienionego `health`, więc nie jest dowodem skutku. Nie korygowałem balansu (zakaz z dispatchu).
- Pozostaje do decyzji właściciela (obserwacja (iii) z dispatchu).

## Sprawdzenie innych punktów zarzutów Evaluatora
- Allowlista danych poza `fieldPower`: zgodna (potwierdzone przez Evaluatora dyffem, nie kwestionuję).
- Brak osłabienia testów: nie kwestionuję (Evaluator przeczytał pełny diff 7 testów).
- Mutacje Evaluatora (health Łucznika 20, cofnięcie wyjątku AI dla Estólicy): nie kwestionuję.

## TESTY (surowe wyjście po poprawce ad372cdb6, katalog gra/)
- `npx tsc --noEmit`: exit 0
- logic-test: exit 0, „LOGIC OK (213/213)”
- tech-tree-test: exit 0, „tech-tree-test: 20 pass, 0 fail”
- research-test: exit 0, „ALL GREEN”
- unit-replace-test: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”
- combat-test: exit 0, „All sanity checks passed.”
- ranged-health-card-align-test: exit 0, „ALL GREEN”
- unit-card-ranged-mult-test: exit 0
- unit-replace-archer-slinger-test: exit 0, „51 OK, 0 FAIL”
- unit-replace-promotion-table-test: exit 0, „PASS: 32 wpisów źródłowych, 63 krawędzi, brak cykli”
- ai-era-unit-promotion-test: exit 0, „17 passed, 0 failed”
- archers-health-dist-data-test: exit 0, „ALL GREEN”
- units-health-single-field-test: exit 0, „WYNIK: ZIELONO”
- unit-power-test: exit 0, „6 pass, 0 fail”
- ranged-damage-mult-test: exit 0, „WSZYSTKIE PASS” (w tym 6 nowych asercji dla oszczepników)
- Uwaga: unit-replace-full-cost-test pozostaje czerwony 39/1 jak na bazie cc3c80b (dług bazowy, wg Evaluatora; nie uruchamiałem ponownie).
- `npm ci` w gra/ wykonane (exit 0) — brak node_modules w worktree.

## Zmiany testów z dispatchu (kryterium b) — wypisane już w 10-operator-claude.md, bez zmian w tej rundzie poza ranged-damage-mult-test.cjs (stara 12 → 8 dla Oszczepnika).

## ZMIANY-COMMIT
- ad372cdb6: gra/data/units.json (3 pola fieldPower), gra/tools/ranged-damage-mult-test.cjs (asercje).
- Ten raport: dyspozycje/autobot/runs/R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1/30-obrona-claude.md.

## BLOKADY
- Chromium: NIE ZMIERZONO (karty).
- Skutek balansowy zdrowia x0,5: NIE ZMIERZONO (symulacja nie czyta health).
- fieldPower poza wymienioną allowlistą: odstępstwo przyjęte, opisane powyżej.

## RUNDY
1/5 (Obrona r1). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, 2 zarzuty.

## UWAGI-DLA-ORKIESTRATORA
- Rozjazd `fieldPower` dla Oszczepnika, Zulu i Estólicy był w bazie tylko częściowo odświeżony. Stan po ad372cdb6 jest spójny dla wszystkich jednostek z mnożnikiem 1 przy `health`/`missileAttack` z tabeli.
- Dług bazowy, poza zakresem: cache fieldPower dla Taran/Taran okuty/Katapulta/Wieża oblężnicza (wg Evaluatora armyFieldPower=0 dla oblężniczych). Osobny temat.
- Dług Rust: REPIN units.json (health, missileAttack, Atak dystansowy, Zasięg, Zastąp Estólicy, fieldPower) i tabeli zamian.
- Do decyzji właściciela (ABC, nie zmieniane przeze mnie): przejścia łańcucha, w których cel ma mniej zdrowia niż źródło (Łucznik 10 → Procarz 8; Estólica 10 → Procarz 8 — w wariancie A Estólica idzie tylko do Łucznika, więc to dotyczy Łucznika), obserwacja (iii) dispatchu.

NASTĘPNY KROK: Final Control (Evaluator/FC na ad372cdb6 + raport 30). Bez integracji i deployu.
DEPLOY/PUSH: NIE WYKONANO
