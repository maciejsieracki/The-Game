# Manpower (rekruci)

## Metadane

| id | `manpower-rekruci` |
| tytuł | Manpower — pula rekrutów |
| kategoria | Wojsko i miasto |
| poradnik_ref | Część VII §47.2b |
| json_ref | `epoka-ludnosc-manpower.json`, `manpower.ts`, `miasto-params.json` |

---

## Wiki‑S

**Manpower** to pula rekrutów **per miasto** — zużywasz ją przy werbie jednostek bojowych (nie ludność miasta). Koszt jednostki = pełny slot populacji epoki (`manpowerNaLudka`) we wszystkich epokach, w tym **Epoka 1 (Kamień)** = **1000** — tak samo jak od Brązu wzwyż. Regeneracja **2% max/turę** (oblężone miasto: 0).

---

## Wiki‑M

### Jak działa

| Element | Opis |
|---------|------|
| **Pula max** | Skaluje się z populacją miasta i epoką (`manpowerNaLudka`) |
| **Koszt rekrutacji** | `manpowerNaJednostke` per epoka |
| **Regeneracja** | 2% puli maksymalnej na turę (~50 tur do pełna) |
| **Oblężenie** | Brak regeneracji, gdy miasto oblężone |
| **Zwiadowca** | Koszt Manpower = **0** |

### Epoka 1 i późniejsze — jednolity koszt (od 2026-08-10, `R-MANPOWER-EPOKA1-500-VS-1000=A`)

| Epoka | `manpowerNaJednostke` | Efekt |
|-------|----------------------|-------|
| **1 — Kamień** | **1000** (= `manpowerNaLudka`) | **1 jednostka** na slot populacji przy pełnej puli — tak samo jak w epokach 2+ |
| **2+ — Brąz, Żelazo…** | = `manpowerNaLudka` | **1 jednostka** na slot przy pełnej puli |

*Historia: od 2026-08-03 do 2026-08-10 epoka 1 miała połowiczny koszt (500, ~2 jednostki/slot) — test cofnięty decyzją `R-MANPOWER-EPOKA1-500-VS-1000=A` (przy większej liczbie miast skala rekrutacji z połowicznym kosztem była zbyt gigantyczna).*

### Rekrutacja a ludność

Rekrutacja **nie odejmuje** mieszkańców miasta (`jednostka_koszt_ludnosci = 0`). Jedyny „ludzki" koszt werbu to **Manpower**. Wyjątek: **założenie miasta** (panel Budowa) pobiera **1 ludność** z miasta-źródła — to nie jest rekrutacja.

### Bonusy cywilizacji

Niektóre typy mają mnożnik puli/regeneracji (np. Rzymianie ×2) — `civs.json`.

**Powiązane:** [[Założenie miasta]] · Część VII §47 · katalog jednostek

---

## Przykład liczbowy

Miasto **pop 10**, epoka Kamienia, max Manpower ≈ **10000** (10 × `manpowerNaLudka` epoki 1 = 10 × 1000). Koszt włócznika = **1000** (`manpowerNaJednostke` epoki 1) → **10** włóczników przy pełnej puli. Po werbie 3 jednostek (3000 MP) regeneracja +**200**/turę (2% z 10000).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md` §47.2b

---

## Historia / decyzje

Maciej 2026-08-03: `manpowerNaJednostke` ep1 **1000→500**. **COFNIĘTE 2026-08-10** (`R-MANPOWER-EPOKA1-500-VS-1000=A`): epoka 1 wraca do pełnej wartości **1000** (jak epoki 2+) — przy większej liczbie miast skala rekrutacji z połowicznym kosztem była zbyt gigantyczna. Maciej 2026-07-21: rekrutacja bez kosztu ludności miasta. Hasło dodane rev. G 2026-08-04.
