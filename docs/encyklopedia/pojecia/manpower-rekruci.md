# Manpower (rekruci)

## Metadane

| id | `manpower-rekruci` |
| tytuł | Manpower — pula rekrutów |
| kategoria | Wojsko i miasto |
| poradnik_ref | Część VII §47.2b |
| json_ref | `epoka-ludnosc-manpower.json`, `manpower.ts`, `miasto-params.json` |

---

## Wiki‑S

**Manpower** to pula rekrutów **per miasto** — zużywasz ją przy werbie jednostek bojowych (nie ludność miasta). W **Epoka 1 (Kamień)** koszt jednostki = **500** (~2 jednostki na slot populacji). Od Brązu zwykle = pełny slot epoki. Regeneracja **2% max/turę** (oblężone miasto: 0).

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

### Epoka 1 vs późniejsze (FALA 206)

| Epoka | `manpowerNaJednostke` | Efekt |
|-------|----------------------|-------|
| **1 — Kamień** | **500** | Przy pełnej puli (~1000/slot) werbujesz ~**2 jednostki** na slot populacji |
| **2+ — Brąz, Żelazo…** | = `manpowerNaLudka` | Zwykle **1 jednostka** na slot przy pełnej puli |

### Rekrutacja a ludność

Rekrutacja **nie odejmuje** mieszkańców miasta (`jednostka_koszt_ludnosci = 0`). Jedyny „ludzki" koszt werbu to **Manpower**. Wyjątek: **założenie miasta** (panel Budowa) pobiera **1 ludność** z miasta-źródła — to nie jest rekrutacja.

### Bonusy cywilizacji

Niektóre typy mają mnożnik puli/regeneracji (np. Rzymianie ×2) — `civs.json`.

**Powiązane:** [[Założenie miasta]] · Część VII §47 · katalog jednostek

---

## Przykład liczbowy

Miasto **pop 5**, epoka Kamienia, max Manpower ≈ **5000**. Koszt włócznika = **500** → **10** włóczników przy pełnej puli. Po werbie 3 jednostek (1500 MP) regeneracja +**100**/turę (2% z 5000).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md` §47.2b

---

## Historia / decyzje

Maciej 2026-08-03: `manpowerNaJednostke` ep1 **1000→500**. Maciej 2026-07-21: rekrutacja bez kosztu ludności miasta. Hasło dodane rev. G 2026-08-04.
