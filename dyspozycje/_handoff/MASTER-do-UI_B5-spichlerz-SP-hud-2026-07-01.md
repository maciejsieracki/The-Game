# MASTER → UI / MAPA (Grupa A): B5-SP HUD zapasów + panel cleanup

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** |
| **Batch** | `B5-SP-HUD` |
| **Decyzja Macieja** | SP4=C · SP4-szczegóły=A · SP6-HUD=B |
| **Warstwa** | 🟡 cross (`hud.ts`, `cityPanel.ts`) — **bez `main.ts`** |

---

## AC lane UI/A

### HUD mapy (`gra/src/ui/hud.ts` + wire w `main.ts` **tylko przez kontrakt** — wire robi F)

1. **SP6-HUD=B:** pasek zasobów — żywność wojska jako **`{zapasy} / {max}`** (np. `142 / 200`).
2. Przy `max === 0` (brak Spichlerza): sensowny fallback (np. sama liczba `0` lub `— / —` + tooltip „Zbuduj Spichlerz”).
3. Przy głodzie wojska: istniejący styl `glod-wojska` / czerwony label — bez regresji.
4. Delta `/t` (netto) — zachować jeśli już jest (Q2=B delta na HUD).

### Panel miasta (`cityPanel.ts`)

5. **SP4=C + SP4-szczegóły=A:** **usuń** chip/wiersz **📦 Zapasy** z zakładki Spichlerz i z karty „Spichlerz — szczegóły”.
6. **Zostaw:** pasek bufora wzrostu 🍞, suwak Rozwój miast / armia (9A), chipy ludność/ETA/netto/bufor, wskaźnik Spichlerz w mieście/imperium.
7. Teksty: nie pokazuj „magazyn żywności” — **Spichlerz** / **Wzrost ludności**.

---

## Zależności

| Od | Co |
|----|-----|
| **EKONOMIA B5-SP-LIMIT** | `maxZapasy` per owner — można startować UI z mock `max` równolegle, final z lane B |

---

## Meldunek

Append `UI-DO-MASTERA.md` (lub `MAPA-DO-MASTERA.md` jeśli tylko HUD):

```
→ MASTER: GOTOWE · batch B5-SP-HUD
Handoff F: UI-do-INTEGRATOR_B5-spichlerz-SP-hud-wire.md (jeśli main.ts wymaga nowych pól w buildHudState)
```

**NIE** publikuj ROBOCZA / kanon.
