# MASTER → MAPA: F-CITY-HEX — pomiń dekoracje na hexie miasta

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/F-city-hex-czysty.md`  
**Status:** CZEKA (P2 — po EKONOMIA+SILNIK)  
**Flaga:** → MAPA: CZEKA

---

## Cel

Belt-and-suspenders: nawet jeśli hex nie został jeszcze wyczyszczony (save stary), renderer **nie rysuje** lasu/surowca/ulepszenia na hexach zajętych przez miasto.

| AC | Kryterium |
|----|-----------|
| AC-1 | `buildScene` / overlay rebuild: zestaw `cityHexKeys` → skip forest trees, resource overlay, improvement spawn na tych hexach |
| AC-2 | Kontrakt: opcjonalny param `cityPositions?: {q,r}[]` lub callback — **bez** importu `main.ts` |
| AC-3 | Handoff do SILNIK: jak przekazać listę miast przy `rebuildResourceOverlays` |

**Priorytet:** P2 (logika hexu w EKONOMIA+SILNIK wystarczy na v1; MAPA wzmacnia odporność).
