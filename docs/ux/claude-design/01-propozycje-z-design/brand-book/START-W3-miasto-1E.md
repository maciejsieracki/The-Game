# ▶ START — W3-miasto-1E (Design — czytaj TO pierwsze)

> ⛔ **ZAMROŻONE 2026-07-03** — checklist poniżej odnosi się do **starego** baseline.  
> **Przed pracą czytaj:** `dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`  
> **Unfreeze:** Maciej ABC + hasło **`START — W3-miasto-v3-delta`**

**Hasło w czacie:** `START — W3-miasto-1E` — **NIE używać** do czasu unfreeze.  
**Po wpisaniu hasła:** wykonaj kroki 0→6 poniżej. **Nie czekaj** na dodatkowe pytania.

---

## KROK 0 — Potwierdź start (1 min)

Napisz Maciejowi:

> W3-miasto-1E START · czytam `START-W3-miasto-1E.md` + `referencje-w3/` · edytuję mockup miasta.

---

## KROK 1 — Otwórz te pliki (kolejność obowiązkowa)

| # | Plik (w folderze `brand-book/`) | Po co |
|---|----------------------------------|-------|
| 1 | **`START-W3-miasto-1E.md`** | ten plik — procedura |
| 2 | **`The Game - Ekran Miasto (1E).dc.html`** | **EDYTUJESZ TEN** — mockup bazowy |
| 3 | **`referencje-w3/BUDYNKI-tabela.md`** | 26 budynków: id, nazwa PL, koszt, tech |
| 4 | **`referencje-w3/JEDNOSTKI-skrot.md`** | jednostki + ikony unit-* |
| 5 | **`referencje-w3/DANE-MIASTO-skrot.md`** | plony, wzrost, porządek, akcje |
| 6 | **`eksport/tokens.css`** | kolory tylko `--tg-*` (FROZEN) |
| 7 | **`eksport/building-icon-map.json`** | id budynku → `bld-*` |
| 8 | **`eksport/unit-icon-map.json`** | kategoria → `unit-*` |
| 9 | **`eksport/icons/buildings/*.svg`** | miniatury budynków @24 |
| 10 | **`The Game — HUD Kit (1E).dc.html`** | spójność chipów górnych z HUD mapy |

**Pełna spec (repo, opcjonalnie):**  
`dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md`

---

## KROK 2 — Sprawdź co mockup MA dziś vs co MUSI mieć

Otwórz `The Game - Ekran Miasto (1E).dc.html` w podglądzie. **Zaznacz braki:**

### ❌ Brakuje w obecnym mockupie (MUSISZ dodać)

| Strefa | Jest teraz | Musi być |
|--------|------------|----------|
| Górny pasek | 3 chipy: Żywność, Praca, Skarbiec | **6 chipów:** Żywność, Praca, Skarbiec (Pieniądz), **Nauka**, **Kultura**, **Zamożność** |
| Header miasta | tylko nazwa + pop | + **epoka**, badge **porządku** (Ład/Bunt…), ◀▶ miasto, ✏, ⚙, Aa, zamknij |
| Lewy rail | **6** okrągłych ikon | **9** ikon `cp-*` (patrz tabela poniżej) + aktywna podświetlona |
| Środek | tylko widok „Budowa" | **9 widoków** (przełączane rail) — każdy z realnymi danymi |
| Budynki | 5 kart + 1 locked | min. **6 stanów UI** + realne koszty z tabeli (np. Spichlerz **20** pracy, nie 60) |
| Produkcja | 1 pasek postępu | + kolejka 2–3 pozycje, **Wstrzymaj**, **Wykup**, **Usuń**, ↑↓ |
| Prawy panel | detail budynku | **zmienia się** per zakładka rail (handel, porządek, okolica…) |
| Okolica | **brak** | siatka heksów + 👤 + 4 profile focus |
| Porządek | **brak** | 3 paski SzPct / PrawPct / PorPct + 6 bandów |
| Stany demo | 1 ekran | **min. 4 warianty** (tabs lub przyciski demo): Spokój · Napięcie · Bunt · Kolejka pełna |

### ⚠️ Błędy w obecnym mockupie (POPRAW)

| Element | Błąd | Popraw na |
|---------|------|-----------|
| „Rynek" | zła nazwa | **Targowisko (Rynek)** (`id: targowisko`, koszt **25**) |
| „Akwedukt" | **nie ma** w grze v0.1 | usuń LUB zamień na **Studnia** (tech: Gospodarka wodna) |
| Koszt Koszar | 80 pracy | **25** (baza epoka 1) |
| Koszt Mury | 120 pracy | **35** |
| Rail ikona 4 | wygląda jak monety | **cp-trade** = podział handlu (3 suwaki) |

---

## KROK 3 — Rail 9 ikon (obowiązkowa mapa)

Użyj SVG z `eksport/icons/tier1/` lub istniejących inline — **semantyka zamknięta**:

| # | id zakładki | tytuł (tooltip) | co rysujesz w środku |
|---|-------------|-----------------|----------------------|
| 1 | `budowa` | Budowa | kolejka + lista 26 budynków (grid) |
| 2 | `rekrutacja` | Rekrutacja | jednostki + Koszary gate |
| 3 | `spichlerz` | Spichlerz | magazyn **14/42** + pasek wzrostu |
| 4 | `handel` | Handel | 3 suwaki: Nauka 20% · Pieniądz 70% · Zamożność 10% |
| 5 | `praca` | Praca | suwak „% Pracy → budynki" (domyślnie 70%) |
| 6 | `porzadek` | Porządek | SzPct 72 · PrawPct 58 · PorPct 65 · band **Napięcie** |
| 7 | `zdrowie` | Zdrowie | linie +/- (studnia, laznia…) |
| 8 | `kultura` | Kultura | przyrost + progi granic |
| 9 | `religia` | Religia | dominująca wiara + udział % |

**Demo:** klik rail (lub zakładki u góry środka) przełącza zawartość — jak w grze.

---

## KROK 4 — Co narysować w każdym widoku (minimum)

### 4A Budowa
- Front: **Koszary** 12/25 + pasek 48%
- Przyciski: **Buduj** (niebieski) · **Kup** (złoty, „×2 pracy") · **Wykup** · **Wstrzymaj** · **Usuń**
- Kolejka pod spodem: 2 pozycje + ↑↓
- Grid budynków: karty ze stanami:
  - **normal** — dostępny (Targowisko 25)
  - **built** — szary „Wybudowany" (Spichlerz)
  - **queued** — „W kolejce" (Biblioteka)
  - **locked-tech** — kłódka + „wymaga: Filozofia" (Akademia)
  - **locked-epoch** — „epoka 3+" (Fort)

### 4B Rekrutacja
- **Wojownik** 10 pracy · **Łucznik** 8 · **Włócznik** 10
- Jedna karta **zablokowana**: „wymaga Koszar" (epoka Brąz)
- Przyciski: **Rekrutuj** · **Kup jednostkę** (złoto)

### 4C Spichlerz
- „Magazyn: **14 / 42**" (próg = 10 + 4×8)
- Pasek wypełnienia 33%
- Tekst: „+6 żywności/turę → wzrost"

### 4D Handel + Zamożność
- 3 suwaki (kroki **10%**, suma **100%**)
- Blok Wealth: poziom **W3** · pula · mnożnik skarbca

### 4E Porządek (4 stany demo — osobne ekrany lub toggle)
| Demo | SzPct | PrawPct | PorPct | Band | kolor |
|------|-------|---------|--------|------|-------|
| A Spokój | 78 | 74 | 76 | Spokój | zielony |
| B Napięcie | 55 | 52 | 54 | Napięcie | pomarańcz |
| C Bunt | 28 | 22 | 25 | Bunt | czerwony |
| D Bunt skrajny | 15 | 12 | 14 | Bunt skrajny | ciemny czerwony + „grace 2 tury" |

### 4F Okolica
- Mini-siatka **7×7 heksów** (uproszczona)
- 4 typy terenu: Łąka (+4🌾) · Równina · Wzgórza · Morze
- **4 👤** na polach (pop=4)
- Przełącznik focus: Zrównoważone · Żywność · Produkcja · Podatki

---

## KROK 5 — Samokontrola przed wysłaniem (checklist)

- [ ] Otworzyłem mockup w przeglądarce — **1920×1080**
- [ ] Górny pasek ma **6** zasobów (nie 3)
- [ ] Rail ma **9** ikon (nie 6)
- [ ] Koszty budynków = z **`referencje-w3/BUDYNKI-tabela.md`** (nie wymyślone)
- [ ] Brak fikcyjnych budynków (Akwedukt) — tylko lista 26
- [ ] Zero emoji — tylko SVG z eksportu
- [ ] Kolory z **`tokens.css`** (`--tg-*`), nie nowe hex
- [ ] Min. **4 stany** porządku (demo A–D)
- [ ] Przyciski akcji widoczne (Buduj, Kup, Wykup, Wstrzymaj, Usuń, ↑↓)
- [ ] Okolica z heksami istnieje
- [ ] Zaktualizowałem **`eksport/HANDOFF.md`** — sekcja W3-miasto-1E
- [ ] Zip: `brand-book/ostatnie/W3-miasto-1E.zip`

---

## KROK 6 — Deliverable dla Macieja

1. **`The Game - Ekran Miasto (1E).dc.html`** — zaktualizowany (lub `-v2` + link w hubie)
2. **`eksport/HANDOFF.md`** — wpis W3
3. **Zip** → `brand-book/ostatnie/W3-miasto-1E.zip`
4. Napisz Maciejowi: **„W3-miasto-1E GOTOWE — zip w ostatnie/"**

**NIE dostarczasz:** kodu TypeScript · zmian w `gra/src/`.

---

## Czego NIE robisz

- Nie integrujesz z grą (`cityPanel.ts` = Lane UI)
- Nie zmieniasz `tokens.css` FROZEN
- Nie wymyślasz nowych budynków/jednostek poza tabelami referencji
- Nie używasz emoji

---

*Maciej · Lane UI · 2026-07-03*
