# Prototyp UX — Okolica na mapie 3D (Civ V)

**Cel:** osobny podgląd **poza grą główną** — jedna mapa 3D na środku (jak Civ V), overlay siatki + plony + 👤, panele boczne. **Bez drugiej mapy** w panelu.

## Jak otworzyć

1. **Dwuklik:** `Gra-podglad-OKOLICA-UX.html` (katalog główny projektu).
2. **Ctrl+F5** jeśli widzisz starą wersję.

> To **nie** jest `PLAYTEST-MIASTO` ani `ROBOCZA` — tylko sandbox UX do oceny layoutu okolicy.

## Co zobaczysz (layout Civ V)

| Strefa | Zawartość |
|--------|-----------|
| **Góra (cienki pasek)** | Etykieta prototypu + przycisk **Zamknij** |
| **Lewo (~280px)** | Nazwa miasta, ludność, pasek wzrostu, **lista plonów** (🍞🔨💰🔬🎭), produkcja, budynki, rekrutacja |
| **Prawo (~300px)** | Okolica (profil + statystyki), suwaki handlu, Wealth, praca, społeczeństwo, zdrowie… |
| **Środek** | Mapa 3D + tabliczka miasta u góry + przycisk **Wróć na mapę** u dołu |

## Sterowanie

- **Lewy klik heks** — przypisz / zabierz 👤 (ta sama logika co w grze)
- **Przeciągnij** — obrót kamery (tylko w środkowej strefie mapy)
- **Kółko myszy** — zoom
- **WASD** — przesuw
- **Esc** lub **Wróć na mapę** — zamknij panel

## Checklist (Maciej)

- [ ] **Lewo:** plony pionowo (jak Civ), kolejka produkcji, budynki, jednostki
- [ ] **Prawo:** okolica u góry, suwaki handlu i pracy; klik na mapie = 👤
- [ ] **Środek:** tabliczka miasta + przycisk „Wróć na mapę”

## Dla developera

| Plik | Rola |
|------|------|
| `gra/src/okolicapreview/main.ts` | Boot prototypu |
| `gra/src/okolicapreview/cityUxFrame.ts` | Ramka: góra / lewo / prawo |
| `gra/src/render/cityOkolicaOverlay.ts` | Overlay 3D (docelowo dla Integratora) |
| `gra/src/okolicapreview/vite.okolicapreview.config.ts` | Build osobny |

**Build:**

```powershell
cd gra
npx vite build --config src/okolicapreview/vite.okolicapreview.config.ts
Copy-Item dist-okolicapreview/src/okolicapreview/index.html ..\Gra-podglad-OKOLICA-UX.html
```

**MD5 (2026-06-29, religia na pasku):** `198CD7D110004D2CB05586D8B7C35268`

## Pasek zasobów — imperium + dopisek miasta (2026-06-29)

Format: **liczba globalna** + **`+X`** (wklad tego miasta / turę).

| Wskaźnik | Baza (globalnie) | `+` (to miasto) | Uwagi |
|----------|------------------|-----------------|--------|
| 👥 Ludność | — | tylko miasto | lokalnie |
| 🍞 Żywność | zapasy państwa | netto / turę | B5 empire-food |
| 🔨 Praca | **pula imperium** (zapas) | +produkcja / turę | tooltip: ile idzie do budowy po podziale pracy |
| 💰 Złoto | **skarbiec** | +przychód / turę | rekrutacja, Kup |
| 🔬 Nauka | **bank nauki** | +/turę | globalny pool badań |
| 🎭 Kultura | suma imperium / turę | +/turę | granice miasta |
| 🛕 Religia | **suma wiernych** religii państwa | +szerzenie z tego miasta / turę | imperium łącznie w tooltipie |
| ⚖ Porządek | — | % miasta | lokalnie |

**Zasada ogólna (państwo + miasto):** duża liczba = **suma jednostek surowca w imperium** (zapas lub stan); **`+X`** = **wkład tego miasta / turę**; tooltip pokazuje też **sumę wszystkich miast / turę** tam, gdzie ma to sens (religia, później HUD mapy).

**Backlog:** ten sam schemat na **HUD mapy świata** po wyjściu z miasta — Maciej zaproponuje osobny układ wizualny (`hud.ts` / D1b).

## Mini-karty budynków / jednostek (v0.2 — 2026-06-28)

### Budynki — tooltip na miniaturze (D-BUDYNKI: A)
- Najedź na **ikonę budynku** (złota ramka) → po ~0,4 s **tooltip** z bonusami, kosztem, tech (bez rozwijania listy).
- Brak przycisku ⓘ.

### Jednostki — mini 3D + staty przy hover (D-JEDNOSTKI: B)
- Każdy wiersz ma **miniaturę 3D** z `buildUnitModel()` (ten sam model co mapa/bitwa).
- Najedź na miniaturę → **karta statystyk** obok (atak, obrona, ruch, HP, koszt…).
- Kolejka rekrutacji — ten sam wzorzec.

**Pliki:** `gra/src/ui/unitMiniPreview.ts`, `buildingHoverTooltip.ts`, `cityPanel.ts`

## Mini-karty budynków / jednostek (v0.1 — archiwum)

- ~~Miniatura + ⓘ rozwijana szuflada~~ — zastąpione v0.2 powyżej.

## Rekrutacja jednostek (v0.1)

- **Rekrutuj** = płacisz 💰 → jednostka trafia do **Kolejki rekrutacji**.
- **Max 1 jednostka gotowa na turę** na miasto.
- Prototyp: **„▶ Następna tura”** na dole ekranu; gotowe jednostki w **Garnizonie**.

### Backlog Grupa D (później)

- Limit rekrutacji / turę zależny od **wielkości** lub **typu cywilizacji** (zamiast stałej `1`).
- **Licznik ludności** — osobny temat; Maciej poda zastosowanie po fixie rekrutacji.

## ⏳ Otwarte decyzje (podglądy)

**Zamknięte 2026-06-28:** D-BUDYNKI=A, D-JEDNOSTKI=B — patrz [`DECYZJE-PODGLAD-BUDYNKI-JEDNOSTKI.md`](DECYZJE-PODGLAD-BUDYNKI-JEDNOSTKI.md)

**Playtest:** najedź ikonę budynku (tooltip) · najedź mini 3D jednostki (staty obok).

**Handoff docelowy:** Integrator wpienie `cityOkolicaOverlay` + tryb panelu miasta w `main.ts` (🟡 cross-lane).
