# Analiza dokumentacji — The Game (Civ)


Zakres przeanalizowany: `PLAYBOOK-operacyjny-Civ.md`, `SILNIK/` (3 pliki MD), `Civ-MAPA/` (3), `Civ-UNITS/` (4), `Civ-CYWILIZACJE/` (3), `Civ-AI/` (4), `MIASTO/` (6), `Dyplomacja/` (4), `UI/` (2) oraz `docs/CURSOR-PLAN-DZIALANIA.md`.

---

## 0. Streszczenie wykonawcze

Projekt **The Game** — przeglądarkowa gra 4X (TypeScript + Vite + Three.js, single-file `Gra-podglad.html`) rozwijana w modelu multi-agent: 10 działów (lane'ów) koordynowanych przez Mastera, z Maciejem jako decydentem produktowym w protokole ABC. Hierarchia prawdy: **kod (`gra/src/game/*.ts`) > dane (`gra/data/*.json`) > panele (`*.xlsx`) > dokumenty**.

Kluczowe znalezisko: **dysproporcja między dokumentacją a stanem kodu**. Najważniejszy dokument architektoniczny `SILNIK-ARCHITEKTURA-DEWELOPER.md` (stan 2026-06-23) opisuje pętlę tury jako „ekonomia miast + bankowanie + auto-badania" i listuje 7 modułów w „kolejce do wpięcia" — tymczasem `docs/CURSOR-PLAN-DZIALANIA.md` (audyt 2026-06-26) informuje, że gra jest **grywalna end-to-end**, a większość modułów jest już wpięta (AI, produkcja, nauka, save/load, dyplomacja, atak z mapy, oblężenie partial). `main.ts` urósł z ~1234 do ~2827 linii. To największa luka między docs a code.

---

## 1. Konwencje i decyzje projektowe (wspólne, cross-lane)

### 1.1 Konwencje operacyjne (PLAYBOOK)
- **Oś Kontrola ↔ Autonomia** — dobór narzędzia zależy od rodzaju zadania, nie od nastroju.
- **3-warstwowy kontekst lane'a:** `<LANE>-STAN.md` (≤12 linii, czytany zawsze) → `<LANE>.md` (~60–100 linii, czytany gdy są nowe zadania) → `<LANE>-DO-MASTERA.md` (append-only, ostatnie 10 wpisów; reszta → archiwum).
- **Własność plików twarda:** dział edytuje TYLKO swoje pliki. Kanon `main.ts` + `Gra-podglad.html` = wyłącznie SILNIK.
- **Handoff przez pliki:** `dyspozycje/_handoff/<OD>-do-<DO>_<temat>.md` (92 pliki). Nigdy bezpośrednia edycja cudzego lane'a.
- **Protokół ABC:** Master proponuje (A/B/C + rekomendacja) → Maciej akceptuje → dopiero wtedy dyspozycje do działów. Wyjątek: czysto inżynierskie wpiecie zatwierdzonego modułu.
- **Tryb modelu:** Działy = Sonnet (domyślnie); Master = Opus; eskalacja "POTRZEBNY OPUS" gdy Sonnet nie daje rady.
- **Bezpieczniki iteracji:** loop-until-done MAX 3 przebiegi; verify-loop MAX 2 cykle poprawek; fan-out pilot 2 → max 10 równoległych (Haiku); MAX 12 wywołań subagentów na zadanie; tournament MAX 6 rund.
- **Backup rolling:** `cp <plik> <plik>.bak-<DZIAL>` przed każdą zmianą (ostatnia zielona wersja); 1 backup per plik; wyjątek — kanon ma datowane lifeline-backupy.
- **Sędzia (adversarial verification):** bramka u Mastera dla KAŻDEGO deliverable do kanonu i działań cross-lane; osobny świeży agent wg DoD; rutyna wewnątrz działu = wystarczą obiektywne testy własne.

### 1.2 Konwencje środowiska (wspólne zagrożenia)
- **OneDrive dehydratacja:** mount bash widzi pliki ucięte („Unexpected end of file") mimo kompletności w chmurze. Lekarstwo: Read (hydracja) + czekaj + retry, lub Windows „Always keep on this device" na `gra/`. **NIGDY nie rekonstruować plików ręcznie.**
- **Build wyłącznie `npx vite build --outDir /tmp/civ-dist --emptyOutDir`** — OneDrive blokuje `unlink` w `gra/dist/` (EPERM). NIGDY `npm run build` (ma hook `prebuild = export-data.py`, który **regeneruje wszystkie JSON-y i kasuje pracę innych działów**).
- **Eksport JSON tylko celowany** (`export-<panel>.py`), NIGDY globalny `export-data.py`.
- **Kod ASCII** (polskie znaki przez `\uXXXX` lub komentarze ASCII; wyjątek: UI dopuszcza literalny UTF-8).

### 1.3 Decyzje projektowe zatwierdzone przez Macieja
- **Respekt = ratio-share** (`100 × potega_self / (potega_self + potega_partner)`, guard 0+0→50) — zatw. 2026-06-25 (SPEC-Respekt). 6 komponentów, wagi 28/20/18/14/12/8 (militaria 48%).
- **Bonusy cywilizacji = pełny schemat `CivBonus[]`** (`{typ, cel, wartosc, opis, realizuje}`) — zatw. 2026-06-25 (PROPOZYCJA-dyplomacja-AI-v0.1 §5.3).
- **Respekt oblicza czysta funkcja w `diplomacy.ts`**, dane agreguje SILNIK — zatw. (Kandydat A, 14/15).
- **Model budynków compound** — mnożnik `budynek_mnoznik_poziomu = 1.10` (+10%/epokę), poziom = `epoka_miasta − epokaWejścia + 1` (MIASTO §4).
- **Trzy waluty robocze:** Praca (budowa), Handel (suwak → Nauka/Pieniądz/Luksus), Pieniądz (globalny skarbiec). Kurs 1 Pieniądz = 1 Praca (MIASTO/Schemat §2).
- **Irygacja TYLKO na polu bezpośrednio przylegającym do rzeki** — koniec irygacji ciągniętej bez rzeki (Ulepszenia-terenu-spec §1).
- **Rekrutacja jednostki = −1 ludność** (MIASTO/Schemat §8.1).
- **Okolica kompaktowa (wariant B)** w panelu miasta — pełny zasięg renderuje MAPA na mapie świata (UI Spec-UI §3.7).
- **Eliminacja = utrata WSZYSTKICH miast** (nie tylko stolicy); zdobycie stolicy przenosi kapitułę (AI/victory.ts, CYWILIZACJE §5.7).
- **Granica AI:** taktyczna w bitwie (UNITS) ↔ strategiczna przeciwnika na mapie (dział AI) (UNITS §6).

---

## 2. Specyfikacje designu per dział

### 2.1 SILNIK (integracja, pętla tury, kanon)
**Dokumenty:** `README-SILNIK.md`, `SILNIK-ARCHITEKTURA-DEWELOPER.md` (stan 2026-06-23), `SILNIK-HANDOVER-DO-MASTERA.md` (2026-06-24).

- **Zakres:** bootstrap gry, pętla tury (klawisz „N"), wpinanie `game/*` w pętlę, publikacja kanonu.
- **Architektura czystości:** logika gry czysta (bez DOM/THREE, testowalna w Node); `render/*`, `ui/*`, `battle/*` trzymają DOM/THREE; `main.ts` = jedyne miejsce sklejające.
- **Pętla tury wg dokumentu:** reset ruchu → `turn++` → `advanceCityEconomy` → bankowanie gracza → `researchStep` → HUD + mgła. To, co poza tym (produkcja, AI, zwycięstwo, upkeep, oblężenia, dyplomacja, kultura, Porządek, save) = „kolejka KROK 2–8".
- **Pipeline danych:** `*.xlsx → export-data.py → gra/data/*.json → loader.ts → silnik` (mapowanie 11 Exceli w §8).
- **Parametry:** `SILNIK-parametry.xlsx` (~155 pozycji, 7 arkuszy) + arkusz `ZASZYTE-w-kodzie` (dług techniczny: SEED=12345, wzór trafienia, cała walka §5l NIE data-driven mimo `terrain-combat.json`, duplikat `terrain-yields` w `economy.ts`, DEFAULT_SIGHT=3, RIVER_MOVE_BONUS=4 itd.).
- **Bramka buildu:** `vite build` do `/tmp` → smoke + battle-smoke + logic + combat zielone → `cp /tmp/civ-dist/index.html ../Gra-podglad.html`.
- **Orphany (KROK 8):** `research.ts`, `player-economy.ts` (duplikaty `playerState`/bankowania), `upkeep.ts`, `barbarians.ts`, `converters.ts` — importowane przez nikogo.

### 2.2 MAPA (terenu, render, miasta-render, surowce)
**Dokumenty:** `README-Civ-MAPA.md`, `DOKUMENTACJA-Civ-MAPA.md` (2026-06-23), `MAPA-TASKOW.md`.

- **Zakres:** `src/render/scene.ts`, `src/map/*`, `src/render/cities.ts`, `stoneCity.ts`, `bronzeCity.ts`, `resources.ts`. Granica z MIASTO: MAPA = wizualne buildery miast; MIASTO = stan/logika.
- **Geometria (twarda reguła):** heksy pointy-top, **ZERO rotateY** (rotacja rozjeżdża kafelkowanie); `HEX_R=1.0`; `axialToWorld(q,r)`.
- **Generator:** `generateMap(36,28,seed)` deterministyczny (mulberry32 + fBm). Przebiegi: teren+las → pierścień wybrzeża (każdy ląd przy morzu ma ≥1 wybrzeże) → rzeki (po grafie wierzchołków, STOP przy pierwszej wodzie, delta-wachlarz na ujściu) → złoża → pozycje startowe (Poisson-disk).
- **Renderer:** InstancedMesh per `TerenBazowy`, miękkie przejścia biomów (`blendedTerrainHex` 0.18 ląd / 0.07 woda), jitter HSL, paleta `TERRAIN_VISUALS` (7 terenów z color/height/yOffset/top).
- **Miasta:** 10 poziomów, warianty z murem i bez (mur niezależny od poziomu), centrum = świątynia charakterystyczna per cywilizacja. Kamień: L1–5 prymityw, L6–10 cegła. Brąz: Grecja (Partenon) + Rzym (podium+czerwone dachówki) gotowe; Sumer/Egipt/Aztek TODO.
- **Surowce:** małe nakładki (mniejsze niż jednostka), 6 typów (koń/owca/bydło/lama/glina/ruda).
- **Dług:** martwy `buildRiverEdgePoints`, nieużywane `RIVER_BANK_*`; parametry renderu jeszcze zaszyte w TS (proponowane JSON-y `render-*.json`); klastry miast na mapie niezaimplementowane.

### 2.3 UNITS / BITWA (modele jednostek + bitwa taktyczna)
**Dokumenty:** `README-UNITS.md`, `Dokumentacja-UNITS-BITWA.md` (2026-06-25), `Macierz-walki-analiza.md`, `Referencje-jednostek/`.

- **Zakres:** `src/render/units.ts` (jedyny właściciel modeli), `src/battle/*`. Granica: UNITS = AI taktyczna w bitwie; dobór armii = poza lane.
- **Render jednostek:** ~14 kategorii + 7 super-jednostek per kultura (Rzym/Grecja/Chiny/Zulu/Inka/Egipt/Sumer). Awatar R6 (Roblox-style), `buildUnitModel(category, ownerColor, unitName?)` — nazwa opcjonalna dla wariantów kulturowych. Reguła hełmów: każda jednostka wręcz ma widoczny hełm; strzelcy mogą bez. Paleta „vivid distinct" per kategoria + `cultureHouseColor` per kultura + `OWNER_COLORS[8]`.
- **Bitwa taktyczna (B7 rework):** siatka kwadratowa **34×78**, ruch 4-kier Manhattan, dystans = Manhattan w kaflach. Facing (`Dir N/E/S/W`), `relativeHit` → front/flank/rear → `flankRearDefensePenalty`.
- **Morale (złożony model):** `Morale bazowe` + `Morale ucieczki` per jednostka; rout gdy `morale ≤ fleeMorale`; rout-before-death; `ARMY_MORALE_LOSS_THRESHOLD=0.25` (strona przegrywa gdy morale armii < 25%). 8 modyfikatorów (flanka −8, tył −15, szarża jazdy −15, zabicie +6, wróg pada obok +5, osaczenie −10, teren obronny −5 do progu, aura załamania ×1.3 HP). Niezłomni (`isNeverRout`) nie routują. 9. Generał = placeholder (`MORALE_GENERAL_AURA=0`).
- **Amunicja/pilum (B6):** `ammoCount` czyta „Ilość pocisków"; Legionista = 2 pila potem gladius. Pociski: arrow/javelin/pilum/sling (różne wymiary × `TILE_S`).
- **Prędkość:** wirtualny zegar `vNow`, `SPEED_STEPS=[1,2,4,8,16,32,64,128,256,512]`, klawisz S cykluje, P pauza. Czysty time-scale — wynik bitwy identyczny na wszystkich prędkościach.
- **Oblężenie (SIEGE v2):** `siegeWall.ts` (9 stylów per cyw), machiny (Taran/Wieża/Katapulta z `units.json` Typ=Siege, niezłomne), mur +200% obrony, brama HP=200, wieża oblężnicza pozwala wejść na mur.
- **Audio:** procedural Web Audio (melee/shot/death/rout/victory + ambient bed), klawisz M toggle.
- **Macierz walki (v2.0):** Legionista OP (score 30, 0 porażek — brak countera), Falanga OP (27, 1 porażka), Wojownik/Łucznik SŁABE. Propozycje korekt: bonus Włócznika vs Legionista (hard counter), Health Włócznika 65→55, pre-battle salwa Łucznika. `dmg_scale=/10`.
- **TODO:** sterowanie graczem + faza rozstawiania (czeka UX); wiązanie `battle-params.json` (PRZYSZŁY krok — dziś stałe w kodzie); rally generała; morale-exemption dla cyw czysto dystansowych.

### 2.4 CYWILIZACJE (scalone: DANE + DYPLOMACJA + AI)
**Dokumenty:** `DOKUMENTACJA-DEV-CYWILIZACJE.md` (v1.0 2026-06-25), `SPEC-Respekt.md` (zatw.), `PROPOZYCJA-dyplomacja-AI-v0.1.md`.

- **Dział scalony:** 9 cywilizacji + 20 technologii + model dyplomacji + AI + barbarzyńcy.
- **Dane:** `civs.json` (9 cyw: styl, jednostka spec., bonus, religia, `nazwyKlastra[10]`, `mnoznikHandelPieniadz`, `ikonaId`, `bonusy[]`). Start: 1 gracz + 9 rywali AI tego samego typu = klaster. `bonusy[]` nowo dodane pole (BonusCyw: `typ/cel/wartosc/opis/realizuje`; słownik 6 typów; realizuje: walka/miasto/ekonomia/mapa).
- **Tech:** 20 technologii (Kamień 10 + Brąz 10), koszty 15–100, gate Brązownictwo=45 / Waluta=100. Model nauki podzielony: koszty = CYWILIZACJE; produkcja Nauki per miasto = MIASTO; agregacja worka = EKONOMIA; wybór tech AI = CYWILIZACJE.
- **Dyplomacja:** Relacja = Zaufanie + Respekt (0–200), start 20+30=50. 5 tierów (Wojna→Sojusz). 21 zdarzeń jednorazowych + 8 stanów per-turę. 12 akcji. `aiDiplomacyStance` (8 archetypów + DrobnaCywilizacja). `computeRespekt` (6 komponentów, wagi 28/20/18/14/12/8). `tickDiplomacy` (per-tura, niemutowalne). `decideAIDiplomacy` v0.1 = 4 komendy (trybut/pokój/wojna/żądaj trybutu); sojusz/handel = v0.2 TODO. Archetypy agresja/handel/lojalność per cyw.
- **AI:** `decideAITurn` (produkcja → ruch/atak → endTurn), 9 archetypów (`CIV_TO_ARCH`), 3 poziomy trudności (Prosty/Normalny/Trudny), `chooseAIResearch` (heurystyka punktowa), `decideAIReaction` (fight/flee), `decideAIReinforcements`, `barbarians.ts` (obozy/spawn/agresja, `BARBARIAN_OWNER_ID=-1`).
- **Testy:** diplomacy 119/0, ai 132/0, research ~22, barbarians ~25 (stan 2026-06-25). Wszystkie moduły **NIEWPIĘTE** do pętli tury wg tej dokumentacji — wpina SILNIK.
- **Rozbieżności:** `TypCywilizacji` enum ma 7 typów (+ `Babilon`=Sumer bridge); `civs.json`/`ai-params.json` mają 9 (Celtowie/Germanie brak w enum → fallback Greków). `wartosc` vs `wartość` (ASCII vs diakrytyk) — ryzyko cichego `undefined` w `ai.ts` (barbarians.ts robi to dobrze).

### 2.5 AI (architektura — dokumentacja implementacyjna)
**Dokumenty:** `README.md`, `Spec-AI.md` (design §1–9), `Spec-AI-architektura.md` (v0.1 2026-06-23), `START-nowy-task-AI.md`.

- **Zasada żelazna:** moduły AI = czyste funkcje (zwracają komendy, nie mutują stanu). AI nie dotyka `main.ts`/renderu/bitwy bezpośrednio.
- **`decideAITurn(playerId, units, cities, map, data, opts) → AICommand[]`:** `move/foundCity/attack/build/endTurn`. Opcje: `civType`, `cityBuildings`, `poziomTrudnosci`, `canAfford`, `clusterCenter/clusterRadius`.
- **Pętla:** podział my/enemy → archetyp → produkcja (`chooseCityProduction`: Zagrożenie/Wczesna/Środkowa + delta archetypu × 20) → ruch (osadnik/bojowe: sąsiad-wróg→atak, marsz na najbliższe miasto wroga, eksploracja wiosek, patrol, fallback 4f) → endTurn.
- **`chooseAIResearch`** (heurystyka: Spichlerz +120, Brązownictwo +70/90, Mury +110, Pismo +20/50, tańsze +max 30, archetyp delta × 20).
- **`victory.ts`:** Dominacja (rywale tego samego typu = 0 miast) → Przegrana (gracz 0 miast + 0 osadników) → Nauka (epokaKoncowa + naukaUkonczona).
- **`barbarians.ts`:** `spawnCamps`/`tickCamps`/`decideBarbarianMoves` (deterministyczne LCG). 9 parametrów (`barbarzyncy_*`).
- **Stan implementacji (wg Spec-AI-architektura):** LIVE = ruch/atak, ekspansja, produkcja, trudność 1, archetypy 7, victory, barbarzyńcy. PLANOWANE = odwrót rannych AI, nauka (§5), dyplomacja, trudność 2/3, archetypy 9 (Celtowie/Germanie), spawn klastrów 90 miast, kontrola budżetu.

### 2.6 MIASTO (miasto + produkcja + budynki + społeczeństwo)
**Dokumenty:** `README.md`, `MIASTO-DOKUMENTACJA-DEWELOPERSKA.md` (2026-06-23 + CHANGELOG 2026-06-25), `Schemat-dzialania-miasta.md`, `Spec-spoleczenstwo.md`, `Ulepszenia-terenu-spec.md`.

- **Zakres:** 4 obszary — miasto (`cities.ts`), produkcja (`production.ts`), budynki (`buildings.json`), społeczeństwo: Porządek (`order.ts`) + Kultura/Religia (`culture-religion.ts`). Plus `okolica.ts`, `auto-manage.ts` (CHANGELOG 2026-06-25).
- **Model budynków compound** (decyzja Maciej): `poziom = clamp(epoka_miasta − epokaWejścia + 1, 1, maksPoziom)`; `efekt = baza × 1.10^(poziom−1)`; `koszt = round(kosztBudowy × 1.10^(poziom−1))`. LEGACY: `przyrost*`/`przyrostKosztu` liniowe zostają bo czyta je `economy.ts`/`siege.ts` (migracja = cross-lane).
- **`cities.ts`:** `canFoundCity` (Morze/Wybrzeże/Góry odrzucone, dystans ≥5), `foundCity`, `cityName` (12 nazw + fallback), `foundCityFromVillage` (CHANGELOG, READY-TO-WIRE), `City.maMur` (flaga po budynku Mury).
- **`production.ts`:** kolejka (`CityProduction`), `availableProduction` (epoka+tech, NIE zbudowane), `itemCost` (compound dla budynków, fallback dla jednostek), `advanceProduction` (max 1 ukończenie/turę), `rushCost`/`rushProduction` (Wykup), `setPaused`, `populationCostOf` (jednostka=1, budynek=0), `splitOutput`/`cityScienceOutput`/`cityMoneyOutput` (CHANGELOG), `DEFAULT_OUTPUT_SHARES` (0.4/0.3/0.2/0.1).
- **`order.ts`:** `Porządek = round(wagaSzczescie × szczescie + wagaPrawo × prawo)` (0.5/0.5; prawo=0 do podsystemu). Tier: unrest/neutral/order. Efekty: productionMult/growthMult/tradeMult/revoltRisk. NORMAL: T1=0, T2=6, kary −0.15/−0.25, bonusy +0.10/+0.10. `happinessBreakdown` (CHANGELOG — wizualny rozkład nastrojów).
- **`culture-religion.ts`:** `accumulateCulture`, `cityBorderRadius` (0–3 przy progach), `cultureHappiness`, `civReligion`, `dominantReligion` (próg 50%), `religionHappiness`, `spreadReligion` (deterministyczne dla seed), `convertViaTemple`.
- **`okolica.ts` (CHANGELOG):** `cityRangeForPopulation` (pop<5→5, ≥5→10, ≥10→15), `assignWorkedTiles`.
- **`auto-manage.ts` (CHANGELOG, NOWY):** `autoManageCity` (PURE) — auto-przydział pól, auto-produkcja (priorytet: żywność>produkcja>nauka>pieniądz>wojsko>obrona>kultura>zdrowie>reszta>jednostki), podział Pracy.
- **Ulepszenia terenu (spec):** 14 ulepszeń (Farma/Pastwisko/Kopalnia/Kamieniołom/Obóz łowiecki/Wyrąb/Łodzie rybackie/Droga/Posterunek/Irygacja/Glinianka/Plantacja/Warzelnia soli/Tarasy uprawne/Fort). Koszt z puli Pracy. Posterunek = rozszerza terytorium r=3. **Irygacja TYLKO przy rzece.** Podział: MIASTO=bonusy/koszty/reguły, MAPA=placement/render, SILNIK=przepływ w turze, EKONOMIA=doliczanie bonusów.
- **Testy:** logic-test 163/163 (+ modularne: okolica/auto-manage 26/split-output 46/happiness 38/found-from-village 24).
- **API ZAMROŻONE** (zmiany tylko addytywne). **Główne styki cross-lane** (przez Mastera): compound efektu ekonomicznego budynków w `economy.ts`/`siege.ts`/`player-economy.ts` (wciąż liniowe); dublet religii cywilizacji (`civs.json` vs `society-params.religie_cywilizacji`).

### 2.7 DYPLOMACJA (model wykonawczy)
**Dokumenty:** `README.md`, `Dyplomacja-DOKUMENTACJA-DEV.md` (v1.0 2026-06-23), `Dyplomacja-zasady.md`, `Dyplomacja-szablon.md`.

- **Czysty, deterministyczny moduł** (`diplomacy.ts`) — bez DOM/THREE/IO/losowości. TS strict czysty.
- **API:** `relationScore`, `applyDiplomaticEvent` (21 zdarzeń, immutable, clamp 0–100), `aiDiplomacyStance`, `initialRelation`, `toRelation`, `loadDiplomacyParams`, `DIPLOMACY_PARAMS`. 38 parametrów (5 paneli A–E + drobni).
- **Pipeline:** `Dyplomacja.xlsx[params]` → `export-diplomacy.py` (targeted) → `diplomacy.json[params]` → `loadDiplomacyParams()`.
- **Założenia (a)(b):** start Relacji = 50 (nie 60, legacy poprawione); §3.1 (Relacja 0–200) > §5.2 (progi ujemne); `progPoboczneWojna` przemapowane −40 → 15.
- **Test:** 90 asercji (diplomacy-test.cjs), 0 błędów. **NIEWPIĘTY** — wpięcie = SILNIK, panel = UI.

### 2.8 UI (interfejs, panele, HUD, menu)
**Dokumenty:** `_INDEX.md`, `Spec-UI.md` (stan 2026-06-25).

- **Zakres:** `src/ui/*` + `data/ui-params.json`. UI = prezentacja; czyta dane, woła callbacki. Nie zawiera logiki gry.
- **Żelazne reguły:** edytuje tylko `src/ui/*` + `ui-params.json`; nie dotyka `main.ts`/`render/*`/`battle/*`/`game/*`; nie publikuje kanonu; API wstecznie kompatybilne i degraduje się łagodnie (placeholder gdy brak haka).
- **Moduły:** `cityPanel.ts` (widok miasta, pełnoekranowy overlay, `configureCityPanel` z ~20 opcjonalnymi hakami), `mainMenu.ts`, `newGameFlow.ts` (5 kroków: Intro→Cywilizacja→Epoka→Ustawienia→Generowanie), `empireBalance.ts`, `hud.ts` (minimapa=placeholder, render=MAPA), `orderPanel.ts`, `diplomacyPanel.ts` (v0.1 = podgląd, akcje poza v0.1), `sciencePicker.ts` (#182, kontrakt zatwierdzony), `armyStackPrompt.ts` (#167, kontrakt zatwierdzony), `preBattle.ts`.
- **Parzystość plonów:** panel liczy plony tymi samymi czystymi funkcjami co tick tury (`turn-economy.ts`/`economy.ts`) — liczby zgodne.
- **Panel parametrów:** `UI-parametry.xlsx` → `ui-params.json` (panel_miasta/menu/nowa_gra). NIGDY `export-data.py`.
- **Miasta AI read-only:** ukryte Buduj/Ulepsz/Wykup/kolejka dla `ownerId≠0` — ZROBIONE.
- **Makiety (NIE moduły):** `Makieta-panel-armii.html` (#170/#178 Total War transfer) — czeka akceptację Macieja.

---

## 3. Luki między dokumentacją a kodem

Najważniejsze rozbieżności (sortowane po wadze):

### 3.1 STAN INTEGRACJI (krytyczna luka)
- **SILNIK-ARCHITEKTURA-DEWELOPER.md (2026-06-23)** i **SILNIK-HANDOVER-DO-MASTERA.md (2026-06-24)** opisują pętlę tury jako minimalną (ekonomia + bankowanie + auto-badania) i listują 7 modułów w „kolejce KROK 2–8" (production, ai, victory, siege, diplomacy, culture-religion, order, save) jako **NIEWPIĘTE**.
- **CURSOR-PLAN-DZIALANIA.md (2026-06-26)** informuje: gra grywalna end-to-end, większość modułów **WPIĘTA** (AI, produkcja, nauka, save/load, dyplomacja, atak z mapy, oblężenie partial). `main.ts` ~2827 linii (dokument mówi ~1234).
- **Skutek:** każdy świeży agent czytający SILNIK-ARCHITEKTURA dostaje nieaktualny obraz. To najpilniejsza aktualizacja dokumentacyjna. Sam dokument `CURSOR-PLAN-DZIALANIA §10` notuje: „SILNIK-ARCHITEKTURA nieaktualna — ten dokument zastępuje".

### 3.2 Testy — rozbieżność liczb
- SILNIK/MIASTO/CYWILIZACJE mówią: logic-test 163/163, diplomacy 90/119, ai 132, combat 6/6, barbarians 53.
- CURSOR-PLAN-DZIALANIA §9 mówi: **~762 testów w 17 suitach** (logic 180, combat 6, ai 132+, diplomacy 98, research 33, oblezenie 27, wire-ekonomia 23, upkeep 51, culture-religion 43, wealth 25, auto-manage 26, barbarians 53, found-from-village 24, happiness-breakdown 38, split-output 46, converters 30, okolica 16). Jeden czerwony baseline: `koszary-gate-test` (Lazaret=Średniowiecze, świadomy, nie naprawiać).
- **Skutek:** liczby asercji w dokumentach działów są niższe niż faktyczny stan — pojawiły się nowe suite'y (wealth, oblezenie, wire-ekonomia, converters) niewspomniane w dokumentach działów.

### 3.3 Rozbieżność enum `TypCywilizacji` vs dane (Celtowie/Germanie)
- `types/player.ts` enum ma 7 typów + `DrobnaCywilizacja`; brak Celtów i Germanów.
- `civs.json` i `ai-params.json` mają 9 cywilizacji (z Celtami/Germanami).
- `CIV_TO_ARCH['babilon']='sumer'` = bridge dla Sumerów. `ARCHETYPE_AGGRESSION`/`ARCHETYPE_TRADE` w `diplomacy.ts` = 8 wpisów (7 + Drobna), bez Celtów/Germanów → fallback Greków (0.40/0.50).
- **Status:** decyzja Macieja otwarta — czy dodać `Celtowie`/`Germanie` do enuma. Udokumentowane w CYWILIZACJE §8 i Spec-AI-architektura §9.2.

### 3.4 `wartosc` vs `wartość` (ASCII vs diakrytyk)
- `ai-params.json` przechowuje klucz `wartosc` (ASCII). `ai.ts` (`getAiParam`/`readArchMods`) czyta tylko `entry.wartość` (z diakrytykiem) → ryzyko cichego `undefined`, parametry AI po cichu nie działają.
- `barbarians.ts` robi dobrze: `entry['wartość'] ?? entry['wartosc']`.
- **Status:** Spec-AI-architektura §9.1 flaguje jako RYZYKO, rekomendacja 1-linijkowa poprawka w `ai.ts`. Do weryfikacji czy `loader.ts` normalizuje.

### 3.5 Walka §5l NIE data-driven mimo `terrain-combat.json`
- SILNIK-ARCHITEKTURA §9.1: cały model walki (`combat.ts`) zaszyty w TS — wzór trafienia `clamp(50 + (Atk−Obrona)*5, 10, 90)`, `baseDamage`, counter ×1.5, teren (Wzgórza 1.5/Góry 1.75/Las 1.5, rzeka atk ×0.75), `maxRounds=30`. `terrain-combat.json` istnieje, ale nie jest konsumowany.
- `economy.ts` duplikuje `TERRAIN_YIELDS`/`RIVER_MODIFIER`/`FOREST_MODIFIER` z `terrain-yields.json`.
- **Rekomendacja architekta:** ujednolicić źródło prawdy (albo wszystko z JSON, albo świadomie zostawić §5l w kodzie i usunąć martwy `terrain-combat.json`).

### 3.6 Model budynków — compound vs liniowy (cross-lane)
- MIASTO `production.ts` (koszt) = compound (`× 1.10^(poziom−1)`).
- `economy.ts` (`buildingValue`), `siege.ts` (obrona murów), `player-economy.ts` (utrzymanie) = **wciąż liniowe** (`przyrost*`). `przyrost*` ZOSTAJE w `buildings.json` jako LEGACY.
- **Status:** migracja tych 3 = decyzja cross-lane przez Mastera. Udokumentowane w MIASTO §12 i §15.

### 3.7 Dublet religii cywilizacji
- `civs.json` (DANE) ma religię per cywilizacja.
- `society-params.json.religie_cywilizacji` (MIASTO) też ma religię per cywilizacja.
- `culture-religion.civReligion` czyta z `society-params` (przez argument `society`/`owner`).
- **Status:** jedno źródło = decyzja DANE/Master. Udokumentowane MIASTO §12(2). Wpływa na Dyplomację i Kulturę/Religię.

### 3.8 Bonusy cywilizacji — schemat zatwierdzony, mechanizacja odroczona
- `civs.json.bonusy[]` (BonusCyw) = NOWE pole dodane do JSON, struktura zatwierdzona (PROPOZYCJA §5.3 = Kandydat A, 13/15).
- **Ale:** UDOKUMENTOWANE jako "realizacja = DEFERRED przez wszystkie lane'y" (CURSOR-PLAN §3, wątek pochodny). Cywilizacje poza AI-priorytetem mają dziś takie same mechaniczne zasady.
- **Skutek:** pole `bonusy[]` w JSON istnieje, ale konsumenci (UNITS/MIASTO/EKONOMIA/MAPA) go jeszcze nie czytają. To duża luka między danymi a kodem.

### 3.9 `decideAIDiplomacy` — rozbieżność między dokumentami CYWILIZACJE
- `PROPOZYCJA-dyplomacja-AI-v0.1.md §1.2` (2026-06-25) twierdzi: "`decideAIDiplomacy()` — nie istnieje".
- `DOKUMENTACJA-DEV-CYWILIZACJE.md §5.11` (v1.0, 2026-06-25) dokumentuje `decideAIDiplomacy()` jako **istniejącą** (v0.1, 4 komendy, stałe progów).
- `CURSOR-PLAN-DZIALANIA §2` (2026-06-26) potwierdza: "AI: decideAIDiplomacy" = DONE.
- **Wniosek:** PROPOZYCJA powstała przed implementacją; DOKUMENTACJA-DEV i CURSOR-PLAN są aktualne. Funkcja istnieje i jest wpięta (wg CURSOR-PLAN), ale **NIEWPIĘTA** do pętli tury w sensie aktywacji efektów (CURSOR-PLAN: DYPLOMACJA ~70%, "efekty dyplomacji aktywne v0.1 = pasywne").

### 3.10 Luki dokumentacyjne mniejsze
- **`<LANE>-STAN.md` NIE ISTNIEJĄ** (PLAYBOOK §3.2, §10 priorytet 1) — punkt wdrożenia nr 1 dla ~80% tańszego self-checku. CURSOR-PLAN QW5 to potwierdza jako Quick Win.
- **Decay logów DO-MASTERA** (PLAYBOOK §3.3) — nie wdrożone; rosną.
- **Self-checki dla DYPLOMACJA/AI/MAPA** (PLAYBOOK §10 priorytet 4) — brak.
- **Adversarial verification dla każdego kanonu** (PLAYBOOK §10 priorytet 5) — nie wdrożone systemowo.
- **MAPA: klastry miast na mapie** niezaimplementowane (`Spec-generator-mapy.md §0.1`); bez tego "dominacja typu" nie ma struktury startowej (Spec-AI-architektura §9.4). MAPA rozmieszcza, AI rozwija.
- **MAPA dług:** martwy `buildRiverEdgePoints`, nieużywane `RIVER_BANK_*`; parametry renderu zaszyte w TS (proponowane `render-*.json`); brąz Sumer/Egipt/Aztek TODO.
- **UNITS TODO:** `battle-params.json` NIEWPIĘTY (stałe w kodzie; `Bitwa-parametry.xlsx` = tylko panel referencyjny); rally generała (`MORALE_GENERAL_AURA=0` placeholder); morale-exemption dla cyw czysto dystansowych; sterowanie graczem + faza rozstawiania (czeka UX Q2–Q7).
- **UI:** minimapa = placeholder (render = MAPA); podgląd nauki (`Gra-podglad-NAUKA.html`) "do zbudowania"; panel armii = makieta (czeka akceptację).

---

## 4. Rekomendacje (priorytety dokumentacyjne)

1. **Zaktualizować `SILNIK-ARCHITEKTURA-DEWELOPER.md`** o rzeczywisty stan pętli tury (wpiecia AI/produkcji/dyplomacji/save/oblężenia), liczbę linii `main.ts` (~2827), aktualną bramkę testów (~762). Alternatywnie: oznaczyć dokument jako „historyczny — patrz CURSOR-PLAN-DZIALANIA".
2. **Wdrożyć `<LANE>-STAN.md`** (PLAYBOOK §10 priorytet 1) — 10 plików × 12 linii = najtańszy quick win dla całego projektu.
3. **Rozstrzygnąć decyzje otwarte u Macieja** (CURSOR-PLAN §4): 6B (HUD), 7-go (plaster EKONOMIA+UI), W1–W6 (Wealth), U1 (ulepszenia), UX-Q2–Q7 (bitwa), CYW-T1–T4 (balans cyw).
4. **Ujednolicić `wartosc`/`wartość`** w `ai.ts` (1 linijka) — eliminuje ryzyko cichych undefined.
5. **Rozstrzygnąć enum `TypCywilizacji`** — dodać Celtów/Germanów lub udokumentować świadomy fallback.
6. **Rozstrzygnąć dublet religii** (`civs.json` vs `society-params.religie_cywilizacji`) — jedno źródło.
7. **Zaplanować migrację compound** w `economy.ts`/`siege.ts`/`player-economy.ts` (cross-lane przez Mastera).
8. **Zrealizować `civBonusy`** w systemach (CURSOR-PLAN EP/S4.1) — schemat JSON gotowy, konsumenci odroczeni.

---

**Podsumowanie:** Dokumentacja działów jest obszerna, dobrze ustrukturyzowana i rzetelna w zakresie designu/intencji, ale **niektóre kluczowe dokumenty (zwłaszcza SILNIK-ARCHITEKTURA) zdezaktualizowały się wobec faktycznego stanu integracji** opisanego w nowszym `docs/CURSOR-PLAN-DZIALANIA.md`. Największe ryzyko to świeży agent czytający nieaktualny opis pętli tury. Rozbieżności dane-vs-kod (enum cywilizacji, `wartosc`, dublet religii, `civBonusy` odroczone) są udokumentowane i czekają na decyzje Macieja w protokole ABC. Rekomendowana kolejność: aktualizacja SILNIK-ARCHITEKTURA → `<LANE>-STAN.md` → rozstrzygnięcie 6 decyzji P0.
