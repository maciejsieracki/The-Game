# Spichlerz (mechanika państwa)

## Metadane

| id | `spichlerz-mech` |
| tytuł | Spichlerz — zapasy i wzrost |
| kategoria | Miasto i społeczeństwo |
| poradnik_ref | Część VI §39 · budynek → `budynki/spichlerz.md` |

---

## Wiki‑S

**Spichlerz** zmienia dwie rzeczy: po awansie ludności zostaje **50% bufora** wzrostu (bez niego → **0%**), oraz żywność z suwaka **wojsko** trafia do **zapasów państwa** (format **X / 100×liczba Spichlerzy** na pasku mapy).

---

## Wiki‑M

### Bez Spichlerza w imperium

- Bufor wzrostu **zeruje się** po +1 mieszkaniec.  
- Udział suwaka na wojsko **przepada** co turę (nie magazynujesz).  
- Rekrutacja **nigdy** nie jest blokowana brakiem zapasów.

### Ze Spichlerzem (≥1 w imperium)

- Po awansie zostaje **50%** bufora (normal).  
- Zapasy państwa rosną z produkcji (suwak żywności **30% wojsko** domyślnie).  
- Pojemność: **100 × N** Spichlerzy (normal).  
- Wojsko przy zapasach **&lt;0**: **−8%** max HP/t (głód).

### SP1–SP6 (Maciej 2026-07-01)

| ID | Ustalenie |
|----|-----------|
| SP1 | Model hybrydowy zatwierdzony |
| SP2 | 50% bufora po wzroście |
| SP3 | Wystarczy **1** Spichlerz w imperium |
| SP4 | Nazwa UI: **Spichlerz** |
| SP5 | Domyślnie suwak **70/30** rozwój/wojsko |
| SP6 | (playtest sign-off) |

---

## Przykład liczbowy

**Miasto A:** pop **3**, bufor **66/68** (próg = 20 + 3×16 = **68**). Suwak żywności **70% rozwój / 30% wojsko**. Miasto produkuje **12 żywności/t**.

- Na rozwój: 12 × 0,7 = **8,4** → bufor  
- Na wojsko: 12 × 0,3 = **3,6** → 📦 tylko **ze Spichlerzem**

**Awans 3→4 (BEZ Spichlerza):** bufor 68→**0**. Tracisz postęp; 3,6 żywności/t na wojsko **przepada**.

**Awans 3→4 (ZE Spichlerzem):** bufor 68→**34** (50%). Wojsko: **3,6/t** → zapasy (np. 45/100 → 48,6/100).

**Drugi Spichlerz:** limit **200** (100×2). Przy nadprodukcji **+15/t** na wojsko, pełny magazyn w **~10 tur** — potem nadwyżka przepada (planuj konsumpcję wojska).

**Koszt budynku:** 20 pracy, +2 żywności/t poz.1 — budowa ok. **2 tury** przy 10 pracy/t na budynki.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §39 · karta budynku: `encyklopedia/budynki/spichlerz.md`
