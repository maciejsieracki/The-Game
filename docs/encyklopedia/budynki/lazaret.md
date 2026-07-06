# Lazaret

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `lazaret` |
| **tytuł** | Lazaret |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Lazaret** — budynek (Zdrowie+Wojsko), epoka epoka 5. Koszt od **55** pracy, utrzymanie **2** ¤/t. Technologia **Medycyna**.

---

## Wiki‑M

### Co robi
Lazaret wzmacnia miasto w kategorii **Zdrowie+Wojsko**. Poziom 1: **+1 nauki** (+1 na poziom), **+1 pkt szczęścia** (+1 na poziom), **+5 % mnożnika handlu** (+2 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**12** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 55 pracy
- **Każdy kolejny poziom:** +12 pracy
- **Utrzymanie:** 2 ¤/turę (+1 ¤/poziom)
- Technologia **Medycyna**.
- **Uwaga:** Regeneracja HP jednostek stacjonujacych w miescie; mnoznik % do tempa regeneracji - styk UNITS. PARKOWANIE: budynek epoki Sredniowiecze (epokaWejscia=4); poza cap v0.1 (max epoka=3=Zelazo) -- nie usuwamy, aktywuje sie w pozniejszej epoce. techUnlock docelowo tech sredniowieczna (zostaje Medycyna jako placeholder; nie wymyslac nowej techy przed decyzja Macieja).
### Strategia gracza
Buduj **przed** przekroczeniem progu zagęszczenia (pop > 4) lub po podboju obcego miasta — szczęście podnosi też **porządek**.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 2 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Zdrowie+Wojsko

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 55 | **6 tur** | +1 nauki, +1 pkt szczęścia, +5 % mnożnika handlu | 2 ¤/t |
| Poziom 2 | 67 | **7 tur** | więcej (patrz niżej) | 2 ¤/t |
| Poziom 3 | 79 | — | **+3 nauki, +3 pkt szczęścia, +9 % mnożnika handlu** | 2 ¤/t |

Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.

**Przyspieszenie za złoto:** jeśli brakuje **35** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
