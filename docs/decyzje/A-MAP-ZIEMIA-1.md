# A-MAP-ZIEMIA-1 — układ mapy typu Ziemia

**Status:** ZAMKNIĘTE (wdrożenie w kodzie)  
**Data:** 2026-07-24  
**Decyzja Macieja:** **B**

## Pytanie

Korekta szablonu Ziemi: północ za wysoko (Europa w złym pasie pod klimat), Antarktyda na dole do usunięcia.

## Opcja wybrana — B (korekta 2026-07-24 wieczór)

- **Ocean arktyczny** u góry playable area: ~30 heksów na mapie standardowej, skalowane.
- **Ocean południowy** u dołu: **ten sam** bufor (~30 heksów skalowanych) — oddech przed krawędzią mapy.
- **Antarktyda:** **USUNIĘTA** z mapy Ziemi (decyzja właściciela **5B**, R-WEB-MAP-EARTH-ANTARCTICA-Q1, 2026-11-26 — ECHO 5B w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; zgodnie z regułą C-MAP-Q3c w `gra/src/map/earth-land-mask.ts`). Pas polarny południowy (3 rzędy nad południowym buforem oceanu + bufor) jest sprawdzany w `gra/tools/earth-template-test.cjs`: wiersze poniżej najwyższego wiersza pasa — pełna szerokość, **0 heksów lądu**; najwyższy wiersz pasa — środkowe pasmo 35–65% szerokości (miejsce Antarktydy), **0 heksów lądu**.
- **Stan kodu vs. decyzja (pomiar, bez zmiany `gra/src`):** w najwyższym wierszu pasa leży ląd, który **nie jest Antarktydą**: standard r=85 (q 46–49 i 152–153), Duży r=133 (q 66–70), Ogromny szablon r=203 (q 92–98). Pozycje q ok. 27–29% szerokości to krańcu południowym Ameryki Południowej (Patagonia / Ziemia Ognista), q ok. 90% na mapie standardowej to Nowa Zelandia. Antarktyda z maski została usunięta (C-MAP-Q3c): w środkowym paśmie 35–65% szerokości pasa nie ma lądu (POLARZERO, r=85), a wiersze poniżej najwyższego są wolne od lądu na pełnej szerokości. Dlatego kod spełnia decyzję 5B i nie wymaga zmiany danych maski ani generatora; decyzja właściciela nie jest potrzebna. Test pasa polarnego zawęża najwyższy wiersz do środkowego pasma, żeby nie liczyć lądu Ameryki Południowej i Nowej Zelandii.

## Zakres (ważne)

**Tylko** opcja kreatora **Typ świata → Ziemia** (`typ === 'ziemia'`).

**Nie** dotyczy:
- **Kontynenty** — proceduralne strefy Voronoi (`typ === 'kontynenty'`)
- Pangea, Wyspy

(Screen z Antarktydą = preset Ziemia, nie proceduralne Kontynenty.)

- `gra/src/map/earth-land-mask.ts`
- Test: `gra/tools/earth-template-test.cjs`

## Cytat

> „b” — bufor morza na północ o ~30 heksów proporcjonalnie + usunięcie Antarktydy (opcja B).
