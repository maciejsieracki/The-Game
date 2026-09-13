STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
GOAL: Jedna wspólna lista nazw per cywilizacja, z zastrzeżonym indeksem 0 i suffixem państw-miast.
ZMIANY/COMMIT: working tree na HEAD 172d2ed9a67817ed8e67b580c85f6b1bb2f1ab5b; bez commit/push/PR/merge/deploy
TESTY: npm run typecheck PASS; focused name gates 125/0, 9/0, 7/0, 47/0, 9/0; pełne wyniki w 01-evidence.json
BLOKADY: brak dla kontraktu nazw; baseline start-preview 3/3 pozostaje poza zakresem; pełny cluster-start-test TIMEOUT, ale kontrakt nazw ma osobny smoke-test 2/2; test Chromium INFRA poza zakresem
RUNDY: 1/5; PASS-WITH-NOTES z rozdzieleniem baseline
NASTĘPNY KROK: Evaluator — niezależny readback diffu, danych, call-site’ów i testów
DEPLOY/PUSH: NIE WYKONANO

Routing receipt (requested → actual card readback):
- model: gpt-5.6-luna → gpt-5.6-luna
- provider: openai-codex → openai-codex
- reasoning_effort: high → high
- service_tier: priority (Fast) → priority (Fast)

Kontrakt danych — przed/po:
| cywilizacja | przed cyw | przed państwa | przed wspólna | po prefix | po suffix | po wspólna | stolica (idx) | dołączone na końcu |
|---|---:|---:|---|---:|---:|---:|---|---|
| grecy | 100 | 10 | none (two fields) | 100 | 10 | 110 | Ateny (0) | Sykion; Fliunt; Trojzena; Hermione; Tespie; Egina; Olint; Potidaja; Amfipolis; Maroneja |
| rzymianie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Rzym (0) | Nola; Ardea; Lanuvium; Aricia; Norba; Signia; Sutrium; Falerii; Cosa; Venusia |
| chinczycy | 100 | 10 | none (two fields) | 100 | 10 | 110 | Xi'an (0) | Qin; Qi; Chu; Jin; Yan; Zhao; Wei; Han; Lu; Song |
| inkowie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Cusco (0) | Maras; Yucay; Calca; Q'enqo; Pumpu; Caranqui; Limatambo; Tambomachay; Puka Pukara; Huchuy Qosqo |
| zulusi | 100 | 10 | none (two fields) | 100 | 10 | 110 | uMgungundlovu (0) | esiPhezi; kwaGqikazi; kwaKhangela; eBaqulusini; kwaHlomendlini; emThonjaneni; esiKhwebezi; kwaNdwandwe; kwaMthethwa; eMlambongwenya |
| egipt | 100 | 10 | none (two fields) | 100 | 10 | 110 | Memfis (0) | Tinis; Nagada; Akoris; Hebenu; Tebtynis; Tjebu; Terenuthis; Pitom; Sile; Aphroditopolis |
| sumer | 100 | 10 | none (two fields) | 100 | 10 | 110 | Uruk (0) | Hamazi; Simurrum; Karahar; Szaszrum; Urua; Kimasz; Diniktum; Kisiga; Zimudar; Hursagkalama |
| celtowie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Bibracte (0) | Titelberg; Donnersberg; Dünsberg; Glauberg; Kelheim; Segeda; Uxama; Třísov; Hrazany; Staré Hradisko |
| germanie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Mattium (0) | Eketorp; Ismantorp; Paviken; Zeijen; Hjemsted; Drengsted; Sejlflod; Vallhagar; Avaldsnes; Nørre Snede |
| harappa | 100 | 10 | none (two fields) | 100 | 10 | 110 | Harappa (0) | Shortugai; Khirsara; Kanmer; Shikarpur; Siswal; Loteshwar; Malvan; Bhagatrav; Juni Kuran; Kotada Bhadli |
| hetyci | 100 | 10 | none (two fields) | 100 | 10 | 110 | Hattusa (0) | Kussara; Arinna; Samuha; Hakmis; Katapa; Ankuwa; Durmitta; Amurru; Nuhasse; Astata |
| slowianie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Kijów (0) | Radogoszcz; Brenna; Uznam; Dymin; Wołogoszcz; Budziszyn; Niemcza; Kruszwica; Czermno; Bełz |
| babilonia | 100 | 10 | none (two fields) | 100 | 10 | 110 | Babilon (0) | Bit-Jakin; Bit-Dakkuri; Bit-Amukani; Bit-Szilani; Bit-Sa'alli; Gambulu; Puqudu; Kisik; Zabban; Nemed-Laguda |
| asyria | 100 | 10 | none (two fields) | 100 | 10 | 110 | Aszur (0) | Ekallatum; Apku; Kurbail; Talmusu; Isana; Kahat; Nasibina; Amedi; Rasappa; Sinabu |
| fenicjanie | 100 | 10 | none (two fields) | 100 | 10 | 110 | Byblos (0) | Iol; Siga; Cornus; Othoca; Tipasa; Meninx; Gigthis; Toscanos; Monte Sirai; Umm el-Amed |

Wynik audytu wszystkich 15:
- puste wpisy: 0 w każdej liście; duplikaty: 0; kolizja stolica–państwo-miasto: 0; lustro `civs.json.nazwyMiast` = `city-names-pools.json.miasta_cywilizacji`; 14/15 list zachowało literalne nazwy, a jedyna różnica `Assur` → `Aszur` w Asyrii jest świadomą normalizacją transliteracji opisaną w `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/00-dispatch.md:49-54,62-67` oraz ratyfikowaną w `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/00-dispatch.md:178-184`.
- Żywy kod: stolica gracza i AI czytają `miasta_cywilizacji[0]`; zwykłe founding bierze prefix `[1..99]` po zarezerwowaniu indeksu 0; państwo-miasto czyta suffix `[100..109]`; fallback bez puli używa lustra `nazwyMiast`.
- Test mutacyjny indeksu 0: `stateCityName(..., 0)` zwraca suffix[0], a `pickNextRegularCityName(..., new Set())` pomija stolicę. Uzupełnione wyniki mutacji (na kopii bramki w wariancie evaluator, przed dodaniem dwóch asercji overflow): `CITY_NAMES_POOL_REGULAR_LEN + index` → `index`: `rc=1`, `121 passed, 2 failed`; `regular.slice(1)` → `regular`: `rc=1`, `122 passed, 1 failed`; oba warianty uruchomiono na tymczasowych kopiach poza repozytorium i wyczyszczono.

Uzupełnienie obrony: naprawiono overflow `clusterRivalFromPool`, aby indeks 0 prefixu nie był używany dla rywala poza suffixem; regresja `clusterRivalCityName(..., 11, pools)` przechodzi i zwraca `Sparta`, nie `Ateny`. `cluster-start-test.cjs` korzysta ze wspólnego źródła `city-names-pools.json`; chińska stolica i etykieta są porównywane do `miasta_cywilizacji[0]` (`Xi'an`), a osobny smoke-test zwrócił `2 passed, 0 failed`.

Hashe SHA-256 artefaktów:
- gra/data/city-names-pools.json: 876ed2c964303580804d970378bca2c6c6712c6bcc493a54657771f6926645f2
- gra/data/civs.json: 6215661f0eb00e7a4df837d8284f285ec472b61a3bf6647d9dc7aecb998464f5
- gra/src/game/city-names-pool.ts: 83a014ccda00ac5298f2d958dfdb1081c6b93450a5d03759f161860cebbb42ff
- gra/src/game/civ-names.ts: b9680efb7eae9d25d0e5f649ab768a1bdf55da0b2d6691c8f7610be0044126b0
