# 03 — FINAL CONTROL (runda 1)

STATUS: FAIL
**Gotowość do integracji: NIE.**
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
wyłącznie przez zakup za Skarbiec, wspólną ścieżką z graczem. Ustalić, czy dzisiejszy stan
jest regresem wobec FALI 299, i przywrócić kontrakt. (zgodne co do słowa z `00-dispatch.md`
i z GOAL cytowanym przez Operatora i Evaluatora — dryf nie wystąpił.)

Trzeci, niezależny worktree: `/home/user/wt-FC-R-AI-JEDN` (detached `f017047c`) +
`/home/user/wt-FC-BASE` (czysty `origin/main` `a79614db`). Nic z poniższego nie jest przepisane
z raportów Operatora/Evaluatora bez własnego uruchomienia.

## 1. Kontrakt FALI 299 — zweryfikowany u źródła po raz trzeci

Odczytałem `docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md` sam. Cytat zgadza się
dosłownie z oboma poprzednimi raportami: „jednostka jest pozyskiwana wyłącznie przez zakup za
Skarbiec/Pieniądze; nie może być frontem ani wpisem w kolejce budynków finansowanej Pracą.
Zasada obowiązuje gracza, AI i miasta-państwa." Rozstrzygnięcie „kupuje ZAMIAST budować"
potwierdzam. Punkt 2 dispatchu — spełniony, bez `DECISION_REQUIRED`.

## 2. Pomiar i bramki — odtworzone niezależnie, zero rozbieżności

`node tools/ai-jednostki-tylko-zakup-test.cjs`: **23/23**, liczby identyczne z oboma raportami
(major AI: 24 proponowane / 0 do kolejki Pracy / 24 kupione, armia 24; MP: 1/0/1, armia 1).
5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33
(ALL GREEN), `unit-replace-test` 13/13, `combat-test` 6/6. `tsc --noEmit` 0 błędów. `vite build`
(binarka z `node_modules`, `--outDir` poza repo) 848 modułów, OK. Uruchomiłem **wszystkie** 33
bramki `ai-*` + 3 powiązane (`rekrutacja-skarbiec-only`, `ai-rekrutacja-parytet`,
`surrender-rekrutacja-build-gate`) — wynik identyczny co do liczby z raportem Evaluatora na
gałęzi **i** na czystym `origin/main` (`wt-FC-BASE`): cztery czerwienie (`ai-test` 285/8,
`ai-recruit-upkeep-gate-test` 18/9, `ai-balans-step3-test` 7/1, `promote-to-front-test` 121/4)
identyczne po obu stronach — **potwierdzam: pre-istniejące, zero regresji.**

## 3. Kryterium 4 (armia AI) — zmierzone samodzielnie, na realnych funkcjach

Własna sonda na `sanitizeBuildQueue`/`advanceProduction` (nie mock), dokładnie odtwarzająca
zrzut właściciela („Wojownik, Koszt 40, Zebrana Praca 2/40"):

```
PRZED (bez guardu): {"unitsCompletedFromPraca":1,"refunded":0}
PO    (z guardem):  {"unitsCompletedFromPraca":0,"refunded":2}
```

Fakt jest realny i naprawa go zamyka. Sprawdziłem też kolejność w `main.ts`: guard wykonuje się
**przed** blokiem `AUTO-MANAGE (STEP D)`, którego komentarz mówi wprost „Apply auto-enqueue
suggestion (**only when queue is empty**)" — bez guardu jednostka-widmo blokuje nowe decyzje
budowy dla tego miasta przez kilka tur, z guardem miasto wraca do normalnej kadencji w tej samej
turze. To silniejszy dowód niż sam bilans Pracy: guard nie tylko księguje, odblokowuje decyzję AI.
Dla stanów osiągalnych z dzisiejszego kodu (bez zaszczepionej legacy kolejki) `PRZED`=`PO` co do
każdej zmierzonej wartości — zero ryzyka. Scenariusz „AI bez dochodu → armia 0 po 40 turach" jest
identyczny z guardem i bez (zmierzone), więc to ryzyko kontraktu FALI 299, nie tej zmiany.
**Kryterium 4: brak `BLOCK`, potwierdzam ocenę Operatora/Evaluatora.**

## 4. Próbny merge — czysty na obu frontach

`origin/main` (`a79614db`) + gałąź tematu (`f017047c`): `git merge --no-ff` bez konfliktu.
Na to dodatkowo `git merge --no-ff` gałęzi równoległej `autobot/R-PRACA-JEDEN-PODZIAL-Q1`
(`1f158649`, tylko lokalna, jeszcze nie na `origin` — sprawdzone `git ls-remote`): **auto-merge
bez konfliktu**, zero znaczników `<<<<<<<`. Hunk tego tematu (`main.ts:26674`, tuż po
`prod0 = cityProd.get(cid)...`) i hunki drugiego tematu (`main.ts:~26354` nowa mapa przed pętlą
miast, `~26759/26780` `addPracaPoolInflow`) leżą w tej samej pętli `for (const city of cities)`,
ale na rozłącznych liniach. Po połączonym mergu: `tsc --noEmit` 0 błędów,
`ai-jednostki-tylko-zakup-test` 23/23, `ai-praca-split-parity-test` 20/20 (drugi temat rozszerzył
ten plik — nie konflikt, ewolucja własnego testu). **Rekomendacja dla orkiestratora: merge w
kolejności dowolnej, `--no-ff` od właściwego `merge-base` per gałąź (§9 pkt 9) — rozstrzygalne,
integracja nie wymaga ręcznego rozjazdu.** Nie scaliłem do `main` — tylko próba w scratch-branchu,
usuniętym po sprawdzeniu.

## 5. Dlaczego `FAIL`, nie `PASS-WITH-NOTES`

Dwie uwagi Evaluatora (N1, N2) dotykają dokładnie kategorii z §3b/§16b(4): **dowód** i
**zakres**. Zweryfikowałem obie samodzielnie, nie na słowo:

**N1 — dowód.** Zmutowałem `main.ts` (usunąłem hunk) sam: `ai-jednostki-tylko-zakup-test`
czerwienieje wyłącznie na `C2`/`C3` — dwóch `regex`-ach dopasowujących własny tekst hunku, nie na
żadnej z 21 asercji behawioralnych. Potwierdzam: bramka nie ma **własnej, zacommitowanej**
asercji behawioralnej na scenariuszu, który realnie naprawia (kolejka zaszczepiona jednostką).
Mój §3 wyżej to dowodzi ad-hoc, ale ad-hoc w raporcie nie jest dowodem (§1b) — musi wejść do
`ai-jednostki-tylko-zakup-test.cjs` jako sekcja `D` z asercją `unitsCompletedFromPraca: 1→0` /
`refundedPraca: 0→2` na dokładnie tym seedzie. Nie wprowadzam tej poprawki sam — to praca
Operatora rundy 2, z gotową, zweryfikowaną liczbą do wpisania.

**N2 — zakres.** Allowlista dispatchu: `main.ts` — „WYŁĄCZNIE miejsca wołające
`chooseCityProduction`/`shouldAIRushBuyUnit`/`decideDefensiveCopyTurn` / ścieżkę zakupu
(`purchaseRecruitmentUnit`, `tryDeductUnitSpawnCostsEmpire`)". Hunk nie woła żadnej z tych
funkcji — stoi w ticku produkcji per-miasto, **przed** blokiem auto-zarządcy (obsługuje
zarówno major AI, jak i miasto gracza z włączonym Zarządcą przez UI — potwierdzone czytaniem
kodu, §3). To realna, zmierzalna literalnie lokalizacja poza wymienioną piątką, nie
naciąganie interpretacyjne. Zachowanie gracza jest **bezpieczne** (zmierzone: PRZED=PO), ale
literalna zgodność z allowlistą — nie. To dokładnie „defekt dotykający zakresu" z instrukcji
mojego zlecenia, nie kosmetyka. Wymaga albo (a) przeniesienia guardu na jedno z wymienionych
miejsc, jeśli technicznie możliwe, albo (b) jawnego rozszerzenia allowlisty przez orkiestratora
w poprawionym dispatchu rundy 2 — nie cichego zaakceptowania przez Operatora.

Żadna z pozostałych uwag Evaluatora (N3 duplikat helpera, N4/N5 ścisłość opisu, N6 fantom
`'sredni'`, N7 harness bez artefaktu) nie dotyka GOAL/dowodu/zakresu/§9 wprost — są kosmetyczne.
Sprawdziłem, że w diffie i w raporcie tego rundy **nie ma żadnego tekstowego drobiazgu do
poprawienia przeze mnie** (komentarz hunku i komunikat `console.warn` są ścisłe i zgodne z
kodem) — nie ma więc tu miejsca na „integration micro-fix"; oba blokery są merytoryczne i
wracają do Operatora.

## 6. Granice §9 — żadna nie naruszona

Zero `npm run build`/`dev` w `gra/` (build wyłącznie przez `node ./node_modules/vite/bin/vite.js`,
`--outDir` poza repo); zero `git add -A`; zero sekretów w diffie; brak zmiany procesu w
allowliście produktowej; `WERSJE.md` i `playbook.json` nietknięte; brak deploy/push do `main`;
`merge-base` ustalony jawnie (§9 pkt 9), nie naiwny diff; żaden worktree nie usunięty bez
sprawdzenia (usunąłem wyłącznie własny, tymczasowy, lokalny scratch-branch trial-merge, nigdy
niepushowany). ID identyczne we wszystkich trzech raportach, licznik rund nie został cicho
zresetowany. `dyspozycje/REJESTR-PROSB-I-ZADAN.md` nie ma jeszcze wpisu dla tego tematu — zgodnie
z normą (wpis powstaje przy zamknięciu przez orkiestratora), sprawdzone też na sąsiednim
w locie temacie równoległym — ten sam wzorzec, nie defekt.

ZMIANY/COMMIT: brak nowego commitu kodu — Final Control nie wprowadza zmian w `gra/src/**`
ani `gra/tools/**` (żaden znaleziony problem nie kwalifikuje się jako drobiazg tekstowy do
samodzielnej poprawki). Ten raport: `03-final-control.md`, gałąź
`autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`, na `f017047c`.

TESTY: patrz §2–§4 wyżej — wszystko uruchomione niezależnie w `wt-FC-R-AI-JEDN`/`wt-FC-BASE`,
zero rozbieżności z raportami Operatora/Evaluatora, zero regresji względem czystego `origin/main`.

BLOKADY: **N1 (dowód)** — brak zacommitowanej asercji behawioralnej na scenariuszu legacy;
liczby do wpisania podane w §3/§5 wyżej. **N2 (zakres)** — hunk poza literalną allowlistą
`main.ts`; wymaga decyzji orkiestratora (rozszerzyć allowlistę jawnie w dispatchu, albo
przenieść guard na wymienione miejsce). Żadna z nich nie jest defektem gry — kod działa
poprawnie i bez regresji — ale obie zatrzymują integrację zgodnie z §3b/§16b(4).

RYZYKO ZAGŁODZENIA AI (kryt. 4): zmierzone samodzielnie, brak `BLOCK` — patrz §3.

TEMAT RÓWNOLEGŁY: próbny połączony merge z `autobot/R-PRACA-JEDEN-PODZIAL-Q1` czysty — patrz §4.
Rekomendacja: integrować oba w dowolnej kolejności przez `--no-ff` od właściwych `merge-base`,
bez ręcznego rozjazdu.

RUNDY: 1/5 zakończona `FAIL` na Final Control; kolejna próba to runda 2/5 na tym samym ID i
tej samej gałęzi (§3a — nie nowe ID, nie nowa gałąź).
NASTĘPNY KROK: Operator, runda 2 — wyłącznie (1) dopisać sekcję `D` do
`ai-jednostki-tylko-zakup-test.cjs` z asercją behawioralną na scenariuszu legacy (liczby: §3/§5
wyżej), (2) rozstrzygnąć N2 — przenieść guard na wymienione miejsce allowlisty albo uzyskać
jawne rozszerzenie allowlisty od orkiestratora w poprawionym dispatchu. Żadna inna zmiana kodu
nie jest wymagana — logika, testy referencyjne, parytet i bramki AI są już poprawne.
DEPLOY/PUSH: NIE WYKONANO.
