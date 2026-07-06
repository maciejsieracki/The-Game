# Archiwum: panel miasta — stan po sesji UX (topbar + ikony + interakcje)

**Data archiwizacji:** 2026-06-26  
**Slot czatu:** GRUPA-B (`a28467c6-7830-4ab8-bdf3-d1343dacedcc`)  
**Powód:** zamknięcie fazy prototypu UX przed większym tematem #2  
**Status:** ✅ prototyp OKOLICA-UX + PLAYTEST-MIASTO zbudowany; **kanon gry (`Gra-podglad.html`, `main.ts`) NIE ruszany**

---

## Checksumy snapshotu

| Artefakt | MD5 |
|----------|-----|
| `gra/src/ui/cityPanel.ts` | `AED242A8081D523C8E94C2BEB8183711` |
| `gra/src/ui/hoverDetailDock.ts` | `A0BEB0ABFC5277EFE17B4E505ED68149` |
| `Gra-podglad-OKOLICA-UX.html` | `A7BFCEDF403EB6E241E4CFAC0B3A8B14` |
| `Gra-podglad-PLAYTEST-MIASTO.html` | `A7BFCEDF403EB6E241E4CFAC0B3A8B14` |

---

## Kopie zapasowe (przywracanie)

```
gra/src/ui/cityPanel.ts.bak-UX-TOPBAR-2026-06-26
gra/src/ui/hoverDetailDock.ts.bak-UX-TOPBAR-2026-06-26
docs/archiwum-ux/Gra-podglad-OKOLICA-UX_TOPBAR-2026-06-26.html
docs/archiwum-ux/Gra-podglad-PLAYTEST-MIASTO_TOPBAR-2026-06-26.html
```

**Rebuild prototypu:**
```powershell
cd gra
npx vite build --config src/okolicapreview/vite.okolicapreview.config.ts
Copy-Item dist-okolicapreview\src\okolicapreview\index.html ..\Gra-podglad-OKOLICA-UX.html -Force
Copy-Item dist-okolicapreview\src\okolicapreview\index.html ..\Gra-podglad-PLAYTEST-MIASTO.html -Force
```

---

## Layout PO (stan zarchiwizowany)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GÓRA: [NAZWA] [⚔ garnizon chipy] │ 👥 🍞 🔨 💰 🔬 🎭 🛕 ⚖ (klikalne) │ ✕   │
├──────────────┬────────────────────────────┬─────────────────────────────────┤
│ LEWO         │         MAPA 3D            │ PRAWO                           │
│              │                            │                                 │
│ Podział      │                            │ Karta plonów miasta             │
│ pracy        │                            │ Okolica (toolbar + mapa)        │
│              │                            │ Społeczeństwo i ekonomia        │
│ Produkcja    │                            │  · Spichlerz/wzrost             │
│ i budowa     │                            │  · Handel, Wealth, Porządek…    │
│  · kolejka   │                            │                                 │
│  · budynki   │                            │                                 │
│  · rekrutacja│                            │                                 │
└──────────────┴────────────────────────────┴─────────────────────────────────┘
     ↑ lewy dock (garnizon)              ↑ prawy dock (statystyki, okolica)
```

### Górny pasek — statystyki interaktywne

| Stat | Duża liczba | Dopisek | Karta szczegółów |
|------|-------------|---------|------------------|
| 👥 | Ludność miasta | — | `buildTopBarLudnoscDetailCard` |
| 🍞 | Zapasy armii (państwo) | Netto miasta/t | `buildTopBarZywnoscDetailCard` |
| 🔨 | Pula Pracy imperium | 🏛 budynki · 🛠 ulepszenia (ten gród) | `buildTopBarPracaDetailCard` |
| 💰 | Skarbiec | Netto miasta/t | `buildTopBarZlotoDetailCard` |
| 🔬 | Bank nauki lub suma/t | Netto miasta/t | `buildTopBarNaukaDetailCard` |
| 🎭 | Kultura imperium/t | Netto miasta/t | `buildTopBarKulturaDetailCard` |
| 🛕 | Wierni w państwie | Szerzenie w grodzie/t | `buildTopBarReligiaDetailCard` |
| ⚖ | Porządek % (lokalnie) | — | `buildPorzadekDetailCard` (reuse) |

Hover (~220 ms) lub klik → panel po **prawej** (`attachInteractiveDetail` w `hoverDetailDock.ts`).

### Garnizon

- **Usunięty** z lewej kolumny.
- **Chipy** obok nazwy miasta w pasku górnym (`.civ-v-garrison-inline`).
- Hover → **lewy** dock (`renderTopBarGarrison`).

### Lewa kolumna (kolejność)

1. Podział pracy (suwak 🏛 ↔ 🛠)
2. Produkcja i budowa (kolejka, budynki ×3 scroll, posiadane, rekrutacja ×3 scroll)

### Ikony budynków (CSS / emoji)

| Budynek | Ikona |
|---------|-------|
| Stela | CSS obelisk (`.obelisk-ic`) |
| Stolarnia | CSS deski (`.planks-ic`) |
| Mury | 🧱 (nie zamek) |
| Spichlerz | 🌾 (bez zmiany) |
| Fort / warsztat | 🏰 |
| Kuźnia | 🔨 |

### Inne UX z tej sesji

- `LIST_SCROLL_VISIBLE = 3` — budynki i jednostki w scrollu
- Okolica: toolbar profili w jednej linii; ℹ przy „Zarządzanie polami”
- Zamożność: tylko pasek postępu w głównym widoku
- Odstępy sekcji: `gap: 0.48em` na `.civ-ux-panel-scope`

---

## Pliki zmienione (tylko prototyp UX)

| Plik | Zakres |
|------|--------|
| `gra/src/ui/cityPanel.ts` | layout, topbar, ikony, karty statystyk, garnizon |
| `gra/src/ui/hoverDetailDock.ts` | `attachInteractiveDetail`, `showHoverDetailNow` |
| `gra/src/okolicapreview/cityUxFrame.ts` | dual dock (lewy + prawy) — wcześniejsza sesja |
| `gra/src/okolicapreview/main.ts` | hit-test mapy z dockami |
| `gra/src/game/playtestMiastoEkonomia.ts` | wealthState playtest |
| `gra/data/buildings.json`, `tech.json` | Studnia (nazwy) |
| `Gra-podglad-OKOLICA-UX.html`, `Gra-podglad-PLAYTEST-MIASTO.html` | build okolicapreview |

**NIE zmieniano:** `gra/src/main.ts`, `Gra-podglad.html` (kanon czeka integratora + Opus).

---

## Poprzednie archiwum

| Wersja | Plik |
|--------|------|
| PRZED redesignem ikonowym | `panel-miasta-PRE-IKONY-2026-06-26.md` |

---

## Następny temat (#2)

Sesja zamknięta — Maciej przechodzi do **większego tematu #2** (nowy wątek w tym samym lub nowym czacie).  
Pełna korespondencja: `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md`
