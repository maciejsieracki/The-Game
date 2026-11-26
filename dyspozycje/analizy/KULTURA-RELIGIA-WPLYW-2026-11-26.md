# Kultura i religia — wpływ na Szczęście, Prawo i Porządek (analiza, R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1)

Data: 2026-11-26 · Baza: origin/main 8c45256803986c78572861ffc1319f21fed56d8e · Tag: CULTRELANALYSIS (#172)
Status: ANALIZA I PROPOZYCJA — zero zmian w `gra/**`. Wartości poziomów „duży" i „neutralny" wymagają decyzji właściciela (pytanie ABC).

## Streszczenie dla właściciela

1. Dziś obca kultura i obca religia NIE są bez znaczenia: w modelu świeżo zdobyte miasto (5 mieszkańców, epoka 1, normalnie) bez budynków potrzebuje **2 jednostek garnizonu** do spokoju (Porządek ≥ 30), a nie 0 — tylko 5 tur po podboju Prawo jest wymuszone na 100% i to maskuje problem.
2. Powodem jest to, że wpływ kultury i religii na Szczęście jest proporcjonalny (2·x·udział − x, x = 10 w epoce 1), ale wynik Szczęścia jest obcinany do 0% z dołu, więc kara „obca" znika w całości w postaci utraconego plusa (różnica własna–obca to ok. 60 pkt Szczęścia %, czyli ok. 30 pkt Porządku).
3. Świątynia (+2 Szczęścia) przy obcej kulturze i religii nie daje nic, bo wynik i tak jest obcięty do 0%.
4. Poziom „duży" (Szczęście kultury i religii bez obcinania od dołu, x = 16 w epoce 1) daje: obca kultura i religia bez budynków = **4 jednostki**, obca kultura lub religia = **2 jednostki**, świątynia zmniejsza wymóg o 1. Poziom „neutralny" (x = 7 bez obcinania) daje: obca kultura i religia = **2 jednostki**, pojedyncza obca = 2. Poziom „mały" = obecne wartości bit-w-bit.
5. Ustawienie „Kultura i religia" (mały/neutralny/duży) wymaga parametrów per poziom i nowego klucza w `society-params.json`; stare zapisy zostają na „mały". Liczby to model (reimplementacja wzorów, NIE bundle gry) — NIE ZMIERZONO w grze, runtime i AI.

## 1. Stan (co dziś robi gra) — z cytowanych linii

**Szczęście — kultura i religia** (`gra/src/game/society-breakdown.ts`, G4, linie ~560–583 i ~721–737):
- Wzór: `szczęście = 2·x·udział_własnej − x` (`proporcjonalneSzczescie`), `x` z `szczescie_skala_kultura_religia` (`gra/data/society-params.json`): epoka 1 = 10, epoka 2 = 16, epoka 3+ = 23 (ta sama wartość dla easy/normal/hard).
- Udział kultury: `input.ownCultureShare` (brak = 100% własnej); udział religii: `ownReligionShare`, a gdy brak — odtworzony z `haRel` (`ownShareFromSignal`). Miasto bez wyznawców = linia 0.
- Stare schodki `cultureHappiness` (`culture-religion.ts`, linie 394–405; parametry `kultura_kara_zadowolenie_lt50/lt25` = −2/−4 w normal) i binarny `religionHappiness` są zastąpione przez G4; w `main.ts` (ok. 44770) `cultureHappiness` jest nadal liczone jako `haKult` — **do potwierdzenia, czy trafia do wyniku** (NIE ZMIERZONO).
- Kara „obca religia" (`szczescie_kara_obca_religia`, −4) i „podbój obca kultura i religia" są usunięte (G5, komentarz przy `society-breakdown.ts:109`).

**Szczęście — mianownik i obcinanie:** `szMax = szczescie_max_epoka[epoka] × (1 + 0,04)^max(0, pop − 2)` (`szMaxForCity`), normal epoka 1 = 30. `szPct = clampPct(100·netto / szMax, cap 120)` — `clampPct` (linia ~498) obcina do **[0, cap]**, więc ujemne Szczęście daje 0%.

**Prawo** (`computeLawBreakdown`, linie ~817–905): `prawo_garnizon_per_jednostka` = 20 (normal), `prawo_garnizon_cap_jednostek` = 5; budynek Garnizon = 25 (epoka 1); Pretorium/Sąd/Trybunał/Dwór/Dom/Pałac wg tabeli. `prawMax = 35 × (1,04)^(pop−2)` (normal epoka 1); `prawPct` obcinany do [0, 170]. Brak garnizonu nie daje kary (kary `prawo_kara_brak_garnizonu` usunięte na stałe, D5).

**Porządek** (`computePorPct`, linia ~991): `PorPct = clamp(0,5·szPct + 0,5·prawPct, 0, 120)` (normal: `porzadek_waga_szczescie` 0,5, `porzadek_waga_prawo` 0,5).
- Pasma (`porPctBand`, ~912): Ład ≥90, Spokój ≥70, Napięcie ≥50, Niepokój ≥30, Bunt ≥12, Bunt skrajny <12 (`REVOLT_CRITICAL_POR_PCT` = 12, `society-breakdown.ts:192`).
- Tier żywy (`tierFromPorPct`, ~932): unrest <30, neutral 30–89, order ≥90.
- **Uwaga:** `order.ts` ma drugi system tierów (`orderTier` z `porzadek_prog_t1/t2` = 0/6 w normal, `computeOrder` w surowych punktach). Wygląda na pozostałość (komentarz przy ~1063: „zastępuje evaluateOrder"). Parametry `porzadek_prog_t1/t2`, `porzadek_kara_*_t1` itd. w JSON — do potwierdzenia, czy któreś są jeszcze czytane w turze (NIE ZMIERZONO).

**Podbój** (`post-capture-law.ts`): `POST_CAPTURE_LAW_PCT = 100` — przez `POST_CAPTURE_FRESH_TURNS = 5` tury Prawo = 100% (`applyPostCaptureLawOverride`, linia ~125); ochrona przed buntem `REBEL_PROTECTION_TURNS = 20` (linia 33). Oznacza to, że w pierwszych 5 turach garnizon i kultura nie mają znaczenia dla Porządku — **to jest główny powód, dla którego problem wygląda na „nieistotny"**.

**Kultura — przejęcie w czasie:** `convertCulture` (`culture-religion.ts` ~447; `kultura_konwersja_baza_tura`, `CultureBuildings`: biblioteka, teatr, akademia, pałac, stela, sad, łaźnia publiczna przyspieszają). Tempo przejęcia i wpływ świątyni na religię (`convertViaTemple`, ~1160) nie zostały zmierzone w tym temacie (NIE ZMIERZONO).

**Kary aktualnie zastosowane do obcej kultury/religii** (wg G4/G5): tylko utrata dodatniej części Szczęścia (`2·x·udział − x`, obcięta do 0%). Brak osobnej kary, brak limitu czasowego poza konwersją kultury.

## 2. Model (zmierzone na modelu, NIE w grze)

Skrypt: `dyspozycje/analizy/model-kultura-religia-2026-11-26.py`. Uruchomienie (w worktree): `python3 -I dyspozycje/analizy/model-kultura-religia-2026-11-26.py`.
Model to **reimplementacja wzorów** z kodu w Pythonie (nie bundle esbuild z gry — bundle nie był uruchamiany w tym temacie; NIE ZMIERZONO w silniku TypeScript). Założenia: pop 5, epoka 1, normal; brak innych linii Szczęścia (luksus, ustrój, Wealth, cuda, osiedle pop 5 = 0); świeżo zdobyte miasto: udział kultury/religii 0 (obca) lub 1 (własna) — zgodnie z dispatchem, NIE sprawdzono w kodzie `onCityCapturedReligion`/`applyCapturePopulationLoss`, jaki jest start; świątynia = baza zadowolenia 2 (`buildings.json`, poziom 1).

Wynik „mały = obecne" (Porządek po zdobyciu, bez wymuszenia Prawa 100%):

| Scenariusz | Świątynia | Garnizon 0 | 1 | 2 | 4 | Minimum do Porządku ≥30 (neutral) |
|---|---|---|---|---|---|---|
| a) własna kultura + własna religia | nie | 29,8 (bunt, unrest) | 55,2 | 80,8 | 114,8 | **1** |
| b) obca kultura, własna religia | nie | 0,0 (bunt skrajny) | 25,5 | 51,0 | 85,0 | **2** |
| c) własna kultura, obca religia | nie | 0,0 | 25,5 | 51,0 | 85,0 | **2** |
| d) obca kultura + obca religia | nie | 0,0 | 25,5 | 51,0 | 85,0 | **2** |
| a) własna + własna | tak | 32,8 | 58,2 | 83,8 | 117,8 | 0 |
| d) obca + obca | tak | 0,0 | 25,5 | 51,0 | 85,0 | **2** (świątynia nic nie daje — obcięcie) |

Wynik z wymuszonym Prawem 100% (5 pierwszych tur po podboju): wszystkie scenariusze 50–83, tier neutral, **niezależnie od garnizonu** — to maskuje problem.

**Wniosek z modelu:** dziś zdobyte miasto obcej kultury i religii potrzebuje 2 jednostek po 5 turach (nie 0). Dispatch zakładał 0 — model tego nie potwierdza. Różnica własna–obca to ok. 30 pkt Porządku, czyli kara jest realna, tylko ukryta obcięciem Szczęścia do 0% i wymuszonym Prawem przez 5 tur.

Wariant „poziomy" (Szczęście obcinane tylko od góry, cap 120; wszystkie inne parametry bez zmian; era 1, normal):

| x (epoka 1) | a) własna+własna | b) obca kultura | c) obca religia | d) obca+obca | d) ze świątynią |
|---|---|---|---|---|---|
| 10 (poziom obecny, bez obcinania) | 1 | 2 | 2 | **3** | 3 |
| 7 (propozycja „neutralny") | 1 | 2 | 2 | **2** | 2 |
| 16 (propozycja „duży") | 0 | 2 | 2 | **4** | 3 |

Wyliczenie x=7 i x=16: `obca+obca` daje Szczęście −2x → Szczęście% ≈ −41,7 (x=7) i ≈ −95,2 (x=16, obcięte tylko od góry; cap nie dotyczy); potrzebny Prawo% wynosi wtedy odpowiednio 2 lub 4 jednostki. Pojedyncza obca daje Szczęście 0 — tak samo jak obecnie.

## 3. Propozycja trzech poziomów (decyzja właściciela)

Zasada: w każdym poziomie „Kultura i religia" zmienia się **jedno** zachowanie — obcięcie Szczęścia kultury/religii od dołu (`clampPct` dla linii kultura/religia) oraz skala `x` w epoce 1–3. Pozostałe parametry (garnizon 20/jednostkę, cap 5, Pałac, Pretorium, mianowniki, wagi Porządku, progi pasm) — BEZ ZMIAN we wszystkich poziomach.

| Parametr | Plik / klucz | Mały (obecne, bit-w-bit) | Neutralny | Duży |
|---|---|---|---|---|
| Skala Kultury i Religii x (epoka 1/2/3) | `gra/data/society-params.json` → `szczescie.szczescie_skala_kultura_religia` | 10 / 16 / 23 | 7 / 11 / 16 (propozycja: ×0,7) | 16 / 23 / 33 (propozycja: ×1,6) |
| Obcięcie linii kultury/religii do 0% z dołu | NOWY klucz `szczescie.szczescie_kultura_religia_obciecie_dolu` (0/1) | 1 (obecne: obcięte) | 0 (nieobcięte) | 0 (nieobcięte) |
| Zmiana wagi kary obcej kultury (opcjonalnie) | — | — | — | — |
| Garnizon / Prawo / Porządek / pasma / mianowniki | bez zmian | bez zmian | bez zmian | bez zmian |

Wartości dla epok 2 i 3 (16/23 oraz 11/16/… i 16/23/33) są **do potwierdzenia** — model liczy tylko epokę 1 (NIE ZMIERZONO dla epok 2–3).

Wynik modelu dla poziomów (epoka 1, normal, bez świątyni / ze świątynią):
- **Mały:** a = 1/0, b = 2/2, c = 2/2, d = 2/2 (obcięcie: świątynia nie pomaga obcej kulturze).
- **Neutralny:** a = 1/1, b = 2/2, c = 2/2, d = 2/2 (zgodne z celem „ok. 2 jednostki dla obcej kultury i religii").
- **Duży:** a = 0/0, b = 2/2, c = 2/2, d = 4/3 (zgodne z przykładem właściciela: 4 jednostki dla obcej kultury i religii bez budynków; świątynia obniża wymóg).

Uwaga o zgodności z celami dispatchu: „duży" osiąga 4 jednostki dla d i 2 dla b/c, świątynia zmniejsza wymóg o 1 — zgodnie. „Neutralny" daje 2 dla d, zgodnie. Cel „budynki znacząco zmniejszają wymóg" osiągnięty tylko częściowo (−1 jednostka); większy efekt wymagałby nowego budynku lub większej wagi świątyni (NIE MODELOWANE).

Kary do czasu przejęcia NASZEJ kultury: mechanizm przejęcia (`convertCulture`, `kultura_konwersja_baza_tura`, budynki kulturalne) pozostaje; w tej analizie nie zmieniano tempa konwersji (NIE ZMIERZONO, ile tur trwa przejęcie w grze).

## 4. Ustawienie „Kultura i religia" (mały / neutralny / duży)

Wzorzec do naśladowania: „Dyplomacja i wojna" (`gra/src/ui/newGameFlow.ts`, ok. linie 225–260 i 1887, etykieta ok. 2365; typ `DiplomacyWarLevel` w `gra/src/game/diplomacy-war-level.ts`) oraz „Koszty jednostek" (`kosztJednostekPace`, linie ~254 i 1927).

Pliki do zmiany (propozycja):
1. `gra/src/ui/newGameFlow.ts` — nowe pole `p.advanced.kulturaReligia: 'maly' | 'neutralny' | 'duzy'` (domyślnie `maly`), etykieta i podpowiedź w kreatorze, wiersz w podsumowaniu (~linia 2361), komentarz „musi być zsynchronizowany ręcznie" z typem w module gry.
2. `gra/src/game/` — nowy moduł (np. `culture-religion-level.ts`) z typem i mapą poziom → zestaw parametrów (x, obcięcie), wzorem `diplomacy-war-level.ts`.
3. `gra/data/society-params.json` — nowe wiersze (mały/neutralny/duży) dla `szczescie_skala_kultura_religia` (zmiana wartości per poziom) i nowy klucz `szczescie_kultura_religia_obciecie_dolu`.
4. `gra/src/game/society-breakdown.ts` — `proporcjonalneSzczescie`/`computeHappinessBreakdown` czyta obcięcie z parametrów (zamiast stałego `clampPct` dla linii kultury/religii); `main.ts` przekazuje poziom ze stanu gry.
5. Stan gry i zapis: pole w stanie gry + serializacja w zapisie; zapis bez pola = `maly` (kompatybilność starych zapisów = mały, bit-w-bit).
6. `gra/src/main.ts` — `__settingsLive` (hak civTest), jeśli testy na żywo mają zmieniać poziom.

Testy: testy modułu poziomów (3 poziomy × wartości), test „mały = obecne bit-w-bit" (porównanie z tabelą z `culture-religion`/`society-breakdown` na zapisanych wartościach), test kompatybilności zapisu, test modelu z tabeli §2, pomiar AI (§5).

## 5. Ryzyka

- **AI:** `ai-city-garrison.ts` i `ai-city-capture-executor.ts` mogą nie przewidywać garnizonu 2–4 w miastach zdobytych; AI może tracić miasta w buncie. Wymaga pomiaru na 100+ tur przy „duży" (NIE ZMIERZONO).
- **Balans wojen epoki:** wyższy koszt utrzymania garnizonu (żywność jednostek ×1/×2/×4 po FALACH 875/883/887) plus obcięcie Szczęścia → silniejsza kara za podbój; przy „duży" zdobywanie obcych miast może być nieopłacalne.
- **Stolice i osadnictwo:** stolica ma kulturę własną — mało wpływu; nowe osady (mała pop) są najbardziej narażone na zmianę wymogu (pop 1–2 mają inny mianownik).
- **Rozpad AI:** jeśli AI nie utrzyma garnizonu, buntuje się; wymagany pomiar, że AI nie traci wszystkich miast w jednej grze.
- **Epoki 2–3:** `x` skaluje się w górę (16/23); przy „duży" bez obcięcia Szczęście może zejść poniżej −100%, co wymaga ograniczenia (NIE MODELOWANE dla epok 2–3).
- **Porządek w order.ts:** druga definicja tierów — ryzyko rozjazdu UI i silnika, jeśli któreś miejsce czyta stare progi.

## 6. Plan implementacji (po decyzji właściciela)

1. Decyzja ABC: poziom domyślny i wartości „neutralny"/„duży" (pytanie do właściciela — wymaga zatwierdzenia przez turniej C-018 przed pokazaniem właścicielowi).
2. Dodanie parametrów i modułu poziomów (bez zmiany zachowania dla „mały").
3. Obcięcie kultury/religii sterowane poziomem; test „mały = bit-w-bit".
4. Kreator + zapis (pole stanu, kompatybilność).
5. Pomiar: model §2 w grze (NIE ZMIERZONO), 100 tur AI na trzech poziomach, live w przeglądarce.
6. Wdrożenie za flagą `kulturaReligia` (domyślnie `maly`), FC, deploy na ROBOCZĄ dopiero po zatwierdzeniu.

## 7. Czego NIE zmierzono

- Silnik TypeScript (bundle esbuild) — model to reimplementacja.
- Start udziału kultury/religii po zdobyciu w kodzie `onCityCapturedReligion` (założenie: 0% własnej).
- Tempo konwersji kultury i religii w grze; wpływ świątyni na religię (`convertViaTemple`).
- Epoki 2–3 i wartości x dla nich.
- Zachowanie AI przy „duży" i „neutralny"; balans wojen.
- Czy `order.ts` (drugie progi) jest jeszcze czytane w turze.
