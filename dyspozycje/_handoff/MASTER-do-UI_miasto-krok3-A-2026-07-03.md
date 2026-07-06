# MASTER → UI lane: miasto · Krok 3 = **A**

> **STATUS: ANULOWANY (2026-07-03)** — audyt: kod miasta identyczny gra=kanon=robocza · lane nie trzeba · patrz `AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`

**Decyzja Macieja:** **A** (2026-07-03) — lane od **kanonu / screenshotów**, Design mockup **później**.  
**Baseline:** `gra-kanon/` md5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`** · **`gra-robocza/` zsynchronizowana** (`sync-kanon-to-robocza.ps1`)  
**Delta:** `_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`  
**NIE:** `main.ts` · **NIE** czekać na Design W3 v3

---

## Cel

Utrwalić i dopracować **chrome wyjścia + okolica na mapie 3D** zgodnie z kanonem — bez nowego mockupu Design.

Kod F ROBOCZA jest **już w kanonie** — lane weryfikuje spójność, ewent. polish CSS, meldunek + screenshoty referencyjne.

---

## Zakres (tor A)

| ID | Element | Pliki | DoD |
|----|---------|-------|-----|
| B-27 | **Mapa** footer · **Wróć na mapę** · Esc | `cityPanel.ts` `renderCivMapChrome` | playtest: 3 ścieżki wyjścia działają |
| B-27 | Tabliczka `.civ-v-map-plaque` | j.w. | nazwa + hint 👤/scroll |
| B-27 | Map chrome widoczny | `cityUxFrame.ts` | nie `opacity:0` |
| B-28 | Okolica toolbar na **mapie** (centrum-dół) | `#cs-okolica-center` | profile + hint auto/ręczny |
| — | Spójność z W4 (7 zakładek, `/t` out) | `cityPanel.ts` | bez regresji zakładek |
| — | Screenshoty (jeśli brak PNG Macieja) | `docs/ux/referencje-miasto-kanon-2026-07-03/` | min. 01–04 z README |

**Overlay zasięgu:** tylko jeśli regresja — właściciel MAPA (`rangeOverlay.ts`); lane UI melduje, nie refaktoruje bez handoff.

---

## Design

**STOP** — nie czekać na `Ekran Miasto W3 v3`. Unfreeze Design dopiero gdy Maciej da **`START — W3-miasto-v3-delta`** po OK playtestu toru A.

---

## DoD lane

- [ ] Porównanie kanon vs delta handoff §2 — brak luk w chrome (lub lista w meldunku)
- [ ] `node tools/smoke.cjs` OK
- [ ] Append `UI-DO-MASTERA.md` → **`→ MASTER: CZEKA`** (playtest Macieja tor A)
- [ ] **NIE** `publish-kanon-snapshot` — Master po OK Macieja

---

## Playtest Macieja (po lane)

`gra-kanon/START.html` · Ctrl+F5 → miasto → **Mapa** / **Wróć na mapę** / **Esc** → okolica toolbar na mapie · auto pól widoczne
