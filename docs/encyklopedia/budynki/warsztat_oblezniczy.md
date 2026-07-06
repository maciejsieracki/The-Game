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

**Warsztat oblężniczy** — budynek (Wojsko), epoka Żelazo. Koszt od **65** pracy, utrzymanie **3** ¤/t. Technologia **Oblężnictwo**.

---

## Wiki‑M

### Co robi
Warsztat oblężniczy wzmacnia miasto w kategorii **Wojsko**. Poziom 1: **+4 pracy** (+2 na poziom), **+2 złota** (+1 na poziom), **+10 % mnożnika handlu** (+3 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**15** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 65 pracy
- **Każdy kolejny poziom:** +15 pracy
- **Utrzymanie:** 3 ¤/turę (+1 ¤/poziom)
- Technologia **Oblężnictwo**.
Warunek: wymaga Koszary.
- **Uwaga:** Odblokowuje budowę Katapulty w mieście (maWarsztatOblezniczy). Taran i Wieża = in-siege przy oblężeniu — styk UNITS
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 3 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Wojsko

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 65 | **7 tur** | +4 pracy, +2 złota, +10 % mnożnika handlu | 3 ¤/t |
| Poziom 2 | 80 | **8 tur** | więcej (patrz niżej) | 3 ¤/t |
| Poziom 3 | 95 | — | **+8 pracy, +4 złota, +16 % mnożnika handlu** | 3 ¤/t |

Przy +2 złota/t, utrzymanie 3 ¤/t → netto **+-1 ¤/t**. Koszt 65 pracy przy 10/t ≈ **7 tur** pracy — złotem „zwraca się" po ok. **65 tur** (uproszczenie, bez inflacji).

**Przyspieszenie za złoto:** jeśli brakuje **45** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
