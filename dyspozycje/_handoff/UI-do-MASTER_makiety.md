# HANDOFF: UI -> MASTER — przeniesienie makiet UI do Civ/UI/  [2026-06-24 23:04]

CO ZROBIONE (decyzja Maciej, pyt. 5 = B):
- Przeniesione do Civ/UI/:
  * Makieta-HUD-mapa-swiata.html   (HUD w grze — makieta UI)
  * Makieta-flow-nowa-gra.html     (kreator nowej gry — makieta UI)
- Stary mockup -> Civ/UI/_archiwum/Makieta-widok-miasta.html (historyczny, zastapiony).
- Widok-miasta.html: NIE ruszalem — jest juz w Civ/MIASTO/ (przejete przez MIASTO).

PROSBA DO MASTERA (integracja/router — Ty trzymasz wspolny spis i powiadamiasz dzialy):
1. Zaktualizuj ARCHITEKTURA-PLIKI.md — nowe sciezki:
   - Civ/UI/Makieta-HUD-mapa-swiata.html
   - Civ/UI/Makieta-flow-nowa-gra.html
   - Civ/UI/_archiwum/Makieta-widok-miasta.html
2. Powiadom MAPA — odwoluje sie do Makieta-HUD-mapa-swiata.html (dyspozycje/MAPA-DO-MASTERA.md).
   Jesli MAPA potrzebuje tej makiety u siebie, ustal wspolne miejsce/kopie.
3. (info) Stare odwolania w *-DO-MASTERA.md innych dzialow to historia — nie wymagaja zmiany.

UWAGA: cityPanel.ts (widok miasta) jest juz zaimplementowany — UI nie potrzebuje pliku Widok-miasta.html
do dzialania; to tylko makieta-zrodlo. Decyzja gdzie ma lezec (MIASTO vs UI) = Twoja.
