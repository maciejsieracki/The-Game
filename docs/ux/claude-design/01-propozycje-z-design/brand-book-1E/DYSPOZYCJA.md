# DYSPOZYCJA — Claude Design ↔ The Game (Civ)

> **Folder roboczy:** `brand-book-1E/` (wszystkie nowe pliki tutaj)  
> **Eksport techniczny:** `brand-book-1E/eksport/` (`tokens.css`, `tokens.json`, `HANDOFF.md`, `icons/`)  
> **Hub:** `The Game — Przegląd (1E).dc.html` — linki względne, bez błędów po przenosinach  
> **Decyzje Macieja (ZAMKNIĘTE — nie zmieniaj bez ABC):** `1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A`  
> **Spec ikon (OBOWIĄZKOWA):** `docs/ux/claude-design/00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md`  
> **Rejestr ekranów gry (130+ poz.):** `docs/ux/REJEST-UX-MASTER.md`  
> **Baseline PRZED redesignem:** `docs/ux/baseline/{A,B,C,D,E}/` (34 PNG — te same nazwy co docelowy `after/`)

**Ostatnia aktualizacja:** 2026-06-26 · Master Orkiestrator

---

## Jak czytać ten plik

| Sekcja | Kto | Co robi |
|--------|-----|---------|
| **Dyspozycje przychodzące** | Design czyta | Pełna lista tego, czego potrzebujemy do gry |
| **Status odpowiedzi** | Design + Maciej | Oznacz `done` / `defer` / `blocked` |
| **Dyspozycje wychodzące** | Design dopisuje | Co dostarczyłeś, co odkładasz |

**Reguła semantyki ikon 3C:** każda ikona = **konkretny przedmiot** z SPEC-IKONY. Przykład: Praca = **młotek**, Dyplomacja = **uścisk dłoni**, Nauka = **sowa z beretem**. **Zakaz emoji** jako final w grze.

---

# CZĘŚĆ A — PEŁNA LISTA DELIVERABLES (cała gra)

Poniżej **wszystko**, czego potrzebujemy od Design do v1.0 UX/UI. Oznaczenia: ✅ masz w 1E · 🟡 częściowo · ⬜ brak · 🔵 v1.1 (później)

---

## A1. Design System (fundament — blokuje resztę)

| ID | Deliverable | Pri | Status | Wymagania |
|----|-------------|-----|--------|-----------|
| DS-01 | **Tokeny kolorów** (paleta 1B) | P0 | 🟡 | Tło `#080a12`, akcent `#e8d88a`, panele pergamin, nauka `#5a9bd4`, błąd `#c84040`, sukces `#4a9e6a` → `eksport/tokens.css` + `tokens.json` |
| DS-02 | **Typografia** (2C) | P0 | 🟡 | Georgia: tytuły, nazwy miast, nagłówki · Segoe UI/sans: liczby, przyciski, chipy |
| DS-03 | **Spacing / radius / cienie** | P0 | 🟡 | Spójne odstępy 4/8/12/16/24; cień panelu premium (5C) |
| DS-04 | **Komponent: przycisk outline** (4C) | P0 | 🟡 | Przezroczyste tło + obrys złoty 2px; hover/active wypełnienie |
| DS-05 | **Komponent: ramka panelu** (5C) | P0 | 🟡 | Gruba obwódka złota 2px, cień, wyraźny nagłówek |
| DS-06 | **Komponent: chip HUD** (6C) | P0 | 🟡 | Ikona SVG + liczba + **etykieta tekstowa PL** (np. „Skarbiec”, „Badania”) |
| DS-07 | **Komponent: pasek dolny** (WYKONAJ / Koniec tury) | P0 | ⬜ | Outline + stany disabled/blocking |
| DS-08 | **Komponent: modal / overlay** | P0 | ⬜ | Ramka 5C + przyciski 4C + przyciemnienie tła |
| DS-09 | **Komponent: suwak / slider** | P1 | ⬜ | Handel, praca, podział pól — złoty track |
| DS-10 | **Komponent: karta listy** (miasto, cyw, jednostka) | P1 | ⬜ | Hover, selected, disabled |
| DS-11 | **Komponent: tooltip / dock** | P1 | ⬜ | Dock 280px (panel miasta hover) |
| DS-12 | **Komponent: pasek postępu** | P1 | ⬜ | Produkcja, morale, brama oblężenia |
| DS-13 | **Komponent: toast / hint** | P2 | ⬜ | Komunikat u góry mapy ~3s |
| DS-14 | **Komponent: zakładka rail** (panel miasta) | P1 | ⬜ | Aktywna = obrys złoty; ikona 40×40 |
| DS-15 | **Motion / stany** (hover, focus, loading) | P2 | ⬜ | Subtelne; generator krok 5 = animacja heksów |
| DS-16 | **Brand Book dokument** (PDF/HTML hub) | P0 | ✅ | Hub Przegląd (1E) + strony dokumentacji |
| DS-17 | **HANDOFF.md** dla lane UI | P0 | 🟡 | Mapowanie tokenów → pliki TS; lista ekranów PO; breaking changes |

---

## A2. Ikony SVG (decyzja 3C — pełna spec)

**Format:** SVG, viewBox kwadratowy, stroke line, fill none · rozmiary **24×24** i **40×40** · `currentColor`  
**Folder:** `eksport/icons/` · nazwy plików = ID z spec (np. `res-food.svg`, `res-food-40.svg`)

### Tier 1 — Zasoby imperium (9 ikon × 2 rozmiary = 18 plików)

| ID | Co narysować | Status |
|----|--------------|--------|
| `res-food` | Kromka chleba | 🟡 |
| `res-work` | Młotek | 🟡 |
| `res-treasury` | Sakiewka / moneta | 🟡 |
| `res-science` | Sowa z beretem (+ gałąź) | 🟡 |
| `res-culture` | Maski teatralne | 🟡 |
| `res-religion` | Świątynia / pagoda | 🟡 |
| `res-population` | Dwie sylwetki ludzi | 🟡 |
| `res-influence` | Lilia heraldyczna | 🟡 |
| `res-settlements` | Sylwetka miast (2–3 budynki) | 🟡 |

### Tier 2 — Toolbar mapy (5 ikon × 2 rozmiary)

| ID | Co narysować | Status |
|----|--------------|--------|
| `tb-cities` | Partenon / kolumny | 🟡 |
| `tb-science` | = instancja `res-science` | 🟡 |
| `tb-diplomacy` | **Uścisk dłoni** (REQ-003 — odrzuć pergamin+pióro) | 🟡 |
| `tb-army` | Skrzyżowane miecze | 🟡 |
| `tb-build` | = instancja `res-work` | 🟡 |

### Tier 3 — Rail panelu miasta (9 ikon × 2 rozmiary)

`cp-buildings`, `cp-recruit`, `cp-granary`, `cp-trade`, `cp-labor`, `cp-order` (waga), `cp-health` (kaduceusz), `cp-culture`, `cp-religion` — ⬜ pełny zestaw

### Tier 4 — Chipy pomocnicze (13 ikon, głównie 24px)

`chip-manpower`, `chip-order`, `chip-happiness`, `chip-garrison`, `chip-warning`, `chip-rebellion`, `chip-death`, `chip-heart`, `chip-grain`, `chip-crate`, `chip-map`, `chip-star`, `chip-trend-up` — ⬜

### Tier 5 — Dyplomacja + UI chrome (13 ikon)

`dip-alliance`, `dip-pact`, `dip-war`, `dip-war-strip`, `ui-menu`, `ui-close`, `ui-play`, `ui-pause`, `ui-end-turn`, `ui-check`, `ui-lock`, `ui-denied`, `ui-accepted` — ⬜

### Tier 6 — Presety pól okolicy (4 ikony)

`field-food`, `field-production`, `field-tax`, `field-balanced` — ⬜

### Tier 7 — Legenda terenu / minimapa (5 ikon)

`terrain-plains`, `terrain-hills`, `terrain-mountains`, `terrain-desert`, `terrain-water` — 🔵 niższy priorytet

**Reguła instancji:** `tb-build`, `cp-labor`, `field-production` = **ta sama geometria** co `res-work` (nie osobny rysunek).

---

## A3. Ekrany — Grupa E (Menu / Meta / Start) — 17 pozycji rejestru

| ID | Ekran | Pri | Status | Uwagi Design |
|----|-------|-----|--------|--------------|
| E-01 | **Menu główne** | P0 | 🟡 | Emblemat, wideo/tło, CTA outline, „Rozpocznij grę” |
| E-02 | Panel **Więcej** (dropdown) | P1 | ⬜ | Kontynuuj, Wczytaj, O grze, Wyjdź |
| E-03 | **Ustawienia** (6 suwaków) | P1 | ⬜ | Muzyka, efekty, grafika, język, skala UI, mgła |
| E-04 | Toast „Wkrótce” (Kampania/Multi) | P2 | ⬜ | Placeholder v1.0 |
| E-05 | Kontynuuj / Wczytaj | P2 | ⬜ | Brak pickera slotów — prosty flow |
| E-06 | **O grze** | P2 | ⬜ | Ekran About (obecnie stub) |
| E-07 | Wyjdź | P3 | ⬜ | Przycisk w menu |
| E-08 | Kreator krok 1 **Intro** | P0 | 🟡 | Pasek kroków: Intro·Epoka·Cyw·Ustawienia·Start |
| E-09 | Kreator krok 2 **Epoka** | P0 | 🟡 | Kamień / Brąz / Żelazo + badge liczby cyw |
| E-10 | Kreator krok 3 **Cywilizacja** | P0 | 🟡 | Siatka ikon 9 typów + panel bonusów |
| E-11 | Kreator krok 4 **Ustawienia** | P0 | 🟡 | Trudność, mapa, typ świata, prędkość, miasta-państwa, typy cyw |
| E-12 | Modal **Zaawansowane opcje** | P1 | ⬜ | Seed, gęstości, zwycięstwo, barbarzyńcy, mgła debug |
| E-13 | Kreator krok 5 **Generowanie** | P0 | 🟡 | Animacja heksów + podsumowanie → start mapy |
| E-14 | Nawigacja Wstecz/Dalej | P1 | ⬜ | Stany disabled, skok po ukończonych krokach |
| E-15 | **Game Over — zwycięstwo** | P0 | 🟡 | Złoty motyw, typ zwycięstwa, „Nowa gra” |
| E-15b | **Game Over — porażka** (REQ-002) | P0 | ⬜ | **Czerwony** `#c84040`, ten sam layout co wygrana |
| E-16 | Skróty playtest dev | P3 | 🔵 | Tylko dev — nie priorytet Design |
| E-20 | Cuda świata (mockup) | 🔵 | 🔵 | Po v1.0 |

**Baseline PNG (PRZED):** `E-01`, `E-03`, `E-09`, `E-10`, `E-11`, `E-15` → Design PO musi pasować do tych kadrów.

---

## A4. Ekrany — Grupa A (Mapa / HUD) — 30 pozycji

| ID | Ekran | Pri | Status |
|----|-------|-----|--------|
| A-01 | **HUD mapy** — pasek zasobów [A] | P0 | 🟡 |
| A-02 | **Toolbar lewy** | P0 | 🟡 |
| A-03 | **Dolny pasek** WYKONAJ / Koniec tury | P0 | 🟡 |
| A-04 | Panel wydarzeń — chipy [D] | P1 | ⬜ |
| A-05 | **Minimapa** | P1 | ⬜ |
| A-06 | **Panel jednostki** [H] | P1 | 🟡 |
| A-07 | Badge stosu armii | P2 | ⬜ |
| A-08 | Tryb budowy ulepszeń | P1 | ⬜ |
| A-09 | Lista miast | P1 | ⬜ |
| A-10 | Lista armii | P2 | ⬜ |
| A-11 | Lista dyplomacji HUD | P1 | ⬜ |
| A-12 | Overlay kultura / religia | P2 | ⬜ |
| A-13 | Overlay Power (Wpływ) | P1 | ⬜ |
| A-14 | Bilans imperium | P2 | ⬜ |
| A-15 | Tooltip jednostki | P2 | ⬜ |
| A-16 | **Pre-bitwa** (wejście z mapy) | P1 | 🟡 |
| A-17 | Panel oblężenia mapa | P1 | ⬜ |
| A-18 | Merge / split armii | P2 | ⬜ |
| A-19 | Powiadomienie zdobycia miasta | P2 | ⬜ |
| A-20 | Hint / toast | P2 | ⬜ |
| A-21 | Picker Miasto vs Jednostka | P2 | ⬜ |
| A-22 | Wybór oblężenie vs szturm | P1 | ⬜ |
| A-23 | Ghost budowy | P2 | ⬜ |
| A-24–25 | Warstwy zasięgu kultura/religia | P2 | ⬜ |
| A-26–27 | Chipy dyplomacji / modal blocking | P1 | ⬜ |
| A-28 | Hub badań (sowa toolbar) | P1 | ⬜ |
| A-29 | Menu ☰ z mapy | P1 | ⬜ |
| A-30 | Cuda placeholder | 🔵 | 🔵 |

**Baseline:** `A-01`, `A-02`, `A-03`, `A-04`, `A-06`, `A-08`, `A-11`, `A-16`

---

## A5. Ekrany — Grupa B (Panel miasta) — 31 głównych (B-01…B-31)

| ID | Ekran | Pri | Status |
|----|-------|-----|--------|
| B-01 | **Ramka panelu miasta** (layout Civ V) | P0 | 🟡 |
| B-02 | Pasek zasobów górny | P0 | 🟡 |
| B-03–B-11 | Karty szczegółów (👥⚔🍞🔨💰 nauka 🎭🛕 garnizon) | P1 | ⬜ |
| B-12 | Produkcja (lewa kolumna) | P0 | 🟡 |
| B-13 | Kolejka rekrutacji | P1 | ⬜ |
| B-14 | **Rail ikon zakładek** | P0 | 🟡 |
| B-15–B-16 | Budowa dostępne / w mieście | P0 | 🟡 |
| B-17 | Rekrutacja jednostek | P0 | 🟡 |
| B-18 | Spichlerz | P1 | ⬜ |
| B-19–B-20 | Handel + Wealth | P0 | 🟡 |
| B-21 | Podział pracy | P1 | ⬜ |
| B-22 | Porządek / społeczeństwo | P0 | 🟡 |
| B-23 | Zdrowie | P1 | ⬜ |
| B-24–B-25 | Kultura / Religia panel | P1 | ⬜ |
| B-26 | Okolica — pola | P0 | 🟡 |
| B-27 | Chrome mapy okolicy | P1 | ⬜ |
| B-28 | Surowce w okolicy | P1 | ⬜ |
| B-29–B-31 | Dock hover (budynki, jednostki, ℹ) | P1 | ⬜ |
| B-33–B-34 | Hub badań + **drzewko tech** (docked SVG) | P1 | 🟡 |

**Baseline:** `B-01`, `B-02`, `B-15`, `B-17`, `B-29`, `B-30`, `B-33`, `B-34`

---

## A6. Ekrany — Grupa D (Dyplomacja / Cyw) — 15 pozycji

| ID | Ekran | Pri | Status |
|----|-------|-----|--------|
| D-02 | Lista dyplomacji (toolbar 🤝) | P0 | 🟡 |
| D-03 | **Audiencja dyplomatyczna** (pełny ekran) | P0 | 🟡 |
| D-04 | Karty akcji audiencji (12) | P0 | 🟡 |
| D-05 | Modal potwierdzenia wojny | P1 | ⬜ |
| D-06 | Modal propozycji AI (blocking) | P1 | ⬜ |
| D-07 | Chip dyplomacji side panel | P1 | ⬜ |
| D-08 | Toasty dyplomacji | P2 | ⬜ |
| D-09 | Sekcja wojen obcych | P2 | ⬜ |
| D-10 | Game Over (cross E-15) | P0 | 🟡 |
| D-11–D-12 | Wybór cyw / klaster (cross kreator) | P0 | 🟡 |
| D-01 | Panel legacy (opcjonalnie) | P3 | ⬜ |

**Baseline:** `D-02`, `D-03`, `D-04`, `D-05`, `D-06`

---

## A7. Ekrany — Grupa C (Walka) — 21 pozycji w silniku

| ID | Ekran | Pri | Status |
|----|-------|-----|--------|
| C-01 | **Pre-bitwa Total War** | P0 | 🟡 |
| C-04 | Wybór oblężenie vs szturm | P1 | ⬜ |
| C-05 | Panel oblężenia mapa | P1 | ⬜ |
| C-06 | **Faza deploymentu** | P0 | 🟡 |
| C-07 | Pole bitwy 3D (tło UI) | P0 | 🟡 |
| C-08 | Górny pasek HUD bitwy | P0 | 🟡 |
| C-09 | Dolny pasek komend | P0 | 🟡 |
| C-10–C-14 | Prędkość, log, morale, paski HP, baner AUTO | P1 | ⬜ |
| C-15–C-16 | Panel jednostki + roster (tryb ręczny) | P1 | ⬜ |
| C-17 | Minimapa bitwy | P1 | ⬜ |
| C-18 | Tooltip jednostki | P2 | ⬜ |
| C-19–C-20 | HUD muru / brama oblężenia | P1 | 🟡 |
| C-21 | **Ekran końca bitwy** | P0 | 🟡 |
| C-22–C-23 | Baner flash + modal szczegółów | P2 | ⬜ |

**Baseline:** `C-01`, `C-06`, `C-07`, `C-08`, `C-09`, `C-19`, `C-21`

---

## A8. Hub nawigacji + prototyp

| ID | Deliverable | Pri | Status |
|----|-------------|-----|--------|
| HUB-01 | **Przegląd (1E).dc.html** — spis ekranów | P0 | ✅ |
| HUB-02 | Linki względne między wszystkimi ekranami | P0 | ✅ |
| HUB-03 | Kafelki: **Kreator — wszystkie kroki** | P1 | ⬜ REQ-005 |
| HUB-04 | Kafelki: **Walka — warianty** (pre, deploy, pole, koniec) | P1 | ⬜ REQ-005 |
| HUB-05 | Kafelek **Motion / stany** | P2 | ⬜ REQ-005 |
| HUB-06 | Prototyp klikalny (flow menu → gra) | P2 | ⬜ |

---

## A9. Eksport techniczny (obowiązkowy przy każdej iteracji)

| Plik | Zawartość |
|------|-----------|
| `eksport/tokens.css` | `:root` — wszystkie CSS variables |
| `eksport/tokens.json` | Ten sam zestaw dla TS / build |
| `eksport/HANDOFF.md` | Changelog · mapowanie ekran → plik TS · breaking changes |
| `eksport/icons/*.svg` | Pełna biblioteka wg postępu Tier 1–7 |
| `support.js` | Helper hubu (jeśli wymagany) |

**Nie eksportujemy:** logiki gry, JSON balansu, `main.ts`.

---

## A10. Świadomie PO v1.0 (nie blokują — 🔵)

- E-04 Kampania / Multiplayer (pełne ekrany)
- A-30 Cuda świata
- E-20 Mockup cudów
- D-13 UI barbarzyńców (brak panelu)
- D-14 Bonusy cyw w preBattle (cross)
- C-26–C-28 Mockupy armii (D7 odłożone)
- Tier 7 legenda terenu (minimapa)
- Brand Book PDF do druku
- Responsywność mobile / daltonizm (osobna decyzja)
- Pełne 34 ekrany baseline × warianty trudności

---

# CZĘŚĆ B — ETAPY PRACY DESIGN (co dostarczasz kiedy)

## ETAP D0 — ✅ Fundament 1E (zamknięty u Was)

Hub + dokumentacja + tokeny + komponenty bazowe + ekrany szkielet + 14 SVG core.

**Design:** utrzymuj spójność — każda nowa iteracja nadpisuje pliki w `brand-book-1E/`.

---

## ETAP D1 — 🔴 TERAZ (P0 — blokuje kod)

| # | Deliverable | DoD |
|---|-------------|-----|
| D1-1 | **REQ-003** — `tb-diplomacy` = uścisk dłoni wszędzie | Spójne w HUD, toolbar, bibliotece |
| D1-2 | **REQ-002** — E-15b ekran **porażki** | Layout = wygrana, akcent `#c84040` |
| D1-3 | **Tier 1 komplet** (9×2 SVG) | Wszystkie w `eksport/icons/` |
| D1-4 | **Tier 2 komplet** (5×2 SVG) | W tym poprawiony dyplomacja |
| D1-5 | **E-01, E-08…E-13, E-15** — wersje PO final | Zgodne z decyzjami 1B–6C |
| D1-6 | **HANDOFF.md** v2 | Lista plików + mapowanie do `mainMenu.ts`, `newGameFlow.ts` |
| D1-7 | **tokens.css/json** — freeze v1 | Lane UI może wpiąć bez zgadywania |

**Po D1:** lane UI wdraża **Etap W1** w kodzie (patrz roadmap Macieja).

---

## ETAP D2 — HUD + pierwsze mapy (P1)

- Tier 3 rail (9 ikon)
- A-01…A-03, A-05, A-11, A-13 — ekrany PO
- Tier 4 chipy (min. `chip-warning`, `chip-garrison`, `chip-manpower`)

**Po D2:** Etap W2 w kodzie (HUD mapy).

---

## ETAP D3 — Panel miasta (P1 — największy UI)

- B-01 ramka + B-02 pasek + B-14 rail
- Zakładki: budowa, rekrut, handel/wealth, porządek
- B-26 okolica + docki hover
- B-33–B-34 drzewko tech (docked)

**Po D3:** Etap W3 w kodzie.

---

## ETAP D4 — Dyplomacja (P1)

- D-02, D-03, D-04, D-05, D-06 PO
- Tier 5 dyplomacja (`dip-*`, `ui-*`)
- Koszyk handlu/daru (cross P4 — jeśli osobny ekran)

**Po D4:** Etap W4 w kodzie.

---

## ETAP D5 — Walka (P1)

- C-01 pre-bitwa, C-06 deploy, C-07–C-09 HUD bitwy
- C-19 oblężenie mur, C-21 koniec bitwy
- REQ-005 hub — warianty walki

**Po D5:** Etap W5 w kodzie.

---

## ETAP D6 — Domknięcie v1.0 UX (P2)

- Pozostałe A/B/C/D/E z rejestru
- Tier 4–6 reszta ikon
- HUB-03…HUB-06
- Porównanie PO vs baseline (34 pary PNG opisane w HANDOFF)

---

# CZĘŚĆ C — DYSPOZYCJE PRZYCHODZĄCE (skrót aktywny)

| ID | Pri | Status | Tekst |
|----|-----|--------|-------|
| **D1-1** | P0 | open | REQ-003 dyplomacja = uścisk dłoni |
| **D1-2** | P0 | open | REQ-002 E-15b porażka |
| **D1-3** | P0 | open | Tier 1+2 SVG komplet do `eksport/icons/` |
| **D1-4** | P0 | open | Freeze tokenów v1 + HANDOFF v2 |
| **D1-5** | P0 | open | Ekrany E final (menu + kreator + game over win) |
| REQ-004 | P2 | open | Tier 3–5 SVG (wg ETAP D2–D4) |
| REQ-005 | P2 | open | Hub kafelki Kreator / Walka / Motion |

---

# CZĘŚĆ D — STATUS ODPOWIEDZI (Design + Maciej — uzupełniajcie)

| Temat | Status | Uwagi |
|-------|--------|-------|
| Brand Book 1E hub | ✅ | Linki względne OK |
| Tokeny eksport | 🟡 | Czeka freeze D1-4 |
| Ikony 14 SVG | 🟡 | Czeka Tier 1–2 komplet D1-3 |
| E-15 porażka | ⬜ | D1-2 |
| Dyplomacja ikona | ⬜ | D1-1 |
| Ekrany E PO | 🟡 | D1-5 |
| Ekrany A–D–C PO | ⬜ | D2–D5 |

---

# CZĘŚĆ E — DYSPOZYCJE WYCHODZĄCE (Design dopisuje)

| Data | Kto | Co |
|------|-----|-----|
| | | |

---

# CZĘŚĆ F — SESJA AUTONOMICZNA (Maciej offline)

> **Start:** 2026-06-26 · **Maciej wraca za ~2h** · agenci działają bez ABC/playtestu.

| Kto | Co robi teraz | Status |
|-----|----------------|--------|
| **Claude Design** | ETAP **D1** (REQ-003, REQ-002, Tier 1–2 SVG, HANDOFF v2) → zapis w `brand-book-1E/` | 🟡 czeka pliki w repo |
| **Lane UI** | **W1-PREP** — tokeny + outline 4C w menu/kreator · `iconRegistry.ts` | ✅ kod (handoff poniżej) |
| **Integrator F** | IDLE — czeka handoff game over po Design D1 | ⏸ |
| **Master** | Orkiestracja · brak kanonu bez Macieja playtest | 🔵 |

**Handoff UI:** `dyspozycje/_handoff/UI-do-MASTER_warstwa1-w1-prep-2026-06-26.md`

**Po powrocie Macieja:** wrzucić folder Design (jeśli jeszcze nie) → **`brand book w repo`** → playtest menu/kreator → `playtest OK` / `BUG:`

**Hasło Macieja `plot code`:** Master/lane czyta dyspozycje → kod → na czacie **`✅ Gotowe:`** / **`⏸️ Czeka:`** ([`docs/obieg/PLOT-CODE-WORKFLOW.md`](../../../../obieg/PLOT-CODE-WORKFLOW.md))

---

*Master · sesja autonomiczna*
