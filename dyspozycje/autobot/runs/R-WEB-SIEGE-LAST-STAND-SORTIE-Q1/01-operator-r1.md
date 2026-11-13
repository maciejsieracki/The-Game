STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-LAST-STAND-SORTIE-Q1
GOAL: oblegana armia sterowana automatycznie (AI, barbarzyńcy) w ostatniej turze przed kapitulacją wychodzi i atakuje oblegających, gdy jej siła >= 80% siły oblegających (10:8); inaczej zostaje w oblężeniu.

## POMIAR PRZED (gra/src/main.ts, baza origin/main 319a84052)
- Kapitulacja: `handleSiegeCapitulationPhase` (main.ts ~16159): zapasy <= 0 => `city.siegeCapitulationPending = true`; następny tick ekonomii (pętla `econ.perCity`, ~35968) wywołuje `resolveSiegeSurrender` (przejęcie przez oblegającego). Pole jest w City (cities.ts:899), więc jest zapisywane w save.
- Kolejność w przejściu tury: tick ekonomii (~35930) biegnie PRZED fazą AI (`runAiPhase` ~37404) i barbarzyńców (~40100). Faza, w której flaga jest już true, jest zatem dokładnie ostatnią turą.
- Zachowanie dziś: AI/barbarzyńcy nie wydają żadnej komendy ataku z obleganego miasta (brak kodu wypadu; grep). Oblegana armia czeka do kapitulacji. Wypady PRZED we wszystkich scenariuszach = 0 (tabela niżej: PRZED = brak mechanizmu).
- Istniejąca ocena siły: `siegeAi.estimateUnitCombatStrength` (Atak + Obrona + 0,5 Pancerz + 0,5 weaponDamage + 0,25 Uderzenie, skala HP/30) przez `runtimeUnitToSiegeUnit`; reużyta bez zmian.

## ZAŁOŻENIA (bez pytań ABC)
1. `isLastTurnBeforeCapitulation` = `oblegane && siegeCapitulationPending`.
2. Siła obleganych = suma siły wojskowych jednostek właściciela na heksie miasta (także nieruchomych). Mury i wirtualna Milicja NIE wchodzą do siły (wypad walczy w polu, Milicja nie wychodzi). Pola siły: Atak, Obrona, Pancerz, weaponDamage, Uderzenie, HP; liczba jednostek wynika z sumy; epoka/typ pośrednio ze statystyk jednostek.
3. Siła oblegających = wojskowe jednostki oblegającego w odległości 1 od miasta.
4. Próg: siła_obleganych*10 >= siła_oblegających*8 (dokładnie 80% atakuje, 79% nie; silniejsza atakuje; epsilon 1e-9).
5. Wypad = jedna komenda `attack` (kotwica: pierwsza ruchoma jednostka wg id; cel: oblegający o największym skupisku wokół, remis po id). Wykonuje ją istniejąca ścieżka ataku AI/barbarzyńców (wojna, widoczność, bitwa z graczem, zwykłe zasady walki i roster promienia 1). Nie wychodzą: ruchLeft<=0, sentry, ufortyfikowana w polu, zaokrętowana, oblegająca. Cywile nie liczą się do siły.
6. Gracz (człowiek) wykluczony (`isHuman`); brak nowego UI. Blokada rekrutacji/posiłków nietknięta.

## ZMIANY / COMMIT
- NOWE gra/src/game/siege-last-stand.ts (czyste: `isLastTurnBeforeCapitulation`, `shouldLastStandSortie`, `planLastStandSortie`, `canUnitSortie`).
- gra/src/main.ts (+32 linie): import, `lastStandSortieCmdsForOwner`, doklejenie komend po `decideAITurn` i po `decideBarbarianMoves` (tylko wykonanie wypadu). ai.ts, barbarians.ts, city-siege-state.ts nietknięte (niepotrzebne).
- NOWY gra/tools/siege-last-stand-sortie-test.cjs; logi gate-*.txt w katalogu runu.
- SHA: patrz niżej (uzupełniony po commicie).

## TESTY
- RED (moduł nieobecny): gate-red.txt EXIT=1. GREEN: gate-green.txt 53 OK / 0 FAIL, EXIT=0 (granica 80%/79%, silniejsza, nie-ostatnia tura, słabsza w ostatniej, brak oblężenia, bez ruchu/sentry/fortyfikacja/zaokrętowana, cywil, determinizm, wojna, wybór celu, JSON round-trip, strukturalna main.ts: AI + barbarzyńcy, wykluczenie gracza, wspólna funkcja siły).
- Tabela PRZED/PO (oblegający:oblężeni; ostatnia / nie-ostatnia tura): 10:5 zostaje/zostaje; 10:8 WYPAD/zostaje; 10:9 WYPAD/zostaje; 10:12 WYPAD/zostaje. PRZED: 0 wypadów wszędzie. Wynik samej bitwy: NIE_ZMIERZONO (zwykła walka silnika; bez uruchomienia gry w przeglądarce).
- 10 mutacji modułu: wszystkie wywracają testy.
- tsc --noEmit: gate-tsc.txt EXIT=0.
- Regresje (--no-live) PRZED vs PO identyczne: siege-ai 17, oblezenie 27, oblezenie-remis-endsiege, oblezenie-siege-lifted-po-bitwie, map-siege 6, siege-defenders 12, city-siege-wall-rules 50, barbarians-test, city-militia-no-defenders 110, militia-garrison-contract 17, siege-blockade-no-recruit-reinforce 48, ai-siege-requires-war 50, law-garrison, war-allin-capital-test: wszystkie EXIT=0, 0 FAIL.

## BLOKADY / UWAGI
- ai-home-defense-vs-barbarians-test.cjs: 3 FAIL (T2, T4, T5) — test importuje tylko ai.ts, którego nie zmieniłem; błąd niezależny od tematu (PRZED na czystym origin/main formalnie NIE_ZMIERZONO).
- Brak weryfikacji w przeglądarce (temat logiczny, bez zmian wizualnych); żywy przebieg całej tury z wypadem NIE_ZMIERZONO.
- Dla REPIN Rust (oblężenie/AI): reguła i próg opisane wyżej; stan potrzebny = istniejące pole siegeCapitulationPending.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (runda 1)
DEPLOY/PUSH: NIE WYKONANO
