# PACZKA 2 — Claude Design (D2 HUD + start D3 miasto)

> **Kiedy:** po zamknięciu **PACZKI 1 / ETAP D1** (lub równolegle jeśli D1 już ✅)  
> **Czas orientacyjny:** 3–5 h sesji autonomicznej  
> **Zapis:** tylko `brand-book/` + `eksport/` · log WYMIANA na koniec (BEZ GitHub)  
> **Poprzednia paczka:** [`SESJA-AUTONOMICZNA-2H.md`](SESJA-AUTONOMICZNA-2H.md) (D1)

**Spec ikon:** `00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md`  
**Baseline układów:** `docs/ux/baseline/{A,B}/`  
**Mapowanie kodu:** `eksport/HANDOFF.md` (dopisz sekcję PACZKA 2)

---

## Warunek startu

- [ ] D1-7 done: `tokens.css/json` freeze v1 w `eksport/`
- [ ] Tier 1+2 SVG komplet w `eksport/icons/`
- [ ] REQ-002 E-15b + REQ-003 dyplomacja ✅

Jeśli D1 nie domknięte — **najpierw dokończ D1**, potem ta paczka.

---

# BLOK A — D2 HUD mapa (P0)

## A1. Komponenty Design System (strony demo HTML)

Każdy komponent = osobna strona w `brand-book/` + wpis w hubie.

| ID | Plik demo (propozycja) | DoD |
|----|------------------------|-----|
| DS-07 | `komponent-dolny-pasek.html` | WYKONAJ + Koniec tury · normal / hover / disabled / blocking-turn |
| DS-08 | `komponent-modal.html` | Overlay `rgba(8,10,18,0.88)` · panel 5C · przyciski 4C · zamknij |
| DS-09 | `komponent-suwak.html` | Track złoty · uchwyt · disabled · wartość numeryczna obok |
| DS-06 | `komponent-chipy-6C.html` | Wszystkie Tier 1 @ 24px + **etykiety PL** (Żywność, Praca, Skarbiec…) |
| DS-14 | `komponent-rail-zakladka.html` | 40×40 · idle / active (obrys złoty) / disabled |

- [ ] 5 stron demo · spójne z `tokens.css`
- [ ] Linki z huba + powrót do huba

## A2. Tier 3 — rail panelu miasta (18 SVG)

Folder: `eksport/icons/` · reguła **instancji** z SPEC (nie duplikuj geometrii).

| ID | 24px | 40px | Źródło geometrii |
|----|------|------|------------------|
| `cp-buildings` | ✓ | ✓ | = `tb-cities` |
| `cp-recruit` | ✓ | ✓ | = `tb-army` |
| `cp-granary` | ✓ | ✓ | = `res-food` |
| `cp-trade` | ✓ | ✓ | = `res-treasury` |
| `cp-labor` | ✓ | ✓ | = `res-work` |
| `cp-order` | ✓ | ✓ | **NOWY:** waga sprawiedliwości |
| `cp-health` | ✓ | ✓ | **NOWY:** kaduceusz |
| `cp-culture` | ✓ | ✓ | = `res-culture` |
| `cp-religion` | ✓ | ✓ | = `res-religion` |

- [ ] 18 plików · strona podglądu `ikon-rail-miasta.html` (pionowy rail 9 przycisków)

## A3. Ekrany Grupa A — HTML PO (8 ekranów baseline)

Tło `#080a12` · 1920×1080 layout · **chipy 6C** na A-01.

| ID | Plik HTML (propozycja) | Kluczowe elementy |
|----|------------------------|-------------------|
| A-01 | `A-01-hud-mapa.html` | Górny pasek: wszystkie Tier 1 + etykiety PL + liczby przykładowe |
| A-02 | `A-02-toolbar-lewy.html` | 5 ikon Tier 2 @ 40px · tooltip · active state |
| A-03 | `A-03-dolny-pasek.html` | DS-07 · WYKONAJ prominent · Koniec tury secondary |
| A-04 | `A-04-panel-wydarzen.html` | Chipy [D] · scroll · panel 5C |
| A-06 | `A-06-panel-jednostki.html` | Panel boczny [H] · stats · akcje outline |
| A-08 | `A-08-tryb-budowy.html` | Ghost hex hint · toolbar build aktywny |
| A-11 | `A-11-lista-dyplomacji-hud.html` | Lista cyw · **uścisk dłoni** w nagłówku · relacje |
| A-16 | `A-16-pre-bitwa.html` | Wejście z mapy · dwie strony · CTA outline |

- [ ] 8 plików HTML
- [ ] Opcjonalnie eksport PNG do `docs/ux/pipeline/02-po-design/grupa-A/` (jeśli masz render) — **nie wymagane**, wystarczy HTML

## A4. Ekrany A — P1 (jeśli starczy czas w bloku A)

| ID | Ekran |
|----|-------|
| A-05 | Minimapa — ramka 5C, viewport, warstwy |
| A-13 | Overlay Power (Wpływ) — warstwa mapy + legenda |
| A-17 | Panel oblężenia na mapie |
| A-26 | Chip dyplomacji w side panel |
| A-28 | Hub badań (sowa w toolbarze) |
| A-29 | Menu ☰ z mapy (powrót do meta) |

## A5. REQ-005 — Hub Przegląd (rozbudowa)

- [ ] Sekcja **„HUD i mapa (A)”** — kafelki do A-01…A-16
- [ ] Sekcja **„Komponenty DS”** — kafelki DS-06…DS-09, DS-14
- [ ] Sekcja **„Ikony — biblioteka”** — grid `eksport/icons/` z filtrem Tier 1/2/3
- [ ] Sekcja **„Kreator (E)”** — linki E-08…E-13 (jeśli jeszcze brak)
- [ ] Każdy ekran: **← Powrót do Przeglądu** · zero martwych linków

---

# BLOK B — D3 Panel miasta (P0 start)

## B1. Layout ramka Civ V (B-01 + B-02 + B-14)

| ID | Plik HTML | DoD |
|----|-----------|-----|
| B-01 | `B-01-ramka-panelu-miasta.html` | Layout 5C: góra zasoby · środek treść · dół rail · tło pergamin |
| B-02 | `B-02-pasek-zasobow-miasta.html` | Chipy 6C lokalne (żywność, praca, ludność…) · ten sam styl co HUD |
| B-14 | `B-14-rail-zakladek.html` | 9 ikon Tier 3 pionowo · active = złoty obrys |

- [ ] B-01 zawiera embed B-02 + B-14 (jeden ekran referencyjny)

## B2. Zakładki panelu — ekrany główne (baseline 8 z pipeline)

| ID | Plik HTML | Zawartość |
|----|-----------|-----------|
| B-15 | `B-15-budowa-dostepne.html` | Lista budynków · karty · koszt · outline CTA |
| B-17 | `B-17-rekrutacja.html` | Jednostki · kolejka · pasek postępu DS-12 |
| B-19 | `B-19-handel-wealth.html` | Suwaki DS-09 · podział handlu |
| B-22 | `B-22-porzadek-spoleczenstwo.html` | Wskaźniki · ikona waga `cp-order` |
| B-26 | `B-26-okolica-pola.html` | Presety pól · hex okolicy |
| B-29 | `B-29-dock-hover-budynki.html` | Dock 280px DS-11 · tooltip budynku |
| B-30 | `B-30-dock-hover-jednostki.html` | Mini podgląd jednostki w docku |
| B-33 | `B-33-hub-nauki.html` | Sowa · postęp epoki · link do drzewka |
| B-34 | `B-34-drzewko-nauki-docked.html` | Panel docked · SVG drzewko · węzły tech |

- [ ] Minimum **6/8** z listy pipeline (B-01, B-02, B-15, B-17, B-29, B-30, B-33, B-34)
- [ ] Rail przełącza zakładki w prototypie (JS w `support.js` OK)

## B3. Tier 4 — chipy pomocnicze (min. 8/13)

Priorytet dla panelu miasta i HUD:

- [ ] `chip-manpower` · `chip-order` · `chip-happiness` · `chip-garrison`
- [ ] `chip-warning` · `chip-rebellion` · `chip-grain` · `chip-crate`

Pozostałe 5 defer: `chip-death`, `chip-heart`, `chip-map`, `chip-star`, `chip-trend-up`

## B4. Tier 6 — presety pól okolicy (4 SVG)

- [ ] `field-food` (= res-food) · `field-production` (= res-work)
- [ ] `field-tax` · `field-balanced` — unikalne proste symbole

---

# BLOK C — Grupa E uzupełnienie (P1)

Jeśli D1 nie objął:

- [ ] **E-02** Panel Więcej (dropdown menu)
- [ ] **E-03** Ustawienia — 6 suwaków (użyj DS-09)
- [ ] **E-12** Modal zaawansowane opcje kreatora
- [ ] **E-06** O grze (About) — stub premium

---

# BLOK D — Eksport + HANDOFF (obowiązkowe na koniec paczki)

- [ ] **`eksport/HANDOFF.md`** — sekcja **PACZKA 2**:
  - Nowe pliki HTML (lista A + B + DS)
  - Nowe SVG Tier 3 + Tier 4 + Tier 6
  - Mapowanie → pliki TS lane UI:
    - `hud.ts`, `bottomBarHud.ts`, `mapToolbarHud.ts`
    - `cityPanel.ts`, `cityUxFrame.ts`, `hoverDetailDock.ts`
    - `scienceHubHud.ts`, `sciencePicker.ts`
  - Tokeny: czy zmieniono coś w `tokens.css` (jeśli nie — napisz „bez zmian v1")
- [ ] **`eksport/icons/manifest.json`** (NOWY, opcjonalny) — ID → plik → tier → instancja_of
- [ ] Commit: `design(paczka2): D2 HUD A-screens, tier3 rail, B-panel start, DS-07-09`
- [ ] WYMIANA log: **`PACZKA 2 GOTOWE`** lub **`PACZKA 2 częściowo: …`**
- [ ] DYSPOZYCJA CZĘŚĆ E — raport końcowy

---

# BLOK E — NIE RÓB w tej paczce (defer PACZKA 3)

- Tier 5 dyplomacja (`dip-*`, `ui-*`) — paczka D4
- Ekrany C walka (C-01…) — paczka D5
- Ekrany D audiencja pełna (D-03…) — paczka D4
- Tier 7 legenda terenu
- PDF brand book · mobile · daltonizm
- Zmiana decyzji 1B–8A

---

# PROMPT WKLEJKA — PACZKA 2

```
START — PACZKA 2 (D2 HUD + start D3 miasto)

Maciej offline / autonomicznie. Bez ABC. Bez playtestu.

Warunek: D1 domknięte (tokens freeze, tier1-2, E-15b, dyplomacja handshake).
Jeśli D1 nie done — najpierw dokończ SESJA-AUTONOMICZNA-2H.md.

Czytam:
- brand-book/PACZKA-2-D2-D3-HUD-MIASTO.md (BLOK A→E)
- eksport/HANDOFF.md · tokens.css · SPEC-IKONY.md
- baseline A/ i B/ (układ referencyjny)

Zapis TYLKO: brand-book/ + eksport/

Kolejność:
A) DS-07/08/09/06/14 + Tier 3 (18 SVG) + 8 ekranów A HTML + hub sekcje
B) B-01 ramka + rail + min. 6 ekranów B baseline + Tier 4 (8) + Tier 6 (4)
C) E-02/E-03 jeśli brak z D1
D) HANDOFF PACZKA 2 + log WYMIANA (zapis w brand-book/)

Decyzje: 1B–8A. Chipy 6C = ikona + liczba + etykieta PL. Zero emoji.
Koniec: raport CZĘŚĆ E + log WYMIANA „PACZKA 2 GOTOWE".
```

---

# Raport końcowy (szablon)

```markdown
## PACZKA 2 — raport [DATA]

**A (D2):** DS demo __/5 · Tier3 __/18 · ekrany A __/8 · hub sekcje tak/nie
**B (D3):** B-01 tak/nie · ekrany B __/8 · Tier4 __/8 · Tier6 __/4
**C (E):** E-02/03/12/06 — done/defer
**Commit:** …
**Lane UI:** może start W2 (HUD) + W3 prep (panel)
**Defer → PACZKA 3:** …
```
