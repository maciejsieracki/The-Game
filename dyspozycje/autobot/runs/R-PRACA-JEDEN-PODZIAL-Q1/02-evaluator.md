# 02 — EVALUATOR (runda 1)

STATUS: FAIL
DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL: **Jeden** podział Pracy budynki/ulepszenia, sumujący się do 100%, stosowany
**dokładnie raz**, cap ulepszeń ≤50%, identycznie globalnie i w mieście; usunięty
duplikat liczenia; nazwy opisują to, czym rzeczy naprawdę są.
(GOAL zgodny z `00-dispatch.md` co do słowa — §16a pkt 9 bez zastrzeżeń.)

ZMIANY/COMMIT: oceniane `fecfb5df` (kod: `1f158649`), merge-base `6e3e872e` (§9 poz. 9).
Własny worktree `/home/user/wt-EVAL-R-PRACA-PODZIAL`, własny harness, nie bramki Operatora.

## Co ZMIERZYŁEM zielono (własnym harnessem, 18 601 asercji / 0 FAIL)

- Siatka 51 wartości podziału × 61 wielkości Pracy: `doBudynkow + doPuli = total` **zawsze**;
  `2 × doPuli ≤ total` **zawsze**; odchyłka od nominalnego % ≤ 0,5 jednostki Pracy.
- Domyślne 70/30 przy 10 Pracy → **30%** (dispatch mierzył 0%); maksimum 50/50 → **50%**
  (dispatch mierzył 20%). Warstwa podziału jest naprawiona.
- >50% na ulepszenia **nieosiągalne**: clamp (−500…500), `podzialPracyZProcentuPuli`,
  zapis (`resolveCityPodzialPracy` z zapisem 5%/−999), override miasta, migracja — wszystkie
  ścinają do ≥50% budynków.
- Pkt 5 (override): zapala się sam przy różnicy od globalnej, gaśnie przy powrocie,
  także po sclampowaniu wartości. W UI pin zapala się w tym samym ticku (`rerender()`).
- Duplikat **faktycznie zniknął**: `splitEmpirePracaBudget`, `allocateEmpirePracaToBuildings`,
  `applyEmpireBuildingBudget`, `EmpirePracaSplit`, `clampPracaWspolnyWorekPercent` — brak
  w eksportach i w źródle; `turn-economy.ts` ma dokładnie 2 wywołania `splitPraca`.
- `manpower.ts` nie zawiera słowa „Praca" — korekta Operatora do pkt 8 dispatchu jest trafna.
  Pozostali konsumenci puli (cuda, zakładanie miasta, wycinka, ręczne ulepszenia, utrzymanie)
  obecni i lepiej finansowani.
- `tsc --noEmit` czysty; `vite build --outDir /tmp/civ-dist-eval-rpjp` ✓ (C-001).
- Uruchomione przeze mnie: 12 bramek Pracy/ekonomii + 5 referencyjnych — wszystkie zielone
  (kontrakt 600/0, real-render 35/0, logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6). Mutacja ŹRÓDŁA (cap 50→40) czerwieni bramkę tematu
  (17 FAIL) i mój harness — nietautologiczność capu potwierdzona.
- Allowlista czysta, brak naruszenia §9, brak sekretów, `gra/data/**` i `WERSJE.md` nietknięte.

## Dlaczego mimo to FAIL

**F1 (blokujące) — budżet ulepszeń przepisany z SALda puli na PRZYROST tury tworzy próg,
poniżej którego powstaje ZERO ulepszeń, niezależnie od wielkości puli.**
`playerImprovementBudget = pracaPoolInflowByOwner.get(0)` (main.ts:26993) to mapa tworzona
od nowa w każdej turze — bez przeniesienia niewykorzystanej reszty. Picker kupuje ulepszenie
tylko gdy CAŁY koszt mieści się w capie (`auto-improvements.ts:428`), a najtańsze dostępne
graczowi ulepszenie to `droga` = 30 Pracy (`farma` = 40, po `R_STAWKI_FALA2_MULT`).
Pomiar na prawdziwym `pickAutoImprovements`:

| przyrost do puli / turę | pula skumulowana | ulepszenia |
|---|---|---|
| 6 / 9 / 12 / 20 / 24 / 36 | 500 | **0** |
| 12 | 500 / 5 000 / 50 000 / 1 000 000 | **0** |
| próg | dowolna | **40 Pracy przyrostu w JEDNEJ turze** |

Dla porównania semantyka sprzed zmiany (cap = 33% salda): pula 300 → 2 ulepszenia,
500 → 4, 1000 → 8. Przy domyślnych 70/30 próg 40 wymaga ~14 miast po 10 Pracy;
przy 50/50 — 8 miast. Dotyczy gracza w trybie „auto" **i AI** (ta sama ścieżka,
`aiImprovementBudgetByOwner`), więc kryterium 3 („do ulepszeń trafia X% Pracy") jest
spełnione na warstwie podziału, a **nie** na skutku — objaw, dla którego temat powstał,
wraca w nowej postaci. Dodatkowo jest to sprzeczne z udokumentowaną decyzją właściciela
`R-AUTO-PRACA-BUDZET-PROCENT-Q1=B` („liczonym od SKUMULOWANEJ puli… NIE od przyrostu"),
której komentarze w `auto-improvements.ts` **zostały nietknięte** i opisują teraz
zachowanie, którego silnik nie ma. Operator sam zgłosił to jako pytanie (a) do właściciela
— to jest `DECISION_REQUIRED`, nie `PASS`.

**F2 (blokujące) — pkt 6 niedokończony w panelu imperium.** Ta sama liczba ma znowu trzy
nazwy: `cityPanel` „Ulepszenia (pula imperium)", `buildModeHud` „Ulepszenia — pula imperium",
`empireDetailPanel` **samo „Ulepszenia"** (hero, obie etykiety, MIN/MAX), a jego tooltip
(`empireDetailPanel.ts:1306`) wciąż mówi „**Nadrzędny podział całej puli** Pracy imperium" —
opisuje USUNIĘTY drugi podział, nie podział Pracy miasta NA pulę. Do tego
`buildModeHud.ts:80`: `onEmpirePracaSplitChange?: (procentUlepszenia: number)` — parametr
nazwany „ulepszenia" niesie % puli imperium, czyli dokładnie wzorzec `doUlepszen = doPuli`,
dla którego ten temat istnieje. Wszystko w plikach z allowlisty, których Operator dotykał.

**F3 (blokujące jako dowód) — kryterium 5 nie jest zmierzone.** „Konsumenci puli działają
dalej" jest w bramce tematu udowodnione wyłącznie regexami po tekście `main.ts`
(`praca-jeden-podzial-kontrakt-test.cjs:236-247`) — linia `playerPracaPool -= pick.kosztPraca`
istnieje i asercja świeci, choć zmierzone zachowanie to 0 wywołań. Dwa „dowody
nietautologiczności" w tej samej bramce są samospełniające się:
`ok(!/…/.test('') === true, …)` (linia 231) oraz test regexa na stringu, do którego
dopisano szukany wzorzec (linia 229).

## Uwagi (niepodważające, zmierzone)

1. `production.ts:1929` twierdzi, że wstrzymana kolejka oddaje CAŁĄ Pracę do puli — silnik
   oddaje **0** (`main.ts:26754` `if (econTick && !prodPaused)`). Zachowanie zastane, komentarz nowy i nieprawdziwy.
2. Pusta kolejka → 100% Pracy miasta do puli, czyli budżet ulepszeń >50% Pracy tego miasta.
   Nie jest to żaden z trzech wektorów kryterium 2 i jest sensowne, ale powinno być nazwane w kontrakcie.
3. Migracja legacy (`main.ts`, gałąź `!savedPodzialPracy?.length && legacy`) nadpisuje wartość
   wyliczoną przez `migratePodzialPracyOnLoad` z pól per-miasto (zmierzone: 90/10 → 50/50).
   Nieosiągalne dla realnych zapisów (pole kanoniczne serializowane od 2026-08-17, legacy od 2026-08-19) — usterka teoretyczna.
4. `toggleCityPodzialPracyOverride` zostawia override=true przy wartości równej globalnej, czego reguła automatyczna by zgasiła — dwie reguły na jednej kontrolce.
5. Zmiana domyślnego udziału 33%→30% jest jawna i uzasadniona; bez zastrzeżeń.
6. Raport Operatora ~950 słów wobec ~400 z §11.

## Precyzyjna poprawka na rundę 2 (jeden temat, ta sama gałąź, to samo ID)

Zachować jeden podział bez zmian. Zamienić **cap jednej tury** na **kopertę narastającą**:
przenosić niewykorzystaną resztę `pracaPoolInflowByOwner` na następne tury (envelope rośnie
o wpływ, maleje o faktyczny wydatek pickera, ograniczony saldem puli) — wtedy „X% Pracy idzie
na ulepszenia" jest nadal prawdą co do jednostki, a uzbieranie 30–40 Pracy na jedno ulepszenie
znów jest możliwe. Envelope musi wejść do zapisu (save/load) i mieć bramkę behawioralną:
realistyczny przyrost (np. 12/turę) po N turach daje ≥1 pick. Równolegle: dokończyć pkt 6
w `empireDetailPanel.ts` i `buildModeHud.ts:80`, zaktualizować komentarze
`auto-improvements.ts` do faktycznej semantyki, zastąpić regexowe asercje konsumentów
co najmniej jedną asercją zachowania i usunąć dwie samospełniające się „mutacje".
Jeżeli właściciel woli wrócić do capu liczonego ze skumulowanego salda — to pytanie ABC
(skutek dla gry), nie decyzja Operatora.

TESTY: wklejone wyżej — własny harness 18 601/0; pomiar progu na `pickAutoImprovements`
(0 picków dla przyrostu 6–36 przy puli do 1 000 000; próg 40); 12 bramek Pracy + 5
referencyjnych zielonych; real-render 35/0; mutacja źródła 50→40 czerwieni bramkę tematu
(17 FAIL) i mój harness; `tsc` czysty; `vite build` ✓.
BLOKADY: F1 wymaga decyzji właściciela ALBO przebudowy budżetu na kopertę narastającą.
RUNDY: 1/5.
NASTĘPNY KROK: Operator, runda 2 — poprawka wyżej, to samo ID, ta sama gałąź.
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej z tym raportem — tak; deploy — nie).
