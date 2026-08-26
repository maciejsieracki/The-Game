# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: `R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1`
GOAL: Wyprodukować zrzuty wszystkich 25 jednostek epoki Żelaza od przodu, każdy podpisany
nazwą jednostki, żeby właściciel mógł zobaczyć, jak wyglądają po dwóch seriach audytu.
Zero zmian w kodzie gry.

ZMIANY/COMMIT: `gra/tools/zelazo-zrzuty-25-jednostek-render.cjs` (nowy, jedyny plik).
SHA `50b31a0f` (gałąź `autobot/R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1`, poprzedni `6de4b2a7`).
Diff liczony od `git merge-base` = `bfb180a8`, nie naiwnie od `origin/main` (§9 poz. 9):
**1 plik, 681 wstawień**. `gra/src` i `gra/data` — ZERO zmian (`git diff --stat` pusty).
`origin/main` przesunął się w trakcie rundy na `3ee5b8ea` (cudzy deploy: `WERSJE.md`,
`ROBOCZA-MANIFEST.json`) — mojej gałęzi nie dotyczy, integracja musi iść od merge-base.

**OBRAZKI (poza repo, do wysłania właścicielowi):**
`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/zrzuty-zelazo-25/`
— 25 plików `01-…png` … `25-…png`, arkusz `00-ARKUSZ-ZBIORCZY-5x5.png`, `DOWODY-modeli.json`
(3,0 MB). Każdy obrazek: nazwa wypalona na górze, kadr PRZÓD (azymut 0°, elewacja 0°) obok
kadru KAMERA GRY (azymut 0°, elewacja 52° — wzory skopiowane z `render/camera.ts`), stopka
z dowodem dedykowania. Skala i kadr stałe w obrębie trybu dla wszystkich 25 (liczone raz
z faktycznych wielkości ekranowych, nie z `maxR`, który mieszał szerokość z głębokością).

TESTY:
- `tools/zelazo-zrzuty-25-jednostek-render.cjs` — **61/61**, zero błędów konsoli.
- Lista 25 nazw potwierdzona wobec `units.json`: Epoka=Żelazo ma dokładnie 25 pozycji, każda
  z dispatchu ma odpowiednik, żadnej nadmiarowej. **Jedno odstępstwo, zgłaszam jawnie:**
  dispatch pisze „Hieros Lochos", kanoniczna nazwa to „Hieros Lochos (Święty Zastęp)" —
  dopasowanie po prefiksie, jednoznaczne; renderowana jest jednostka z `units.json`.
- **Dowód modelu dedykowanego (kryterium ważniejsze niż estetyka)** — dla każdej z 25 dwie
  niezależne asercje: (a) dedykowany dispatch odpalił się faktycznie — mierzone wywołaniem
  `buildNamedUnit(normName(nazwa))` ≠ `null`, a dla 4 super-jednostek porównaniem wyniku
  `buildSuperUnit(kultura,…)` z gałęzią `default`; (b) model ≠ generyk kategorii.
  Wyjątek udokumentowany: **Falanga** jest identyczna z modelem kategorii `falanga`, bo obie
  ścieżki wołają `newBuildFalangita` — asercja wymaga wtedy dowodu, że jednostka jest JEDYNYM
  lokatorem tej kategorii w `units.json` (jest), więc to nie jest model współdzielony.
  Dodatkowo: żadne dwie z 25 nie mają identycznej sygnatury (brak cichego aliasu).
- **Dowód nietautologiczności (§9 poz. 6a):** drugi bundle w pamięci z wyłączonym
  `buildNamedUnit` (zawsze `null`) i `buildSuperUnit` (zawsze generyk); `units.ts` w repo
  nietknięty. Wynik: **25/25 traci dedykowany dispatch, 24/25 spada do generyka kategorii**,
  każda jednostka czerwieni co najmniej jedną asercję (A).
- Bramki: `tsc --noEmit` 0 błędów; logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6 — wszystkie zgodne z wartościami referencyjnymi §6.
  `map-gen-regression-test` NIE uruchamiany (zakaz z dispatchu).

BLOKADY: brak.

**DO REJESTRU — defekty ujawnione przez render, świadomie NIENAPRAWIONE (allowlista na to
nie pozwala), osobne tematy:**
1. **Gaesatae** — drzewce włóczni wygląda na nieuchwycone: widoczna szpara między dłonią
   a drzewcem, w obu kadrach (plik `04-Gaesatae.png`). Do potwierdzenia pomiarem.
2. **Niespójna orientacja rodziny konnej** — trzy modele `konnica` są zwrócone w +X (kamera
   gry widzi je z profilu), a `Rydwan celtycki` w +Z (przodem). Jedna rodzina, dwie konwencje.
3. **Garnizon Harappy** — tarcza trzcinowa zasłania od przodu praktycznie całą sylwetkę.
4. **Triari** — hasta jest od przodu silnie skrócona perspektywicznie (prawie niewidoczna),
   czytelna dopiero z kamery gry. Dokładnie ten tryb, przed którym ostrzegał dispatch.

RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5, temat wizualny — §5a wyjątek graficzny).
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi roboczej, zgodnie ze zleceniem; deploy nie).
