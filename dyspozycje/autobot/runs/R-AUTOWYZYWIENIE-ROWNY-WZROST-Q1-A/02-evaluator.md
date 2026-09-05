# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — 02-evaluator (runda 1/5)

STATUS: ZARZUTY-WYSTAWIONE (werdykt orzeka Final Control, §3c)
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A
GOAL: zgodny z `00-dispatch.md` — funkcją celu autowyżywienia jest wyrównywanie WZROSTU
między miastami przy twardym warunku braku głodu, z (B) miastem na limicie i (C) skalowaniem
tempa całej cywilizacji. GOAL w raporcie Operatora = GOAL z dispatchu (§16a pkt 9: zgodne).
MODEL+EFFORT: Opus 5, effort high. Baza potwierdzona: `bec25312`; HEAD `9b9dc9fc`.

## Cztery punkty wskazane w zleceniu — sprawdzone WŁASNYM pomiarem

(i) **Bramka odrzuca „zatrzymaj wszystkich" — POTWIERDZONE własną mutacją.** Wymusiłem
w `resolveEqualGrowthRationPlan` stały `uniformLevel = WYZYWIENIE_POZIOM_NA_LIMICIE`
(0% wzrostu z racji, zerowy rozrzut, brak głodu). Bramka **sczerwieniała**: 47/51, exit 1 —
E1 „przyrost 2 > próg 2" FAIL, dodatkowo E5b, C2, B5. Uwaga: samo A5 (`przyrost > 0`)
mutacji NIE łapie (przyrost 2 > 0) — łapie ją dopiero E1 z progiem z wariantu kontrolnego.

(ii) **Bramka woła prawdziwą pętlę ekonomii — POTWIERDZONE własną mutacją.** Zmutowałem
`population-growth-v85.ts:451` (`city.population = growth.nowaLudnosc` → brak zapisu).
Bramka sczerwieniała: 48/51, A5 „47 → 47", E1 „przyrost 0". Gdyby liczyła własną kopię
wzoru, mutacja realnej pętli byłaby niewidoczna. Kolejność harnessu odpowiada `main.ts`
(28128-28200 → 29404-29412 → 16324).

(iii) **Własność (B) FAKTYCZNIE zwraca porcję do puli, nie tylko zeruje przyrost — POTWIERDZONE.**
Miasto na limicie schodzi na 1,5, jego `bilansLokalny` staje się dodatni i trafia do puli przez
`empire-food.ts:249-251`, co realnie podnosi wspólny poziom pozostałym. Pomiar własny
(12 miast, cap 5, kosztArmii 20, zapasy 279): produkcja ×1 → uniform **4 → 6**; ×0,5 → **2 → 2,5**.
**ALE w niedoborze działa w drugą stronę — patrz ZARZUT 3.**

(iv) **Hipoteza „wszystko-albo-nic" ZMIERZONA, nie przyjęta na wiarę — POTWIERDZONE, liczby
odtworzone niezależnie.** Na kodzie bazowym, stan `poziomRacji` 4,5 (Sparta i Jin 4),
flow miast 1 − armia 20 = **−19**: `maxSafePoziomRacjiForCity` = **0 dla Sparty, 2 dla Jin**
— dokładnie liczby z raportu Operatora. Ten sam stan po naprawie: **4 dla wszystkich 12 miast**.
Hipoteza recon-u obalona jako przyczyna słusznie; prawdziwą przyczyną jest asymetria
kontrfaktyku (zależność od tego, KTÓRE miasto pyta — małe miasto pochłania całą korektę
imperium, bo jego koszt racji skaluje się z ludnością).

## Bramki — uruchomione przeze mnie, nie ze streszczenia (§16a pkt 3)

- Nowa `autowyzywienie-rowny-wzrost-test.cjs`: **57/57**, exit 0. Na źródle bazowym
  (`git show bec25312:…empire-food.ts`): **23/34, exit 1** — dowód nietautologiczności
  potwierdzony (A1 18 naruszeń odwrotnej zależności, np. „T6: Korynt(bilans −2) 5% <
  Teby(bilans −12) 6,5%"; A3 rozrzut 4,5; A4 poziomy 1,5/0,5/2/3/4).
- `tsc --noEmit`: zielone (exit 0).
- Zielone: kosztarmii-kryterium 18/18, flow-balance 17/17, bilans-clamp 22/22, live-recalc 60/60,
  population-growth-live-recalc 42/42, ai-major-economy 33/33, city-state-mp-growth 9/9,
  army-hunger-combat 13/13, gold-deficit 55/55, magazyn-era-scaling 58/58,
  okolica-multi-city-overlap 55/55, spichlerz-deficyt-scalenie 58/58,
  population-growth-v85-bonus exit 0, population-growth-tempo exit 0.
- Referencyjne (§dispatch kryt. 7): logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6 — wszystkie zielone.
- Czerwone: empire-food-b5, glod-wojska-karencja, grupa-b-lane, population-growth-v85,
  spichlerz-wzrost. **Zweryfikowałem brak regresji podmieniając `empire-food.ts` na wersję
  bazową: listy FAIL-i są ZNAK W ZNAK IDENTYCZNE przed i po** (spichlerz-wzrost: pełny
  `diff` wyjścia pusty, 2 passed / 7 failed w obu). Te bramki nie są długiem tego tematu.
- Brak pliku `empire-food-test.cjs` nazwanego w kryterium 6 — najbliższy istniejący to
  `empire-food-b5-test.cjs` (czerwony już na bazie). Operator obszedł to poprawnie, listując
  faktyczne bramki.

## Sprawdzenia dodatkowe

- Konwergencja z ZASTANEGO rozrzutu (sytuacja ze zrzutu właściciela, save sprzed naprawy):
  uruchomiłem bramkę ze startem mieszanym (Sparta 0, Qin 0, Korynt/Wei 0,5, Efez 1,5, Yan 2,
  reszta 4) — sekcje A/B/C/E zielone, układ zbiega do wspólnego poziomu. Brak zarzutu.
- Wierność harnessu: `main.ts:28179` woła `maxSafePoziomRacjiForCity` BEZ `kosztArmii`, harness
  z `kosztArmii`. Sprawdziłem wariant zgodny z `main.ts` — **57/57**, wynik bez zmian. Nie
  podnoszę tego do zarzutu.
- E4/E5 są prawdziwe definicyjnie (`PROG := stop.przyrost`, warunek `> PROG`). Ciężar dowodu
  niesie E1 i to E1 sczerwieniało na mojej mutacji — wymóg §REGUŁA dispatchu jest spełniony
  merytorycznie.
- §9: brak `npm run build`/`dev` (używałem wyłącznie `node tools/*-test.cjs` i
  `tsc --noEmit`); `git diff --check` czysty; brak sekretów w diffie; brak zmian w `WERSJE.md`,
  `playbook.json`, `docs/decyzje/**`, `gra-robocza/**`; commity po ścieżkach, bez `git add -A`.
- §16a pkt 7: zero nakładania z węzłem B — diff nie dotyka `gra/src/main.ts` ani `gra/src/ui/**`.
- §16a pkt 6: brak usunięć poza tym, czego wymagał GOAL (zdjęte pętle lockstep i nieużywane
  importy `WYZYWIENIE_MAX`/`WYZYWIENIE_STEP`).
- §16a pkt 4 (save/load, parytet): `poziomRacji` jest stanem trwałym; nowy kod zapisuje wyłącznie
  wartości z `WYZYWIENIE_LEVELS`, przez `clampPoziomRacji`; brak nowego pola w save. AI dostaje
  ten sam mechanizm co gracz (parytet zachowany, `ai-major-economy` 33/33).
- §11: raport Operatora to 772 słowa w pliku runu wobec limitu ok. 400 — `PASS-WITH-NOTES`,
  nie zarzut.

## ZARZUTY

**ZARZUT 1 — allowlista, co do pliku (§16a pkt 1).**
Miejsce: `gra/tools/auto-wyzywienie-kosztarmii-kryterium-test.cjs` (cały plik, 25 linii diffu).
Allowlista dispatchu dopuszcza „istniejące bramki `empire-food*`". Ta nazwa nie pasuje do wzorca.
Znaczenie: naruszenie zasady „diff mieści się w allowliście co do pliku". Materialnie zmiana jest
minimalna i wzmacniająca (3 zaszyte wartości + nowa asercja `atenyLvl === miletLvl`; istota testu,
czyli obecność `kosztArmii` w kryterium, nietknięta i nadal asertowana), a kryterium końca 6
tego samego dispatchu wprost każe zaktualizować bramki dotykające `empire-food.ts`. To jest
**rozjazd wewnątrz dispatchu**, nie samowola Operatora — Operator zgłosił go sam jako notę (1).
Kandydat na `DO DECYZJI CZŁOWIEKA` (C-054), nie na `NAPRAW`.

**ZARZUT 2 — własność (B) nie działa w grze; jest wyłącznie API + bramka (§16a pkt 9, GOAL).**
Miejsce: `gra/src/game/empire-food.ts:545` (`EqualGrowthRationPlanOpts.popCapByCityId`) wobec
`gra/src/main.ts:28128`, `:28152`, `:28179`, `:16256`, `:16285`.
`grep -rn 'popCapByCityId' gra/src --include=*.ts` daje trafienia **wyłącznie w `empire-food.ts`** —
żaden z pięciu realnych punktów wywołania nie przekazuje mapy limitów, więc w działającej grze
`atPopCap` jest zawsze puste i własność (B) jest martwa. Dispatch mówi „Trzy własności, wszystkie
wymagane", a jednocześnie zakazuje bezwzględnie `gra/src/main.ts` (węzeł B) — a węzeł B jest
opisany jako „stan przycisku" (UI), nie jako podpięcie limitu ludności. Znaczenie: wchłonięty temat
`R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1` (ECHO właściciela, wariant a) po tej rundzie nadal nie
zadziała dla gracza. Kandydat na `DO DECYZJI CZŁOWIEKA`: rozstrzygnięcia wymaga, czy podpięcie
`popCapByCityId` w `main.ts` należy do tego tematu, do węzła B, czy do osobnego ID.

**ZARZUT 3 — w niedoborze własność (B) DZIAŁA ODWROTNIE: miasto na limicie zjada WIĘCEJ niż
miasta rosnące i spycha je niżej (GOAL własność B i C).**
Miejsce: `gra/src/game/empire-food.ts:600` w `applyCandidate`
(`for (const c of atPopCap) c.poziomRacji = WYZYWIENIE_POZIOM_NA_LIMICIE;`), powtórzone
w `:623` (`levelByCityId`) i lustrzanie w `maxSafePoziomRacjiForCity` `:970-974`.
Poziom miasta na limicie jest przybity na sztywno do stałej 1,5 i **nigdy nie jest przycięty
do `level`**, więc gdy wspólny poziom rosnących miast spada poniżej 1,5, miasto na limicie
konsumuje racje DROŻSZE niż miasta, którym ta porcja miała pomóc.
Pomiar własny (12 miast ze zrzutu, cap 5 → 5 miast na limicie, kosztArmii 20, zapasy 279,
produkcja ×0,25): plan **BEZ** mapy limitów → `uniformLevel = 0,5` (−6% wzrostu);
plan **Z** mapą limitów (własność B włączona) → `uniformLevel = 0` (−10% wzrostu).
Włączenie (B) pogarsza sytuację miast rosnących o cały poziom. To jest wprost sprzeczne z zapisem
dispatchu „**nie konsumuje racji ponad potrzebę** — jego porcja wraca do puli dla pozostałych"
i z własnością (C) („przy niedoborze wszystkie miasta rosną wolniej", nie: te na limicie mają
lepiej). Poprawka: przyciąć poziom miasta na limicie do wspólnego, tj.
`Math.min(WYZYWIENIE_POZIOM_NA_LIMICIE, level)` w `:600` i `:623` oraz analogicznie w `:970-974`.
Zweryfikowałem tę poprawkę pomiarowo: po niej ten sam scenariusz daje `uniformLevel = 0,5`
w obu wariantach — włączenie (B) przestaje szkodzić. Bramka nie pokrywa tego kierunku:
`B5` sprawdza wyłącznie kierunek „nadmiar" (poziom rośnie), nigdy „niedobór". Zarzut trafia
w GOAL, więc kandydat na `NAPRAW` (plus asercja niedoboru w sekcji B bramki).

ZMIANY/COMMIT: Evaluator nie zmienia kodu produkcyjnego. Wszystkie mutacje i sondy wykonane
tymczasowo i cofnięte; `git status --porcelain` po weryfikacji: **pusty**.
Artefakt: `dyspozycje/autobot/runs/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A/02-evaluator.md`.
BLOKADY: brak technicznych.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (§3c pkt 2) — odpowiedź PRZYJMUJĘ/ODRZUCAM z dowodem
z wytworu na każdy z 3 zarzutów; następnie Final Control (Sonnet 5, effort high), werdykt per zarzut.
DEPLOY/PUSH: NIE WYKONANO
