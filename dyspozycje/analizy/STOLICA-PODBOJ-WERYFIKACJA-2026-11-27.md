# STOLICA-PODBOJ-WERYFIKACJA-2026-11-27 — pomiar na żywo po FALI 931 (R-WEB-CAPITAL-CONQUEST-VERIFY-Q1, tag CAPCONQ)

Baza: origin/main `2b0c3abe7` (kod `952b18d51`, FALA 931). Narzędzie: `gra/tools/capital-conquest-verify-live.cjs` (nowe; tylko odczyt i istniejące haki civTest; zero zmian w `gra/src` po przywróceniu mutanta). Runda 2 (obrona po ocenie Evaluatora): narzędzie ma teraz asercje i kończy się kodem 2 przy niezgodności; dodany pomiar 2b; mutacja L405 wykryta.
Build live: `npx vite build --outDir <scratchpad>/capconq-dist` (poza repo, nie `npm run build`).
Ustawienia (maksymalne dostępne w grze, zgodnie z dispatchem): Trudny; Wysoki ×4 (koszt jednostek, wzrost ludności, jakość mapy, jakość renderu/detali); kultura i religia: trudny; dyplomacja i wojna: trudna; wzrost surowców z epoką: ON; start: `__settingsLive.startNewGame`.
Skarbiec ustawiany wprost (`__ledgerRealPathDebug.setTreasury`): 777 (P1), 555 (S5), 333 (P4) przed przejęciem. Przejęcia prawdziwą ścieżką `__ledgerRealPathDebug.siegeSurrender` (→ `resolveSiegeSurrender`), bunty przez `__ledgerRealPathDebug.rebel`.

## Asercje narzędzia (CAPCONQ-R2)

Narzędzie `capital-conquest-verify-live.cjs` sprawdza każdy punkt i przy niezgodności wypisuje `CAPCONQ-FAIL [...]` oraz kończy się kodem 2. Przy zgodności: `CAPCONQ-PASS seed=<n>`, kod 0.
- P1: skarbiec przed = 777; przychód zdobywcy (po − przed) = 777; skarbiec ofiary po = 0; `siegeSurrender` zwraca true.
- S2: `siegeSurrender` do pierwotnego właściciela zwraca true; właściciel miasta = pierwotny właściciel; wpis i efektywna stolica = miasto sprzed buntu.
- S2b: po przejęciu przez gracza pierwotny właściciel odbija miasto (`siegeSurrender(miasto, właściciel)`); właściciel miasta = pierwotny właściciel.
- S5: round-trip (`snapshotJson`/`restoreJson`) po buncie i po przejęciu: wpis stolicy, efektywna stolica, skarbiec właściciela i gracza identyczne przed/po.
- P4: skarbiec ofiary przed = 333; przychód zwycięzcy = 333; po eliminacji: wpis stolicy (cap i explicit) = null, miasta = 0, skarbiec ofiary = 0, ostatnie miasto należy do gracza.
- Konsola: `pageerror` i `console.error` puste.

Asercje są sprawdzone mutacją: L405 `capital-capture.ts` (usunięte `setTreasury(newOwner, …)` w gałęzi Zdarzenia 1) daje `CAPCONQ-FAIL ["P1: przychod zdobywcy 0 != oczekiwany 777"]`, rc=2 (seed 4242). Źródło przywrócone (`git checkout`), `git status` czysty poza narzędziem.

## Tabela wyników (runda 2, live, po asercjach)

| Punkt | Ziarno 4242 | Ziarno 7 | Ziarno 11 | Werdykt |
|---|---|---|---|---|
| 1. Plunder: oczekiwane (wzór Zdarzenia 1: cały skarbiec → zdobywca, ofiara 0) = zmierzone | 777 = 777, ofiara po = 0 | 777 = 777, ofiara po = 0 | 777 = 777, ofiara po = 0 | PASS (asercje, ×3) |
| 2a. S2: zbuntowana stolica wraca do pierwotnego właściciela (wpis = efektywna stolica = miasto sprzed buntu) | właściciel 1, cap = explicit = city3 | j.w. (właściciel 1) | właściciel 1 (ziarno 11 — id miast inne niż 4242/7) | PASS (asercje, ×3) |
| 2b. S2 po przejęciu przez gracza: pierwotny właściciel odbija miasto | właściciel 1 po odbiciu; cap = explicit = city43; skarbiec właściciela 0, gracza 777 | właściciel 1; cap = explicit = city43; skarbiec 0 / 777 | właściciel 1; cap = explicit = city42; skarbiec 0 / 777 | PASS (asercje, ×3) — UWAGA: zamierzenie („odzyskanie” bez zwrotu łupu) do potwierdzenia, zob. niżej |
| 3. Podbój armią (ścieżka walki/przechwytu main.ts ~19286, ~41565) | NIE ZMIERZONO | NIE ZMIERZONO | NIE ZMIERZONO | NIE ZMIERZONO (brak haka, zob. niżej) |
| 4. Eliminacja przy ostatnim mieście-stolicy: wpis stolicy null, miasta 0, skarbiec ofiary 0, zwycięzca +333 | cap = explicit = null; miasta 0; ofiara 0; zwycięzca +333 = 333; errors [] | j.w. (+333 = 333) | j.w. (+333 = 333) | PASS dla zmierzonych pól (asercje); relacje, lista cywilizacji, ledger, zwycięstwo NIE ZMIERZONO |
| S5. Round-trip zapisu po buncie i po przejęciu | po buncie: [city5, city45, 555, 777] = przed; po przejęciu: [city46, city46, 0, 1332] = przed | po buncie i po przejęciu identyczne (właściciel 2) | po buncie i po przejęciu identyczne (właściciel 3) | PASS (asercje, ×3) |

Konsola: `errors` puste we wszystkich trzech biegach (`CAPCONQ-PASS`).

Uwagi do tabeli:
- Pkt 1 i 4: liczby (777, 333) są wartościami wpisanymi przez `setTreasury`, czyli wejściem scenariusza, a nie wynikiem losowym. Ziarna 4242, 7 i 11 dały te same liczby; różnią się właściciel S5 i identyfikatory miast (np. S5 `city44`/`city45`, stolica po S2b `city42`/`city43`). Ziarna nie dały niezależnych geometrii miast i nie są dowodem niezależności pomiaru.
- Pkt 2a: po buncie `cap` przechodzi na miasto zastępcze, przy zachowanym jawnym wpisie; po `siegeSurrender` miasto wraca do właściciela i `cap` = `explicit`.
- Pkt 2b: wynik jest zgodny z tym, co silnik robi przy kapitulacji oblężenia. Czy odbicie powinno zwracać łup zdobywcy lub przywracać stolicę — to zamierzenie do potwierdzenia przez orkiestratora. Kod nie zmieniony.
- Pkt 4, surowce: `__ledgerRealPathDebug.stock` zwrócił puste obiekty dla obu stron w tym scenariuszu (brak surowców w magazynach), więc wzoru przejęcia surowców/Spichlerza/Pracy (Zdarzenie 2) ten bieg nie testuje.

## Nie zmierzono (z powodami i próbami)

- **Pkt 3 (podbój armią):** nie wykonano. Istniejący hak `__ledgerRealPathDebug.loot` wywołuje `applyMapBattleOutcome` (łup z bitwy), nie zdobycie miasta przez armię. Hak `startSiege` ustawia oblężenie, ale zdobycie idzie przez `siegeSurrender` (ta sama funkcja co kapitulacja), nie przez atak armii. Nie znaleziono w civTest haka, który uruchamia przechwyt miasta z main.ts ~19286 / ~41565 bez pełnej bitwy 3D. Nie dodawano nowego haka (dispatch: najwyżej jeden, tylko gdy konieczny; punkt 1 i S5 pokrywają tę samą funkcję przejęcia). Ryzyko: kolejność wywołań przy walce może różnić się od oblężenia; niezweryfikowane na żywo.
- **Pkt 4, pola relacyjne:** lista cywilizacji, relacje dyplomatyczne po eliminacji, warunek zwycięstwa i ledger nie są odczytywane. W `main.ts` nie ma haka odczytu relacji (`getDiploRelation` jest tylko wewnętrzne); dodanie haka wykraczałoby poza zmiany dozwolone w tej rundzie (tylko gdy odtworzono błąd gry).
- **Pkt 4, surowce (Zdarzenie 2):** zob. uwagę powyżej; wzór przejęcia surowców/Pracy/Spichlerza nie został zweryfikowany.
- **Maksimum:** przyjęto poziomy z dispatchu jako maksymalne dostępne w grze (Trudny; Wysoki ×4; trudny; trudna; wzrost ON). Nie weryfikowano osobno, czy istnieją wyższe poziomy poza suwakami.

## Bramki (runda 2, zmierzone surowym wyjściem)

- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail.
- `node tools/research-test.cjs`: PASSED: 33 / FAILED: 0 / TOTAL: 33.
- `node tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21).
- `node tools/combat-test.cjs`: exit 0 („All sanity checks passed.”).
- `node tools/ai-test.cjs`: ai-test: 297 passed, 0 failed.
- `node tools/society-breakdown-test.cjs`: 56 OK, 0 FAIL.
- `node tools/capital-capture-test.cjs`: CAPITAL-CAPTURE-TEST OK (107/107).
- `node tools/capital-recapture-stale-designation-test.cjs`: PASS=12 FAIL=0 NIE-ZMIERZONO=1.
- `git diff --check`: czysty.

## Wnioski (bez decyzji o grze)

- Na poziomie dostępnym w tym pomiarze FALA 931 daje skarbiec w całości zdobywcy (wzór Zdarzenia 1), nie zostawia wpisu stolicy po eliminacji ostatniego miasta i nie generuje błędów konsoli. S2, S2b i S5 przechodzą asercjami.
- Nie ma dowodu live dla podboju armią ani dla przejęcia surowców przy eliminacji (Zdarzenie 2) i relacji po eliminacji. Te punkty pozostają NIE ZMIERZONO.
- Zamierzenie zwrotu/odbicia po zdobyciu przez gracza (pkt 2b) wymaga potwierdzenia.
- Zero zmian w `gra/src`; żaden punkt nie dał FAIL wynikającego z błędu gry.
