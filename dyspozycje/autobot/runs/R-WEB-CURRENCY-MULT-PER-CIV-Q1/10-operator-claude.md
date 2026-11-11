STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-CURRENCY-MULT-PER-CIV-Q1
GOAL: mnożnik Efektu 1 (Waluta+Mennica) per cywilizacja z civ-matrix (meta_mnoznik_waluta) + korekta trudności ±0,5, dolny limit 1,38 (decyzja D), bez górnego; wiki == silnik.
ZMIANY/COMMIT: baza origin/main a8b063989. Pliki (allowlista wyliczona przed edycją):
- gra/src/game/economy.ts: EconParams += `trudnosc?`, `mennicaMnoznikPoWalucieMinimum?`; nowa `mennicaMnoznikForCiv(civKey, params)` = max(minimum, mnoznikHandelPieniadzForCivByDifficulty(...)); cityYieldPerTurn używa jej zamiast globalnej stałej (jedno miejsce dla gracza/AI/podglądu; bramka Mennica+Waluta bez zmian). Fallback globalny `mennica_mnoznik_po_walucie`, gdy civ nieznana / params bez trudności.
- gra/src/game/turn-economy.ts (buildEconParams): te same dwa pola.
- gra/data/econ-params.json: nowy klucz globalne.mennica_mnoznik_po_walucie_minimum = 1,38 (easy/normal/hard; wartość = dawne .hard, nie wpisana na sztywno w kod).
- gra/src/ui/cityPanel.ts: tekst panelu miasta pokazuje wartość per civ (ta sama funkcja).
- docs/encyklopedia/cywilizacje/{celtowie,chinczycy,egipt,germanie,grecy,inkowie,rzymianie,sumer,zulusi}.md + gra/tools/gen-cyw-encyklopedia.py: hasło = wartość NORMAL z macierzy + zdanie o korekcie trudności i minimum 1,38. Edycja ręczna: generator .py jest nieaktualny względem plików (po uruchomieniu cofa inne treści), więc NIE uruchamiany na docs; zaktualizowany tylko jego szablon.
- docs/PORADNIK-GRACZA/08-ekonomia-imperium.md §49.3b: nieaktualna tabela ×2,0/×1,5/×1,0 zastąpiona opisem per civ.
- gra/src/data/wikiBundle.json: regeneracja `node tools/bundle-wiki-for-game.cjs` (22 rozdz. + 174 hasła).
- gra/tools/currency-mult-per-civ-test.cjs (NOWY); gra/tools/civ-matrix-meta-roster-wiring-test.cjs (test używał nieistniejącego ctx.walutaMnoznikOverride i był czerwony przed zmianą 62/1; teraz używa city.civKey, 63/0).
SHA: patrz commit z tym raportem (pole sha w odpowiedzi).

TABELA 15 cywilizacji x 3 trudności (wynik = max(1,38; matrix + delta); dotąd globalnie 1,62/1,50/1,38):
civ          easy  normal  hard
grecy        2.8   2.3     1.8
rzymianie    2.5   2.0     1.5
chinczycy    2.9   2.4     1.9
inkowie      2.4   1.9     1.4
zulusi       2.3   1.8     1.38 (limit)
egipt        2.6   2.1     1.6
sumer        2.7   2.2     1.7
celtowie     2.4   1.9     1.4
germanie     2.2   1.7     1.38 (limit)
harappa      2.9   2.4     1.9
hetyci       2.5   2.0     1.5
slowianie    2.3   1.8     1.38 (limit)
babilonia    2.8   2.3     1.8
asyria       2.2   1.7     1.38 (limit)
fenicjanie   3.1   2.6     2.1
(Fenicjanie easy 3,1 i inne >2,5 zostają, decyzja D; bez górnego limitu.)

TESTY (surowe wyjścia):
- tsc --noEmit: 0 błędów.
- NOWY currency-mult-per-civ-test: 164 passed, 0 failed (15x3 tabela, loadEconParams == buildEconParams, dolny limit 4 civ na hard, Fenicjanie easy 3,1, fallback, realny podatek cityYieldPerTurn dla grecy/zulusi/fenicjanie/germanie x 3 trudności, bramka AND, parytet ownerId 0 vs 3, wiki source+bundle == silnik normal oraz opis trudności/minimum).
- MUTACJA (powrót do params.mennicaMnoznikPoWalucie w economy.ts): 154 passed, 10 failed (czerwony); po przywróceniu 164/0.
- Bramki: logic 213/213, tech-tree 20/0, research ALL GREEN, unit-replace 21/21, combat OK.
- Ekonomia: waluta-mennica 61/0, currency 37/0, plony-budynkow 68/0, trade-routes-income 134/0, wire-ekonomia 37/0, civ-bonusy 56/0, hud-skarbiec 34/0, empire-skarbiec-bilans 11/0, empire-skarbiec-panel-coverage 12/12, ai-purchase-maintenance-reserve 56/0, upkeep-difficulty-per-owner 19/0, converters 49/0, praca-pula-rate-parity 20/0, pr141-f04-work-activation PASS, civ-matrix-meta-roster-wiring 63/0, civ-matrix-semantic-labels 490/0.
- ids-leak-audit 1648 ok/0 FAIL; wonder-text-no-raw-ids 132 ok/0 FAIL; pr141-matrix-only-data-wiki PASS.
- Czerwone PRE-ISTNIEJĄCO (te same wyniki na gołym origin/main, nie regresja): mennica-magazyn-test 34/7 (oczekuje starych easy=2/hard=1), pr141-matrix-only-economy-test (AssertionError "poison civ multiplier"), culture-religion-test 63/2 (B9 cityTradeMultiplier; kod nietknięty). Nie ruszane (poza zakresem).
- NIE_ZMIERZONO: build vite i weryfikacja wizualna w przeglądarce (zakaz npm run build; zmiana tylko tekstu w panelu miasta).
BLOKADY: brak. Uwaga balansowa dla FC/właściciela: na easy/normal podatek z Mennicą rośnie (np. Grecy normal ×2,3 zamiast ×1,5; Fenicjanie easy ×3,1) — skutek decyzji D (bez górnego limitu); wpływ na balans nie zmierzony.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator -> Final Control (ancestry względem origin/main, git diff --stat, powtórne bundle-wiki bez diffu).
DEPLOY/PUSH: NIE WYKONANO
DŁUG RUST (REPIN, tylko opis; rust-port nietknięty): podatek Efektu 1 per civ = max(econ-params globalne.mennica_mnoznik_po_walucie_minimum, civ-matrix meta_mnoznik_waluta + {easy +0,5, normal 0, hard -0,5}); fallback global gdy brak civ; nowy klucz econ-params; zmienione hasła Civpedii.
