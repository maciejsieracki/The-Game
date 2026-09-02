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

**Magazyn** — budynek (Produkcja+Pieniadz), epoka Brąz. Koszt od **20** pracy, utrzymanie **1** ¤/t. Technologia **Handel**. **Dodatkowo (2026-07-24):** każdy zbudowany Magazyn w imperium podnosi o **+100** pojemność wspólnego magazynu surowców całego państwa (na każdy typ surowca).

---

## Wiki‑M

### Co robi
Magazyn wzmacnia miasto w kategorii **Produkcja+Pieniadz**. Poziom 1: **+1 pracy** (+1 na poziom), **+1 złota** (+1 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**8** od poprzedniego), ale daje większy przyrost.

**Drugi efekt — pojemność magazynu surowców państwa (SUROW-CIV-01, 2026-07-24):** oprócz bonusu produkcji/złota, sama **obecność** wybudowanego Magazynu (dowolny poziom, w dowolnym mieście imperium) podnosi **cap** wspólnej puli surowców logistycznych (drewno, kamień, glina, ruda, ruda żelaza, cegła, ceramika, brąz, żelazo, stal) całego imperium:

- **Baza bez Magazynów:** **500** sztuk na typ surowca (civ-wide).
- **+100** na typ surowca za **każdy** zbudowany Magazyn — addytywnie (2 Magazyny w 2 miastach = +200, nie ×2), poziom budynku nie ma znaczenia.
- Efekt jest **civ-wide** — nie musisz stawiać armii w tym samym mieście co Magazyn, cap dotyczy całego imperium ownera (gracz i każda cywilizacja AI liczą się tak samo).
- Żywność **nie** jest objęta tym mechanizmem — jej limit to osobny model per miasto + Spichlerz ([`docs/encyklopedia/pojecia/spichlerz.md`](../pojecia/spichlerz.md), Część III §21 poradnika).

### Koszty
- **Budowa poz. 1:** 20 pracy
- **Każdy kolejny poziom:** +8 pracy
- **Utrzymanie:** 1 ¤/turę
- Technologia **Handel**.
### Strategia gracza
Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym. Postaw **pierwszy Magazyn wcześnie**, jeśli planujesz masową rekrutację jednostek Brązu/Żelaza albo budynki z kosztem cegły/ceramiki — sama baza (500) starcza na długo, ale kilka Magazynów rozproszonych po imperium tanio podnosi wspólny cap.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 1 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
- Mylenie tego magazynu z zapasami **żywności** (Spichlerz) — to dwa osobne systemy z różnymi wzorami pojemności.
**Powiązane:** Produkcja miejska · Utrzymanie · Produkcja+Pieniadz · Magazyn surowców państwa (Część III §21.5b, Część VIII §53.2)

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

Wygenerowano z danych gry · rev. F 2026-07-24 (dopisano drugi efekt: +100 pojemności magazynu surowców państwa za każdy zbudowany Magazyn, baza 100→500, model addytywny civ-wide — decyzja Macieja SUROW-CIV-01) · pierwotnie rev. E 2026-07-03 (pogłębienie + przykłady).

## Rys historyczny

Magazyn państwowy to budowla służąca do gromadzenia zapasów surowców, broni i zaopatrzenia niezbędnych do funkcjonowania administracji i wojska w czasach pokoju i kryzysu. Starożytne imperia, od Egiptu po Chiny, budowały rozległe sieci magazynów wzdłuż szlaków handlowych i granic, by zaopatrywać garnizony i urzędników bez konieczności każdorazowego transportu towarów z odległych prowincji. Chińskie magazyny zbożowe funkcjonujące w ramach systemu „ping-cang” pozwalały władzom stabilizować ceny żywności, sprzedając zapasy w latach nieurodzaju i skupując nadwyżki w latach obfitych plonów. Zarządzanie magazynem wymagało sprawnej biurokracji — skrybowie i urzędnicy prowadzili szczegółowe rejestry przychodów i rozchodów, a kradzież z magazynu państwowego karano surowo jako przestępstwo przeciw całej wspólnocie. Sprawnie działające magazyny były jednym z filarów stabilności państwa, pozwalając przetrwać wojny, klęski żywiołowe i długie kampanie wojskowe bez załamania zaopatrzenia.
