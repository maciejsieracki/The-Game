# SCHEMAT A→Z — UX / Brand Book / Pipeline → kod → kanon

**Cel:** jedna rozpiska do odhaczania krok po kroku.  
**Kto używa:** Maciej (decyzje) · Claude Design · Lane UI · Grupy A–E · MASTER · Opus · Integrator F.  
**Decyzje stylu (ZAMKNIĘTE):** 1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A  
**Kolejność wdrożenia w grze (8A):** E → A → B → D → C  
**Ostatnia aktualizacja schematu:** 2026-06-26

---

## Jak odhaczać

| Symbol | Znaczenie |
|--------|-----------|
| `[ ]` | Do zrobienia |
| `[~]` | W toku / częściowo |
| `[x]` | Gotowe |
| `[—]` | Nie dotyczy v1.0 / odłożone |
| **Kto** | Odpowiedzialny za krok (jedna rola) |

**Po każdym zamkniętym bloku:** zaktualizuj `docs/ux/pipeline/STATUS-PIPELINE.md` + wpis w `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` (log append-only).

**Powiązane pliki:**

| Plik | Rola |
|------|------|
| [`claude-design/KANON-SCIEZEK.md`](claude-design/KANON-SCIEZEK.md) | Ścieżki zapisu Design |
| [`claude-design/WYMIANA-UI-DESIGN.md`](claude-design/WYMIANA-UI-DESIGN.md) | Kolejka REQ + status YAML |
| [`pipeline/STATUS-PIPELINE.md`](pipeline/STATUS-PIPELINE.md) | Postęp PNG wejście/PO/kod |
| [`obieg/UI-pipeline-ux.md`](../obieg/UI-pipeline-ux.md) | Obieg lane UI → Master |
| [`claude-design/01-propozycje-z-design/brand-book/DYSPOZYCJA.md`](claude-design/01-propozycje-z-design/brand-book/DYSPOZYCJA.md) | Pełna lista deliverables Design |

---

# FAZA 0 — Infrastruktura (raz na projekt)

> Bez tego Design nie zapisuje do kanonu, a lane UI nie widzi plików.

## 0.1 Ścieżki i foldery

| # | Krok | Kto | Status |
|---|------|-----|--------|
| 0.1.1 | Folder kanon Design: `docs/ux/claude-design/01-propozycje-z-design/brand-book/` | Maciej / MASTER | [~] |
| 0.1.2 | Eksport techniczny: `brand-book/eksport/` (`tokens.css`, `tokens.json`, `HANDOFF.md`, `icons/`) | Design | [~] |
| 0.1.3 | Status/kolejka: `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` | Lane UI + Design | [x] |
| 0.1.4 | Dyspozycje Design: `brand-book/DYSPOZYCJA.md` (skopiować/utrzymać z 1E jeśli brak) | Design / Lane UI | [~] |
| 0.1.5 | Wejście do Design (upload): `docs/ux/claude-design/00-brand-book-pakiet/` | Lane UI | [x] |
| 0.1.6 | Pipeline wejście grup: `docs/ux/pipeline/01-wejscie/grupa-{A..E}/` | Lane UI | [x] |
| 0.1.7 | Pipeline PO: `docs/ux/pipeline/02-po-design/grupa-{A..E}/` | Maciej / Design | [x] |
| 0.1.8 | Tokeny w repo (kod): `UI/design-tokens-brand-v1.css` | Lane UI | [x] |
| 0.1.9 | Deprecated: **nie używać** `brand-book-1E/` | Wszyscy | [x] |
| 0.1.10 | Poll plików Design: `node gra/tools/poll-claude-design.mjs` | Lane UI / MASTER | [x] |

## 0.2 OneDrive (lokalnie u Macieja)

| # | Krok | Kto | Status |
|---|------|-----|--------|
| 0.2.1 | Cały folder `Civ/` → **Zawsze przechowuj na tym urządzeniu** | Maciej | [ ] |
| 0.2.2 | Szczególnie: `…/brand-book/` i `gra/src/` — bez dehydratacji | Maciej | [ ] |
| 0.2.3 | Po sync OneDrive: otwórz folder w Explorerze, poczekaj na zielony status | Maciej | [ ] |
| 0.2.4 | Weryfikacja: poll ≥ 30 plików w `brand-book/` (nie tylko README) | Lane UI | [ ] |

## 0.3 Sync Design → OneDrive (Design kopiuje wprost)

> Maciej w każdym START kończy blokiem **SKOPIUJ … DO …** (pełne ścieżki). Design wykonuje — Maciej nie pobiera ręcznie.

| # | Krok | Kto | Status |
|---|------|-----|--------|
| 0.3.1 | Design: praca w `brand-book/` (chmura) | Design | [~] |
| 0.3.2 | Maciej: w START — **SKOPIUJ brand-book/ + WYMIANA** (ścieżki OneDrive) | Maciej | [ ] |
| 0.3.3 | Design: kopiuje · potwierdza „Skopiowano do OneDrive" | Design | [ ] |
| 0.3.4 | Lane UI: poll ≥ 30 plików w `brand-book/` | Lane UI | [ ] |

**Nie GitHub.**

## 0.4 Decyzje i spec (zamknięte — nie powtarzać)

| # | Dokument | Status |
|---|----------|--------|
| 0.4.1 | `docs/ux/DECYZJE-WARSTWA1-MACIEJ.md` (1B–8A) | [x] |
| 0.4.2 | `00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md` | [x] |
| 0.4.3 | `UI/Warstwa1-Design-System-podglad.html` | [x] |
| 0.4.4 | Maciej review wizualny brand book v1: pozytywny | [x] |

**DoD Fazy 0:** pliki Design widoczne lokalnie (poll OK) · WYMIANA v3 · kanon ścieżek zgodny.

---

# FAZA 1 — Design D0 (fundament 1E)

> Hub + szkielet — wg Macieja i Design **zrobione**; utrzymywać spójność.

| # | Deliverable | Kto | Status |
|---|-------------|-----|--------|
| 1.1 | Hub `The Game — Przegląd (1E).dc.html` + `support.js` | Design | [x] |
| 1.2 | Dokumentacja brand book (strony HTML w `brand-book/`) | Design | [x] |
| 1.3 | Tokeny wstępne + komponenty (outline 4C, panel 5C, chip 6C) | Design | [~] |
| 1.4 | ~14 SVG core w `eksport/icons/` | Design | [~] |
| 1.5 | Ekrany szkielet: menu, kreator, HUD, miasto, dyplomacja, walka, game over | Design | [~] |
| 1.6 | Prototyp klikalny (podstawowy) | Design | [~] |

**DoD Fazy 1:** hub otwiera się bez błędów linków · Maciej OK wizualnie ✅.

---

# FAZA 2 — Design D1 (P0 — blokuje pełne W1)

> **TERAZ dla Design.** Po D1 lane UI robi sync tokenów + SVG (W1b).

| # | ID | Deliverable | DoD | Kto | Status |
|---|-----|-------------|-----|-----|--------|
| 2.1 | D1-1 / REQ-003 | Ikona `tb-diplomacy` = **uścisk dłoni** wszędzie | Spójne HUD, toolbar, biblioteka; pergamin+pióro usunięte | Design | [ ] |
| 2.2 | D1-2 / REQ-002 | Ekran **E-15b porażka** | Ten sam layout co wygrana · akcent `#c84040` | Design | [ ] |
| 2.3 | D1-3 | **Tier 1** komplet: 9 ikon × 2 rozmiary (24+40) | Pliki w `eksport/icons/` wg SPEC | Design | [ ] |
| 2.4 | D1-4 | **Tier 2** komplet: 5 ikon × 2 rozmiary | W tym poprawiony dyplomacja | Design | [ ] |
| 2.5 | D1-5 | Ekrany E final PO: E-01, E-08…E-13, E-15 (win) | Zgodne 1B–6C · zero emoji | Design | [ ] |
| 2.6 | D1-6 | `eksport/HANDOFF.md` **v2** | Mapowanie ekran → plik TS · breaking changes | Design | [ ] |
| 2.7 | D1-7 | **Freeze** `tokens.css` + `tokens.json` v1 | Lane UI może sync bez zgadywania | Design | [ ] |
| 2.8 | — | Design **SKOPIUJ** → OneDrive (poll OK) | poll ≥ 30 plików | Design | [ ] |

**DoD Fazy 2:** wszystkie wiersze 2.1–2.8 `[x]` · REQ-002/003 `done` w WYMIANA.

---

# FAZA 3 — Pipeline WEJŚCIE (mockupy PRZED, clean screen)

> Grupy robią **PRZED** (tło `#080a12`, 1920×1080). Brand book robi **Maciej w Design**, nie grupa.

## 3.1 Wymagania wspólne (każdy PNG)

- [ ] Rozdzielczość 1920×1080
- [ ] Tło jednolite `#080a12` (bez mapy/playtestu)
- [ ] Nazwa: `{ID}_{slug}_przed.png`
- [ ] Zapis **tylko** w `01-wejscie/grupa-X/`
- [ ] Po komplecie: `RAPORT-WEJSCIE.md` → status **GOTOWE WEJŚCIE**

## 3.2 Grupa E (pierwsza — start pipeline)

| Plik | Kto | Wejście | Status |
|------|-----|---------|--------|
| `E-01_menu-glowne_przed.png` | Grupa E | [ ] | ⏳ |
| `E-03_ustawienia_przed.png` | Grupa E | [ ] | ⏳ |
| `E-09_kreator-krok2-epoka_przed.png` | Grupa E | [ ] | ⏳ |
| `E-10_kreator-krok3-cywilizacja_przed.png` | Grupa E | [ ] | ⏳ |
| `E-11_kreator-krok4-ustawienia_przed.png` | Grupa E | [ ] | ⏳ |
| `E-15_game-over_przed.png` | Grupa E | [ ] | ⏳ |
| `E-15b_game-over-porazka_przed.png` (opc.) | Grupa E | [ ] | ⏳ |

**DoD Grupa E wejście:** 6/6 PNG + RAPORT GOTOWE.

## 3.3 Grupa A (po sygnale E / Maciej)

8 plików: `A-01`, `A-02`, `A-03`, `A-04`, `A-06`, `A-08`, `A-11`, `A-16` — folder `01-wejscie/grupa-A/` · wszystkie `[ ]`

## 3.4 Grupa B (po E + A)

8 plików: `B-01`, `B-02`, `B-15`, `B-17`, `B-29`, `B-30`, `B-33`, `B-34` — folder `01-wejscie/grupa-B/` · wszystkie `[ ]`

## 3.5 Grupa D (po E + A + B)

5 plików: `D-02`, `D-03`, `D-04`, `D-05`, `D-06` — folder `01-wejscie/grupa-D/` · wszystkie `[ ]`

## 3.6 Grupa C (ostatnia — po E, A, B, D)

7 plików: `C-01`, `C-06`, `C-07`, `C-08`, `C-09`, `C-19`, `C-21` — folder `01-wejscie/grupa-C/` · wszystkie `[ ]`

**DoD Fazy 3 (całość v1.0 UX baseline):** 34/34 PNG w `01-wejscie/` (patrz `STATUS-PIPELINE.md`).

---

# FAZA 4 — Design PO + Maciej review

> Dla każdego ekranu: PRZED (grupa) → Design PO → Maciej OK → kopia do `02-po-design/`.

## 4.1 Pętla per ekran (powtarzaj)

| Krok | Kto | Status |
|------|-----|--------|
| 4.x.1 | Maciej: weź PNG z `01-wejscie/grupa-X/` → Claude Design | [ ] |
| 4.x.2 | Design: poprawka brand book → HTML/PNG PO | [ ] |
| 4.x.3 | Maciej: review wizualny (**OK wdrażaj** / poprawki) | [ ] |
| 4.x.4 | Zapis PO: `02-po-design/grupa-X/{ID}_{slug}_po.png` | Maciej | [ ] |
| 4.x.5 | Opcjonalnie: `03-zatwierdzone/` po formalnym OK | Maciej | [ ] |
| 4.x.6 | MASTER: sygnał w czacie lane UI „PO gotowe dla {ID}" | MASTER | [ ] |

## 4.2 Kolejność ekranów (8A)

1. **E** — wszystkie 6 (+ E-15b)  
2. **A** — 8 ekranów  
3. **B** — 8 ekranów  
4. **D** — 5 ekranów  
5. **C** — 7 ekranów  

**DoD Fazy 4 (per grupa):** wszystkie PO w `02-po-design/grupa-X/` · Maciej OK · wpis w STATUS-PIPELINE.

---

# FAZA 5 — Wdrożenie kodu (Lane UI) — fale W1–W6

> Lane UI: **tylko** `gra/src/ui/*` · **NIGDY** `main.ts` · końcówka: **`przekaż do Mastera`**.

## 5.1 W1 — Grupa E / meta (menu · kreator · game over)

| # | Krok | Pliki TS | Kto | Status |
|---|------|----------|-----|--------|
| 5.1.1 | Sync `brandTokenVars.ts` ← `eksport/tokens.css` | `brandTokenVars.ts` | Lane UI | [~] |
| 5.1.2 | Menu: tokeny + outline 4C + Georgia | `mainMenu.ts` | Lane UI | [x] |
| 5.1.3 | Kreator: tokeny + outline + zero emoji | `newGameFlow.ts` | Lane UI | [x] |
| 5.1.4 | Game over: panel 5C + outline win/lose | `victoryScreen.ts` | Lane UI | [x] |
| 5.1.5 | Ikony Tier 1–2 z SVG (nie placeholder) | `icons/iconRegistry.ts` | Lane UI | [ ] |
| 5.1.6 | Testy lane: `victory-screen-test` + `smoke` | `gra/tools/` | Lane UI | [x] |
| 5.1.7 | Handoff: `UI-do-MASTER_brand-book-w1.md` | `_handoff/` | Lane UI | [x] |
| 5.1.8 | Meldunek: `UI-DO-MASTERA.md` + Slack outbox | dyspozycje / obieg | Lane UI | [x] |
| 5.1.9 | **Maciej:** `przekaż do Mastera` | — | Maciej | [x] |

**DoD W1:** menu+kreator+game over w grze po kanonie · SVG Tier 1–2 · zero emoji E.

## 5.2 W2 — Grupa A / HUD mapa (Design D2)

| # | Krok | Pliki TS (orientacyjnie) | Status |
|---|------|--------------------------|--------|
| 5.2.1 | Design D2: Tier 3 rail + ekrany A-01…A-03, A-11, A-13 | Design | [ ] |
| 5.2.2 | Sync ikon Tier 3 + chipy Tier 4 min. | `iconRegistry.ts` | [ ] |
| 5.2.3 | HUD górny chipy 6C (ikona+liczba+etykieta PL) | `hud.ts`, `bottomBarHud.ts` | [ ] |
| 5.2.4 | Toolbar mapy | `mapToolbarHud.ts` | [ ] |
| 5.2.5 | Dolny pasek WYKONAJ / Koniec tury | `bottomBarHud.ts` | [ ] |
| 5.2.6 | Minimapa (cross MAPA) | `minimapHud.ts` | [ ] |
| 5.2.7 | Handoff + `przekaż do Mastera` | Lane UI | [ ] |

## 5.3 W3 — Grupa B / panel miasta (Design D3)

| # | Krok | Pliki TS | Status |
|---|------|----------|--------|
| 5.3.1 | Design D3: B-01 ramka, B-02, B-14 rail, zakładki | Design | [ ] |
| 5.3.2 | Panel miasta layout 5C + rail ikony | `cityPanel.ts`, `cityUxFrame.ts` | [ ] |
| 5.3.3 | Okolica + dock hover | `hoverDetailDock.ts`, `buildingHoverTooltip.ts` | [ ] |
| 5.3.4 | Drzewko tech docked | `scienceHubHud.ts`, `sciencePicker.ts` | [ ] |
| 5.3.5 | Handoff + `przekaż do Mastera` | Lane UI | [ ] |

## 5.4 W4 — Grupa D / dyplomacja (Design D4)

| # | Krok | Pliki TS | Status |
|---|------|----------|--------|
| 5.4.1 | Design D4: D-02…D-06 PO + Tier 5 dip/ui | Design | [ ] |
| 5.4.2 | Lista dyplomacji HUD | `diploListHud.ts` | [ ] |
| 5.4.3 | Audiencja + modale | `diplomacyAudience.ts`, `diplomacyNegotiationModal.ts` | [ ] |
| 5.4.4 | Koszyk handlu/daru (P4 gotowe — styl brand) | `diplomacyTradeBasket.ts` | [ ] |
| 5.4.5 | Handoff + `przekaż do Mastera` | Lane UI | [ ] |

## 5.5 W5 — Grupa C / walka (Design D5)

| # | Krok | Pliki TS | Status |
|---|------|----------|--------|
| 5.5.1 | Design D5: C-01, C-06…C-09, C-19, C-21 | Design | [ ] |
| 5.5.2 | Pre-bitwa brand | `preBattle.ts` | [ ] |
| 5.5.3 | HUD bitwy (cross UNITS/battle — kontrakt) | `battle/*`, UI chrome | [ ] |
| 5.5.4 | Koniec bitwy | `postBattleSummary.ts` | [ ] |
| 5.5.5 | Handoff + `przekaż do Mastera` | Lane UI | [ ] |

## 5.6 W6 — Domknięcie v1.0 UX (Design D6)

| # | Krok | Status |
|---|------|--------|
| 5.6.1 | Pozostałe ekrany z rejestru UX | [ ] |
| 5.6.2 | Tier 4–6 ikon reszta | [ ] |
| 5.6.3 | Hub HUB-03…HUB-06 (kafelki kreator/walka/motion) | [ ] |
| 5.6.4 | Porównanie 34 par PRZED/PO w HANDOFF | [ ] |
| 5.6.5 | Ostatni handoff UX v1.0 + Master kanon | [ ] |

---

# FAZA 6 — MASTER + Integrator F + kanon

> Po każdym **`przekaż do Mastera`** od lane UI.

| # | Krok | Kto | Status |
|---|------|-----|--------|
| 6.1 | MASTER: odczyt handoff `_handoff/UI-do-MASTER_*.md` | MASTER | [ ] |
| 6.2 | Wpięcie batchy w `main.ts` (jeśli wymagane) | MASTER / F | [~] |
| 6.3 | Build: `npx vite build --outDir $env:TEMP\civ-dist` | MASTER | [ ] |
| 6.4 | Bramka testów (17 suitów + smoke + battle-smoke) | MASTER | [ ] |
| 6.5 | **Opus 4.8 Ask** — review przed kanonem (APPROVE/BLOCK) | Opus / Maciej | [ ] |
| 6.6 | Poprawki po BLOCK → Lane UI (Agent) → ponowny review | Lane UI | [ ] |
| 6.7 | Publikacja `Gra-podglad.html` + md5 checkpoint | MASTER | [ ] |
| 6.8 | Wpis `DZIENNIK-MASTERA.md` + `CURSOR-BACKLOG.md` | MASTER | [ ] |
| 6.9 | Playtest gameplay (opcjonalny) — **tylko Master → Maciej** | MASTER | [ ] |

**DoD Fazy 6 (per batch):** kanon opublikowany · md5 zapisany · Opus APPROVE.

---

# FAZA 7 — Design ciągły (kolejka REQ)

| ID | Pri | Opis | Status |
|----|-----|------|--------|
| REQ-001 | P0 | Paczka brand-book w repo | [~] |
| REQ-002 | P1 | E-15b porażka | [ ] |
| REQ-003 | P1 | Dyplomacja = uścisk dłoni | [ ] |
| REQ-004 | P2 | SVG Tier 3–5 | [ ] |
| REQ-005 | P2 | Hub kafelki + linki prototypu | [ ] |

Pełna lista deliverables: `brand-book/DYSPOZYCJA.md` sekcje A1–A10.

---

# FAZA 8 — Świadomie PO v1.0 (nie blokuje)

- [—] Brand Book PDF do druku  
- [—] E-04 Kampania / Multiplayer pełne ekrany  
- [—] Responsywność mobile / daltonizm (osobna decyzja ABC)  
- [—] Tier 7 legenda terenu / minimapa  
- [—] Pełne 130+ ekranów rejestru (baseline 34 = v1.0 UX scope)

---

# MAPA RÓL (kto co robi — jednym rzutem oka)

```
Maciej     → decyzje ABC · OneDrive sync
Design     → zapis `brand-book/` + `eksport/` · REQ z WYMIANA
Grupy A–E  → *_przed.png → 01-wejscie/
Lane UI    → review · kod gra/src/ui/* · handoff · przekaż do Mastera
MASTER     → main.ts · build · testy · dyspozycje · kanon
Opus       → review APPROVE/BLOCK (Ask, ręczny)
Integrator F → wpięcia cross-lane po handoff od grup
```

---

# KOLEJNOŚĆ NATYCHMIASTOWA (co teraz odhaczać)

| Krok | Akcja | Kto |
|------|-------|-----|
| **1** | Design: zapis w `brand-book/` (jak tura 1) · OneDrive u Macieja | Design + Maciej |
| **2** | Design D1: REQ-002, REQ-003, Tier 1–2 SVG, freeze tokenów | Design |
| **3** | OneDrive sync → poll ≥ 30 plików | Maciej + Lane UI |
| **4** | Lane UI W1b: sync SVG + tokeny z eksport/ | Lane UI |
| **5** | Grupa E: 6× PNG `_przed` | Grupa E |
| **6** | MASTER: rebuild kanon W1 (handoff już jest) | MASTER |
| **7** | Dalej fale W2… po PO grupach | Wszyscy wg 8A |

---

# Changelog schematu

| Data | Zmiana |
|------|--------|
| 2026-06-26 | Utworzenie schematu A→Z · sync folder brand-book/ · fale W1–W6 · pipeline 34 PNG |

---

*Jedna rozpiska — odhaczaj wiersze, aktualizuj STATUS-PIPELINE i WYMIANA po każdym zamkniętym bloku.*
