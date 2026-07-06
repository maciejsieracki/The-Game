# Akademia

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `akademia` |
| **tytuł** | Akademia |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Akademia** — budynek (Nauka), epoka Żelazo. Koszt od **70** pracy, utrzymanie **3** ¤/t. Technologia **Filozofia**.

---

## Wiki‑M

### Co robi
Akademia wzmacnia miasto w kategorii **Nauka**. Poziom 1: **+6 nauki** (+3 na poziom), **+2 kultury** (+1 na poziom), **+10 % mnożnika handlu** (+3 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**15** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 70 pracy
- **Każdy kolejny poziom:** +15 pracy
- **Utrzymanie:** 3 ¤/turę (+1 ¤/poziom)
- Technologia **Filozofia**.
Warunek: wymaga Biblioteka.
- **Uwaga:** Mnoznik % dotyczy globalnej puli nauki (nadbudowka nad Biblioteka)
### Strategia gracza
Miasto naukowe: ustaw suwak handlu więcej na **naukę (20%)**, suwak pracy **70% budynki**.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 3 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Nauka

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 70 | **7 tur** | +6 nauki, +2 kultury, +10 % mnożnika handlu | 3 ¤/t |
| Poziom 2 | 85 | **9 tur** | więcej (patrz niżej) | 3 ¤/t |
| Poziom 3 | 100 | — | **+12 nauki, +4 kultury, +16 % mnożnika handlu** | 3 ¤/t |

Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.

**Przyspieszenie za złoto:** jeśli brakuje **50** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
