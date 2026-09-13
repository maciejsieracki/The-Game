STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
GOAL: niezależnie zweryfikować implementację wspólnej listy miast/cywilizacji, dane, call-site’y, testy i gotowość do integracji.
ZMIANY/COMMIT: Final Control nie zmienił produktu, nie wykonał commit/push/PR/merge/deploy. HEAD: 172d2ed9a67817ed8e67b580c85f6b1bb2f1ab5b. Readback diffu obejmuje wyłącznie allowlistę danych, city-names-pool.ts, civ-names.ts, jedną zmianę komentarza w main.ts, ukierunkowane testy oraz artefakty runu.
TESTY: niezależnie uruchomiono `npm run typecheck` (PASS); `city-names-pool-test.cjs` (125 passed, 0 failed); `city-names-pools-test.cjs` (9/0); `civ-names-test.cjs` (7/0); `nazwy-miast-rozlaczne-pule-test.cjs` (9/0); `mapa-etykieta-stolicy-test.cjs` (47/0); `display-names-test.cjs` (27/0); `logic-test.cjs` (213/213); `tech-tree-test.cjs` (19/0); `research-test.cjs` (33/0); `unit-replace-test.cjs` (13/13); `combat-test.cjs` (all sanity checks passed). `start-preview-test.cjs`: 3 passed, 3 failures dotyczących istniejącego baseline’u balansu/mapy (12 rywali, 12 typów, 11 obcych typów); ścieżka nazwy stolicy/suffixu przechodzi. Pełny `cluster-start-test.cjs` pozostaje timeoutem 420 s z istniejącymi placement/hub-chain failures; nie jest przedstawiany jako PASS. Raport obrony zawiera osobny name-contract smoke 2/2 (`Xi'an`/`Xi'an`).
BLOKADY: brak blokady kontraktu nazw. Pełny cluster-start ma odseparowany baseline placement/hub-chain timeout; Chromium render test jest poza zakresem i oznaczony INFRA. To są noty, nie produktowy FAIL tej zmiany.
RUNDY: Final Control, runda produktowa 3/5; bieżący run 37.
NASTĘPNY KROK: INTEGRATION_REQUIRED — Orchestrator może zintegrować zweryfikowany diff; dopiero po osobnej autoryzacji ewentualny deploy/push.
DEPLOY/PUSH: NIE WYKONANO

ROUTING RECEIPT — wymaganie karty vs faktyczny argv bieżącego workera:
- model: gpt-5.6-luna → gpt-5.6-luna
- provider: openai-codex → openai-codex
- reasoning_effort: max → `--reasoning max`
- service_tier: priority (Fast) → `--service-tier priority`
- readback procesu: `/proc/2389170/cmdline`, command query: `work kanban task t_02234a0f`

READBACK DANYCH — wszystkie 15 cywilizacji:
- 15 kluczy puli i 15 unikalnych `ikonaId`; zestawy kluczy są równe.
- każda `miasta_cywilizacji` ma 110 wpisów: prefix 100 + suffix 10.
- puste wpisy: 0; duplikaty we wspólnej sekwencji: 0; kolizje kapitał–suffix państw-miast w obrębie i między cywilizacjami: 0.
- `civs.json.nazwyMiast` jest dokładnym lustrem puli dla 15/15.
- niezależne porównanie z HEAD: dla każdej puli bieżąca sekwencja = bazowe `miasta_cywilizacji` + bazowe `miasta_panstwa`; nie wykryto niezamierzonego dryfu pozostałych pól cywilizacji.
- pierwsze miasta: Grecy `Ateny`, Rzymianie `Rzym`, Chińczycy `Xi'an`, Inkowie `Cusco`, Zulusi `uMgungundlovu`, Egipt `Memfis`, Sumer `Uruk`, Celtowie `Bibracte`, Germanie `Mattium`, Harappa `Harappa`, Hetyci `Hattusa`, Słowianie `Kijów`, Babilonia `Babilon`, Asyria `Aszur`, Fenicjanie `Byblos`.
- Asyria `Assur` → `Aszur` jest jawnie oznaczoną normalizacją transliteracji; evidence nie deklaruje tu literalnego zachowania (`preserved_all_original_names=false`), a `Ninive` pozostało na dalszej pozycji.
- niezależne pole danych `miasta_panstwa` nie występuje w żadnym wpisie puli, a `nazwyKlastra` nie występuje w żadnym obiekcie cywilizacji. W żywym kodzie nie ma odczytów `.nazwyKlastra`; jedyny `.miasta_panstwa` w `e-start-params-loader.ts` dotyczy liczbowego parametru skali mapy, nie puli nazw.

READBACK ŻYWEGO KODU:
- `loader.ts:19,32,389-421` ładuje jedno źródło `city-names-pools.json` i przekazuje je w `GameData`.
- `city-names-pool.ts` dzieli wspólną tablicę stałymi 100/110; stolice czytają indeks 0, zwykłe founding używa prefixu bez indeksu 0, a państwa-miasta używają suffixu od indeksu 100.
- `clusterRivalFromPool` ma overflow z `common.slice(1, 100)`, więc nie może zwrócić zastrzeżonej stolicy także powyżej 10 rywali; test `rivalIndex=11` zwraca `Sparta`, nie `Ateny`.
- `civ-names.ts:61-115` i `city-names-pool.ts:93-163` zachowują parytet stolicy gracza/AI; fallback bez puli czyta to samo `nazwyMiast`.
- `cluster-spawn.ts:117,227,354-358`, `main.ts:7640,8315-8319,8650-8658,8905-8909,13116-13122` przekazują i konsumują wspólny kontrakt. `main.ts` ma w tym diffie wyłącznie korektę komentarza.

DOWÓD MUTACYJNY:
- zapisane evidence z obrony zawiera rzeczywiste mutacje na tymczasowych kopiach poza repozytorium: `CITY_NAMES_POOL_REGULAR_LEN + index → index`, rc=1, 121 passed/2 failed; `regular.slice(1) → regular`, rc=1, 122 passed/1 failed; cleanup complete.
- bieżąca bramka także czerwieniłaby usunięcie guardu: 125/0 obejmuje asercje suffixu indeksu 0, overflow indeksu 11 i pierwszego founding po indeksie 0.

SHA-256 readback:
- gra/data/city-names-pools.json: 876ed2c964303580804d970378bca2c6c6712c6bcc493a54657771f6926645f2
- gra/data/civs.json: 6215661f0eb00e7a4df837d8284f285ec472b61a3bf6647d9dc7aecb998464f5
- gra/src/game/city-names-pool.ts: 83a014ccda00ac5298f2d958dfdb1081c6b93450a5d03759f161860cebbb42ff
- gra/src/game/civ-names.ts: b9680efb7eae9d25d0e5f649ab768a1bdf55da0b2d6691c8f7610be0044126b0
