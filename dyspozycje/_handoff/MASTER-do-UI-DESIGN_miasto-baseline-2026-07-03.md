# MASTER → UI + Design: delta baseline miasta · robocza 2026-07-03

**Hasło:** `DELTA-MIASTO-2026-07-03`  
**Trigger:** playtest Maciej w roboczej (EXIT miasto · okolica auto · overlay pól · Esc/Mapa)  
**Źródło prawdy UX:** **`gra-kanon/`** md5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`** (= `gra/src` = `gra-robocza/src`)  
**Status:** **Design STOP** na mockupach W3-1E / W4-v2 dopóki nie dostanie tej delty + OK Macieja (Krok 3).

---

## 1. Co poszło nie tak (proces)

| Co się stało | Skutek |
|--------------|--------|
| Playtest F ROBOCZA → wpis tylko w `DZIENNIK-MASTERA.md` | Design dostał **stary** brief W3-miasto-1E (9 rail, okolica w panelu…) |
| Brak `WYMIANA-UI-DESIGN.md` STOP | Designer rysował do **`Ekran Miasto (1E).dc.html`** sprzed flow Mapa/Esc |
| Brak wpisu w `UI.md` / `UI-DO-MASTERA.md` | Lane nie wiedział, że **baseline się przesunął** |
| W4 v2 zakładki osobno | Polish 7 zakładek **OK**, ale **brakuje** chrome wyjścia / okolica 3D / auto pól |

**Rola MASTER:** ten plik + flaga STOP + dopiero potem START Design.

---

## 2. Delta UX — co jest w grze a NIE w mockupach Design

### 2A Wyjście z miasta (B-27 · GOTOWE w REJESTR)

| Element | Gdzie w grze | Mockup 1E / W3 |
|---------|--------------|----------------|
| **Mapa** (górny pasek) | `#cs-mapbtn` · footer panelu | ❌ brak |
| **Wróć na mapę** (środek/dół mapy) | `renderCivMapChrome` · `#civ-v-map-close` | ❌ brak |
| **Esc — zamknij** | hint footer + title przycisków | ❌ brak |
| Tabliczka miasta na mapie 3D | `.civ-v-map-plaque` (nazwa + hint 👤/scroll) | ❌ brak |
| Chrome mapy widoczny | `cityUxFrame` — **usunięto opacity:0** z `.civ-ux-map-chrome` | mockup: mapa zasłonięta / brak |

**Kod:** `cityPanel.ts` (`renderCivMapChrome`, `#cs-mapbtn`) · `cityUxFrame.ts` (`.civ-ux-map-chrome`)

### 2B Okolica — tryb mapy 3D (nie tylko siatka w panelu)

| Element | Gra | Mockup |
|---------|-----|--------|
| Toolbar profili na **mapie** (centrum-dół) | `#cs-okolica-center` · `.civ-v-okolica-center` | mockup: okolica tylko w prawym panelu / brak |
| Hint trybu auto/ręczny | `#cs-okmode` · `okolica-mode-hint` | ❌ |
| Siatka hex (aux) | `#cs-okolica` w `#cs-okolica-aux` (ukryte gdy mapa 3D) | mockup: tylko grid w panelu |
| Overlay zasięgu pól | `rangeOverlay.ts` (lane MAPA) | ❌ |
| Auto zarządzanie pól W3 | `okolica.ts` fallback auto · hint w `main.ts` | ❌ w checklistie START-W3 |

**REJEST:** B-27 chrome · okolica auto = decyzja W3 (Maciej playtest 2026-07-03)

### 2C Układ W3 (już w kanonie — częściowo w W4 v2 Design)

| Element | Stan kanon |
|---------|------------|
| 2 raili: lewo budowa+rekrut · prawo 7 parametrów | ✅ |
| W4 polish: `/t` out · ikony surowców stopka · rail 46px | ✅ kod + W4 v2 mockup |
| Górny pasek imperium B-02 (chipy) | ✅ kod · Design B-02 osobna klatka nadal luka |
| Winieta dim (mapa czytelna) | ✅ `cityUxFrame` |
| Wiki/Menu na mapie świata | ✅ poza panelem miasta · w mockupie miasta: **dolny chrome mapy ukryty** (szata-sync #9) |

### 2D Czego Design **NIE** rusza teraz

- **C-06 v4** mapa bitwy — osobny tor (`WKLEJKA-DESIGN-START-C06-v4.md`)
- Rail **9→7** — kanon ma **7** zakładek prawego raila + **2** lewy (budowa/rekrut) — mockup START-W3 mówi „9 rail” = **NIEAKTUALNE**

---

## 3. Mockupy **NIEAKTUALNE** (STOP edycji do delty)

| Plik | Problem |
|------|---------|
| `The Game - Ekran Miasto (1E).dc.html` | brak Mapa/Esc/Wróć · okolica w panelu |
| `The Game - Ekran Miasto W3 (1E).dc.html` | j.w. |
| `START-W3-miasto-1E.md` checklist | 9 rail · okolica grid w panelu · brak B-27 |
| `Miasto Zakładki W3 v2` / **W4 v2** | polish zakładek OK · **bez** chrome mapy 3D |
| `UI-do-DESIGN_w3-miasto-1E-dane.md` | odniesienie do starego `cityPanel` |

**Nowy baseline Design (po OK Macieja):** jeden plik **`The Game - Ekran Miasto W3 v3 (1E).dc.html`** — merge W4 zakładki + chrome z tej delty.

---

## 4. Screenshoty dla Design (Maciej / MASTER)

Folder: `docs/ux/referencje-miasto-kanon-2026-07-03/`

| # | Nazwa | Jak zrobić |
|---|-------|------------|
| 01 | `01_panel-pelny.png` | kanon → miasto otwarte · rail widoczny |
| 02 | `02_footer-mapa-esc.png` | dół panelu · **Mapa** + Esc |
| 03 | `03_wroc-na-mape-center.png` | przycisk **Wróć na mapę** na mapie 3D |
| 04 | `04_okolica-toolbar-map.png` | toolbar profili na mapie (centrum-dół) |
| 05 | `05_overlay-zasieg.png` | overlay pól / zasięg |
| 06 | `06_zakladka-spichlerz-w4.png` | prawy rail · chipy bez `/t` |
| 07 | `07_wyjscie-esc.png` | po Esc — powrót na mapę świata |

Playtest: `gra-kanon/START.html` · Ctrl+F5

---

## 5. Lane UI — status (2026-07-03 · Maciej)

**Kod miasta = baseline.** `cityPanel.ts` / `cityUxFrame.ts` identyczne w `gra/` = `gra-kanon/` = `gra-robocza/`.

| Tor | Status |
|-----|--------|
| ~~A — polish chrome~~ | **ANULOWANY** — już w kanonie |
| ~~B — port z mockupu~~ | **NIE** — Design nadgania mockup do gry |
| **Lane** | **IDLE** (miasto) |

**Bitwa:** `gra/battleScene.ts` nowsze — osobny tor z Masterem.

---

## 6. Design — deliverable po START (po unfreeze)

1. **`The Game - Ekran Miasto W3 v3 (1E).dc.html`** — pełny ekran: dim + 2 rail + mapa 3D + B-27 + okolica toolbar  
2. Aktualizacja **W4 v2** zakładek — spójność stopki surowców (już jest)  
3. **`DESIGN-do-UI_miasto-w3-v3.md`** — krótki meldunek  
4. Opcjonalnie: zip `W3-miasto-v3-2026-07-03.zip`

**Hasło unfreeze:** Maciej **`START — W3-miasto-v3-delta`** (po ABC Krok 3)

---

## 7. Maciej — decyzja Krok 3 (ABC)

| | Opcja |
|---|--------|
| **A** | Lane UI idzie **od screenshotów kanonu** (chrome wyjścia + okolica map) — Design później |
| **B** | **Design najpierw** — mockup W3 v3 z tej delty, potem lane port |
| **C** | **Oba równolegle** (Design v3 + lane chrome) — ryzyko rozjazdu |

**Decyzja Macieja (2026-07-03):** **kod miasta w grze = źródło prawdy** · Designer dostosowuje mockup · lane **nie portuje** (już w kanonie)

**Audyt sync:** `_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`

---

## Powiązane wpisy

- DZIENNIK: `[2026-07-03] F ROBOCZA — EXIT miasto + okolica auto`
- REJEST: B-27, B-28
- WYMIANA: § **STOP W3-miasto** (2026-07-03)
- C-06: osobny tor — **nie mieszać**
