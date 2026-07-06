# A-R7 — Łodzie rybackie a terytorium miasta

| Pole | Wartość |
|------|---------|
| **ID** | A-R7 |
| **Ekran** | Mapa świata — budowa ulepszenia |
| **Decyzja Macieja** | **B** — wymaga terytorium miasta (jak Farma) |
| **Data** | 2026-06-26 |
| **Status** | **ZAMKNIĘTE** · kod `gra/src` ✅ · **kanon wymaga rebuild F** |

---

## Skutek w grze

- **Łodzie rybackie** stawiasz tylko w **zasięgu terytorium** miasta (pop + fort/posterunek).
- **Nie** można „cheese'ować" ryb na wybrzeżu/morzu poza granicą kultury.
- Spójne z regułą większości ulepszeń lądowych.

---

## Lane

| Lane | Zadanie |
|------|---------|
| **MAPA** | Gate `withinTerritory` przy placement łodzi |
| **EKONOMIA** | ewent. sync kosztów / JSON |
| **Integrator F** | wpiec w `main.ts` jeśli wymaga callbacku terytorium |

Handoff: audit MAPA R7 · `terrain-improvements.json` (łodzie).
