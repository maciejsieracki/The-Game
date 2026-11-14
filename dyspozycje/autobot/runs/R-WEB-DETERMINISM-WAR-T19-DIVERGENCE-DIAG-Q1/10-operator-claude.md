STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza, bez zmian logiki gry)
TEMAT: R-WEB-DETERMINISM-WAR-T19-DIVERGENCE-DIAG-Q1
GOAL: znaleźć źródło niedeterminizmu przebiegu wojny gracz↔AI (rozjazd digestu od tury 19/20) i rozstrzygnąć: (a) realny defekt silnika → minimalna poprawka, albo (b) artefakt harnessu → udokumentować.

## Wynik w jednym zdaniu
Rozjazd NIE jest błędem logiki gry. Jedyną różnicą między dwoma przebiegami tego samego ziarna jest tekstowy identyfikator `stackGroupId` budowany z `Date.now()` (src/game/armyMerge.ts:75), który trafia do digestu `__detHarness` (i do zapisu). Przy zamrożonym zegarze przebiegi są identyczne w 22/22 turach dla obu ziaren. Stan gry (jednostki, miasta, dyplomacja, AI, gracze, zapis) pozostaje identyczny do T21, poza tym jednym polem i `meta.savedAt`.

## Odtworzenie (dowód kroku 1)
Baza: `git checkout --detach 3cc205e4a` (HEAD = 3cc205e4a, potwierdzone). `npm ci` w gra/ (tylko instalacja zależności, bez build/dev w repo). Bundle vite zbudowany poza repo: `--outDir <scratchpad>/bundle`.
Runner: `gra/tools/determinism-war-t19-diag-dump.cjs` (kopia runnera B1 z trzema dodatkami diagnostycznymi: `DUMP_DIR` zrzut `__detHarness.full()` per tura, `SNAP=1` zrzut `__detHarness.snapshotJson()`, `FIXED_NOW=1` addInitScript zamrażający `Date.now`). Konfiguracja jak w B1 r3: `NOTRACE=1`, `civTest=1`, tryb przyspieszony, realne `declareWar`, dosypki NNS, odrzucanie ofert wg runnera.
Pliki narzędzi (NIE zacommitowane, zgodnie z dispatchem tylko raport w commicie): `gra/tools/determinism-war-t19-diag-dump.cjs`, `gra/tools/determinism-war-t19-diag-cmp.cjs` (porównanie JSON po ścieżkach).

Potwierdzenie rozjazdu (przebiegi z tego samego buildu i ziarna):
- Referencja z r3 (bez haka, 2 przebiegi na ziarno, już w repo): 271828 a/b rozjeżdżają się w T19 (`332f1308` vs `4562e87e`); 314159 a/b w T20 (`1a95355` vs `e4a53a60`). Zgodnie z dispatchem: T18 identyczne.
- Moje przebiegi zrzutów pełnych (units/cities, 271828 A vs B): T2–T18 identyczne; T19 różnią się tylko `units[3].stackGroupId` i `units[11].stackGroupId` (`"sg1_mwg46wha_1"` vs `"sg1_mwg48m5j_1"`); T20–T22 ta sama klasa różnicy.
- Pełny zapis (`buildSaveGameSnapshot`, 271828 A vs B, T2–T21): jedyne różnice to `stackGroupId` (ten sam przedrostek `sg1_`, inny znacznik czasu base36 i ten sam sufiks sekwencji `_1`) oraz `meta.savedAt`. Brak różnic w `diploRelations`, `gracze`, `tradeRoutes`, `cityProd`, `aiResearchDone`, `units` poza ID, `cities`.
- Pełny zapis, 314159 A vs B: T2, T10, T19 bez różnic w stackGroupId; T20 i T21 po dwa pola `stackGroupId`; po odfiltrowaniu `stackGroupId` i `savedAt` nic nie zostaje.

## Kontrola: zamrożony zegar (test hipotezy)
`FIXED_NOW=1` (Date.now = stała w przeglądarce, tylko pomiar):
- 271828, przebieg A vs B: 22/22 digestów identycznych (T1–T22).
- 314159, przebieg A vs B: 22/22 digestów identycznych.
- Zamrożony przebieg 271828 ma inne wartości digestu niż bez zamrożenia, co jest zgodne z tym, że ID zawierają czas. Przy zamrożeniu nie ma już rozjazdu.

## Tabela hipotez
| Hipoteza (z dispatchu / raportu) | Werdykt | Dowód |
|---|---|---|
| Zależność od czasu rzeczywistego w ID jednostek (`Date.now`) wpływająca na digest | PRZYCZYNA (źródło digestu) | armyMerge.ts:75 `'sg'+ownerId+'_'+Date.now().toString(36)+'_'+seq`; diff tylko w tym polu; zamrożony zegar → 22/22 |
| Rozjazd stanu gry (zachowanie) od `stackGroupId` | ODRZUCONE | wszystkie użycia w src to porównania równości (`stackGroupIdOf(a)===stackGroupIdOf(b)`, map-attack-city.ts:60/95, main.ts:34843, armyMerge.ts:67); brak sortowania/localeCompare po ID (grep); pełny zapis identyczny poza ID do T21 |
| Math.random w ścieżce walki (combat.ts:890, siege.ts:659 fallback `opts.rng ?? Math.random`) | ODRZUCONE dla tego scenariusza (NIE_ZMIERZONO, czy w 22 turach zaszła walka z fallbackiem) | przebiegi z zamrożonym `Date.now` (`Math.random` pozostał realny) są identyczne w 22/22 turach, więc losowość z fallbacku nie zmieniła stanu w tych przebiegach. Wywołania: battleScene.ts:20838 i manualBattle.ts:1062 nie zweryfikowane, czy przekazują `rng` |
| Timery EOT / asynchroniczne endTurn | ODRZUCONE | zamrożenie `Date.now` nie zmienia przebiegu; stan identyczny do T21 poza ID; runner czeka na `turn>t && !isEndTurnInProgress` |
| Tryb przyspieszony jako przyczyna | ODRZUCONE jako przyczyna rozjazdu (NIE_ZMIERZONO kontrola bez trybu) | rozjazd zależy od wartości czasu w ID, nie od trybu; kontrola z `setFastMode(false)` nie wykonana (koszt czasu: tryb normalny z animacjami; uznane za zbędne po wykazaniu mechanizmu) |
| Wygasanie ofert NEGOTIATION_EXPIRY_TURNS=5, cooldowny, zmęczenie 0,95/1,0, progi desperacji 90/100% | ODRZUCONE dla rozjazdu | stan dyplomacji w pełnym zapisie identyczny w T19–T21; progi są deterministyczne (brak czasu/random w ścieżce) |
| Dosypki NNS / odrzucanie ofert przez runner | ODRZUCONE jako przyczyna | identyczne w obu przebiegach (ta sama sekwencja), rozjazd dotyczy tylko ID |
| `cities.ts:89` `budowa-lista-${Date.now()}` | NIE_ZMIERZONO w tym scenariuszu | nie pojawiło się w różnicach zrzutów T2–T22; nie sprawdzono, czy szablony list budowy powstają w tym scenariuszu ani czy są w zapisie |
| `save.ts:1091-1107` `zapis-${Date.now()}` | nie dotyczy digestu | etykiety slotów zapisu, poza stanem gry |

## Pierwszy rozbieżny podsystem i pole
Podsystem: jednostki (armia AI, właściciel ownerId=1). Pole: `units[*].stackGroupId`, tworzone w T18→T19 przez scalanie (`assignSharedStackGroupId`, armyMerge.ts:79–87, wywoływane przy merge; także setup.ts:151). Pierwsza różnica to stackGroupId w T19 dla seed 271828 i w T20 dla 314159, zgodnie z r3. Podsystemy diplomacy/AI/economy/RNG cursor: bez różnicy do T21 w pełnym zapisie.

## Pliki i ślady
- Zrzuty (duże, poza repo, w scratchpad): `snapA/`, `snapB/`, `s2A/`, `s2B/`, `dumpA/`, `dumpB/`, `fixA-*.json`, `fixB-*.json`.
- Uruchomienia (liczba i wynik): 271828 zrzuty A/B (22 tury, digest rozjazd T19), 271828 snap A/B (21 tur), 314159 snap A/B (21 tur), 271828 zamrożone A/B (22 tury, 22/22), 314159 zamrożone A/B (22 tury, 22/22). Łącznie 8 przebiegów, 2 ziarna (wymóg ≥4 przebiegi, ≥2 ziarna spełniony).

## Minimalna poprawka (1–3 zdania, NIE wdrożona tutaj)
Opcja (b) po stronie harnessu, bez zmiany gry: w `__detHarness.digest` pominąć wartość `stackGroupId` (normalizacja `sg\d+_[0-9a-z]+_`), co przywraca porównywalność przebiegów przy tym samym ziarnie. Opcja (a) po stronie gry: zastąpić `Date.now()` w `freshStackGroupId` deterministycznym składnikiem (np. licznik zapisany w zapisie), co wymaga decyzji o formacie zapisu i zachowaniu unikalności po wczytaniu (NIE_ZMIERZONO, czy `stackGroupSeq` jest odtwarzany przy wczytaniu zapisu). Test regresji do osobnego tematu: dwa przebiegi z `FIXED_NOW=1` muszą dać identyczne digesty przez 22 tury (oba ziarna).

## Pozostałe ustalenia (uwagi dla orkiestratora)
- `cities.ts:89` (`budowa-lista-${Date.now()}`) ma ten sam wzorzec; warto objąć go tym samym testem regresji.
- Dług: `stackGroupSeq` jest modułowym licznikiem (armyMerge.ts:70); jego zachowanie po wczytaniu zapisu NIE_ZMIERZONO.
- `gra/node_modules` zainstalowany w worktree (npm ci) do uruchomień; do sprzątania przez orkiestratora.

## TESTY
- Bramki repo: `git diff --check` do wykonania przy commicie (raport jest jedynym plikiem commitu).
- Przebiegi harnessu: 8 uruchomień wyżej; wyniki z surowego wyjścia runnera (`stoppedBy=koniec zakresu`, 21–22 tury każdy) i z porównań JSON (cmp.js).
- NIE_ZMIERZONO: kontrola bez trybu przyspieszonego (`setFastMode(false)`), pełne sprawdzenie, czy w 22 turach zaszły walki używające fallbacku `Math.random`.

## BLOKADY
Brak blokad technicznych. Ograniczenia pomiaru: digest obejmuje units/cities; pełny zapis obejmuje resztę stanu, ale nie kolejki negocjacji w pamięci (NIE_ZMIERZONO, czy są w zapisie).

## RUNDY
1/5 (ta runda; werdykt diagnostyczny, bez poprawki kodu gry).

## NASTĘPNY KROK
Orkiestrator decyduje: (1) temat harnessu R-WEB-DETERMINISM-DIGEST-STACKGROUP-NORMALIZE-Q1 (normalizacja w `__detHarness.digest`, opcja b) i test regresji z `FIXED_NOW`; (2) ewentualnie osobna decyzja właściciela o deterministycznych ID stosów (opcja a, zmiana formatu zapisu).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie na origin/main); odczytany stamtąd.
- Brak wywołań tworzących sesje/zadania/cykle (zakaz zachowany).

DEPLOY/PUSH: NIE WYKONANO
