## 02 — EVALUATOR (runda 1, adwersaryjnie)

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T4
GOAL: Zbudować nowy, dedykowany model 3D dla „Jeździec z oszczepami" (Żelazo, Słowianie) —
      dziś generyczny model kategorii `konnica` z kopią/lancą, mimo że to lekka,
      dystansowa jednostka oszczepnicza.
ZMIANY/COMMIT: 03ae11972e4de7c1af2cc2aa5c74ab19e7f53cd7, merge-base = origin/main = f21fa829
TESTY: własne uruchomienia, wyniki niżej — wszystkie zielone
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (osobny subagent, Sonnet 5 High)
DEPLOY/PUSH: NIE WYKONANO (origin/main nadal f21fa829; niczego nie pushowałem)
```

**MODEL WYKONUJĄCY TEGO EVALUATORA: Opus 5, ID `claude-opus-5[1m]`** — odczytane z kontekstu sesji tego agenta (rząd 1), nie z pamięci. Effort: patrz Uwaga 6.

Pracowałem we **własnym worktree** `/home/user/wt-eval-ZELAZO-T4` (detached na `origin/autobot/ZELAZO-T4-Q1`), z własnym `node_modules` (C-029), własnymi skryptami render/pomiarowymi. Raportu Operatora nie przyjąłem na słowo w żadnym punkcie.

---

### 1. Zakres — allowlista (§16a.1)

`git diff --numstat f21fa829..03ae1197`: **4 pliki, +2114/-0**. `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` (nowy), `gra/src/render/units.ts` (+19: 1 import + 1 gałąź nazwana), `gra/tools/zelazo-jezdziec-oszczepami-real-render-test.cjs` (nowy), `dyspozycje/autobot/runs/.../01-operator.md`. Zgodne co do pliku z allowlistą dispatchu. **Zero usunięć** (§16a.6). `git diff --check` czysty. Generyczny `case 'konnica'` bajtowo nietknięty (potwierdzone diffem, nie asercją). `git merge-tree` od merge-base: **0 konfliktów** z `main`. Żadna inna gałąź `autobot/*` przed `main` nie rusza `units.ts` (§16a.7).

### 2. Granice §9

Poz. 1 (C-001): w diffie zero `npm run build`/`dev`/`npx` — jedyne wystąpienia to cytaty samego zakazu. Test i mój własny build używają `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`. Mój build: **OK w 19,1 s, `gra/dist` NIE powstało, `git status` po buildzie pusty** — `data/*.json` nietknięte. Poz. 2/4/5/7: brak `git add -A`, brak zmian procesu, `WERSJE.md` i `playbook.json` poza diffem. Poz. 3: grep na `api_key|secret|password|token=|BEGIN PRIVATE|AKIA|ghp_` — **0 trafień** (§16a.5). Poz. 6a: patrz §4. Poz. 8: `git merge-base --is-ancestor 03ae1197 origin/main` → **NIE**, integracji nie było.

### 3. Bramki i testy — własne uruchomienia (§16a.3)

`tsc --noEmit` (binarka, TS 5.9.3): **0 błędów**. Bramki §6: **logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6**. Test tematu: **57 pass, 0 fail, exit 0**. Regresja sąsiadów (uruchomione z `--skip-vite`, stąd −2 asercje G na test wobec liczb Operatora): T1 **29/29**, T2 **40/40**, T3 **38/38**, `zelazo-gate-test` **24/24**. Różnica wobec „31/42/40" Operatora to wyłącznie mój flag, nie rozjazd.

### 4. GOAL i kryteria sukcesu 1–9 — weryfikacja niezależna

**Odcisk palca całego rostera.** Zbudowałem własnym skryptem **wszystkie 75 jednostek z `units.json`** (kategoria z prawdziwego `categoryOf()`) na `main` i na gałęzi, porównując `mesh/wysokość/minY/maxR`:

```
Rozniacych sie jednostek: 1 z 75
ZMIANA: Jeździec z oszczepami
   main: {"cat":"konnica","mesh":44, "h":0.74002,"minY":0.00698,"maxR":0.42093}
   T4  : {"cat":"konnica","mesh":117,"h":0.81851,"minY":0.00362,"maxR":0.35883}
```

To jednocześnie **dowodzi zgłoszenia** (na `main` jednostka miała dokładnie 44 mesh = generyczny fallback) i **domyka kryterium 6** — zero regresji, mierzone na całym rosterze, nie na trzech wybranych sąsiadach. `Drużynnik` bez zmian.

- **K1 (dedykowany dispatch po nazwie)** ✅ Gałąź stoi PRZED generykiem; `normName()` (NFD + `Ł→l` + lowercase) daje `jezdziec z oszczepami`; rdzeń jednoznaczny w całym `units.json` (sprawdziłem sam — jedyne 3 „Oszczepniki" mają rdzeń `oszczepnik`, jedyny inny „Jeździec" to chiński z własnym wpisem, `Rydwan celtycki` ma „oszczepami" tylko w `Uwagi`, nie w nazwie). Nazwa EN i PL dają identyczny model.
- **K2 (oszczep gotowy do rzutu, nie kopia nadręczna)** ✅ **Zweryfikowane wzrokiem na żywym renderze** (moje zrzuty, nie Operatora): dłoń nad barkiem, łokieć zgięty, grot w przód-w górę, pęk 4 zapasowych w dłoni wodzy. **Dokładnie 5 drzewc = `Ilość pocisków: 5`**. Zero mesh o nazwie `lance/pennon/bow/quiver`.
- **K3 (odróżnialność)** ✅ Zmierzyłem **IoU sylwetek** (render binarny 256², identyczna kamera): vs generyczny fallback **0,371**, vs `Konnica` (Brąz) **0,646**, vs `Konnica lancowa asyryjska` **0,585**, vs `Konnica łucznicza asyryjska` **0,593**. Wzrokowo na pasku porównawczym i w skali tokenu na tle terenu — pięć wyraźnie różnych sylwetek.
- **K4 (spójność z `Drużynnikiem`)** ✅ Zweryfikowałem źródłowo, że `TR_SKIN/TR_STEEL/TR_LEATHER/TR_LINEN/TR_WOOL_DK/TR_HAIR_SLAV` w `jednostki-z3-plemiona.ts` mają dokładnie te wartości, oraz że kanon wąsów to `/** Wasy: 2 klocki pod nosem, opadajace na boki (Slowianin / Gal). */` (linia 350) — powtórzenie liczbowe zamiast importu jest poprawne (plik poza allowlistą). Plik `Drużynnika` nietknięty.
- **K5 (sekcja historyczna)** — patrz §5.
- **K7 (real render)** ✅ Własny Playwright/Chromium, własne zrzuty, własne pomiary. Proporcje: wysokość **0,8185×HEX_R**, promień **0,3588** (limit 0,866), `minY` **0,0036**. W paśmie serii konnej (Brąz 0,782 / lancowa 0,864 / łucznicza 0,818).
- **K8** ✅ patrz §3.

**Przenikanie brył — mój własny test, którego Operator nie ma.** Przeliczyłem AABB wszystkich nazwanych części do **układu lokalnego modelu** (bo model ma `SJ_YAW = 1.02`, więc AABB w świecie są zawyżone) i gęsto próbkowałem osie wszystkich 5 drzewc przeciw torsowi, głowie jeźdźca, łbowi i zadowi konia oraz siodłu: **zero przecięć**. Jedyny styk to tarcza↔tors, nakładka **0,0032×HEX_R** na jednej osi — tarcza niesiona na plecach ma dotykać pleców, to jest poprawne, nie defekt (moja pierwotna asercja „środek tarczy poza AABB torsu" była błędem mojego testu w układzie świata, nie defektem modelu).

**Parytet gracz/AI/MP (§16a.4).** Zbudowałem token dla trzech różnych `ownerColor`: pole tarczy i pas przyjmują kolor właściciela w każdym przypadku, 20 materiałów, jeden wspólny slot `mOwner`. Ścieżka kodu identyczna dla gracza, AI i MP (jedna funkcja, parametr koloru). **Brak trwałego stanu** — temat nie dotyka save/load, `units.json` ani żadnej liczby rozgrywki, więc twarde FAIL-e `-SAVE`/`-PARITY` nie mają tu zastosowania. `perTokenGeos` puste, geometrie singletonowe.

### 5. Dowód nietautologiczności — **poszedłem dalej niż Operator**

Operator udowodnił (M) **zbiorczo**: 5 mutacji naraz → H1–H6 wszystkie czerwone. To zostawia lukę: nie wiadomo, czy każda asercja jest nośna z osobna. Napisałem własną **macierz ablacyjną** — każda mutacja aplikowana **pojedynczo**:

```
BAZA                                  : H1=green H2=green H3=green H4=green H5=green H6=green
M1 chwyt rzutu na wysokosci barku     : H1=RED   H2=green H3=green H4=green H5=green H6=green
M2 pek zapasu na osi uda              : H1=green H2=green H3=green H4=green H5=green H6=RED
M3 zaczep puśliska na tyl siodla      : H1=green H2=green H3=green H4=green H5=RED   H6=green
M4 odwrocony znak nachylenia drzewca  : H1=RED   H2=RED   H3=green H4=green H5=green H6=green
M5 sjArmIK bez wektora bieguna        : H1=green H2=green H3=RED   H4=RED   H5=green H6=green
```

**Każda z H1–H6 czerwienieje pod co najmniej jedną pojedynczą mutacją, i żadna mutacja nie czerwieni asercji, której nie powinna.** Sekcja (H) jest realnie nośna, nie tautologiczna. Deklaracja Operatora o „pierwszym podejściu z 3 mutacjami, gdzie H2/H3/H4 zostawały zielone" jest przez tę macierz **potwierdzona** (M4 i M5 są jedynymi źródłami czerwieni dla H2/H3/H4). Dowód (D) też sprawdziłem: bez linii dispatchu jednostka wraca do 44 mesh generyka i A1–A5 padają w komplecie.

### 6. Sekcja historyczna — kwestionowałem punkt po punkcie własną wiedzą

Sprawdzalne i **poprawne**: cytat *Strategikonu* XI.4 „armed with short javelins, two to each man / nice-looking but unwieldy shields" (przekł. Dennisa) ✓; teren „nearly impenetrable forests, rivers, lakes, and marshes" ✓; *Strategikon* ks. I jako pierwszy europejski zapis o strzemionach (σκάλαι w wykazie oporządzenia jazdy, ok. 600 r.) ✓; strzemiona awarskie 2. poł. VI w. i wielopokoleniowy kontakt słowiańsko-awarski ✓; ostrogi haczykowate (ostruhy s háčky) jako typ przedwielkomorawski wiązany z elitami poza terytorium awarskim ✓; hełm stożkowy z nosalem „typu czarnomogilskiego" jako przedmiot prestiżowy X w. ✓; konie wczesnośredniowieczne z ziem polskich w kategorii małych/średnich, ok. 135 cm w kłębie ✓; grzywa strzyżona w sztywny grzebień na płaskorzeźbach asyryjskich ✓; podkowy gwoździowane upowszechniają się później ✓.

**Anachronizmu nie znalazłem.** Najostrzejszy zarzut, jaki dało się postawić — „słowiańska jazda oszczepnicza VI–VII w. nie jest poświadczona, a model dostaje strzemiona, siodło z terlicą i ostrogi" — **Operator postawił sam, wprost, w K3 i K4**, rozdzielił warstwy (a) VI–VII w. i (b) IX–X w., i osadził jednostkę w warstwie (b), tej samej, w której repo trzyma już `Drużynnika`. To jest prawidłowe zastosowanie kryterium 9 dispatchu i §10 (decyzja badawcza, nie pytanie do właściciela). Rozbieżność „dwa oszczepy u Maurycjusza vs `Ilość pocisków: 5`" jest zapisana zamiast zamiecionej, z poprawnym rozstrzygnięciem na rzecz danych jednostki.

---

### UWAGI (§3b) — wszystkie **kosmetyczne / rejestrowe**, żadna nie dotyczy GOAL, dowodu, zakresu, granic §9 ani gotowości do integracji

1. **Liczba mesh w raporcie do orkiestratora: 115 → faktycznie 117.** Mój pomiar i wydruk samego testu Operatora dają **117**. Pozostałe liczby zgodziły się co do cyfry (0,819 · 0,359 · 0,0036 · 0,4112 · 0,0086 · 1,408 · 0,740 · 0,093). Artefakt runu `01-operator.md` tej liczby nie niesie, więc ślad plikowy jest czysty — zaniżenie jest wyłącznie w raporcie czatowym. Klasyfikacja: rząd 5 tam, gdzie był dostępny rząd 1 (§13a). Do poprawienia w raporcie, nie w kodzie.
2. **Znalezisko poza zakresem, do rejestru jako osobny temat.** `gra/src/battle/manualBattle.ts:750` woła `buildUnitModel(bu.kategoria, bu.ownerColor)` **bez nazwy jednostki** — w tej scenie każdy model nazwany rodziny Opus 5 (T1, T2, T3 i teraz T4) spada do generyka. To defekt **preegzystujący i przekrojowy**, nie wprowadzony przez T4 i poza jego allowlistą (§14: zapisać jako nowy temat, nie poszerzać zakresu w biegu). Pozostałe cztery wywołania (`unitMiniPreview.ts:90`, `battleScene.ts` ×4) przekazują nazwę poprawnie.
3. **K10, przesłanka (i):** zdanie „koń strefy leśnej wyrasta na podłożu tarpanowatym (linia, z której wywodzi się konik polski)" podaje jako fakt pochodzenie konika polskiego od tarpana, które w nowszej literaturze jest sporne (konik to XX-wieczny projekt hodowlany wstecznej selekcji). Sekcja poza tym uczciwie oznacza całą decyzję jako nierozstrzygniętą źródłowo i opiera ją na dwóch innych, mocniejszych przesłankach (rozróżnialność w repo + zmierzona czytelność tokenu), więc nie zmienia to żadnego wyboru wizualnego. Do złagodzenia sformułowania przy okazji, nie do rundy 2.
4. **Literówka w komunikacie testu:** `(M0) ... podmieniła WSZYSTKIE 3 stałe pozy` — warunek sprawdza `GEOM_MUTATIONS.length`, czyli **5**. Sam tekst komunikatu został po wersji z 3 mutacjami.
5. **Nie jest zarzutem:** `disposeZelazoJezdziecOszczepamiOpus5Geometries()` jest eksportowana i nigdzie nie wołana — sprawdziłem, że **dokładnie tak samo** zachowują się `disposeBrazKonnicaOpus5Geometries` i `disposeZelazoKonnicaAsyryjskaOpus5Geometries`. Konwencja rodziny, stan preegzystujący, nie defekt T4.
6. **Process, do decyzji orkiestratora (§5a / C-062).** Operator zadeklarował effort jako „niesprawdzalny". Ustaliłem, że `get_session` **wystawia** `effort_level: "high"` i `flag_settings.effortLevel: "high"` — to jest źródło rzędu 1, więc określenie „niesprawdzalny" było za mocne. **Ale** jest to effort **sesji**, nie `opts.effort` per wywołanie `agent()`, a C-062 dotyczy dokładnie tej różnicy (tam kosmetyczne było `meta.phases[].model`). Ta sama sesja raportuje `model: "claude-sonnet-5"` jako model sesji, podczas gdy i Operator, i ja wykonujemy się na **Opus 5** — co dowodzi, że pola sesyjne opisują sesję, nie subagenta. **Wniosek: wymóg MODELU (Opus 5 dla obu ról, wyjątek graficzny §5a) jest spełniony i potwierdzony po obu stronach; wymóg EFFORT musi potwierdzić orkiestrator w skrypcie dispatchu, sprawdzając `opts.effort` na każdym wywołaniu `agent()` z osobna, nie w `meta.phases`.**

### Werdykt

Praca robi dokładnie to, co zamawiał dispatch: jednostka dystansowa dostała broń dystansową, w pozie rzutu, w liczbie zgodnej z `Ilość pocisków`, w spójnym kanonie kulturowym, z uczciwie napisaną i sprawdzalną sekcją historyczną, bez ani jednej regresji na 75 jednostkach. Testy są realne i — po mojej ablacji — udowodnione jako nietautologiczne w każdym pojedynczym punkcie. Zakres i granice czyste, merge do `main` bezkonfliktowy.

**Gotowość do przekazania Final Control: TAK.** Uwagi 1 i 4 do poprawienia redakcyjnie (bez rundy Operatora), uwaga 2 do założenia jako osobny temat w `REJESTR-PROSB-I-ZADAN.md` przed zamknięciem T4 (warunek §3b), uwaga 6 do rozstrzygnięcia przez orkiestratora.

**Ścieżki artefaktów mojej weryfikacji:** worktree `/home/user/wt-eval-ZELAZO-T4` · zrzuty `/tmp/claude-0/eval-t4-shots/` (`1-sj-front.png`, `2-sj-side.png`, `3-sj-back.png`, `8-cmp-orto.png`, `9-vs-druzynnik.png`, `10-token-skala.png`) · skrypty `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-t4-render.cjs`, `/tmp/claude-0/mut.cjs` (macierz ablacyjna), `/tmp/claude-0/sweep.cjs` (odcisk 75 jednostek), `/tmp/claude-0/p2.cjs` (przenikanie w układzie lokalnym), `/tmp/claude-0/owner.cjs` (parytet koloru właściciela) · odciski `/tmp/claude-0/sweep-main.json`, `/tmp/claude-0/sweep-t4.json`.