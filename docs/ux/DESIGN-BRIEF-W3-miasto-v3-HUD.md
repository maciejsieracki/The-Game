# Design Brief — W3 miasto v3 · HUD pełnego ekranu (sync z kanonem)

**Od:** Maciej / MASTER  
**Do:** Design (Claude Design · styl 1E)  
**Data:** 2026-07-03  
**Hasło:** `START — W3-miasto-v3-delta`  
**Priorytet:** P0 — **HUD miasta** (nie bitwa · nie C-06)

---

## Cel

**Kod miasta w kanonie = źródło prawdy.** Stare mockupy (9 rail, okolica tylko w panelu, brak Mapa/Esc) są **NIEAKTUALNE**.

Potrzebny **jeden plik v3** — pełny ekran 1920×1080 (lub kilka klatek w jednym `.dc.html`): **HUD miasta W3** dokładnie jak w grze dziś + polish 1E tam, gdzie gra ma „prototyp”.

**Deliverable:** `docs/ux/claude-design/The Game - Ekran Miasto W3 v3 (1E).dc.html`  
**Handoff zwrotny:** `docs/ux/claude-design/DESIGN-do-UI_miasto-w3-v3.md`

---

## Jak zobaczyć stan gry (OBOWIĄZKOWE przed rysowaniem)

| Sposób | Ścieżka |
|--------|---------|
| **Kanon (główne)** | `gra-kanon/START.html` → Ctrl+F5 → nowa gra → **klik miasto** |
| **Playtest miasto** | `Gra-podglad-PLAYTEST-MIASTO.html` (Ctrl+F5) |

**Przejdź te ścieżki w grze:**
1. Panel otwarty · rail **Budowa** (lewy) · panel parametrów **Spichlerz** (prawy)
2. Stopka panelu · przycisk **🗺 Mapa** · hint **Esc**
3. Widok mapy 3D · **Wróć na mapę** (środek-dół) · tabliczka miasta · toolbar **okolica** (centrum-dół)
4. Overlay zasięgu pól (jeśli widać)
5. **Esc** → powrót na mapę świata

**Screenshoty (opcjonalnie Macieja):** `docs/ux/referencje-miasto-kanon-2026-07-03/` — jeśli folder pusty, **playtest kanonu wystarczy**.

---

## Co MUSI być w v3 (sync z kodem)

### Układ W3 — **NIE 9 rail po lewej**

| Stary mockup (❌) | Kanon (✅) |
|-------------------|------------|
| 9 medalionów w jednym railu lewo | **2 lewo** (Budowa, Rekrutacja) + **7 prawo** (parametry miasta) |
| Dim pełna nieprzezroczystość — mapy nie widać | **Mapa 3D widoczna** · winieta / dim **przezroczysty** |
| Okolica tylko siatka w panelu | Okolica na **mapie 3D** + toolbar profili **centrum-dół** |
| Brak wyjścia | **Mapa** (stopka) · **Wróć na mapę** · **Esc** |

### Lewy rail (2 ikony)

| Ikona | ID brand | Panel |
|-------|----------|-------|
| Budowa | `cp-buildings` | lista budowli + produkcja |
| Rekrutacja | `cp-recruit` | jednostki |

### Prawy rail (7 ikon — parametry miasta)

| # | Ikona | ID | Tytuł panelu |
|---|-------|-----|--------------|
| 1 | Spichlerz | `cp-granary` | Wzrost ludności / magazyn |
| 2 | Handel | `cp-trade` | Podział handlu |
| 3 | Praca | `cp-labor` | Podział pracy |
| 4 | Porządek | `cp-order` | Społeczeństwo |
| 5 | Zdrowie | `cp-health` | Zdrowie |
| 6 | Kultura | `cp-culture` | Kultura |
| 7 | Religia | `cp-religion` | Religia |

Medalion **46px** · aktywny = złota obwódka · SVG z `brand-book/` (zero emoji).

### Górny pasek (imperium)

- Chip **nazwa miasta + poziom** (lewo)
- Pasek **zasobów imperium** (środek): Żywność, Produkcja, Złoto, Nauka…
- **Wiki** + **X (Esc)** (prawo) — poza panelem miasta na mapie świata; w mockupie pełnego ekranu miasta: pokaż jak w kanonie

### Chrome mapy 3D (B-27)

| Element | Opis wizualny |
|---------|---------------|
| `#cs-mapbtn` | Stopka lewego panelu: **🗺 Mapa** |
| `#civ-v-map-close` | Przycisk **Wróć na mapę** — środek-dół, na tle mapy |
| `.civ-v-map-plaque` | Tabliczka: nazwa miasta + hint scroll/👤 |
| Hint Esc | title / mały tekst przy przyciskach zamknięcia |

### Okolica na mapie (B-28)

- Toolbar **centrum-dół** na mapie (profile pól: Łąka, Równina…)
- Hint trybu auto/ręczny (mały tekst)
- Overlay zasięgu — opcjonalna **osobna klatka** w pliku v3

### Polish W4 (już w grze — odwzoruj w mockupie)

- Chipy **bez `/t`** w stopce surowców
- Ikony lokalne: **Bydło, Glina, Koń, Sól** (SVG brand, nie emoji)
- Tytuł panelu + **„i szczegóły”** (jak W4 v2)
- Suwaki / pigułki handlu — styl z **`Miasto Zakładki W4 v2 (1E).dc.html`**

---

## Klatki w pliku v3 (min. 4)

| # | Nazwa klatki | Co pokazać |
|---|--------------|------------|
| K1 | **Panel pełny · Budowa** | mapa widoczna · 2+7 rail · lewy dock budowa · stopka Mapa |
| K2 | **Panel · Spichlerz** | prawy rail aktywny · chipy W4 · stopka surowców |
| K3 | **Mapa 3D · chrome** | Wróć na mapę · tabliczka · toolbar okolica |
| K4 | **Wyjście Esc** | stan po Esc — HUD mapy świata (skrót) |

Możesz dodać K5: overlay zasięgu · K6: Handel ze suwakami.

---

## Co NIE ruszać (archiwum)

| Plik | Powód |
|------|-------|
| `The Game - Ekran Miasto W3 (1E).dc.html` | 9 rail · brak mapy |
| `START-W3-miasto-1E.md` | checklist nieaktualny |
| `The Game - Ekran Miasto (1E).dc.html` | sprzed W3 |

**W4 v2 zakładki:** czytaj jako referencję polish paneli — **nie edytuj** jako deliverable; merge do v3.

---

## Styl 1E

- Tokeny: `docs/ux/pakiet-design-W3-v2/styl-1E/tokens.css`
- Ikony: `docs/ux/claude-design/brand-book/` (cp-*, res-*)
- Zero emoji · line SVG · typografia Georgia + Segoe UI jak reszta 1E

---

## DoD Design

- [ ] Nowy plik **`Ekran Miasto W3 v3 (1E).dc.html`** (1920×1080, min. 4 klatki)
- [ ] Layout **2+7 rail** · mapa widoczna · chrome B-27/B-28
- [ ] Polish paneli spójny z W4 v2 (chipy, suwaki, stopka surowców)
- [ ] Porównanie z playtestem kanonu — brak elementów sprzed delty
- [ ] `DESIGN-do-UI_miasto-w3-v3.md` — lista klatek + co ewentualnie polish w CSS (Lane później)

**Po v3:** Lane UI **porównuje** mockup z kanonem — tylko **CSS polish**, bez zmiany logiki.

---

## Delta techniczna (Lane — nie Design)

`dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`  
Audyt: `dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`
