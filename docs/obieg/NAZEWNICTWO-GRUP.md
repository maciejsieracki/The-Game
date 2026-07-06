# 🏷️ NAZEWNICTWO GRUP — jedyny słownik (kanon)

> **Jedyne źródło prawdy nazw.** W KAŻDEJ komunikacji (czaty, pliki obiegu, handoffy, raporty) używamy **wyłącznie `Grupa A–F`**.
> **ZAKAZ** starych nazw: `UX`, `UI` (jako grupa), `MIASTO`, `EKONOMIA`, `DANE`, `DYPLOMACJA`, `UNITS`, `MAPA` (jako grupa), `Silnik`/`SILNIK` (jako rola), „przekaż do UX/UI".
> Decyzje: NAZ-1…NAZ-4 (2026-06-28) → `docs/obieg/REJESTR-DECYZJI.md`.

---

## Sześć grup (kanon)

| Grupa | Nazwa | Za co odpowiada | Główne pliki kodu |
|---|---|---|---|
| **A** | **Mapa świata** | mapa 3D, render, ruch jednostek, ulepszenia terenu, mgła, minimapa, **HUD mapy** (paski, toolbar, koniec tury, panel jednostki), preBattle C1, oblężenie C3 (wejście z mapy) | `map/*`, `render/*`, `ui/hud`, `ui/preBattle`, pickery mapy |
| **B** | **Miasto / Ekonomia / Technologia** | panel miasta, produkcja, surowce, populacja, porządek/bunt, kultura/religia, Wealth, żywność, Power, **drzewko technologii + nauka** | `economy.ts`, `cities.ts`, `production.ts`, `wealth.ts`, `ui/cityPanel` |
| **C** | **Walka** | bitwa 3D (Total War), oblężenie na polu bitwy, balans macierzy C4, combat — od wyboru Auto/Ręczna | `combat.ts`, `battle/*`, `siege.ts`, `manualBattle.ts` |
| **D** | **Cywilizacje / Dyplomacja / AI** | 9 typów cywilizacji + bonusy nacji, dyplomacja (audiencja), **AI rywali + archetypy + barbarzyńcy** | `data/civs`, `loader.ts`, `diplomacy.ts`, `ai.ts`, `barbarians.ts` |
| **E** | **Start / Meta / UI** | menu główne, kreator nowej gry, defaulty startu, warunki zwycięstwa (meta), **globalny shell UI / menu** (NIE panel miasta, NIE HUD mapy) | `ui/mainMenu`, `ui/newGameFlow`, `victory.ts` |
| **F** | **Integrator** | `main.ts`, wpinanie modułów wszystkich grup, bramka testów, publikacja `Gra-podglad-ROBOCZA.html` | `main.ts` |

---

## Słownik zamian (stara nazwa → kanon)

| Stara nazwa (ZAKAZ) | Kanon |
|---|---|
| lane `MAPA`, „Grupa MAPA" | **Grupa A** |
| `MIASTO`, `EKONOMIA`, lane miasto/ekonomia | **Grupa B** |
| `UNITS`, lane walki | **Grupa C** |
| `CYW`, `CYWILIZACJE`, `DANE`, `DYPLOMACJA`, `AI` (jako grupa) | **Grupa D** |
| `Meta`, menu/start, `UX`/`UI` (jako grupa) | **Grupa E** |
| `Silnik`, `SILNIK`, „Grupa F/Silnik" (jako rola) | **Grupa F (Integrator)** |
| „przekaż do UX", „przekaż do UI" | „przekaż do **Grupa A/B/E**" (wg tematu UI) |
| `→ SILNIK: GOTOWE` | `→ INTEGRATOR: GOTOWE` |

### UI — gdzie trafia jaki ekran (NAZ-1 = A)

| Ekran UI | Grupa |
|---|---|
| Menu, kreator nowej gry, globalny shell | **E** |
| Panel miasta (`cityPanel`) | **B** |
| HUD mapy, preBattle, minimapa, pickery mapy | **A** |
| UX bitwy 3D | **C** |
| Panel dyplomacji | **D** |

---

## Ważne wyjątki (NIE zmieniać)

- **Foldery na dysku:** `Civ-MAPA/`, `Civ-UNITS/`, `Civ-CYWILIZACJE/` — nazwy katalogów, zostają.
- **Pliki lane w `dyspozycje/`** (`MAPA.md`, `EKONOMIA.md`, `UNITS.md`, `CYWILIZACJE.md`, `UI.md`, `SILNIK.md`) — to **historia operacyjna**; nie zmieniamy nazw (NAZ-4 = A). Nowe handoffy nazywaj wg grup.
- **Słowa potoczne** („ekonomia", „mapa", „walka" jako temat) — OK; zakaz dotyczy nazw jako **etykiet grup**.

---
🔗 Role i przepływ: `docs/obieg/_ZASADY.md` · Cała gra: `docs/ROADMAP.md` · Rejestr decyzji: `docs/obieg/REJESTR-DECYZJI.md`
