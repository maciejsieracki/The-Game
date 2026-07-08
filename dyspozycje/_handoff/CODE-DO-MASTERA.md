# CODE-DO-MASTERA — lustro merytorycznych odpowiedzi CODE-INTEGRATORA

Utworzony na dyspozycję MASTER-a [15:40 PL, 2026-07-08]. Cel: MASTER czyta pełne treści (audyty, raporty wydajności, meldunki, pytania-decyzje) STĄD, zamiast wklejek Macieja z czatu.

**Konwencja (jak w KANAL-PRACA):** append-only na końcu; każdy wpis = nagłówek `## [HH:MM PL, data] — temat`; reguła anty-kolizyjna: nie nadpisuj cudzych wpisów, tylko dopisuj. Podział: `KANAL-PRACA.md` = krótkie meldunki/decyzje; ten plik = pełne treści odpowiedzi CODE do Macieja.

---

## [19:34 PL, 2026-07-08] — Dry-run D1/D3 wg [14:15]: GOTOWE DO PUSHA (skrót stanu)

**Werdykt:** dry-run domknięty, wszystkie bramki [14:15 pkt 4] zielone → **GOTOWE DO PUSHA**. Nie pushowałem, nie deployowałem; live `c293647` nietknięty.

### Stan źródła (git, zweryfikowany host-side)
- `main` = **1 commit ponad origin: `865c94e`** (D1+D3 na kanonicznym `gra/src`), NIEWYPCHNIĘTY. 4 pliki źródła, 28+/6−:
  - `game/okolica.ts` — helper `hexKeysWithinRadius` + `okolicaTiles` (lokalna enumeracja hex-dysku zamiast `Object.keys(map.hexes)`).
  - `game/resource-access.ts` — `hexesInCitySight` (`Object.entries`→helper + guard).
  - `render/cityOkolicaOverlay.ts` — `collectRangeKeys` (`Object.keys`→helper).
  - `main.ts` — D3: usunięty zbędny `refreshFog()` z `applyCityPanelWorldView` (linia ~1687).
  - Filtr `hexDistance` zachowany w każdej z 3 funkcji ⇒ wynik IDENTYCZNY, 0 skanów całej mapy.
- `gra/src` + `gra/data` **CZYSTE** (0 brudnych plików źródła). Brudne w drzewie roboczym = TYLKO artefakty deployu (`gra-robocza/*` = live `c293647`) + docsy. Portu kodu Cowork NIE było — superset `gra/src` potwierdzony; jedyny brak = D1+D3 (były deploy-only), teraz odtworzone.

### Bramki [14:15 pkt 4] — wszystkie ZIELONE
1. **`tsc --noEmit = 0`**.
2. **Build `vite build` BEZPOŚREDNIO** (NIE `npm run build` → bez prebuildu `export-data.py`; **pułapka [15:10] ominięta** — balans jednostek z ręcznie wpiętego committed `gra/data` zachowany, nie zregenerowany z Excela) → **565 modułów, single-file ~9,80 MB**, wyjście do gitignorowanego scratchu `gra/dist-dryrun-p0` (NIE deploy target).
3. **Bramka bundla** — licznik fingerprintów-literałów, FRESH (dry-build) vs LIVE (`c293647`) vs HEAD-committed (`3b089468`):

   | fingerprint            | FRESH  | LIVE   | HEAD   |
   |------------------------|--------|--------|--------|
   | Falanga (balans)       | 45     | 45     | 45     |
   | counterTyp             | 7      | 7      | 7      |
   | Test wydajności        | 2      | 2      | 2      |
   | technolog              | 266    | 266    | 266    |
   | viewBox (ikony SVG)    | 343    | 342    | 343    |
   | drzew / Nauka          | 88/129 | 87/128 | 88/129 |

   Wniosek: **FRESH ≥ LIVE na każdym fingerprincie** (nic nie stracone) oraz **FRESH == HEAD**. +1 na `drzew`/`Nauka`/`viewBox` względem LIVE = **fix drzewka ODTWORZONY** (zregresowane live `c293647` go nie ma). Identyfikatory D1/D3 zminifikowane (0 w każdym bundlu) → zweryfikowane NA ŹRÓDLE. Bundle niestemplowany (stempel dopiero przy deployu).

### Co ZOSTAŁO do faktycznego wejścia zmian (nie moja decyzja — bramka Macieja)
1. Maciej: **„pushuj"** → wypycham `865c94e`.
2. Build z NOWEGO HEAD (pipeline `vite build`, bez `export-data.py`) → stempel → deploy 9 plików + hub (`START.html`) + `WERSJE.md` → meldunek.
3. Playtest Macieja: drzewko NA GÓRZE + miasto otwiera się szybko (D1) + mgła OK (D3).

### P0 [15:25] — przyjęte, NIE zaczynam
Kolejność zatwierdzona: **P0-4 (F9 ms/owner) → P0-1 (koniec skanów AI, bramka równoważności jak D1) → P0-2 (yield po każdym AI-ownerze) → P0-3 (jedno refreshFog po AI)**; każdy = osobny commit. P1 (workery) po zmierzeniu efektu P0; P2 odrzucone. Blokada startu: (a) obecny deploy, (b) wielki test Macieja, (c) zatwierdzenie kolejności tematów. Zgodne z „P0 wchodzi dopiero po deployu i moim teście".

**CZEKAM-NA:** Maciej — „pushuj".

---

## [19:54 PL, 2026-07-08] — „pushuj" wykonane: PUSH + DEPLOY + WERSJE (live = 865c94e)

Maciej wydał „pushuj" (brama publikacji) + potwierdził „Wdrażaj teraz" na osobną bramkę harnessa dla nadpisania live. Pełny pipeline zamknięty i zweryfikowany.

### 1. PUSH
`git push origin main` → **`bc51a01..865c94e`**. origin/main = `865c94e` (D1+D3 na kanonie `gra/src`). HEAD == origin. Źródło opublikowane = koniec ery „deploy-only D1/D3", live wynika z commita.

### 2. BUILD z nowego HEAD + DEPLOY (ścieżka BEZPIECZNA)
- Build **`vite build` bezpośrednio** z `gra/src` @ 865c94e → `civ-dist/index.html` 9 800 866 B (565 modułów). **BEZ** `npm run build` → bez prebuildu `export-data.py` → balans z committed `gra/data` zachowany (pułapka [15:10]).
- Stempel sankcjonowanym `gra/tools/inject-build-stamp.ps1 -Tier ROBOCZA` → **`ROBOCZA · 7fe722e3 · 2026-07-08 19:50`**.
- Kopia ostemplowanego bundla → **9 plików** (`Gra-ROBOCZA.html` + 8 playtestów: WALKA/ODSKOK/ODSKOK-OBLEZENIE/OBLEZENIE-3v3/MAPA/MIASTO/BITWA-DUZA/OBLEZENIE-DUZE). **WSZYSTKIE md5 = `51c2eb248aedac4f97a78854ad9b7422`** (pełna spójność).
- `gra-robocza/tools/generate-start-hub.cjs` → **START.html** (hub, 10 kart) + **ROBOCZA-MANIFEST.json** (bundles[], hubGeneratedAt).
- **UWAGA metodyczna:** NIE użyłem `publish-robocza-bundle.ps1` — buduje ze **stale `gra-robocza/src`** (zamrożony srcKopiaMaster, 129 plików w tyle) i kopiuje do **root** (nagłówek: „⛔ ZAKAZ KOPIOWANIA DO ROOT"). To dokładnie tooling regresu. Deploy zrobiony prymitywami z canonu (`inject-build-stamp` + kopie + `generate-start-hub`), pisząc wyłącznie do `gra-robocza/`.

### 3. WERYFIKACJA (na WDROŻONYM pliku, nie w scratchu)
- `verify-robocza-bundle.cjs` → **manifest match: OK**, `VERIFY OK`.
- Fingerprinty live: **drzew 88 / Nauka 129** — stary live `c293647` miał 87/128 → **regres drzewka NAPRAWIONY na żywo**. Falanga 45 (balans OK), viewBox 343, counterTyp 7, „Test wydajności" 2. Zgodne z dry-runem (FRESH), ≥ stary live.
- `stamp WARN` (stamp-short 7fe722e3 ≠ md5 pliku 51c2eb24): **znane, nieszkodliwe** — inject-build-stamp osadza własny md5, a zapis md5 zmienia md5 (self-hash „o krok w tyle"); autorytatywny hash = **manifest md5 = md5 pliku = `51c2eb24`**. Ten sam skrypt używa sankcjonowany publish-snapshot ⇒ nie regres.

### 4. WERSJE.md
Nowy wpis ROBOCZA **AKTUALNA**: `51c2eb24…` / stempel 7fe722e3 · 19:50 / źródło committed gra/src @ 865c94e. Poprzedni `c293647` → **ZASTĄPIONA**.

### Poza zakresem / do decyzji
- `POLE-BITWY` (`Gra-ROBOCZA-POLE-BITWY.html`) **nietknięty** (md5 stary `389c618`) — nie należy do wymaganych 9 ani do huba (osobny entry oblężenia). Jeśli ma być odświeżony — osobne zlecenie.
- Artefakty deployu leżą w working-tree (niezacommitowane) — jak dotychczasowy obieg (live=lokalne pliki serwowane playtesterowi; źródło=origin). Jeśli chcesz je też zacommitować do repo — powiedz.
- **P0 [15:25]** — NIE zaczęte; blokada: (a) ten deploy ✅, (b) wielki test Macieja ⏳, (c) zatwierdzenie kolejności tematów ⏳.

**CZEKAM-NA:** Maciej — wielki test (Ctrl+F5 na START.html) → OK/BUG.

---

## [20:06 PL, 2026-07-08] — SYNC-PANELI: AUDYT KOMPLETNY (read-only) + klasyfikacja legacy + komplikacja merge [17:05]

Wykonane [16:35] pkt 1–2 (inwentaryzacja + audyt), [16:55] (klasyfikacja), rozpoznanie [17:05]. Audyt round-trip zrobiony BEZ dotykania live JSON (dry-run / --data-dir do kopii). Kierunek prawdy = GRA→EXCEL.

### Łańcuch (panel → eksporter → JSON)
- A → `export-a.py` → terrain-improvements, map-gen-params (+ overlay terrain-yields! patrz komplikacja)
- A-Plony → `export-terrain-yields.py` → terrain-yields (arkusze Teren-bazowy + Bonusy-nakladki)
- B → `export-b.py` → miasto, econ, society, power, buildings, resources, tech
- C → `export-c.py` → units, combat-params, counters, terrain-combat, auto-battle-params
- D → `export-d.py` → civs, civ-params, civ-ai, diplomacy, civ-matrix
- E → `export-e.py` → ui-params, e-start-params
Orkiestrator: `gra/tools/export-data.py` (kanon Panel-{A..E} + export-{a..e}).

### TABELA AUDYTU (round-trip: Excel→eksporter→JSON vs live)
| Panel | zielone (diff=0) | ROZBIEŻNE | charakter / kierunek |
|---|---|---|---|
| **A-Plony** | terrain-yields ✅ | — | ZIELONY (świeży 37312db) |
| **C** | combat-params, counters, terrain-combat, auto-battle ✅ | **units: 91 pól** | `health`×2, `missileAttack`×0.5 = balans pon. 07-06 → **GRA=prawda, Panel-C stary** (jednoznaczne) |
| **D** | civ-params, civ-ai, diplomacy, civ-matrix ✅ | **civs: 1 pole** | Asyria nazwyKlastra[9]: GRA `Arbail` vs Excel `Nineveh` (dubel „Ninive") → GRA prawdopodobnie prawda |
| **A** | terrain-movement ✅ | terrain-improvements 1 · **map-gen-params 23** · terrain-yields 5(konflikt) | duże → **kierunek do potwierdzenia** |
| **B** | miasto, wealth, globalne, budynki-eco, teren, zdrowie, religia, power, manpower, resources ✅ | **buildings 28 · tech 31 techn.** · society(szczescie 3/kultura 1/porzadek 6)=10 · econ 2 | duże → **kierunek do potwierdzenia** |
| **E** | (reszta) | **e-start-params 17** · ui-params 1 | → **kierunek do potwierdzenia** |

**Wniosek:** C (units) i D (civs) = GRA jednoznacznie prawda (balans + oczywista literówka). A/B/E = duże rozjazdy, nie umiem host-side rozstrzygnąć „stary Excel czy nieeksportowana edycja Macieja" → pytanie.

### KOMPLIKACJA merge [17:05] (do decyzji przed wykonaniem)
Panel-A JUŻ zawiera arkusz **`Plony-terenow`** — i to on (przez `export-a.overlay_terrain_yields`) generuje te 5 rozbieżnych zmian w terrain-yields. Czyli terrain-yields ma DWA źródła: stary `Plony-terenow` (Panel-A, 5 diff) + dedykowany Panel-A-Plony (`Teren-bazowy`+`Bonusy-nakladki`, 0 diff). Ślepe „dołóż A-Plony jako arkusz" da 3 reprezentacje + 2 eksportery piszące ten sam JSON. Rekomendacja: (a) zastąp treść `Plony-terenow` zielonymi danymi z A-Plony (albo wnieś Teren-bazowy+Bonusy-nakladki i usuń stary Plony-terenow), (b) przepnij `export-terrain-yields.py` na Panel-A, (c) **usuń `overlay_terrain_yields` z export-a** (jeden JSON = jeden eksporter), (d) round-trip diff=0, (e) archiwizuj A-Plony + README. Potwierdź kierunek (a)/(c).

### LEGACY (klasyfikacja [16:55]; rekomendacja pod scalanie do A–E)
- **Już w archiwum** (`docs/archiwum/panele-legacy/`): `Ulepszenia-terenu.xlsx`, `Technologie-drzewko.xlsx` → ZOSTAW (wycofane).
- **Aktywne foldery lane — scal→wycofaj:** `Civ-CYWILIZACJE/Panel-CYWILIZACJE.xlsx`→D · `EKONOMIA/EKONOMIA-panel-parametrow.xlsx`→B · `Civ-MAPA/Parametry-Civ-MAPA.xlsx`→A · `Civ-MAPA/Ulepszenia-na-terenach-matryca.xlsx`→A · `Civ-UNITS/Bitwa-parametry.xlsx`→C · `SILNIK/SILNIK-parametry.xlsx`→E/core.
- **`gra/tools/Jednostki-*-TW-v3*.xlsx`** (atak / PROPOZYCJA / STAN) → robocze balansu jednostek; scal do Panel-C → wycofaj.
- **Pomocnicze w panele-sterowania/** (aktywne, mają eksportery): `Cyw-macierz-REVIEW` (export-cyw-macierz.py), `TW-dystans-edycja` (export-dystans-edycja.py) → zostaw. `Jednostki-staty/PL0-MACIEJ-20260706` = ŹRÓDŁO balansu units → zostaw jako referencja do syncu Panel-C. `Nazwy-miast-cywilizacji` → sklasyfikować (miasta = Panel-D?).

### CO ZROBIONE / CO CZEKA
- ZROBIONE (read-only): inwentaryzacja, audyt 6 paneli + semantyka, klasyfikacja legacy, rozpoznanie merge.
- CZEKA NA DECYZJĘ Macieja (bo = zapisy do jego Exceli + kierunek): (1) sync C+D (GRA→EXCEL, jednoznaczne — mogę od razu); (2) kierunek A/B/E; (3) reko merge [17:05] (a)+(c). Po decyzji: sync + round-trip diff=0 per panel + [17:05] merge + archiwizacja + commit; potem zdjęcie zakazu prebuildu [15:10] i komenda „eksportuj" na stałe.

**CZEKAM-NA:** Maciej — decyzje (1)(2)(3), potem wykonuję zapisy z bramką round-trip.

---

## [20:20 PL, 2026-07-08] — SYNC-PANELI cz.2: C+D zsynchronizowane (bramka diff=0), merge [17:05] wykonany. A/B/E w kolejce.

Decyzje Macieja: (1) sync C+D teraz; (2) A/B/E GRA→EXCEL wszędzie; (3) merge reko „zastąp+jeden eksporter". Wykonane 1 i 3, plus część 2.

### ✅ Panel-C (units) — ZSYNCHRONIZOWANY
Wpisałem wartości z gry do `Panel-C.xlsx`: `Jednostki-staty` 64 komórki + `Koszty-jednostek` 1 (reużyłem parserów export-c → identyczna logika). Bramka round-trip: `staty=0, koszty=0` = **pola kontrolowane przez Excel diff=0**.
**ZNALEZISKO (live):** jedyne pozostałe różnice to pola POCHODNE `fieldPower` ×75 / `siegePower` ×3 (np. Wojownik 21.5 vs 27.0) — live ma **stary cache mocy policzony ze statów sprzed HP×2**. To niespójność w danych live (staty×2, moc nieprzeliczona), NIE kontrolowana przez Excel; naprawi ją realny eksport (sync_units_power_cache przelicza). Wpływ: „moc" jednostek w AI/UI może nie odzwierciedlać nowej wytrzymałości. Kandydat do naprawy przy odblokowaniu „eksportuj".

### ✅ Panel-D (civs) — ZSYNCHRONIZOWANY
`Cywilizacje-roster!M15`: `Nineveh` → `Arbail`. Bramka: civs diff=0.

### ✅ Merge [17:05] — WYKONANY (reko)
- `Panel-A.xlsx`: usunięty stary `Plony-terenow` (rozbieżne źródło); wniesione `Teren-bazowy` + `Bonusy-nakladki` (z formatami).
- `Panel-A-Plony-Terenu.xlsx` → `panele-sterowania/archiwum/` (przeniesiony, nie skasowany).
- `export-terrain-yields.py` przepięty na Panel-A → bramka **terrain-yields 0 zmian** ✅.
- `export-a.py`: `overlay_terrain_yields` wyłączony (29→24 zmian) → **jeden JSON = jeden eksporter**.
- `README-Panel-A-Plony.md` zaktualizowany.

### ⏳ W KOLEJCE — A/B/E (GRA→EXCEL wszędzie), każdy z bramką diff=0
- **A:** terrain-improvements 1 + map-gen-params 23.
- **B:** buildings 28 + tech 31 + society 10 + econ 2.
- **E:** e-start-params 17 + ui-params 1.
Metoda: reverse-sync mirrorujący overlay każdego eksportera (param: klucz→[wartosc]/[normal]; tabela: id→pola). Mechaniczne, ale objętościowe — robię ostrożnie z bramką, nie na ślepo w interfejs Macieja.

### Bezpieczeństwo / status
- `gra/data` (live JSON) **NIETKNIĘTE** (0 brudnych) — wszystkie bramki przez kopie/dry-run.
- Zmiany NIEZACOMMITOWANE (Panel-A/C/D, export-a, export-terrain-yields, README, archiwum/). Czekają na Twój przegląd / „commituj".
- Po wszystkich zielonych panelach: zdjęcie zakazu prebuildu [15:10] + „eksportuj" na stałe (i przeliczenie cache mocy).

**CZEKAM-NA:** Maciej — „dalej A/B/E" (dokończę sync) i/lub przegląd C/D/merge + „commituj".

---

## [21:04 PL, 2026-07-08] — KANON wypchnięty (zabezpieczenie obecnej wersji przed pracą nad wydajnością)

Maciej poprosił o wypchnięcie obecnej wersji gry do kanonu ZANIM zacznę B/A (wydajność) — słuszne: najpierw lock stabilnej, przetestowanej wersji, potem eksperymenty.

**Wykonane (publish-kanon-snapshot.ps1, sankcjonowany):**
- Kanon = kopia istniejącego live robocza **51c2eb24** (NIE przebudowa z gra/src) → **eksperyment B nie wszedł** (potwierdzone: robocza stempel 7fe722e3·19:50 sprzed B).
- gra-kanon/Gra-KANON.html stempel **KANON · 8adcd682 · 21:02**; Gra-FINALNA.html (root) stempel FINALNA 60576180; KANON-MANIFEST.json sourceRoboczaMd5=51c2eb24; START-GRA.html (root launcher); backup + retencja (usunięto 1 stary, ~9 MB).
- WERSJE.md: KANON+FINALNA nowe AKTUALNA; poprzednie 7856d345 → ZASTĄPIONA.
- Zawartość kanonu = D1/D3 (miasto szybko + mgła) + fix drzewka na górze + balans/countery/plony/rzeki/ikony; źródło 865c94e na origin.

**Otwarte / do decyzji Macieja:**
- **git commit + push kanonu na GitHub** (poprzedni kanon miał commit bad0c7f). To osobna, bramkowana akcja („pushuj"). Proponowany zakres commita: artefakty gry (gra-robocza 51c2eb24 + gra-kanon + Gra-FINALNA + WERSJE + kanał) — **BEZ** eksperymentu B (scene.ts) i **BEZ** zmian paneli SYNC-PANELI (osobny temat/commit).

**Następnie:** deploy B (geometria, ~25% mniej trójkątów) do pomiaru F9 → potem A (chunki, na wariancie testowym).

**CZEKAM-NA:** Maciej — (1) czy commit+push kanonu na GitHub; (2) zielone na deploy B.
