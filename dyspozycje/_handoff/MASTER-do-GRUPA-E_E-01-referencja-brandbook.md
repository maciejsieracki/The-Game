# MASTER → Grupa E — referencja E-01 PO (brand book)

**Data:** 2026-07-01  
**Flaga:** GOTOWE referencja · **nie zastępuje** waszego exportu z Figmy  
**Maciej:** review w czacie MASTER · auto PNG

---

## Co przesyłam

| Co | Ścieżka |
|----|---------|
| HTML wzorcowy menu PO | `docs/ux/figma/grupa-E/E-01-PO-REFERENCJA.html` |
| PNG referencja (1920×1080) | `docs/ux/figma/grupa-E/export/E-01_po_REFERENCJA-MASTER.png` |
| Arkusz ikon 3C Tier 1–5 | `docs/ux/figma/02-icons/preview-tier1-5.png` |
| HTML ikon | `docs/ux/figma/02-icons/preview-tier1-5.html` |

---

## Co Grupa E ma z tym zrobić

1. **Nie kopiuj 1:1** — to **poziom jakości** oczekiwany od Macieja (BLOCK review 2026-07-01).
2. Odtwórz w Figmie frame **E-01** z:
   - ikonami **3C** (instancje ze strony 02 Icons — nie emoji)
   - CTA **Rozpocznij grę** = **Btn 4C outline** (bez pełnego wypełnienia)
   - Georgia **2C** na tytule
   - baseline @ ~20–35% lock (układ tylko)
3. Export **wasz** plik: `docs/ux/figma/grupa-E/export/E-01_po.png`
4. Meldunek: `RAPORT-FIGMA.md` — export PO ✅ · 1/6

---

## DoD akceptacji Macieja

- [ ] Gołym okiem widać **inne ikony** niż baseline PRZED
- [ ] Główny przycisk = **outline 4C**
- [ ] Plik `E-01_po.png` w repo (nie tylko referencja MASTER)

---

## Odświeżenie PNG referencji (lane UI / MASTER)

```bash
cd gra
node tools/export-figma-review-assets.mjs
```

**Status handoff:** GOTOWE · czeka export Grupy E `E-01_po.png`
