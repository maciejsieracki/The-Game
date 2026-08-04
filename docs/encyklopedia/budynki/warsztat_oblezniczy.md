# Warsztat oblężniczy

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `warsztat_oblezniczy` |
| **tytuł** | Warsztat oblężniczy |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Warsztat oblężniczy** — budynek (Wojsko), epoka Żelazo. Koszt **65** pracy + **10× drewno, 10× kamień**, utrzymanie **3** ¤/t. Technologia **Oblężnictwo**. **Maks. 1 poziom.** Odblokowuje **Katapultę** w mieście + **+10% parametrów miękkich** (ścieżka B).

---

## Wiki‑M

### Co robi
Warsztat oblężniczy:

1. **Odblokowuje rekrutację Katapulty** w mieście (`maWarsztatOblezniczy`). **Taran** i **Wieża** to sprzęt oblężniczy budowany **podczas oblężenia**, nie w Warsztacie.
2. **Ekonomia:** **+4 Pracy/t**, **+2 Pieniądza/t**
3. **Ścieżka B:** **+10% parametrów miękkich** po wizycie w mieście (kumuluje z Koszarami/Akademią wojskową do max **+50%**)

**Maks. 1 poziom** — nie 10 poziomów ani mnożnik Daniny.

### Koszty
- **Budowa:** 65 pracy + 10× drewno, 10× kamień
- **Utrzymanie:** 3 ¤/turę
- Technologia **Oblężnictwo**
- **Wymaganie:** **Koszary** (lub Akademia wojskowa jako upgrade Koszar) w tym mieście

### Strategia gracza
Miasto oblężnicze: Warsztat przed kampanią na ufortyfikowane miasta wroga. Katapulta z tego miasta + armia ze ścieżką B.

### Typowe błędy
- Oczekiwanie Tarana/Wieży z kolejki miasta — tylko **Katapulta**.
- Budowa bez Koszar.

**Powiązane:** Katapulta · Koszary · Oblężenie

---

## Przykład liczbowy

| Efekt | Wartość |
|-------|---------|
| Odblokowanie | Katapulta w rekrutacji |
| Ścieżka B | +10% miękkie (z Koszarami +20% = +30%) |

Koszt **65** pracy przy 10/t ≈ **7 tur**.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — katapulta + ścieżka B +10%, koszt kamień nie cegła.
