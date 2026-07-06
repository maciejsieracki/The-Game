# Archiwum: panel miasta — stan PRZED redesignem ikonowym

**Data archiwizacji:** 2026-06-26  
**Decydent:** Maciej  
**Powód:** nowy model UX — pasek ikon po lewej, treść po prawej (szczegóły poniżej)  
**Status PRZED:** ✅ działający prototyp OKOLICA-UX + wpięcie w grę (`Gra-podglad.html`)

---

## Checksumy snapshotu

| Artefakt | MD5 |
|----------|-----|
| `gra/src/ui/cityPanel.ts` | `6D3292BC6FD832E484AC34C8BD8F9D9D` |
| `Gra-podglad.html` (kanon gry) | `D64D10B152EF442E68A8B6EAD0F51C03` |
| `Gra-podglad-OKOLICA-UX.html` → archiwum | `13E0345725BD8117446F796F6515FD61` |

---

## Kopie zapasowe (przywracanie)

```
gra/src/ui/cityPanel.ts.bak-UX-PRE-IKONY-2026-06-26
gra/src/okolicapreview/cityUxFrame.ts.bak-UX-PRE-IKONY-2026-06-26
docs/archiwum-ux/Gra-podglad-OKOLICA-UX_PRE-IKONY-2026-06-26.html
docs/archiwum-ux/unitMiniPreview.ts.bak-2026-06-26
docs/archiwum-ux/buildingHoverTooltip.ts.bak-2026-06-26
```

---

## Layout PRZED (Civ V — scroll dwóch kolumn)

```
┌─────────────────────────────────────────────────────────────────┐
│ GÓRA: pasek zasobów (👥 🍞 🔨 💰 🔬 🎭 🛕 ⚖) + 🛡 Garnizon + ✕   │
├──────────────┬────────────────────────────┬─────────────────────┤
│ LEWO ~280px  │         MAPA 3D            │ PRAWO ~300px        │
│ (scroll)     │  + tabliczka miasta        │ (scroll)            │
│              │  + Wróć na mapę            │                     │
│ Podział      │                            │ Wzrost (🍞 pasek)   │
│ pracy 🏛↔🛠  │  overlay okolicy 👤        │ Okolica (profil,    │
│              │                            │  statystyki, 👤)    │
│ Produkcja    │                            │                     │
│ i budowa     │                            │ Społeczeństwo:      │
│  · kolejka   │                            │  · Magazyn/spichlerz│
│  · Buduj/Kup │                            │  · Podział handlu   │
│  · Ulepsz    │                            │  · Wealth           │
│  · Budynki   │                            │  · Społeczeństwo    │
│    w mieście │                            │  · Zdrowie          │
│  · Rekrutuj  │                            │  · Kultura          │
│              │                            │  · Surowce w zasięgu│
└──────────────┴────────────────────────────┴─────────────────────┘
```

### Lewa kolumna (`paintCityPanelSections` → `mounts.left`)

| # | Sekcja | Funkcja render | Uwagi |
|---|--------|----------------|-------|
| 1 | **Podział pracy** | `renderPodzialPracy` | Suwak 🏛 produkcja ↔ 🛠 ulepszenia terenu |
| 2 | **Produkcja i budowa** (nagłówek) | — | |
| 3 | Kolejka produkcji | `renderProd` | Postęp, pauza, kolejka, wykup |
| 4 | Dostępne do budowy | `renderBuildList` | **Kup** (💰×2) + **Buduj** (🔨) |
| 5 | Budynki w mieście | `renderBuildingsOwned` | Lista zbudowanych |
| 6 | Rekrutuj jednostkę | `renderPurchasableUnits` | **Rekrutuj** za 💰 |

### Prawa kolumna (`mounts.right`)

| # | Sekcja | Funkcja render | Uwagi |
|---|--------|----------------|-------|
| 1 | Nagłówek miasta + **Wzrost** | `renderCityHeaderCompact` | Ludność, epoka, pasek 🍞 |
| 2 | **Okolica** | `renderOkolica` | Profil pól, tryby (żywność/produkcja/podatki), 👤 na mapie |
| 3 | Społeczeństwo i ekonomia (nagłówek) | — | |
| 4 | Magazyn / spichlerz | `renderMagazyn` | B5 empire-food |
| 5 | Podział handlu | `renderHandelSlidersPanel` | Suwaki % handlu |
| 6 | Wealth | `renderWealth` | Decyzja D3 |
| 7 | Społeczeństwo | `renderSpoleczenstwo` | Sz / Prawo / Porządek |
| 8 | Zdrowie | `renderZdrowie` | |
| 9 | Kultura | `renderKultura` | |
| 10 | Surowce w zasięgu | `renderSurowce` | Na dole prawej kolumny |

### Góra (`mounts.top`)

| Element | Funkcja |
|---------|---------|
| Pasek zasobów Civ V | `renderCivResourceTopBar` |
| Garnizon inline | `renderTopBarGarrison` — 🛡 Garnizon N |

### Dodatkowe strefy

| Strefa | Plik | Rola |
|--------|------|------|
| Detail dock lewy/prawy | `hoverDetailDock.ts` | Rozwijane karty przy hover (szczegóły statów) |
| Map chrome | `renderCivMapChrome` | Tabliczka + przycisk powrotu |
| Drawer fullscreen (legacy) | `showCityPanel` + zakładki | `plony \| produkcja \| miasto \| okolica` — starszy tryb |

---

## Zachowanie produkcyjne (PRZED)

- **Kup budynek:** natychmiast za 💰 (koszt = 2× Praca)
- **Buduj:** kolejka produkcji za 🔨
- **Rekrutuj:** 💰 ze skarbca → kolejka rekrutacji
- **Jeden typ budynku na miasto** — znika z listy gdy zbudowany / w kolejce
- **Podgląd budynków:** tooltip na miniaturze (D-BUDYNKI: A)
- **Podgląd jednostek:** mini 3D + staty hover (D-JEDNOSTKI: B)

---

## Pliki źródłowe (lane UI)

| Plik | Linie (~) | Rola |
|------|-----------|------|
| `gra/src/ui/cityPanel.ts` | ~4500 | Główny panel |
| `gra/src/okolicapreview/cityUxFrame.ts` | ~140 | Ramka Civ V |
| `gra/src/okolicapreview/main.ts` | boot prototypu | |
| `gra/src/ui/unitMiniPreview.ts` | mini 3D jednostek | |
| `gra/src/ui/buildingHoverTooltip.ts` | tooltip budynków | |
| `gra/src/ui/hoverDetailDock.ts` | dock szczegółów | |
| `gra/src/render/cityOkolicaOverlay.ts` | overlay 👤 na mapie | |

**Dokumentacja PRZED:** `docs/grupa-b/OKOLICA-UX-MACIEJ.md`, `docs/grupa-b/DECYZJE-PODGLAD-BUDYNKI-JEDNOSTKI.md`

**Build prototypu:**
```powershell
cd gra
npx vite build --config src/okolicapreview/vite.okolicapreview.config.ts
Copy-Item dist-okolicapreview/src/okolicapreview/index.html ..\Gra-podglad-OKOLICA-UX.html
```

---

## Propozycja Macieja PO (2026-06-26 — do implementacji)

> „Zajmijmy te całe paski ikonami. Po lewej sterowanie, po prawej wyświetlanie.”

### Co ZOSTAJE na miejscu

| Strefa | Element |
|--------|---------|
| **Lewo (góra)** | Podział pracy |
| **Lewo (góra)** | Produkcja — **co jest budowane / rekrutowane teraz** (kolejka aktywna) |
| **Prawo (góra)** | Wzrost |
| **Prawy dół** | Surowce w zasięgu — bez zmian |

### Pasek ikon po lewej (od najważniejszych)

Klik ikony → **treść po prawej** (zamiast scrolla w lewej kolumnie).

| # | Ikona | Treść po prawej (obecna sekcja) |
|---|-------|----------------------------------|
| 1 | **Zarządzanie polami** | Tryby okolicy: żywność / produkcja / podatki / zrównoważone + przycisk **Szczegóły** |
| 2 | *(produkcja aktywna — zostaje u góry lewej, nie ikona)* | — |
| 3 | **Budowa** | Dostępne do budowy (lista Buduj/Kup) |
| 4 | **Rekrutacja** | Lista jednostek do rekrutacji |
| 5 | **Budynki w mieście** | Lista zbudowanych budynków |
| 6 | **Spichlerz** | Magazyn / wzrost (obecny `renderMagazyn`) |
| 7 | **Handel** | Podział handlu (suwaki) |
| 8 | **Porządek** | Społeczeństwo / prawo / porządek |
| 9 | **Zdrowie i kultura** | Zdrowie + kultura (+ ewent. religia?) |

### Otwarte do doprecyzowania (przed kodem)

- [ ] Czy **Okolica** (profil + mapa 👤) idzie pod ikonę „Zarządzanie polami” czy osobno?
- [ ] Czy **Wealth** ma własną ikonę czy wchodzi w Handel?
- [ ] Szerokość paska ikon vs. prawy panel treści
- [ ] Czy detail-dock (hover) zostaje przy nowym układzie?

---

## Następny krok implementacji

1. Mockup w `okolicapreview` (bez ruszania kanonu)  
2. Playtest Macieja na `Gra-podglad-OKOLICA-UX.html`  
3. Po akceptacji → lane UI → Integrator `main.ts`

**Flaga:** `ARCHIWUM UX PRE-IKONY` — nie nadpisywać bez decyzji Macieja.
