# P-C3 — Nazwa metryki: **Moc** / **Power**

| Pole | Wartość |
|------|---------|
| **ID** | P-C3 |
| **Decyzja Macieja** | **ZAMKNIĘTE** (2026-06-26) |
| **PL (UI gry)** | **Moc** |
| **EN (docs / i18n)** | **Power** |
| **Wycofane** | **Wpływ** (stary indeks 0–100) — nie używać |

---

## Zasada

| Warstwa | Nazwa | Uwagi |
|---------|-------|--------|
| Gracz widzi (HUD, overlay, kreator) | **Moc** | liczba absolutna P-A, np. 3020 |
| Kod / JSON / testy | `power`, `objectivePower`, `power-params.json` | bez zmiany identyfikatorów |
| Dokumentacja PL | Moc (Power w nawiasie przy pierwszym użyciu) | |
| Dokumentacja EN | Power | |

**Respekt** — bez zmiany nazwy (osobna metryka dyplomatyczna, %).

---

## Implementacja

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/power-labels.ts` | `MOC_LABEL_PL` / `MOC_LABEL_EN` |
| `gra/src/ui/hud.ts` | etykieta środka paska |
| `gra/src/ui/powerOverlayHud.ts` | tytuł overlay, ranking |
| `gra/src/ui/newGameFlow.ts` | „Moc + dominacja” |
| `gra/data/power-params.json` | `_nazewnictwo`, `opcje.hud_etykieta` |

Handoff lane: `dyspozycje/_handoff/P-C3-moc-nazwa-KONTRAKT.md`

---

*Źródło: Maciej, czat MASTER 2026-06-26*
