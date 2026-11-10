STATUS: PASS-WITH-NOTES (Operator, runda 1/5, obrona po zarzutach 1-8; wymaga Evaluatora)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-KODU-A-Q1
GOAL: Status z dowodem na pinie edb8fb56 dla AUDYT-KODU #2, #4, #20, #31, #48, #49, #53, #59, #60, #62 oraz WERYFIKACJA-53 (6 pokrywających się, oznaczone [=KODU]).
ZMIANY-COMMIT: `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`, §11 przepisany w miejscu. `git diff`: 32 insertions, 0 deletions, więc §1-§10 bez zmian. Brak commita, brak zmian w `gra/`. `01-operator.md` nietknięty.
TESTY: nie uruchomiono (zakaz w temacie). Dowody wyłącznie przez `git show` / `git grep` na edb8fb56.
BLOKADY: nierozstrzygnięte 5 pozycji: #4 (decyzja balansowa: −10%/turę przy racji 0), #31 (`buildAllowed` dla targowiska, ścieżka jednostek), #48 (ranking HUD), #53 (podpunkt wpisu stale, odczyty `unitDefFor`), #59 (floor/round, Mennica).
RUNDY: 1/5 (obrona w tej samej rundzie).
Liczniki: AUDYT-KODU NAPRAWIONY 4 (#2, #20, #49, #60), NADAL ISTNIEJE 1 (#62), NIEROZSTRZYGNIONY 5. WERYFIKACJA-53 [=KODU]: NAPRAWIONY 3 (#2, #20, #49), NIEROZSTRZYGNIONY 3 (#31, #48, #53). Temat nie jest domknięty.
NASTĘPNY KROK: Evaluator weryfikuje §11 wobec pinu.
DEPLOY/PUSH: NIE WYKONANO

OBRONA:
1 -> PRZYJMUJE. Koszt racji przy poziomie 0 wynosi 0 (`population-growth-v85.ts:27` WYZYWIENIE_MIN=0, `:205–213`). `bilansLokalny = brutto − koszt` (`turn-economy.ts:1656`), deficyt z bilansu (`empire-food.ts:233–234`, `:252`). #4 = NIEROZSTRZYGNIONY. Korekta: „immunitet" nie jest dosłowny, bo `WYZYWIENIE_GROWTH_PCT[0] = -10` (`population-growth-v85.ts:53–54`, zużycie `:255`).
2 -> PRZYJMUJE (dowód negatywny był błędny). `buildingLevelForEpoch(` ma 4 wywołania w main.ts: `:7166` (era = empireEpochForOwner(ownerId)), `:15269` i `:15347` (epoch = ctx.epoch = empireEpochForOwner(city.ownerId), `:15231`), `:32369` (`:32371`). Wszystkie z epoką właściciela. #49 NAPRAWIONY na dowodzie dodatnim.
3 -> PRZYJMUJE. #59 = NIEROZSTRZYGNIONY. Lokalizacja audytu `economy.ts:921` liczy pieniadzZPracy z praca przed karą (`:1005–1006`). Poprawka po karze jest w realnym ticku (`turn-economy.ts:2717–2721`). Punkt (b) floor/round nieadresowany.
4 -> PRZYJMUJE. `ai.ts:717–724` to scoring badań. Emisja: kandydaci `'mury'` w `ai.ts:1746`, `:1786`, komendy z buildingId w `ai.ts:3238`, `:4077`. `buildAllowed` dla targowiska nieczytane, więc #31 = NIEROZSTRZYGNIONY (częściowy).
5 -> PRZYJMUJE. Podpunkt „wpis nigdy nie usuwany" = NIEROZSTRZYGNIONY (częściowy). Klucz `'militia-'+city.id` (`siegeDefenders.ts:131`) jest jeden na miasto i nadpisywany przy każdej rejestracji (`mapFieldBattle.ts:326–331`, `main.ts:28531`). Pełnego sprawdzenia odczytów `unitDefFor` (`main.ts:27020`) nie wykonano.
6 -> PRZYJMUJE. Liczniki przeliczone (patrz wyżej). Wniosku „SPEŁNIONE" dla domknięcia nie ma. Kryterium „zero pozycji bez statusu" jest spełnione, bo każda z 10 pozycji ma status z dowodem.
7 -> PRZYJMUJE. §11 skrócony do ok. 560 słów: tabela z plik:linia, liczniki i ograniczenia. Dalsze skracanie bez utraty plik:linia nie jest możliwe.
8 -> PRZYJMUJE. Dokładne linie: #20 `diplomacy-acceptance-points.ts:303` (nie ~300); #49 `main.ts:32401/:32412` (nie ~32395–32409); #60 funkcja `checkVillageRewardAt`, `main.ts:25797`, wywołanie `:25859`; #4 `empire-food.ts:233–234, :252` (nie :~1038); #31 `main.ts:35120` (nie ~35120).
