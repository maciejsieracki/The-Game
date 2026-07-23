# DYSPOZYCJA — PACZKA „TECH-IKONY-32" (2026-07-23)
Odpowiedź na ZLECENIE 7 (ikony 32 technologii — zatwierdzone).

## Wgranie (Maciej) → `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/eksport/`
| Plik | Uwaga |
|---|---|
| `eksport/icons/tech/` (32× tech-<slug>.svg) | NOWY folder |
| `eksport/tech-icon-map.json` | klucz = id z tech.json · pole `name` = nazwa PL |
| `eksport/tech-icons-preview.html` | podgląd (otwiera lokalnie, fetch same-origin) |
| `WYMIANA-UI-DESIGN.md` | NADPISZ (log) |

Commit: `TECH-IKONY: 32 ikony technologii Antyku + mapa + preview (Zlecenie 7)`

## Spec (jak icons/units i icons/buildings)
line-art 1E · `stroke="currentColor"` (kolor dziedziczony z CSS — złoto w drzewku, dowolny w panelu) ·
`viewBox="0 0 24 24"` · stroke 1.6, round caps/joins · fill none · bez emoji, bez wypełnień.

## Użycie (integrator)
1. Węzły drzewka (ekran SIATKA v1.1): medalion `.tn .ti` — `<img>`/inline SVG 19px w kółku 32px.
   Uzupełnia miejsce po zdjętych ikonach epok (decyzja Macieja: nazwa odkrycia + docelowo ikona techa — to jest to zlecenie).
2. Panel badań (Ekran Badania): ikona przy nazwie technologii.
3. Mapowanie: `tech-icon-map.json` → klucz = id technologii z `gra/data/tech.json`.
   Jeśli jakieś id w grze różni się od klucza (np. hutnictwo vs hutnictwo_zelaza) — dopasuj po polu `name`
   i zgłoś rozjazd, poprawię mapę.

## Weryfikacja
Otwórz `eksport/tech-icons-preview.html` — 32 kafle, wszystkie ikony złote, bez „✕".

## Status zleceń
- Zlecenia 1–5 + 7: ZAMKNIĘTE. · Zlecenie 4: paczka CUDA-SWIATA-v1 (z dołożonym STANDALONE) — czeka na werdykt.
- Zlecenie 6 (PORTRETY ŻELAZA + ANTYKU): czeka na arkusze od Macieja; przyjąłem rozszerzenie o epokę antyk
  (dopiszę klucze `zelazo` i `antyk` do portrait-map.json + rzędy w preview).
- Zapowiedź budynków epok 4–5 od zera: przyjęta do wiadomości, czekam na listę.
