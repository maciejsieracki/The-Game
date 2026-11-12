STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-REST-Q1
GOAL: obrona zarzutow z 02-evaluator.md (Evaluator r1): kazdy zarzut przyjety (poprawka + dowod + commit) albo odrzucony (dowod).
ZMIANY/COMMIT: kod obrony 344a195a6 (baza: feb5101f9 / raport e536a9ac0; galaz lokalna rust-port-wip/P6-POWER-REST-Q1; bez push, bez integracji). Allowlista: brake_power_rest.rs, p6_power_rest.rs, p6_power_rest_gen.mjs, p6_power_rest_vectors/vectors.json, 01-operator-r1.md, 02a-obrona.md. Cargo.lock nie commitowany (usuniety z worktree). Zadnych zmian w gra/, WERSJE.md, Cargo.toml, brake_power.rs, brake_power_producers.rs, territory.rs.
TESTY (po obronie, zreprodukowane lokalnie, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: EXIT 0, 48 passed
  - cargo test --test p6_power_rest: EXIT 0, 9 passed (4 z Operatora + 5 nowych: infra, tech, zdobycze, bitwy, detektor odwolan plik.ts:linia)
  - generator tests/p6_power_rest_gen.mjs na pinie 07d2fbd72 (WEB_ROOT = git archive pinu): EXIT 0; wartosci dominant i religia porownane z poprzednim plikiem (JSON.stringify): identyczne.
  - git diff --check: czysto.
  - Pin: wszystkie 18 cytowan plik:linia sprawdzone reczne na pinie 07d2fbd72 (sed -n <linia>p): identyfikator obecny w cytowanej linii (lista w odpowiedzi nizej).

ODPOWIEDZI NA ZARZUTY:

Z0 (gates odtworzone): POTWIERDZAM. Po zmianach gates ponownie EXIT 0 (liczby jak wyzej).

Z1 (istotny, niespojny prog "wykonalne": infra i tech): PRZYJMUJE. Poprawka 344a195a6.
  - Poprzednie ODRZUCENIE bylo bledne: zaleznosci domkniecia (cityBuilt, cities, isHuman, ownerResearchedTechs, aiResearchDone) sa DANYMI wejsciowymi, a cialo funkcji to suma / rozgalezienie.
  - Port: count_buildings_for_owner (main.ts:2629, suma blt.length po cityBuilt z dopasowaniem miasta id+owner) i count_tech_for_owner (main.ts:2638, galaz isHuman / aiResearchDone.get()?.size ?? 0). Dlugosc zbioru Set.size liczona przez set_size (unikaty).
  - Generator wykonuje oba wyciete cialo z main.ts z wolnymi zmiennymi jako parametrami; wektory: infra 60 (11 niezerowych), tech 60 (46 niezerowych, w tym duplikaty w listach).
  - Tabela: infra = RustProducer, tech = RustProducer.
  - Pozostale BRAK (bitwy, ulepszenia, zdobycze) maja osobne uzasadnienia. ULEPSZENIA ODRZUCAM jako "trywialna suma": countImprovementsForOwner (main.ts:2643) = unia dyskow promienia cityTerritoryRadius wokol wezlow statsTerritoryNodesForOwner (main.ts:5657), z improvementKeysForHex i hudPureScope (cache zakresu HUD). To geometria mapy + cache renderu, nie suma licznikow; port to osobny temat.

Z2 (sredni, czyste funkcje barbarianCapturedPowerGain i battlePowerPointsFromDefeatedEnemy): PRZYJMUJE. Poprawka 344a195a6.
  - barbarian_captured_power_gain (capital-capture.ts:438) i battle_power_points_from_defeated_enemy (power-objective.ts:103) portowane jako kroki czyste; wektory: zdobycze 40, bitwy 11, wygenerowane wykonaniem kodu z pinu (NaN/Infinity zakodowane jako napisy).
  - Akumulatory (zdobyczePowerByOwner, battlePowerPtsByOwner) i pelna moc ofiary zostaja po stronie wolajacego (W8 r4); w uzasadnieniach tabeli odwolania do tych krokow.
  - Klucze bitwy i zdobyczy pozostaja NoProducer, bo PELNY producent wymaga akumulatora i pelnej mocy ofiary (ponizej).

Z3 (sredni, wygraneBitwy: 0 jako literal): PRZYJMUJE z korekta numeru linii. Poprawka 344a195a6.
  - Literal jest w main.ts:2764 (nie 2762; linia 2762 to `jednostki`). Drugi literal: main.ts:2819. Trzeci: main.ts:19222 (wygraneBitwy: 0.5 w computePotegaComponents, poza sciezka computeObjectivePower).
  - Zastrzezenie do tezy: "zrodlem bitwy w EnemyMSum jest wylacznie bitwyPktSum" jest prawdziwe dla modelu enemy_m_sum. W modelu flat_count bitwyRaw bierze wygraneBitwy (power-objective.ts:231). Web nie zasila wygraneBitwy w sciezce main.ts:2764 (literal 0), wiec wolajacy musi brac wartosc zgodnie z modelem. To jest teraz zapisane w uzasadnieniu "bitwy" w tabeli.

Z4 (maly, dominant_religion nie asercjuje pola share): ODRZUCAM. Dowod:
  - Pole share jest w wyniku web DominantReligionResult (culture-religion.ts:645-649), ale Rust DominantReligion (territory.rs:466) ma tylko religion i status. Dodanie pola wymagaloby zmiany territory.rs, poza allowlista (ZAKAZ: istniejace pliki domain/ poza mod.rs).
  - Producent religia (count_cities_with_dominant_state_religion) konsumuje wylacznie .religion; share nie jest czescia kontraktu producenta. Test dominant asercjuje religion i status, czyli pola, ktore Rust wystawia i ktore sa wejsciem producenta.
  - Wektory nadal zawieraja share z wykonania weba (expect.share), a nieuzywane pole nie jest asercjowane celowo.

Z5 (maly, test tabeli nie sprawdza istnienia odwolan plik:linia): PRZYJMUJE czesciowo. Poprawka 344a195a6.
  - Test rest_table_covers_six_components_with_explicit_sources wymaga odwolania plik.ts:<linia> w KAZDYM uzasadnieniu (takze producenci), przez has_pin_file_line_ref. Test pin_file_line_ref_detector_rejects_plain_text chroni sam detektor.
  - Jednorazowa weryfikacja pinu (nie automatyczna): 18 cytowan sprawdzonych na pinie 07d2fbd72. Identyfikator obecny w linii: battlePowerPtsByOwner (2254), battlePowerPointsFromDefeatedEnemy (34490), bitwyPktSum (2763), wygraneBitwy (2764), countBuildingsForOwner (2629), countTechForOwner (2638), countImprovementsForOwner (2643), statsTerritoryNodesForOwner (5657), barbarianCapturedPowerGain (35673), zdobyczePowerByOwner (35675), countCitiesWithDominantStateReligion (2773 i culture-religion.ts:1383), dominantReligion (culture-religion.ts:698), leadingReligion (culture-religion.ts:673), barbarianCapturedPowerGain (capital-capture.ts:438), battlePowerPointsFromDefeatedEnemy (power-objective.ts:103), armyFieldPower (unit-power.ts:182), sumRosterFieldM (auto-battle-power.ts:50).
  - NIE_ZMIERZONO: automatyczna ochrona przed dryfem pinu (generator sprawdzajacy linie z tabeli) nie zostala dodana; wymagalaby pinu w CI. Ryzyko dryfu pozostaje, jesli pin sie zmieni.

Z6 (maly, nota: raport podaje ~130 LOC, realnie 104; baza 94cba6667 zamiast origin/rust-port/parity-v2): LOC PRZYJMUJE, baza ODRZUCAM.
  - LOC: korekta w 01-operator-r1.md (104 LOC w feb5101f9; po obronie brake_power_rest.rs ma 181 LOC).
  - Baza: dispatch wprost wskazuje 94cba6667 (czubek BATCH5-tip) jako baze. Zadanie wymaga "f207ea6b1 lub nowszy". Sprawdzone: git merge-base --is-ancestor f207ea6b1 94cba6667 = OK, czyli 94cba6667 spelnia warunek. Brak wplywu na wynik.

Z7 (info, brak cichych zer po stronie wolajacego): ODRZUCAM jako poza zakresem tego tematu. Dispatch przypisuje jawnosc skladnikow (Provided / ExplicitZero / Missing) do POWER-NOZEROS (#34). Ten temat dostarcza tabele zrodel i wektory; modul dokumentuje, ze wolajacy podaje 3 pozostale BRAK jawnie.

NOTY POZA ZARZUTAMI (zglaszane przez obrone):
  - vectors.json ma 6757 linii (format indent 1, 60+60+60+60+40+11 przypadkow). Przekracza zasade "Pliki <= 600 LOC" z dispatchu. To wygenerowany plik danych, nie kod; nie zmieniano formatu, zeby zachowac czytelny diff. Do decyzji orkiestratora (ewentualnie kompaktowy zapis JSON).
  - NIE_ZMIERZONO: semantyka wywolan w grze (runtime) nadal nie zmierzona; testy sprawdzaja funkcje czyste i ich wektory.

BLOKADY:
  1. Bitwy, ulepszenia, zdobycze pozostaja NoProducer (z uzasadnieniami w tabeli). Wolajacy W8 r4 musi podac je jawnie w ObjectivePowerRaw razem z wejsciami religii, infra i tech.
  2. Pelny producent bitwy i zdobyczy wymaga portu armyFieldPower / sumRosterFieldM oraz akumulatorow zdarzen (osobny temat).
  3. Ulepszenia wymagaja portu geometrii terytorium i cache HUD (osobny temat).
  4. Cargo.lock nie commitowany.

RUNDY: 2/5 (Operator, obrona r1)
NASTEPNY KROK: Evaluator r2 (Sonnet) na commicie 344a195a6: weryfikacja nowych wektorow infra/tech/zdobycze/bitwy oraz nowej tabeli; decyzja, czy NoProducer dla ulepszen zostaje w tym temacie.
DEPLOY/PUSH: NIE WYKONANO (commity lokalne, bez push, bez integracji, bez zmian w rust-port/parity-v2, gra/, origin/main).
