# HANDOFF: F → SILNIK — flow UI + batch playtest (GOTOWE do weryfikacji)

**Data:** 2026-06-27  
**Od:** Grupa F (playtest Maciej)  
**Do:** SILNIK / MASTER  
**Status:** **WPIĘTE** (kod w `main.ts` · ROBOCZA `6aedd5ce…`)  
**Flaga:** GOTOWE

---

## Decyzja Macieja

Kreator (`Makieta-flow-nowa-gra.html`) i mockupy menu **zatwierdzone wizualnie** — używać jako kanonicznej ścieżki playtestu. Stare HUD-y zastąpione przekierowaniami na silnik.

---

## Kanoniczny flow (playtest)

```
UI/Gra-podglad-MENU.html
  → UI/Makieta-flow-nowa-gra.html
  → Gra-podglad-ROBOCZA.html?from=kreator
```

`sessionStorage['civ-mock-new-game']` → `tryAutostartFromMockFlow()` w `main.ts`.

---

## Co zsynchronizowano (F, 2026-06-27)

| Plik | Zmiana |
|------|--------|
| `UI/Makieta-flow-nowa-gra.html` | ikony, fazy generowania, → ROBOCZA |
| `UI/Makieta-START.html` | launcher [S0]→[S1]→[S2] |
| `UI/Makieta-HUD-D1B-preview.html` | alias → ROBOCZA |
| `UI/Makieta-HUD-mapa-swiata.html` | **redirect** → ROBOCZA (stary bookmark) |
| `UI/Gra-podglad-HUD.html` | **redirect** → ROBOCZA |
| `UI/mockup-embed.js` | ← Mapa → ROBOCZA (fallback) |
| `UI/_INDEX.md`, `docs/A1-FLOW-EKRANY-GRY.md` | opis flow |

---

## Batch silnika (main.ts) — ten sam build ROBOCZA

| Temat | Status |
|-------|--------|
| Mgła start + minimapa | ✅ `seedStartingFog`, pierścień explored r=14 |
| Ghost załóż miasto | ✅ `ikonaIdToBronzeCiv` (fix crash rzymianie) |
| Kreator autostart | ✅ `from=kreator` |

**ROBOCZA md5:** `8839726AE1AA0CF0329E1DBA07BAD745`  
**Smoke:** OK

**Otwarte MAPA:** rzeki przez mgłę (`F-do-MAPA_fog-rzeki.md`) — nie blokuje UI flow.

---

## DoD (SILNIK)

- [ ] Playtest: MENU → kreator → ROBOCZA (brak czerwonego overlay)
- [ ] Stare URL (`Gra-podglad-HUD.html`, `mapa-swiata`) → ROBOCZA
- [ ] Bramka: logic + smoke + battle-smoke
- [ ] Opus APPROVE → `Gra-podglad.html` (kanon)
- [ ] `mainMenu.ts` / `newGameFlow.ts` — docelowo ten sam UX co mockupy (osobny batch UI, nie blokuje)

---

**→ SILNIK: proszę zweryfikować i wpiąć do gry (kanon).**

Powiązany handoff: `_handoff/F-do-SILNIK_mgla-ghost-start-batch.md`
