# 06 — FINAL CONTROL (runda 2)

STATUS: PASS-WITH-NOTES
**GOTOWOŚĆ DO INTEGRACJI: TAK.**

DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL (zgodny z `00-dispatch.md`, bez zmian): jeden podział Pracy budynki/ulepszenia,
suma 100%, stosowany dokładnie raz, cap ulepszeń ≤50%, identyczny globalnie i w
mieście, zero duplikatu liczenia, nazwy opisujące realny adresat.

ZMIANY/COMMIT: zweryfikowane `3bd20390` (kod rundy 2 `814fe172`), merge-base z
`origin/main` bieżącym (`5ddf16c6`) = `9c6eef00`. Własny worktree
`/home/user/wt-FC-R-PRACA-PODZIAL-r2`, symlink `node_modules`, żadne narzędzie
Operatora/Evaluatora nieużyte bezpośrednio — wszystko uruchomione od nowa, F1/F3
zmierzone własnym, niezależnie napisanym harnessem/mutantem.

## Trzy blokery rundy 1 — sprawdzone od zera, nie odczytem raportów

**F1 (budżet od skumulowanej puli).** Kod: `main.ts` nie wywołuje już
`pracaPoolInflowByOwner` (grep całego pliku — zero trafień, symbol usunięty
w całości, nie tylko przemianowany). Gracz: `pickAutoImprovements` wywołany bez
`improvementBudgetCap`, z `pracaBudgetPercent: playerUlepszeniaPolicy.pracaAutoPercent`
i `pracaAvailable: playerPracaPool` (skumulowana pula). AI: `aiImprovementBudgetByOwner`
liczone `Math.floor(aiPool * aiPct / 100)` z `aiPracaPoolByOwner` — mapa trwała,
inkrementowana w ciągu tury, nie resetowana przed odczytem (parytet realny, nie
nominalny). Własny pomiar behawioralny na prawdziwym `pickAutoImprovements`
(mapa/miasto zbudowane od zera, bez wglądu w harness Evaluatora):

| pula skumulowana (pct=33%) | 300 | 500 | 5 000 | 50 000 | 1 000 000 |
|---|---|---|---|---|---|
| ulepszeń (mój pomiar) | 2 | 4 | 41 | 75* | 75* |

*saturacja na 75 wynika z mojego mniejszego, jednomiastowego scenariusza testowego
(inny niż Evaluatora) — liczba nasycenia jest artefaktem konfiguracji, nie dowodem;
istotne jest, że NIE JEST zerem przy żadnej wielkości puli. Kontrola negatywna: przy
podstawieniu jako „pula" surowego wpływu tury (3–36, dawna semantyka rundy 1) —
**0 ulepszeń przy każdej wartości**, dokładnie odtworzony stary defekt. Próg zniknął
dla nowej semantyki, kontrola negatywna nadal go odtwarza — pomiar nietautologiczny.

**F2 (nazwy).** `grep -rn "Nadrzędny podział całej puli Pracy imperium"` po całym
`src/ui/` — zero trafień, stary tooltip fizycznie usunięty. Wszystkie trzy panele
(`cityPanel.ts`, `empireDetailPanel.ts`, `buildModeHud.ts`) importują `PODZIAL_PRACY_PULA_LBL*`
z jednego źródła (`game/cities.ts`); `onEmpirePracaSplitChange?: (procentPuliImperium: number)`.
`grep doUlepszen` po `src/` — trafienia wyłącznie w komentarzach historycznych, zero w
kodzie żywym.

**F3 (dowód behawioralny kryterium 5).** Własna mutacja źródła (kopia `src/` +
`imperiumPercentClamped = 0` w `auto-improvements.ts`, uruchomiona przez
`UPP_SRC_DIR` na `praca-jeden-podzial-kontrakt-test.cjs`): **626 OK, 8 FAIL** — w tym
`konsument puli DOSTAŁ Pracę: automat ulepszeń terenu (0 Pracy)` i sześć asercji
„wpływ N Pracy/turę: automat ulepszeń DZIAŁA". Liczba i treść trafień zgadzają się
z F3 z raportu Evaluatora — potwierdzone niezależnym mutantem, nie odczytem jego
wyniku.

## Reszta bramek (wszystkie uruchomione samodzielnie, od zera)

`tsc --noEmit` 0 błędów. 5 referencyjnych: logic 213/213, tech-tree 19/19, research
33/33, unit-replace 13/13, combat 6/6 — identyczne z punktem odniesienia. Bramki
tematu: kontrakt 634/0, real-render 36/0 (z MUT-1/2/3 realnie czerwieniącymi swoje
asercje), budmode-slider-max-real-render 13/0, praca-limit-50 34/0,
praca-miasto-limit-50 33/0, praca-miasto-limit-50-cap 50/0, ulepszenia-praca-percent
28/0, praca-split-ui 25/0, praca-pula-rate-parity 20/0, praca-global-default-live
7/0, ai-praca-split-parity 22/0, praca-cap-migracja-luka 11/0, auto-improvements
45/0, production-overflow 201/0, empire-praca-panel-coverage 15/0 — wszystkie liczby
identyczne z raportem Evaluatora, uzyskane własnym uruchomieniem, nie przepisane.
4 bramki czerwone pre-istniejąco: 57/3, 6/2, 2/7, 4/2 — identyczne, diff tematu ich
nie dotyka (potwierdzone `git diff --stat` poza `empire-panel`, `spichlerz`, `unit-power`).

Diff `9c194567..3bd20390`: 14 plików, wszystkie w allowliście (`ai.ts`, `cities.ts`,
`main.ts`, trzy pliki UI, sześć testów, dwa raporty runu); `git diff --check` czysty,
zero sekretów, zero TODO/FIXME/markerów konfliktu, zero plików poza allowlistą.
Diff `cityPanel.ts`/`empireDetailPanel.ts`/`cities.ts` — czysto addytywny/nazewniczy,
bez usunięć poza tym, czego F2 wymagał. `ai.ts` — wyłącznie aktualizacja komentarza,
logika (`improvementBudgetCap` z `opts`) nietknięta. Odzyskana praca Operatora (awaria
infra) jest kompletna i wewnętrznie spójna — brak martwych odwołań do usuniętego
`pracaPoolInflowByOwner`/`addPracaPoolInflow` (usunięte razem z definicją i WSZYSTKIMI
wywołaniami, sprawdzone grepem), brak fragmentów urwanych w połowie.

**Próbny merge z `origin/main` (bieżącym, `5ddf16c6`, nie ze stałym punktem
rundy 1):** `git merge-tree --write-tree HEAD origin/main` → jedno drzewo, exit 0,
zero konfliktów. Rekomendacja: zwykły `git merge --no-ff`.

## Rekomendacja kolejności integracji (P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1)

Oba tematy dotykają `gra/src/ui/buildModeHud.ts`. `P-BUDOWA-MENU-...-Q1` jest w
rundzie 3 (runda 2 FAIL, nie gotowe do integracji) i gałąź brancha również od
`9c6eef00`. **Zintegrować `R-PRACA-JEDEN-PODZIAL-Q1` do `main` NAJPIERW** — jest
gotowy teraz, a `P-BUDOWA-MENU` i tak wraca do Operatora. Runda 3 tamtego tematu
powinna zacząć od zmergowania świeżego `main` (po tej integracji) do swojej gałęzi,
żeby jej diff na `buildModeHud.ts` liczył się od aktualnego stanu, nie od
`9c6eef00` — unika to podwójnej pracy nad tym samym plikiem i rozjazdu w drugą
stronę.

## Kontrola checklisty §16b

1. `00-dispatch.md` istnieje, GOAL niezmieniony — TAK.
2. ID identyczne we wszystkich rundach — TAK.
3. Werdykt Evaluatora oparty na artefaktach — zweryfikowałem F1 (pomiar), F2 (grep),
   F3 (mutacja) niezależnie, zgodne co do liczb i treści — TAK.
4. `PASS-WITH-NOTES` nie ukrywa GOAL/dowodu/zakresu/§9/gotowości: **sprawdzone
   jawnie** — uwaga 1 (efektywny budżet 33% salda/turę) to nazwana, zamierzona
   konsekwencja decyzji właściciela `Q1=B`, nie defekt GOAL. Uwaga 2 (utrata pinu
   sekcji 13 `production-overflow`) dotyczy WYŁĄCZNIE księgowości mapy usuniętej
   razem z semantyką rundy 1 — właściwość „oba strumienie liczą się raz" nadal
   pokryta behawioralnie sekcjami 1/5/6 tego samego pliku na PRAWDZIWYCH funkcjach;
   nie jest to luka w kryterium 4 dispatchu. Uwaga 3 to przeniesione, znane już z
   rundy 1 sprawy poza zakresem. Uwaga 4 to `DOMAIN: INFRA`, nie `GAME`. Żadna nie
   dotyka GOAL/dowodu/zakresu/§9/gotowości — `PASS-WITH-NOTES` kończy proces pod
   warunkiem zapisania uwag 1–3 jako osobne tematy w rejestrze **przed pełnym
   zamknięciem tematu** (nie przed integracją kodu — orkiestrator wykonuje to przy
   zamykaniu, rejestr nie jest w allowliście GAME tego dispatchu, §9 pkt 4).
5. Licznik rund: 2/5, bez cichego resetu — TAK.
6. `REJESTR-PROSB-I-ZADAN.md`: temat jeszcze bez wpisu — normalne przed integracją
   (rejestr aktualizuje orkiestrator przy zamknięciu, nie Operator w trakcie GAME).
7. N/D (bez węzłów).
8. Gotowość do integracji: **TAK**.

Drobiazgów tekstowych do integration micro-fix w kodzie nie znalazłem — treść diffu
jest czysta, spójna i bez śladów przerwania procesu Operatora. Jedno drobne znalezisko
poza kodem: w katalogu runu leży niescommitowany plik
`04-operator-r2-podzial-pracy-real-render.png`, bajt w bajt identyczny (md5) z
`01-operator-podzial-pracy-real-render.png` rundy 1 — to nie jest świeży zrzut rundy 2
(prawdopodobnie relikt po awarii infra), tylko kopia starego. Nie wpływa na dowód —
real-render rundy 2 zweryfikowałem osobno, uruchomieniem gate'u (36/0, MUT-1/2/3
czerwienią realnie) — ale zostawiam plik nieodebrany (nie commituję go jako rzekomy
dowód rundy 2, żeby nie wprowadzać w błąd); orkiestrator niech go usunie albo podmieni
świeżym zrzutem przy integracji.

BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: integracja orkiestratora (`git merge --no-ff` do `main`, PO niej
`READY_FOR_DEPLOY`); przed dispatchem rundy 3 `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
zmergować świeży `main` do jej gałęzi. Po integracji zapisać uwagi 1–3 Evaluatora
jako osobne tematy w `REJESTR-PROSB-I-ZADAN.md` (§3b).
DEPLOY/PUSH: NIE WYKONANO (deploy i merge do `main` wykonuje orkiestrator osobno,
po tym raporcie; push tego raportu do gałęzi roboczej — tak).
