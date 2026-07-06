# C → INTEGRATOR F: rebuild PLAYTEST-WALKA (2026-07-01)

**Status:** GOTOWE (częściowy publish — bez kanonu)  
**Flaga:** CZEKA na pełną bramka F → `Gra-podglad.html`

---

## Co zrobiono (Grupa C — unblock playtest Macieja)

1. **Build Vite** → `$TEMP\civ-dist\index.html`
2. **Skopiowano** (ten sam bundle):
   - `Gra-podglad-PLAYTEST-WALKA.html`
   - `Gra-podglad-ROBOCZA.html`
   - `Gra-podglad-PLAYTEST-MAPA.html`
3. **NIE nadpisano** `Gra-podglad.html` (kanon — wymaga pełnej bramki + Opus)

**MD5 PLAYTEST-WALKA / ROBOCZA / PLAYTEST-MAPA:** `9AC325821135770E38831FF33C3A985C`

---

## Weryfikacja bundle vs stary PLAYTEST (28.06)

| String | Stary PLAYTEST | Nowy |
|--------|----------------|------|
| `Pole 3D z murem` | brak | ✅ |
| `Szanse auto-walki (M armii)` | brak | ✅ |
| `Pole bitwy · deployment` | ✅ | brak |

---

## Zawartość buildu (poza preBattle A)

- Fix **szans preBattle = M armii** (auto-walka v2b) — `auto-battle-power.ts`, `main.ts`, `preBattle.ts`
- Test: `gra/tools/auto-battle-power-test.cjs` — 14/14
- Combat-test: 6/6 (przed buildem)

**Uwaga:** Paczka P1–P4 Grupy A (siegeMapPanel, A1-Q12) jest w **kodzie źródłowym** — ten build ją zawiera o ile była już w `main.ts`/UI przed vite build.

---

## Co F ma zrobić dalej

1. Pełna bramka: `gra/tools/bramka-test-publish.ps1` (typecheck + 17 suitów + smoke)
2. Publish kanon `Gra-podglad.html` po Opus
3. Sync md5 PLAYTEST-* z kanonem (jak dotychczas)

---

## Playtest Macieja (teraz)

```
Gra-podglad-PLAYTEST-WALKA.html          ← dwuklik, Ctrl+F5
Gra-podglad-ROBOCZA.html                 ← ten sam bundle
Gra-podglad-PLAYTEST-MAPA.html?playtest=mapa   ← preset mapy (po otwarciu dodaj param w pasku URL jeśli trzeba)
```

Instrukcja: `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md`
