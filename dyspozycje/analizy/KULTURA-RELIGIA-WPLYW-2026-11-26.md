# Kultura i religia — wpływ na Szczęście, Prawo i Porządek (analiza, R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1, runda 2 — obrona)

Data: 2026-11-26 · Baza: origin/main 8c45256803986c78572861ffc1319f21fed56d8e · Tag: CULTRELANALYSIS (#172)
Status: ANALIZA I PROPOZYCJA — zero zmian w `gra/**`. Wartości poziomów „neutralny" i „duży" wymagają decyzji właściciela (pytanie ABC, przez turniej C-018 przed pokazaniem właścicielowi).

Ta wersja zastępuje wersję rundy 1. Model NIE jest już reimplementacją w Pythonie: liczby pochodzą z bundla esbuild, który woła prawdziwe funkcje silnika gry (`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`). Oznaczenia: **SILNIK** = wynik modelu z bundla (obliczone, NIE w grze); **NIE ZMIERZONO** = brak pomiaru w grze, runtime ani AI.

## Streszczenie dla właściciela

1. Obca kultura i obca religia NIE są bez znaczenia. Pusty pop-5 gród epoki 1 (normal, bez budynków) z obcą kulturą i religią ma Porządek 0%, czyli bunt skrajny, a po 5 turach bunt (SILNIK). Potrzebuje **2 jednostek garnizonu** do tieru „neutralny" (Porządek ≥ 30) i **1** do wyjścia z buntu skrajnego. Własna kultura i religia potrzebuje 1 jednostki do neutralnego (SILNIK).
2. Dwa ustalenia korygują rundę 1: silnik dolicza linię podatków (−5,6 pkt Szczęścia przy domyślnej Zamożności, także dla pustego miasta), a mianownik Prawa dla pop 5 to 44,8 (40 × 1,12), nie 35 × 1,12. Wniosek „2 jednostki dla obcej kultury i religii" został potwierdzony, ale liczby Szczęścia i Porządku się zmieniły.
3. Propozycja „duży" z rundy 1 (bez dolnego obcięcia Szczęścia) NIE daje „4 jednostek" w tierze neutralnym: dla obcej kultury i religii bez budynków tier neutralny nie jest osiągalny nawet przy 6 jednostkach (SILNIK, normal, epoka 1). Te 4 jednostki dotyczą dopiero wyjścia z buntu skrajnego. Zmiana wymaga przeprojektowania (§3).
4. Wariant z dolnym progiem Szczęścia −100% (zamiast 0%) daje dla obcej kultury i religii bez budynków **4 jednostki do tieru neutralnego** i 3 do wyjścia z buntu skrajnego (normal, epoka 1), a dla pojedynczej obcej linii 2. Świątynia i Garnizon (budynek) zmniejszają wymóg o 1. Ten wariant zmienia Szczęście% każdego miasta, więc wymaga analizy konsumentów (§3, §5).
5. Kary bez budynków utrzymują się, dopóki miasto nie przejmie naszej kultury i religii. Tempo przejęcia NIE ZMIERZONO (§4). Wpływ na AI, balans wojen i stolice NIE ZMIERZONO (§5).

## 1. Stan (co dziś robi gra) — z cytowanych linii

**Szczęście — kultura i religia** (`gra/src/game/society-breakdown.ts`, `proporcjonalneSzczescie` ok. linii 573, `computeHappinessBreakdown` ok. linii 702–810):
- Wzór: `szczęście = 2·x·udział_własnej − x`, x z `szczescie_skala_kultura_religia` (`gra/data/society-params.json`): epoka 1 = 10, epoka 2 = 16, epoka 3 = 23 (easy/normal/hard tak samo).
- Udział kultury: `ownCultureShare` (brak = 1). Udział religii: `ownReligionShare`. Miasto bez wyznawców = linia 0.
- Stare schodki `cultureHappiness` i binarny `religionHappiness` są zastąpione. Kary `kultura_kara_zadowolenie_lt50/lt25` (easy −1,5/−2, normal −2/−4, hard −2,5/−6) są w JSON; **czy trafiają do wyniku — NIE ZMIERZONO** (pole `haKult` jest oznaczone jako IGNOROWANE w typie `HappinessBreakdownInput`).

**Szczęście — mianownik i obcinanie:** `szMaxForCity` (ok. linii 616) = `Math.round(szczescie_max_epoka[epoka] × mnożnik × 100)/100`, mnożnik = (1 + 0,04)^(pop − 2) zaokrąglony do 2 miejsc (SILNIK: dla pop 5 = 1,12). Normal epoka 1 = 30 → szMax 33,6. `pctFromNetto` → `clampPct` (ok. linii 498–505) obcina wynik do **[0, cap = 120]**. Obcięcie dotyczy **sumy netto wszystkich linii Szczęścia**, nie samej linii kultury i religii (patrz §3).

**Linie Szczęścia obecne w silniku, nie wymienione w rundzie 1:** `wysokie_podatki` (linia G7, liniowa od udziału Zamożności; bez danych Zamożności −5,6 pkt, SILNIK). Model z tego obliczenia obejmuje tę linię, pozostałe (luksus, cuda, Wealth, zaopatrzenie, Spichlerz, obywatele) NIE są modelowane.

**Prawo** (`computeLawBreakdown`, ok. linii 817–905): `prawo_garnizon_per_jednostka` = 20 (easy 25, hard 15), cap = 5 (easy 5, hard 4); budynek Garnizon = 25/35/47 wg epoki (`prawo_garnizon_budynek_epoka`); Pretorium = `prawo_pretorium` (normal 38, easy 50, hard 31), tylko epoka 3 w modelu; `prawMax` = `prawo_max_epoka` (normal 40/65/85, easy 35/55/75, hard 45/75/100) × mnożnik populacji, obcięcie do [0, 170]. Brak garnizonu nie daje kary (kary `prawo_kara_*` są martwe, D5).

**Porządek** (`computePorPct`, ok. linii 991): `clampPct(waga_szczęście × szPct + waga_prawo × prawPct, cap 120)`. Wagi: normal 0,5/0,5; easy 0,55/0,45; hard 0,45/0,55.
- Pasma (`porPctBand`, ok. linii 912): Ład ≥ 90, Spokój ≥ 70, Napięcie ≥ 50, Niepokój ≥ 30, Bunt ≥ `porzadek_prog_bunt_skrajny_pct` (normal 12, easy 6, hard 14), poniżej — Bunt skrajny.
- Tier (`tierFromPorPct`, ok. linii 932): unrest < 30, neutral 30–89, order ≥ 90.
- Bunt: `updateRevoltGrace` (ok. linii 1121) — przy Porządku poniżej progu krytycznego odlicza `REVOLT_GRACE_TURNS` = 3 tury, po czym `shouldTriggerRebellion`. SILNIK w tabeli „tura buntu": bunt skrajny w turze 1 → bunt w turze 5. **Skutek buntu po jego uruchomieniu — NIE PRZEANALIZOWANO.**
- Uwaga: `order.ts` ma drugi system progów (`porzadek_prog_t1/t2`, w surowych punktach). **Czy jest czytany w turze — NIE ZMIERZONO.**

**Podbój** (`post-capture-law.ts`): `POST_CAPTURE_LAW_PCT = 100` przez `POST_CAPTURE_FRESH_TURNS = 5` tur; to maskuje kare (§2, tabela A2).

**Przejęcie miasta — religia** (`onCityCapturedReligion`, `gra/src/game/culture-religion.ts` ok. linii 788–813): udział nowego właściciela = `1 − udział poprzedniego właściciela` (linie 806–807). Dla miasta w 100% obcej religii start wynosi 0% naszej, czyli scenariusz „obca religia" z modelu. Wyjątek: ta sama kultura cywilizacyjna → stan domyślny (`defaultCityReligionState`). **Start udziału KULTURY po podboju — NIE SPRAWDZONO** (założenie 0% własnej, jak w rundzie 1).

**Kultura — przejęcie w czasie:** parametry `kultura_konwersja_baza_tura` (easy 2, normal 1, hard 0), `kultura_konwersja_cel_100pct` (100), `kultura_konwersja_cap_tura` i wkłady budynków `kultura_konwersja_{swiatynia, amfiteatr, biblioteka, palac, stela, sad, laznia}` (sekcja `kultura` w JSON). Funkcja `convertCulture` (ok. linii 447). **Tempo przejęcia w turach — NIE ZMIERZONO.** Wpływ świątyni na religię (`convertViaTemple`, ok. linii 1160) — NIE ZMIERZONO.

**Asymilacja i czas kar:** kary z tytułu obcej kultury i religii NIE mają osobnego limitu czasowego. Znikają wraz z przejęciem (przez konwersję), a w pierwszych 5 turach po podboju przesłania je wymuszone Prawo 100%. Osobny mechanizm „czasu kary" nie został zaprojektowany.

## 2. Model (SILNIK, nie w grze)

Źródła modelu (committed): `dyspozycje/analizy/model-kultura-religia-entry.ts` — importuje `computeHappinessBreakdown`, `computeLawBreakdown`, `computePorPct`, `loadRevoltParams`, `updateRevoltGrace`, `tierFromPorPct`, `porPctBand`, `szMaxForCity`, `prawMaxForCity`, `loadOrderParams` z gry. Wariant „mały/neutralny/duży" to kopia `society-params.json` z podmienionym `szczescie_skala_kultura_religia`; wariant „bez dolnego obcięcia" i „dolny próg" liczy Szczęście% z `netto` zwróconego przez silnik.

Budowa i uruchomienie (cwd = korzeń repo; bundle poza repo):
```
SCR=<scratchpad>
npx -y esbuild@0.24.0 dyspozycje/analizy/model-kultura-religia-entry.ts --bundle --platform=node --format=cjs --outfile=$SCR/model.cjs --log-level=warning
node $SCR/model.cjs > $SCR/model-out.txt
```
Wynik: `model-out.txt`, sekcje A, A2, B, C, D, E, F (pełne tabele w scratchpadzie, nie w repo). Założenia: pop 5, normal (chyba że podano inaczej), bez innych linii Szczęścia niż kultura, religia, podatki i Świątynia (era 2+); udział kultury/religii 0 lub 1.

**Wynik „mały" (obecne wartości), normal, epoka 1, pusty pop 5 — Sz% / Por% / tier / tura buntu (SILNIK):**

| Scenariusz | Garnizon 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| a) własna kultura + własna religia | 43 / 21,5 / bunt / — | 43 / 43,8 / neutral | 43 / 66,2 / neutral | 43 / 88,5 / neutral |
| b) obca kultura, własna religia | 0 / 0 / bunt skrajny / **5** | 0 / 22,3 / bunt | 0 / 44,7 / neutral | 0 / 67 / neutral |
| c) własna kultura, obca religia | 0 / 0 / bunt skrajny / **5** | 0 / 22,3 / bunt | 0 / 44,7 / neutral | 0 / 67 / neutral |
| d) obca kultura + obca religia | 0 / 0 / bunt skrajny / **5** | 0 / 22,3 / bunt | 0 / 44,7 / neutral | 0 / 67 / neutral |

Minimum jednostek (normal, epoka 1, mały): a = 1 (neutral), b/c/d = 2 (neutral), 1 (wyjście z buntu skrajnego).

**Ten sam zestaw z wymuszonym Prawem 100% (5 tur po podboju, tabela A2):** a = 71,5, b/c/d = 50 (tier neutral, bez buntu). Kara jest w tym czasie niewidoczna.

**Budynki (SILNIK, normal, epoka 1 i 3, mały):**
- Garnizon (budynek): obniża wymóg d z 2 do 1 jednostki (Por 50,2 przy 1 jedn. i Garnizonie, epoka 1); a = 0 jednostek.
- Świątynia (era 2+, wymaga Kamiennych kręgów; buildings.json: epokaWejscia 2, baza zadowolenie 2): dla d w epoce 2 nie zmienia wymogu (1 jedn. z Garnizonem, z lub bez Świątyni), bo Sz jest obcięte do 0%.
- Pretorium (epoka 3, `prawo_pretorium` normal 38): dla d w epoce 3 z Garnizonem i Świątynią wymóg spada do 0 (SILNIK, tabela B).
- Inne budynki (Teatr = epokaWejscia 3, „suppressed", wliczony w Akademię; Amfiteatr, Sąd, Trybunał, Dwór, Pałac) — NIE MODELOWANE (Amfiteatr: NIE SPRAWDZONO wartości).

**Trudność (SILNIK, dla d, mały, bez budynków, tabela E):**

| Trudność / epoka | n=0 | n=1 | n=2 | n=3 | n=4 |
|---|---|---|---|---|---|
| easy, epoka 1 | 0 (bunt skrajny) | 28,7 (bunt) | 57,4 (napięcie) | 76,5 | 76,5 |
| normal, epoka 1 | 0 (bunt skrajny) | 22,3 (bunt) | 44,7 (niepokój) | 67 | 85 |
| hard, epoka 1 | 0 (bunt skrajny) | 16,4 (bunt) | 32,7 (niepokój) | 49,1 | 65,5 |
| normal, epoka 3 | 0 (bunt skrajny) | 10,5 (bunt skrajny) | 21 (bunt) | 31,5 (niepokój) | 42 |
| hard, epoka 3 | 0 (bunt skrajny) | 7,4 (bunt skrajny) | 14,7 (bunt) | 22,1 (bunt) | 29,5 |

Uwaga: w epoce 3 (normal, hard) jednostka nie wystarcza do wyjścia z buntu skrajnego; to ryzyko buntu, nie tylko wymóg tieru.

**Kontrola składowych (SILNIK, F):** szMax = 33,6 i prawMax = 44,8 dla wszystkich trudności w epoce 1, pop 5. Scenariusz a netto = 14,4 (kultura +10, religia +10, podatki −5,6). Scenariusz d netto = −25,6 (kultura −10, religia −10, podatki −5,6).

## 3. Propozycja trzech poziomów (decyzja właściciela)

Wartości poziomów są propozycją, nie wyprowadzeniem mnożnikiem. Epoka 1: mały 10 / neutralny 7 (×0,7) / duży 16 (×1,6). Epoka 2: 16 / 11 / 23. Epoka 3: 23 / 16 / 33. Wartości „duży" 23 i 33 NIE są mnożnikiem 1,6 (23·1,6 = 36,8). Są to stałe wybrane do przetestowania. Wartości epok 2–3 są teraz liczone przez silnik (tabela B), ale nie są zatwierdzone.

| Parametr | Plik / klucz | Mały (obecne) | Neutralny (propozycja) | Duży (propozycja) |
|---|---|---|---|---|
| x kultury i religii (epoka 1/2/3) | `gra/data/society-params.json` → `szczescie.szczescie_skala_kultura_religia` | 10 / 16 / 23 | 7 / 11 / 16 | 16 / 23 / 33 |
| Dolny próg Szczęścia % (NOWY klucz, wariant B) | `szczescie.szczescie_pct_dol` (nowy) | 0 (obecne) | 0 | −100 (wariant testowany; −50 jako alternatywa) |
| Garnizon / Prawo / wagi / progi pasm | bez zmian | — | — | — |

**Wyniki SILNIKA dla każdego wariantu (normal, epoka 1, pop 5, scenariusz d = obca kultura i obca religia, bez budynków / z Garnizonem budynkiem; minimum do tieru neutralnego / do wyjścia z buntu skrajnego):**

| Wariant | a) | b)/c) | d) |
|---|---|---|---|
| MALY (obecne) | 1 / 0 | 2 / 1 | 2 / 1 (z Garnizonem: 1 / 0) |
| NEUTRALNY x=7, obcięcie od 0% (jak MALY) | 1 / 0 | 2 / 1 | **2 / 1** (identyczne z MALY — x nie zmienia d przy obcięciu) |
| DUZY x=16, obcięcie od 0% | 0 | 2 / 1 | 2 / 1 — identyczne z MALY dla d |
| DUZY x=16, BEZ obcięcia (pełna liczba ujemna) | 0 | 2 / 1 | **>6 / 4** (z Garnizonem: >6 / 2) |
| DUZY x=16, dolny próg −50 | 0 | 2 / 1 | 3 / 2 (z Garnizonem: 2 / 1) |
| DUZY x=16, dolny próg −100 | 0 | 2 / 1 | **4 / 3** (z Garnizonem: 3 / 2) |

Wniosek dla właściciela: w wariancie z obcięciem od 0% (jak dziś) zmiana samego x nie zmienia obcej kultury i religii — poziomy różnią się tylko w scenariuszach a–c. Aby dostać „4 jednostki dla obcej kultury i religii" (przykład właściciela) w tierze neutralnym, potrzebny jest dolny próg Szczęścia poniżej 0%. Próg −100% daje 4 (epoka 1), ale w epoce 3 już >6 (bez budynków) i 5 (z Garnizonem), co wymaga osobnej decyzji.

**Konsekwencja implementacyjna dolnego progu:** wartość obcięcia zmienia Szczęście% każdego miasta, nie tylko kultury i religii, ponieważ `clampPct` działa na sumie netto. Konsumenci `szPct` (Porządek, efekty pasm, HUD, `pctFromNetto`) NIE PRZEANALIZOWANI. Przed wyborem wariantu konieczna jest analiza tych konsumentów i wpływu na miasta bez obcej kultury (np. ujemne Szczęście przy wysokich podatkach).

**Ocena każdego wariantu pod kątem celów dispatchu:** cel „4 jednostki dla d (bez budynków)" — spełniony tylko przez wariant z progiem −100% (tier neutralny, normal epoka 1); cel „2 jednostki dla b/c" — spełniony przez wszystkie warianty; cel „budynki znacząco zmniejszają wymóg" — Garnizon budynek i Pretorium: −1 jednostkę; Świątynia: nie zmienia wymogu d w epoce 2 (z Garnizonem: 1 jednostka z Świątynią i bez niej, SILNIK tabela B), bo przy obcięciu od 0% dodatek +2 jest zjadany przez dno Szczęścia. Świątynia nie spełnia celu.

## 4. Mechanizm przejęcia i czas kar (opis, NIE ZMIERZONO w tempie)

- Religia po podboju: nowy udział = 1 − udział poprzedniego właściciela (`onCityCapturedReligion`). Dla miasta w 100% obcej religii start = 0% naszej religii.
- Kultura po podboju: start udziału NIE SPRAWDZONY (założenie 0%).
- Konwersja kultury: `convertCulture` z parametrami `kultura_konwersja_*`; budynki przyspieszają (świątynia, amfiteatr, biblioteka, pałac, stela, sad, łaźnia). Tempo w turach NIE ZMIERZONO.
- Kara „bez budynków" trwa dopóki udział naszej kultury i religii nie wzrośnie. Brak osobnego limitu czasowego. Ten mechanizm nie został przeprojektowany w tej analizie.

## 5. Ryzyka (wszystkie NIE ZMIERZONO, poza liczbami SILNIKA powyżej)

- **AI:** `ai-city-garrison.ts` i `ai-city-capture-executor.ts` NIE ZBADANE pod kątem garnizonu 2–4 w miastach zdobytych. Wymagany pomiar 100+ tur na poziomach „duży" i „neutralny" (NIE ZMIERZONO).
- **Bunt i rozpad AI:** bunt skrajny w epoce 3 (normal, hard) przy 1 jednostce i bez budynków (SILNIK, tabela E). Czy AI utrzyma garnizony i nie straci wszystkich miast — NIE ZMIERZONO.
- **Balans wojen epoki:** wyższy koszt garnizonu (żywność jednostek 4/16/64, UPKEEPMULT) plus silniejsza kara za podbój — NIE ZMIERZONO.
- **Stolice i osadnictwo:** stolica ma kulturę własną (mały wpływ). Nowe osady (pop 1–2) mają inny mianownik i wymagają osobnej tabeli — NIE MODELOWANE.
- **Konsumenci Szczęścia%** (§3): wariant z dolnym progiem zmienia wartości wszystkich miast — NIE PRZEANALIZOWANE.
- **Drugi system tierów (`order.ts`)** — czy czytany w turze: NIE ZMIERZONO.
- **Sprzeczność komentarza:** `buildingZadowolenie` w typie opisuje Świątynię jako „+3", a `buildings.json` ma bazę zadowolenia 2. Model używa wartości z danych (2). Rozstrzygnięcie — do potwierdzenia.

## 6. Ustawienie „Kultura i religia" (mały / neutralny / duży)

Wzorzec: „Dyplomacja i wojna" (`gra/src/ui/newGameFlow.ts`, `gra/src/game/diplomacy-war-level.ts`) i „Koszty jednostek" (`kosztJednostekPace`). Pliki do zmiany (propozycja, nie wykonana):
1. `gra/src/ui/newGameFlow.ts` — pole `advanced.kulturaReligia: 'maly' | 'neutralny' | 'duzy'` (domyślnie `maly`), etykieta i podsumowanie.
2. `gra/src/game/culture-religion-level.ts` (nowy) — typ i mapa poziom → zestaw parametrów (x, dolny próg), wzorem `diplomacy-war-level.ts`.
3. `gra/data/society-params.json` — wartości per poziom i nowy klucz dolnego progu (wariant B).
4. `gra/src/game/society-breakdown.ts` — `clampPct` dla sumy Szczęścia czyta próg z parametrów zamiast stałego 0.
5. Stan gry i zapis: pole stanu; zapis bez pola = `maly` (bit-w-bit).
6. `gra/src/main.ts` — `__settingsLive` (hak civTest), jeśli testy na żywo mają zmieniać poziom.

Testy: „mały = obecne bit-w-bit" (porównanie z tabelą A), tabela B jako test regresji silnika, test zapisu bez pola, test progu −100%.

## 7. Czego NIE zmierzono

- Pomiar w grze, runtime i AI (wszystkie liczby to SILNIK, nie zrzut z gry).
- Start udziału kultury po podboju.
- Tempo konwersji kultury i religii; wpływ świątyni na religię.
- Skutek uruchomienia buntu po grace.
- Czy `haKult` (`cultureHappiness`) i `order.ts` (drugie progi) wpływają na wynik.
- Linie Szczęścia poza kulturą, religią, podatkami i Świątynią (luksus, cuda, Wealth, zaopatrzenie, Spichlerz).
- Amfiteatr, Sąd, Trybunał, Dwór, Pałac — NIE MODELOWANE.
- Zachowanie AI i balans wojen przy poziomach „duży" i „neutralny".
