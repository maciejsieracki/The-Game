# MASTER → UI: Kreator krok 4 — Jakość mapy + Zaawansowane opcje

**Data:** 2026-06-27 · **Decydent:** Maciej · **Makieta:** `UI/Makieta-flow-nowa-gra.html` (zaktualizowana)

---

## Co przesyłam

1. **Nowa karta w kroku 4** — obok **Prędkość gry**: **Jakość mapy** (Niska / Średnia / Wysoka).
2. **Modal „Zaawansowane opcje”** — lista 4 pól (makieta interaktywna, bez silnika).
3. **Kontekst:** gracz wybiera oczekiwany **preset wyglądu mapy** (MAPA przygotuje 3 warianty terenu). **Na v1 mock — bez wpływu na runtime** do czasu batch MAPA+SILNIK.

---

## UI — krok 4 (główna siatka 2×3)

| key | Etykieta | Opcje | Default |
|-----|----------|-------|---------|
| `map_quality` | Jakość mapy | Niska / Średnia / Wysoka | **Średnia** (idx 1) |

Opisy (makieta):
- **Niska** — Lekki styl — lepszy FPS  
- **Średnia** — Zbalansowany wygląd  
- **Wysoka** — Pełne detale terenu  

Ikona: paleta `&#127912;`

**Pliki:** `gra/src/ui/newGameFlow.ts`, `gra/data/ui-params.json` (dodać `map_quality` obok `game_speed`).

**Uwaga:** dziś w `newGameFlow.ts` jest sekcja „Wygląd świata” (`render_quality` + `map_detail`). Po decyzji Macieja o zaawansowanych — przenieść `render_gpu` do modala; **Jakość mapy** = jeden suwak na głównym ekranie.

---

## Zaawansowane opcje (modal) — **decyzja Macieja: B (2026-06-27)**

| key | Etykieta | Opcje v1 |
|-----|----------|----------|
| `map_seed` | Seed mapy | Losowy / Wpisz ręcznie |
| `render_gpu` | Jakość renderu (GPU) | Niska / Średnia / Wysoka |
| `victory_mode` | Warunki zwycięstwa | Power + dominacja / Tylko dominacja typu |
| `barbarians` | Barbarzyńcy | Włączeni / Wyłączeni |
| `battle_mode` | Szczegółowość bitew | Automatyczne / Zawsze ręczna |
| `fog_start` | Widoczność startowa | Mgła standardowa / Cała mapa (debug) |

**NIE w v1:** tryb real-time, zwycięstwo kulturowe/naukowe/dyplomatyczne, mnożnik zasobów startowych.

---

## Co UI ma zrobić

| AC | Kryterium |
|----|-----------|
| AC-1 | Karta **Jakość mapy** w głównej siatce kroku 4 (obok prędkości) |
| AC-2 | Wartość trafia do `NewGameParams` jako `mapQualityLabel` (kontrakt do SILNIK) |
| AC-3 | Modal zaawansowanych z 4 wierszami (jak makieta HTML) |
| AC-4 | Podsumowanie kroku 5 (generowanie) pokazuje Jakość mapy |
| AC-5 | **Bez** podpinania do `buildScene` — flaga w meldunku „UI-only, czeka MAPA preset” |

---

## SILNIK (później, po MAPA preset)

Odbiorca: `main.ts` — `mapQualityLabel` → `MapRenderOptions` / `resolveRenderPreset()`.

Handoff MAPA: 3 presety terenu (Niska/Średnia/Wysoka) — osobny batch.

---

## DoD UI

- [ ] Makieta HTML = wzór wizualny (✅ `UI/Makieta-flow-nowa-gra.html`)
- [ ] `newGameFlow.ts` + `ui-params.json`
- [ ] Meldunek `UI-DO-MASTERA.md`

**Flaga:** GOTOWE spec + makieta · **Decyzja B** zaawansowane → UI implementuje.
