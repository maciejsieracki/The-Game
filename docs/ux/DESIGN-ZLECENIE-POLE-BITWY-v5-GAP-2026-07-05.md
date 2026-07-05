# ZLECENIE Design — POLE-BITWY v5 GAP (elementy Cursor → mockupy 1E)

**Od:** Lane UI / Maciej (via Cursor MASTER)  
**Do:** Design (Claude Design / brand-book 1E)  
**Data zlecenia:** 2026-07-05  
**ZLECENIE-ID:** `POLE-BITWY-v5-gap-2026-07-05`  
**Priorytet:** **P0** — bez tych mockupów Maciej nie może zamknąć wizualnie toru POLE-BITWY

---

## 0. TL;DR dla Designera

Paczka **v4.1** (C06 Deploy, C09 Roster, C06 Strategia, C12 Koniec) jest **gotowa i zaakceptowana** jako baza HUD.

**Problem:** część ekranów w grze (`Gra-podglad-POLE-BITWY.html`) nadal wygląda jak **prowizorka lane Cursor** — nie ma osobnych mockupów `.dc.html`. Maciej chce **zamienić wszystko, co się da**, na Twoje mockupy.

**Twoje zadanie:** dostarczyć ZIP z brakującymi ekranami + aktualizacjami C-12. Lane UI tylko **portuje CSS** — logika gry bez zmian.

**Po gotowości napisz:**  
`Paczka POLE-BITWY-v5-gap-2026-07-05.zip gotowa` + lista plików.

---

## 1. Jak zobaczyć „PRZED” (stan gry dziś)

| Co | Gdzie |
|----|--------|
| **Playtest live** | Otwórz `gra-kanon/Gra-podglad-POLE-BITWY.html` → **Ctrl+F5** |
| **Wejście** | Dwuklik POLE-BITWY → faza deploy → **Start walki** → opcjonalnie **R** |
| **Koniec bitwy** | Doprowadź do końca lub **POMIN** (rail `>>`) |
| **Szczegóły** | Na ekranie końca → **Szczegóły bitwy** |
| **Review HTML (3 stany HUD)** | `docs/ux/export/C-POLE-BITWY-review-3stany.html` |
| **Review stary vs kod** | `docs/ux/export/C-POLE-BITWY-review-stary-vs-kod.html` |
| **Review GAP (lista zadań)** | `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html` ← **START TU** |
| **Mockupy v4.1 (DOBRE — nie psuć)** | `docs/ux/claude-design/The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` · `C09 Roster lewy panel v4` · `C06 Popup Strategia v4` · `C12 Koniec bitwy v2` |

**MD5 buildu POLE-BITWY (2026-07-05):** `be17d8696b08523e5ce7e0cd93417485`

---

## 2. Reguły obowiązkowe (1E)

| Reguła | Wartość |
|--------|---------|
| Styl | **1E** · zero emoji |
| Ty (gracz) | `#3a6ad0` · tekst `#8fb6e0` |
| Wróg | `#c84040` · tekst `#e08a8a` |
| Złoto UI | `#e8d88a` |
| Tytuły | **Georgia** serif |
| UI body | Segoe UI |
| Panel | `linear-gradient(180deg,#161c28,#0a0d14)` · ramka 2px złota |
| Przycisk primary | gradient złoty (jak C-01 „Powrót do mapy”) |
| Przycisk secondary | outline złoty |
| Format pliku | `The Game - <ID> <opis> v<N> YYYY-MM-DD (1E).dc.html` |
| ZIP | `POLE-BITWY-v5-gap-2026-07-05.zip` |
| W ZIP | wszystkie `.dc.html` + `DESIGN-do-UI_POLE-BITWY-v5-gap.md` + `MANIFEST.txt` + `support.js` |

**NIE edytuj** archiwum v2/v3 — tylko nowe pliki v5 lub aktualizacja C-12 jako **v3**.

---

## 3. Lista deliverables — co musisz narysować

### P0 — brak mockupu (krytyczne)

---

#### **GAP-01 · C-23 — Szczegóły bitwy (modal / overlay)**

**Status dziś:** Cursor złożył ekran z briefu — **Maciej odrzucił wizualnie** (nie wygląda jak reszta 1E).

**Plik deliverable:**  
`The Game - C23 Szczegoly bitwy v1 2026-07-05 (1E).dc.html`

**Kiedy w grze:** Ekran końca bitwy (C-12) → klik **„Szczegóły bitwy”**.

**Układ MUST (treść z kodu — nie wymyślaj nowych pól):**

```
┌─────────────────────────────────────────────────────────────┐
│  (linia) Bitwa rozstrzygnięta                               │
│  SZCZEGÓŁY BITWY          ← Georgia, złoto, duży            │
│  ─────── ◆ ───────                                          │
│                                                             │
│  ┌─ ATAKUJĄCY (niebieski) ─┐  ┌─ OBROŃCA (czerwony) ─────┐ │
│  │ ZNISZCZONE        [liczba]│  │ ZNISZCZONE        [liczba]│ │
│  │ Horseman ×7               │  │ Horseman ×13              │ │
│  │                           │  │                           │ │
│  │ ZROOTOWANE        [liczba]│  │ ZROOTOWANE        [liczba]│ │
│  │ …                         │  │ …                         │ │
│  │                           │  │                           │ │
│  │ OCALAŁE           [liczba]│  │ OCALAŁE           [liczba]│ │
│  │ Hastati ×60, Archer ×30…  │  │ Phalanx ×60…              │ │
│  └───────────────────────────┘  └───────────────────────────┘ │
│                                                             │
│  [← Wróć do podsumowania]  [Rozegraj ponownie]  (opcj.)    │
└─────────────────────────────────────────────────────────────┘
```

**Kolory sekcji (jak w kodzie):**
- Zniszczone: `#ff7b7b`
- Zrootowane: `#ffd54a`
- Ocalałe: `#7ad0a0`

**Styl:** spójny z **C-12** (pełnoekranowy overlay, winieta, separator ◆) — **NIE** mały modal w ramce 5C.

**Przyciski:**
- **← Wróć do podsumowania** — outline złoty → wraca do C-12
- **Rozegraj ponownie** — primary złoty (jak GAP-02)

**Referencje:**
- Brief: `docs/ux/DESIGN-BRIEF-C21-koniec-bitwy-v2.md` § C-23
- Kod: `gra/src/battle/endDetails1E.ts`
- Screenshot PRZED: zrób z playtestu po kliknięciu „Szczegóły bitwy”

**DoD:**
- [ ] 2 kolumny ATK/OBR z 3 sekcjami każda
- [ ] Przykładowe dane (min. 3 typy jednostek, liczby ×N)
- [ ] Stan pusty „Brak” w sekcji bez strat
- [ ] Przyciski na dole w jednej linii

---

#### **GAP-02 · C-12 v3 — Koniec bitwy + „Rozegraj ponownie” + PORAŻKA**

**Status dziś:** C-12 v2 ma tylko **Szczegóły** + **Powrót do mapy**. Cursor dodał **Rozegraj ponownie** — brak w mockupie.

**Plik deliverable:**  
`The Game - C12 Koniec bitwy v3 2026-07-05 (1E).dc.html`  
*(aktualizacja v2 — nie kasuj v2, nowy plik v3)*

**Wymagane stany w JEDNYM pliku (3 sekcje @1920):**

| Sekcja | Co pokazać |
|--------|------------|
| **A · ZWYCIĘSTWO** | Jak C-12 v2 + **3 przyciski:** Rozegraj ponownie (primary) · Szczegóły (outline) · Powrót do mapy (outline) |
| **B · PORAŻKA** | Tytuł **PORAŻKA** (czerwony akcent subtelny, nie krzykliwy) · te same 3 karty strat · Łupy = 0 · Bohater opcjonalnie „—” · **te same 3 przyciski** |
| **C · Podpowiedź** | Dyskretna linia nad przyciskami: *„Ta sama armia · pełne HP · wynik na mapę dopiero po Powrocie”* |

**Logika przycisku Rozegraj ponownie (copy):**
- Nie wraca na mapę
- Resetuje bitwę tymi samymi armiami, pełne HP
- Wynik bitwy trafia na mapę **dopiero** po „Powrót do mapy”

**Referencje:**
- Obecny mockup: `The Game - C12 Koniec bitwy v2 (1E).dc.html`
- Kod: `gra/src/battle/endScreen1E.ts`

**DoD:**
- [ ] 3 stany w jednym `.dc.html`
- [ ] Kolejność przycisków: **Rozegraj** · Szczegóły · Powrót
- [ ] PORAŻKA ≠ tylko podmiana słowa — subtelna zmiana kolorystyki (np. mniej złotego blasku)

---

### P1 — brak mockupu popupów deploy (przyciski są, treść popupów = Cursor)

W `C06 Deployment v4` są **przyciski** Formacja · Konnica · Linie · Taktyka — ale **otwarte popupy** istnieją tylko dla Taktyka (przykład) i Strategia (osobny plik). Reszta = kod lane.

**Wspólne wymagania popupów deploy:**
- Zakotwiczenie **nad** przyciskiem toolbar (jak popup Taktyka w C06 v4)
- Ramka 2px złota · gradient panelu 1E
- Nagłówek uppercase 11px · `#e8d88a`
- Pozycja listy: **min. 36px wysokość** wiersza · ten sam padding co **Strategia v4**
- Szerokość: Formacja/Konnica ~220px · Linie ~240px · Taktyka ~300px

---

#### **GAP-03 · Popup Formacja**

**Plik:** `The Game - C06 Popup Formacja v1 2026-07-05 (1E).dc.html`

**Kontekst:** Faza **deploy** · dolny toolbar · przycisk **Formacja** otwarty.

**Opcje (dokładnie z gry — 3 pozycje):**

| Opcja | Efekt (hint pod nagłówkiem, opcjonalnie) |
|-------|------------------------------------------|
| **Dystans** | Łucznicy z przodu |
| **Piechota** | Piechota z przodu |
| **Oblężenie** | Machiny z przodu |

**Stan aktywny:** wiersz podświetlony (jak aktywna doktryna w popup Taktyka v4).

**Kod:** `battleScene.ts` → `_buildDeployToolbar` → `fmtPopup`

---

#### **GAP-04 · Popup Konnica**

**Plik:** `The Game - C06 Popup Konnica v1 2026-07-05 (1E).dc.html`

**Opcje (2 pozycje):**

| Opcja | Hint |
|-------|------|
| **Z boku** | Konnica na skrzydłach |
| **Z tyłu** | Konnica za liniami |

---

#### **GAP-05 · Popup Linie**

**Plik:** `The Game - C06 Popup Linie v1 2026-07-05 (1E).dc.html`

**Układ:** dwie sekcje w jednym popupie:

**Sekcja 1 — Piechota:** przyciski **`1` · `2` · `3`** (linie głębokości)  
**Sekcja 2 — Łucznicy:** przyciski **`1` · `2` · `3`**

Aktywny numer = złote podświetlenie (jak chip aktywny).

**Kod:** `battleScene.ts` → `_renderDeployLinesPopup`

---

#### **GAP-06 · Popup Taktyka v2 (sync z grą)**

**Plik:** `The Game - C06 Popup Taktyka v2 2026-07-05 (1E).dc.html`

**Problem:** Mockup C06 v4 ma przykładowe nazwy (*Natarcie*, *Obrona / mur tarcz*, *Odwrót taktyczny*). **Gra ma inne 4 doktryny:**

| Doktryna | ID w kodzie |
|----------|-------------|
| **Obrona** | defensive |
| **Atak** | steady |
| **Szturm** | aggressive |
| **Ostrzał** | skirmish |

**Dodatkowo w popupie:**
- Nagłówek grupy: np. **„Grupa 1 · 20”**
- Hint: *„Postawa taktyczna grupy w walce (auto):”* (deploy) lub *„…grupa wykona ją na turze (SPACJA):”* (walka R)

**Widoczne w:** deploy **i** tryb R (toolbar tylko Taktyka + Strategia).

**Referencja stylu:** otwarty popup Taktyka w `C06 Deployment v4` — popraw **copy**, nie layout.

---

### P2 — doprecyzowanie / uzupełnienie v4.1 (Design już wspomniał w MELDUNKU)

Te elementy **częściowo są** w v4.1 — potrzebujemy **dopinki** w osobnym pliku lub aktualizacji C09/C06:

---

#### **GAP-07 · C-09 v5 — puste sloty + karta routed**

**Plik:** `The Game - C09 Roster lewy panel v5 2026-07-05 (1E).dc.html`

**Co dopisać vs v4:**

1. **Pusty slot siatki** — gdy armia ma np. 8 kart w rzędzie 6 — pokaż **placeholder komórki** (obramowanie przerywane, bez ikony) zamiast „dziury”
2. **Karta routed** — opacity ~50% · czerwony akcent morale · etykieta „rout” (jak mini-klatka w C09 v4, linia 59)
3. **Karta martwa** — opacity ~40% · „✕” lub „padł”
4. **Stopka rosteru:** `Zaznaczone: 2 · Grupa 1` (już jest w v4 — utrzymaj)

**NIE zmieniaj:** filtrów · Odznacz/Grupuj/Rozgrupuj · siatki 6 kol · szer. 368px

**Referencja:** `MELDUNEK-POLE-BITWY-v4.1.md` § „Puste sloty rosteru” · „Karta zabitej/routed”

---

#### **GAP-08 · C-06 v5 — top bar cluster (Ty ⌂20 ⚔60 ➹30 ·110 VS …)**

**Plik:** sekcja w `The Game - C06 Deployment v5 2026-07-05 (1E).dc.html` **lub** osobny crop `@1920` tylko top bar

**Problem:** W grze cluster liczb jest ciasny; Design prosił o **gap** między ikoną SVG a liczbą + separatory.

**Docelowe liczby obu stron:** `20 · 60 · 30 · 110` (symetrycznie — MELDUNEK v4.1)

**Decyzja do mockupu:** strzałka **↓** przed „Ty” — jest w grze, brak w mockupie → **dodaj do v5** albo explicite „usuń” w DESIGN-do-UI

---

#### **GAP-09 · Tooltip karty jednostki (hover)**

**Plik:** `The Game - C09 Tooltip karta jednostki v1 2026-07-05 (1E).dc.html`

**Kontekst:** Po najechaniu na kartę w rosterze (0,3 s) — dziś stary panel Q3 Cursor (**ukryty**). Potrzebny **lekki tooltip 1E** zamiast panelu bocznego.

**Pola MIN (z kodu):**
- Nazwa jednostki
- HP bieżące / max
- Morale %
- Grupa N
- Typ: Konnica / Piechota / Łucznicy

**Styl:** mały panel przy kursorze/karcie · ramka złota · **NIE** pełny panel „20 zaznaczonych”

---

### P3 — opcjonalnie (nice to have)

#### **GAP-10 · C-22 Baner flash wyniku**

**Plik:** `The Game - C22 Baner wyniku v1 2026-07-05 (1E).dc.html`

Krótki overlay (1–2 s) przed C-12: duży napis **„Zwycięstwo atakującego!”** / **„Zwycięstwo obrońcy!”** · pole przyciemnione · bez przycisków.

Brief: `DESIGN-BRIEF-C21-koniec-bitwy-v2.md` § C-22

---

## 4. Czego NIE projektować

| Element | Dlaczego |
|---------|----------|
| **Stary panel Q3** („20 zaznaczonych”, STOJ/WYC, Doktryna) | Legacy Cursor — **usuwamy w kodzie** po porcie tooltipu GAP-09 |
| **Logika paska mocy** (proporcje 58/42 itd.) | To **dane gry** — Design tylko szata paska (już w C06 v4) |
| **Mapa 3D / heksy** | Placeholder silnika — poza scope Design HUD |
| **Panel Generała** (osobny duży panel) | Osobny temat — nie ten ZIP |

---

## 5. Mapowanie → kod (dla DESIGN-do-UI)

| Mockup | Moduł lane |
|--------|------------|
| C-23 | `gra/src/battle/endDetails1E.ts` |
| C-12 v3 | `gra/src/battle/endScreen1E.ts` |
| Popup Formacja/Konnica/Linie/Taktyka | `gra/src/battle/battleScene.ts` → `_buildDeployToolbar` |
| C-09 v5 | `gra/src/battle/battleScene.ts` + `battleHudTheme.ts` |
| Tooltip | `gra/src/battle/battleScene.ts` → `_unitTooltip` |

---

## 6. Checklist DoD (cała paczka)

- [ ] ZIP: `POLE-BITWY-v5-gap-2026-07-05.zip`
- [ ] `DESIGN-do-UI_POLE-BITWY-v5-gap.md` (mapowanie region → kod)
- [ ] `MANIFEST.txt` (lista plików + wersje)
- [ ] `support.js` obok `.dc.html`
- [ ] Zero emoji · tokeny 1E · @1920
- [ ] PNG @1920 opcjonalnie → `docs/ux/pipeline/02-po-design/grupa-C/`
- [ ] Meldunek: **`MELDUNEK-POLE-BITWY-v5-gap.md`** (krótko: co nowe vs v4.1)

---

## 7. Workflow po dostarczeniu

```
Design ZIP v5-gap → Maciej akceptacja wizualna → Lane UI port skin → Opus review → kanon POLE-BITWY
```

Lane **nie publikuje kanonu** — flaga `→ MASTER: GOTOWE` w `dyspozycje/UI-DO-MASTERA.md`.

---

## 8. Referencje w repo

| Plik | Rola |
|------|------|
| `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html` | Interaktywna lista zadań + ścieżki playtestu |
| `docs/ux/WKLEJKA-DESIGN-START-POLE-BITWY-v5-GAP.md` | Blok do wklejenia Designowi |
| `docs/ux/claude-design/DESIGN-do-UI_POLE-BITWY-v5-gap.md` | Szablon handoff (wypełnisz w ZIP) |
| `docs/ux/DESIGN-BRIEF-C21-koniec-bitwy-v2.md` | Brief C-21/C-22/C-23 |
| `docs/ux/claude-design/_dist/.../MELDUNEK-POLE-BITWY-v4.1.md` | Poprzednia paczka + notatki |
| `docs/ux/MASTER-DELTA-POLE-BITWY-vs-mockupy.md` | Decyzje Macieja Hak 1 |

---

*Lane UI · The Game · POLE-BITWY v5 GAP · 2026-07-05*
