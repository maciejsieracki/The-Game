# R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1 — raport Operatora (runda 1/5, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; tylko narzędzie i raport; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1
GOAL: zmierzyć w Node zmęczenie wojną (40 tur) i pokój wymuszony przy 100% (FALA 783) — eliminacje, snowball, pętle wojen, pokoje przy cenie 0 / 1 mieście / remisie, czas tury — porównując z proxy PRZED (pelneTur 20, bez pokoju wymuszonego); ≥3 ziarna × 150 tur × ≥4 cywilizacje AI.
WERDYKT (pomiar): RYZYKO na jednym punkcie (pokój wymuszony bez zapłaty, gdy przegrywający ma ≤3 miasta — patrz §3); brak eliminacji i snowballa w PO; pętli wojen nie da się zmierzyć w tym modelu (NIE ZMIERZONO, patrz §5).
BAZA: origin/main 64069b1a2 (FALA 783, ROBOCZA MD5 53a9463a). Dispatch i DODATEK czytane z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (w origin/main ich nie ma).

## 0. Runda 1/5 — WZNOWIENIE (Operator Haiku, 2026-11-17; baza = 035f313c2, wykonana praca poprzedniego Operatora)

Wykonane kroki z DODATKU 1:
- (1) Weryfikacja narzędzia i liczb: smoke `node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both` → exit 0, 5,6 s (limit 60 s). Pełny przebieg `--turns 150 --seeds 3 --variant both` (K=3) → exit 0, 19,7 s; wynik porównany z `raw-K3-N3-T150.jsonl` po usunięciu pola `avgTurnMs`: `cmp` IDENTYCZNY (12 wierszy = 12 wierszy). Wnioski z raw K=6 i K=3 zweryfikowane skryptowo (liczby w §4 poniżej są zgodne z raw).
- Środowisko: `gra/node_modules` nie istniało w worktree; esbuild@0.28.2 i three@^0.169.0 (zgodnie z gra/package.json) zainstalowane poza repo i podpięte symlinkiem; symlink nie jest w commicie (untracked, sprzątanie orkiestratora).
- (3) Werdykt RYZYKO §3 zweryfikowany w kodzie: `gra/src/game/war-weariness.ts:302-311` — `cityCap = battlePending ? 0 : max(0, ownCities − minMiastPoOddaniu)`, a warunek oddania miast to `clearLoser && price.requiredPn > 0 && cityCap > 0`; komentarz `war-weariness.ts:265` i `gra/data/war-weariness-params.json` (`_opis`, `_progi`) twierdzą, że pokój wymuszony jest ZAWSZE płatny miastami. Stan faktyczny: przy cityCap = 0 pokój wymuszony zapada bez miast. Liczby z raw (potwierdzone): K=3 PO — 17 wymuszonych pokojów (ziarno 1: 6, ziarno 2: 11, ziarno 3: 0), wszystkie przy 0 miastach; K=6 PO — 2 wymuszone (ziarno 1: 1, ziarno 2: 1), oba przy 0 miastach. PRZED: 0 wymuszonych (parametr 2,0 wyłącza). Warianty A/B do decyzji właściciela — bez zmian kodu.
- (4) Smoke-test do listy deployu: NIE ZNALEZIONO w repo pliku „listy deployu” obejmującego narzędzia `gra/tools` (przeszukano `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`, `docs/`, `dyspozycje/*.md`, `.cursor/rules/`, `finalize`/`deploy` w ls-files). Smoke zapisany w tym raporcie jako wymagany wpis do dopisania przez orkiestratora: `cd gra && node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both` (exit 0, ok. 6 s, wymaga gra/node_modules z esbuild i three).
- (2) Luki: ograniczenia modelu i „PRZED” = proxy parametrowe (nie bit-w-bit 774fd0eec), pętle wojen i czas tury AI — patrz §5–§6 poniżej; czas tury w §2e to pomiar silnika zastępczego, NIE realnej tury gry.
- Kontrola zakresu: zmiany tylko w `gra/tools/weary40-sim-measure.cjs` (już w bazie) i w `runs/R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1/`; zero zmian w `gra/src` i `gra/data`.

STATUS r1-wznowienie: PASS-WITH-NOTES (narzędzie deterministyczne, liczby potwierdzone; werdykt RYZYKO wymaga decyzji właściciela).

## 0b. Weryfikacja Operatora r1b (DODATEK 2, baza bbaa74fd8; bez pełnych przebiegów)

- Smoke `node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both` → exit 0, 5,9 s (limit 60 s). Do uruchomienia dołączono `gra/node_modules` jako dowiązanie symboliczne do esbuild/three zainstalowanych poza repo (katalog scratchpad); dowiązanie nie jest częścią commita.
- Sprawdzenie raw (skryptem na surowych wierszach JSONL, nie z pamięci): liczby wojen startowych (31 w K=3 i K=6), zakończonych pokojem PO/PRZED (31/23 K=3; 31/30 K=6), trwających na t150 (PO 0; PRZED 8 K=3, 1 K=6), eliminacji (PO 0; PRZED 2 K=3, 1 K=6), wymuszonych (PO 17 K=3, 2 K=6; PRZED 0), ofert <80% i ≥80%, miast oddanych (PO 0 K=3, 10 K=6), max udziału (PO 0,25 K=3 / 0,30 K=6; PRZED 0,40 / 0,25) i cen zerowych (PO 14 K=3 / 19 K=6, wszystkie przy remisie i 0 miastach, PRZED 23 / 23) — zgodne z tabelami §2a–§2c.
- Korekta: wymuszony pokój w turze 32 (K=3, ziarno 2) — dopisana w §2a/§3 (wcześniej napisano „wszystkie w turze 40").
- ZWERYFIKOWANO w r1c (zarzut 1 Evaluatora): raw nie miał pola czasu wojny, więc narzędzie dostało pole `warTurns` przy każdym zdarzeniu pokoju oraz `avgWarTurns`/`maxWarTurns` w podsumowaniu (definicja: tura pokoju − tura startu wojny; wojny startowe = tura 1). Po ponownym przebiegu: K=3 PO 30,77/39, PRZED 10,43/27; K=6 PO 20,16/39, PRZED 10,30/33 — zgodne z tabelami §2a/§2b. Czas tury z §2e: NIE porównywano ręcznie z tabelą (raw zawiera tylko avgTurnMs; §2e to zakresy z tego samego raw).
- Smoke-test z §0 wpisywany do listy deployu: nadal NIE ZNALEZIONO pliku listy w repo (bez zmian).

## 1. Co zrobiono

- Dodano `gra/tools/weary40-sim-measure.cjs` (jedyna zmiana w repo; allowlista `gra/tools/**`).
- Prawdziwe elementy gry: `decideAITurn` (ai.ts) przez silnik `tools/ai-war-defend-home-sim.cjs`; `runWarWearinessTick`, `warWearinessLevel`, `wearinessForcedPeaceDue` z `gra/src/game/war-weariness.ts` (bundle esbuild z gra/src); parametry `gra/data/war-weariness-params.json` (pelneTur 40, progWymuszonyPokoj 1,0).
- Model uproszczony (NIE gra): mapa 64×36, 3 (lub 6) miasta i 6 jednostek na cywilizację, uproszczona walka z silnika zastępczego, sila militarna = liczba żywych jednostek, cena pokoju = 100·(udział zwycięzcy − 0,5)·2 PW (0 przy remisie), miasto = 15 PW, bez ekonomii, mgły, dyplomacji gracza i deklaracji wojen (wszystkie pary startują w wojnie w turze 1).
- PRZED (proxy): te same funkcje z parametrami pelneTur 20 i progWymuszonyPokoj 2,0 (wyłączony). Uwaga: to NIE jest bit-w-bit commit 774fd0eec (tam kodu pokoju wymuszonego nie było); to parametrowe przybliżenie, jak dopuszcza dispatch.
- Smoke: `node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both` — 5,7 s, exit 0.
- Pełny przebieg deterministyczny: dwa uruchomienia dają identyczne wyniki poza polami czasu (sprawdzone cmp bez avgTurnMs).
- Zapis surowych wyników: `dyspozycje/autobot/runs/R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1/raw-K3-N3-T150.jsonl` (domyślnie 3 miasta na cywilizację) i `raw-K6-N3-T150.jsonl` (wariant stresowy, 6 miast).

Polecenia z gra/ (bez Chromium, bez `npm run build/dev`):
- `node tools/weary40-sim-measure.cjs --turns 150 --seeds 3 --variant both` (K=3)
- `node tools/weary40-sim-measure.cjs --turns 150 --seeds 3 --variant both --cities 6` (K=6)
- czas: ok. 20 s na przebieg 150×3×2; ok. 3–5 s na ziarno przy 30 turach.

## 2. Wyniki (liczby z surowego wyjścia, 3 ziarna: ziarno 1 = 5 cywilizacji, 2 = 6, 3 = 4)

### 2a. Wariant domyślny K=3 (3 miasta na cywilizację, jak w ai-war-defend-home-measure)

| Wariant | Wojny startowe | Zakończone pokojem | Oferta <80% | Oferta ≥80% | Pokój wymuszony 100% | Trwające na t150 | Miasta oddane pokojem | Eliminacje | Snowball max udział (t50/t100/t150, max po ziarnach) | Śr. czas wojny (tury) / max |
|---|---|---|---|---|---|---|---|---|---|---|
| PO (kod gry) | 31 | 31 | 13 | 1 | 17 | 0 | 0 | 0 | 0,25 / 0,25 / 0,25 | 30,8 / 39 |
| PRZED (proxy) | 31 | 23 | 21 | 2 | 0 | 8 | 0 | 2 (ziarna 1 i 2) | 0,40 / 0,40 / 0,40 (max) | 10,4 / 27 |

Szczegóły PO wg ziarna (zakończone pokojem / wymuszone):
- ziarno 1 (n=5): 10 / 6; ziarno 2 (n=6): 15 / 11; ziarno 3 (n=4): 6 / 0.
- Wymuszone pokoje PO wypadły w turze 40 (16 z 17) oraz w turze 32 (1 z 17, ziarno 2; korekta r1b wg raw); przy 3 miastach ochrona minMiastPoOddaniu=3 nie pozwala oddać żadnego miasta (cityCap=0), więc każdy wymuszony pokój odbył się BEZ zapłaty (patrz §3).

### 2b. Wariant stresowy K=6 (6 miast na cywilizację)

| Wariant | Wojny startowe | Zakończone pokojem | Oferta <80% | Oferta ≥80% | Pokój wymuszony 100% | Trwające na t150 | Miasta oddane pokojem | Eliminacje | Snowball max udział (t50/t100/t150) | Śr. czas wojny / max |
|---|---|---|---|---|---|---|---|---|---|---|
| PO | 31 | 31 | 28 | 1 | 2 | 0 | 10 | 0 | 0,30 / 0,30 / 0,30 (max po ziarnach) | 20,2 / 39 |
| PRZED | 31 | 30 | 28 | 2 | 0 | 1 | 7 | 1 (ziarno 2) | 0,25 / 0,25 / 0,25 (max po ziarnach) | 10,3 / 33 |

Miasta oddane pokojem w PO K=6: 10 (wszystkie przy zwykłej ofercie <80%, po 1 mieście). Pokój wymuszony w K=6: 2 zdarzenia, 0 miast oddanych (ten sam przypadek co §3).

### 2c. Dyspozycje z pkt (5) dispatchu: cena 0 / 1 miasto / remis

- Ocen ceny z ticku (wszystkie pary, wszystkie tury), cena 0 = pokój bez miast: K=3 PO 14 (wszystkie przy remisie), K=3 PRZED 23; K=6 PO 19, K=6 PRZED 23.
- Pokój wymuszony przy cenie 0: 0 zdarzeń (K=3 i K=6).
- Pokój wymuszony przy 1 mieście: 0 zdarzeń (wymuszone pokoje oddawały 0 miast).
- Pokój wymuszony przy remisie: 0 zdarzeń.
- Pokój zwykłą ofertą przy 1 mieście: K=6 PO 10 zdarzeń (oferty <80%).
- Uwaga metodologiczna: w tym modelu armie są równe na starcie, więc remis (cena 0) jest częsty. To jest artefakt modelu, nie przewidywanie gry. W realnej grze udziały siły są inne (NIE ZMIERZONO).

### 2d. Pętla „wojna → pokój → natychmiast wojna”

- Nie wystąpiła, ale NIE jest to wynik pomiaru: model nie deklaruje wojen po pokoju (brak decyzji AI o wypowiedzeniu, brak karencji 40 tur w silniku). Punkt NIE ZMIERZONO (patrz §5).

### 2e. Czas tury (pkt 6)

- Średnio na turę (silnik zastępczy, ms, 150 tur): PO K=3 ok. 9–34 ms (zależnie od liczby cywilizacji), PRZED K=3 ok. 3–41 ms; PO K=6 16–36 ms, PRZED K=6 6–29 ms.
- Różnice to głównie różna liczba żywych wojsk po wojnach (nie regresja kodu). Pomiar silnika zastępczego, NIE realnej tury gry (NIE ZMIERZONO w grze).

## 3. Werdykt RYZYKO: pokój wymuszony bez zapłaty przy ≤3 miastach

Fakt z kodu (`gra/src/game/war-weariness.ts`, gałąź `wearinessForcedPeaceDue`): `cityCap = battlePending ? 0 : max(0, ownCities − minMiastPoOddaniu)`. Gdy przegrywający ma ≤3 miasta (cityCap = 0) albo nie jest „wyraźnie przegrywający” (udział > 0,45), plan zapłaty jest pusty, a `d.finalize(...)` i tak zawiera pokój. W efekcie pokój wymuszony na 100% może zapaść BEZ oddania miasta.

Dowód z pomiaru: PO K=3 — 17 wymuszonych pokojów, każdy z 0 miastami; PO K=6 — 2, każdy z 0 miastami. Komentarz w war-weariness.ts ("pokój wymuszony jest ZAWSZE płatny miastami przegrywającego ... nigdy bezwarunkowy") jest w tym przypadku nieprawdziwy.

Dowód przyczyny (r1c, pola `ownCitiesBefore` / `loserShareBefore` z ponownego przebiegu): wszystkie 17 wymuszonych pokojów K=3 i obydwa K=6 mają przegrywającego z 3 miastami = minMiastPoOddaniu, czyli cityCap = 3 − 3 = 0. Udział przegrywającego 0,083–0,20 (poniżej udzialWyraznie = 0,45), `priceZero` = false we wszystkich. Zatem przyczyną jest wyłącznie cityCap = 0; przypadków „cena 0” i „brak wyraźnej przewagi” w pomiarze nie było (0 zdarzeń).

Sprzeczność jest wewnątrz dokumentacji: war-weariness.ts:265 (JSDoc) i `_progi` w gra/data/war-weariness-params.json:10 mówią „ZAWSZE płatny miastami”; war-weariness.ts:302 (komentarz inline „0 miast, gdy battlePending”, „brak wyraźnie przegrywającego albo cena 0 → pokój BEZ miast”) i `_wzor` (json:14, limit = miasta − minMiastPoOddaniu) mówią, że przy limicie 0 pokój idzie bez miast.

Dwa warianty do decyzji właściciela (BEZ zmian kodu w tym temacie):
- A) Zachować wojnę do skutku, gdy nie ma miasta do oddania (pokój wymuszony tylko gdy cityCap > 0), i poprawić komentarz. Skutek: wojny z ≤3 miastami dłużej trwają. NIE ZMIERZONO: ile z 17 wymuszonych pokojów K=3 przeszłoby na odroczenie (narzędzie nie ma wariantu bez wymuszonego pokoju przy cityCap=0) i czy wojna przy braku pokoju przeciągnęłaby się bez końca (model nie ma mechanizmu odroczenia poza battlePending).
- B) Zachować pokój bez zapłaty przy ≤3 miastach jako świadomą decyzję, ale wpisać to do Civpedii/komentarza jako wyjątek od „zawsze płatny”. Skutek: zgodność z obecnym zachowaniem, bez zmian gry.

Rekomendacji nie podaję (dispatch: dwa warianty do decyzji właściciela). Niezależnie od wyboru komentarze war-weariness.ts:265/302 i `_progi`/`_wzor` w params trzeba ujednolicić.

## 4. Odpowiedzi na kryteria dispatchu

1. Wojny AI↔AI: start 31 par (K=3 i K=6); PO: 31 zakończonych pokojem, 0 trwających na t150. PRZED proxy: 8 trwających (K=3), 1 (K=6).
2. Czas trwania: PO K=3 średnio 30,8 tur (max 39); PO K=6 średnio 20,2 (max 39). Wojny dochodzące do 100%: PO K=3 17 z 31 (55%), PO K=6 2 z 31 (6%).
3. Miasta zmienione przez pokój: PO K=3 0 (przez pokój wymuszony 0, przez oferty 0); PO K=6 10 (wszystkie przez oferty <80%, po 1 mieście), wymuszone 0.
4. Eliminacje i snowball: PO 0 eliminacji we wszystkich 6 przebiegach (K=3 i K=6). Maksymalny udział jednej cywilizacji w miastach: PO 0,25 (K=3), 0,30 (K=6) — poniżej progu 60%. PRZED proxy: 2 eliminacje (K=3), 1 (K=6), max udział 0,40 (K=3).
5. Cena 0 / 1 miasto / remis: §2c. Pokój wymuszony przy cenie 0, 1 mieście, remisie: 0 zdarzeń.
6. Czas tury: §2e, bez regresji widocznej w silniku zastępczym (różnice wynikają z liczby wojsk).

## 5. NIE ZMIERZONO (jawnie)

- Realnej gry, Chromium, pełnej tury `endTurn` z dyplomacją gracza, ekonomią, mgłą i decyzjami AI o wypowiedzeniu wojny.
- Realnej siły militarnej (`compareMilitaryStrength`), realnej ceny pokoju (diplomacy-proposals / acceptance points), realnej karencji po pokoju w silniku (tu tylko finalize z lockTurns, bez egzekwowania).
- Pętli „wojna→pokój→wojna” w grze: model nie deklaruje wojen po pokoju.
- Miast zdobytych przez wojnę przy realnej walce (walka zastępcza jest uproszczona; w K=3 prawie nie zmienia właścicieli).
- Porównania z commitem 774fd0eec (zastąpione proxy parametrowym).
- Częstości wymuszonych pokojów w realnej grze: NIE ZMIERZONO. W K=3 cityCap = 0 wynika z konstrukcji scenariusza (każda cywilizacja ma dokładnie 3 miasta = minMiastPoOddaniu), więc 17 z 31 wojen to skutek ustawienia scenariusza, nie prognoza.
- Wariant A z §3 (pokój wymuszony tylko przy cityCap > 0): NIE ZMIERZONO, narzędzie nie ma przełącznika wariantu.

## 6. Ograniczenia narzędzia (do wiedzy przy czytaniu wyników)

- Scenariusz startuje z wojnami wszystkich par; nie ma deklaracji wojen, więc pętli wojen nie da się wykryć.
- Cena pokoju jest wymyślona (100·(udział−0,5)·2), a miasto = 15 PW; wnioski o ilościach zapłaty są o modelu, nie o grze.
- Przy K=3 ochrona minMiastPoOddaniu=3 blokuje oddanie miast, więc wynik „0 miast” jest wbudowany w scenariusz; wariant K=6 pokazuje zachowanie z oddawaniem miast.

## 7. Dalsze kroki

- Decyzja właściciela: wariant A lub B z §3 (RYZYKO). Bez decyzji kod pozostaje bez zmian.
- Opcjonalnie: kolejny temat, który doda w silniku zastępczym deklaracje wojen po karencji i realną siłę militarną (osobna decyzja, nie w tym temacie).

ZMIANY-COMMIT (r1c): `gra/tools/weary40-sim-measure.cjs` (nowy; r1c dodał `warTurns`, `ownCitiesBefore`, `loserShareBefore`, `avgWarTurns`, `maxWarTurns`), `dyspozycje/autobot/runs/R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1/10-operator-claude.md`, `raw-K3-N3-T150.jsonl`, `raw-K6-N3-T150.jsonl` — commit z tą ścieżką (bez `git add -A`).
TESTY (r1c): smoke `--turns 30 --seeds 1 --variant both` exit 0 (5,7 s); ponowny pełny przebieg K=3 i K=6 (150×3×2) exit 0 (22,7 s / 22,7 s); porównanie z raw po usunięciu avgTurnMs i nowych pól: 12 wierszy = 12 wierszy, IDENTYCZNE; tabele §2a/§2b zgodne z nowymi polami; `git diff --check` — patrz 30-obrona. Poprzednio: pełny przebieg K=3 i K=6 (3 ziarna × 150 tur × 2 warianty) exit 0; deterministyczność potwierdzona cmp po usunięciu avgTurnMs. Bramki gry (`npm run build/dev`) nie uruchamiane — zgodnie z allowlistą.
BLOKADY: brak. Lokalnie zainstalowany esbuild@0.28.2 i three@^0.169.0 w katalogu skryptowym poza repo (symlink gra/node_modules zostaje w worktree jako untracked, poza commitem; sprzątanie orkiestratora).
RUNDY: 1/5
NASTĘPNY KROK: werdykt orkiestratora i decyzja właściciela w sprawie §3 (A/B). Brak integracji w tym temacie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- W origin/main nie ma katalogu R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1; dispatch i DODATEK są tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (w bazie 64069b1a2 też brak). Użyto wersji z tej gałęzi.
- Nie znaleziono pliku listy deployu, do którego dispatch każe dopisać narzędzie (w repo brak takiej listy w tym zakresie); narzędzie zostało tylko dodane do gra/tools.
- Brak gra/node_modules w worktree; do smoke użyto esbuild i three zainstalowanych poza repo (katalog scratchpad) i symlinku, który usunięto.
