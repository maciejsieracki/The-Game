# Studnia

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `studnia` |
| **tytuł** | Studnia |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Studnia** — budynek (Zdrowie), epoka Kamień. Koszt od **15** pracy, utrzymanie **1** ¤/t. Technologia **Gospodarka wodna**.

---

## Wiki‑M

### Co robi
Studnia wzmacnia miasto w kategorii **Zdrowie**. Poziom 1: **+1 pkt szczęścia** (+1 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**5** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 15 pracy
- **Każdy kolejny poziom:** +5 pracy
- **Utrzymanie:** 1 ¤/turę
- Technologia **Gospodarka wodna**.
- **Uwaga:** Studnia miejska — dostęp do czystej wody (+Zdrowie proxy). Osobno: Łaźnia publiczna (termy rzymskie, epoka Żelaza).
### Strategia gracza
Buduj **przed** przekroczeniem progu zagęszczenia (pop > 4) lub po podboju obcego miasta — szczęście podnosi też **porządek**.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 1 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Zdrowie

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 15 | **2 tur** | +1 pkt szczęścia | 1 ¤/t |
| Poziom 2 | 20 | **2 tur** | więcej (patrz niżej) | 1 ¤/t |
| Poziom 3 | 25 | — | **+3 pkt szczęścia** | 1 ¤/t |

Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.

**Przyspieszenie za złoto:** jeśli brakuje **0** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).

## Rys historyczny

Studnia to jedna z najstarszych form infrastruktury wodnej, pozwalająca osadom sięgać po wodę gruntową tam, gdzie brakowało rzeki czy jeziora na powierzchni. Już w epoce neolitu ludzie kopali głębokie szyby wzmacniane drewnem lub kamieniem, a najstarsze zachowane studnie, jak te odkryte w Cypr czy Izraelu, liczą sobie ponad osiem tysięcy lat. Dostęp do stałego źródła czystej wody decydował o tym, gdzie w ogóle mogła powstać trwała osada, a studnie publiczne stawały się naturalnym miejscem spotkań mieszkańców, wymiany plotek i lokalnych wieści. W starożytnym Rzymie i miastach islamskiego świata budowano studnie ozdobne z kamiennym cembrowaniem i mechanizmami wyciągowymi, traktując je jako element prestiżu miejskiego obok fontann. Utrzymanie studni w czystości było sprawą życia i śmierci — zanieczyszczona woda gruntowa bywała przyczyną epidemii dziesiątkujących całe miasta, co czyniło troskę o studnie jednym z pierwszych obowiązków władz lokalnych.
