# 06 — FINAL CONTROL (runda 2)

STATUS: FAIL
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna. Zgodny z `00-dispatch.md` we
wszystkich raportach (Operator r1/r2, Evaluator r1/r2) — brak przesunięcia (§16a pkt 9,
§16b pkt 1).

## Weryfikacja od zera — trzeci, niezależny worktree (`wt-FC-P-BUDOWA-MENU-r2` @ `f36ec7cf`)

Własny bundling esbuild (nie skrypt Evaluatora), własny harness, geometria klastra
**wycięta programowo** z `hud.ts` (regex + balans nawiasów, ta sama technika co test
tematu) — nie przepisana ręcznie; chipy renderowane PRAWDZIWĄ `chip6cHtml`/`chip6cSep`
z `hudChip6c.ts`, ikony stubowane na pusty SVG (geometria chipa niezależna od ikony).
Potwierdzone w kodzie: `.hud-right-cluster` (`hud.ts:578`) `top:16px;right:20px;z-index:320`,
emitowany bezwarunkowo w `renderTopBanners` (`hud.ts:1158`, brak warunku trybu budowy);
`.civ-build-panel` ma `z-index:311` (niższy) i tło niemal nieprzezroczyste w banerze
klastra (`rgba(...,.94/.95)`).

**Siatka 60 punktów, kryterium (c) klikalność + (d) realny `page.mouse.click`, PRZY
zamontowanym `.hud-right-cluster`:** dokładnie **4/60 nieklikalnych** —
`BR175×UI150×640`, `BR200×UI125×640`, `BR200×UI150×768`, `BR200×UI150×640` — **identyczny
zestaw** co raport Evaluatora, niezależnie odtworzony. `hitTag` w 3/4 to `b-wiki`
(przycisk Civpedia klastra), w 1/4 `SPAN` wewnątrz baneru klastra.

**Zrzuty z żywego Chromium (własne, `--shots`):** przy `BR200×UI125×640` panelu budowy
**nie widać wcale** — ekran to baner „TRYB BUDOWY", klaster (Armia/Civpedia/Menu) i stos
WYKONAJ/ZAKOŃCZ TURĘ; przy `BR200×UI150×640` widać jedynie ślad słowa „Fort" spod przycisku
CIVPEDIA. Zgodne słowo w słowo z opisem Evaluatora — potwierdzone wzrokiem (§9 pkt 6a),
nie tylko liczbą.

Dwie dodatkowe, autorskie asercje własnego harnessu (zero pozycji „pod klastrem" wg
elementFromPoint na wszystkich 22 pozycjach, zero nakładania prostokątów panel×klaster)
dały fałszywe alarmy przy dobrych komórkach — zbadane: to pozycje **zwinięte przez własny
scroll panelu** (poza jego klipem), ich geometryczny rect nie odpowiada realnemu malowaniu.
Odrzucone jako artefakt harnessu, nie nowy defekt — jedynym wiążącym kryterium zostaje (c)/(d)
na OSTATNIEJ pozycji, zgodnie z testem tematu i z Evaluatorem.

Nietautologiczność podłogi `max-height` odtworzona samodzielnie: usunięcie `max(MIN,...)`
czerwieni asercję F w 1 komórce (`BR200×UI100×640`, `panelHcss:46 < minNeeded:52`) — podłoga
faktycznie działa i jest jedyną nadal zieloną częścią naprawy.

## Bramki (własne uruchomienia, ten sam worktree)

`tsc --noEmit` 0 błędów; logic 213/213; tech-tree 19/19; research 33/33; unit-replace 13/13;
combat 6/6; `vite build --outDir /tmp/civ-dist-fc-r2` (C-001) OK, `git status` po buildzie
czysty. Test tematu: 30/30 (ślepy na klaster — potwierdzone, jak opisał Evaluator).

## Próbny merge z `origin/main` (bez mergowania do `main`)

`git merge-base origin/main HEAD` = `416733e1` (punkt dispatchu, main nie przesunął się w
tym pliku). `git merge --no-ff origin/main` do tej gałęzi: **bez konfliktów**, dotyczy
wyłącznie plików innych tematów (`R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`, `R-DYPLO-PAKT-WETO-...`,
rejestr) — zero dotknięcia `buildModeHud.ts`. Merge cofnięty (`git merge --abort`), nic nie
scalono. **Rekomendacja:** `R-PRACA-JEDEN-PODZIAL-Q1` (dispatch na `main`, ale sama praca
jeszcze NIE scalona — potwierdzone `git merge-base --is-ancestor` = niefałszywe, exit 1)
dotyka tego samego pliku w innej warstwie (suwaki budżetu). Dziś zero konfliktu, bo tamten
temat nie jest jeszcze w `main`; gdy oba tematy dojdą do integracji, scalać **sekwencyjnie**
i zweryfikować hunk po hunku (§9 pkt 9), nie równolegle.

## Checklista Final Control (§16b)

1. `00-dispatch.md` istnieje, GOAL bez przesunięcia — TAK. 2. ID identyczne we wszystkich
rundach — TAK. 3. Werdykt Evaluatora oparty na artefaktach (własny harness, zrzuty) —
potwierdzone, TAK. 4. `PASS-WITH-NOTES` — nie dotyczy (FAIL). 5. Licznik rund: 2/5 zużyte,
bez cichego resetu (ta sama gałąź od `416733e1` przez cały czas). 6. `REJESTR-PROSB-I-ZADAN.md`
**nadal nie ma wpisu tematu** — rozbieżność ze stanem faktycznym, do naprawienia przez
orkiestratora przy najbliższej okazji (nie blokuje rundy 3, sygnalizowane też przez
Evaluatora). 7. Węzły — nie dotyczy (temat niedzielony). 8. Drobiazgi tekstowe do
micro-fixu integracyjnego — brak znalezionych w tej rundzie.

ZMIANY/COMMIT: brak nowych zmian kodu (Final Control nie edytuje `buildModeHud.ts`/testu).
Oceniany `9c2386fe` (raport Operatora `9baead5b`, Evaluatora `f36ec7cf`). Ten raport:
`dyspozycje/autobot/runs/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1/06-final-control-r2.md`.
TESTY: wyniki własne wyżej — siatka 60×2 kryteria z klastrem HUD (4/60 fail, identyczne z
Evaluatorem), 5 bramek referencyjnych + `tsc` + `vite build`, test tematu 30/30, 1 mutacja
kontrolna, próbny merge bez konfliktów.
BLOKADY: lista całkowicie niewidoczna/nieklikalna w 4/60 komórkach siatki łączonej po
zamontowaniu `.hud-right-cluster`, w tym 2 regresje wobec stanu PRZED naprawą
(`BR200×UI125×640`, `BR200×UI150×640`) — zgodnie z Evaluatorem. Brak wpisu tematu w
`REJESTR-PROSB-I-ZADAN.md` (niebllokujące, do uzupełnienia).
RUNDY: 2/5 (zużyte: r1 FAIL, r2 FAIL). Ostatni werdykt: FAIL (Evaluator r2, potwierdzony
Final Control r2). Decyzja wymagana: brak — mieści się w limicie, Operator idzie do rundy 3
z precyzyjną poprawką Evaluatora (usunąć/ograniczyć ruchomy człon `top`, zostawić podłogę
`max-height`; kryterium odbioru: siatka 60 pkt Z zamontowanym `.hud-right-cluster`, zero
regresji wobec PRZED).
NASTĘPNY KROK: Operator, runda 3, to samo ID i gałąź `autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`.
GOTOWOŚĆ DO INTEGRACJI: **NIE**.
DEPLOY/PUSH: NIE WYKONANO.
