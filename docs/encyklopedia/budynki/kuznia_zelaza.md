# Kuźnia żelaza

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `kuznia_zelaza` |
| **tytuł** | Kuźnia żelaza |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Kuźnia żelaza** — budynek (Produkcja+Wojsko), epoka Żelazo. Koszt od **60** pracy, utrzymanie **3** ¤/t. Technologia **Obróbka żelaza**.

---

## Wiki‑M

### Co robi
Kuźnia żelaza wzmacnia miasto w kategorii **Produkcja+Wojsko**. Poziom 1: **+8 pracy** (+4 na poziom), **+2 złota** (+1 na poziom), **+8 % mnożnika handlu** (+3 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**15** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 60 pracy
- **Każdy kolejny poziom:** +15 pracy
- **Utrzymanie:** 3 ¤/turę (+1 ¤/poziom)
- Technologia **Obróbka żelaza**.
Warunek: zelazo w zasiegu.
- **Uwaga:** Mnoznik % dotyczy sily jednostek zelaznych produkowanych w miescie; wymaga dostepu do zelaza
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 3 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Produkcja+Wojsko

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 60 | **6 tur** | +8 pracy, +2 złota, +8 % mnożnika handlu | 3 ¤/t |
| Poziom 2 | 75 | **8 tur** | więcej (patrz niżej) | 3 ¤/t |
| Poziom 3 | 90 | — | **+16 pracy, +4 złota, +14 % mnożnika handlu** | 3 ¤/t |

Przy +2 złota/t, utrzymanie 3 ¤/t → netto **+-1 ¤/t**. Koszt 60 pracy przy 10/t ≈ **6 tur** pracy — złotem „zwraca się" po ok. **60 tur** (uproszczenie, bez inflacji).

**Przyspieszenie za złoto:** jeśli brakuje **40** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
