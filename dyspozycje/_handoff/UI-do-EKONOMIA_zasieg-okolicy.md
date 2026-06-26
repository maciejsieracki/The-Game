# [ZASTAPIONE 2026-06-25 przez UI-do-EKONOMIA_okolica-jak-podejsc.md — szersza dyskusja "jak podejsc"]
# ZAPYTANIE UI -> EKONOMIA (przez Maciej): zasieg "Okolicy" miasta (pola obrabiane) w v0.1  [2026-06-25]

Kontekst: widok miasta (cityPanel.ts) rysuje sekcje "Okolica" — siatke heksow wokol centrum. Dzis uzywam
STALEGO parametru UI okolica_promien=2 (czysto wizualnie). Chcemy, by okolica odzwierciedlala REALNY zasieg
pol obrabianych przez miasto — a to model EKONOMII. Pytania:

1. Jaki jest REALNY zasieg pol obrabianych przez miasto w v0.1?
   - turn-economy.workedTilesForCity liczy plony z CENTRUM + 6 SASIADOW (promien 1).
   - MIASTO wspomnialo okolica.cityRangeForPopulation(pop) = r5/10/15 (rosnie z populacja) + granica kulturowa
     cityBorderRadius(kultura).
   - Ktore jest wlasciwe dla v0.1 i jak sie maja do siebie (zasieg LICZENIA PLONOW vs zasieg TERYTORIUM/wyswietlania)?
2. Jesli zasieg rosnie z populacja — podajcie DOKLADNE progi (pop -> promien) i czy to Wasz parametr
   (Ekonomia-parametry.xlsx) czy MIASTO.
3. Jak UI ma DOSTAC ten zasieg per miasto? Propozycja hak: getCityWorkedRange(cityId) => number (promien),
   albo getWorkedTiles(cityId) => {q,r}[] (lista obrabianych heksow). Co wolicie?
4. Czy okolica ma rozroznialiac pola TYLKO-W-TERYTORIUM (granica) vs FAKTYCZNIE-OBRABIANE (inny kolor/obwodka)?
   Dzis: centrum (zloto), pierscien 1 (zielony=obrabiane), dalej (przerywany=w zasiegu).

Po odpowiedzi: ustawie okolice na REALNY zasieg (przez hak), a parametr UI okolica_promien zostanie tylko jako
fallback/max wizualny.

(Powiazane: osobne zapytanie do EKONOMIA o suwak PODZIALU HANDLU jest w _routing-blokery.md, pkt C.)
