# STAN PRACY — HANDOFF

**Ostatnia aktualizacja: 2026-07-20** · Projekt: Civ „The Game"

> **Ten plik jest punktem wejścia dla KAŻDEJ nowej sesji** — lokalnej, chmurowej, telefonicznej.
> Mówi: co jest zrobione, co w toku, czego NIE wolno ruszać i czy można pracować.
> Powstał, bo notatki robocze asystenta żyją lokalnie na maszynie właściciela i **nie są widoczne z chmury** — tylko ten plik jedzie z repozytorium.

---

## 1. CZY MOŻNA PRACOWAĆ? (przeczytaj najpierw)

**TAK — ale najpierw sprawdź stan drzewa:**

```bash
git log --oneline -3
git status --short
```

- Jeśli drzewo jest **czyste**, a ostatni commit to deploy — możesz brać nowe tematy z sekcji 8.
- Jeśli w `gra/src` lub `gra/data` są **niezacommitowane zmiany** — ktoś jest w połowie pracy. NIE nadpisuj ich, NIE rób `git checkout`/`git stash` na tych plikach. Najpierw ustal z właścicielem, co to jest.
- **Zawsze przed pracą uruchom bramki** (sekcja 7), żeby wiedzieć, co jest sprawne, a co było zepsute PRZED Tobą.

**Stan na 2026-07-20:** drzewo **czyste**, ostatni commit = deploy `ea4d679` (bundel ROBOCZA `a31ebe6f`), wypchnięte na `main` i gałąź. Nic nie jest w toku — nowa sesja startuje bez ryzyka.

**Czego NIE zaczynać bez zgody właściciela:** dużych tematów z sekcji 8 (kolejne etapy Handlu E6/E3b, pełny feature Ludów Morza) — mają swoje decyzje i kolejność.

---

## 2. ⛔ KRYTYCZNE ZASADY (złamanie = utrata pracy)

1. **NIGDY `npm run build` ani `npm run dev` w katalogu `gra/`.**
   `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad drzewkiem/jednostkami/ekonomią żyje **wyłącznie w JSON** — jedno takie uruchomienie ją kasuje.
   **Buduj tylko tak** (z katalogu `gra`):
   ```bash
   node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir
   ```
2. **NIE uruchamiaj eksportu paneli** (`panele-sterowania/Panel-*.xlsx` → `export-*.py`).
   Kierunek jest jednostronny JSON→Excel (przez `gen-panel-*.py`). Eksport cofnąłby dane do starego stanu.
3. **Deploy ląduje na `main`** — z niego żyje ROBOCZA. Sesje chmurowe/web pracują na gałęzi feature i przy deployu robią **fast-forward na `main`** (`git push origin <branch>:main`); sesja lokalna może commitować wprost na `main`. Wersja live musi ZAWSZE odpowiadać zacommitowanemu stanowi repo.
4. **Deploy ma własny runbook** (sekcja 6). **NIE używaj** `publish-robocza-bundle.ps1` — buduje ze starych źródeł.
5. `gra/src` + `gra/data` to **kanon**. Kopie w innych katalogach są zamrożone/historyczne.
6. **KAŻDY deploy loguj natychmiast** w `dyspozycje/WERSJE.md` (md5+stempel+co weszło; poprzednią oznacz ZASTĄPIONA) **i** `dyspozycje/_handoff/KANAL-PRACA.md` (meldunek dla drugiego integratora). Narracja w czacie NIE jest meldunkiem.
7. **Przy niejednoznaczności/sprzecznych danych — pytaj właściciela, nie zgaduj.**

---

## 3. ✅ ZROBIONE I DZIAŁA W GRZE (zdeployowane do ROBOCZA)

**Ostatni deploy: ROBOCZA `a31ebe6f`** (2026-07-20, commit `ea4d679`). Łańcuch ostatnich deployów:
`a44d5350` (łańcuch żelaza + sync paneli) → `ba8ab0d7` (Ludy Morza + Wioski + naprawa bramek) → `b217916e` (mapa: wybrzeże=woda + pasma + rzeki · Handel E1 Mennica) → **`a31ebe6f`** (Handel: szlaki E2+E3+E7 + zbieranie gliny).

Skrót całości live (szczegóły sesji 2026-07-20 w §4):
- **Jednostki/epoki:** progresja epok (twarda bramka + tier-gating), wielka naprawa jednostek (tokeny 100%, 7 super-jednostek), „Zastąp", typ Slinger, łańcuch brązu i żelaza (surowiec).
- **Ludy Morza** — grywalni jako barbarzyńcy epoki Brąz (obozy w Brązie spawnują Sherden/szekelesz).
- **Wioski goodie-hut** — rozmieszczenie + nagroda (złoto/tech/jednostka) + interakcja.
- **Mapa** — **wybrzeże = woda** (nie ląd; pas 2 heksy jako płytka woda), **pasma górskie** (łańcuchy zamiast plam), **rzeki dochodzą do morza** (uproszczone po zmianie wybrzeża).
- **Ekonomia/Handel** — Mennica działa (mnożnik po Walucie), per-city surowce logistyczne + converters (Cegielnia/Garncarnia), **realne szlaki handlowe** (wykrywanie połączeń + dochód + UI/mapa).

---

## 4. ✅ CO WESZŁO W SESJI 2026-07-20 (szczegóły + decyzje)

Wszystko poniżej jest **zdeployowane i na GitHubie**. ID decyzji w nawiasach — NIE pytaj o nie ponownie (§9).

1. **Ludy Morza jako barbarzyńcy Brązu** (deploy `ba8ab0d7`) — gdy `player.era===2`, obozy spawnują wyłącznie Wojownika Sherden/szekelesz (naprzemiennie, deterministycznie), wszystkie poziomy. `game/barbarians.ts` (`LUDY_MORZA_BARB_UNIT_IDS`, `pickBronzeBarbUnit`) + override w `main.ts`. Szekelesz `Kultura`→„Ludy Morza". Decyzje **SEA-Q1..Q5 = A/A/A/A/C**.
2. **Wioski goodie-hut** (`ba8ab0d7`) — nowy `map/villages.ts` `placeVillages()` (rzadko, ~1/140 heksów lądu, wzorzec `spawnCamps`, pełne wykluczenia). Wejście jednostki gracza → nagroda (`game/villageRewards.ts`: złoto 50%/tech 30%/jednostka 20%, fallback złoto; Żelazo→fallback złoto) → wioska znika. Decyzje **WIO-Q1..Q6 = B/B/B/A/B/A**.
3. **Naprawa bramek testowych** (`ba8ab0d7`) — `combat-test` **6/6** (dodane `counterTyp` w harnessie), `logic-test` **203/203** (aktualizacja fixtur Brązownictwa/tempa/buntu; las+złoże DOZWOLONE, `TEST-Q1=B`). ⚠️ **To były „znane porażki" ze starego handoffu — teraz NAPRAWIONE i zielone.**
4. **Mapa — wybrzeże → WODA** (`b217916e`, `WYBRZEZE-Q1/Q2/Q3=A/A/A`) — predykaty generatora liczą Wybrzeże jak wodę; pas 2 heksy zostaje; usunięte z terenów budowalnych (droga/fort precz; warzelnia soli→przybrzeżna); render=płytka woda. **`COAST-Q4=A`:** balans „% lądu" liczy tylko suchy ląd → mapy z większym lądem, mniej/większe wyspy (świadome).
5. **Mapa — dłuższe pasma** (`b217916e`, `HILLS-Q1/Q2/Q3=A/A/A`) — `growMountainRanges` (seed-and-grow, rdzeń Gór/obrzeże Wzgórz) + `gestosc.pasma_gorskie`; łańcuchy zamiast plam; floor fair-play + sanity-cap 40% zachowane.
6. **Mapa — rzeki uproszczone** (`b217916e`, `RIVER-Q1/Q2/Q3=A1/B1/C2`) — ujście = każda woda; rzeka kończy na pierwszym kontakcie; bramka wzmocniona (`rivers:'high'` + `pathReachesRealSea`): 637/637 z ujściem.
7. **Handel — komplet decyzji `HANDEL-Q1..Q12`** (szczegóły §9). Zbudowane etapami:
   - **E1** (`b217916e`) — **Mennica** naprawiona (mnożnik po Walucie **easy 2 / normal 1,5 / hard 1**, tylko gdy zbudowana+Waluta; `MENNICA-Q1=A` = zostaje) + **per-city surowce** (`city.surowce`, drewno/kamień z terenu, converters ożywione; braz/żelazo/hodowla ZOSTAJĄ civ-wide).
   - **Zbieranie gliny** (`a31ebe6f`, `GLINA-Q1/Q2=A/A`) — glinianka 2 gliny/turę → Cegielnia/Garncarnia ożywają (cegła/ceramika); **ruda/brąz świadomie odłożone**.
   - **E2** (`a31ebe6f`, `Q6=B`) — `game/trade-routes.ts` `findCityConnection` (ląd: dystans+BFS; morze: Port+BFS po wodzie) + cache.
   - **E3** (`a31ebe6f`) — **dochód z tras**: TYLKO zewnętrzne (gracz↔obca cyw, pokój), auto, limit = liczba budynków handlowych; dochód = wzór dystansowy (`Q7=A`) **+ +5% Handlu za trasę** (kumulatywnie), OBIE strony (`Q8=B`), do skarbca czysto. Trasy w zapisie gry.
   - **E7** (`a31ebe6f`) — UI: panel miasta „Szlaki handlowe" + łuki tras na mapie (złoto=ląd, błękit=morze).

---

## 5. ⏳ W TRAKCIE

> **NIC NIE JEST W TOKU.** Drzewo czyste, wszystko zbudowane, zdeployowane (`a31ebe6f`) i wypchnięte na `main`. Nowa sesja startuje bez ryzyka przerwania cudzej pracy.

---

## 6. 🚀 DEPLOY RUNBOOK (potwierdzony)

Z katalogu `gra`:
```bash
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir   # NIE npm run build!
```
Następnie:
1. Skopiuj `gra/dist/index.html` → `gra-robocza/Gra-ROBOCZA.html`
2. **Stamp** (pieczątka md5+stempel): na Windows `gra/tools/inject-build-stamp.ps1 -HtmlPath <...>/gra-robocza/Gra-ROBOCZA.html -Tier ROBOCZA`. **⚠️ Na Linux/chmurze brak PowerShell** — użyj wiernego **portu node'owego** (skrypt jednorazowy: czyta HTML, wstawia/aktualizuje `<div id="civ-build-stamp">` z md5+stemplem, iteruje md5 4×). Efekt identyczny.
3. `node gra-robocza/tools/sync-playtest-bundles.cjs` (kopiuje bundel do 6 playtestów; **nie rusza** bundli bitewnych integratora)
4. `node gra-robocza/tools/generate-start-hub.cjs` (manifest md5 + START.html)
5. `node gra/tools/verify-robocza-bundle.cjs` → musi wypisać **`VERIFY OK`**
6. **Zaloguj** deploy (§2 pkt 6): `WERSJE.md` + `KANAL-PRACA.md`.
7. Commit + push na `main` (z gałęzi feature: `git push origin <branch>:main` po sprawdzeniu FF).

**Uwaga:** `verify` sprawdza `manifest.md5 === md5(Gra-ROBOCZA.html)`. „stamp match: WARN" jest **normalny** (md5 w `title` z założenia o iterację w tyle). Bramka `map-gen-regression-test` — progi czasowe „AC <5s/<15s" bywają FAIL na wolniejszej maszynie/CI; **to pomiar wydajności, nie regresja** (liczy się determinizm A=B + 0 rzek bez ujścia).

### 6a. Promocja ROBOCZA → KANON (osobna procedura, po teście Master)

Z katalogu `gra`:
```powershell
.\tools\publish-kanon-snapshot.ps1
```
Wymaga `gra-robocza/Gra-ROBOCZA.html` po PASS F + test Master. Robi **wyłącznie** ROBOCZA→KANON: kopiuje `gra-robocza/` → `gra-kanon/`, zmienia nazwy bundli na `Gra-KANON*.html`, stempluje (`inject-build-stamp.ps1 -Tier KANON`), zapisuje `KANON-MANIFEST.json`, odświeża `START.html`/`START-GRA.html`, uruchamia `cleanup-retention.ps1`. **Nie dotyka `Gra-FINALNA.html`** — to osobny krok (§6b). Zaloguj promocję w `WERSJE.md` (sekcja KANON) + `KANAL-PRACA.md`.

### 6b. Promocja KANON → FINALNA (osobna procedura, RZADKO, na wyraźne polecenie właściciela)

Z katalogu `gra`:
```powershell
.\tools\publish-finalna-snapshot.ps1
```
Wymaga `gra-kanon/Gra-KANON.html` (kanon już promowany i przetestowany — **źródłem jest KANON, nie ROBOCZA**). Kopiuje `gra-kanon/Gra-KANON.html` → `Gra-FINALNA.html` w korzeniu, stempluje (`inject-build-stamp.ps1 -Tier FINALNA`), wypisuje md5 źródłowego KANONU i md5 powstałej FINALNEJ. **Uruchamiać tylko gdy Maciej wyraźnie o to poprosi** — nigdy automatycznie przy okazji §6a. Zaloguj promocję w `WERSJE.md` (sekcja FINALNA) + `KANAL-PRACA.md`.

---

## 7. ⚠️ CO NIE DZIAŁA / ZNANE PROBLEMY

**Bramki, które MAJĄ przechodzić** (uruchamiaj z `gra/`):
```bash
npx tsc --noEmit                     # 0 błędów
node tools/tech-tree-test.cjs        # 19/19
node tools/research-test.cjs         # 33/33
node tools/unit-replace-test.cjs     # 10/10
node tools/map-gen-regression-test.cjs   # determinizm A=B + 0 rzek bez ujścia
node tools/logic-test.cjs            # 203/203  (NAPRAWIONE 2026-07-20)
node tools/combat-test.cjs           # 6/6      (NAPRAWIONE 2026-07-20)
node tools/barbarians-test.cjs       # 74/74
node tools/villages-test.cjs         # 31/31
node tools/converters-test.cjs       # 31/31
node tools/mennica-magazyn-test.cjs  # 38/38
node tools/trade-routes-test.cjs     # 35/35
node tools/trade-routes-income-test.cjs  # 49/49
```

**⚠️ KOREKTA starego handoffu:** notatka o „21 porażkach `logic-test`" i „`combat-test` rzuca wyjątek" jest **NIEAKTUALNA** — oba **naprawione 2026-07-20** i zielone (203/203, 6/6). Zweryfikowane na baseline.

**Realne pre-istniejące porażki (NIE regresja, nie naprawiaj przy okazji):**
- `currency-test.cjs` → **5 porażek** (dot. `pieniadzZPracy`/Efekt2 i mnożnika per-cyw). Zweryfikowane identycznie na baseline `git stash`.
- `map-gen-regression-test.cjs` — progi czasowe „AC" (generacja <5s/<15s) FAIL na wolnej maszynie = pomiar wydajności, nie regresja.

**Inne znane problemy / długi:**
- **Bug rzeka↔mgła** — rzeka znika przy budowie miasta, wraca po wyłączeniu mgły wojny. ⚠️ Możliwe, że zmiana „wybrzeże=woda" (2026-07-20) to zmieniła — **do weryfikacji wzrokowej**.
- **Panele Excel** — kierunek jednostronny JSON→Excel; nie odpalać `export-*.py` (§2).
- **„Zastąp"** — nie zweryfikowano wzrokowo ścieżki „jednostka w polu poza miastem" ani blokady przy braku środków.
- **Balans Mennicy — Fenicjanie** — łańcuch mnożników Skarbu z handlu może dać u Fenicjan **×11,4** (bonus handlu +35% × override Waluty × Mennica). Para Waluta+Mennica (×4 easy) jest OK/zamierzona; przegięcie to osobny temat balansu `civs.json` — do decyzji.

**Wioski** (stary problem „`istnieje` nigdy nie = true") — **NAPRAWIONE** (§4 pkt 2).

---

## 8. 📋 CO ZOSTAŁO DO ZROBIENIA

**Handel — kolejne etapy epiku (design zamknięty, patrz §9):**
- **E6** — AI proaktywnie proponujące umowy handlowe + **obniżony próg** zawarcia (dziś `progHandelRelacja=100` ≈ sojusz; dar ma 30). Dziś trasy powstają tylko z perspektywy gracza; AI↔AI trade nie istnieje.
- **E3b** — dostęp do surowca przez trasę (`Q11=B` boolean grant) — wymaga najpierw **mechanizmu revoke grantu** w `diplomacy-basket-transfer.ts` (żeby wojna cofała dostęp).
- **Dostrojenie** dochodu dystansowego tras — dziś placeholdery `handel_szlaki.dochod_bazowy=8 / dochod_na_dystans=0.4 / dochod_podloga=1` w `econ-params.json`.
- **Powiadomienia** o powstaniu/zniknięciu trasy (pominięte w E7).
- **Cegła/ceramika** (i przyszły brąz) — kumulują się w `city.surowce` bez konsumenta; docelowo **dobra handlowe** (Q11) albo koszt budynków.
- **Glina/ruda→brąz** — dziś zbierana tylko glina (`GLINA-Q2=A`). Ruda→brąz to osobna decyzja (przebudowa brązu z civ-wide boolean na ilościowy vs zostawienie).

**Mapa / teren:**
- Weryfikacja wzrokowa: pasma, wybrzeże=woda, bug rzeka↔mgła (patrz §7).
- Gęstość osadnictwa (więcej miast/państw), chunki mapy dla słabszych maszyn — odłożone.
- Dedykowana „Kopalnia żelaza" jako osobne ulepszenie — **decyzja odłożona** (ogólna kopalnia wystarcza).

**Ludy Morza — pełny feature** (agresja AI + pływanie + embarkacja) — osobny, duży temat (dziś tylko barbarzyńcy).

**Porządki:** restrukturyzacja drzewka 3-tier (D1–D9) · sprzątanie starej dokumentacji jednostek (widmowy „Kusznik").

---

## 9. ✔️ DECYZJE JUŻ PODJĘTE (NIE pytaj o nie ponownie)

**Sesja 2026-07-20:**
- **Ludy Morza (SEA):** Q1=A pełne zastąpienie w Brązie · Q2=A oba typy naprzemiennie · Q3=A staty bez zmian · Q4=A wszystkie poziomy · Q5=C (Kultura=etykieta, poprawiona).
- **Wioski (WIO):** Q1=B rzadko (goodie-hut) · Q2=B nagroda przy wejściu · Q3=B proporcjonalnie do mapy · Q4=A pełne wykluczenia · Q5=B nagroda złoto/tech/jednostka · Q6=A fallback złoto w Żelazie.
- **TEST-Q1=B:** las+złoże na jednym heksie DOZWOLONE.
- **Wybrzeże (WYBRZEZE):** Q1=A ląd→WODA · Q2=A pas 2 heksy · Q3=A droga/fort precz, warzelnia soli→przybrzeżna. **COAST-Q4=A:** „% lądu" liczy tylko suchy ląd (mapy z większym lądem/wyspami).
- **Pasma (HILLS):** Q1=A seed-and-grow · Q2=A istniejący suwak · Q3=A rdzeń gór/obrzeże wzgórz.
- **Rzeki (RIVER):** Q1=A1 napraw u źródła · Q2=B1 nie ruszaj liczby rzek · Q3=C2 precyzyjne fałszywe wcięcia.
- **Handel (HANDEL):** Q1=B realne szlaki · Q2=A trasy automatyczne · Q3=C pełny zakres · Q4=B napraw Mennicę+surowce · Q5=A mnożnik po Walucie **2/1,5/1** · Q6=B połączenie po dystansie (bez drogi) · Q7=A wzór dystansowy (zostaje) · Q8=B obie strony + AI proaktywne/obniżony próg · Q9 = każdy budynek handlowy (Targowisko/Karawanseraj/Port/Port wielki) +1 trasa · Q10/Q11=B trasa daje dostęp do surowca + dochód, **+5% Handlu/trasę dodatkowo** · Q12=B per-city magazyn dla surowców logistycznych (drewno/kamień/glina/ruda), braz/żelazo/hodowla zostają civ-wide · **handel TYLKO zewnętrzny** (wewnętrzny odłożony) · dochód do skarbca czysto (pomija Wealth).
- **GLINA:** Q1=A 2/turę stała · Q2=A tylko glina teraz (ruda/brąz odłożone).
- **MENNICA-Q1=A:** Mennica zostaje jak jest (×4 easy zamierzone); Fenicjanie = osobny temat.

**Wcześniejsze (nadal obowiązują):**
- Wybrzeże jako pas — było 2 heksy (teraz jako WODA, §4 pkt 4). Kategoria kontr konnicy = „Mount". Kontra Procarz = podtyp „Slinger". Unikat Chin = „Jeździec chiński". „Zastąp" = całe terytorium, koszt tylko Pieniądz. Triari/Evocati = wymóg techu żelaza. Łańcuch żelaza = ogólna kopalnia na złożu + odlewnia żelaza.

---

## 10. ❓ OTWARTE PYTANIA / DO PLAYTESTU

- **Szlaki handlowe** — zagraj: zbuduj Karawanseraj/Port + pokój z sąsiadem → trasa (łuk na mapie + panel „Szlaki handlowe" + dochód/turę). Oceń dochód dystansowy (8/0,4/1 — placeholdery) i +5%/trasę.
- **Mapa** — obejrzyj wybrzeże=woda, pasma (łańcuchy), rzeki do morza; sprawdź bug rzeka↔mgła.
- **Mennica** — miasto z Mennicą+Walutą → +50% Skarbu z handlu (normal). Ocena, czy ×4 easy OK; decyzja o Fenicjanach (×11,4).
- **Glina/ruda→brąz** — czy przebudować brąz na ilościowy, czy zostawić civ-wide.
- **Głód wojska / „Zastąp"** — wzrokowa weryfikacja (stare, nierozstrzygnięte).
- **Pary „Zastąp specjalnie"** — wypełnione 2, reszta czeka na przegląd kuratorski.

---

## 11. 🤖 CZY SESJA CHMUROWA/DESKTOP MOŻE PRACOWAĆ?

**Tak.** Drzewo czyste, wszystko zdeployowane. Zawsze: przed pracą `git status` + bramki (§7); po pracy bramki w tym samym stanie lub lepszym.

- ✅ **Bezpieczne samodzielnie:** kolejne etapy Handlu (E6/E3b — dotykają `game/*`, dyplomacji, AI), dostrojenie wartości ekonomii (`econ-params.json`), analiza/dokumentacja.
- ⚠️ **Ostrożnie:** duże zmiany generacji mapy (`gra/src/map/*`) — sprawdzaj determinizm `map-gen-regression-test` po każdej zmianie.
- ⛔ **Nie bez uzgodnienia:** deploy do ROBOCZA (loguj §2 pkt 6; sprawdź czy nikt nie pracuje równolegle), eksport paneli Excel, `npm run build`.

**Deploy z chmury/Linux:** krok „stamp" wymaga portu node'owego (§6 krok 2 — brak PowerShell). Na Windows `.ps1` działa normalnie.

**Jeśli coś jest niejasne lub dane wyglądają na sprzeczne — zapytaj właściciela, nie zgaduj.**
