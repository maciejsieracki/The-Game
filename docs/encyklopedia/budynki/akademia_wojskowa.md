# Akademia wojskowa

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `akademia_wojskowa` |
| **tytuł** | Akademia wojskowa |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Akademia wojskowa** — budynek (Wojsko), epoka Żelazo. Koszt od **80** pracy, utrzymanie **4** ¤/t. Technologia **Sztuka wojenna**.

---

## Wiki‑M

### Co robi
Akademia wojskowa wzmacnia miasto w kategorii **Wojsko**. Poziom 1: **+3 pracy** (+1 na poziom), **+2 złota** (+1 na poziom), **+15 % mnożnika Daniny** (+4 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**18** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 80 pracy
- **Każdy kolejny poziom:** +18 pracy
- **Utrzymanie:** 4 ¤/turę (+2 ¤/poziom)
- Technologia **Sztuka wojenna**.
Warunek: wymaga Koszary.
- **Uwaga:** Mnoznik % dotyczy sily i exp WSZYSTKICH jednostek szkolonych w miescie; prereq elitarnych jednostek top-tier Zelaza — styk UNITS
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 4 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Wojsko

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 80 | **8 tur** | +3 pracy, +2 złota, +15 % mnożnika Daniny | 4 ¤/t |
| Poziom 2 | 98 | **10 tur** | więcej (patrz niżej) | 4 ¤/t |
| Poziom 3 | 116 | — | **+5 pracy, +4 złota, +23 % mnożnika Daniny** | 4 ¤/t |

Przy +2 złota/t, utrzymanie 4 ¤/t → netto **+-2 ¤/t**. Koszt 80 pracy przy 10/t ≈ **8 tur** pracy — złotem „zwraca się" po ok. **80 tur** (uproszczenie, bez inflacji).

**Przyspieszenie za złoto:** jeśli brakuje **60** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
