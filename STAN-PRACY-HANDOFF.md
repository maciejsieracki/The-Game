# STAN PRACY — HANDOFF

**Ostatnia aktualizacja: 2026-07-23** · Projekt: Civ „The Game"

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

**Stan na 2026-07-23 (NAJNOWSZY):** deploy ROBOCZA **`48249d90`** — PORTRETY WŁADCÓW w medalionach (bitwa/preBattle/dyplomacja). Wcześniej: **`6bb7fedc`** — PAKIET: HUD TW-v5 KOMPLET 3/3 + preBattle nakładka v1.1 (kanon Design) + dyplomacja zaległości (SZYBKA UMOWA/Zerwij/dobra per-owner). Drzewo CZYSTE, nic w toku. Wcześniej: deploy ROBOCZA **`2c19fcb3`** — HUD bitwy TW-v5 fazy 1–2 (karty dowódców + zegar + przewaga, tempo przy minimapie, stany kart rosteru, bogaty tooltip, likwidacja raila → zębatka). Łańcuch 2026-07-23: `c7f70b27` (pakiet bitewny: plansze wg terenu + rzeka S + upiększenie pola) → `8aff7266` (dyplomacja dwustronna FINAL 3/3) → `2c67014c` (usunięte obramówki, czarne tło pola) → **`2c19fcb3`**. **W TOKU: faza 3 HUD TW-v5** (subagent — C-12 Koniec bitwy, C-23 Szczegóły, ikonowy toolbar, karty-medaliony) — pliki `battleScene.ts`/`battleHudTheme.ts`/`endDetails1E.ts` mogą być niezacommitowane; NIE ruszać. Osobny deploy po bramkach.

**Roadmap surowców (2026-07-22):** Faza 1 = realistyczny dostęp (złoże widoczne vs aktywne po ulepszeniu) · Faza 2 = twarde bramki budynków per surowiec · Faza 3 = magazyny + koszty materiałowe jednostek/budynków.

*(poprzedni stan 2026-07-22, sesja batch):* deploy ROBOCZA **`3613d5d4`** (md5 `3613d5d4ca248a3fa3f6879061aad3dc`) — balans Manpower + zbiorczy deploy fixów sesji (dyplomacja, ekonomia, mapa, bitwa, badania). **Manpower:** koszt rekrutacji ×10 (`manpowerNaJednostke = manpowerNaLudka`); regen max/turę **5%** (było 10%). Czeka: `git pull` lokalnie + smoke właściciela.

*(poprzedni stan 2026-07-21: deploy `20239659`)*

*(poprzedni stan 2026-07-20: deploy `ea4d679` / ROBOCZA `a31ebe6f`)* — dawniej: drzewo czyste, nic nie jest w toku — nowa sesja startuje bez ryzyka.

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

**Ostatni deploy: ROBOCZA `20239659`** (2026-07-21 sesja 2, na GitHubie). Łańcuch ostatnich deployów:
`374c1067` → `a756d893` (podwojenie państw/miast + fix rzek + PPM) → `8bd30f48` (miasta-państwa aktywne) → `41d0a2ea` (przejęcie stolicy rdzeń) → `7c65681a` (przejęcie stolicy: przenieś + Power) → `0b59bf29` (AI buduje ulepszenia terenu) → `0251a5cf`/`454d7c52` (posiłki miast-państw wg trudności) → **`20239659`** (dyplomacja miast-państw wg trudności). Wcześniej (sesja 1): `74d85bc2` (mapa wybrzeże z morza) → `50448964` (render ujścia rzek) → `374c1067` (grafika żelaza + audio).

### 3a. CO WESZŁO 2026-07-21 (najnowsze)

**GRAFIKA-ŻELAZO** *(zlecenie integratora #1 z 2026-07-10 — czekało 10 dni na werdykt właściciela; dyspozycja `DYSPOZYCJA-GRAFIKA-JEDNOSTKI.md` §2b)*:
- 4 nowe moduły w `gra/src/render/`: `jednostki-z1-mezopotamia`, `jednostki-z2-srodziemne`, `jednostki-z3-plemiona`, `galera-model` — **11 modeli jednostek żelaza** + **nowa Galera** (oko apotropaiczne, trójzębny taran, żagiel z emblematem gracza, 8 wioseł/burta) zastępująca ~90 linii geometrii ad-hoc.
- **FIX Triari:** `buildSuperUnit` ignorował nazwę → `case 'rzym'` zawsze zwracał Evocati, więc Triari renderował się jako jego kopia. Teraz rozróżnienie po nazwie.
- **FIX routingu Germana:** „Wojownik germański SUPER" trafiał w generyczny fallback — dopisane `germanie` do `Culture` / `cultureFromName` / `buildSuperUnit`.
- Weryfikacja headless: `buildUnitModel` dla **73/73 jednostek bez wyjątku**; Triari 486 tri ≠ Evocati 478, German super 488 ≠ generyk 580.

**AUDIO — trzy niezależne kanały** *(nowe pliki: `gra/src/audio/filePlayer.ts`, `ambiencePrefs.ts`, `utwory/`)*:
- **Intro** (ekrany przed rozgrywką): 3 utwory instrumentalne, **stała kolejność** (`C-MUZ-Q6=A`) — spokojne otwarcie, energiczne zamknięcie. 3 utwory z wokalem odstawione do `utwory/_wykluczone/`.
- **Kamień** (rozgrywka): 16 plików mp3, shuffle, **każdy utwór 3× pod rząd**. Brąz+ synteza **bez zmian**; synteza kamienia **rozłączona, ale ZOSTAJE w kodzie** jako uśpiony fallback (pusty katalog → automatyczny powrót).
- **Crossfade 1,5 s** (`CROSSFADE_SEC`) na KAŻDYM przejściu, także między powtórzeniami; krzywa **equal-power** (liniowa dawała słyszalny dołek). Zgłoszenie właściciela: ~1 s głuchej ciszy, bo `'ended'` reaguje za późno.
- **Odgłosy natury** — **SYNTEZA, 0 MB** (nie pliki!): wiatr, ptaki, świerszcze, wycie wilka/sowy + nowy `renderListowie` (szum drzew). Własny przełącznik i suwak w menu pauzy, osobne preferencje. **Automatyczne wyciszanie w bitwie** (0,8 s) wpięte w `setMood()` — `main.ts` i pliki bitwy bez zmian. `renderWoda` (morze/rzeka) **UŚPIONA, nie skasowana** — wróci przy dźwięku pozycyjnym.
- **FIX zgłoszony przez właściciela:** wyciszenie muzyki zapisywało się trwale i gasiło też intro. Teraz `enabled` jest **ulotne** (tylko bieżąca rozgrywka), głośność nadal trwała, stare `{enabled:false}` rozbrojone.

**DANE:** Thorakites `Typ` **Swordsman→Spearman** + uwagi (tarcza thureos + włócznia dory) → łapie kontrę **Spearman vs Mount +50%**. Panel-C zsynchronizowany, round-trip OK.

**Waga bundla: 26,1 MB** (19 mp3 inline, 192 kbps). Wzrost z ~10 MB to świadoma decyzja właściciela („jeżeli plik będzie cięższy, trudno"). Konwersja do 96 kbps odpada — **brak `ffmpeg`** na maszynie właściciela.

Skrót całości live (szczegóły sesji 2026-07-20 w §4):
- **Jednostki/epoki:** progresja epok (twarda bramka + tier-gating), wielka naprawa jednostek (tokeny 100%, 7 super-jednostek), „Zastąp", typ Slinger, łańcuch brązu i żelaza (surowiec).
- **Ludy Morza** — grywalni jako barbarzyńcy epoki Brąz (obozy w Brązie spawnują Sherden/szekelesz).
- **Wioski goodie-hut** — rozmieszczenie + nagroda (złoto/tech/jednostka) + interakcja.
- **Mapa** — **wybrzeże = woda** (nie ląd; pas 2 heksy jako płytka woda), **pasma górskie** (łańcuchy zamiast plam), **rzeki dochodzą do morza** (uproszczone po zmianie wybrzeża).
- **Ekonomia/Handel** — Mennica działa (mnożnik po Walucie), per-city surowce logistyczne + converters (Cegielnia/Garncarnia), **realne szlaki handlowe** (wykrywanie połączeń + dochód + UI/mapa).

---

### 3a-2. CO WESZŁO 2026-07-21 SESJA 2 (systemy strategiczne — najnowsze)

7 systemów zdeployowanych autonomicznie (właściciel nieobecny, zgoda C-ORG-Q17=A). Wszystkie bramki zielone, każdy deploy czysty FF.

**A) Mapa — poprawki** (`a756d893`/wcześniej `74d85bc2`,`50448964`): wybrzeże powstaje z Morza przy lądzie (ląd nietknięty — fix regresji „Ziemia"); **ujście rzek wpływa w heks Wybrzeża** (weryfikacja WZROKOWA Playwright — 2 błędy: kolor kamuflujący + wodospad pod terenem); pasma gór −25%; **PPM anuluje tryb budowy ulepszeń**.

**B) Podwojenie państw/miast** (`a756d893`): miasta/klaster ×2, cywilizacje ×2 z sufitem **15** (roster nacji). Maleński=7 cyw (8 się nie mieściło). `MAX_MIAST_PANSTWA` 9→18, `MAX_TYPY_CYWILIZACJI_MENU` 14→15. Pomiar: 100% rozstawienia poza Maleńkim.

**C) Miasta-państwa — aktywny gracz** (`8bd30f48`): kopie typu (`kopia_typu_obronna`) przestały być biernym łupem — pełny rozwój (budynki gospodarcze + jednostki) + posiłki w klastrze. **Bez bonusów, bez darmowych jednostek, nie zakładają miast.** Przyczyna bierności była bramka `earlyPhase` (`myCities.length<3`, kopie mają zawsze 1 miasto).

**D) Przejęcie stolicy** (`41d0a2ea` rdzeń + `7c65681a` follow-upy): **dwa zdarzenia**. Zdarzenie 1 (są inne miasta): skarbiec→zwycięzca, pula pracy przepada, nowa stolica=następne najstarsze. Zdarzenie 2 (ostatnie miasto=ELIMINACJA): +pula nauki+brakujące techy→zwycięzca + **Power-„zdobycze"** (snapshot całego Power pokonanego, osobna kategoria); cyw usunięta z gry/dyplomacji. Stolica=najstarsze miasto (`capitalCityIdByOwner`, w save). **Przenieś stolicę** (gracz przycisk w panelu miasta + AI proaktywnie gdy zagrożona; blokada gdy oblegana). Symetria gracz↔AI, `capital-capture.ts` + test 54/54.

**E) AI buduje ulepszenia terenu** (`0b59bf29`): WSZYSTKIE AI + miasta-państwa. Nowa **`aiPracaPoolByOwner`** (symetryczna do skarbca, w save) — domyka asymetrię przejęcia stolicy (AI też traci pulę pracy przy utracie stolicy). Throttle 1/miasto/turę, deterministyczny, food-first, `wyrab` pominięty. `planCityImprovements` reużywa kwalifikatora gracza.

**F) Posiłki miast-państw wg TRUDNOŚCI** (`0251a5cf`/`454d7c52`): siostry pomagają sobie **tylko w SOJUSZU** (pełna maszyneria dyplomacji — willingness/parytet militarny, obniżony próg tierowy). Siła sterowana **trudnością gry** (osobna opcja „Wsparcie miast-państw" USUNIĘTA): Łatwy słabe / Normalny obecne / Trudny twarde. Skale sojuszu ×0,6/×0,3/×0,15; RESUP {0,3,1}/{1,2,1}/{2,1,2}. **Nowa dyplomacja AI↔AI** (`formSisterAlliancesIfThreatened`) — dotąd nie istniała.

**G) Dyplomacja miast-państw wg trudności** (`20239659`): startowe zaufanie miast-państw do gracza wg trudności (easy +10/normal +5/hard 0 — hard=dziś, monotonicznie „trudniej=mniej zaufania"; tylko kopie typu) + ożywiony martwy param `dyplomacjaAktywnosc` (skłonność do sojuszy/handlu wg trudności — **ogólny, dotyczy też głównych cyw**).

**⚠️ DO WSTECZNEJ AKCEPTACJI właściciela** (liczby strojeniowe — dostrojenie po playteście, patrz §10): przenieś-stolicę AI promień **3**; ulepszenia AI próg Pracy **>30** + priorytet food-first; skale sojuszu **×0,6/×0,3/×0,15**; RESUP **{0,3,1}/{1,2,1}/{2,1,2}**; start-zaufanie **10/5/0**; zasięg `dyplomacjaAktywnosc` (ogólny — dotyka głównych cyw); brzmienie komunikatów przejęcia stolicy (robocze).

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

**2026-07-23 — NIC NIE JEST W TOKU po deployu `6bb7fedc`** (faza 3 HUD, preBattle i dyplomacja ZDEPLOYOWANE; poniższy wpis historyczny) — HUD bitwy TW-v5 FAZA 3 w toku (sesja chmurowa, subagent): C-12 „Koniec bitwy" + C-23 „Szczegóły" wg makiety Design `POLE-BITWY-TW-v5` (klatki 4–5), unifikacja paneli 70%+blur, ikonowy dolny toolbar 46×46 z podpisem na hover, karty rosteru z medalionem typu. Dotyka: `gra/src/battle/battleScene.ts`, `battleHudTheme.ts`, `endDetails1E.ts`, `endScreen1E.ts`. Fazy 1–2 są zacommitowane (`0f1455e`, `4726e97`) i ZDEPLOYOWANE (`2c19fcb3`). Jeśli widzisz niezacommitowane zmiany w tych plikach — to faza 3, nie nadpisuj.

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

**Kolejka sesji bitewno-UI 2026-07-23 (rejestr integratora chmurowego):**
- **#6 HUD TW-v5 faza 3** — W TOKU (patrz §5). Po ukończeniu: weryfikacja wzrokowa vs makieta → commit → deploy → log.
- **#7 Rzeka w bitwie — kara za brodzenie** (etap B mechaniki: jednostka w brodzie wolniejsza/podatna) — do ABC z właścicielem.
- **#8 Oblężenie — dopracowanie planszy**: budynki miasta za murem + gruz w wyłomie.
- **#10 Długi silnika dyplomacji**: SZYBKA UMOWA = realna auto-uczciwa oferta; dobrowolne zrywanie traktatów („Zerwij"); indeks dóbr handlowych per właściciel; opcjonalnie Konfederacja/aneksja/handel mapami (ABC).
- **#11 Stary dług UI (audyt 2026-07-05 §3)** — ✅ ZAMKNIĘTE (recon 2026-07-23): wszystkie 4 pozycje JUŻ WDROŻONE przez lane UI/Cursor — karty budynków (`cityPanel.ts` `buildBuildingInfocard`), W4 7 zakładek (`withW4TabCard`), chipy 6C (`hudChip6c.ts` + raporty per miasto w `empireDetailPanel.ts`), popupy v5 (SVG GAP-03/04 w `battleHudTheme.ts`).
- **#13 preBattle jako nakładka na mapie** — ⏸ CZEKA na kanon Claude Design (zlecenie wysłane w paczce `DO-DESIGN-2026-07-23`); NIE implementować przed kanonem.
- **#14 Porządek mockupów**: konsolidacja ~20 do `KANON/mockupy` (martwe linki hubu); ~18 brakujących zgłoszone Design.
- **#12 Brand-book KANON zainstalowany** — ✅ ZROBIONE (commit `9a533e5`, live w `01-propozycje-z-design/brand-book/KANON/`).
- **Backlog przyszłościowy (Maciej: „kiedyś")**: większe plansze bitwy — czarne tło zastąpione graficznie ułożonym lądem.

- **[ODLOZONE — decyzja Macieja 2026-07-22] Wielka Kuznia (epokaWejscia=4) i Lazaret (5) niebudowalne** (audyt #41): epoka gracza konczy sie na 3, a techy tier 8-9 obiecuja te budynki. UWAGA: w buildings.json:1283 jest komentarz "PARKOWANIE poza cap v0.1" — moze byc celowe. Opcje: A) obnizyc epokaWejscia do 3 (odparkowac), B) zostawic + mechanizm parkowania jak przy cudach. Wracamy na sygnal Macieja; do tego czasu NIE zmieniac.


**Handel — kolejne etapy epiku (design zamknięty, patrz §9):**
- **E6** — AI proaktywnie proponujące umowy handlowe + **obniżony próg** zawarcia (dziś `progHandelRelacja=100` ≈ sojusz; dar ma 30). Dziś trasy powstają tylko z perspektywy gracza; AI↔AI trade nie istnieje.
- **E3b** — dostęp do surowca przez trasę (`Q11=B` boolean grant) — wymaga najpierw **mechanizmu revoke grantu** w `diplomacy-basket-transfer.ts` (żeby wojna cofała dostęp).
- **Dostrojenie** dochodu dystansowego tras — dziś placeholdery `handel_szlaki.dochod_bazowy=8 / dochod_na_dystans=0.4 / dochod_podloga=1` w `econ-params.json`.
- **Powiadomienia** o powstaniu/zniknięciu trasy (pominięte w E7).
- **Cegła/ceramika** (i przyszły brąz) — kumulują się w `city.surowce` bez konsumenta; docelowo **dobra handlowe** (Q11) albo koszt budynków.
- **Glina/ruda→brąz** — dziś zbierana tylko glina (`GLINA-Q2=A`). Ruda→brąz to osobna decyzja (przebudowa brązu z civ-wide boolean na ilościowy vs zostawienie).

**Mapa / teren:**
- Weryfikacja wzrokowa: pasma, wybrzeże=woda, bug rzeka↔mgła (patrz §7).
- ~~Gęstość osadnictwa (więcej miast/państw)~~ — **ZROBIONE** (sesja 2, podwojenie państw/miast). Chunki mapy dla słabszych maszyn — odłożone.
- **Follow-upy strategiczne (po playteście):** dostrojenie liczb (progi AI, skale sojuszu, RESUP, start-zaufanie — §3a-2); ewentualnie: więcej nacji (żeby cywilizacje ×2 działało pełni powyżej 15 na Ogromny/Super); wyrąb lasu (`wyrab`) dla AI (dziś pominięty).
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

**Sesja 2026-07-21 (systemy strategiczne):**
- **Podwojenie:** miasta/klaster ×2 + cywilizacje ×2 z sufitem 15; Maleński=7 cyw (opcja B — 8 się nie mieściło).
- **Miasta-państwa:** aktywny rozwój, **te same zasady co gracz, ZERO bonusów/darmowych jednostek**, budują jednostki+budynki+ulepszenia, **nie zakładają nowych miast**, ograniczona dyplomacja.
- **Przejęcie stolicy:** stolica=najstarsze miasto, trwałe, przenieś (gracz+AI, nie gdy oblegana). Q1=A+przenieś · Q2=A cały skarbiec · Q3=A praca per-miasto zostaje + pula pracy cyw przepada · Q4: stolica→pieniądze+praca; ostatnie miasto=eliminacja→+nauka+brakujące techy+Power(zdobycze) · Q5=B pełne usunięcie cyw · jednostki NIE przejmowane (są kasowane) · **dwa osobne zdarzenia** (przejęcie stolicy vs ostatniego miasta).
- **Ulepszenia terenu przez AI:** `C-AI-ULEP-Q1=B` — buduje KAŻDE AI (nie tylko miasta-państwa); AI ma własną pulę Pracy.
- **Posiłki miast-państw:** bramkowane SOJUSZEM (`C-MP-SOJ-Q1/Q2/Q3`); pełna maszyneria dyplomacji (Q2=B); siła+łatwość sojuszu wg **TRUDNOŚCI gry** (nie osobna opcja); zakres = siostry tego samego klastra.
- **Dyplomacja miast-państw wg trudności:** `C-MP-DYPL-Q1=B` — start-zaufanie do gracza wg trudności (wariant B: easy+10/normal+5/hard0) + ożywiony `dyplomacjaAktywnosc`.
- **Deploy autonomiczny:** `C-ORG-Q17=A` — pod nieobecność właściciela deploy do ROBOCZA gdy VERIFY OK + „push" w kanale.
- **Hasła właściciela:** „sprawdź" = pull+czytaj kanał/handoff (bez dysku); „push" (do sesji lokalnej) = pull+sync na dysk właściciela. (CLAUDE.md §6.)

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

**Nowe po sesji 2026-07-21 (audio/grafika):**
- **Druga, niezależna tabela kontr** w `gra/src/battle/battleScene.ts` (kolumna `Bonus vs <Typ> %` per jednostka, osobna od `counters.json`). **Thorakites i Triari mają tam `Bonus vs Mount % = 0`, podczas gdy generyczny Włócznik ma 50.** Może być zamierzone (elita ≠ generyk), ale warto rzucić okiem przy balansie.
- **`categoryOf()`** (`gra/src/units/setup.ts`) klasyfikuje nowe jednostki żelaza jako `'domyslny'`. Na render NIE wpływa (dispatch idzie po nazwie — potwierdzone testem), ale może dotyczyć innych miejsc UI/logiki zależnych od kategorii.
- **Odgłosy natury — ten sam błąd, co naprawiony w muzyce:** wyciszenie w `ambiencePrefs` zapisuje się **trwale** (przechodzi na kolejne gry i do menu). W muzyce właściciel kazał to zmienić na ulotne (`C-AUD-Q5=A`); dla natury **nie zgłaszał**, więc zostało. Do wyrównania, jeśli zacznie przeszkadzać.
- **Szum morza/rzeki (`renderWoda`) czeka uśpiony** — właściciel: *„szum morza powinien pojawiać się dopiero, gdy na mapie zbliżamy się do morza"*. Wymaga dźwięku pozycyjnego (głośność zależna od ilości wody w kadrze). Generator gotowy, wystarczy go obudzić i wpiąć sterowanie.
- **Muzyka brązu/żelaza z plików** — właściciel zbiera utwory (`Downloads\muzyka braz\`). Brąz+ gra dziś **syntezą**; podmiana na pliki = ten sam mechanizm co kamień (`createPlaylist`), gdy zdecyduje.
- **Waga bundla** — 26,1 MB przy 192 kbps. Jeśli ładowanie zacznie doskwierać: eksport utworów w 96 kbps zdjąłby ~7 MB (właściciel musi wyeksportować sam, brak `ffmpeg`).

---

## 11. 🤖 CZY SESJA CHMUROWA/DESKTOP MOŻE PRACOWAĆ?

**Tak.** Drzewo czyste, wszystko zdeployowane. Zawsze: przed pracą `git status` + bramki (§7); po pracy bramki w tym samym stanie lub lepszym.

- ✅ **Bezpieczne samodzielnie:** kolejne etapy Handlu (E6/E3b — dotykają `game/*`, dyplomacji, AI), dostrojenie wartości ekonomii (`econ-params.json`), analiza/dokumentacja.
- ⚠️ **Ostrożnie:** duże zmiany generacji mapy (`gra/src/map/*`) — sprawdzaj determinizm `map-gen-regression-test` po każdej zmianie.
- ⛔ **Nie bez uzgodnienia:** deploy do ROBOCZA (loguj §2 pkt 6; sprawdź czy nikt nie pracuje równolegle), eksport paneli Excel, `npm run build`.

**Deploy z chmury/Linux:** krok „stamp" wymaga portu node'owego (§6 krok 2 — brak PowerShell). Na Windows `.ps1` działa normalnie.

**Jeśli coś jest niejasne lub dane wyglądają na sprzeczne — zapytaj właściciela, nie zgaduj.**
