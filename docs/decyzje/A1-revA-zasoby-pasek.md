# A1 — Rev. [A] pasek górny: kolumna zasobów

| Pole | Wartość |
|------|---------|
| **ID** | A1-revA |
| **Data** | 2026-06-26 |
| **Status** | **ZAMKNIĘTE** (Maciej) · **A1-Q11 = A** (2026-06-27) |

---

## Decyzja Maciej

**[A] lewa strona** = jedna kolumna **wszystkich zasobów imperium** (nie grupy Ekonomia/Polityka/Społeczne).

**Kolejność zasobów:**

| # | Zasób | Format | Klik |
|---|-------|--------|------|
| 1 | **Żywność** | zapasy państwa + **+X/t** (B5) | **nie** |
| 2 | **Złoto** | wartość + **+X/t** | tooltip |
| 3 | **Praca** | wartość + **+X/t** | tooltip |
| 4 | **Badania** | **+X PN/t** + nazwa tech + **%** | **→ drzewko** |
| 5 | **Bogactwo** | wartość + **+X/t** (dawniej Wealth, D3) | tooltip |
| 6 | **Ludność** | suma ludności miast + **+X/t** | tooltip |
| 7 | **Kultura** | wartość + **+X/t** (A1-Q11=A) | tooltip; szczegóły → 🎭 [C] / overlay Q12a |

**[A] prawa strona:** Epoka (pasek %) · Nacja · Osiedla · Tura · Dyplomacja.

**Usunięte / scalone:**

- Osobny blok „Epoka & Badania" → Badania w zasobach, Epoka po prawej
- Osobny blok „Żywność państwa" → wiersz Żywność w kolumnie
- Toolbar **[C] 📦 Zasoby** → **OUT** (liczby tylko na [A])
- **[C] v1.0** = **Cuda · Budowa** (2 ikony)

---

## A1-Q11 — ZAMKNIĘTE (2026-06-27)

**Decyzja Macieja:** **A** — **Kultura** na liście zasobów [A] (poz. 7, po Ludności): wartość + **+X/t**, tooltip.

**Nie dotyczy:** **Moc** [A′] + Zaufanie/Respekt w dyplomacji → [`P-A-power-kanon.md`](P-A-power-kanon.md)

---

## Lane — nowe pola HUD (propozycja)

| Pole | Źródło |
|------|--------|
| `zywnosc` + `zywnoscRate` | B5 / `empire-food.ts` |
| `ludnosc` + `ludnoscRate` | suma `city.population` + przyrost/turę |
| `bogactwo` + `bogactwoRate` | Wealth / D3 |
| `kultura` + `kulturaRate` | tick `totalKultura` / `empireBalance` |
| Etykieta UI | **Bogactwo** (PL), nie „Wealth" |

Handoff: `docs/czaty/DO-MASTERA.md` · sync: `A1-HUD-HUMO-CAP-SPECYFIKACJA.md` · `A1-HUD-SCHEMAT-MAPA-D1B.md`
