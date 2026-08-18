# MAP-UX-CLUSTER-LABEL-Q1 — etykiety stolica vs miasto-państwo w klastrze

**Status:** ✅ **ZDEPLOYOWANA / ZAMKNIĘTA** · **B+C** · FALA 296 ROBOCZA `a37f7123` (2026-08-18)
**Cytat Macieja:** „Stolica = nazwa cywilizacji **ORAZ** marker wizualny (korona / grubsza obwódka); MP = nazwa + dopisek"  
**Źródło:** [`ABC-PACZKA-2026-08-06-KOLEJKA.md`](ABC-PACZKA-2026-08-06-KOLEJKA.md) · audyt `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02`

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **MAP-UX-CLUSTER-LABEL-Q1** | **B+C** | Stolica obcego państwa: **etykieta cywilizacji** (np. „Chińczycy") **oraz** marker wizualny (korona lub grubsza obwódka chipu). Miasto-państwo: **nazwa z puli** + dopisek „· miasto-państwo" (jak dziś). |

## Skutek (1–3 zdania)

Na mapie w klastrze od razu widać, która pigułka to stolica państwa (nazwa cywilizacji + korona/obwódka), a które to MP (lokalna nazwa + dopisek). Bez zmiany sep/spawnu — tylko warstwa prezentacji w `cityMapStatChip` / `cities.ts`. Sep 14 hex między cywilizacjami pozostaje bez zmian.

## Wdrożenie

Zrealizowane w commitach `9d33e8fd51a6af58005903f8b0f9262982517e7b`
(marker + nazwa cywilizacji) oraz
`d3470ed5cae5b5495775accfdadddbfb77ab1455` (wyłączenie korony dla miast-państw).
Oba commity są przodkami aktualnego `main` oraz źródła FALI 296
(`a6e2967f`), a ROBOCZA FALA 296 ma md5 `a37f7123`.

## Dowód wcześniejszego Evaluatora i wdrożenia (korekta 2026-08-18)

- AutoBot Operator → Evaluator: **PASS-WITH-NOTES** dla paczki map UX;
  status scalony zapisano w `cd4399df`. Evaluator wykrył zakres miast-państw,
  który domknięto commitem `d3470ed`.
- Bramki wcześniejszej weryfikacji: `tsc --noEmit` 0,
  `display-names-test` 27/27, `city-map-badge-test` 31/31, Vite 792 moduły.
- Wcześniejsza nota „branch roboczy, nie main” dotyczyła stanu z 2026-08-06;
  po FALI 296 jest historyczna i nie opisuje aktualnego statusu.
