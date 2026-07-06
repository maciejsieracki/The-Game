# Decyzja Macieja — strefy klimatyczne MAPA (2026-07-05)

| Pole | Wartość |
|------|---------|
| **Decyzja** | **A wąski** |
| **Maciej** | 2026-07-05 ~09:50 |
| **Dyspozycja** | `dyspozycje/_handoff/MASTER-do-MAPA_strefy-klimat-A-waski-2026-07-05.md` |

## A — pełne 3 strefy w generatorze + render

| Strefa (oś `r`, środek mapy) | Zawartość |
|-------------------------------|-----------|
| **Pas suchy (środek)** | wąski **~15%** wysokości mapy · pustynie **tylko** tutaj |
| **Nad i pod pasem** | **dżungla** (las tropikalny — render D-B2-3) |
| **Dalej (góra/dół mapy)** | **umiarkowany** — dużo lasu |

## Wykluczone (na razie)

- **B** — tylko suchy pas bez dżungli/umiarkowanego
- **C** — później / odłożone

## Pliki docelowe (lane MAPA)

- `gra-robocza/src/map/gen-helpers.ts` — `climateZoneAt(q, r, height)` + progi pustyni/lasu ze strefy
- `gra-robocza/src/render/mapRenderStyle.ts` — dżungla ze strefy, nie hash losowy
