# MAP-UX-CLUSTER-LABEL — etykiety stolicy vs miast-państw w klastrze

**Status:** **ZAMKNIĘTE = A** (Maciej 2026-08-05, odpowiedź `1` = A)  
**Audyt:** `dyspozycje/AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` · VERDICT: DESIGN_KLASTRA

## Sytuacja

Na mapie w jednym klastrze widać kilka bliskich chipów (1 stolica + MP, pierścień ~5 hex). Sep stolic Standard = 14 hex działa — to nie bug bramki.

## Decyzja

| Opcja | Treść | Wynik |
|-------|--------|--------|
| **A** | Zostawić (dopisek „· miasto-państwo” na chipie MP) | ✅ **WYBRANE** |
| **B** | Stolica obca = nazwa cywilizacji; MP = miasto + dopisek | — |
| **C** | Marker wizualny stolicy; nazwy bez zmian | — |

## Skutek

- **Bez zmiany kodu** · **bez deploy** ROBOCZA.
- Chip mapy: `formatCityMapLabel` + dopisek MP jak dotychczas.
- Nie luzujemy / nie zaostrzamy sep stolic ani pack MP bez osobnego ABC.
