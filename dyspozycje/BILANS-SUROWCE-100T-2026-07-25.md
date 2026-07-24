# BILANS SUROWCÓW — analiza 100 tur (2026-07-25)

Prośba Macieja (2026-07-25): ponowna analiza bilansu surowców na 100 tur z uwzględnieniem
WSZYSTKICH zmian tej sesji; założenie: każde miasto ma wszystkie budynki epoki Kamień+Brąz.
Nadmiar czy niedobór? Rejestr: `R-BILANS-100T`.

Wszystkie liczby z żywych danych: `terrain-improvements.json` (produkcja/turę),
`converters.ts` (receptury), `buildings.json` (koszt_surowce), `econ-params.json`
(cap 100+100/Magazyn, upkeep −1 Praca, przepustowości: cegielnia 3, huta 1, odlewnia żelaza 1).

## 1. ZAŁOŻENIA MODELU
- Cap = **200/typ surowca** (100 baza państwa + 100 za Magazyn — Magazyn to budynek epoki 2, więc w założeniu zbudowany). Cap jest **civ-wide** (jedna pula dla całego państwa), nie per-miasto.
- Bonusy tej sesji: Stolarnia +10 % drewno (civ), Warsztat kamieniarski +10 % kamień (civ) — model liczy ×1,10 przy 1 budynku.
- Stawki wydobycia/turę (ulepszenie terenu, niezależne od obsady): tartak 4 drewno, kamieniołom 4 kamień, glinianka 5 glina, kopalnia miedzi 2 ruda, kopalnia na złożu żelaza 2 ruda_żelaza.
- Konwertery/turę: cegielnia 2 glina+1 drewno→1 cegła (×3), piec hutniczy 1 ruda+1 drewno→1 brąz (×1), odlewnia żelaza 1 ruda_żelaza+1 drewno→1 żelazo (×1).
- Jednorazowy koszt WSZYSTKICH 23 budynków K+B (per miasto): **drewno 63, kamień 65, cegła 64, brąz 7**.

## 2. NETTO/TURĘ (steady-state, po odjęciu konwerterów)

| Surowiec | 1 ulepsz./typ | 2 ulepsz./typ | Kto konsumuje |
|---|---|---|---|
| **drewno** | **−0,6** | +3,8 | 3 konwertery (cegielnia 3 + piec 1 + odlewnia 1 = 5/t) — wąskie gardło |
| **glina** | **−1,0** | +4,0 | cegielnia 6/t (produkcja 5/t nie nadąża za cegielnią 3/t) |
| kamień | +4,4 | +8,8 | **NIKT** (tylko koszt budynków jednorazowo) → strukturalny nadmiar |
| ruda | +1,0 | +3,0 | piec hutniczy 1/t |
| ruda_żelaza | +1,0 | +3,0 | odlewnia żelaza 1/t |
| cegła | +3,0 | +3,0 | tylko koszt budynków jednorazowo |
| brąz | +1,0 | +1,0 | koszt budynków + jednostki (patrz §4 — DZIŚ jednostki NIE konsumują) |
| żelazo | +1,0 | +1,0 | (epoka 3) |

## 3. SYMULACJA 100 TUR — ile się marnuje (overflow ponad cap 200)

| Scenariusz | drewno | glina | kamień | ruda | ruda_żel | wniosek |
|---|---|---|---|---|---|---|
| 1 miasto, 1 ulepsz./typ | zapas 48 | 100 | **cap, −240 zmarn.** | 100 | 108 | tylko kamień się przelewa; drewno/glina napięte |
| 4 miasta, 1 ulepsz./typ | −960 | −1400 | −1560 | −400 | −400 | **wszystko na cap, ogromny overflow** |
| 4 miasta, 2 ulepsz./typ | −2720 | −3400 | −3320 | −1200 | −1200 | overflow rośnie liniowo z imperium |

## 4. WNIOSKI KLUCZOWE
1. **Cap jest civ-wide i PŁASKI (200), a produkcja skaluje się z liczbą miast.** To dominujący efekt: 1 miasto ledwo napełnia cap, ale **imperium 4-miejskie marnuje setki–tysiące sztuk** każdego surowca przez 100 tur. Magazyn (jeden budynek → +100 do puli CAŁEGO państwa) w dużym imperium jest kroplą. Stockpile traci sens po ~turze 15.
2. **Kamień nie ma odbiorcy** — żaden konwerter go nie zużywa, po zbudowaniu budynków to czysty nadmiar. Produkuje się 4,4/t/miasto, ląduje w koszu.
3. **Drewno i glina to jedyne realnie napięte surowce** przy „chudym" mieście (1 ulepszenie/typ): drewno karmi 3 konwertery, glina nie nadąża za cegielnią 3/t. Przy 2 ulepszeniach/typ już nadwyżka.
4. **Konkluzja na pytanie Macieja: przy „każde miasto ma wszystkie budynki K+B" — NADMIAR, i to duży**, rosnący z wielkością imperium. Niedobór grozi tylko drewnu/glinie i tylko w mieście z pojedynczymi ulepszeniami na starcie epoki.

## 5. LUKA PRZY JEDNOSTKACH (R-PROD-POOL-TEST)
- **Budynki**: ✅ poprawnie pobierają z puli państwa (gracz `cityPanel.ts:4304-4308`, AI `main.ts:14358-14367/14831`) przez `deductBuildingStockCostAcrossCities` + `ownerResourceStockAll` (ownerId-agnostic → parytet AI zachowany).
- **Jednostki**: ❌ **NIE zaciągają żadnego surowca**. `addItem` odejmuje pulę tylko dla `budynek`. Pole `Surowiec (ilość)` (1/2/3 wg R-KOSZT-JEDN) jest tylko WYŚWIETLane (`cityPanel.ts:4882`); `Surowiec` działa jedynie jako bramka DOSTĘPU (braz/zelazo, `production.ts:751-759`). Konsumpcja surowca przez jednostki nie jest wpięta — DO DECYZJI Macieja.

## 6. IMPLIKACJE DO STROJENIA (placeholder, `R-STAWKI-STROJENIE`)
- Rozważyć **cap skalowany per miasto** (albo Magazyn = +100 za każdy Magazyn, budowany w każdym mieście — dziś addytywnie tak działa, ale trzeba by budować dużo Magazynów).
- **Sink dla kamienia** (dziś brak) — np. koszt kamień w większej liczbie budynków / murów / jednostek.
- Jeżeli jednostki zaczną konsumować surowiec (§5) — brąz/żelazo zyskują realnego odbiorcę i nadmiar spada.
