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
**Po odpowiedzi:** **ECHO** (powtórz wybory i konsekwencje) → potwierdź „wdrażaj?" → działaj po „Tak".
**Hasło `format` / `ABC`** → natychmiast przepisz pytanie w pełnej formie, bez tłumaczenia się.
**Zakazane:** sam formularz bez tekstu · skróty/gołe id · brak rekomendacji · długie opisy w formularzu.
**Po co:** Maciej ma decydować bez domyślania się — pełny kontekst i trade-offy w tekście do przeczytania, minimalny picker tylko do kliknięcia.

**Brak odpowiedzi** = wariant `[REKOMENDACJA]` + oznaczenie `[ZAŁOŻENIE — do potwierdzenia]`.

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
