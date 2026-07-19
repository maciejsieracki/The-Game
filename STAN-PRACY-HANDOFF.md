# STAN PRACY — HANDOFF

**Ostatnia aktualizacja: 2026-07-19** · Projekt: Civ „The Game"

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

**Czego NIE zaczynać bez zgody właściciela:** dużych tematów z sekcji 8 (łańcuch żelaza, Ludy Morza, sync Excela) — one mają swoje decyzje i kolejność.

---

## 2. ⛔ KRYTYCZNE ZASADY (złamanie = utrata pracy)

1. **NIGDY `npm run build` ani `npm run dev` w katalogu `gra/`.**
   `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad drzewkiem technologii i jednostkami żyje **wyłącznie w JSON** — jedno takie uruchomienie ją kasuje.
   **Buduj tylko tak** (z katalogu `gra`):
   ```bash
   node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir
   ```
2. **NIE uruchamiaj eksportu paneli** (`panele-sterowania/Panel-*.xlsx` → `export-*.py`).
   Panele Excel są **niezsynchronizowane** z aktualnym JSON — eksport cofnąłby dane do starego stanu. Synchronizacja to osobne, zaplanowane zadanie (sekcja 8).
3. **Repozytorium jest trunk-based na `main`** — nie ma feature-branchy. Commituj na `main`.
4. **Deploy ma własny runbook** (sekcja 6). **NIE używaj** `publish-robocza-bundle.ps1` — buduje ze starych źródeł.
5. `gra/src` + `gra/data` to **kanon**. Kopie w innych katalogach są zamrożone/historyczne.

---

## 3. ✅ ZROBIONE I DZIAŁA W GRZE (zdeployowane do ROBOCZA)

**Ostatni pełny deploy: ROBOCZA `ca3aafa0`** — zawiera także wszystko z sekcji 4 (wypchnięty na GitHub tym samym commitem, co ten plik). Poprzedni deploy: `ed16d0ea` / commit `49ab882`.

- **Zasady progresji epok** — twarda bramka epoki (cała epoka odkryta przed następną) + tier-gating T1→T2→T3 wewnątrz epoki.
- **Mapa** — „min nie max" (nie degradujemy wygenerowanych gór/wzgórz → więcej nieregularnego terenu); wybrzeże ≥2 heksy + eliminacja fałszywych wcięć wyglądających jak ujścia rzek; zmiękczona reguła długości rzeki (krótsze rzeki też powstają, ale zawsze dochodzą do morza).
- **Wielka naprawa jednostek** — normalizacja pola `Typ` PL→EN + migracja `counters.json`; **naprawa tokenów w `civs.json`: z 28% do 100% widocznych jednostek narodowych** (było 15/53, jest 57/57); fix klucza `sumer` w `production.ts`; **fix bramki em-dash** — 7 super-jednostek (Hieros Lochos, Triari, Evocati, Hu Ben Wei, uThulwana, Medżaj, Gwardia Sumeru) było **niewidocznych od zawsze**; Falanga/Hieros/Evocati → epoka Żelaza; Triari → zamiennik włóczników; Legion Rzymski usunięty; Galera → typ Naval; Wojownik szekelesz → nacja Ludy Morza.
- **Wcześniej:** drzewko technologii 3-tier, fix miedzi (0% złóż na złym terenie), czaszka nad głodującą jednostką.

---

## 4. ✅ WESZŁO DO GRY W TEJ TURZE (deploy `ca3aafa0`)

Poniższe było przez chwilę „gotowe, ale niezdeployowane" — **teraz jest już w wersji roboczej i na GitHubie**. Powstało jako checkpoint `6252736` + dalsze poprawki:

- **Q2** — Triari i Evocati wymagają technologii „Hutnictwo żelaza" (tak jak Hastati). Koniec z elitą dostępną za darmo z samej epoki.
- **Q4** — Procarz dostał własny typ **„Slinger"**: bije włóczników (+50%), nadal obrywa od konnicy (kontra Mount→Slinger), kara flanki bez zmian.
- **Q7 — mechanizm „ZASTĄP"** — jednostkę można zastąpić dowolną **dostępną** jednostką **tego samego typu** (nawet słabszą) + jej konkretnym unikatem z nowego pola „Zastąp specjalnie" (tyrreński→Evocati, mykeński→Hieros Lochos). Składniki: `availableReplacementsFor()` w `production.ts`, akcja „Zastąp" w pasku jednostki, modal `ui/unitReplacePicker.ts`, podmiana w runtime, limit raz na turę.

**Dodatkowo w drzewie roboczym (po checkpoincie):**
- Kolumna **„Bonus vs Slinger %"** na wszystkich 73 jednostkach (skopiowana z „Bonus vs Distance %"). Bez niej procarz byłby w bitwie taktycznej odporny na szarże 14 jednostek kawalerii.
- **Zasięg „Zastąp" = całe terytorium państwa** (nie tylko garnizon miasta). Reużyty istniejący `isPlayerTerritoryHex` z `map/territory.ts`; bramka koszar/surowców poza miastem działa jako „OR po wszystkich miastach gracza".

**Zasady „Zastąp" (obowiązujące):** dopłata = `max(0, koszt nowej − koszt starej)` w Pieniądzu · zużywa turę jednostki · działa na własnym terytorium · zachowuje procent zdrowia · raz na turę na jednostkę · tylko własna nacja.

**Zweryfikowane wzrokowo** (Playwright/Chromium, zrzuty ekranu): przycisk „ZASTĄP" jest widoczny i aktywny w pasku akcji, modal renderuje się poprawnie na mapie, **0 błędów w konsoli**.

---

## 5. ⏳ W TRAKCIE

> **NIC NIE JEST W TOKU.** Drzewo robocze jest czyste, wszystko zbudowane, zdeployowane i wypchnięte. Nowa sesja może startować bez obaw, że przerwie komuś pracę.

*Zakończone w tej turze (opis zostaje jako kontekst decyzji):*

- **Wycofanie rozliczenia ludności z „Zastąp"** — decyzja właściciela: zamiana kosztuje **wyłącznie Pieniądz**, bez wymiaru ludności.
  Powód: **wszystkie 73 jednostki mają `"Ludność": 1`**, więc różnica zawsze wynosiła 0 i mechanizm nic nie robił.
  Usuwane: `settleReplaceLudnoscDelta` (`game/manpower.ts`), guard i mutacja populacji w `main.ts`, etykieta ludności i warunek `popOk` w modalu, powiązane asercje testu.
  **Zostaje nietknięte:** zasięg terytorialny, dopłata w Pieniądzu, tura, HP procentowo, limit raz/turę, filtr nacji.
  > Gdyby kiedyś wracać do rozliczania ludności: wzorzec to `disbandPlayerUnit()` w `main.ts`, ale **najpierw trzeba zróżnicować koszty ludności w `units.json`**, inaczej mechanizm jest bezużyteczny.

---

## 6. 🚀 DEPLOY RUNBOOK (potwierdzony)

Z katalogu `gra`:
```bash
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir   # NIE npm run build!
```
Następnie:
1. Skopiuj `gra/dist/index.html` → `gra-robocza/Gra-ROBOCZA.html`
2. `gra/tools/inject-build-stamp.ps1 -HtmlPath <...>/gra-robocza/Gra-ROBOCZA.html -Tier ROBOCZA`
3. `node gra-robocza/tools/sync-playtest-bundles.cjs` (kopiuje bundel do 6 playtestów; **nie rusza** bundli bitewnych integratora)
4. `node gra-robocza/tools/generate-start-hub.cjs` (manifest md5 + START.html)
5. `node gra/tools/verify-robocza-bundle.cjs` → musi wypisać **`VERIFY OK`**
6. Commit na `main` + `git push origin main`

**Uwaga:** `verify` sprawdza krytycznie `manifest.md5 === md5(Gra-ROBOCZA.html)`. Komunikat „stamp match: WARN" jest **normalny** (md5 w atrybucie `title` z założenia jest o iterację w tyle) — nie jest błędem.

---

## 7. ⚠️ CO NIE DZIAŁA / ZNANE PROBLEMY (nie panikuj — to było przed Tobą)

**Bramki, które MAJĄ przechodzić** (uruchamiaj z `gra/`):
```bash
npx tsc --noEmit              # 0 błędów
node tools/tech-tree-test.cjs # 19 pass, 0 fail
node tools/research-test.cjs  # 33/33 ALL GREEN
node tools/unit-replace-test.cjs
node tools/map-gen-regression-test.cjs   # determinizm A=B + 0 rzek bez ujścia
```

**Bramki ZEPSUTE PRZED nami (nie są regresją, nie naprawiaj przy okazji):**
- `logic-test.cjs` → **21 porażek**. Powód: nieaktualne fixtury (oczekują starego wymagania Brązownictwa). Zweryfikowane: identyczna liczba przed i po zmianach. Naprawa zaplanowana (sekcja 8).
- `combat-test.cjs` → **rzuca wyjątek**. Powód: harness `adaptUnit()` nigdy nie ustawiał pola `counterTyp`. Reprodukowalne na oryginalnych danych. Naprawa zaplanowana.

**Inne znane problemy:**
- **Panele Excel niezsynchronizowane z JSON** — dług; patrz zasada nr 2.
- **Bug rzeka↔mgła** — rzeka znika przy budowie miasta, wraca po wyłączeniu mgły wojny.
- **„Zastąp"** — nie zweryfikowano wzrokowo ścieżki „jednostka w polu, poza miastem, ale w terytorium" ani przypadku blokady przy braku środków (kod przechodzi bramki, ale nikt tego nie widział).
- **Wioski** — render wpięty, ale `hex.wioska.istnieje` nigdzie nie jest ustawiane na `true`, więc się nie pojawiają.

---

## 8. 📋 CO ZOSTAŁO DO ZROBIENIA (kolejność)

1. **Ludy Morza — barbarzyńcy epoki Brąz.** Rozszerzyć `barbarians.ts` o pulę jednostek + spawnować Wojownika Sherden / szekelesz gdy era = Brąz. Jednostki istnieją i mają już poprawną nację, ale „Ludy Morza" nie są grywalną cywilizacją, więc dziś są nieosiągalne.
2. **Naprawa testów** — zaktualizować fixtury `logic-test` (nowe wymagania Brązownictwa) i naprawić harness `combat-test` (`counterTyp`).
3. **Synchronizacja Excel ↔ JSON** — round-trip JSON → panele, żeby eksport odtwarzał aktualny stan (z nową kolumną „Bonus vs Slinger %" i polem „Zastąp specjalnie"). Docelowo diff = 0. To zdejmuje dług z zasady nr 2.
4. **Łańcuch żelaza — NOWA MECHANIKA (zatwierdzona, pełna spec).**
   *Problem:* `production.ts` egzekwuje **wyłącznie** `surowiec === 'braz'` (przez `hasBrazAccess`). Każda inna wartość pola „Surowiec" jest ignorowana. Dziś 16 jednostek epoki żelaza wymaga **brązu**.
   ⚠️ **Sama zmiana danych na `zelazo` dałaby efekt ODWROTNY** — te 16 jednostek straciłoby jedyną działającą bramkę.
   *Do zrobienia:* nowy `game/zelazo-access.ts` (wzór 1:1 z `braz-access.ts`) = kopalnia na złożu żelaza w imperium **AND** Odlewnia żelaza w mieście → bramka `if (surowiec === 'zelazo' && !hasZelazoAccess(...)) continue;` → wszystkie 25 jednostek epoki Żelaza dostają `Surowiec: "zelazo"` (**także 4 konne — „Koń" znika**) → weryfikacja balansu, czy mapa daje dość złóż (inaczej gracz traci całą epokę).
   *Otwarty szczegół:* nie ma dedykowanej „kopalni żelaza" — jest ogólna `kopalnia` i `kopalnia_miedzi`. Do rozstrzygnięcia, czy zwykła kopalnia na złożu żelaza wystarcza, czy dorabiamy osobne ulepszenie.
5. **Backlog:** Handel vs Wymiana (naprawić Mennicę+Karawanseraj czy zrobić realne szlaki handlowe) · Ludy Morza — pełny feature (agresja AI + pływanie + embarkacja) · gęstość mapy (więcej miast/państw) · chunki mapy dla słabszych maszyn · restrukturyzacja drzewka 3-tier (D1–D9) · sprzątanie starej dokumentacji jednostek.

---

## 9. ✔️ DECYZJE JUŻ PODJĘTE (NIE pytaj o nie ponownie)

- **Wybrzeże:** pas 2 heksów zostaje, mimo że kosztuje ~29% rzek.
- **Kategoria kontr konnicy:** zostaje **„Mount"** (nie „Cavalry" — żadna jednostka nie ma tego typu, kontra by nie działała).
- **Kontra „Procarz":** ożywiona wąsko przez nowy podtyp „Slinger" (nie przez rozszerzenie na wszystkie dystansowe).
- **Ludy Morza:** podpinamy jako barbarzyńców epoki Brąz (nie czekamy na pełny feature).
- **Unikat Chin:** reprezentant = „Jeździec chiński" (Chiny mają 3 równorzędne).
- **„Zastąp":** budowany na rekomendowanych ustawieniach; zasięg = **całe terytorium**; koszt = **tylko Pieniądz**, bez ludności.
- **Triari/Evocati:** wymagają **technologii** żelaza; **nie** dokładamy wymogu złóż brązu (żeby dojść do żelaza, brąz i tak trzeba wynaleźć).
- **Jednostki epoki żelaza:** mają docelowo wymagać **surowca żelazo** (pełny łańcuch jak brąz) — realizacja w punkcie 8.4.
- **Kolumna „Bonus vs Slinger %":** dorobiona (nie zaakceptowaliśmy utraty podatności procarza).

---

## 10. ❓ OTWARTE PYTANIA DO WŁAŚCICIELA

- **„Zastąp" w praktyce** — obejrzeć w grze i ocenić ustawienia (koszt, zużycie tury, zasięg, zachowane HP, limit raz/turę).
- **Pary „Zastąp specjalnie"** — wypełnione są 2 (tyrreński→Evocati, mykeński→Hieros). Pozostałe unikaty czekają na przegląd kuratorski.
- **Głód wojska** — sprawdzić w grze, czy czaszka, spadek HP i komunikat faktycznie działają.
- **Łańcuch żelaza** — rozstrzygnąć kwestię dedykowanej kopalni żelaza (punkt 8.4).

---

## 11. 🤖 CZY SESJA CHMUROWA MOŻE PRACOWAĆ?

**Tak, pod warunkami:**

✅ **Bezpieczne do podjęcia** (samodzielne, nie kolidują): punkt 8.2 (naprawa testów) — dotyka tylko plików w `gra/tools/`. Analiza, przegląd kodu, dokumentacja, odpowiadanie na pytania.

⚠️ **Wymaga ostrożności:** punkty 8.1 i 8.4 dotykają `gra/src/main.ts` i `gra/data/units.json` — pliki intensywnie zmieniane w ostatniej pracy. **Najpierw `git pull`,** potem sprawdź `git status`.

⛔ **Nie ruszać bez uzgodnienia:** deployu do `gra-robocza` (żeby nie nadpisać cudzej wersji — sprawdź, czy ktoś nie pracuje równolegle), eksportu paneli Excel, `npm run build`.

**Zawsze:** przed pracą `git pull` → `git status` → bramki z sekcji 7. Po pracy: bramki muszą być w tym samym stanie lub lepszym (pamiętaj o 21 pre-istniejących porażkach `logic-test` i zepsutym `combat-test` — to nie Twoja wina).

**Jeśli coś jest niejasne lub dane wyglądają na sprzeczne — zapytaj właściciela, nie zgaduj.** Ta zasada obowiązywała przez całą dotychczasową pracę i uchroniła projekt przed kilkoma kosztownymi błędami.
