# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Obrona Operatora, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Operator (obrona) · MODEL+EFFORT: Opus 5, effort high
GOAL: odpowiedzieć dowodem z wytworu na każdy z czterech zarzutów Evaluatora rundy 2
(`05-evaluator-runda2.md`) i doprowadzić komplet bramek do zieleni bez tknięcia
jednej liczby balansu właściciela.
IZOLACJA: worktree `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`,
baza `f570a91a301af83c06c3eb2544fd2ce9fb68aabb`.
HEAD przed pracą: `c319bedb` („raport Evaluatora, runda 2"), `git status --short` — czysty
w zakresie plików śledzonych.

## STAN WYJŚCIOWY — dlaczego trzy z czterech zarzutów są już zamknięte w wytworze

Evaluator oceniał commit `54504810`. Zanim jego raport został zapisany, gałąź poszła dalej:
`3d24a86c` (praca Operatora rundy 3: R3-A/B/C/D) i `fba05291` (jego raport). Zarzuty 1, 2 i 3
Evaluator sam opisał jako „rozstrzygnięte ratyfikacją R3-A/R3-B/R3-C" — i faktycznie zostały
wykonane w `3d24a86c`. Nie zasłaniam się tym: dla każdego podaję **własny, świeży dowód
z bieżącego drzewa**, nie cytat z cudzego raportu. Jedyny zarzut wymagający pracy w tej obronie
to zarzut 4.

---

## OBRONA

### OBRONA 1 → PRZYJMUJĘ (zarzut trafny; poprawka jest już w wytworze — dowód niżej)

**Zarzut:** raport rundy 2 twierdził, że mutacja `szczescie_max_pop_wspolczynnik` = 0,04
czerwieni „dokładnie trzy asercje, wszystkie w `szczescie-skala-normalizacja-test.cjs`",
podczas gdy czerwienieje też czwarta — `szczescie-przebudowa-skali-test.cjs:418-419`
(`eq(… .normal, 0.048, '2g: … bez zmian')`) — czyli **własna nowa bramka Operatora**.

**Przyjmuję bez zastrzeżeń.** Pomiar w `04-operator-runda2.md` był niepełny: mierzyłem skutek
symulacji na rodzinie bramek, ale pominąłem bramkę dołożoną w tym samym temacie. Zarzut jest
prawdziwy co do faktu i co do skutku (ratyfikacja R3-A dostała listę o jeden plik za krótką).

**Dowód, że asercja została naprawiona dokładnie tak, jak zażądał Evaluator** —
`gra/tools/szczescie-przebudowa-skali-test.cjs:418-424` (stan bieżący):

```js
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 R3-A (decyzja wlasciciela 2026-09-05) uchyla zapis G13
// „0,048 — BEZ ZMIAN, ZOSTAJE": wspolczynnik to teraz JEDNA liczba 0,04 na wszystkich
// trzech poziomach trudnosci (…); dolozony parytet trudnosci domyka kontrakt G13.
for (const d of ['easy', 'normal', 'hard']) {
  eq(society.szczescie.szczescie_max_pop_wspolczynnik[d], 0.04,
    '2g: szczescie_max_pop_wspolczynnik ' + d + ' = 0,04 (R3-A)');
}
```

Literał `0.048` zniknął, w jego miejsce trzy asercje literałowe `0.04` — jedna na trudność.
Evaluator prosił dodatkowo o asercję `easy === normal === hard`; pętla trzech literałów jest
**mocniejsza** od porównania trzech pól ze sobą: porównanie wzajemne przechodzi także wtedy,
gdy wszystkie trzy zostaną wspólnie przestrojone na inną liczbę, a pętla literałowa nie.
Sam kontrakt „jedna liczba na trzech poziomach" jest przy tym pilnowany osobno, wprost,
w drugiej bramce — `gra/tools/szczescie-skala-normalizacja-test.cjs:406-409`:

```js
eq(wspSz[0] === wspSz[1] && wspSz[1] === wspSz[2], true,
  `R3-A: wspolczynnik Sz JEDEN na easy/normal/hard (${wspSz.join(' === ')})`);
eq(wspSz[1], 0.04, 'R3-A: wspolczynnik Sz = 0,04 (liczba wlasciciela, …)');
```

**Dowód nietautologiczności — mutacja odwrotna, wykonana przeze mnie teraz** (kopia pliku,
przywrócenie z kopii, nigdy `git checkout -- gra/`): `szczescie_max_pop_wspolczynnik.normal`
0,04 → 0,048:

```
[FAIL] 2g: szczescie_max_pop_wspolczynnik normal = 0,04 (R3-A) -- got 0.048, want 0.04
[szczescie-przebudowa-skali-test] 518 OK, 1 FAIL
[FAIL] R3-A: wspolczynnik Sz JEDEN na easy/normal/hard (0.04 === 0.048 === 0.04)
[FAIL] R3-A: wspolczynnik Sz = 0,04 (liczba wlasciciela, …) got 0.048 expected 0.04
[FAIL] tabela: szMax(pop 12, epoka 1) = 44,4 …  got 48 expected 44.4
[FAIL] tabela: szMax(pop 12, epoka 3) = 103,6 … got 112 expected 103.6
[FAIL] R3-A: mnoznik populacji na pop 12 = 1,48x … got 1.6 expected ~1.48
[szczescie-skala-normalizacja-test] 141 OK, 5 FAIL
```

Po przywróceniu: `git diff --quiet gra/data/society-params.json` — czysto.
**To jest dokładnie ta czwarta asercja, o którą szedł zarzut — dziś czerwienieje na komendę.**
Żadnej liczby balansu przy tym nie zmieniłem: mutacja została cofnięta, a stan trwały danych
to `0,04` z ratyfikacji R3-A, czyli liczba właściciela.

**Nauka na przyszłość (do raportu, nie do kodu):** przy pomiarze skutku hipotetycznej zmiany
uruchamiam odtąd **całą listę bramek z kryterium 5 plus bramkę tego tematu**, nie tylko te,
które podejrzewam. Bramka napisana w tej samej rundzie jest częścią rodziny, nie „moim
narzędziem" wyjętym spod pomiaru.

---

### OBRONA 2 → PRZYJMUJĘ (zarzut trafny; stan usunięty — `citizen-resource-upkeep-test` 109/0)

**Zarzut:** na `54504810` bramka `citizen-resource-upkeep-test.cjs` była **107/2** wobec
**109/0** na bazie — kryterium „rodzina zielona" niespełnione.

**Przyjmuję.** Evaluator sam odnotował, że to nie defekt wykonania rundy 2 (plik był poza
allowlistą, zgłosiłem go w BLOKADACH 1 i nie tknąłem), ale stan faktyczny był czerwony i to
jest bezsporne.

**Dowód domknięcia — mój własny przebieg na bieżącym drzewie:**

```
citizen-resource-upkeep :: exit=0 :: citizen-resource-upkeep-test: 109 passed, 0 failed
```

Liczba asercji **nie spadła** (107 + 2 = 109 = 109/0), zgodnie z zakazem osłabiania z R3-B.
Literały pozostały literałami — `gra/tools/citizen-resource-upkeep-test.cjs:213-214`:

```js
eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 2, 'kanon: +2 Szczęście za dostępny surowiec (G8)');
eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, -2, 'kanon: -2 Szczęście za brakujący surowiec (G8)');
```

— a nie porównanie ze stałą symboliczną, którego R3-B zakazał wprost. `-1%` Rozwoju
(`:215`) nietknięte, bo nie było objęte decyzją właściciela.

---

### OBRONA 3 → PRZYJMUJĘ (zarzut trafny; rozjazd kod↔dane usunięty)

**Zarzut:** `SZMAX_DEFAULTS` = 14/20/28 w kodzie wobec `szczescie_max_epoka.normal` =
30/50/70 w danych.

**Przyjmuję.** Zgłosiłem to sam w OBSERWACJACH rundy 2, ale zgłoszenie nie jest naprawą —
w ocenianym stanie rozjazd istniał.

**Dowód domknięcia** — `gra/src/game/society-breakdown.ts:200`:

```ts
const SZMAX_BY_ERA_DEFAULT: readonly [number, number, number] = [30, 50, 70];
```

z komentarzem `:190-199` cytującym R3-C i uzasadnieniem, że to nie zmiana balansu (dane
ładują się statycznie; fallback dotyka wyłącznie ścieżek `society = null`).
Wiązanie kod↔dane jest dziś pilnowane bramką, więc rozjazd nie może wrócić po cichu —
`szczescie-skala-normalizacja-test.cjs` sekcja 2 dokłada asercję
`SZMAX_DEFAULTS === szMaxByEra('normal')` z JSON i łapie rozjazd **z obu stron**
(mutacja od strony kodu i od strony danych — udokumentowane w `05-operator-runda3.md`,
tabela mutacji R3-C i R3-C(2)).

Bramka jest zielona w moim własnym przebiegu: `szczescie-skala-normalizacja-test` **146/0**.

---

### OBRONA 4 → PRZYJMUJĘ i POPRAWIAM TERAZ (jedyna zmiana wytworu w tej obronie)

**Zarzut:** komunikat asercji w `szczescie-skala-normalizacja-test.cjs` niesie nieaktualne
„114,3%", podczas gdy obie strony wynoszą dziś 90,7%.

**Przyjmuję — zarzut jest w pełni trafny.** Dowód, że liczba w komunikacie kłamała, to
własny wydruk bramki (linia diagnostyczna tej samej sekcji 6):

```
  PRZED: Sz 27.22222222222222/30 = 90.7% | Prawo 20/50 = 40%
  PO   : Sz 27.22222222222222/30 = 90.7% | Prawo 20/50 = 40%
```

**Poprawka (jeden znak w jednej linii, plik z allowlisty ratyfikacji rundy 2):**

```diff
-  eq(sz.szPct, szPrzed.szPct, 'zrzut PO zmianie: SzPct bez zmian wobec PRZED (114,3%)');
+  eq(sz.szPct, szPrzed.szPct, 'zrzut PO zmianie: SzPct bez zmian wobec PRZED (90,7%)');
```

(`gra/tools/szczescie-skala-normalizacja-test.cjs:474`; wcześniej `:449` w numeracji
commitu `54504810`, przesunięte przez asercje dołożone w rundzie 3.)

Zakres jest dokładnie taki, jaki wskazał Evaluator: **wyłącznie tekst komunikatu**. Sama
asercja, jej strony i liczba asercji w pliku są nietknięte (146 przed i po). Sąsiedni
komentarz `:466` („SzPct 114,3% -> 90,7%") i `:190` („PRZED … bylo tu … SzPct 114,3%")
zostawiam bez zmian — **tam liczba 114,3% jest poprawna**, bo obie linie opisują stan
sprzed tematu, a nie stan dzisiejszy; ich zmiana byłaby fałszowaniem historii.

**Dowód, że asercja nadal coś mierzy** (mutacja własna: `szczescie_max_pop_odniesienia.normal`
2 → 1, czyli złamanie neutralności startowej; kopia pliku, przywrócenie z kopii):

```
[FAIL] zrzut PO zmianie: SzPct bez zmian wobec PRZED (90,7%) got 87.3 expected 90.7
[szczescie-skala-normalizacja-test] 138 OK, 8 FAIL
```

Po przywróceniu: `git diff --quiet gra/data/society-params.json` — czysto.

---

## ODPOWIEDŹ NA OBSERWACJE EVALUATORA (bez zarzutu, dla porządku)

- **„Liczba asercji rośnie w każdym pliku" nieścisłe dla `logic-test` (213 → 213)** — zgoda,
  to nit redakcyjny w moim raporcie rundy 2. Ratyfikacja wymaga, by liczba nie spadła; spełnione.
  Przepisana asercja `:1370` urosła wewnętrznie z 3 do 6 warunków.
- **Liczby „PRZED" w raporcie rundy 2 liczone od stanu po rundzie 1, nie od bazy dispatchu** —
  zgoda, powinienem był podać punkt odniesienia jawnie. Wobec bazy `f570a91a` każda bramka
  rośnie, więc werdykt bez zmian.
- **`szczescie-przebudowa-skali-test` przy braku szwu panelu kończy się wyjątkiem** — zgoda co
  do faktu; exit code = 1, więc cichej zieleni nie ma. Owinięcie wywołań `P.…` to zmiana
  poza zakresem zarzutów tej obrony i poza zakresem rundy 3 („nic więcej nie ruszaj"),
  więc **nie robię jej samowolnie** — zgłaszam jako kandydata na osobny, drobny temat.
- **Start easy = PorPct 94,8% przy pop 1** — pozostaje otwarte do decyzji właściciela.
  Nie moja liczba, nie strojona.

---

## ZMIANY/COMMIT

Jeden plik, z allowlisty (ratyfikacja rundy 2, punkt `gra/tools/szczescie-skala-normalizacja-test.cjs`):

- `gra/tools/szczescie-skala-normalizacja-test.cjs` — 1 linia (`:474`), wyłącznie tekst
  komunikatu asercji `114,3%` → `90,7%`.
- `dyspozycje/autobot/runs/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1/06-obrona-runda2.md` (ten raport).

Commit: **`fef6c538`**. `git add` po jawnych ścieżkach, **zero `git add -A` / `git add .`**.
`git diff --check` — exit 0.
`git diff --stat gra/data/` — **pusto**: ani jednej zmiany w plikach danych, ani jednej liczby
balansu tkniętej w tej obronie (obie mutacje dowodowe cofnięte z kopii).
`gra/src/main.ts` — `git diff --name-only f570a91a… | grep -c main.ts` = **0**, plik bajt w bajt
jak baza i jak `origin/main`.
Zero komend `npm run` (C-001); jedyna kompilacja to `tsc --noEmit`.

## TESTY (komplet uruchomiony ponownie po poprawce, własne przebiegi)

**Gdzie mierzyłem.** Pomiar pierwszy zrobiłem w `/home/user/wt-szczescie-skala`. Ponieważ
w trakcie pracy inny proces zaczął mutować to drzewo (BLOKADA 1), **powtórzyłem cały komplet
w czystym, odłączonym worktree na moim commicie**:
`git worktree add --detach /tmp/claude-0/obrona-r2-head fef6c538`. Liczby niżej pochodzą
z tego przebiegu — są wolne od cudzych mutacji i wyszły identycznie jak pomiar pierwszy.

`node ./node_modules/typescript/bin/tsc --noEmit` — **exit 0, zero błędów.**

**Osiem bramek z ratyfikacji rundy 2 + nowa bramka tematu — ZIELONE:**
`logic-test` **213/213** · `society-breakdown-test` 53/0 · `szczescie-zamoznosc-test` 88/0 ·
`szczescie-skala-normalizacja-test` **146/0** · `building-happiness-test` 14/0 ·
`r-wzrost-szczescie-dubel-wealth-ceramika-test` 59/0 · `war-happiness-parity-test` 21/0 ·
`wealth-test` 36/0 · `szczescie-przebudowa-skali-test` **519/0**.

**Pięć bramek referencyjnych:** logic 213/213 · tech-tree 19/19 · research 33/33 ·
unit-replace 13/13 · combat 6/6.

**Rodzina szczęścia/porządku (kryterium 5, wszystkie znalezione i uruchomione):**
citizen-resource-upkeep **109/0** · culture-religion 65/65 · happiness-breakdown 38/38 ·
porzadek-panel-czytelnosc 81/81 · empire-religia-panel-coverage 15/15 · ai-dlug-porzadki-q1 17/17 ·
city-orderstate-restore-clear 9/9 · diplomacy-border-march 43/43 · territory-border 9/9 ·
territory-border-dense-settlement 15/15 · border-march-scan 15/15 — **zielone, exit 0.**

**Jedyna czerwona:** `border-march-wygasanie-test` **22/4** — dopuszczony wyjątek kryterium 6
rundy 3. Dowód, że to nie regres: bramka czyta wyłącznie `gra/src/main.ts`, a
`git diff --stat origin/main -- gra/src/main.ts` jest **pusty** (plik bajt w bajt jak na czystym
`main`); Evaluator rundy 2 zmierzył identyczne 22/4 na własnym worktree bazy `f570a91a`.

**Mutacje dowodowe tej obrony (2, obie cofnięte z kopii pliku):**
D2 `szczescie_max_pop_wspolczynnik.normal` 0,04 → 0,048 → przebudowa-skali **518/1**,
normalizacja **141/5**;
D1 `szczescie_max_pop_odniesienia.normal` 2 → 1 → normalizacja **138/8**, w tym poprawiona
asercja z zarzutu 4. Po każdej: `git diff --quiet gra/data/society-params.json` = czysto.

## BLOKADY

1. **Kolizja izolacji trwa i tym razem REALNIE ZNISZCZYŁA pracę — R3-E naruszone, nie przeze
   mnie.** Przebieg, udokumentowany co do minuty:
   - 22:01 — w `/home/user/wt-szczescie-skala/gra/tools/` pojawiają się cztery pliki
     nieśledzone, utworzone przez inny proces (najpewniej Evaluator rundy 3):
     `RSZQ1EVAL3-baza-{citizen-resource-upkeep,r-wzrost-szczescie-dubel-wealth-ceramika,
     szczescie-przebudowa-skali,szczescie-skala-normalizacja}-test.cjs`.
   - między moim `git add` a `git status` **moja poprawka linii `:474` została cofnięta** —
     plik wrócił do stanu z HEAD z komunikatem `114,3%`. Równolegle `gra/data/society-params.json`
     i `gra/src/game/society-breakdown.ts` pokazywały się jako `M` i po chwili znów czysto,
     czyli tamten proces prowadził w tym drzewie własne mutacje i przywracał pliki.
   - **Poprawkę nałożyłem ponownie i zacommitowałem natychmiast** (`fef6c538`), po dwóch
     jawnych ścieżkach. Zawartość commitu zweryfikowana `git show fef6c538:…` — linia `:474`
     niesie `90,7%`.
   Czterech plików `RSZQ1EVAL3-baza-*` **nie tknąłem, nie zacommitowałem, nie usunąłem** —
   mogą być czyimś materiałem w locie. Do rozstrzygnięcia orkiestratora: R3-E („jeden pisarz
   na worktree") jest łamane po raz trzeci w tym temacie, a tym razem doszło do faktycznej
   utraty zapisu (odzyskanej tylko dlatego, że natychmiast sprawdziłem `git status` po `git add`).
2. Poza tym — brak. Wszystkie cztery zarzuty PRZYJĘTE i zamknięte dowodem.

## RUNDY

2/5 (obrona rundy 2). Na gałęzi leży już praca rundy 3 — obrona jej nie cofa ani nie dubluje.

## NASTĘPNY KROK

Final Control (Sonnet 5, effort high) — to samo ID, ta sama gałąź; do oceny łączny stan
po `3d24a86c` + ta obrona. Uporządkowanie czterech plików `RSZQ1EVAL3-baza-*` i domknięcie
R3-E — ręką orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
