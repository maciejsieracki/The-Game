# DYSPOZYCJA — PACZKA „PORTRETY-ZELAZO" (2026-07-23)
Odpowiedź na ZLECENIE 6 (część 1/2 — Żelazo; Antyk dojedzie po arkuszu od Macieja).

## Wgranie (Maciej) → `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/eksport/`
| Plik | Uwaga |
|---|---|
| `eksport/portraits/portrait-{civ}-zelazo.png` (15×) | medalion 418×418, boki wtopione |
| `eksport/portraits/portrait-{civ}-zelazo-full.png` (15×) | pełny kadr 251×418 |
| `eksport/portrait-map.json` | NADPISZ — `zelazo` wypełnione, `antyk` dopisany (null) |
| `eksport/portraits-preview.html` | NADPISZ — 3 rzędy (Kamień/Brąz/Żelazo) |
| `WYMIANA-UI-DESIGN.md` | NADPISZ (log) |

Commit: `PORTRETY: epoka Żelaza 15 civ (medalion+full) + mapa (antyk=TODO) — Zlecenie 6 cz.1`

## Przypisania (kolejność spec 1–15, arkusz 5×3; poz. 2 = RZYMIANIE — potwierdzone przez Macieja)
Rząd 1: Grecy (laur) · Rzymianie (czerwona chlamida, złoty pancerz) · Chińczycy (kok z ozdobą) · Inkowie (pióropusz, złote dyski) · Zulusi (nakrycie lamparcie)
Rząd 2: Egipt (nemes) · Sumer (złota korona, pleciona broda) · Celtowie (niebieskie malowanie, tartan) · Germanie (futro, długie włosy) · Harappa (diadem, kolczyk)
Rząd 3: Hetyci (rogaty hełm) · Słowianie (malowanie, futro) · Babilonia (złoty kołpak, pleciona broda) · Asyria (stożkowy hełm) · Fenicjanie (purpura)

## Integracja (jak KROK 2 z paczki portretów Kamień/Brąz — bez zmian)
Wybór portretu wg epoki gracza: zelazo → braz → kamien (fallback w dół); antyk (gdy dojedzie) na szczycie łańcucha.
Do bundla gry kopie 256×256; oryginały 418 zostają w kanonie. Obwódka medalionu z UI (Ty/wróg/neutralna).

## Status
Zlecenie 6 cz. 2/2 (ANTYK): czekam na arkusz — potnę 1:1, wypełnię `antyk` w mapie, dołożę 4. rząd preview.
Pozostałe zlecenia: brak otwartych (1–5, 7 zamknięte; Cuda czekają na werdykt).
