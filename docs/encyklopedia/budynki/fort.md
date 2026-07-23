# Fort (Cytadela)

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `fort` |
| **tytuł** | Fort (Cytadela) |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Fort** (budynkowy, w danych `nazwa: "Cytadela"`) — budynek (Obrona), epoka Żelazo, **upgrade Murów** (1 slot budynkowy, nie osobna budowla). Koszt od **70** pracy + **18× cegła**, utrzymanie **3** ¤/t. Technologia **Inżynieria**. *(Odrębna Strażnica/Fort terenowy na mapie to inny obiekt — zob. [[Fort / umocnienia]] w Ulepszeniach.)*

---

## Wiki‑M

### Co robi
Fort (w UI: **Cytadela**) to **ulepszenie Murów** — nie osobny budynek, tylko kolejny poziom tego samego slotu obronnego. Poziom 1: **+15 obrony** (+8 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**15** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 70 pracy + **18× cegła**
- **Każdy kolejny poziom:** +15 pracy
- **Utrzymanie:** 3 ¤/turę (+1 ¤/poziom)
- Technologia **Inżynieria**. Warunek: wymaga ukończonych Murów (upgrade).
- **Uwaga:** +100% obrona przy obozowaniu jednostek (zasieg 10); styk MAPA/civ-bonusy-obronne-mapa.md
### Strategia gracza
Przed wojnou z sąsiadem: mury/fort **przed** masową rekrutacją. Oblężenie bez muru kończy się szybciej.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 3 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Obrona

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 70 (+18 cegły) | **7 tur** | +15 obrony | 3 ¤/t |
| Poziom 2 | 85 | **9 tur** | więcej (patrz niżej) | 3 ¤/t |
| Poziom 3 | 100 | — | **+31 obrony** | 3 ¤/t |

Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.

**Przyspieszenie za złoto:** jeśli brakuje **50** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).
