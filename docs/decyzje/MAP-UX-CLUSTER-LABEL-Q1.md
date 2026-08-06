# MAP-UX-CLUSTER-LABEL-Q1 — etykiety stolica vs miasto-państwo w klastrze

**Status:** 🟡 **ZAPISANA** · **B+C** (2026-08-06)  
**Cytat Macieja:** „Stolica = nazwa cywilizacji **ORAZ** marker wizualny (korona / grubsza obwódka); MP = nazwa + dopisek"  
**Źródło:** [`ABC-PACZKA-2026-08-06-KOLEJKA.md`](ABC-PACZKA-2026-08-06-KOLEJKA.md) · audyt `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02`

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **MAP-UX-CLUSTER-LABEL-Q1** | **B+C** | Stolica obcego państwa: **etykieta cywilizacji** (np. „Chińczycy") **oraz** marker wizualny (korona lub grubsza obwódka chipu). Miasto-państwo: **nazwa z puli** + dopisek „· miasto-państwo" (jak dziś). |

## Skutek (1–3 zdania)

Na mapie w klastrze od razu widać, która pigułka to stolica państwa (nazwa cywilizacji + korona/obwódka), a które to MP (lokalna nazwa + dopisek). Bez zmiany sep/spawnu — tylko warstwa prezentacji w `cityMapStatChip` / `cities.ts`. Sep 14 hex między cywilizacjami pozostaje bez zmian.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟡 cross — wspólny render mapy).
