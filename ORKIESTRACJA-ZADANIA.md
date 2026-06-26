# ORKIESTRACJA — rozkład prac na sesje

Dokument prowadzony przez **sesję nadrzędną (integrator)**. Tu jest pełna lista podgrup do wykonania, pocięta tak, by każdą można było oddać OSOBNEJ sesji bez konfliktów. Po wykonaniu — wklej wynik integratorowi (tej sesji), on wepnie + zbuduje + zweryfikuje.

## Zasady współpracy sesji
- **[S]** = zadanie dla osobnej sesji. Pracuje TYLKO na swoich plikach (moduł `game/*.ts` lub Excel/dane). **Nie dotyka** `main.ts`, `render/units.ts`, `render/scene.ts`.
- **[I]** = robi integrator (ta sesja): wpięcie w `main.ts`, render, build, wydanie `Gra-podglad.html`.
- Każda sesja na starcie czyta: `ARCHITEKTURA-PLIKI.md` + ten plik + `PROJEKT-GRY-master.md`.
- Moduły są CZYSTE (bez THREE/DOM), z jasnym API i własnym testem; integrator je wpina.
- Po zmianie kodu: integrator robi `tsc=0 + build + smoke + battle-smoke + logic-test`.

## Status milowy
- **M0** ✅ pipeline Excel→JSON, GameState, decyzje, Egipt/Sumer, balans.
- **M1** ✅ mapa 3D + ruch + mgła + modele Roblox; HUD podstawowy.
- **M2** 🟡 ekonomia miasta (plony/wzrost/żywność = `turn-economy.ts`); BRAK: skarbiec/nauka/kolejka produkcji + UI miasta.
- **M3** 🟡 walka §5l (6/6) + auto-bitwa tura-po-turze + `manualBattle.ts` (gotowy, niewpięty); BRAK: walka z mapy, ręczne sterowanie wpięte.
- **M4** ⬜ AI (`ai.ts` gotowy, niewpięty); BRAK: pętla tury AI, zwycięstwo, Nowa gra.
- **M5** ⬜ dyplomacja (`diplomacy.ts` gotowy, niewpięty); BRAK: 50 cyw., kultura/religia w turze.
- **M6** ⬜ save/load, menu, HUD w grze, polish, balans.
- **M7** ⬜ epoki 3–10, waluty, ustroje, cuda, RTS, backend.

---

## ZADANIA DO ROZDANIA

### A. Ekonomia / Miasto (M2)
- **A1 [S]** Stan gracza + skarbiec → `game/player-economy.ts`: bankowanie złota i nauki co turę z miast, utrzymanie budynków/jednostek, globalny skarbiec. (baza: `turn-economy.ts` ✅)
- **A2 [S]** Kolejka produkcji → `game/production.ts`: co miasto produkuje (jednostka/budynek z `buildings.json`/`units.json`), postęp wg Pracy, ukończenie → dodanie do gry.
- **A3 [S]** Magazyny + utrzymanie → `game/upkeep.ts`: limity żywności/surowców, koszty utrzymania per budynek/jednostka.
- **A4 [S]** Research w grze → `game/research.ts`: wybór technologii, postęp nauki, odblokowanie budynków/jednostek (z `tech.json`).
- **A5 [I]** Panel miasta: pokazać realne plony/wzrost/żywność/produkcję/kolejkę (wpięcie A1–A4 + `turn-economy`).

### B. Walka (M3)
- **B1 [I]** Wpiąć `manualBattle.ts` — przycisk „Sterowanie ręczne" na ekranie przed-bitewnym.
- **B2 [I]** Walka z mapy: atak jednostką na wroga w zasięgu → ekran przed-bitewny → auto/pole → wynik wraca na mapę (usuń/rań przegranego). (baza: `combat.ts`/`preBattle`/`battleScene` ✅)
- **B3 [S]** Oblężenia → `game/siege.ts`: atak na miasto (mury, bonus obrony, zdobycie miasta).

### C. AI (M4)
- **C1 [I]** Wpiąć `ai.ts` w pętlę tury: po turze gracza rywale wykonują `decideAITurn` (ruch/zakładanie/atak/budowa).
- **C2 [S]** Warunki zwycięstwa → `game/victory.ts`: dominacja typu (zniszcz wszystkie miasta rywali swojego typu) + zwycięstwo nauki/statku (§8d).
- **C3 [I]** Nowa gra: ekran startu (makieta flow) → parametry → generacja świata → gra.

### D. Dyplomacja / Cywilizacje / Społeczeństwo (M5)
- **D1 [I]** Wpiąć `diplomacy.ts` (relacje Zaufanie+Respekt) + panel dyplomacji.
- **D2 [S]** Pełne 50 cywilizacji (7 głównych + inicjalne) w `Cywilizacje.xlsx` + religie cywilizacji → re-eksport.
- **D3 [S]** Kultura/religia w turze → `game/culture-religion.ts`: wpływ kultury (granice/zadowolenie), konwersja religijna przez świątynię (§5f-religia).
- **D4 [S]** Porządek = Szczęście + Prawo → `game/order.ts` + `Spoleczenstwo-parametry.xlsx`: progi T1 (gorzej pracują) / T2 (bunt), garnizon=Prawo, budynki=Szczęście (wg ustaleń §9b).

### E. Generator mapy (M1+)
- **E1 [S]** Generator → najlepiej `map/gen-helpers.ts` (czyste funkcje, integrator wpina w `generator.ts`): kontynenty (Voronoi), klastry biomów, złoża surowców, rzeki na krawędziach, rozmieszczenie startów ≥5 od siebie.

### F. Save / Menu / HUD (M6)
- **F1 [S]** Save/Load → `game/save.ts`: serializacja GameState → JSON (localStorage/plik) + wczytanie.
- **F2 [I]** Menu główne + ustawienia w grze (wpięcie makiety menu/flow).
- **F3 [I]** HUD w grze: górny pasek zasobów, minimapa, panele 1–12 (wpięcie `Makieta-HUD`).

### G. Render / wizual (domena integratora)
- **G1 [I]** Re-render jednostek → główny build (po ocenie Maciej w `RERENDER.html`).
- **G2 [I]** Bitwa: dopieszczenie wizualne wg uwag.
- **G3 [I]** Mapa: kroki w stronę Civ VI (rzeki na krawędziach, biomy, ramka).

### H. Przyszłość (M7) — później
- **H1** Epoki 3–10 (Żelazo+), przejścia walut, ustroje, cuda, tryb RTS, backend/multiplayer.

---

## Kolejność rekomendowana (zależności)
1. Najpierw **moduły [S] bez zależności**: A1, A2, A4, C2, D2, D4, E1, F1, B3 — można odpalać RÓWNOLEGLE (różne pliki).
2. Integrator [I] wpina je po dostarczeniu: A5 (po A1–A4), C1 (AI), D1 (dyplo), B1/B2 (walka), F2/F3 (UI), C3 (nowa gra).
3. Na końcu render/polish (G) i przyszłość (H).

## Gotowe moduły czekające na wpięcie [I]
- `game/ai.ts` (decideAITurn) → C1
- `game/diplomacy.ts` → D1
- `game/combat.ts` (§5l) + `battle/manualBattle.ts` → B1/B2
- `game/turn-economy.ts` (wpięte częściowo, N-tura) → A5 rozbuduje UI


---

## ZATWIERDZONE: Facing w bitwie (front/flanka/tyl)

**B4 [I/Bitwa] Facing -- kluczowy zwrot jednostki.** (decyzja Maciej: 2 front / 2 flanka / 2 tyl; zwrot = klucz)
- Kazda jednostka ma ZWROT = kierunek do linii wroga (najblizszego wroga). Z 6 sasiadow heksu wzgledem zwrotu: **2 = FRONT** (bez kary), **2 = FLANKA** (kara z boku), **2 = TYL** (kara z tylu).
- Placement: obie armie w CZYSTEJ LINII naprzeciw siebie (NIE zygzak -- teraz jest zygzak, stad nie widac linii frontu). Front kazdej jednostki = ku wrogowi.
- Przy ataku: policz, w ktorym luku obroncy stoi atakujacy wzgledem ZWROTU obroncy -> przekaz do resolveCombat (flank/rear) -> sec.5l dolicza kare z "Kara obrony z flanki/tylu (%)".
- Zwrot aktualizuj przy ruchu / zmianie celu (jednostka patrzy na najblizszego wroga).
- Wizualnie: model obrocony frontem do wroga + opcjonalny maly wskaznik kierunku.
- Pliki: battle/battleScene.ts (+ ew. helper battle/facing.ts); combat.ts ma juz kary -- tylko przekazac luk. To plik integratora (battleScene) -> robi integrator ALBO dedykowana sesja bitwy (jedna naraz).
- Po implementacji: dopisac regule do PROJEKT-GRY-master.md sec.5l (model facing 2/2/2).


---

## KTO CO ROBI TERAZ (anty-duplikacja) -- 2026-06-22

**Zasada nadrzedna:** main.ts + build/publikacja Gra-podglad.html maja JEDNEGO wlasciciela naraz.
Teraz wlascicielem main.ts + buildu jest "Sesja autonomiczna Render+Logika" (drugi agent).
=> Inne agenty NIE dotykaja main.ts / units.ts / scene.ts / battleScene.ts i NIE buduja.
   Tworza tylko NOWE pliki (game/*.ts, map/*.ts) lub Excel. Master scala po zakonczeniu.

### A) Sesja autonomiczna Render+Logika (drugi agent) -- WLASCICIEL main.ts + build
- [x] Render: zatapianie jednostek (galeria/wzgorza) + konne frontem do kamery -> opublikowane.
- [ ] 13B+7B: globalny skarbiec/nauka, bankowanie co ture, auto-badania (tech.json) + HUD.
- [ ] 6E: produkcja w miastach (budowa jednostek/budynkow za Prace).
- [ ] 8I/14B: ruch wrogow/barbarzyncow LUB warunki zwyciestwa.
- Buduje + publikuje co etap (backup -> build -> testy -> publikacja).

### B) Master (ta sesja) -- koordynacja + domena BITWY (battleScene.ts, NIE main.ts)
- [x] B4 facing w bitwie (battleScene.ts + facing.ts) -- gotowe na dysku, wejdzie z najblizszym buildem drugiego agenta.
- [ ] Weryfikacja calosci (tsc+build+smoke+battle-smoke+logic) PO zakonczeniu biegu drugiego agenta.
- [ ] B1/B2 (manualBattle / walka z mapy) -- DOTYKA main.ts -> ODLOZONE az main.ts wolny.

### C) WOLNE do rozdania (zero kolizji: kazdy SWOJ nowy plik, bez main.ts, bez buildu)
- **D2 [S]** Cywilizacje.xlsx -> 50 cyw. + religie -> re-eksport (tylko dane).
- **D3 [S]** game/culture-religion.ts (nowy, czysty): kultura (granice/zadowolenie) + konwersja religijna (sec.5f).
- **D4 [S]** game/order.ts + Spoleczenstwo-parametry.xlsx: Porzadek = Szczescie + Prawo, progi T1/T2 (sec.9b).
- **E1 [S]** map/gen-helpers.ts (czyste funkcje): kontynenty/biomy/zloza/rzeki/starty >=5.
- **B3 [S]** game/siege.ts (nowy): oblezenia miast (mury, bonus obrony, zdobycie).

### MODULY JUZ NA DYSKU (tsc-clean, czekaja na scalenie przez mastera)
- game/save.ts (F1), battle/facing.ts (B4) -- NIE koliduja, gotowe.
- game/player-economy.ts, production.ts, research.ts, victory.ts
  -> UWAGA: POKRYWAJA SIE z 13B/6E/14B drugiego agenta. Przy scalaniu master wybiera JEDNA wersje
     (modul vs wpiecie w main.ts) -- nie wpinac obu. Na razie lezą nieuzywane (nie psuja buildu).


---

## WERDYKT MASTERA po raporcie "Drugi kask" -- 2026-06-22

STAN (inspekcja dysku):
- main.ts WPINA: turn-economy.ts + playerState.ts + combat.ts (+ battleScene z facing.ts).
- ORPHAN (nieimportowane): player-economy.ts, production.ts, research.ts, save.ts, victory.ts, ai.ts, diplomacy.ts, economy.ts(baza).
- battleScene.ts importuje facing.ts -> B4 facing DZIALA w bitwie.
- Podglady: Gra-podglad.html(silnik), -WIZUAL.html(silnik+wizualia, NAJPELNIEJSZY), -RERENDER.html(stary).

DECYZJE:
1) DEDUP badania/skarbiec: ZWYCIEZCA = playerState.ts (wpiety, 59/59).
   research.ts + player-economy.ts = ORPHAN-DUBEL, NIE wpinac.
   production.ts(6E), victory.ts(14B), save.ts(F1) = KOMPLEMENTARNE -> Silnik wpina pozniej, dostosowujac do playerState.
2) LANE (granice plikow):
   - SILNIK (Drugi kask): main.ts + game/*.ts + JEDYNY build/publikacja Gra-podglad.html.
   - RENDER/WIZUAL: render/*.ts + map/generator. BEZ main.ts, BEZ kanonicznego buildu.
   - BITWA/MASTER (ta sesja): battle/*.ts + koordynacja + finalna weryfikacja.
   - REGULA: tylko SILNIK dotyka main.ts i publikuje kanon.
3) KANON: docelowo jeden Gra-podglad.html (build Silnika ma juz wizualia w scene.ts + facing).
   Teraz najpelniejszy = WIZUAL. Po konsolidujacym buildzie -> usunac WIZUAL i RERENDER.
4) SPRZATANIE: SPRZATANIE.ps1 (lokalnie) -- dist-* + _sizetest.tmp.

SYGNAL:
- Silnik: wlasciciel main.ts+build. Dalej: 6E produkcja (adaptuj production.ts) -> 14B victory.ts -> F1 save.ts. JEDEN konsolidujacy build (tsc+build+smoke+battle-smoke+logic) = kanon.
- Render: zostan w render/*+generator, NIE ruszaj main.ts, NIE publikuj kanonu.
- Master: bitwa+koordynacja; B1/B2 ODLOZONE az main.ts wolny (jedno okno z Silnikiem).


---

## POSTEP sesji Render/Mapa -- 2026-06-22 (relacja)
- [x] Galeria-jednostek-4widoki.html (36 jedn., 4 rzuty + uwagi) + Legionista galea (helm+grzebien). Gra-podglad.html NIE nadpisany przez te sesje.
- [x] E1: map/gen-helpers.ts (584l) + generator.ts refaktor 344->118 (wynik BAJT-IDENTYCZNY), testy 69/69, build OK.
      -> WYJASNIA: generator.ts ma 118 linii przez TEN refaktor, nie przez korupcje. (NUL w bash = dehydratacja; plik w chmurze cala.)
- [x] B3: game/siege.ts (~750l, oblezenia wg sec.5l, zdobycie miasta, milicja), logic 101/101, build OK, bez ruszania combat.ts/main.ts.
- [ ] D4 game/order.ts (w toku) -> D3 game/culture-religion.ts -> D2 Cywilizacje.xlsx/civs.json.

### 3 LANE (stan faktyczny, 3 sesje)
- SILNIK ("Drugi kask"): main.ts + wpiete game/*.ts (playerState/turn-economy) + JEDYNY publisher Gra-podglad.html.
- RENDER/MAPA (ta relacja): render/*.ts (units.ts), map/generator.ts + gen-helpers, NOWE niewpiete game/*.ts (siege/order/culture-religion), przypisane xlsx. Buduje do WERYFIKACJI, NIE publikuje kanonu.
- MASTER (ja): battle/*.ts + koordynacja + finalna weryfikacja. units.ts ODDAJE z powrotem do RENDER (moj dotyk byl awaryjny: fix uciecia).
- REGULA: nowe czyste game/*.ts moze tworzyc kazdy; main.ts + wpinanie + publikacja kanonu = TYLKO Silnik. units.ts edytuje TYLKO Render (po wczytaniu naprawionej wersji z dysku).
