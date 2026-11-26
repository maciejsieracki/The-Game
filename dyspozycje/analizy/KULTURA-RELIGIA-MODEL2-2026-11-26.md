# Kultura i religia — propozycja właściciela (model 2): wpływ na Szczęście i Prawo

Data: 2026-11-26 · Baza: origin/main 690947a2adfb7c78e656959fea77fe50d864dda2 · Tag: CULTRELMODEL2 (#176) · Temat: R-WEB-CULT-REL-MODEL2-Q1, runda 1 (Operator)
Status: ANALIZA I ROZPISKA DO POTWIERDZENIA — zero zmian w `gra/**`. Liczby pochodzą z silnika gry (bundle esbuild wołający prawdziwe funkcje z `gra/src/game/society-breakdown.ts` i `order.ts`), nie z ręcznego przeliczenia. Oznaczenie **SILNIK** = wynik modelu, nie pomiar w grze; **NIE ZMIERZONO** = brak pomiaru w grze, w runtime i w AI.

Pliki: model `dyspozycje/analizy/model-kultura-religia-model2-entry.ts`; pełny zrzut wyników `dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-wyniki-silnika.md`.

---

## 1. Rozpiska do potwierdzenia (co dokładnie zostało zapisane)

Każde miasto ma dwie linie: **kulturę** i **religię**. Każda linia zależy od tego, jaki udział ma własna kultura (religia) w mieście:

- miasto w całości obce → wartość D,
- miasto w całości własne → wartość G,
- po drodze: wartość = D + (G − D) × udział własnej (liniowo).

Obie linie działają **na Szczęście i na Prawo** (ta sama para wartości).

| Poziom | Epoka | Obca linia (D) | Własna linia (G) | Obca kultura + obca religia (suma) | Własna kultura + własna religia (suma) |
|---|---|---|---|---|---|
| Łatwy | 1 | −10 | +10 | −20 | +20 |
| Łatwy | 2 | −16 | +16 | −32 | +32 |
| Łatwy | 3 | −23 | +23 | −46 | +46 |
| Normalny | 1 | −15 | +5 | −30 | +10 |
| Normalny | 2 | −24 | +8 | −48 | +16 |
| Normalny | 3 | −34,5 | +11,5 | −69 | +23 |
| Trudny (najwyższy wpływ) | 1 | −20 | 0 | −40 | 0 |
| Trudny (najwyższy wpływ) | 2 | −32 | 0 | −64 | 0 |
| Trudny (najwyższy wpływ) | 3 | −46 | 0 | −92 | 0 |

Mnożniki epok (×1 / ×1,6 / ×2,3) pochodzą z dzisiejszej skali kultury i religii w `gra/data/society-params.json` (10 / 16 / 23). Jednostka garnizonu nadal daje 20 pkt Prawa na normalnym (25 easy, 15 hard), budynek Garnizon, Pałac, Pretorium i wagi Porządku bez zmian. Obcięcie Szczęścia od 0% zostaje jak dziś (patrz §5, pytanie 1).

**Uwaga: „neutralny” to NIE „bez kar”.** W tej rozpisce cel „neutralny” = Porządek ≥ 30% (próg tieru). Kary zależą jednak od pasma (`gra/src/game/society-breakdown.ts`, `porPctBand` i `orderEffectsFromPorPct`): Porządek 30–49% (pasmo Niepokój) ma PEŁNE efekty Niepokoju (mnożniki produkcji, nauki, kultury, Prawa); 50–69% (Napięcie) zostawia tylko −5% produkcji; od 70% (Spokój) brak kar. Liczby 2/3/4 jednostek dotyczą więc progu 30%, a NIE miasta bez kar. Progów 50% i 70% w tej rundzie NIE POLICZONO.

**Uwaga do wcześniejszej wersji dispatchu:** w dispatchu pojawiło się „+40 Prawa i +40 Szczęścia na łatwym”. To wynikało z poprzednich granic (+20 na linię), które zostały unieważnione. Po korekcie łatwy daje własnemu miastu **+20 Szczęścia i +20 Prawa** (po +10 na linię), czyli tyle samo Szczęścia co dziś.

---

## 2. Streszczenie dla właściciela (język gry)

1. **Łatwy** — Szczęście bez zmian. Nowość: kultura i religia dają Prawu +10 na każdą linię w mieście własnym, −10 w obcym. Własne miasto bez garnizonu jest stabilniejsze niż dziś (Porządek 58% zamiast 36%, miasto pop 5, epoka 1).
2. **Normalny** — Szczęście każdego własnego miasta spada o połowę plusów (z +20 do +10 punktów), a Prawo rośnie o +10. Porządek własnego miasta bez garnizonu prawie bez zmiany (18% zamiast 22%, nadal „bunt”, bez buntu skrajnego). Obce miasto potrzebuje **3 jednostek** do tieru neutralnego (dziś 2).
3. **Trudny** — własne miasto nie dostaje żadnego plusa. Bez garnizonu: Szczęście 0%, Prawo 0%, Porządek 0% → **bunt skrajny, bunt w turze 4** (SILNIK, pop 5, epoka 1). Z 1 jednostką Porządek 16% (dziś 33%), z 2 jednostkami 33% (dziś 49%). Obce miasto na trudnym: tier neutralny **niemożliwy nawet przy 4 jednostkach**, wyjście z buntu skrajnego przy 4 jednostkach.
4. **Cel 2 / 3 / 4 jednostki** (obca kultura + obca religia, bez budynków, epoka 1, pop 5):
   - łatwy: **2** do neutralnego (cel 2 — zgodne),
   - normalny: **3** do neutralnego (cel 3 — zgodne),
   - trudny: **4** jednostki wystarczają tylko do wyjścia z buntu skrajnego; do tieru neutralnego **nie da się dojść** nawet przy 4 jednostkach.
   - Gdyby na trudnym obca linia wynosiła −16 do −9 zamiast −20, obca kultura + obca religia wymagałaby dokładnie **4 jednostek do neutralnego** (SILNIK, §4).
5. **Garnizon budynkiem** (epoka 1, obca+obca): łatwy 1, normalny 2, trudny 3 do neutralnego (wyjście: 1 / 1 / 2).
6. **Epoki 2–3 (pop 5, bez budynków, obca+obca), neutralny / wyjście:** łatwy 3/2 i 5/3; normalny 5/4 i brak/5; trudny brak/brak (epoka 2 i 3). Z budynkami na trudnym wyjście w epoce 2 wymaga 4 jednostek (z Garnizonem), w epoce 3 — Pretorium i 3 jednostki.
7. **Trudność epoki 3 na trudnym nie jest utrzymywalna przy obcej kulturze i religii:** nawet z Pretorium i Garnizonem tier neutralny jest nieosiągalny; wyjście z buntu wymaga 3 jednostek i Pretorium. To jest decyzja właściciela (pytanie 2).

---

## 3. Tabela: dziś vs propozycja (pop 5, epoka 1–3, neutralny / wyjście z buntu skrajnego)

Format komórki: „neutralny / wyjście”; „brak” = nieosiągalne nawet przy pełnym capie (normalny 5, trudny 4).

| Poziom | Epoka | Budynki | a dziś | a propozycja | b dziś | b propozycja | c dziś | c propozycja | d dziś | d propozycja |
|---|---|---|---|---|---|---|---|---|---|---|
| Łatwy | 1 | bez | 0/0 | 0/0 | 2/1 | 2/1 | 2/1 | 2/1 | 2/1 | **2/2** |
| Łatwy | 1 | Garnizon | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | **1/1** |
| Łatwy | 2 | bez | 0/0 | 0/0 | 2/1 | 2/1 | 2/1 | 2/1 | 2/1 | **3/2** |
| Łatwy | 3 | bez | 0/0 | 0/0 | 3/1 | 3/1 | 3/1 | 3/1 | 3/1 | **5/3** |
| Normalny | 1 | bez | 1/0 | 1/0 | 2/1 | 2/2 | 2/1 | 2/2 | 2/1 | **3/3** |
| Normalny | 1 | Garnizon | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | **2/1** |
| Normalny | 2 | bez | 1/0 | 1/0 | 3/1 | 3/2 | 3/1 | 3/2 | 3/1 | **5/4** |
| Normalny | 3 | bez | 1/0 | 1/0 | 3/2 | 4/3 | 3/2 | 4/3 | 3/2 | **brak/5** |
| Trudny | 1 | bez | 1/0 | 2/1 | 2/1 | 4/3 | 2/1 | 4/3 | 2/1 | **brak/4** |
| Trudny | 1 | Garnizon | 0/0 | 1/0 | 1/0 | 2/1 | 1/0 | 2/1 | 1/0 | **3/2** |
| Trudny | 2 | bez | 2/0 | 4/2 | 4/2 | brak/4 | 4/2 | brak/4 | 4/2 | **brak/brak** |
| Trudny | 3 | bez | 2/0 | brak/2 | brak/2 | brak/brak | brak/2 | brak/brak | brak/2 | **brak/brak** |

Pełna tabela (także pop 3 i pop 8, z Świątynią i Pretorium, wszystkie kombinacje): `dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-wyniki-silnika.md`, sekcja 1.

Wniosek z tabeli: propozycja zmienia wymóg głównie dla **obcej kultury i religii** (scenariusz d) i dla **własnych miast na trudnym**. Scenariusz a (własna kultura i własna religia) na łatwym i normalnym prawie się nie rusza. **Scenariusze b i c (tylko jedna linia obca) na normalnym rosną o 1 jednostkę** — nie „prawie się nie ruszają”: epoka 1 bez budynków 2/1 → 2/2; epoka 2 bez budynków 3/1 → 3/2; epoka 3 bez budynków 3/2 → 4/3; z Garnizonem (budynek) epoka 2 b 1/0 → 2/0 i epoka 3 b 1/0 → 2/0 (epoka 1 z Garnizonem b bez zmian: 1/0). Pełne wiersze w `10-wyniki-silnika.md`, sekcja 2. Na łatwym b i c zostają bez zmian, poza d.

---

## 4. Co daje dolna granica (D) przy trudnym — szukanie wartości

Scenariusz d (obca+obca), bez budynków, epoka 1, pop 5, neutralny (SILNIK, zakres D przy G = 0):

- neutralny = 2 jednostki: D od −1 do −1,
- neutralny = 3 jednostki: D od −8 do −2,
- neutralny = 4 jednostki: D od −16 do −9 (**dziś zaproponowane −20 daje „brak”**).

Mutacja m1 (D = −12 na trudnym, G = 0; sekcja 9 w `model-kultura-religia-model2-entry.ts`, wyniki w `10-wyniki-silnika.md`), pop 5, epoka 1, neutralny / wyjście:

| scenariusz | budynki | propozycja (D −20) | m1 (D −12) |
|---|---|---|---|
| a | bez | 2/1 | 2/1 |
| b | bez | 4/3 | 3/2 |
| c | bez | 4/3 | 3/2 |
| d | bez | brak/4 | 4/3 |
| d | Garnizon | 3/2 | 2/1 |

Czyli D −12 daje obcej kulturze i obcej religii dokładnie 4 do neutralnego, ale zmienia też b i c (teraz 3 zamiast 4 do neutralnego) i własne miasta nie zmieniają się wcale (a).

Dla normalnego (G = +5): 2 jednostki dla D od −6 do −1; 3 dla D od −16 do −7 (obecne −15 = zgodne); 4 dla D od −26 do −17. Dla łatwego (G = +10): 2 dla D od −11 do −1 (obecne −10 = zgodne).

Wartość G nie wpływa na scenariusz d (miasto obce nie ma własnej kultury), więc G dobiera się tylko pod scenariusze własne.

---

## 5. Efekt na WŁASNE miasta i stolice (pop 5, scenariusz a, bez budynków; pozostałe pop w §6)

| Poziom | Epoka | Garnizon | Szczęście % (dziś → propozycja) | Prawo % (dziś → propozycja) | Porządek % (dziś → propozycja) | Bunt |
|---|---|---|---|---|---|---|
| Łatwy | 1 | 0 | 64,5 → 64,5 | 0 → 51 | 35,5 → 58,4 | brak |
| Normalny | 1 | 0 | 43 → 13,2 | 0 → 22,3 | 21,5 → 17,8 | bunt, nie skrajny |
| Normalny | 1 | 1 | 43 → 13,2 | 44,6 → 67 | 43,8 → 40,1 | neutralny |
| Trudny | 1 | 0 | 36,8 → 0 | 0 → 0 | 16,6 → **0** | **bunt skrajny, rebelia w turze 4** |
| Trudny | 1 | 1 | 36,8 → 0 | 29,8 → 29,8 | 33 → 16,4 | bunt, nie skrajny |
| Trudny | 1 | 2 | 36,8 → 0 | 59,5 → 59,5 | 49,3 → 32,7 | neutralny |
| Trudny | 2 | 0 | 42,9 → 0 | 0 → 0 | 19,3 → **0** | **bunt skrajny, rebelia w turze 4** |
| Trudny | 3 | 0 | 45,1 → 0 | 0 → 0 | 20,3 → **0** | **bunt skrajny, rebelia w turze 4** |

Nowe osady (pop 1–2) na trudnym bez garnizonu: epoka 1 bez buntu skrajnego (Porządek 20,7 / 14,4), epoka 2–3 — **bunt skrajny z rebelią w turze 4** (Porządek 6,4–12,9 wg `10-wyniki-silnika.md` sekcja 4: epoka 2 pop 1 = 12,9, pop 2 = 9,0; epoka 3 pop 1 = 9,2, pop 2 = 6,4). Na normalnym i łatwym nowe osady bez garnizonu są stabilne lub w buncie bez rebelii.

**Wniosek:** na trudnym każde własne miasto bez garnizonu od epoki 2 buntuje się w 4 turze, a do neutralnego potrzebuje 2 jednostek (epoka 1, pop 5) zamiast 1 dziś. Stolica z Pałacem ma dodatkowe Prawo (+35/45/55) poza modelem — NIE MODELOWANE, wymaga osobnego liczenia.

**Zamożność miasta (suwak handlu, maksimum 100%):** podatki dają wtedy +10 zamiast −5,6. Dla własnego miasta bez garnizonu na trudnym daje to Porządek 11,5% — nadal bunt skrajny z rebelią w turze 4 (epoka 1). Na normalnym maksimum Zamożności podnosi Porządek bez garnizonu z 18% do 41% (neutralny). Dla obcego miasta (d) wynik się nie zmienia — Szczęście jest obcięte do 0%.

---

**Pokrycie budynków (korekta obrony):** Świątynia (`gra/data/buildings.json`) ma epokaWejscia 2 i wymaga Kamiennych kręgów w mieście; w grze daje zadowolenie 2 (poziom 1), +1 za poziom, maks. poziom 2. Model stosuje stałe 2 (poziom 1) bez względu na trudność; parametr `religia_swiatynia_zadowolenie` (2/1/0 wg trudności) NIE jest czytany przez `gra/src` (0 trafień), więc nie jest on źródłem wartości w grze. Poziom 2 Świątyni NIE jest modelowany. Świątynia SAMA (bez Garnizonu) jest policzona w sekcji 10 modelu; wiersze „Swi+Garn” w sekcji 1 są identyczne z „Garn” dla scenariuszy, w których Szczęście jest obcięte do 0%, więc tam wpływ Świątyni nie widać; wpływ Świątyni bez Garnizonu jest w sekcji 10. Pretorium modelowane tylko w pakiecie Swi+Garn+Pret (epoka 3), zgodnie z tabelą budynków w modelu.

## 6. Dodatek: pop 3 / 8 i wszystkie kombinacje

Pełne wyniki (pop 3, 5, 8; epoki 1–3; budynki; wszystkie scenariusze; neutralny i wyjście; porównanie „dziś” i propozycja) są w `dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-wyniki-silnika.md` (sekcja 1 i 2). Najważniejsze (sprawdzone w wynikach): dla obcej kultury i religii różnica wymogu względem pop 5 wynosi około 1 jednostki (normalny, bez budynków, do neutralnego: 3 / 3 / 4 dla pop 3 / 5 / 8; trudny: 4 do wyjścia z buntu także przy pop 8, neutralny nadal „brak”).

---

## 7. Wpływ na AI (ocena statyczna, NIE ZMIERZONO w grze)

- `gra/src/game/ai-city-garrison.ts` utrzymuje **jeden** garnizon na miasto (`cityNeedsGarrison`), a rezerwę złota dla najwyżej 3 pustych miast (`garnizon_rezerwa_max_miast`). Nie ma celu 2–4 jednostek na miasto.
- Przy propozycji miasto AI w obcej kulturze i religii (scenariusz d, bez budynków) z **1 jednostką** wpada w bunt: normalny Porządek 0% (rebelia po 5 turach), trudny 0% (po 4), łatwy 5,8% (po 6). Po podboju 5 tur wymuszonego Prawa 100% (`POST_CAPTURE_LAW_PCT`, świeży podbój = 5 tur wg `gra/src/game/post-capture-law.ts`) opóźnia rebelię, a nie zapobiega jej: obca kultura+religia, trudny, epoka 1, pop 5, bez garnizonu — rebelia w turze 9 zamiast w turze 4 (SILNIK, sekcja 11 modelu; wcześniej opcja `postCapture` była w modelu nieużywana i bez liczby). Odbicie po buncie (10 tur) NIE MODELOWANE.
- Miasta AI we własnej kulturze (scenariusz a) są stabilne przy 1 jednostce na łatwym i normalnym, a na trudnym mają Porządek 16% (bunt, bez rebelii).
- **Wniosek:** AI musiałaby trzymać 2–3 jednostki w każdym mieście zdobytym z obcą kulturą (2 do neutralnego na łatwym, 3 na normalnym, 4 do wyjścia na trudnym), a obecny kod tego nie robi. Ryzyko: utrata miast AI w wojnach, zanik stolic i bunty AI. Pomiar 60–90 tur AI: NIE ZMIERZONO.

---

## 8. Ryzyka i pytania do właściciela (DECISION_REQUIRED, jedno zdanie skutku na wariant)

1. **Obcięcie Szczęścia od 0% — zostaje?** Zostaje: wymagania z §3 (2 / 3 / 4). Usunięte: obce miasta dostają jeszcze gorsze wyniki (bez dolnego obcięcia brak neutralnego przy 4 jednostkach na łatwym i normalnym, SILNIK, sekcja 3 wyników).
2. **Trudny: własne miasto bez garnizonu buntuje się w turze 4.** Wariant A: zostawić tak (trudny = najwyższy wpływ). Wariant B: dodać jednostkę Prawa za każde miasto własne (skutek: mniej buntów, zmiana poza tym tematem). Wariant C: łagodniejsze G na trudnym niż 0 (skutek: sprzeczne z „0 plusów”).
3. **Trudny: obca kultura i religia nie dają neutralnego tieru nawet przy 4 jednostkach.** Wariant A: zostawić D = −20 (4 jednostki tylko do wyjścia z buntu). Wariant B: D = −16 … −9 (4 jednostki do neutralnego, zgodne z celem „4”). Wariant C: D = −12 (skutek: d = 4 do neutralnego i 3 do wyjścia; b i c spadają z 4 do 3 do neutralnego, z 3 do 2 do wyjścia; a bez zmian — tabela w §4).
4. **Łatwy: własne miasto dostaje +20 Prawa bez garnizonu** (Szczęście zostaje jak dziś, zmienia się tylko Prawo). Wariant A: zaakceptować (łatwy = stabilny, Porządek 58% zamiast 36%). Wariant B: mniejsze G na łatwym (skutek: własne miasta na łatwym mniej stabilne niż w propozycji, nadal lepsze niż dziś).
5. **Epoka 3 na trudnym: obca kultura i religia bez budynków nieosiągalna dla neutralnego.** Wariant A: zostawić (ciężkie wejście w epokę 3). Wariant B: skala epok na trudnym mniejsza (skutek: inne mnożniki niż proporcjonalne).

Pytania 2–5 wymagają wyboru wariantu przez właściciela; nie są rozstrzygane tutaj.

---

## 9. Rozbieżności z dispatchem (szacunki orkiestratora sprawdzone silnikiem)

- Szacunek „3/3/4 do neutralnego” (łatwy/normalny/trudny): silnik daje **2 / 3 / brak**. Szacunek „2/3/3 do wyjścia”: silnik daje **2 / 3 / 4**.
- Szacunek „łatwy +40/+40”: po korekcie łatwy daje +20 Szczęścia i +20 Prawa (§1).
- Szacunek „dziś obca+obca = 2 jednostki”: zgodne (SILNIK, normalny i łatwy, bez budynków; trudny dziś daje 2/1).

---

## 10. Czego NIE zmierzono

- Pomiar w grze, runtime i AI (wszystkie liczby to SILNIK).
- Tempo przejęcia kultury i religii po podboju (start 0% własnej).
- Skutek bunt–rebelia w grze po przekroczeniu progu (tylko liczenie tury w silniku).
- Stolica z Pałacem, Dom Starszyzny, Dwór Zarządcy, Trybunał, Sąd i pozostałe budynki Prawa — poza modelem.
- Pozostałe linie Szczęścia (luksus, cuda, zaopatrzenie, Spichlerz, obywatele) — poza modelem, poza podatkami.
- Ustawienie zapisu bez pola (zgodność zapisów) — nie dotyczy tego modelu.
