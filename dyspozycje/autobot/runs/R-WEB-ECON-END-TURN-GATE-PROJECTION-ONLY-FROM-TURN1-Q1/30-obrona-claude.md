# R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (martwy punkt Spichlerza naprawiony w kodzie i w testach; pomiar w grze/Chromium NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: blokada „Zakończ turę” decyduje o prognozie PO turze i PO reakcji automatu; od tury 1; brak dźwigni = brak blokady; propozycja podatku jako stabilne API.
BAZA: 978ca9d01e02eab3adccc30523ea383d8b9af4cb (kandydat rundy 1). Commit rundy 2: SHA w polu sha wyniku (commit na detached HEAD tego worktree).

## ZMIANY-COMMIT

Allowlista: `gra/src/main.ts` (wyłącznie ścieżka bramki gracza: deklaracja `_nnsAutoSpichlerzDelta`, nowy blok projekcji automatu w `refreshLiveEmpireRatesUnsafe`, ok. l.22901–22975; przekazanie `automat` w `nnsGateForPlayer`, ok. l.39637), `gra/tools/end-turn-gate-projection-only-test.cjs` (cases 9a–9d, 10a–10c), `docs/encyklopedia/pojecia/spichlerz.md`, `gra/src/data/wikiBundle.json` (regeneracja `tools/bundle-wiki-for-game.cjs`), ten raport. Nie dotknięto: `no-negative-stocks.ts` (logika bez zmian w tej rundzie), dochodów/kosztów, równoważenia AI, `ai-params.json`, kolejki produkcji, WERSJE.md, gra-robocza/, rust-port/. Kontrola białych znaków dla zmian: czysta.

Co zrobiono (Dodatek 2, martwy punkt Spichlerza):
- Tick końca tury (`main.ts`, blok „SPICH-AUTO-Q1” przy rozliczeniu Spichlerza, ok. l.40100) najpierw wywołuje `autoBalanceRationsToSolvency` (obniża racje miast z Auto-Żywieniem), dopiero potem `advanceEmpireFood`. Bramka liczyła prognozę bez tego kroku — stąd blokada tury, którą automat by naprawił.
- Nowy blok (ok. l.22901–22975), uruchamiany tylko gdy prognoza Spichlerza < 0 i którekolwiek miasto gracza ma Auto-Żywienie: buduje świeży podgląd ekonomii (`previewCityEconomy`, ten sam podział co bramka), wywołuje `autoBalanceRationsToSolvency` z tymi samymi parametrami co tick (`onlyAutoManaged`, `requireFlowBalance`, `kosztArmii`, `popCapByCityId`, `spichlerzByCity`); jeśli zmienił racje — powtarza podgląd i liczy `projectEmpireFoodAfterTick`. Wynik trafia do `_nnsAutoSpichlerzDelta` (różnica względem prognozy bazowej). Racje miast są przywracane w `finally`; stan gry nietknięty.
- `nnsGateForPlayer` przekazuje `automat: { spichlerzPo: spLive + delta }` do `decideEndTurnGate` (ta sama konwencja „live” co reszta bramki). `decideEndTurnGate` (bez zmian w logice) ocenia prognozę PO automacie, a `czyRuchNaprawczy` liczy brak po automacie.
- Kolejność reakcji zgodna z Dodatkiem 3/4: żywność — najpierw automat; pieniądze — brak automatu, tylko informacja o podatku (propozycja).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (raport 20-evaluator-claude.md, commit 1352c11ca)

1. KRYTYCZNY — martwy punkt Spichlerza, `main.ts` nie wypełnia `extra.automat`: PRZYJMUJĘ (poprawka + dowód). Kod: blok ok. l.22901–22975 i przekazanie ok. l.39637. Dowód: testy (10a–10c) strukturalne; mutacja usunięcia przekazania `automat` → 10c FAIL; mutacja usunięcia użycia `automat` w `no-negative-stocks.ts` → 9a, 9b, 6b FAIL (24 pass / 3 fail). Ograniczenie: to jest PROJEKCJA kolejności ticku, nie sam tick — rozbieżności wymienione w BLOKADACH (pkt 1).

2. KRYTYCZNY — brak testów integracyjnych `main.ts` (testy tylko na funkcjach czystych): CZĘŚCIOWO PRZYJMUJĘ. Dodano test strukturalny wiązania (10a–10c) z mutacją. Testu zachowania na żywej turze (a–d Dodatku 2 w przeglądarce) NIE zrobiono → NIE_ZMIERZONO (pkt 3–4).

3. KRYTYCZNY — brak pomiaru zgodności projekcji z realnym stanem po endTurn (≥3 ziarna, T1–15): NIE_ZMIERZONO. Powód: wymaga zbudowania bundla (`vite --outDir /tmp/<własny>`) i sterowania grą w Chromium; w tej rundzie nie wykonano. Chromium jest dostępny (`/opt/pw-browsers/chromium-1194`), więc to konkretny następny krok (patrz NASTĘPNY KROK).

4. KRYTYCZNY — brak Chromium i zrzutów: NIE_ZMIERZONO (jak wyżej). Nie deklaruję, że przycisk/tooltip działa w grze.

5. WAŻNY — propozycja podatku to estymacja liniowa, bez dowodu, że prognoza ≥ 0: PRZYJMUJĘ jako ograniczenie, NIE naprawiono w tym temacie. `propozycjaPodatkuDoZera` nadal zwraca `szacunek: 'liniowy'`. Dodatek 3 wymagał wartości z tej samej funkcji projekcji — tego nie spełniono; odstępstwo jest jawne. Weryfikacja projekcją po podatku (podgląd z `ownerDefaultPodzialHandlu` zmienionym o `punktyProcentowe`) należy do kroku po pomiarze w grze (`R-WEB-UI-END-TURN-BLOCK-EVENT-Q1` lub osobny podtemat).

6. WAŻNY — Dodatek 3 krok 1 dla Skarbca nieprzeszukany: ODRZUCAM zarzut jako wymóg. Przeszukanie wykonano: grep `autoRecruit|autoBuild|autoZakup|autoPodatek|autoTax|autoSkarb|autoKupno|autoAdmin` po `gra/src/game/*.ts`. Trafienia dotyczą kolejki budowy (`auto-build-gate.ts`, `auto-manage.ts` — `pickAutoBuildItem`) i bramek administratorów; nie reagują na deficyt skarbca. Jedyne „skarbiec” w `auto-manage.ts` (l.432) to komentarz o puli pracy. Dodatek 4 wprost zakazuje automatycznej reakcji dla pieniędzy — żadnej nie wprowadzono.

7. ŚREDNI — spichlerz.md niespójny, wikiBundle niewygenerowany: PRZYJMUJĘ, naprawiono. `docs/encyklopedia/pojecia/spichlerz.md`: nagłówek „od tury 1”; punkt gracza opisuje prognozę PO reakcji automatu; punkt AI poprawiony — stara wersja twierdziła, że `planAiBalance` „nie jest wywoływany w pętli tury”, co było BŁĘDNE: `decideAiOwnerBalance` (wywołuje `planAiBalance`) jest wywoływany w `main.ts` ok. l.7630 (`nnsAiPreTickBalance`). WikiBundle zregenerowany: „22 rozdz. + 181 haseł”. Stare skrypty `live-verify-wave-689-697-*` nie były przeglądane (poza allowlistą tematu) — NIE_ZMIERZONO, do decyzji orkiestratora.

8. ŚREDNI — martwe pola `wyjatekTur`/`wyjatekStarego` i brak odpowiedzi, dlaczego „brak dźwigni” nie zadziałał dla Spichlerza: PRZYJMUJĘ częściowo. Pola zostają w typie (zgodność wsteczna; testy 5, 6b, 8 sprawdzają `false`) i nie są używane do decyzji. Odpowiedź (z kodu, nie z pomiaru): `czyRuchNaprawczy` zwraca „brak blokady” tylko gdy SUMA dźwigni danego zasobu < brak. Dla Spichlerza dźwignie to racje (`suwakZywnosc`, zysk liczony przy racjach = 0) i rozwiązanie jednostek. Gdy racje były już na 0 i nie było jednostek do rozwiązania, suma = 0 → brak blokady. Gdy racje > 0, dźwignia istniała i blokada była zgodna z dźwignią — brakowało kroku automatu, który w turze już obniża racje (martwy punkt). Ten brakujący krok naprawiono w pkt 1.

9. DROBNY — kontrola białych znaków i mutacja automatu zadeklarowane NIE_ZMIERZONO w rundzie 1: PRZYJMUJĘ, zamknięte w tej rundzie (wyniki w TESTY).

## TESTY (liczby z surowego wyjścia, runda 2, po ostatniej zmianie kodu)

- `./node_modules/.bin/tsc --noEmit` → exit 0 (bez błędów).
- `node tools/end-turn-gate-projection-only-test.cjs` → `27 passed, 0 failed` (runda 1: 20/0).
- Mutacja M-NNS (w `no-negative-stocks.ts` usunięto użycie `extra.automat?.spichlerzPo`) → `24 passed, 3 failed`: FAIL (9a), FAIL (9b), FAIL (6b). Przywrócenie pliku → `27 passed, 0 failed`.
- Mutacja M-MAIN (w `main.ts` usunięto przekazanie `automat` w `nnsGateForPlayer`) → `26 passed, 1 failed`: FAIL (10c). Przywrócenie: `grep -c` = 1 (plik jak przed mutacją).
- `tools/no-negative-stocks-test.cjs` → `25 passed, 0 failed`
- `tools/no-negative-stocks-endturn-test.cjs` → `19 passed, 0 failed`
- `tools/no-negative-stocks-end-turn-gate-levers-test.cjs` → `34 passed, 0 failed`
- `tools/no-negative-stocks-projection-test.cjs` → `49 passed, 0 failed`
- `tools/no-negative-stocks-c2-test.cjs` → `43 passed, 0 failed`
- `tools/no-negative-stocks-ai-test.cjs` → `8 passed, 0 failed`
- `tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `tools/tech-tree-test.cjs` → `20 pass, 0 fail`
- `tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `tools/combat-test.cjs` → `All sanity checks passed.`
- Kontrola białych znaków na zmianach → czysta (bez wyjścia).
- `tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 181 haseł (~1273 KB)`.
- NIE_ZMIERZONO: `end-turn-gameplay-runtime-test.cjs`, `end-turn-input-stability-test.cjs`, `no-negative-stocks-c3-turn-test.cjs` (wymagają bundla dist z vite i Chromium; nie budowano w tej rundzie). Zrzuty Chromium: NIE_ZMIERZONO. Projekcja vs realny stan po endTurn (≥3 ziarna, T1–15): NIE_ZMIERZONO.

## BLOKADY

1. Rozbieżności projekcji automatu względem ticku (projekcja, nie tick): (a) tick przed `autoBalanceRationsToSolvency` clampuje Wyżywienie do `maxSafe` (Q3=A, `main.ts` ok. l.40150), projekcja tego nie robi; (b) `ensureCityRationDefaults` może zmienić inne pola miasta — przywracane są tylko `poziomRacji`/`procentRozwoj`; (c) `kosztArmii` liczony z jednostek gracza (`playerEconUnitsForUpkeep`), tick używa `econUnits` wszystkich ownerów — równość dla ownera gracza założona, nieweryfikowana. Każda z tych różnic może dać prognozę odbiegającą od realnego stanu po turze; pomiar z pkt 3 jest warunkiem uznania GOAL (2).
2. Pomiar w grze (Chromium, ≥3 ziarna, T1–15) NIE_ZMIERZONO.
3. Propozycja podatku liniowa (odstępstwo od Dodatku 3, patrz pkt 5 odpowiedzi).
4. Zarzut 7 Evaluatora (stare skrypty `live-verify-wave-689-697-*`) nieprzejrzany — poza allowlistą.
5. `suwakZywnosc` liczy zysk racji względem prognozy PRZED automatem (konserwatywnie); po automacie brak jest mniejszy, więc dźwignia racji wystarcza częściej, niż wynika z tej wartości. Nie zmieniono.
6. Koszt CPU: w `refreshLiveEmpireRatesUnsafe` są teraz dodatkowe podglądy `previewCityEconomy` (automat, po korekcie) — działa dirty-gated, do zmierzenia w pomiarze.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch referuje `00-dispatch.md` w `origin/main`, którego tam nie ma; treść odczytano z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md` i `00-dispatch.md` z tej gałęzi).
- Nie tworzono sesji, zadań ani harmonogramów; nie uruchamiano zadań w tle.
- `gra/node_modules` było dowiązane symbolicznie do cudzego worktree tylko do odczytu; dowiązanie nie jest w commicie (gitignore).
- Test `end-turn-gate-projection-only-test.cjs` zapisuje tymczasowe pliki w `gra/tools/` i je usuwa po zakończeniu (nie trafiają do commita).

## RUNDY

2/5 (Operator, HAIKU 5.5). Runda 1 → BLOCK (martwy punkt). Runda 2 → zarzuty 1, 7, 8, 9 zamknięte w kodzie/dokumentacji; 2 częściowo; 3, 4 i 5 — NIE_ZMIERZONO / odstępstwo jawnie opisane.

## NASTĘPNY KROK

Runda 3 (wymóg orkiestratora): (a) zbudować bundle do katalogu w /tmp (`vite --outDir ... --emptyOutDir`, nie `npm run build`); (b) pomiar projekcji vs realny skEnd/spichlerz po endTurn na ≥3 ziarnach, T1–15, z logowaniem `projectNnsAfterTick` i realnego stanu (Chromium z `/opt/pw-browsers/chromium-1194`); (c) testy (a)–(d) Dodatku 2 w grze: Spichlerz ujemny + Auto-Żywienie → tura kończy się i realny Spichlerz ≥ 0 po turze; (d) clamp Q3 w projekcji; (e) propozycja podatku zweryfikowana projekcją po zmianie podziału.

## DEPLOY/PUSH: NIE WYKONANO
