# Drzewko technologii

## Metadane

| id | `drzewko-technologii` |
| tytuł | Drzewko technologii |
| kategoria | Nauka i epoki |
| poradnik_ref | Część IX §54–56 |
| json_ref | `tech.json` |

---

## Wiki‑S

**Drzewko technologii** to ekran **Nauka** — 32 technologie w 3 epokach (Kamień/Brąz/Żelazo), po 3 „Poziomy" na epokę. Model **liniowy z twardym gatingiem**: nie zbadasz NIC z epoki N+1, dopóki cała epoka N nie jest ukończona, i nie zbadasz wyższego Poziomu w epoce, dopóki niższe Poziomy tej samej epoki nie są gotowe — **dodatkowo** do zwykłych prereqów (np. Łucznictwo ← Łowiectwo).

---

## Wiki‑M

### Ekran (graf)

Pełnoekranowy **ekran Nauka**: węzły-karty pogrupowane w pasma wg epoki, w kolejności Poziomów. Każdy węzeł pokazuje koszt w **PN** (Punkty Nauki) i „Poziom N"; zależności są opisane **na kartach/w tooltipie**, bez rysowanych linii łączących (zmiana 2026-07-23). Minimapa + przyciski skoku do epoki + „dopasuj widok". Stan węzła: **odkryty / w budowie (cel) / dostępny / zablokowany** (tooltip z konkretnym powodem blokady — brakujący prereq, budynek lub ulepszenie).

### Trzy zasady progresji (silnik `research.ts`)

1. **Zasada 1 — twarda bramka epoki.** Tech epoki E dostępny tylko gdy WSZYSTKIE technologie epok < E są ukończone (nie tylko „kapston" epoki — dosłownie każda).
2. **Zasada 2 — bramka Poziomów w epoce.** Tech o Poziomie P w epoce E dostępny tylko gdy wszystkie techy TEJ SAMEJ epoki o Poziomie < P są ukończone.
3. **Zasada 3 — awans epoki (strukturalna).** Wynika z 1+2: pole `awansDoEpoki` siedzi na „kapstonie" (najwyższy Poziom) danej epoki — **Brązownictwo** (Poziom 3, Kamień → odblokowuje Brąz) i **Hutnictwo żelaza** (Poziom 6, Brąz → odblokowuje Żelazo). Skoro Zasada 1 wymusza ukończenie całej epoki przed następną, kapston i tak jest już zbadany, gdy awans epoki następuje.

Poziomy per epoka: Kamień = 1–3, Brąz = 4–6, Żelazo = 7–9 (numeracja globalna, rosnąca, ale porównywana **per epoka**).

### Koszt badań i tempo gry

Bazowy „Koszt nauki" w `tech.json` to tryb **Szybki (×1)**. Tempo wybrane przy starcie gry mnoży ten koszt globalnie (`applyTempoKoszt()`, `tech-tempo.ts`):

| Tempo | Mnożnik |
|-------|---------|
| Szybka | ×1 |
| **Standardowa** | **×2** |
| Długa | ×4 |

Przykład: tech o bazowym koszcie **12 PN** → Szybka **12**, Standardowa **24**, Długa **48**.

### Przykład łańcucha (Łucznictwo)

**Łucznictwo** (Kamień, Poziom 2, koszt bazowy 14 PN) wymaga **Łowiectwo** (Kamień, Poziom 1) — dopiero po nim odblokowuje Łucznika/Łucznika egipskiego/sumeryjskiego/akadyjskiego. Przy tempie Standardowym koszt realny to **28 PN**.

**Powiązane:** [[Łucznik]] · Poradnik Część IX §54–56

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/09-nauka-epoki.md` §54–56

---

## Historia / decyzje

Model „liniowe" — decyzja **B1-Q3** (Maciej, 2026-06-28): oś w epoce wg Poziom + kolejność w tablicy, bramki AND bez zmian. Ekran grafu bez linii zależności — zmiana 2026-07-23 (`techTreeView.ts`). Hasło dodane 2026-07-23 (audyt CIVPEDII) — dotąd nieopisane w encyklopedii mimo istnienia w grze od dawna.
