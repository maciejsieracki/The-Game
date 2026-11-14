# R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK (częściowo wykonane; martwy punkt Spichlerza NIE rozwiązany — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: blokada „Zakończ turę” decyduje wyłącznie o prognozie po turze, od tury 1; reakcja automatu przed oceną; brak dźwigni = brak blokady; propozycja podatku do zera jako stabilne API.
BAZA: edaba111f3680868af2135e36dc3f1d6423e4068 (origin/main). Gałąź wynikowa: detached, commit w sekcji ZMIANY-COMMIT.

## ZMIANY-COMMIT

Allowlista wykonana: `gra/src/game/no-negative-stocks.ts`, `gra/src/main.ts` (WYŁĄCZNIE ścieżka bramki: import, `_nnsPodatekPunkty`, usunięcie strażnika tur, przekazanie `podatekPunkty`), `gra/tools/no-negative-stocks-*` (aktualizacja asercji), nowy `gra/tools/end-turn-gate-projection-only-test.cjs`, `docs/encyklopedia/pojecia/spichlerz.md`, ten raport. Nie dotknięto: dochodów/kosztów, równoważenia AI (`NNS_AI_BALANCE_TURN_MIN` bez zmian), `ai-params.json`, kolejki produkcji, WERSJE.md, gra-robocza/, rust-port/.

Zmiany w kodzie:
1. `evaluateEndTurnStocks`: blokada = prognoza po turze < 0 (dla skarbca i spichlerza), bez wyjątku tur 1–10 i bez porównania ze stanem obecnym. Pola `wyjatekTur` / `wyjatekStarego` zostają w typie, zawsze `false`.
2. `decideEndTurnGate`: nowe pole wejściowe `extra.automat = { skarbiecPo?, spichlerzPo? }` (prognoza PO reakcji automatu, oceniana PRZED blokadą). Wynik rozszerzony o `zasob`, `prognoza`, `propozycjaPodatku`, `automatPoprawil`. Zachowany brak dźwigni = brak blokady.
3. Nowa czysta funkcja `propozycjaPodatkuDoZera(brak, punktyDostepne, zyskPelny)` → `{ punktyProcentowe, szacunek: 'liniowy', maksPunktow } | null` (null gdy pełny podatek nie wystarcza).
4. Komunikat bramki: „po zakończeniu tury zabraknie …” (wcześniej „po turze”).
5. `main.ts`: usunięty warunek `turn > NNS_WOLNE_TURY` przy liczeniu dźwigni podatku/racji gracza; dodane `_nnsPodatekPunkty` (= altSplit.procentPieniadz − meSplit.procentPieniadz) przekazywane jako `podatekPunkty`; usunięty nieużywany import `NNS_WOLNE_TURY` (stała nadal używana przez AI w no-negative-stocks.ts).

Zaktualizowane istniejące testy (każdy z powodem):
- `no-negative-stocks-test.cjs`: punkt 1 (tury 1/5/10 zwolnione → teraz blokowane), punkty 5 i 6b (`wyjatekStarego` → prognoza < 0 blokuje). Powód: stara reguła wyjątku tur 1–10 i „starego zapisu” jest uchylona decyzją właściciela.
- `no-negative-stocks-endturn-test.cjs`: (a2) tura 10 → blokada; (d) stary zapis z prognozą < 0 → blokada. Powód jw.
- `no-negative-stocks-end-turn-gate-levers-test.cjs`: (d) tura 10 z dźwignią podatku → blokada. Powód jw.
- `no-negative-stocks-projection-test.cjs`: S8 tura 3 → blokada. Powód jw.
- NIEZMIENIONE: `no-negative-stocks-c2-test.cjs` (AI 1–10), `no-negative-stocks-ai-test.cjs`.

Nowy test `gra/tools/end-turn-gate-projection-only-test.cjs` (20 asercji): obecny<0 + prognoza≥0 → brak blokady (tury 1 i 20); prognoza<0 → blokada z komunikatem i dźwignią (1 i 20); zmiana podatku (prognoza≥0) znosi blokadę; brak dźwigni → brak blokady (tury 1 i 20); Spichlerz obecny<0 + prognoza≥0 → brak blokady; automat naprawia → brak blokady; automat za mało → blokada z prognozą po automacie; bez automatu → blokada z racjami; propozycja podatku (brak 5, 10 pkt = 20 złota → 3 pkt; za mało → null); stary zapis z prognozą<0 → blokada.

## TESTY (liczby z surowego wyjścia)

- `npx tsc --noEmit` → exit 0, bez błędów (po ostatniej zmianie).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`.
- `node tools/research-test.cjs` → `ALL GREEN`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `All sanity checks passed.`
- NNS: no-negative-stocks-test 25/0; -endturn-test 19/0; -end-turn-gate-levers-test 34/0; -projection-test 49/0; -c2-test 43/0; -ai-test 8/0; end-turn-gate-projection-only-test 20/0.
- Czerwony na bazie (dowód): nowy test uruchomiony na `edaba111` (`no-negative-stocks.ts` z bazy): 8 linii `FAIL:` i wyjście z błędem (brak `propozycjaPodatkuDoZera`). Log: scratchpad `red-base.txt`.
- NIE_ZMIERZONO: osobna mutacja „usunięcie uwzględnienia automatu” (nie wykonano; pokrycie logiczne przez przypadek 6a/6b).
- `git diff --check`: NIE_ZMIERZONO w tej rundzie (nie uruchomiono po ostatniej edycji).

## BLOKADY

1. MARTWY PUNKT SPICHLERZA (Dodatek 2) NIE ROZWIĄZANY. Przyczyna w kodzie: prognoza bramki gracza (`main.ts` ~22892–22930, `projectEmpireFoodAfterTick` na `preview` econ) NIE uwzględnia auto-korekty racji, która działa w tickcie końca tury (`main.ts` ~40060–40135: `autoBalanceRationsToSolvency` dla właścicieli z `autoWyzywienie`, potem `refreshEconomyFoodTotals`, dopiero potem `advanceEmpireFood`). Bramka więc blokuje tury, które automat by naprawił. Wejście `extra.automat` jest gotowe w API, ale `main.ts` go NIE wypełnia. Dopóki to nie jest zrobione, gracz nadal może mieć zablokowaną turę przy Spichlerzu < 0 z włączonym Auto-Żywieniem. Ten punkt jest priorytetem następnej rundy.
   - Wyzwanie techniczne: auto-korekta mutuje `poziomRacji` i zależy od `econ.perCity`, `spichlerzByCityForAuto`, `popCapByCityId` i `kosztArmii` z kontekstu tury. Wymaga odtworzenia tych danych w `refreshLiveEmpireRatesUnsafe` na kopiach miast (snapshot/restore racji jak przy dźwigni racji) i klona econ. Nie zrobiono — ryzyko błędnej prognozy bez pomiaru w grze.
2. AUTOMAT DLA SKARBCA (Dodatek 3, krok 1): nie ma istniejącego automatu korygującego pieniądze w końcu tury — wg dispatchu odnotowuję, że nie zaimplementowano (krok 2 = pytanie o podatek działa już w API).
3. Pytanie/okno z przyciskiem „Zwiększ podatek do X%” — poza zakresem (temat R-WEB-UI-END-TURN-BLOCK-EVENT-Q1); API: `NnsGateResult.propozycjaPodatku`, `zasob`, `prognoza`, `dzwignie`, `komunikat`.
4. Propozycja podatku jest ESTYMACJĄ LINIOWĄ z pełnej dźwigni podatku (`podatekSkarbiec` / `podatekPunkty`). Nie ma osobnej projekcji po podatku — wymaga weryfikacji po ticku w grze.
5. Chromium (zrzuty: skarbiec ujemny + prognoza≥0 → przycisk aktywny; prognoza<0 → zablokowany z tooltipem; Spichlerz + Auto-Żywienie → tura kończy się, Spichlerz ≥ 0 po turze): NIE_ZMIERZONO.
6. Pomiar zgodności projekcji z realnym stanem po endTurn na ≥3 ziarnach, T1–15: NIE_ZMIERZONO.
7. Dokumentacja: zaktualizowano tylko `docs/encyklopedia/pojecia/spichlerz.md` (wzmianka „Tury 1–10”). Regeneracja wikiBundle (`gra/tools/bundle-wiki-for-game.cjs`): NIE_ZMIERZONO (nie uruchomiono w tej rundzie).
8. Stała zasada: po tej rundzie wyjątek „Tury 1–10” dla AI pozostaje (zgodnie z dispatchem: nie ruszać równoważenia AI). Uwaga: dispatch pisze „AI bilansuje od tury 1”, ale w kodzie `NNS_AI_BALANCE_TURN_MIN = 11` (`no-negative-stocks.ts`). Rozbieżność do rozstrzygnięcia przez orkiestratora; nie zmieniano.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch referuje plik `00-dispatch.md` w `origin/main` — w `origin/main` go nie ma (`git show` zwrócił brak ścieżki); treść odczytano z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dodatek) i z pliku źródłowego zgłoszenia cytowanego w dodatku. Nie zakładano sesji ani zadań (zakaz respektowany).
- Lokalnie zainstalowano `gra/node_modules` (`npm ci --ignore-scripts`) w worktree; usunięto po zakończeniu.

## RUNDY

1/5 (Operator, HAIKU 5.5). Kolejna runda: martwy punkt Spichlerza (blokada 1), potem pytanie o podatek (blokada 3) i pomiar (blokady 5–6).

## NASTĘPNY KROK

Runda 2: wypełnić `extra.automat` w `main.ts` (projekcja auto-korekty racji na kopiach miast i klonie econ, z snapshot/restore), dodać testy (a)–(d) z Dodatku 2 i mutację usuwającą automat; następnie pomiar w Chromium.

## DEPLOY/PUSH: NIE WYKONANO
