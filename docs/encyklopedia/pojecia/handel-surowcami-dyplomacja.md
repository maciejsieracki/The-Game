# Handel surowcami (dyplomacja)

## Metadane

| id | `handel-surowcami-dyplomacja` |
| tytuł | Handel surowcami (dyplomacja) |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII (Dyplomacja) |
| json_ref | `econ-params.json` (`handel_surowce`), `game/diplomacy-value-catalog.ts` |

---

## Wiki‑S

W koszyku negocjacji dyplomacji możesz wymieniać surowce **ilościowe** (drewno, kamień, glina, cegła, ceramika, ruda) w **pakietach po 10 sztuk**. Każdy surowiec ma cenę jednostkową w Punktach Negocjacji (PN) — wartość pozycji koszyka = liczba pakietów × 10 × cena jednostkowa.

---

## Wiki‑M

### Jak działa koszyk

Panel negocjacji (`diplomacyTradeBasket.ts`) pozwala dodać pozycję „surowiec (ilość)" — wybierasz surowiec i liczbę **pakietów**; każdy pakiet to **10 sztuk** (`pakiet_wielkosc`, domyślnie 10, strojenie w `econ-params.json` → `handel_surowce`). Gra pokazuje etykietę w stylu „Drewno ×10 (pakiet) × 3 = 30 szt.".

### Cennik jednostkowy (normal, placeholder do strojenia)

| Surowiec | Cena (¤/szt.) |
|----------|---------------|
| Drewno | 2 |
| Kamień | 3 |
| Glina | 2 |
| Cegła | 5 |
| Ceramika | 6 |
| Ruda | 4 |

Wartość PN pozycji = pakiety × **10** × cena jednostkowa. Np. **2 pakiety Cegły** = 20 szt. × 5 ¤/szt. = **100 PN** w koszyku.

### Warunek dostępności

Surowiec można wystawić do handlu dopiero gdy zapas (stock) w skarbcu ≥ **minimalny próg** (domyślnie **2 szt.** na wszystkich poziomach trudności) — 1 sztuka musi zawsze zostać jako „dostęp" (nie sprzedajesz się do zera).

**Powiązane:** [[Szlaki handlowe]] · Dyplomacja · Bogactwo

---

## Przykład liczbowy

Chcesz kupić **30 sztuk Rudy** od AI: 3 pakiety × 10 szt. × 4 ¤/szt. = **120 PN** wartości w koszyku — dokładasz ekwiwalent (złoto, inny surowiec, ustępstwo) po drugiej stronie, aż koszyk się zrówna wg progu relacji (`PROG_HANDEL_REL`).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md`

---

## Historia / decyzje

Decyzja **C-DYP-SUROWCE-Q1=B** (2026-07-23): ceny jednostkowe surowców w koszyku PN, placeholder do strojenia przez właściciela w panelu Excel (`gen-panel-*.py`) — nie wartości finalne. Wielkość pakietu **10** — `handel_surowce.pakiet_wielkosc`. Hasło dodane 2026-07-23 (audyt CIVPEDII) — funkcja świeża, dotąd bez hasła.
