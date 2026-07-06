# POWER vs RESPEKT — specyfikacja (Maciej 2026-06-26)

**Status:** **KANON P-A** · globalne współczynniki tylko (bez wag per-cyw)

---

## Nazewnictwo (P-C3 ✅)

| UI PL | EN / kod | Wycofane |
|-------|----------|----------|
| **Moc** | **Power** | **Wpływ** 0–100 |

Szczegóły: `docs/decyzje/P-C3-moc-power-nazwa.md`

---

## Dwa pojęcia

| Pojęcie | Gdzie | Wzór |
|---------|-------|------|
| **MOC** | HUD mapy, overlay | Suma punktów P-A (kod: `power`) |
| **RESPEKT** | Dyplomacja | `100 × Moc_my / (Moc_my + Moc_their)` |

---

## Moc (Power) — kanon P-A

### Surowe miary → współczynniki (`power-params.json`)

| Składnik | Miara | pkt |
|----------|-------|-----|
| Armia | jednostki | 25 |
| Bitwy | wygrane | 25 |
| Ludki | suma slotów populacji | **5** |
| Rekruci | ekw. jednostek | 5 |
| Miasta | liczba | 50 |
| Terytorium | heksy | 0,5 |
| Budynki | wybudowane | 5 |
| Tech | zbadane | 20 |
| Ulepszenia | w terytorium | 5 |

```
power = round(suma składników)
```

### Kalibracja (ep.1, duże imperium)

10 miast · **100 ludków** · … → **Moc = 3020**

### Wyłączone

- Mnożnik × epoka (P-B)
- Wagi / mnożniki Power per cywilizacja (Cyw-12 usunięte)

Balans wyłącznie przez globalne pkt w Panel-B.

---

## Pliki

| Plik | Rola |
|------|------|
| `gra/data/power-params.json` | Kanon |
| `gra/src/game/power-objective.ts` | Silnik |
| `panele-sterowania/Panel-B.xlsx` | Potega-P-A, Manpower-epoki |
| `gra/src/ui/power-labels.ts` | Etykiety PL/EN (P-C3) |

---

*Ostatnia aktualizacja: 2026-06-26 — ludki 5 pkt, wagi wyłączone*
