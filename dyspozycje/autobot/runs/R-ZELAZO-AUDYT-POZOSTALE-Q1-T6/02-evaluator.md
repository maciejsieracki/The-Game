Verification complete. Full report:

---

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T6
GOAL: Audytować i podnieść do standardu serii Opus 5 cztery jednostki
      śródziemnomorskie epoki Żelaza (Gwardia Tyreńska, Tyrski miecznik,
      Wojownik z żelaznym khopesh, Thorakites) — kod z
      `jednostki-z2-srodziemne.ts`, nigdy rygorystycznie zmierzony.
      [ZGODNY CO DO ZDANIA z 00-dispatch.md — §16a pkt 9 spełniony]
ZMIANY/COMMIT: `ba32ce6b`. merge-base(origin/main, gałąź) = `20137ab4`
      = tip origin/main → diff naiwny i diff od merge-base IDENTYCZNE (§9 poz. 9
      sprawdzone, nie założone). 4 pliki, +1584/−47, wszystkie w allowliście.
      `git diff --check` czysty. Zero sekretów.
TESTY (WŁASNE uruchomienie w WŁASNYM worktree, nie odczyt raportu):
      temat 83/83 · tsc 5.9.3 EXIT=0 · vite build (binarka, --outDir /tmp) EXIT=0 ·
      logic 213/213 · tech-tree 19/19 · research 33/33 ALL GREEN ·
      unit-replace 13/13 · combat 6/6 · zelazo-gate 24/24 · falanga(T3) 40/40 ·
      konnica asyryjska 31/31 · jeździec z oszczepami 57/57 · Celtowie 42/42 ·
      mezopotamia(T5) 72/72 · unit-power 4/2 (znany czerwony pre-istniejąco,
      NIEZMIENIONY). Każda liczba Operatora odtworzona co do cyfry.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (osobny subagent)
DEPLOY/PUSH: NIE WYKONANO. `git merge-base --is-ancestor ba32ce6b origin/main`
      → NIE. `main` = `20137ab4`, nietknięty.
```

## Model, który mnie wykonuje — sprawdzone, nie zgadnięte

**Mój system prompt podaje wprost: `claude-opus-5[1m]` (Opus 5, kontekst 1M); `env` podaje `CLAUDE_EFFORT=high`.** Zgodne z wymogiem dispatchu (Opus 5 High dla Evaluatora, temat wizualny, §5a).

**Zgłaszam jednak rozbieżność, zamiast ją przemilczeć (§13a — źródło rzędu 1 zamiast pamięci):** rekord sesji CCR (`get_session`) podaje `model: "claude-sonnet-5"`, `last_served_model: "claude-sonnet-5"`, `effort_level: "high"`. To jest jednak **rekord sesji RODZICA (orkiestratora, tytuł „Orkiestrator")**, nie mojego wywołania — z wnętrza subagenta nie mam dostępu do `opts.model` własnego dispatchu. Nie potrafię więc rozstrzygnąć tego z rzędu 1 i **nie twierdzę**, że dispatch był poprawny — podaję oba fakty. Dokładnie tej klasy rozjazd opisuje C-062.

## Metoda — nie przyjąłem ani jednej liczby Operatora

Własny worktree `/home/user/wt-eval-ZELAZO-AUDYT-T6` (detached na `origin/autobot/ZELAZO-AUDYT-T6-Q1`), własny `node_modules`. Napisałem **własny harness real-render**, niezależny od testu Operatora: `esbuild` buduje jeden bundel zawierający **obie** wersje modułu naraz (HEAD + `origin/main` wyciągnięty przez `git show` jako `z2MAIN.ts`/`unitsMAIN.ts`), żywy Chromium/Playwright + WebGL, własne implementacje SAT-OBB (15 osi), rzutu na płaszczyznę obrazu kamery gry i miary odróżnialności pikselowej. Skrypty: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/ev-run{,2,3,4,6}.cjs`, `ev-page.js`; zrzuty w `…/scratchpad/shots/` (`przed-{gt,tm,kh,th}.png`, `po-*.png`, `po-tyl-*.png`, `po-falangita.png`).

**Kamerę sprawdziłem u źródła, nie z raportu:** `gra/src/render/camera.ts:132` `degToRad(52)`, `camera.ts:123` `this.yaw = 0` (stały). Kierunek patrzenia `(0; −0,7880; −0,6157)` — zgodny z twierdzeniem Operatora.

## Co potwierdziłem własnym pomiarem (co do cyfry)

| Twierdzenie | Operator | Mój niezależny pomiar |
|---|---|---|
| mesh nazwane PRZED / anchors | 0/33, 0/30, 0/31, 0/32; brak | **identycznie**, `anchors` = brak we wszystkich 4 |
| mesh nazwane PO / anchors | 33/33, 30/30, 31/31, 32/32 | **identycznie**, `anchors` obecne we wszystkich 4 |
| A1 widoczność miecza Gwardii (rzut/oś własna) | 0,142 → 0,999 | **0,1412 → 0,9987** |
| A1 odniesienie rodziny (dory Falangity T3) | 0,894 | **0,8946**; dory Thorakitesa **0,9034**; miecz Tyrskiego **0,8296** (bez zmian PRZED/PO) |
| A2 strzałka łuku khopesza na ekranie | 0,0000 → ≠0 | **0,0000 → 0,0339** (na środkach segmentów); rozrzut poziomy **0,0000 → 0,0964** (identyczny co do 4 cyfr) |
| A2 kąt łuku w 3D | 1,550 rad | **1,550 rad — TAKI SAM PRZED i PO** (potwierdza tezę: problemem była widoczność, nie krzywizna) |
| A3 SAT dzwon/oko Thorakitesa | 0,0195 → 0,0000 | **0,0195 / 0,0195 → 0,0000 / 0,0000** |
| A3 arytmetyka przyczyny | promień 0,086 > wysunięcie oczu 0,068 | **potwierdzone w źródle**: `getGZ2AttBowl` radiusBottom `0.086*HEX_R`; oko przy `Z2_HEAD_S*0.5+0.004 = 0.068*HEX_R` (`Z2_HEAD_S = 0.128*HEX_R`) |
| A4 odróżnialność Gwardia/Tyrski | 0,373 → 0,558 | **0,3841 → 0,5693** (mój renderer, inne światła — pasmo się zgadza) |
| A4 pozostałe pary PRZED | 0,721–0,811 | **0,7226–0,7968** |
| B3 Thorakites vs Falanga | 0,576 → 0,578 | **0,5744 → 0,5813** |
| A5 dispatch EN | „Tyre Guard"/„Tyrian Swordsman" 28 → własny | **Tyre Guard 28→33, Tyrian Swordsman 28→30, Thorakites 32→32 (bez zmian)** |
| B1 progi chwytu Falangity | 0,0218 / 0,0335 / 0,0000 | **0,0218 / 0,0335 / 0,0000** |
| B1 progi chwytu Thorakitesa | 0,0093 / 0,0335 / 0,0000 | **0,0093 / 0,0335 / 0,0000** |
| proporcje h / minY | 0,7267 / 0,6650 / 0,7753 / 0,7407, minY=0 | **identycznie** |

**B1 — pełny przegląd własny (nie próbka):** we wszystkich czterech modelach PO naprawie SAT broń×tors, broń×głowa, broń×noga, broń×ramię_uzbrojone, tarcza×kończyny = **0,0000**. Jedyne zachodzenie to chwyt (pięść 0,016–0,0335). Zero kolizji potwierdzone.

**Khopesz JEST zakrzywiony** (pytanie dispatchu) — segmenty 0,40 / 0,95 / 1,55 rad wobec części prostej, identycznie przed i po. **Thorakites JEST odróżnialny od Falangi** (pytanie dispatchu) — 0,5744/0,5813, inna tarcza (owalna vs okrągła), inny helm, inny pancerz; potwierdzone też wzrokowo na zrzutach.

**Weryfikacja wzrokowa (§9 poz. 6a, żywy Chromium, kamera gry).** `przed-gt.png`: miecz Gwardii to kikut wielkości jelca — **defekt A1 widać gołym okiem**. `po-gt.png`: pełna klinga uniesiona, helm złocony, promienie gwiazdy złote. `przed-kh.png` vs `po-kh.png`: sierp z kikuta staje się **czytelnym, pełnym łukiem** — najbardziej okazała z pięciu napraw. `przed-th.png` vs `po-th.png`: twarz Thorakitesa wychodzi spod dzwonu helmu.

## Czego Operator NIE zepsuł — dowód, nie deklaracja

- **`buildTriari` (ten sam plik, poza allowlistą)**: zbudowałem obie wersje w jednym harnessie i porównałem pełną sygnaturę (typ geometrii, liczba wierzchołków, pozycja, kwaternion, skala, kolor per mesh) — **identyczna, 37 mesh**. Byte-identyczność potwierdzona niezależnie.
- **`buildFalangita` (T3)**: `git diff origin/main..HEAD -- gra/src/render/hastati-falangita.ts` jest **pusty** — plik nietknięty. 27 mesh, wszystkie nazwane.
- **Zmiana wspólnych funkcji pomocniczych — jedyne miejsce, które Operator sam wskazał do zakwestionowania — rozstrzygam NA JEGO KORZYŚĆ, z dowodem.** Nowe parametry są **wyłącznie doklejone na końcu, z domyślną wartością pustą**. Sprawdziłem sygnatury w `origin/main`: `shldY: number = Z2_SHLD_Y` (`z2MAIN.ts:310`) i `bladeGeo: THREE.BoxGeometry = getGZ2Blade()` (`z2MAIN.ts:353`) **już istniały z domyślnymi wartościami** — jawne przekazanie ich w wywołaniach jest no-opem. Jedyną inną eksportowaną funkcją tego pliku jest `buildTriari`, a jej wyjście jest byte-identyczne. **Zasięg skutku = allowlista.** Litera zapisu dotyczy funkcji, cel zapisu dotyczy wyjścia innych jednostek — cel jest spełniony i udowodniony pomiarem, nie założeniem.
- **Sprostowanie założenia dispatchu przez Operatora jest PRAWDZIWE**: `git log origin/main -- gra/src/render/jednostki-z2-srodziemne.ts` → dokładnie jeden commit `546f6a51`; `buildFalangita` faktycznie mieszka w `hastati-falangita.ts`, który dostał T3 osobnym commitem `5aaddf38`. **Dispatch mylił się, Operator sprawdził i sprostował — to zachowanie wzorcowe.**
- **Klasa błędu T2 (tarcza tyłem) — sprawdzona DRUGĄ, niezależną metodą.** Zamiast liczyć normalne, wyrenderowałem każdy model z materiałem-markerem na polu gracza i policzyłem piksele z kamery gry vs z tyłu: gt 3062/1918, tm 2394/1594, kh 2520/1279, th 2353/**0**. **Żadna tarcza nie jest odwrócona.**
- Brak trwałego stanu (save/load), brak asymetrii gracz/AI/MP (moduł czysto renderujący, jedyny parametr to `ownerColor`), brak ścieżek brzegowych. Trzy twarde FAIL-e domeny gry — **nie dotyczą**.
- §9: zero `npm run build`/`dev` (test i ja używamy binarki `node ./node_modules/vite/bin/vite.js`, `--outDir` poza repo), zero `git add -A` (`git add` per plik), `WERSJE.md` i manifest nietknięte, `playbook.json` nietknięty, zmiana procesu nie jedzie w allowliście produktowej, brak deployu/pusha do `main`.

## Nietautologiczność — uruchomiłem macierz sam

Macierz 11×11 jest **praktycznie diagonalna**: każda z H1–H11 czerwienieje pod swoją mutacją, baza cała zielona. Trzy komórki poboczne (M1→H8, M5→H4, M11→H2) są fizycznie koniecznymi następstwami, nie zanieczyszczeniem. Osobna mutacja dispatchu D czerwieni wyłącznie A5–A6 i zostawia A1–A4, A7 zielone. **Progi są brane z renderu rodziny w tym samym przebiegu**, nie wpisane liczbowo (H3 ≥0,60 widoczności dory Falangity policzonej wtedy = 0,895) — to jest właściwe rozwiązanie i utrzymuje standard ustalony w T4/T5.

## UWAGI — klasyfikacja wg §3b

### N1 (NIE kosmetyczna) — dwie fałszywe liczby zapisane do repozytorium

`gra/src/render/jednostki-z2-srodziemne.ts:124-125`, sekcja B2:
> „Gwardia -0,603, Tyrski miecznik -0,603, **Khopesz -0,788, Thorakites -0,788** — kazda zwrocona DO kamery."

**Dwie z czterech liczb są nieprawdziwe.** Poprawna wartość dla wszystkich czterech to **−0,603**. Dowód potrójny: (a) **własny test Operatora drukuje** `normale do kamery={"gt":-0.603,"tm":-0.603,"kh":-0.603,"th":-0.603}`; (b) mój niezależny pomiar normalnej zewnętrznej (lokalne `+Z` dla płyty egipskiej i thureosa — grubość 0,016/0,019 leży w Z; lokalne `+Y` dla ściętego walca tarcz okrągłych) daje **−0,6034 dla wszystkich czterech**; (c) `−0,788` to dokładnie `−sin52°`, czyli składowa Y **kierunku patrzenia** cytowanego dwie strony wyżej w tym samym nagłówku (linia 72) — Operator przeniósł własną stałą kamery do wiersza tarcz. Sprawdziłem też, że dla płyty i thureosa lokalne `+Y` daje w świecie dokładnie `(0;1;0)`, czyli `dot = −0,788` — to jest oś PIONU tarczy, nie jej lica.

**Merytoryka twierdzenia jest PRAWDZIWA** (potwierdziłem renderem-markerem wyżej), **a test H7 jest napisany POPRAWNIE** — dobiera oś do bryły z `anchors.shieldKind` i mutacja M7 czerwieni wyłącznie H7. Wadliwy jest **wyłącznie komentarz w źródle**. Poprawka: dwie liczby na `−0,603`.

### N2 (NIE kosmetyczna) — nieprawdziwe zdanie uzasadniające w `units.ts`

`gra/src/render/units.ts`, blok komentarza dodany tym commitem (powtórzone też w treści commita):
> „wszystkie żywe wywołania `buildUnitModel` w tym repo przekazują `stats['Jednostka']`, czyli nazwę POLSKĄ — ścieżka angielska jest dziś **nieosiągalna** w grze."

Sprawdziłem **wszystkie osiem** żywych wywołań, po jednym:
- `src/ui/unitMiniPreview.ts:90` → `u.Jednostka` (PL, ale **nie** `stats['Jednostka']`);
- `src/render/units.ts:5453` i `:5471` → `unit.typeId` (PL — potwierdzone: `main.ts:2931` porównuje `u.Jednostka === typeId`);
- `src/battle/manualBattle.ts:750` → **nie przekazuje nazwy w ogóle**;
- `src/battle/battleScene.ts:4105 / 4273 / 4990 / 15652` → `String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa)` — **z fallbackiem**, a komentarz obok (`battleScene.ts:4986-4989`) mówi wprost: „**`bu.nazwa` now holds the ENGLISH display name**".

Czyli: (a) cztery z ośmiu wywołań **nie** przekazują `stats['Jednostka']`; (b) w pozostałych czterech istnieje **udokumentowany fallback na nazwę ANGIELSKĄ**. Absolut „nieosiągalna" **nie został wykazany**. Zdanie, którym Operator odpowiedział orkiestratorowi, było poprawne i precyzyjne — do repozytorium trafiła wersja uproszczona do nieprawdy.

**Uwaga: to działa NA KORZYŚĆ naprawy.** Dopisanie aliasów EN nie jest „utwardzeniem ścieżki dziś nieosiągalnej" — jest naprawą ścieżki osiągalnej przez fallback. Poprawka: przepisać zdanie na wersję z raportu Operatora, z jawnym wskazaniem fallbacku `?? bu.nazwa`.

### N3 (NIE kosmetyczna) — twierdzenie o czynności, która nie została wykonana

`gra/src/render/jednostki-z2-srodziemne.ts:637` (K3 sekcji khopesza):
> „Rzecz **zapisano** jako osobny temat do rejestru, nie jako uwage w raporcie (§3b)."

**Nie zapisano.** Gałąź nie dotyka `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (`git diff --name-only` = 4 pliki, rejestru nie ma), a sam rejestr nie zawiera żadnego wpisu o khepreszu. Operator **fizycznie nie mógł** tego zrobić — rejestr jest poza allowlistą — i uczciwie wymienił trzy odłożone sprawy w raporcie. Wadliwy jest czas przeszły dokonany: powinno być „**do zapisania przez orkiestratora**". Wiąże się to wprost z §16b pkt 4: **Final Control ma sprawdzić, czy wpis w rejestrze faktycznie powstał**, zanim temat zostanie zamknięty. Trzy sprawy do rejestru: (1) „Iron Khopesh Warrior" (EN) buduje model brązowy — przechwyt przez `units.ts:1355`; (2) khepresz na szeregowym (dotyczy też `jednostki-p4-melee.ts`); (3) Tyrski miecznik ma Pancerz 4 przy sylwetce bez pancerza.

### N4–N7 (kosmetyczne)

- **N4.** Raport mówi „A3 [naprawiono zmianą] jednej [stałej] (`HELM_Y`)". Diff zmienia **cztery** pozycje Thorakitesa: `bowl` (HELM_Y), `brow` (+0,026 → +0,036), `crB` (+0,036 → +0,062), `crH` (+0,078 → +0,104). Pozostałe trzy to poprawne dociągnięcie diademu i grzebienia za podniesionym dzwonem (sprawdziłem wzrokowo — helm czyta się dobrze), ale mutacja M6 cofa **tylko** `HELM_Y`, więc trzy pozostałe przesunięcia nie są objęte żadną asercją. Nie jest to tautologia (nic ich nie twierdzi), lecz raport zaniża liczbę zmian.
- **N5.** Raport Operatora podaje normalne tarcz jako „−0,603 / −0,603 / −0,603 / −0,603" (poprawnie), a plik, który ten sam Operator zacommitował, podaje dwie z nich jako −0,788. **Raport i artefakt są ze sobą sprzeczne** — rację ma raport (patrz N1).
- **N6.** `maxR` w nagłówku (0,3080 / 0,4060 / 0,3431 / 0,4757) różni się od mojego pomiaru po wierzchołkach (0,2998 / 0,3986 / 0,3431 / 0,4677) o systematyczne ≈+0,008 na trzech z czterech — typowa różnica „narożnik bbox" vs „faktyczny wierzchołek". Bez znaczenia: limit heksu 0,866 trzyma z ogromnym zapasem przy obu metodach, a `h` i `minY` zgadzają się co do cyfry. Metoda nie jest w nagłówku nazwana.
- **N7.** K7 sekcji Thorakitesa nazywa broń Falangity „sarissą" (0,74*HEX_R); liczba jest poprawna (`hastati-falangita.ts:230`), ale ten sam plik nazywa ten mesh `falangita-dory-shaft` i opisuje go jako „dory 0.74". Niespójność nazewnicza wewnątrz repo.

## Sekcje historyczne — sprawdzone własną wiedzą, źródło po źródle

Cztery sekcje K-style, **rzetelne, z jawnie nazwaną hierarchią pewności**. Sprawdziłem cytaty: Brązowe Wrota z Balawat / Salmanasar III 859–824 (daty poprawne, panele trybutu Tyru i Sydonu — tak); reliefy Sennacheryba 705–681 (poprawne); **Ezechiel 27,10-11 — cytat wierny** (najemnicy, tarcze i hełmy zawieszane na murach, mężowie z Arwadu); **Herodot VII.89 — wierny** (hełmy zbliżone do greckich, lniane pancerze, **tarcze bez obręczy**, oszczepy; 480 p.n.e., kontyngent morski); Pliniusz NH IX o purpurze murex — zgodne; panoplia z Argos, wykopaliska P. Courbina 1953, ostatnia ćwierć VIII w. p.n.e., brązowy pancerz dzwonowy + Kegelhelm — poprawne; kości słoniowe z Nimrud i Arslan Tash, warsztaty fenickie IX–VIII w. — poprawne; khopesz jako broń epoki brązu wychodząca z użycia bojowego ok. 1300 p.n.e., przeżywająca ceremonialnie (egzemplarze z grobowca Tutanchamona) — poprawne; XXVI dynastia saicka 664–525 p.n.e. — poprawne; khepresz jako korona królewska ze skóry/usztywnionej tkaniny z krążkami i ureuszem — poprawne; łuski z Malkata i grobowca Tutanchamona — poprawne; thureos przejęty po najeździe galackim 280–275 p.n.e., kolczuga wynalazkiem celtyckim tego stulecia, helm attycki otwarty jako przeciwieństwo korynckiego — poprawne.

Sprawdziłem też liczby z `units.json` cytowane w sekcjach: Gwardia 8/7/4/Health 24/koszt 18 vs Tyrski 8/6/4/24/18 — **twierdzenie „różnią się WYŁĄCZNIE Obroną" jest dokładnie prawdziwe**; Thorakites ma najwyższą Obronę (9) i Typ=Spearman; khopesz i Thorakites mają najwyższy Pancerz (6). Promienie tarcz 0,126 vs 0,112 zgodne z geometrią.

**Trzy twarde anachronizmy są nazwane wprost, nie zamiecione** (żelazny khopesz jako obiekt, który nie istniał; khepresz na szeregowym; thorakitai o 300–900 lat późniejsi niż rama gry), a rozbieżność ze źródłem (Herodot: tarcze **bez** obręczy, model **ma** obręcz) jest zgłoszona wraz z powodem — decyzja czytelności gry, nie ustalenie historyczne. **Nie znalazłem ani jednego anachronizmu przemilczanego.**

Osobno chwalę `K1` sekcji Gwardii, „UWAGA METODOLOGICZNA": Operator zapisuje wprost, że **najpierw pomiar pokazał problem, a dopiero potem szukano uzasadnienia rzeczowego**, i wymienia, co odrzucił (pancerz łuskowy — bo Pancerz w `units.json` ten sam; grzebień karmazynowy — bo to znacznik grecki). To jest dokładna odwrotność błędu z T5 i wzorzec dla T7–T11.

## Klasyfikacja uwag wg §3b i werdykt

**N1–N3 nie dotyczą:** kryterium `GOAL` (audyt wykonany i to bardzo dobrze — pięć realnych defektów znalezionych pomiarem, wszystkie odtworzone przeze mnie niezależnie), **dowodu wykonania** (bramki i testy tematu — wszystkie zielone, uruchomione przeze mnie osobno; macierz ablacyjna diagonalna), **zakresu** (diff mieści się w allowliście co do pliku, a skutek co do funkcji jest udowodniony), **granic §9** (żadna nienaruszona) ani **gotowości do integracji** (kod jest poprawny, bezpieczny i bez konfliktów — merge-base = tip `main`).

**Nie wymuszają więc powrotu do Operatora i nie zużywają rundy.** Ale **nie są kosmetyczne**: to są **trzy nieprawdziwe zdania zapisane do repozytorium** — dokładnie ta klasa, którą Evaluator złapał w T5 (uwagi 1–2) i którą orkiestrator domknął mikro-poprawką `dc7f7bb4`. Zostawienie ich jako wolnej uwagi w raporcie jest jawnie zakazane przez §3b.

**Rekomendacja (najtańsza, zgodna z precedensem T5): orkiestrator poprawia trzy fragmenty komentarza przy integracji** — ten sam plik, ten sam, już zatwierdzony fragment allowlisty, zero zmian geometrii, zero wpływu na testy:
1. `jednostki-z2-srodziemne.ts:124-125` → „Khopesz **−0,603**, Thorakites **−0,603**";
2. blok w `units.ts` → zdanie o wywołaniach `buildUnitModel` przepisać na wersję z raportu Operatora (wymienić cztery różne źródła nazwy) i **nazwać fallback `?? bu.nazwa` na nazwę angielską** zamiast twierdzić „ścieżka EN nieosiągalna";
3. `jednostki-z2-srodziemne.ts:637` → „zapisano" → „**do zapisania przez orkiestratora w rejestrze**".

**Plus, obowiązkowo przed zamknięciem (§3b + §16b pkt 4): trzy sprawy z N3 muszą faktycznie trafić do `dyspozycje/REJESTR-PROSB-I-ZADAN.md`** jako osobne tematy. Final Control ma to sprawdzić jawnie, a nie przyjąć na słowo — dziś ich tam nie ma.

N4–N7 są kosmetyczne i nie wymagają osobnego tematu.

**Werdykt: PASS-WITH-NOTES.** Praca merytoryczna jest bardzo dobra — pięć defektów znalezionych realnym pomiarem (w tym nowa, wcześniej w tej serii nie łapana klasa „element niewidoczny z jedynej kamery gry"), wszystkie naprawy minimalne i uzasadnione, zero regresji w 11 zestawach testów, dowód nietautologiczności per-asercja z progami branymi z rodziny, sekcje historyczne rzetelne i uczciwe wobec anachronizmów, a `buildTriari` i `buildFalangita` nietknięte z dowodem. Wada leży wyłącznie w **dokładności trzech zdań zapisanych do repozytorium** — i jest to trzeci temat serii z rzędu, w którym ta sama klasa błędu wraca, więc warto ją wpisać jako regułę przeciw samooszukiwaniu do promptu T7 („każda liczba w komentarzu musi pochodzić z tego samego przebiegu co asercja, która ją mierzy; każde »zapisano/sprawdzono« musi wskazywać plik i linię, gdzie to widać").

**Gotowość do integracji: TAK**, po mikro-poprawce trzech fragmentów komentarza i po faktycznym wpisie trzech spraw do rejestru.