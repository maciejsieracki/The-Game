# Design Brief — W3 miasto v3.2 · delta playtest (2026-07-04)

**Od:** Maciej / MASTER  
**Do:** Design (Claude Design · styl 1E)  
**Data:** 2026-07-04  
**Hasło:** `START — W3-miasto-v3.2-delta`  
**Priorytet:** P0 — **HUD miasta** (sync z kodem roboczym po playteście Macieja)

---

## Cel

**Kod w `gra-robocza/` = źródło prawdy.** Playtest Macieja (2026-07-04): **OK funkcjonalnie** — Designer nadgania mockup v3 / v3.1 do **stanu roboczego**, nie odwrotnie.

To **delta** względem `DESIGN-BRIEF-W3-miasto-v3-HUD.md` i review v3.1 — nie przepisujemy całego briefu, tylko **co się zmieniło w grze**.

**Deliverable:** zaktualizowany plik  
`docs/ux/claude-design/The Game - Ekran Miasto W3 v3.2 (1E).dc.html`  
(opcjonalnie merge do istniejącego v3 + v3.1 klatek)

**Handoff zwrotny:** `docs/ux/claude-design/DESIGN-do-UI_miasto-w3.2-delta.md`

---

## Playtest OBOWIĄZKOWY (przed rysowaniem)

| Sposób | Ścieżka |
|--------|---------|
| **Robocza (główne)** | `gra-robocza/START.html` → **Ctrl+F5** → nowa gra → **klik miasto (RZYM)** |
| Kanon (referencja stara) | `gra-kanon/START.html` — **NIE** źródło tej delty |

**Przejdź w grze:**
1. Panel miasta · rail Budowa / Spichlerz · stopka surowców na dole kolumny
2. **🗺 Mapa** → widok 3D okolicy
3. Toolbar okolica (dół) · klik heks 👤
4. **Wróć na mapę** (góra) · **Esc**
5. Mapa świata — badge miasta (nazwa + populacja)

**Screenshoty Macieja (opcjonalnie):**  
`docs/ux/referencje-miasto-playtest-2026-07-04/` — jeśli pusty, playtest wystarczy.

---

## Co NOWEGO w v3.2 (sync z kodem)

### 1. Górny pasek w widoku miasta (P0-2 chrome)

| Element | Mapa świata | **Widok miasta** |
|---------|-------------|------------------|
| Chip imperium (nazwa, Moc) | ✅ widoczny | ❌ **ukryty** |
| Epoka „Epoka N” | ✅ widoczna | ❌ **ukryta** |
| Osiedla x/99 | ❌ usunięte globalnie | — |
| **Wiki + Menu** | ✅ góra-prawo | ✅ **zostają** góra-prawo |
| Pasek zasobów miasta | — | ✅ badge **NAZWA + populacja** (złote kółko) |

**Layout:** prawy rail / chipy miasta **nie wchodzą pod Wiki/Menu** — `padding-right: max(210px, 13vw)` na `.civ-ux-top`.

### 2. Mapa 3D miasta (B-27 delta)

| Stary mockup v3 (❌) | Kod v3.2 (✅) |
|----------------------|---------------|
| Tabliczka `.civ-v-map-plaque` z nazwą na środku mapy | **Usunięta** — nazwa tylko u góry (badge) |
| „Wróć na mapę” środek-dół, blokuje heksy | Przycisk **góra** (`top: ~92px`), lewa strona · kontener **pointer-events: none** (heksy klikalne) |
| Dolny hint „klik / przypisz / Zrównoważone” | **Usunięty** z dolnego panelu okolicy (treść opcjonalnie w ℹ szczegóły) |
| Plony 🍞🔨💰 na heksach okolicy | **Ukryte** w widoku miasta |

**Klatka K3 v3.2:** mapa bez duplikatu nazwy · exit u góry · toolbar okolica na dole · brak liczb plonów na heksach.

### 3. Dolna ściąga skrótów (mapa świata)

| Widok | Dolny hint „Pan: przeciąganie… N = koniec tury…” |
|-------|--------------------------------------------------|
| Mapa świata | ✅ |
| **Panel / mapa miasta** | ❌ **ukryty** |

### 4. Badge miasta na mapie świata

- **Pigułka:** `NAZWA` + **populacja** w złotym kółku (canvas, styl W3)
- **Nie:** liczba wojska / armii na badge (wojsko = jednostki na heksie)

**Osobna mini-klatka K6 (zalecane):** mapa świata z pigułką RZYM + „1”.

### 5. Stopka surowców (P0-1 — potwierdzone playtestem)

Bez zmian semantyki względem review v3.1:
- **`civ-v-right-foot`** — osobny pas na dole prawej kolumny
- **Nie** wewnątrz Spichlerza / Handlu
- Wizualnie **oddzielona** od panelu zakładki (border-top, groove — patrz playtest)

**Klatki K2 / K2b:** pokaż wyraźny **podział** panel vs stopka.

### 6. Bez zmian (nadal obowiązuje z v3)

- Layout **2 rail lewo + 7 rail prawo**
- Mapa 3D widoczna (winieta)
- 6 brakujących paneli prawych (Handel…Religia) — **nadal do narysowania** (v3.1)
- Esc → mapa świata (nie pauza) · Menu gry osobna klatka (v3.1 review)

---

## Klatki w pliku v3.2

| # | Nazwa | Priorytet | Co pokazać |
|---|-------|-----------|------------|
| **K3′** | Mapa 3D chrome v3.2 | **P0** | exit góra · brak tabliczki · okolica dół · brak plonów |
| **K1′** | Panel + górny HUD miasta | **P0** | Wiki/Menu · badge miasta · brak chipów imperium |
| **K2′** | Spichlerz + stopka | P0 | stopka oddzielona wizualnie |
| **K6** | Mapa świata · badge | P1 | pigułka NAZWA + pop |
| K4/K5 | Esc + Menu gry | P1 | jak review v3.1 (jeśli jeszcze brak) |
| K7–K12 | 6 paneli prawych | P1 | jak v3.1 § review |

Możesz **zaktualizować** istniejące klatki v3 zamiast duplikować plik — ważne: oznacz wersję **v3.2** w tytule i w handoff.

---

## Referencje

| Plik | Rola |
|------|------|
| `DESIGN-BRIEF-W3-miasto-v3-HUD.md` | brief bazowy (architektura W3) |
| `_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md` | review v3.1 (stopka, Esc, 6 paneli) |
| `The Game - Miasto Zakładki W4 v2 (1E).dc.html` | polish paneli (styl, nie treść) |
| `The Game - Ekran Miasto W3 v3 (1E).dc.html` | poprzedni deliverable Design — **zaktualizuj**, nie kasuj historii |

---

## Styl 1E

- Tokeny: `docs/ux/pakiet-design-W3-v2/styl-1E/tokens.css`
- Ikony: `brand-book/` · zero emoji
- Typografia: Georgia + Segoe UI

---

## DoD Design

- [ ] Playtest `gra-robocza/START.html` — przejście jak w § Playtest
- [ ] K3′ + K1′ odzwierciedlają **P0-2 chrome** (Wiki/Menu, brak duplikatu nazwy, exit góra)
- [ ] Stopka surowców wizualnie **osobna** od Spichlerza (K2′)
- [ ] Badge mapy świata NAZWA + pop (K6 lub adnotacja)
- [ ] `DESIGN-do-UI_miasto-w3.2-delta.md` — lista klatek + delta vs v3.1
- [ ] **NIE** proponujesz zmian logiki gry — tylko mockup

**Po v3.2:** Maciej OK wizualny → ewentualny CSS polish Lane → **osobna** promocja kanonu (MASTER).

---

## Lane — nie Design

Handoff techniczny: `dyspozycje/_handoff/UI-do-DESIGN_W3-miasto-v3.2-delta-2026-07-04.md`
