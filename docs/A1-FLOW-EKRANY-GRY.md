# A1 — Flow ekranów gry (od menu do mapy strategicznej)

| Pole | Wartość |
|------|---------|
| **ID** | A1-FLOW |
| **Data** | 2026-06-26 |
| **Status** | **ZAMKNIĘTE** (Maciej — punkt startu = menu główne) |

---

## łańcuch ekranów (v0.1 mockupy)

```
[S0] MENU GŁÓWNE          [S1] NOWA GRA (5 kroków)        [S2] MAPA ŚWIATA (silnik)
Gra-podglad-MENU.html  →  Makieta-flow-nowa-gra.html  →  Gra-podglad.html
     ↑                           │                              │
     └──── ☰ Menu [A] ───────────┴── Wznów (po zapisie — później) ┘
```

**Aktualizacja 2026-06-27:** kreator + mockupy menu; [S2] = `Gra-podglad.html`. Bez kreatora silnik przekierowuje na menu mockup.

---

## [S0] Menu główne — **punkt startu gry**

**Plik:** `UI/Gra-podglad-MENU.html`  
**Moduł docelowy:** `gra/src/ui/mainMenu.ts`

| Przycisk | v0.1 mockup | Docelowo |
|----------|-------------|----------|
| **◆ Nowa Gra** | → otwórz `Makieta-flow-nowa-gra.html` | `newGameFlow` krok 1 |
| **Kontynuuj** | szary — brak zapisów | ostatni autosave (SILNIK) |
| **Wczytaj grę** | szary — brak zapisów | lista save |
| **Ustawienia** | panel w tym samym pliku (demo) | audio/wideo/UI globalne |
| **O grze** | placeholder | credits |
| **Wyjdź** | toast / zamknij | exit app |

**Styl:** ciemne tło + złoto, Palatino, emblem — **wzorzec wizualny** dla całej gry (menu, kreator, HUD).

Maciej (2026-06-26): *to jest pierwszy etap przed wyborem cywilizacji i dalej.*

---

## [S1] Kreator nowej gry

**Plik:** `UI/Makieta-flow-nowa-gra.html`  
**Moduł docelowy:** `gra/src/ui/newGameFlow.ts`

| Krok | Ekran | Treść |
|------|-------|--------|
| **1** | Intro | Witaj w The Game — opis 4X |
| **2** | **Cywilizacja** | Wybór nacji, bonusy, jednostka specjalna |
| **3** | Epoka | Start epoki (Kamień / Brąz…) |
| **4** | Ustawienia | Trudność, rozmiar mapy, opcje |
| **5** | Generowanie | Progress → start partii |

Po kroku 5 → **mapa strategiczna [S2]**.

---

## [S2] Mapa strategiczna (silnik + HUD D1B)

**Plik:** `Gra-podglad.html` (playtest + kanon)  
**Alias:** `UI/Makieta-HUD-D1B-preview.html` → redirect  
**Wejście z kreatora:** `?from=kreator` + `sessionStorage` (`civ-mock-new-game`)  
**Bez kreatora:** auto-redirect → `UI/Gra-podglad-MENU.html`

Powrót do menu: **☰ Menu** (prawy górny róg [A]) → [S0].

---

## Co NIE jest osobnym „etapem startu"

| Element | Uwaga |
|---------|--------|
| Banner „MOCKUP HUD" w D1B | Tylko dev — znika w kanonie |
| Stary `Makieta-HUD-mapa-swiata.html` | **Redirect** → ROBOCZA |
| `Gra-podglad-HUD.html` | **Redirect** → ROBOCZA |

---

## Kolejność mockupów do akceptacji (Maciej)

1. **[S0] Menu** — `Gra-podglad-MENU.html` ✓ (+ link do flow)
2. **[S1] Nowa gra** — `Makieta-flow-nowa-gra.html` ✓ (+ auto → HUD)
3. **[S2] HUD mapy** — `Makieta-HUD-D1B-preview.html` ✓ P0+P1 kliknięcia
4. **Checklist** — `docs/MACIEJ-HUD-CHECKLIST-D1B.md`
5. **Spięcie linków** — Menu → Flow → HUD ✓ (2026-06-26)

---

## Powiązane pliki

| Plik | Rola |
|------|------|
| `UI/_INDEX.md` | Katalog mockupów UI |
| `UI/Spec-UI.md` | Kontrakty `mainMenu`, `newGameFlow`, `hud` |
| `docs/decyzje/P-A-power-kanon.md` | Power na [A′] — tylko [S2] |
