# SESJA AUTONOMICZNA — Claude Design (~2 h)

> **Maciej:** offline ~2 h · **bez ABC** · bez playtestu · bez zmian decyzji 1B–8A  
> **Trigger:** wklej prompt z końca pliku · realizuj **kolejność A → B → C → D**  
> **Zapis:** tylko `brand-book/` + `eksport/` · log WYMIANA na koniec (BEZ GitHub)  
> **Status:** dopisuj `DYSPOZYCJA.md` CZĘŚĆ E + log w `WYMIANA-UI-DESIGN.md`

**Checklist master:** [`../../SCHEMAT-AZ-UX-PIPELINE.md`](../../SCHEMAT-AZ-UX-PIPELINE.md)

---

## Realistyczny cel 2 h

| Priorytet | Cel minimalny | Cel ambitny |
|-----------|---------------|-------------|
| **A (P0)** | D1-1 + D1-2 + start D1-3 | Cały ETAP D1 (kroki 1–7) |
| **B (P1)** | DS-07 + DS-08 + 3 ikony Tier 3 | Tier 3 komplet + polish A-01 HTML |
| **C (P2)** | REQ-005 hub kafelki | Tier 4 chipy min. 6 szt. |
| **D (P3)** | Porządek hubu + changelog | E-02/E-03 HTML szkielety |

---

# BLOK A — P0 OBOWIĄZKOWE (ETAP D1)

*Po każdym punkcie: `[x]` tutaj + wiersz w CZĘŚĆ E.*

## A1. Ikony — poprawki i komplet Tier 1+2

### A1.1 REQ-003 — dyplomacja (PIERWSZE)

- [ ] Narysuj **`tb-diplomacy.svg`** + **`tb-diplomacy-40.svg`** — **uścisk dłoni** (dwie dłonie)
- [ ] Usuń / zastąp wszękie warianty **pergamin+pióro** w bibliotece i ekranach HTML
- [ ] Ujednolicić w: HUD mockup, toolbar A-02, D-02 lista dyplomacji, hub ikon
- [ ] Sprawdź spójność stroke 1.5px (24) / 2px (40), `currentColor`, fill none

### A1.2 Tier 1 — zasoby imperium (9 × 2 pliki = 18 SVG)

Folder: `eksport/icons/`

| # | Plik 24px | Plik 40px | Co narysować (SPEC) |
|---|-----------|-----------|---------------------|
| 1 | `res-food.svg` | `res-food-40.svg` | Kromka chleba |
| 2 | `res-work.svg` | `res-work-40.svg` | Młotek |
| 3 | `res-treasury.svg` | `res-treasury-40.svg` | Sakiewka / moneta |
| 4 | `res-science.svg` | `res-science-40.svg` | Sowa z beretem (+ gałąź) |
| 5 | `res-culture.svg` | `res-culture-40.svg` | Maski teatralne |
| 6 | `res-religion.svg` | `res-religion-40.svg` | Świątynia / pagoda |
| 7 | `res-population.svg` | `res-population-40.svg` | Dwie sylwetki ludzi |
| 8 | `res-influence.svg` | `res-influence-40.svg` | Lilia heraldyczna |
| 9 | `res-settlements.svg` | `res-settlements-40.svg` | Sylwetka 2–3 budynków |

- [ ] Wszystkie 18 plików istnieją i otwierają się w przeglądarce
- [ ] Każdy ma viewBox kwadratowy, stroke line, bez fill

### A1.3 Tier 2 — toolbar mapy (5 × 2 = 10 plików; instancje OK)

| # | Plik | Uwaga |
|---|------|-------|
| 1 | `tb-cities.svg` / `-40` | Partenon / kolumny |
| 2 | `tb-science.svg` / `-40` | **= kopia geometrii** `res-science` |
| 3 | `tb-diplomacy.svg` / `-40` | Uścisk dłoni (A1.1) |
| 4 | `tb-army.svg` / `-40` | Skrzyżowane miecze |
| 5 | `tb-build.svg` / `-40` | **= kopia geometrii** `res-work` |

- [ ] 10 plików · reguła instancji zachowana (symlink/kopia SVG, nie nowy rysunek)

---

## A2. Ekrany — Grupa E (HTML PO w `brand-book/`)

**Reguły:** 1B złoto · 2C Georgia/Segoe · 4C outline · 5C panele · **zero emoji**

### A2.1 REQ-002 — game over porażka

- [ ] **`E-15b-game-over-porazka.html`** (lub spójna nazwa z hubem)
- [ ] Layout = **identyczny** jak E-15 wygrana
- [ ] Akcent tytułu / obramowania: **`#c84040`**
- [ ] Przycisk „Nowa gra” — outline 4C (czerwony wariant OK)
- [ ] Link z huba + z E-15 (przełącznik win/lose demo)

### A2.2 Ekrany E — dopracowanie final (🟡 → ✅)

- [ ] **E-01** Menu główne — emblemat, tło, CTA „Rozpocznij grę” outline
- [ ] **E-08** Kreator intro — pasek kroków 5-stopniowy
- [ ] **E-09** Epoka — Kamień / Brąz / Żelazo, monogramy **K/B/Ż** (nie emoji)
- [ ] **E-10** Cywilizacja — siatka kart + panel bonusów; ikony = SVG Tier 1 / monogramy
- [ ] **E-11** Ustawienia kreatora — suwaki/wiersze (DS-09 jeśli gotowy)
- [ ] **E-13** Generowanie — animacja heksów + podsumowanie startu
- [ ] **E-15** Game over **zwycięstwo** — złoto, typ dominacja/nauka, stats block

### A2.3 Ekrany E — P1 jeśli starczy czasu w bloku A

- [ ] **E-02** Panel „Więcej” (dropdown): Kontynuuj, Wczytaj, O grze, Wyjdź
- [ ] **E-03** Ustawienia — 6 suwaków (muzyka, efekty, grafika, język, skala UI, mgła)
- [ ] **E-12** Modal zaawansowane (seed, gęstości, zwycięstwo, barbarzyńcy)
- [ ] **E-14** Stany nawigacji Wstecz/Dalej (disabled, done steps)

---

## A3. Eksport techniczny (freeze v1)

- [ ] **`eksport/tokens.css`** — pełny `:root` (1B paleta + radius + cienie + fonty)
- [ ] **`eksport/tokens.json`** — ten sam zestaw kluczy co CSS
- [ ] **`eksport/HANDOFF.md` v2** z sekcjami:
  - Changelog sesji 2h
  - Mapowanie: ekran HTML → plik TS (`mainMenu.ts`, `newGameFlow.ts`, `victoryScreen.ts`, `hud.ts`…)
  - Lista plików SVG dodanych/zmienionych
  - Breaking changes (jeśli brak — napisz „brak”)
  - Następne kroki dla lane UI (W1b, W2)
- [ ] W HANDOFF: tabela **Tier 1–2** — ID → nazwa pliku → użycie w grze

---

## A4. Log WYMIANA (koniec bloku A)

Zapis plików w `brand-book/` — bez GitHub.

- [ ] Commit message: `design(d1): dyplomacja handshake, E-15b, tier1-2 svg, tokens freeze`
- [ ] Ścieżka: `docs/ux/claude-design/01-propozycje-z-design/brand-book/`
- [ ] W WYMIANA log: **`D1 GOTOWE — czeka pull Macieja`** (albo **`D1 częściowo: …`**)

---

# BLOK B — P1 (jeśli D1 zamknięte lub Maciej wraca późno)

## B1. Komponenty Design System (strony HTML w brand-book)

- [ ] **DS-07** Pasek dolny WYKONAJ / Koniec tury — stany normal, hover, disabled, blocking
- [ ] **DS-08** Modal / overlay — ramka 5C + tło `rgba(8,10,18,0.88)` + przyciski 4C
- [ ] **DS-09** Suwak / slider — złoty track, uchwyt, disabled
- [ ] **DS-06** Strona demo chipów 6C — wszystkie Tier 1 z etykietami PL
- [ ] **DS-14** Zakładka rail — active / idle / disabled (40×40)

## B2. Tier 3 — rail panelu miasta (9 × 2 = 18 SVG)

| ID | Plik | Instancja / nowy rysunek |
|----|------|--------------------------|
| `cp-buildings` | svg + -40 | = tb-cities |
| `cp-recruit` | | = tb-army |
| `cp-granary` | | = res-food |
| `cp-trade` | | = res-treasury |
| `cp-labor` | | = res-work |
| `cp-order` | | **waga** — nowy |
| `cp-health` | | **kaduceusz** — nowy |
| `cp-culture` | | = res-culture |
| `cp-religion` | | = res-religion |

- [ ] 18 plików w `eksport/icons/`
- [ ] Strona podglądu rail w brand-book (9 przycisków pionowo)

## B3. Ekrany Grupa A — baseline HTML (8 ekranów)

*Referencja układu: `docs/ux/baseline/A/` · nie musisz robić PNG — wystarczy HTML PO*

- [ ] **A-01** HUD górny — chipy 6C wszystkie Tier 1 + etykiety PL
- [ ] **A-02** Toolbar lewy — 5 ikon Tier 2 @ 40px
- [ ] **A-03** Dolny pasek — WYKONAJ + Koniec tury (DS-07)
- [ ] **A-04** Panel wydarzeń — chipy [D]
- [ ] **A-06** Panel jednostki [H]
- [ ] **A-08** Tryb budowy ulepszeń
- [ ] **A-11** Lista dyplomacji HUD — ikona uścisk dłoni
- [ ] **A-16** Pre-bitwa (wejście z mapy)

## B4. REQ-005 — Hub Przegląd (1E)

- [ ] Kafelek **„Kreator — wszystkie kroki”** → E-08…E-13
- [ ] Kafelek **„Walka — warianty”** → C-01, C-06, C-07, C-09, C-21
- [ ] Kafelek **„Motion / stany”** → DS-15 demo hover/focus/loading
- [ ] Kafelek **„Ikony — biblioteka”** → grid wszystkich SVG z `eksport/icons/`
- [ ] Każdy ekran HTML: link **← Powrót do huba**
- [ ] Sprawdź **wszystkie linki względne** — zero 404

---

# BLOK C — P2 (backlog na końcówkę sesji / kolejna sesja)

## C1. Tier 4 — chipy pomocnicze (13 × 24px min.)

`chip-manpower`, `chip-order`, `chip-happiness`, `chip-garrison`, `chip-warning`, `chip-rebellion`, `chip-death`, `chip-heart`, `chip-grain`, `chip-crate`, `chip-map`, `chip-star`, `chip-trend-up`

- [ ] Wszystkie 13 w `eksport/icons/` wg SPEC Tier 4

## C2. Tier 5 — dyplomacja + UI chrome (13 ikon)

`dip-alliance`, `dip-pact`, `dip-war`, `dip-war-strip`, `ui-menu`, `ui-close`, `ui-play`, `ui-pause`, `ui-end-turn`, `ui-check`, `ui-lock`, `ui-denied`, `ui-accepted`

- [ ] SVG 24px (+ 40px gdzie sensowne dla toolbar)

## C3. Tier 6 — presety pól okolicy (4)

- [ ] `field-food`, `field-production`, `field-tax`, `field-balanced` — instancje wg SPEC

## C4. Ekrany Grupa B — baseline (8)

- [ ] B-01 ramka panelu · B-02 pasek zasobów · B-15 budowa · B-17 rekrutacja
- [ ] B-29/B-30 dock hover · B-33 hub nauki · B-34 drzewko tech

## C5. Ekrany Grupa D — baseline (5)

- [ ] D-02 lista · D-03 audiencja · D-04 karty akcji · D-05 wojna modal · D-06 propozycja AI

## C6. Ekrany Grupa C — baseline (7)

- [ ] C-01 pre-bitwa · C-06 deploy · C-07 pole · C-08/C-09 HUD bitwy · C-19 mur · C-21 koniec

## C7. Komponenty DS pozostałe

- [ ] DS-10 karta listy (hover/selected/disabled)
- [ ] DS-11 tooltip / dock 280px
- [ ] DS-12 pasek postępu (produkcja, morale, brama)
- [ ] DS-13 toast ~3s u góry mapy
- [ ] DS-15 motion — hover, focus, loading, generator heksów

---

# BLOK D — porządek i dokumentacja (zawsze na koniec sesji)

- [ ] **`DYSPOZYCJA.md` CZĘŚĆ E** — tabela: data, co dostarczone, co defer
- [ ] **`WYMIANA-UI-DESIGN.md` log** — 1 wiersz podsumowania sesji 2h
- [ ] **`WYMIANA` YAML** — `queue_design` statusy: done / in_progress / defer
- [ ] Hub **`The Game — Przegląd (1E).dc.html`** — data ostatniej aktualizacji w stopce
- [ ] Spójność nazw plików (kebab-case, prefiks ID ekranu)
- [ ] **NIE** twórz `brand-book-1E/`, `brand-book-2/`
- [ ] **NIE** zmieniaj decyzji 1B–8A bez ABC Macieja

---

# RAPORT KOŃCOWY (wklej w CZĘŚĆ E + czat po powrocie Macieja)

```markdown
## Raport sesji autonomicznej — [DATA] ~2h

**Zrobione:**
- (lista numerowana)

**Częściowo:**
- (lista)

**Defer (następna sesja):**
- (lista)

**Pliki:** N nowych · M zaktualizowanych · commit: [hash/message]
**Lane UI może:** sync W1b / start W2 / …
**Blokery:** (brak / opis)
```

---

# PROMPT DO WKLEJENIA W CLAUDE DESIGN

```
START — SESJA AUTONOMICZNA ~2h

Maciej offline. Bez ABC. Bez playtestu.

Czytam:
- brand-book/SESJA-AUTONOMICZNA-2H.md (ten plik — BLOK A→D)
- brand-book/DYSPOZYCJA.md (sekcja START)
- docs/ux/claude-design/WYMIANA-UI-DESIGN.md
- 00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md

Zapisuję TYLKO w:
docs/ux/claude-design/01-propozycje-z-design/brand-book/

Kolejność pracy:
1. BLOK A (P0) — ETAP D1 w całości jeśli możliwe
2. BLOK B (P1) — DS-07/08, Tier 3, hub kafelki
3. BLOK C (P2) — tylko jeśie zostanie czas
4. BLOK D — raport + log WYMIANA

Decyzje zamknięte: 1B 2C 3C 4C 5C 6C 7A 8A.
Dyplomacja = UŚCISK DŁONI. Game over porażka = #c84040. Zero emoji.

Na koniec: wypełnij RAPORT KOŃCOWY w DYSPOZYCJA CZĘŚĆ E + log WYMIANA „D1 GOTOWE" lub „D1 częściowo".
Zapis w brand-book/ → OneDrive sync u Macieja
```
