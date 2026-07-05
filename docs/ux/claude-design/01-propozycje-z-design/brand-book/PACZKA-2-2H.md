# PACZKA 2 — sesja ~2 h (Claude Design)

> **Czas:** ~2 h · **bez ABC** · **bez playtestu**  
> **Po:** PACZKA 1 / D1 done (tokeny freeze, tier1-2, E-15b, handshake)  
> **Zapis:** tylko `brand-book/` + `eksport/` · log WYMIANA na koniec (BEZ GitHub)  
> **Pełna wersja (3–5 h):** [`PACZKA-2-D2-D3-HUD-MIASTO.md`](PACZKA-2-D2-D3-HUD-MIASTO.md)

---

## Plan czasu (2 h)

| Min | Blok | Cel |
|-----|------|-----|
| 0–25 | **1** | DS-07 dolny pasek + DS-08 modal |
| 25–55 | **2** | Tier 3 rail — **9×24px** (40px defer) |
| 55–95 | **3** | **4 ekrany A** HTML (A-01, A-02, A-03, A-11) |
| 95–110 | **4** | B-01 szkielet ramki + rail (bez wszystkich zakładek) |
| 110–120 | **5** | HANDOFF krótki + log WYMIANA + raport |

**Jeśli jesteś szybszy:** dodaj A-16 pre-bitwa (blok 3+) · Tier 3 @40px · DS-06 chipy demo.

**Jeśli wolniej:** pomiń blok 4 · w HANDOFF napisz defer.

---

# BLOK 1 (~25 min) — 2 komponenty DS

- [ ] **`komponent-dolny-pasek.html`** (DS-07)  
  WYKONAJ (primary outline) · Koniec tury (secondary) · disabled · blocking (szary, nie klika)  
  Użyj tokenów z `eksport/tokens.css`

- [ ] **`komponent-modal.html`** (DS-08)  
  Tło `rgba(8,10,18,0.88)` · panel 5C · tytuł Georgia · 2× przycisk 4C · X zamknij  

- [ ] Link z huba „Komponenty" + powrót

**DoD:** 2 strony otwierają się · spójne z menu E-01.

---

# BLOK 2 (~30 min) — Tier 3 @24px (9 plików)

Tylko **24px** w tej sesji. Instancje = **kopiuj SVG** z Tier 1/2 (nie rysuj od nowa).

| Plik | Skąd skopiować |
|------|----------------|
| `cp-buildings.svg` | `tb-cities.svg` |
| `cp-recruit.svg` | `tb-army.svg` |
| `cp-granary.svg` | `res-food.svg` |
| `cp-trade.svg` | `res-treasury.svg` |
| `cp-labor.svg` | `res-work.svg` |
| `cp-culture.svg` | `res-culture.svg` |
| `cp-religion.svg` | `res-religion.svg` |
| `cp-order.svg` | **NOWY** — waga (2 misy + belka) |
| `cp-health.svg` | **NOWY** — kaduceusz |

- [ ] 9 plików w `eksport/icons/`
- [ ] Strona **`ikon-rail-miasta.html`** — pionowy pasek 9 przycisków, active = złoty obrys

**Defer tej sesji:** wszystkie `-40.svg` Tier 3 (→ następna sesja)

---

# BLOK 3 (~40 min) — 4 ekrany HUD Grupa A

Tło `#080a12` · layout 1920×1080 · chipy **6C** (ikona + liczba + etykieta PL).

| # | Plik | Must-have |
|---|------|-----------|
| 1 | `A-01-hud-mapa.html` | Górny pasek: **wszystkie Tier 1** + przykładowe liczby + etykiety PL |
| 2 | `A-02-toolbar-lewy.html` | 5 ikon Tier 2 @40px · jedna **active** (złoto) |
| 3 | `A-03-dolny-pasek.html` | Osadź DS-07 · przykładowy stan „WYKONAJ" |
| 4 | `A-11-lista-dyplomacji-hud.html` | Lista 3–4 cyw · nagłówek z **uścisk dłoni** · panel 5C |

- [ ] 4 pliki HTML
- [ ] Każdy: link **← Przegląd (1E)**
- [ ] Hub: nowa sekcja **„HUD mapa (4)"** z 4 kafelkami

**Bonus jeśli zostanie ~15 min:** `A-16-pre-bitwa.html` (2 armie + CTA outline)

**Defer:** A-04, A-06, A-08, A-05 minimapa → PACZKA 3

---

# BLOK 4 (~15 min) — start panelu miasta (szkielet)

Jeden plik — **bez** pełnych zakładek B-15…B-34.

- [ ] **`B-01-ramka-panelu-miasta.html`**
  - Góra: pasek chipów 6C (jak A-01, węższy)
  - Lewo: **rail Tier 3** (z bloku 2) · 1 zakładka active
  - Środek: placeholder „Treść zakładki — Budowa" (tekst, bez pełnej listy)
  - Ramka 5C · tło pergamin z tokenów

**Defer:** B-15, B-17, B-29, docki, drzewko → PACZKA 3

---

# BLOK 5 (~10 min) — zamknięcie sesji

- [ ] **`eksport/HANDOFF.md`** — dopisz sekcję **„Sesja 2h PACZKA 2"**:
  - Lista nowych plików (2 DS + 9 SVG + 4–5 A + 1 B)
  - Mapowanie: A-01→`hud.ts` · A-02→`mapToolbarHud.ts` · A-03→`bottomBarHud.ts` · A-11→`diploListHud.ts` · B-01→`cityPanel.ts`/`cityUxFrame.ts`
  - Defer: Tier3-40px, pozostałe A, pełne B
- [ ] **`DYSPOZYCJA.md` CZĘŚĆ E** — 5 linii raportu
- [ ] **`WYMIANA-UI-DESIGN.md` log:** `PACZKA 2 blok N done` lub `częściowo: …`
- [ ] **Zapis w `brand-book/`** — BEZ GitHub

---

# NIE RÓB w tej 2h sesji

- Tier 3 @40px · Tier 4/5/6 · pełne 8 ekranów A · pełne B-15…B-34  
- E-02/E-03 · walka C · dyplomacja D · zmiana tokenów v1 (chyba że bugfix)  
- PDF · mobile · nowe decyzje ABC

---

# PROMPT WKLEJKA (~2 h)

```
START — PACZKA 2 · SESJA 2h

Czytam: brand-book/PACZKA-2-2H.md
Warunek: D1 done (tokens + tier1-2 + E-15b + handshake).

Realizuję BLOKI 1→5 wg planu czasu (~2h).
Zapis tylko brand-book/ + eksport/.
Decyzje 1B–8A · chipy 6C · zero emoji.

Koniec: HANDOFF sekcja „Sesja 2h" + log WYMIANA.
```

---

# Raport (wklej w CZĘŚĆ E)

```
PACZKA 2 (2h) — [DATA]
Blok 1 DS: __/2 · Tier3 24px: __/9 · Ekrany A: __/4 (+bonus __) · B-01: tak/nie
Zapis: brand-book/ (BEZ GitHub)
Defer → PACZKA 3: tier3-40, A-04/06/08/16, B-15+, hub pełny
```
