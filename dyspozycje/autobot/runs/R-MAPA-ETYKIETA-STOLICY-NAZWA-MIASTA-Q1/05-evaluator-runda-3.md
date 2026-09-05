# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Evaluator, runda 3

DOMAIN: GAME · TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 · RUNDA: 3/5
MODEL+EFFORT: Opus 5, effort high (Evaluator, C-052) · DATA: 2026-09-04
OCENIANY WYTWÓR: `bbe93e30` na `autobot/…-Q1`, baza `fb33fd0a` (potwierdzone `git log -1`
przed pracą). Oba drzewa czyste przed i po mojej pracy.

## ZARZUTY

**1. `gra/tools/mapa-etykieta-stolicy-test.cjs:369-371` — komunikat asercji (G4) twierdzi
„0/15 przyciętych", czego wytwór nie spełnia w trzeciej konfiguracji plakietki.**
G4 liczy `BASE − CROWN_W − PROD_W` (260−19−20 = 221 px) i pomija `growthW`. Slot WZROST%
istnieje wyłącznie na plakietce WŁASNEGO miasta gracza (`gra/src/render/cityMapStatChip.ts:786-794`,
komentarz „tylko miasta gracza”; wchodzi do budżetu w `:800`). Mój pomiar w żywym Chromium
tym samym fontem `700 22px Georgia`: `growthW("−10,5%") = 42 px` → budżet 179 px wobec
`uMgungundlovu` = 213,9 px, czyli **1/15 przyciętych**. Operator to zna i opisuje
(`04-operator-runda-3.md:66-68`, `decision-abc.md:33-40`), ale bramka — artefakt, który
przeżyje raport — zapisuje stan przeciwny. Narusza §16a pkt 3 (bramka ma mierzyć to, co
głosi jej komunikat) i pkt 9: kryterium końca R3-1 mówi „wszystkie 15 **pierwszych miast
cywilizacji**”, nie „wszystkie stolice AI”. Znaczenie dla GOAL: właściciel ma wybrać bazę
260 vs ≈305; zielona bramka z napisem „0/15” sugeruje, że 260 już domyka kryterium.
Poprawka: doprecyzować komunikat G4 do konfiguracji, którą realnie mierzy (stolica obca:
korona + glif produkcji), ewentualnie dołożyć asercję dla konfiguracji z `growthW` —
BEZ samodzielnego wyboru bazy, ta pozycja należy do właściciela.

## CO SPRAWDZIŁEM SAM (nie streszczenie raportu)

- **Allowlista (pkt 1):** `git diff --name-status fb33fd0a..bbe93e30` = 14 plików, wszystkie
  z allowlisty R1+R2+R3. `main.ts`, `docs/decyzje/**`, `WERSJE.md`, `playbook.json`,
  `gra/data/*.json` nietknięte (`git diff --stat … -- gra/data/` pusty). `git diff --check` czysty.
- **Granice §9 (pkt 2):** zero `npm run build/dev` — dowody budują `vite` binarką z
  `node_modules` do `os.tmpdir()`; `gra/dist` nie istnieje. Brak `git add -A`. W całym diffie
  poza PNG zero trafień na sekrety. W `gra/src` usunięta **jedna** linia kodu
  (`const maxNameW = 200 − …`) — brak usunięć, których GOAL nie wymagał (pkt 6).
- **Bramki uruchomione przeze mnie (pkt 3):** `tsc --noEmit` (5.9.3, symlink `node_modules`
  zweryfikowany — C-029) zielone. `mapa-etykieta-stolicy` 44/0, `display-names` 27/0,
  `city-names-pool` 12/0, `city-names-pools` 6/0, `civ-names` 6/0, `rozmiar-label` 13/0,
  `danina-podatek-nazwa` 15/0, `diplomacy-display` 35/0, `unit-recruit-nazwa` 17/0,
  `save-label` OK, `cluster-start-q2-smoke` 16/0, `battle-hp-display` 7/7,
  `bitwa-tożsamość-źródło` 38 OK. Referencyjne: logic 213/213, tech-tree 19/19,
  research 33/33, unit-replace 13/13, combat 6/6.
- **Parytet czerwonych (kryterium 7):** nie przyjąłem deklaracji — podmieniłem trzy pliki
  źródłowe na wersje z `fb33fd0a` i uruchomiłem ponownie: `flaga-mp-nie-gasnie` 31/1 na
  gałęzi **i** na bazie (FAIL = T14, liczy przypisania w `main.ts`), `miasta-panstwa-wylaczone`
  52/3 na gałęzi **i** na bazie (3× „plan PRZED (origin/main) === plan PO”, PRE-tree w
  scratchpadzie starszy od `origin/main`). Bez pogorszenia. Drzewo przywrócone do `bbe93e30`.
- **Nietautologiczność (pkt 8):** mutacje wykonane przeze mnie, obie cofnięte —
  cofnięcie `playerCapitalFromPool` do bazy → `mapa-etykieta-stolicy` **39/5**;
  `CITY_NAME_BUDGET_BASE` 260→200 → **42/2**. Kryterium 3 rundy 3 spełnione.
- **Własny pomiar (kryterium 1), żywy Chromium, `700 22px Georgia`:** `uMgungundlovu`
  213,9 px, `Tyr` 46,4 px. Stolica obca bez glifu produkcji: 181 px → **1/15**, 241 px →
  **0/15**. Z glifem: 161 px → **1/15**, 221 px → **0/15**. Liczby Operatora potwierdzone
  niezależnie. Konfiguracja gracza — patrz zarzut 1.
- **Własny zrzut z żywego Chromium, układ gęsty:** własny skrypt, własna partia
  (`scratchpad/EVAL-R3-gesty.png`, `EVAL-R3-zblizenie.png`). Stolica AI z koroną, 5 miast-państw
  w odległości 5 heksów. Potwierdzam oba odczyty Operatora: plakietka **wchodzi na sąsiednie
  heksy** (w każdej konfiguracji, także przed tematem), ale **żadna plakietka nie dotyka
  drugiej** przy minimalnym odstępie 5 heksów. Plakietka nie jest rozjechana, brak wielokropka
  na nazwie stolicy. Warunek twardy R3-1 faktycznie nie jest spełnialny — `DECISION_REQUIRED`
  jest właściwą reakcją, dokładnie tą, którą ratyfikacja nakazała („nie wybieraj sam kompromisu”).
- **Parytet i stan trwały (pkt 4):** `playerCapitalFromPool` i `foreignCapitalFromPool` czytają
  to samo źródło (E7d). Brak duplikatu potwierdzony niezależnie od bramki: kolejne miasto gracza
  idzie przez `suggestPlayerFoundCityName` → `collectUsedCityNamesFromCities` →
  `pickNextRegularCityName` (`city-names-pool.ts:213-245`), więc `Xi'an` zajęte przez stolicę jest
  pomijane. Zapis w save trzyma nazwy w stanie — stare zapisy nie migrują, brak ścieżki brzegowej.
  Fallback dla niekompletnej puli zachowany (`if (first) return first;`).
- **Bramka spoza allowlisty, którą runda 2 wskazała jako zagrożoną:** `cluster-start-test.cjs:104`
  („Ateny”), `:188`/`:190` („Qin”) budują plan **bez** `cityNamesPools`, więc idą legacy ścieżką
  `nazwyKlastra[0]` (`civ-names.ts:60-64`, `:92-99`) — zmiana pul ich nie dotyka. Twierdzenie
  Operatora „FAIL-e bez związku z nazwami” potwierdzone strukturalnie, nie z logu.
- **Kolizja z innym tematem (pkt 7):** żaden z 4 równoległych worktree nie dotyka
  `cityMapStatChip.ts`, `city-names-pool.ts`, `civ-names.ts`, `display-names.ts` ani `render/cities.ts`.
- **GOAL i kryteria (pkt 9):** GOAL raportu = GOAL z sekcji „RUNDA 3 — RATYFIKACJA” w
  `00-dispatch.md`. Praca rundy 2 (`1e87ec1c`) utrzymana, `foreignCapitalMapName` nietknięte.
  Obowiązek jawnego opisania zmiany E7 spełniony (raport + komentarz w bramce `:254-262`).
  `decision-abc.md` istnieje i nie proponuje rozwiązania (C-054). Pkt 10 — temat nie jest dzielony na węzły.

## UWAGI NIEBLOKUJĄCE (nie są zarzutami)

- `mapa-etykieta-stolicy-test.cjs:377` — `SLOTY_POZA_NAZWA_PX = 143` to zamrożona wartość
  złożona; `BASE`, `PROD_W`, `CROWN_W`, `MAX_SCALE` bramka czyta ze źródła, ta jedna nie.
  Dodanie kolejnego slotu do plakietki nie zaczerwieni G5. Do rozważenia osobnym tematem.
- Etykiety miast-państw nadal są przycinane („SPARTA · MIASTO-PA…”) — format
  `nazwa · MIASTO-PAŃSTWO`, poza zakresem tego tematu.

## ZAKRES MOJEJ PRACY

Nie integrowałem, nie deployowałem, nie pushowałem. Nie zmieniałem żadnego pliku poza tym
raportem; mutacje i podmiany plików bazowych zostały cofnięte, `git status` obu drzew pusty.
Skrypty pomiarowe i zrzuty trzymam w scratchpadzie (prefiks `EVAL-R3-`, C-036), nie w repo.
