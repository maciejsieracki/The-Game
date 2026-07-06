# GRUPA F → MASTER: C-ODSKOK-FANOUT (P0)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-KANON** |
| **Data** | 2026-07-01 |
| **Batch** | `C-ODSKOK-FANOUT` |
| **Poprzedni kanon** | `AB471657E64C0D87F3BA7E3094DE0A1B` (E2-PLAYTEST-B2Q5) |

---

## Scope (lane C — już w `gra/src`)

- `gra/src/game/post-battle-map.ts` — odskok **od atakujących**, tylko ląd
- `gra/src/main.ts` — `mapHexPassableForUnit` via `TerenBazowy` (bez morze/wybrzeże/góry)
- `gra/src/game/playtestOdskok3v3.ts` + pathname `PLAYTEST-ODSKOK`

**Handoff Master:** `MASTER-do-INTEGRATOR_C-odskok-fanout-2026-07-01.md`  
**Lane C:** `C-do-MASTER_odskok-fanout-2026-07-01.md` (ACK Master)

---

## Bramka

| Test | Wynik |
|------|-------|
| post-battle-map | **10/10** |
| army-merge-bounce | **2/2** |
| wire-ekonomia | 29/29 |
| combat | 6/6 |
| civ-bonusy | 33/33 |
| diplomacy | 143/143 |
| ai-test | **193/198** (5× T2S sojusz/handel — pre-P1?) |
| smoke | OK |
| battle-smoke | OK |

**Backup:** `main.ts.bak-INTEGRATOR-C-ODSKOK-2026-07-01` · `Gra-podglad.html.bak-C-ODSKOK-2026-07-01`

---

## Kanon

| Plik | md5 |
|------|-----|
| `Gra-podglad.html` | **`ED4C8E2B67AC86B7245B01FE9F2A20F9`** |
| ROBOCZA + PLAYTEST-* | ten sam bundle |

---

## Playtest Macieja

```
Gra-podglad-PLAYTEST-ODSKOK.html   ← Ctrl+F5
```

Wróg ucieka **od gracza**, **tylko ląd** (nie morze/góry).

---

## Następny (czeka w kolejce F)

**P1 D-SOJUASZ-v12** — **nie** startować przed ACK Master tego batcha.
