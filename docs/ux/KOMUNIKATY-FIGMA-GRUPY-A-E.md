# Komunikaty Figma — pięć grup (A–E) · wersja 2026-06-26

**Dla Macieja:** skopiuj **jeden blok** do czatu danej grupy.  
**Plik Figmy (wspólny):** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Status całości:** [`figma/STATUS-FIGMA.md`](figma/STATUS-FIGMA.md)

**Decyzje stylu (zamknięte — nic nowego):** `1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A` → [`DECYZJE-WARSTWA1-MACIEJ.md`](DECYZJE-WARSTWA1-MACIEJ.md)

**Ważne dla wszystkich:**
- Plan **Figma Starter = max 3 strony** → mapowanie: [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md)
- **Nie potrzebujecie tokena MCP** — pracujecie w **figma.com** (przeglądarka) po zaproszeniu **Can edit** od Macieja
- **Nie piszecie kodu** — tylko makiety w Figmie + raport
- Czekajcie na sygnał lane UI: **„GOTOWE 00–02”** (= gotowa **strona 1 · Design System**) — **potem** układacie ekrany na **instancjach** komponentów, nie od zera
- **Meldunki (tylko to zadanie Figma A–E):** patrz § **Reguła meldunków** w [`figma/STATUS-FIGMA.md`](figma/STATUS-FIGMA.md) — **nie** dotyczy innych raportów projektu; w tym zadaniu Maciej nie przekleja długich opisów z czatu

---

# WKLEJ — GRUPA A (HUD / mapa)

```
Dyspozycja UI — redesign w Figmie · GRUPA A (HUD mapy)

Plik wspólny (otwórz w przeglądarce):
https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Poproś Macieja o Share → Can edit, jeśli nie macie dostępu.

Wasza strefa w pliku
--------------------
Strona 2 · „Mapa i miasto” → sekcja A (prefiks frame’ów: A-01, A-02…)
(Nie edytujecie strony 1 DS ani sekcji B / C / D / E.)

Skąd brać materiały
-------------------
· Styl: docs/ux/DECYZJE-WARSTWA1-MACIEJ.md (1B złoto, 2C Georgia, 4C outline, 5C panele, 6C chipy z etykietą PL)
· Ikony: docs/ux/FIGMA-SPEC-IKONY.md — np. Praca = MŁOTEK, Żywność = kromka chleba, Nauka = sowa z beretem
· Rejestr ekranów: docs/ux/REJEST-UX-MASTER.md → sekcja Grupa A (30 poz.)
· Baseline PRZED: docs/ux/baseline/A/ (8 PNG)
· Komponenty: strona 1 · Design System (instancje — dopiero po sygnale GOTOWE 00–02)
· Raport: docs/ux/figma/grupa-A/RAPORT-FIGMA.md (append-only)

8 frame’ów obowiązkowych (nazwa = ID)
--------------------------------------
A-01 HUD górny          → baseline/A/A-01_hud-gora.png
A-02 Toolbar lewy       → A-02_toolbar.png
A-03 Dolny pasek        → A-03_dolny-pasek.png
A-04 Panel wydarzeń     → A-04_panel-wydarzen.png
A-06 Panel jednostki    → A-06_panel-jednostki.png
A-08 Tryb budowy        → A-08_tryb-budowy.png
A-11 Lista dyplomacji   → A-11_lista-dyplomacji.png
A-16 Pre-bitwa          → A-16_pre-bitwa.png

Uwagi layoutu:
· A-06 — baseline = panel stosu w silniku (nie mockup A2-Q4)
· A-16 — baseline z mockupu HTML; możecie podmienić zrzutem z live gry przy layoutcie

Jak pracować (po sygnale GOTOWE 00–02)
--------------------------------------
1. Otwórz stronę 2 → sekcja A.
2. Dla każdego frame’u: import baseline PNG → opacity ~35% → LOCK.
3. Na wierzchu: TYLKO instancje ze strony 1 (chip 6C, btn 4C, ikony 3C).
4. Chipy HUD: [ikona 24px] + [liczba] + [etykieta PL] — np. „Żywność”, „Praca”.
5. Eksport PO (opcjonalnie): docs/ux/figma/grupa-A/export/A-*_po.png
6. Wpis w RAPORT-FIGMA.md: POSTĘP → na końcu GOTOWE.

DoD (GOTOWE)
--------------
[ ] 8 frame’ów · zero własnych kolorów poza Variables DS
[ ] Ikony tylko z biblioteki · chipy z etykietami PL
[ ] Raport: status GOTOWE

Teraz (przed GOTOWE 00–02)
--------------------------
Przygotujcie kolejkę, przeczytajcie spec ikon, wpis START/POSTĘP w raporcie.
NIE rysujcie finalnych ekranów na jednorazówkach — czekajcie na komponenty DS.

Meldujcie blokery w RAPORT-FIGMA.md · lane UI czyta STATUS-FIGMA.md.
```

---

# WKLEJ — GRUPA B (panel miasta)

```
Dyspozycja UI — redesign w Figmie · GRUPA B (panel miasta / ekonomia)

Plik: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Share → Can edit (Maciej).

Wasza strefa
------------
Strona 2 · „Mapa i miasto” → sekcja B (prefiks B-01, B-02…)
Nie ruszajcie sekcji A ani strony 1 DS.

Skąd brać
---------
· Styl + ikony: docs/ux/DECYZJE-WARSTWA1-MACIEJ.md · docs/ux/FIGMA-SPEC-IKONY.md
  Rail 9 zakładek (Tier 3): praca = MŁOTEK, spichlerz = chleb, zdrowie = kaduceusz, itd.
· Rejestr: docs/ux/REJEST-UX-MASTER.md → Grupa B (37 poz.)
· Baseline: docs/ux/baseline/B/ (8 PNG)
· Szczegóły frame’ów: docs/ux/figma/grupa-B/RAPORT-FIGMA.md (tabela kolejki)
· Raport: ten sam plik — append-only

8 frame’ów obowiązkowych
------------------------
B-01 Panel miasta (layout 3 kolumn — zachować funkcje, zmienić wygląd · ramka 5C)
B-02 Pasek zasobów góra (chipy 6C: Ludność, Rekruci, Żywność, Praca, Skarb, Nauka…)
B-15 Budowa — lista dostępne + w mieście
B-17 Rekrut — lista jednostek
B-29 Dock hover — budynek
B-30 Dock hover — jednostka (ramka docka; mini 3D w grze bez zmian)
B-33 Hub badań (sowa)
B-34 Drzewko technologii

Rail B-14 (9 ikon pionowo) — w B-01 + komponent rail ze spec Tier 3.

Jak pracować
------------
1. Czekajcie GOTOWE 00–02 (strona 1 DS).
2. Baseline pod spodem 35% lock → komponenty z DS na wierzchu.
3. Tytuły Georgia · UI Segoe · przyciski outline 4C · panel premium 5C.
4. Export PO → docs/ux/figma/grupa-B/export/
5. Raport → GOTOWE.

DoD: 8 frame’ów · rail zgodny ze spec · min. 2 karty szczegółów (np. Ludność + Praca) · raport GOTOWE.

Teraz: spec + baseline ✅ — przygotowanie OK; layout po DS.
```

---

# WKLEJ — GRUPA C (walka)

```
Dyspozycja UI — redesign w Figmie · GRUPA C (walka / pre-bitwa / bitwa 3D)

Plik: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Share → Can edit (Maciej).

Wasza strefa
------------
Strona 3 · „Walka · dyplo · meta” → sekcja C (prefiks C-01…)
Redesignujecie TYLKO ramki UI — nie figurki 3D na polu bitwy.

Stan u Was (ważne)
------------------
Macie już GOTOWE lokalnie:
· 7 PNG redesignu: docs/ux/figma/grupa-C/export/
· HTML źródłowy: docs/ux/figma/grupa-C/FIGMA-FRAMES-C.html
· Raport: docs/ux/figma/grupa-C/RAPORT-FIGMA.md

Wasze zadanie TERAZ = sync do chmury Figmy (nie od zera)
--------------------------------------------------------
1. Po GOTOWE 00–02 (lub równolegle z lokalnymi stylami → później podmiana na instancje DS).
2. Otwórz stronę 3 · sekcja C.
3. Dla każdego z 7 frame’ów:
   · warstwa dolna: baseline z docs/ux/baseline/C/ @ 35% lock
   · warstwa górna: layout z export/ (Place image) LUB odtwórz z komponentów DS
4. Frame’y:
   C-01 Pre-bitwa · C-06 Deployment · C-07 Pole bitwy · C-08 HUD góra
   C-09 Pasek komend · C-19 Mur/brama oblężenia · C-21 Koniec bitwy
5. Panel 5C · przyciski 4C · wojsko = ikona tb-army (miecze) ze spec.
6. Raport: dopisz SYNC FIGMA + GOTOWE gdy 7/7 w pliku cloud.

Limit MCP Starter — sync ręcznie w przeglądarce Figmy (nie wymaga Cursor MCP).

DoD końcowy
-----------
[ ] 7 frame’ów w pliku Figmy (cloud)
[ ] Po DS: podmiana kolorów na Variables · instancje z strony 1
[ ] export/ zaktualizowany jeśli poprawiacie · raport GOTOWE

Nie zmieniajcie logiki combat — tylko wygląd paneli.
```

---

# WKLEJ — GRUPA D (dyplomacja)

```
Dyspozycja UI — redesign w Figmie · GRUPA D (dyplomacja)

Plik: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Share → Can edit (Maciej).

Wasza strefa
------------
Strona 3 · sekcja D (prefiks D-02…)
Nie edytujecie sekcji C ani E.

Skąd brać
---------
· Styl: docs/ux/DECYZJE-WARSTWA1-MACIEJ.md
· Ikony Tier 5: docs/ux/FIGMA-SPEC-IKONY.md
  dip-alliance (uścisk dłoni) · dip-pact (gołąb) · dip-war (miecze)
  ui-accepted / ui-denied
· Rejestr: docs/ux/REJEST-UX-MASTER.md → Grupa D
· Baseline: docs/ux/baseline/D/ (5 PNG)
· Raport: docs/ux/figma/grupa-D/RAPORT-FIGMA.md

Częściowo zrobione (kontynuujcie)
---------------------------------
Komponenty chipów dip-* — dokończyć frame’y ekranów.

5 frame’ów obowiązkowych
------------------------
D-02 Lista dyplomacji (toolbar 🤝)
D-03 Audiencja — pełny ekran, Zaufanie/Respekt, Georgia w tytule
D-04 Karty akcji audiencji (12 slotów — aktywne vs szare „v1.1”)
D-05 Modal potwierdzenia wojny (akcent czerwony tylko z tokenów)
D-06 Modal propozycji AI — Akceptuj/Odrzuć

Jak pracować
------------
1. Preferowane: po GOTOWE 00–02 — instancje Panel 5C, Btn 4C.
2. Baseline @ 35% lock pod każdym frame’em.
3. Audiencja = Panel 5C pełny ekran · modale = Btn outline.
4. Export PO → docs/ux/figma/grupa-D/export/
5. Raport → GOTOWE.

Font: jeśli Georgia niedostępna w Figmie — Lora Bold jako serif (2C); UI = Inter/Segoe — po DS podmiana.

DoD: 5 frame’ów · chipy dip-* z biblioteki · raport GOTOWE.
Praca w przeglądarce — limit MCP Starter nie blokuje ręcznej Figmy.
```

---

# WKLEJ — GRUPA E (menu / kreator / meta) · PRIORYTET wdrożenia

```
Dyspozycja UI — redesign w Figmie · GRUPA E (menu · kreator · game over)
PRIORYTET: pierwszy batch w grze (decyzja Macieja 8A: E → A → B → D → C)

Plik: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Share → Can edit (Maciej).

Wasza strefa
------------
Strona 3 · sekcja E (prefiks E-01…)
Pełna instrukcja: docs/ux/figma/grupa-E/WORKFLOW-GRUPA-E.md
Pixel-perfect: docs/ux/figma/grupa-E/SPEC-FRAMES.md

Skąd brać styl (Maciej już zdecydował — nic nowego)
----------------------------------------------------
1B ciepłe złoto · 2C Georgia („THE GAME”, „NOWA GRA”) · 4C przyciski outline
5C panele gruba ramka · 3C ikony ui-menu, ui-close, ui-check

6 frame’ów obowiązkowych
------------------------
E-01 Menu główne          → export/E-01_menu-glowne.png (baseline PRZED)
E-03 Ustawienia           → E-03_ustawienia.png
E-09 Kreator — epoka      → E-09_kreator-krok2-epoka.png
E-10 Kreator — cywilizacja → E-10_kreator-krok3-cywilizacja.png
E-11 Kreator — ustawienia gry → E-11_kreator-krok4-ustawienia.png
E-15 Game over            → E-15_game-over.png (+ wariant porażka czerwony)

Baseline PRZED: docs/ux/baseline/E/ (skopiowane też do export/)

Jak pracować
------------
1. Po GOTOWE 00–02 — komponenty: StepBar kreatora, Btn outline, Panel 5C, ikony Tier 5.
2. Canvas 1920×1080 · baseline @ 35% lock · redesign na wierzchu.
3. Export PO: export/E-01_po.png … E-15_po.png
4. Raport: docs/ux/figma/grupa-E/RAPORT-FIGMA.md → GOTOWE

Maciej review (bez technikaliów): docs/ux/figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md

DoD
---
[ ] 6 frame’ów w Figmie · instancje z DS (nie jednorazówki)
[ ] Georgia + Segoe · export PO · raport GOTOWE

Stan: 6/6 baseline ✅ · 0/6 frame’ów cloud · czekacie na stronę 1 DS lub rysujecie z lokalnymi tokenami z SPEC (podmiana po DS).

Po Figmie E: lane UI wdraża wygląd w mainMenu.ts / newGameFlow.ts / game over — pierwsze wrażenie gracza.
```

---

## Kolejność wysyłki (Maciej)

| Kolejność | Grupa | Dlaczego |
|-----------|-------|----------|
| 1 | **E** | Pierwszy wdrożony w grze |
| 2 | **A + B** | Równolegle po GOTOWE DS (strona 2) |
| 3 | **C + D** | Strona 3 — C ma import z export/, D dokończyć frame’y |

**Przed wysłaniem:** upewnij się, że zaprosiłeś edytorów do pliku Figmy (**Share → Can edit**).

**Sygnał dla wszystkich (gdy lane UI skończy DS):**
```
GOTOWE 00–02 — strona 1 Design System w pliku Figmy gotowa.
Instancje: Variables, Btn 4C, Panel 5C, Chip 6C, ikony FIGMA-SPEC-IKONY.
Możecie startować layout na swoich sekcjach (strona 2 lub 3).
Link: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
```

---

## WKLEJ — WSZYSTKIE GRUPY (stopka meldunków · **tylko zadanie Figma redesign**)

```
Jak meldujecie postęp w TYM zadaniu (Figma redesign / Warstwa 1 — OBOWIĄZKOWE, nie tylko w czacie):

· Dotyczy WYŁĄCZNIE makiet Figmy w pliku DS v1 — NIE zastępuje innych raportów projektu
  (walka, ekonomia, integrator, playtest itd. mają swoje pliki *-DO-MASTERA jak dotąd).

· Każda odpowiedź / POSTĘP / STOP / GOTOWE → append w:
  docs/ux/figma/grupa-{X}/RAPORT-FIGMA.md
  (sekcja „Meldunki”, data [YYYY-MM-DD], 5–15 linii: co zrobione · frame’y X/Y · blokery)

· Ważne dla lane UI → krótki skrót w dyspozycje/UI-DO-MASTERA.md (wpis OD GRUPY X)

· Maciej NIE przekleja tych raportów do MASTER/Cursor — czyta pliki w repo.

W czacie do Macieja wystarczy jedna linia:
„Zapisane w RAPORT-FIGMA.md § [data]”.
```

---

*Pięć komunikatów · sync STATUS-FIGMA · FIGMA-LIMIT-3-STRONY · FIGMA-KONTO-DOSTEP-MACIEJ*
