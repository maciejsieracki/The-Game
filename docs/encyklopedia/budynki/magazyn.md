# Magazyn

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `magazyn` |
| **tytuł** | Magazyn |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Magazyn** — budynek (Produkcja+Pieniadz), epoka Brąz. Koszt od **20** pracy, utrzymanie **1** ¤/t. Technologia **Handel**.

---

## Wiki‑M

### Co robi
Magazyn wzmacnia miasto w kategorii **Produkcja+Pieniadz**. Poziom 1: **+1 pracy** (+1 na poziom), **+1 złota** (+1 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**8** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 20 pracy
- **Każdy kolejny poziom:** +8 pracy
- **Utrzymanie:** 1 ¤/turę
- Technologia **Handel**.
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 1 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Produkcja+Pieniadz

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 20 | **2 tur** | +1 pracy, +1 złota | 1 ¤/t |
| Poziom 2 | 28 | **3 tur** | więcej (patrz niżej) | 1 ¤/t |
| Poziom 3 | 36 | — | **+3 pracy, +3 złota** | 1 ¤/t |

Przy +1 złota/t, utrzymanie 1 ¤/t → netto **+0 ¤/t**. Koszt 20 pracy przy 10/t ≈ **2 tur** pracy — złotem „zwraca się" po ok. **20 tur** (uproszczenie, bez inflacji).

**Przyspieszenie za złoto:** jeśli brakuje **0** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
