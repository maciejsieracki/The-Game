# Design — poprawka W1e-rev (Epoki Kamień + Brąz)

> **Od:** Maciej (playtest kanon `f8fb4a6…`) · **Lane:** tylko konsumuje zip (Wariant A)  
> **NIE prosić Macieja o playtest** do czasu `master` po zipie.

---

## START — W1e-rev (2 pliki SVG)

**Kontekst:** kreator krok 2 · trzy karty epok. **Żelazo** (skrzyżowane miecze) — **OK, bez zmian**.

Maciej **zmienia** ikony Kamienia i Brązu — wspólny język: **narzędzie / broń epoki**, nie architektura.

| Epoka | Obecna ikona | Decyzja Macieja |
|-------|--------------|-----------------|
| **Kamień** | namiot / kolumny ❌ | **Młot kamienny** (główka kamienna + trzonek) |
| **Brąz** | ingot + trzon (młot) ❌ | **Jeden miecz brązowy** — liściasty, typ „brąz epoki brązu” |
| **Żelazo** | skrzyżowane miecze ✅ | **bez zmian** |

---

### 1. `epoch-kamien.svg` — młot kamienny

**Semantyka:** proste narzędzie kamienne — **główka** (owal / klin / kamień związany) + **trzonek** (2–3 linie).  
**NIE:** namiot, partenon, osada, topór z otworem (poprzednia propozycja **wycofana**).

**Referencje (opcjonalnie):**  
`brand-book/referencje-maciej/W1e-rev-topor-kamien-glowki-ref.png` — tylko inspiracja „kamień”; **forma = młot**, nie topór.

**Obecny plik (do wymiany):**

```svg
<path d="M4 9 12 4.5 20 9Z"/>
<path d="M7 11v6M12 11v6M17 11v6M5.5 17h13"/>
```

---

### 2. `epoch-braz.svg` — miecz liściasty (brąz)

**Semantyka:** **jeden** miecz — klinga liściasta (wąska u rękojeści → szeroka w środku → szpic), lekki **grzbiet** (midrib), prosta **rękojeść** + mały **jelec**.  
**NIE:** ingot, młot, dwa miecze.

**Referencja foto (Maciej):**  
`brand-book/referencje-maciej/W1e-rev-miecz-brazu-ref.png`  
→ uproszczenie do **3C line @24**, czytelne w medalionie 64×64.

**Obecny plik (do wymiany):**

```svg
<g transform="rotate(16 12 12)">
  <rect x="5.5" y="4.6" width="13" height="4.2" rx="1.3"/>
  <path d="M12 8.8V20"/>
</g>
```

---

### Zasady wspólne

- Styl: **3C minimal line** · `viewBox="0 0 24 24"` · `stroke="currentColor"` · ~1.3–1.4
- **NIE** zmieniać: `epoch-zelazo.svg`, `epoch-icon-map.json`
- Notka w `eksport/HANDOFF.md` (sekcja W1e-rev)
- Zip → Maciej (`docs/ux/claude-design/`)

**Design wpisz:** `START — W1e-rev`

---

## Lane (po zipie)

| Batch | Pliki |
|-------|--------|
| W1e-rev | `epoch-kamien.svg` + `epoch-braz.svg` → `gra/.../brand/epochs/` |
| MASTER | `master` → playtest Macieja krok 2 |

**Flaga:** CZEKA Design

---

## Status (2026-07-02)

**W1e-rev:** ✅ **Design GOTOWE** (Claude sign-off wizualny 2026-07-02) · sync Lane · kanon `a3ea9863…` · **CZEKA playtest Macieja** krok 2.
