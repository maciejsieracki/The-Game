# MAPA → MASTER: Podgląd miast BRAZU — 4 nacje (D12=A)

**Data:** 2026-06-26 · **Od:** Grupa A · **Status:** GOTOWE (podgląd HTML)  
**Decyzja Macieja:** D12=A — zobaczyć Sumer/Egipt/Inkowie/Zulusi przed wpieciem do kanonu.

---

## Co przesyłam

Modele już w `gra/src/render/bronzeCity.ts` (`buildBronzeCity`).

**Podgląd D12** — rozszerzenie `gra/src/bronzepreview/`:

| URL | Widok |
|-----|--------|
| `?pack=d12` | 4 nacje × 2 rzędy (bez murów / z murami), poziomy 1→10 |
| `?civ=sumer` | Sumer — izolowany, 10 poziomów |
| `?civ=egipt` | Egipt |
| `?civ=inka` | Inkowie |
| `?civ=zulu` | Zulusi |

Eksport: `D12_BRONZE_CIVS` w `bronzepreview/main.ts` = `['sumer','egipt','inka','zulu']`.

---

## Jak otworzyć (Maciej / MASTER)

```bash
cd gra
npm run dev
# przeglądarka:
http://localhost:5173/src/bronzepreview/index.html?pack=d12
```

Build standalone (opcjonalnie):

```bash
npx vite build --config src/bronzepreview/vite.bronzepreview.config.ts
```

---

## Co MASTER robi po akceptacji Macieja

1. Brak zmian w `bronzeCity.ts` jeśli Maciej OK
2. Wpięcie do kanonu: `render/cities.ts` już wywołuje `buildBronzeCity(civ, level, …)` — MASTER tylko mapuje `civId` z civs.json
3. **NIE publikować kanonu** dopóki Maciej nie zaakceptuje podglądu D12

---

## DoD

- [x] Podgląd 4 nacji (poziomy 1–10, wariant z/bez murów)
- [x] Linki nawigacji w HUD podglądu
- [ ] Akceptacja wizualna Macieja
- [ ] MASTER: kanon po sign-off

---

## Kiedy handoff gotowy

**GOTOWE** — czeka na ocenę Macieja (screenshot / playtest podglądu).
