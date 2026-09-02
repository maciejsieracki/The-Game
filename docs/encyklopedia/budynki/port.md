# Port handlowy

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `port` |
| **tytuł** | Port handlowy |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Port handlowy** — budynek (Pieniadz), epoka Brąz. Koszt od **30** pracy, utrzymanie **2** ¤/t. Technologia **Żegluga**.

---

## Wiki‑M

### Co robi
Port handlowy wzmacnia miasto w kategorii **Pieniadz**. Poziom 1: **+1 pracy** (+0 na poziom), **+5 złota** (+3 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**10** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 30 pracy
- **Każdy kolejny poziom:** +10 pracy
- **Utrzymanie:** 2 ¤/turę (+1 ¤/poziom)
- Technologia **Żegluga**.
Warunek: wybrzeze morskie lub rzeka.
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 2 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Pieniadz

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 30 | **3 tur** | +1 pracy, +5 złota | 2 ¤/t |
| Poziom 2 | 40 | **4 tur** | więcej (patrz niżej) | 2 ¤/t |
| Poziom 3 | 50 | — | **+1 pracy, +11 złota** | 2 ¤/t |

Przy +5 złota/t, utrzymanie 2 ¤/t → netto **+3 ¤/t**. Koszt 30 pracy przy 10/t ≈ **3 tur** pracy — złotem „zwraca się" po ok. **10 tur** (uproszczenie, bez inflacji).

**Przyspieszenie za złoto:** jeśli brakuje **10** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).

## Rys historyczny

Port handlowy to brama łącząca miasto ze światem — miejsce, gdzie od tysięcy lat cumowały statki wiozące towary, ludzi i idee między odległymi krainami. Fenicjanie, a później Grecy i Rzymianie, budowali rozbudowane systemy nabrzeży, magazynów i latarni morskich, czyniąc z portów takich jak Kartagina czy Ostia filary swoich imperiów handlowych. Port wymagał nie tylko dogodnego położenia przy wybrzeżu czy ujściu rzeki, lecz też infrastruktury do rozładunku, przechowywania towarów i ich dalszego transportu w głąb lądu. Miasta portowe często rozwijały się szybciej niż śródlądowe ośrodki, ponieważ handel morski był tańszy i szybszy niż transport lądowy, a kontakt z obcymi kulturami sprzyjał wymianie technologii i wierzeń. Kontrola nad ważnym portem bywała też źródłem konfliktów — wiele wojen starożytności i średniowiecza toczono właśnie o dostęp do kluczowych szlaków morskich.
