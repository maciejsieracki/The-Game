# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — ZAŁĄCZNIK do raportu Operatora RUNDA 1

Pełne rozliczenie 117 bramek AI/miast, wydzielone z `01-operator-runda1.md`
(OBRONA R1, zarzut 7 — §11: raport niesie destylat, surowe materiały zostają
w `dyspozycje/autobot/runs/<ID>/`). Treść niezmieniona.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**.
- `node tools/ai-buduje-budynki-test.cjs` — **PASS=22 FAIL=0** (min. 6 wymagane).
- Bramki referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.
- Bramki AI/miast — `ls gra/tools/ | grep -Ei "ai|auto-manage|city|miast|prod"`,
  **wszystkie 117 `*-test.cjs` uruchomione** (7 podmieniających własne pliki `src/`
  w trakcie biegu — osobno, seryjnie, żeby nie zderzyły się z niczym innym; ta bramka
  liczona osobno). Wynik: **100 zielonych, 17 czerwonych, 1 TIMEOUT**.
  **Każda czerwień rozstrzygnięta, zero regresji tego tematu.**

  a) **14 czerwonych = dług przed-istniejący, potwierdzony parytetem na czystej bazie**
  (`gra/src/main.ts` i `gra/src/game/empire-city-defaults.ts` przywrócone z `05df297a`,
  bramka puszczona ponownie, naprawa przywrócona — **identyczny wynik**):
  `ai-balans-step3`, `ai-praca-split-parity`, `ai-slider`, `ai-test` (287/8 — te same
  liczby przed i po), `ai2-heks-po-heksie`, `ai4-popyt-obywatele`,
  `barb-city-capture-cluster`, `building-detail-card-entitycard-migration`,
  `city-state-offensive-normal-easy`, `fair-play-tier-grid`,
  `forced-war-bronze-main-guard`, `load-fail-toast-zindex`,
  `unit-detail-card-entitycard-migration`, `miasta-panstwa-wylaczone-ui-render`
  (11/1 solo = 11/1 na bazie), `empire-panel-miasto-obywatele-content` (113/2 solo =
  113/2 na bazie; oba faile dotyczą `buildEmpireTradeSnap`).

  b) **2 czerwone STRUKTURALNE — fałszywy alarm z konstrukcji, nie regresja:**
  - `city-state-offensive-live-test` porównuje `git show HEAD:gra/src/main.ts` z żywym
    plikiem i wymaga RÓŻNICY („sanity: wersja PRZED różni się od żywej"). `HEAD` to
    teraz commit TEGO tematu, więc PRZED == PO i sanity pada zanim cokolwiek zmierzy.
  - `miasta-panstwa-wylaczone-test` porównuje plan świata w worktree z `origin/main`
    i wymaga RÓŻNICY („plan PRZED === plan PO, byte-identyczne"). Jego własna zmiana
    jest już w `origin/main`, więc pada niezależnie od tego tematu.

  c) **1 TIMEOUT (INFRA):** `map-capacity-mp9-typy` — pomiar pojemności map, limit
  30 min, generacja mapy `riversFill` ~785 s na bieg; nie dobiegła na współdzielonej
  maszynie.

  d) Dwie bramki przeglądarkowe czerwone pod obciążeniem (równolegle działała druga
  sesja AutoBota) są **ZIELONE po powtórzeniu SOLO** na drzewie z naprawą:
  `city-state-start-units-live` oraz `interaction-latency-vs-citycount-live`
  (ta druga: wszystkie 4 interakcje poniżej progu 1.5×, `rc=0`) — potwierdzenie, że
  naprawa nie pogarsza wydajności mimo że `tryAutoEnqueueBuild` odpala teraz również
  dla miast-państw.


## NOTA 1 (istotna, koryguje recon dispatchu)

Recon B twierdził, że miasta AI **nigdy** nic nie stawiają. Pomiar tego nie potwierdza:
stan sprzed naprawy daje 4 budynki dużych AI. Powód: miasto AI ma **drugą, niezależną**
drogę do kolejki — komendę `build` z `chooseCityProduction` (`ai.ts`), egzekwowaną
w `main.ts` **bez patrzenia na `budowaTryb`**. Reset `'reczny'` zabijał obie ścieżki
AUTO-kolejki (Zarządca i `tryAutoEnqueueBuild`), nie całe budowanie. Objaw właściciela
(miasto-państwo z zerem budynków) pomiar odtwarza **dokładnie**: PM przed naprawą 0.
Dlatego asercje M1/M2 sprawdzają ŚCISŁĄ POPRAWĘ, nie „zero przed" — inaczej bramka
kłamałaby o mechanizmie.

## NOTA 2 — recon G, odpowiedzi

1. **`R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` (`eb03cb94`) — TAK, zostało
   cicho cofnięte, i to natychmiast.** `git show eb03cb94:gra/src/main.ts` zawiera już
   `c.budowaTryb = bp.budowaTryb` (linia 4624) w `seedCityOwnerDefaults`, a każda ścieżka
   założenia miasta woła tę funkcję zaraz po `foundCityAt`. Commit zmienił tylko
   `cities.ts` i uzasadnił neutralność gałęzią „AI nie czyta tego pola (grep w `ai.ts`
   zero trafień)" — konsumentem jest `auto-manage.ts`/`main.ts`, nie `ai.ts`. Ta zmiana
   była martwa od pierwszego dnia. **Dla AI ten temat ją teraz przywraca; dla GRACZA
   nadal jest cofnięta** — dispatch wprost każe zostawić graczowi `'reczny'`, więc nie
   ruszam tego. Do decyzji właściciela osobnym tematem.
2. **`R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` — ten sam korzeń NIE.** Ulepszenia terenu są
   finansowane z puli imperium, a `pracaImperialPoolGain(split, queueEmpty)` przy PUSTEJ
   kolejce oddaje do puli **całe** `doBudynkow + doPuli`. Reset `'reczny'` zwiększał więc
   budżet ulepszeń, a nie go zmniejszał — spójne z pomiarem Evaluatora tamtego tematu
   (delta zero, budżet nigdy nie był czynnikiem ograniczającym; brakowało kandydatów).
   **Ale zależność istnieje w drugą stronę i jest konsekwencją tej naprawy:** kolejki
   miast AI przestają być puste, więc `doBudynkow` idzie odtąd w budynki zamiast do puli
   ulepszeń. Do świadomego przyjęcia przez właściciela — nie zmieniam podziału 50/50.
