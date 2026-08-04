# Założenie miasta (bez osadnika)

## Metadane

| id | `zalozanie-miasta` |
| tytuł | Założenie miasta |
| kategoria | Mapa i ekspansja |
| poradnik_ref | Część V §27.3 · Część II §9.2 |
| json_ref | `city-founding.ts`, `cities.ts`, `miasto-params.json` |

---

## Wiki‑S

**Nie ma jednostki osadnika.** Kolejne miasto zakładasz z panelu **Budowa → Załóż miasto**: **20 Pracy** + **1 ludność** z największego miasta (pop ≥ 2), min. **4 heksy** od innego miasta. Stolica startowa pojawia się automatycznie.

---

## Wiki‑M

### Jak założyć miasto

1. Otwórz **lewy panel → Budowa**.
2. Wybierz **Załóż miasto**.
3. Kliknij **wolny heks** w twoim terytorium (odkryty, bez złoża blokującego, min. 4 hex od miast).

### Koszt

| Składnik | Wartość |
|----------|---------|
| **Praca** | 20 (pula imperium) |
| **Ludność** | −1 z miasta-źródła |
| **Miasto-źródło** | Największe z pop ≥ **2** (po founding min. 1 zostaje) |
| **Pierwsze miasto** | FREE (stolica przy starcie gry) |

### Odległość

**Minimalny dystans: 4 heksy** między centrami miast (`min_dystans_miast` w `miasto-params.json`). Wcześniej było 5 — zmiana FALA 206.

### Warunki terenu

- Własne terytorium **lub** po **Strażnicy** w nowym regionie.
- Heks **odkryty** (nie w mgle).
- Nie na heksie z **złożem** rezerwującym pole (jeśli złoże blokuje budowę).

### AI

Główne cywilizacje AI używają tego samego mechanizmu: miasto-źródło **pop ≥ 5**, ocena jakości heksu, do **2** foundingów/turę w epokach 1–3. Miasta-państwa **nie** zakładają nowych miast.

**Powiązane:** Część II §9 · Część V §27.3 · [[Manpower (rekruci)]]

---

## Przykład liczbowy

Stolica **pop 6**, drugie miasto: koszt **20 P + 1 👤** ze stolicy → po founding stolica **pop 5**, nowe miasto **pop 1**, odległość ≥ **4 hex** od stolicy i od sąsiada AI.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/05-budowa-mapa.md` §27.3 · `02-mapa-swiata.md` §9.2

---

## Historia / decyzje

B1-FOUND (Maciej 2026-06-29): brak osadnika, panel Budowa. FALA 206: min. dystans **4 hex**. R-AI-KOLONIZACJA: AI pop ≥ 5. Hasło dodane rev. G 2026-08-04.
