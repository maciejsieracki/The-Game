# PAMIĘĆ ROBOCZA — Civ „The Game"

**Przeniesiona 2026-07-19** z lokalnej pamięci asystenta (była przypięta do innego projektu i nie jechała z repo). Ten plik istnieje po to, żeby **każda nowa sesja — lokalna, chmurowa, telefoniczna — miała nie tylko stan kodu, ale i wiedzę „jak tu się pracuje"**.

Kolejność czytania: `CLAUDE.md` (zasady, auto-ładowane) → `STAN-PRACY-HANDOFF.md` (aktualny stan) → ten plik (kontekst, historia, szczegóły).

---

## 1. PEŁNA SPECYFIKACJA FORMATU ABC (wymagana przy każdej decyzji)

Maciej wymaga **pełnej formy** dla KAŻDEJ decyzji gameplayowej/produktowej/architektonicznej. Stary, lżejszy wzór („O co chodzi i dlaczego" / same plusy-minusy / sam formularz) jest **wycofany — bez skrótów**.

**Struktura każdego pytania — pełny tekst w czacie, dokładnie w tej kolejności:**
0. **Nagłówek** — `[TEMAT: …]` lub `[EKRAN: …]` + **ID pytania** (np. `C-MAP-Q1`, `B2-Q7`). Obowiązkowe.
1. **Sytuacja** — co jest DZIŚ w grze, językiem gracza, pełne nazwy, zero skrótów typu „P2"/gołych id. 2–4 zdania.
2. **Cel pytania** — jaki efekt ma mieć decyzja. 1–2 zdania.
3. **Dlaczego teraz** — blokada / ryzyko / zależność. 1–3 zdania.
4. **A / B / C** — każda opcja: opis decyzji *w grze* + **Za (≥2)** + **Przeciw (≥2)**. Zakaz skróconych list typu „A: szybciej / B: więcej pracy".
5. **Rekomendacja** — ZAWSZE litera A/B/C + jedno zdanie dlaczego.
6. **Formularz Ask** na samym końcu — tylko krótkie etykiety A/B/C (bez Za/Przeciw), rekomendacja pierwsza z dopiskiem „(Rekomendacja)".

**Paczkowanie:** max **3 pytania na turę** (jedna wiadomość + jeden formularz). Dłuższa kolejka → nagłówek `[PACZKA 1/N]`, kolejna paczka **dopiero po odpowiedzi**. Paczki po ~10 pytań zrywają rozmowę.

**⛔ PEŁNE ID PYTANIA (Maciej 2026-08-03) — `R-PROC-ABC-FULL-ID`:**  
Gołe `Q1` / `Q2` / `Q3` **ZAKAZANE** w czacie, Ask i ECHO — jest wiele wątków naraz.  
**Zawsze:** `R-<TEMAT>-Q1`, `R-AUTO-BUDOWA-LISTA-Q2`, `P-SCOUT-EXPLORE-Q1` itd.  
Nagłówek paczki: `[PACZKA 1/N — R-AUTO-BUDOWA-LISTA-Q2, R-AUTO-BUDOWA-LISTA-Q3]`.  
Odpowiedź Macieja / ECHO: `R-AUTO-BUDOWA-LISTA-Q2=A · R-AUTO-BUDOWA-LISTA-Q3=B` — nigdy samo „a / q3b” bez tematu po stronie agenta.

**Po odpowiedzi:** **ECHO** (powtórz wybory i konsekwencje) → potwierdź „wdrażaj?" → działaj po „Tak".
**Hasło `format` / `ABC`** → natychmiast przepisz pytanie w pełnej formie, bez tłumaczenia się.
**Zakazane:** sam formularz bez tekstu · skróty/gołe id · **gołe Q1 bez tematu** · brak rekomendacji · długie opisy w formularzu.
**Po co:** Maciej ma decydować bez domyślania się — pełny kontekst i trade-offy w tekście do przeczytania, minimalny picker tylko do kliknięcia.

**Brak odpowiedzi** = wariant `[REKOMENDACJA]` + oznaczenie `[ZAŁOŻENIE — do potwierdzenia]`.

---

## 1a0. NUMER → ABC → COMMIT → DEPLOY (Maciej 2026-08-03) — NADRZĘDNE

**Kanon:** `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` · reguła Cursor: `.cursor/rules/numer-abc-commit-deploy.mdc`

1. Każdy case (pytanie o konkret, bug, poprawka, innowacja) → **ID + wpis** w `REJESTR-PROSB-I-ZADAN.md` (bugi: też `REJESTR-PROBLEMOW-AI.md`).
2. Po rozpoznaniu: **propozycja rozwiązania ± ABC** — **bez** automatycznej edycji `gra/`.
3. Maciej odpowiada **`pełne-ID + A|B|C`** (np. `R-AUTO-BUDOWA-LISTA-Q2 A`) → ECHO → kod → **commit** (bez publish).  
   **Zakaz gołego `Q1`/`Q2`** w pytaniach agenta — patrz `R-PROC-ABC-FULL-ID`.
4. **Deploy** tylko na hasło **`deploy`** / „deploy do robocza”. Stare AUTONOMIA / C-ORG-Q17 **nie** uprawniają do deployu bez hasła.

---

## 1a. TRZY ZASADY PROCESU DOŁOŻONE 2026-07-25 (obowiązują razem z formatem ABC wyżej)

**1. Zakaz otwierania nowych wątków pytaniami.** Wolno zadawać **wyłącznie pytania doprecyzowujące do wątku,
który Maciej AKTUALNIE prowadzi**. Pytania otwierające nowy temat — dopiero gdy on sam powie, że można.
Problem znaleziony przy okazji (nie dotyczący bieżącego wątku) zapisuje się **cicho** do
`dyspozycje/PYTANIA-OTWARTE.md` i **nie wspomina się o nim w czacie**. **Każde pytanie i każdy bug Macieja → ten plik zanim zmienisz temat** (2026-07-29). Jego słowa: „ja odpowiadam na jedno,
a ty generujesz kolejnych pięć… nie jesteśmy w stanie zakończyć jednego, a ty wyciągasz kolejne". Kończymy
jeden temat, dopiero potem następny — nie mieszamy wątków w jednej odpowiedzi.

**2. Każda liczba musi mieć nazwany parametr, jednostkę i kontekst.** Zakaz pisania „baza 16", „przyrost +7",
„daje 35" bez powiedzenia, **czego** liczba dotyczy. Zawsze trzy rzeczy razem: **czego** (Kultura / Praca /
Prawo / Pieniądz / Zadowolenie / Obrona…), **w jakiej jednostce** (pkt na turę, %, pkt Prawa) i **w jakim
kontekście** (poziom, epoka, poziom trudności). Nagłówek kolumny samo „Baza" jest zakazany — ma być np.
„Kultura (baza)". Jego słowa: „wpisujesz baza, ale baza do czego? potem chodzimy po omacku". Dotyczy też
tabel w tym pliku i we wszystkich plikach `dyspozycje/*.md` — nie tylko rozmowy w czacie.

**3. Opus 5 i Fable 5 wyłącznie za wyraźną zgodą Macieja.** Domyślnie każda praca (kod, dane, analiza, audyt)
leci na subagentów **Sonnet 5**. Zmiana modelu na Opus/Fable wymaga jego wyraźnej zgody w bieżącej rozmowie —
nie domyślaj się, że skomplikowany temat kwalifikuje się automatycznie.

**4. Odpowiedź ABC → najpierw plik, potem kod (Maciej 2026-07-27).** Gdy Maciej pisze `ID: litera`
(np. `C-TEREN-IMPL-3: B`), agent **najpierw** zapisuje odpowiedź w `docs/decyzje/<ID>.md` + indeks
`ABC-KOLEJKA-OTWARTE-*.md` (status 🟡 ZAPISANA), **dopiero potem** dotyka `gra/`. Inne sesje czytają
repo, nie czat. **Dotyczy też odpowiedzi już udzielonych w czacie** — jeśli brakuje sekcji
**„Odpowiedź Macieja"** w pliku, uzupełnij natychmiast (retroaktywnie). Szczegóły: `docs/decyzje/ABC-ZAPIS-PLIKOWY.md` §„Kolejność obowiązkowa".

**5. Po każdej paczce pracy — zaproponuj następny krok (Maciej 2026-08-01).** Agent **nie czeka** na pytanie
„co dalej?” / „nad czym pracujesz?”. Kończy wiadomość blokiem **„Następny krok”** z max 3 konkretnymi
opcjami (pierwsza = rekomendacja). Reguła Cursor: `.cursor/rules/maciej-nastepny-krok.mdc`.

**Gdzie te zasady muszą być widoczne** (sprawdzaj przy każdej większej aktualizacji dokumentacji):
`CLAUDE.md` §„Jak pracować z właścicielem" · ten plik · `.cursor/rules/maciej-nastepny-krok.mdc` · `dyspozycje/BACKLOG-PRZYSZLOSC.md` §E.

---

## 2. MODEL WERSJI (tiery)
- **ROBOCZA** — tu iterujemy każdą pracę; nowe fixy/grafika/FPS lądują tu do testu. To jedyny cel zwykłego deployu.
- **KANON** — jedna bieżąca, pewna wersja. Promocja dopiero, gdy ROBOCZA sprawdzona.
- **FINALNA** — robiona **raz dziennie**, gdy pewność, że Kanon jest OK.

Nowa praca **nie rusza** kanonu ani finalnej, dopóki nie potwierdzona w roboczej. Rejestr wersji: `dyspozycje/WERSJE.md`.

## 3. WSPÓŁDZIELONE DRZEWO — WIELU INTEGRATORÓW ⚠️
`gra/src` bywa współdzielone przez kilka równoległych sesji/czatów. Historycznie: jeden czat = **integrator #1, jedyny deployer ROBOCZA**; drugi przygotowuje źródła (np. dane drzewka) i **nie deployuje** bez sygnału Macieja.

**Reguła:** zanim zbudujesz — sprawdź `git status` i upewnij się, że nie łapiesz cudzej pracy w połowie (build w trakcie czyjejś zamiany nazw = niespójny bundle). Zdarzył się realny konflikt dwóch deployów z różnych drzew (`d2a346ff` nadpisany przez `58182469`).

**Pułapka „deploy ≠ commit":** w przeszłości build poszedł ze **starego, zamrożonego** drzewa (`gra-robocza/srcKopiaMaster`, ~129 plików za `gra/src`) i po cichu cofnął zacommitowane poprawki na żywym bundlu. **Buduj wyłącznie z `gra/src`**; wersja live musi zawsze odpowiadać zacommitowanemu stanowi repo. `srcKopiaMaster` jest **zamrożone — nie edytuj i nie buduj z niego**.

## 4. PANELE EXCEL — OBIEG DANYCH
Każdy parametr rozgrywki mieszka w Excelu w `panele-sterowania/`; `export-{a..e}.py` przelewają go do JSON w `gra/data/`; kod TS tylko czyta JSON. Maciej balansuje w Excelu i mówi „eksportuj".

**ALE — dopóki panele nie są zsynchronizowane, kierunek jest jednostronny: JSON → Excel** (przez `gen-panel-*.py`). JSON jest źródłem prawdy (gra na nim działa). **Nie uruchamiaj `export-*.py` na żywym `gra/data`** — nadpisze aktualne dane starym Excelem. Round-trip tylko na kopii (`--data-dir <tmp>`), harness: `panele-sterowania/test-panel-{a,b,c,d}-roundtrip.py`.

**Mapowanie:** Panel-A → ulepszenia/mapa/plony · Panel-B → miasto/ekonomia/budynki/surowce/technologie · Panel-C → jednostki/walka/kontry · Panel-D → cywilizacje/dyplomacja/AI · Panel-E → UI/start. Osobno: `Cyw-macierz-REVIEW.xlsx` → `civ-matrix.json`.

**Ostrożnie:** `gen-panel-c.py` przy okazji przelicza cache mocy i **potrafi nadpisać `units.json`** (robi `.bak`, ale pisze do żywego pliku). `gen-cyw-macierz.py` przelicza `civ-matrix.json` od zera. Po każdym uruchomieniu generatora sprawdź `git status gra/data` i cofnij niezamierzone zmiany. `wonders.json` **nie ma panelu** — nie obejmuje go sync.

---

## 5. ZALEGŁE WĄTKI Z WCZEŚNIEJSZYCH SESJI

**Sesja 2026-07-27/28 (zdeployowane FALA 41–44, commit `65e3ddd`, md5 `95021308`):**
- Spichlerz U-12/U-25B + Garncarnia R7-C (FALA 42)
- C-OBCE-JEDN-Q2 żeton mapy — medalion + koszary/kuźnia (FALA 43)
- **C-UPGRADE-TRIGGER** — bonus budynków wojskowych przy wejściu do miasta + toast (FALA 44); kumulacja nadal 1A (`C-UPGRADE-KUMULACJA`)
- Pełny zapis: `STAN-PRACY-HANDOFF.md` §3a-6 · `docs/decyzje/STATUS-WDROZEN-AGENT-2026-07-28.md`

Aktualna kolejka pracy jest w `STAN-PRACY-HANDOFF.md` §8. Poniżej starsze, wciąż otwarte tematy, żeby nie zginęły:

**Wydajność / render**
- Optymalizacje FPS: doszlifowanie mgły, LOD, `matrixAutoUpdate`, minimapa — klik → kamera.
- **Chunkowanie mapy** — świadomie odłożone **na sam koniec**; ważne dla słabszych maszyn (Maciej testuje na mocnym PC, więc problem jest u innych).
- Wioski: render wpięty, ale `hex.wioska.istnieje` nigdzie nie ustawiane na `true` → nie pojawiają się w grze.

**Mapa / teren**
- Zwiększyć **gęstość osadnictwa** — więcej miast/państw/cywilizacji na mapę.
- Bug: rzeka znika przy budowie miasta, wraca po wyłączeniu mgły wojny.
- Układ sektorowy ulepszeń + swobodne współistnienie — częściowo wdrożone; tryb podglądu `?demo=ulepszenia`; do zrzutów ekranu używany Playwright na `file://`.

**Jednostki / zasady**
- Zasady zwierząt/pastwisk — wdrożone; został wzrokowy test rozgrywki.
- `farma-solo` → przesunięcie na W-NW.
- Stary poradnik `57-katalog-jednostek.md` i wikiBundle mają nieaktualne nazwy (widmowy „Kusznik").

**Ekonomia**
- Handel vs Wymiana: **Mennica** ma zahardkodowany mnożnik ×1 (no-op), **Magazyn** ma wyłączony limit surowców, **Karawanseraj** nie ma unikalnej mechaniki. Decyzja otwarta: naprawić te trzy budynki czy zrobić realne szlaki handlowe między miastami.

---

## 6. DROBNE, ALE UŻYTECZNE
- Playtesty: `gra-robocza/START.html` = hub; bundle są samodzielne (single-file HTML), można je otwierać z `file://`.
- Do zrzutów ekranu z gry działa **Playwright/Chromium z `gra/node_modules`** — WebGL wymaga flag `--use-gl=angle --enable-webgl`, inaczej renderer wisi.
- Kanał komunikacji między integratorami: `dyspozycje/_handoff/KANAL-PRACA.md` (append-only, stopka `CZEKAM-NA:`).
- Deliverables dla Macieja (zestawienia, diagramy) trafiają do `dyspozycje/` jako `.xlsx`/`.svg`/`.png` — **Windows nie otwiera `.svg` dwuklikiem**, więc diagramy dawaj też jako PNG lub HTML.
- Przy generowaniu Excela: jeśli Maciej ma plik otwarty, zapis się nie powiedzie; unikaj też kolizji nazw (Excel nie otworzy drugiego pliku o tej samej nazwie).
