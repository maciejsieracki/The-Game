# DYSPOZYCJA — PACZKA „PORTRETY-ZELAZO" · WERSJA FINAL PO KOREKCIE (2026-07-23)
Odpowiedź na ZLECENIE 6 (część 1/2 — Żelazo; Antyk dojedzie po arkuszu od Macieja).
**Zawiera wykonaną korektę Macieja: swap Brąz↔Żelazo dla Greków i Chińczyków** — dlatego paczka nadpisuje też
4 pliki BRĄZU tych dwóch nacji (portrait-{grecy|chinczycy}-braz.png + -braz-full.png). Ta paczka zastępuje
wcześniejsze PORTRETY-ZELAZO i PORTRETY-SWAP — wgrywać tylko tę.

## Wgranie (Maciej) → `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/eksport/`
| Plik | Uwaga |
|---|---|
| `eksport/portraits/portrait-{civ}-zelazo.png` (15×) | medalion 418×418, boki wtopione |
| `eksport/portraits/portrait-{civ}-zelazo-full.png` (15×) | pełny kadr 251×418 |
| `eksport/portraits/portrait-{grecy\|chinczycy}-braz.png + -braz-full.png` (4×) | NADPISZ — skutek swapu |
| `eksport/portraits/medaliony/portrait-{civ}-{epoka}-medalion.png` (45×) | **gotowe okrągłe medaliony ze złotą obwódką 1E** (przezroczyste tło, winieta) — komplet 3 epok, do wstawiania 1:1 w UI |
| `eksport/portrait-map.json` | NADPISZ — `zelazo` wypełnione, `antyk` dopisany (null) |
| `eksport/portraits-preview.html` | NADPISZ — 3 rzędy (Kamień/Brąz/Żelazo) |
| `WYMIANA-UI-DESIGN.md` | NADPISZ (log) |

Commit: `PORTRETY: epoka Żelaza 15 civ + swap Brąz<->Żelazo Grecy/Chińczycy — Zlecenie 6 cz.1 (final)`

## Przypisania (kolejność spec 1–15, arkusz 5×3; poz. 2 = RZYMIANIE — potwierdzone przez Macieja)
Rząd 1: Grecy (laur) · Rzymianie (czerwona chlamida, złoty pancerz) · Chińczycy (kok z ozdobą) · Inkowie (pióropusz, złote dyski) · Zulusi (nakrycie lamparcie)
Rząd 2: Egipt (nemes) · Sumer (złota korona, pleciona broda) · Celtowie (niebieskie malowanie, tartan) · Germanie (futro, długie włosy) · Harappa (diadem, kolczyk)
Rząd 3: Hetyci (rogaty hełm) · Słowianie (malowanie, futro) · Babilonia (złoty kołpak, pleciona broda) · Asyria (stożkowy hełm) · Fenicjanie (purpura)

## Integracja (jak KROK 2 z paczki portretów Kamień/Brąz — bez zmian)
Wybor wariantu: **medaliony/** = gotowe koło + złota obwódka (neutralna/dyplomacja) — wstawiaj bez CSS;
kwadraty = surowiec, gdy UI samo rysuje obwódkę kontekstową (niebieską Ty / czerwoną wróg w pre-battle);
full = karty/większe kadry.
Wybór portretu wg epoki gracza: zelazo → braz → kamien (fallback w dół); antyk (gdy dojedzie) na szczycie łańcucha.
Do bundla gry kopie 256×256; oryginały 418 zostają w kanonie. Obwódka medalionu z UI (Ty/wróg/neutralna).

## Status
Zlecenie 6 cz. 2/2 (ANTYK): czekam na arkusz — potnę 1:1, wypełnię `antyk` w mapie, dołożę 4. rząd preview.
Pozostałe zlecenia: brak otwartych (1–5, 7 zamknięte; Cuda czekają na werdykt).
