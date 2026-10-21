# P1.16F — CivPedia „Cuda świata": audyt pól opisu wobec danych (pin web edb8fb56)

**Temat:** R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1 (runda 1/5, Operator, Haiku 5.5 medium; tura 2 = obrona po Evaluatorze)
**Dispatch:** `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1/00-dispatch.md`
**Pin:** `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` — dane wyłącznie przez `git show edb8fb56:<ścieżka>` (bez checkout, builda, dev).
**Źródła:** `gra/src/data/wikiBundle.json` (`encyklopedia[]`, `category == "Cuda świata"`, pola `wikiS`/`wikiM`/`full`; `pojecia/cuda-swiata`), `gra/data/wonders.json` (`cuda[]`, `_meta`), `gra/src/game/wonders-data.ts`, `gra/src/ui/entityCards/wonderAdapter.ts`.
**Pominięte (zamknięte gdzie indziej):** bonus „×3 plony w mieście wzniesienia" — wg P1-16D-OPISY-BOILERPLATE §2.
**Skrypt przeliczeń (poza repo):** `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/verify_cuda.py` (czyta wyłącznie pliki wyciągnięte `git show edb8fb56:`).

## Zastrzeżenie o liczebności (dowód wyszukiwania)

Dispatch mówi o **20** hasłach. Wynik wyszukiwania na pinie:
- wiki, kategoria „Cuda świata": **19** wpisów;
- `wonders.json` `cuda[]`: **19** wpisów; zbiory `id` równe (0 rozbieżności);
- `pojecia/cuda-swiata` (`wikiS`): „**19 cudów** epoki Antyk";
- wpisy wiki z „cud" w tytule/id poza kategorią: tylko `pojecia/cuda-swiata` („Cuda świata (przegląd)", kategoria „Kultura i cuda");
- kategorie z „cud" w nazwie: „Cuda świata", „Kultura i cuda".

Audytowano **19**. Dwudziestego hasła nie znaleziono na pinie; jeśli istnieje, wymaga wskazania źródła przez właściciela/orkiestratora.

## Metoda

1. Koszt i unikalność: `wikiS` (`koszt **N** pracy, max **1 na świat**`, typ R/E) vs `kosztBudowy`, `maxNaSwiecie`, `dostep`.
2. Utrzymanie: wiki (`full`, sekcja „Po absolut") podaje regułę „spada do 50%"; `_meta.absolut.po_absolut.utrzymanie_wygasly` = `50pct`, opis `floor(utrzymanie/2), min 0`. Sprawdzono **wykonanie reguły w kodzie** (sekcja niżej).
3. Technologia / teren / epoka: wiki pisze „Heks w **twoim terytorium**, wymagana technologia epoki" — bez nazw technologii i terenów. Epoka: patrz sekcja „Epoka" (dowody z `_meta` i `pojecia/cuda-swiata`).
4. Przykłady liczbowe z `full`: „Plan budowy" (ceil(koszt/12) tur) oraz „utrzymanie z JSON (np. 2–5 ¤/t)".

## Dowody kodowe — utrzymanie 50% (sprawdzone na pinie)

- `git grep -n -E 'utrzymanie_wygasly|50pct|floor\(.*utrzym' edb8fb56 -- gra` → trafienia tylko w `gra/data/wonders.json:32-33` (dane) oraz w tekstach wiki/bundla; **zero trafień w kodzie TS/JS**.
- `gra/src/game/wonders-data.ts:81` — to jedynie typ `po_absolut?` (interfejs), bez logiki utrzymania.
- `gra/src/game/wonders-data.ts:180` — `getWonderTourismTradeBonus()` (tylko +handel, `jedyny_efekt`).
- `gra/src/ui/entityCards/wonderAdapter.ts:78` — wyświetla **bazowe** `wonder.utrzymanie` („X / turę"); brak redukcji po absolut.
- Konsument utrzymania cudów w ekonomii: nie znaleziono (`turn-economy.ts`/`main.ts` operują na `utrzymanieRazem`/budynkach, bez cudów).

**Wniosek:** reguła 50% jest **zgodna z danymi i `_meta`**, ale w kodzie na pinie **nieobecna / niezweryfikowana**.

## Epoka wejścia — dowody

- `pojecia/cuda-swiata` (`wikiM`): „R — wyścigowy: dokładnie 3 cuda... **Wyrocznia** (Kamień), **Kamień Ha'amonga** (Brąz), **Brama wszystkich narodów** (Żelazo)".
- `wonders.json` `_meta.cuda_wyscigowe_epoka`: 1=Wyrocznia (Kamień), 2=Hamonga (Brąz), 3=Brama (Żelazo) — **zgodne z `epokaWejscia`** w JSON (1, 2, 3).
- `wonders.json` `_meta.celtowie_v1`: „Roquepertuse (E, epoka 3)" — **zgodne z `epokaWejscia` = 3**.
- Pozostałe 15 cudów: brak przypisania epoki w wiki (`full` używa tylko ogólnego „wymagana technologia epoki") i w `_meta` (`harappa_v1`, `chinczycy_v1` nie podają epoki). Jedyne źródło: JSON `epokaWejscia` (wartości 1–3, zgodne z zakresem Kamień/Brąz/Żelazo z `pojecia`, ale to tylko test zakresu, nie potwierdzenie per cud).

## Przeliczenia (wykonane skryptem, wynik per cud)

- „2–5 ¤/t" występuje w polu `full` (sekcja „Po wzniesieniu") **19/19**; wartości `utrzymanie` w JSON: **1** (4 cuda: hamonga, posag_peruna, stupa_sanchi, wyrocznia), **2** (10 cudów), **3** (5 cudów: brama_narodow, dur_sharrukin, koloseum, palac_weiyang, terakotowa_armia). Zakres 2–5 **niezgodny** dla 19/19 (JSON nie ma 4–5; 1 wypada poza 2–5 dla 4 cudów).
- „Plan budowy" (`full`: „Cud N pracy → ok. X tur bez rush") vs ceil(koszt/12): **zgodne 19/19**. Tabela: brama 280→24, dur 260→22, hamonga 220→19, kolos 230→20, koloseum 310→26, osada 300→25, palac 290→25, petra 165→14, piramidy 160→14, posag 140→12, roquepertuse 290→25, stupa 210→18, mundo 220→19, terakotowa 320→27, stela 220→19, wiszace 150→13, wyrocznia 180→15, yerkapi 240→20, ziggurat 240→20 (wiki = ceil w każdym przypadku).

## Wyniki zbiorcze (status z rozdziałem dowodu)

- **Koszt budowy: ZGODNE 19/19** (wiki `wikiS` = `kosztBudowy`).
- **Unikalność (max 1 na świat): ZGODNE 19/19** (wiki = `maxNaSwiecie` = 1).
- **Dostęp E/R: ZGODNE 19/19** (R: brama_narodow, hamonga, wyrocznia — jak `_meta.cuda_wyscigowe`).
- **Utrzymanie — reguła 50%: ZGODNE Z DANYMI/`_meta` 19/19; W KODZIE NIEOBECNE/NIEZWERYFIKOWANE (19/19).** Zaokrąglenie dla nieparzystych (3→1) wg `floor`, zgodne z `_meta`.
- **Utrzymanie — przykład „np. 2–5 ¤/t": NIEZGODNE 19/19** (JSON 1–3).
- **Wymagana technologia: NIEROZSTRZYGNIĘTE 19/19** — wiki nie podaje nazw technologii; JSON `techUnlock` istnieje.
- **Teren wejścia: NIEPEŁNE 19/19** — wiki: „w twoim terytorium"; JSON `wymagaTerenu` niepusty dla 19/19.
- **Epoka wejścia: ROZSTRZYGNIĘTE 4/19, NIEROZSTRZYGNIĘTE 15/19.** Rozstrzygnięte (zgodne z JSON): Wyrocznia=1, Kamień Ha'amonga=2, Brama=3 (wiki `pojecia` + `_meta.cuda_wyscigowe_epoka`), Roquepertuse=3 (`_meta.celtowie_v1`). Nierozstrzygnięte: Dur-Sharrukin, Kolos, Koloseum, Osada Aschaffenburg, Pałac Weiyang, Petra, Piramidy, Posąg Peruna, Stupa w Sanchi, Mundo Perdido, Terakotowa armia, Wielka stela, Wiszące ogrody, Yerkapı, Ziggurat.
- **Przykład „Plan budowy": ZGODNE 19/19** (tabela wyżej).

## Tabela per hasło

Format: koszt wiki/JSON; max; dostęp; utrzymanie JSON → po absolut (floor); teren JSON; tech JSON; epoka JSON; status.

| Hasło (id) | Koszt | Max | Dostęp | Utrzymanie | Teren (JSON) | Tech (JSON) | Epoka | Status |
|---|---|---|---|---|---|---|---|---|
| Brama wszystkich narodów (`brama_narodow`) | 280 / 280 | 1 / 1 | R / R | 3 → 1 | przy_miescie | Inżynieria,Wojskowość | 3 (zgodne z `_meta`) | 50%: dane OK, kod NIEOBECNY; zakres 2–5 NIEZGODNY; tech/teren NIEPEŁNE |
| Dur-Sharrukin (`dur_sharrukin`) | 260 / 260 | 1 / 1 | E / E | 3 → 1 | przy_miescie | Budownictwo,Wojskowość | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Kamień Ha'amonga (`hamonga`) | 220 / 220 | 1 / 1 | R / R | 1 → 0 | plytkie_morze | Żegluga | 2 (zgodne z `_meta`) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Kolos Rodyjski (`kolos`) | 230 / 230 | 1 / 1 | E / E | 2 → 1 | plytkie_morze | Inżynieria | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Koloseum (`koloseum`) | 310 / 310 | 1 / 1 | E / E | 3 → 1 | przy_miescie | Inżynieria | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Osada Aschaffenburg (`osada_aschaffenburg`) | 300 / 300 | 1 / 1 | E / E | 2 → 1 | rzeka_sasiad | Inżynieria | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Pałac Weiyang (`palac_weiyang`) | 290 / 290 | 1 / 1 | E / E | 3 → 1 | laka | Wymiana,Murarstwo | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Petra (`petra`) | 165 / 165 | 1 / 1 | E / E | 2 → 1 | pustynia | Inżynieria | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Piramidy (`piramidy`) | 160 / 160 | 1 / 1 | E / E | 2 → 1 | pustynia,rzeka_sasiad | Murarstwo | 1 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Posąg Peruna (`posag_peruna`) | 140 / 140 | 1 / 1 | E / E | 1 → 0 | wzgorze | Obróbka żelaza | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Roquepertuse (`roquepertuse`) | 290 / 290 | 1 / 1 | E / E | 2 → 1 | wzgorze,trudny_teren | Inżynieria | 3 (zgodne z `_meta.celtowie_v1`) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Stupa w Sanchi (`stupa_sanchi`) | 210 / 210 | 1 / 1 | E / E | 1 → 0 | rownina | Religia | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Świątynia Mundo Perdido (`mundo_perdido`) | 220 / 220 | 1 / 1 | E / E | 2 → 1 | tropiki | Matematyka,Murarstwo | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Terakotowa armia (`terakotowa_armia`) | 320 / 320 | 1 / 1 | E / E | 3 → 1 | laka | Wojskowość | 3 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Wielka stela (`wielka_stela`) | 220 / 220 | 1 / 1 | E / E | 2 → 1 | rownina | Pismo | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Wiszące ogrody (`wiszace_ogrody`) | 150 / 150 | 1 / 1 | E / E | 2 → 1 | rzeka_sasiad | Pismo | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Wyrocznia (`wyrocznia`) | 180 / 180 | 1 / 1 | R / R | 1 → 0 | trudny_teren | Mistycyzm | 1 (zgodne z `_meta`) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Yerkapı (Brama w ziemi) (`yerkapi`) | 240 / 240 | 1 / 1 | E / E | 2 → 1 | wzgorze,trudny_teren | Wojskowość | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |
| Ziggurat / Piramida Słońca (`ziggurat`) | 240 / 240 | 1 / 1 | E / E | 2 → 1 | plaski_teren | Matematyka | 2 (NIEROZSTRZ.) | 50%: dane OK, kod NIEOBECNY; zakres NIEZGODNY; tech/teren NIEPEŁNE |

## Poza zakresem / nie sprawdzano

- „Teatr 55 pracy" (przykład porównawczy, kategoria Budynki) — nie zweryfikowana.
- „stolica 12 pracy/t, suwak pracy 70%" — założenia przykładu wiki, nie zweryfikowane wobec silnika.
- Yield po absolut („+10 handlu") — zgodne z `_meta.absolut.po_absolut.jedyny_efekt`; implementacja tylko w helperze `getWonderTourismTradeBonus` (wonders-data.ts:180), nie sprawdzano pełnego przepływu do ekonomii.
- Brama wszystkich narodów: `uwagi` w JSON „odblokowanie po Inżynierii", a `techUnlock` = Inżynieria + Wojskowość — semantyka AND/OR poza zakresem wiki; uwaga do `wonders.json`.

## Historia pliku

- Plik jest w HEAD od commita `5cbe8fbc` (2026-10-21 08:16:00, wykonany poza Operatorem tego tematu, komunikat „P1.16d-OPISY-PORADNIK-A + P1.16e-OPISY-UI-PANELE: PASS; dispatch 6 parallel"). Zmiany z tury 2 (ten plik) są niezcommitowane.

## Wniosek

- Zgodne: koszt, unikalność, dostęp E/R, przykład „Plan budowy"; utrzymanie zgodne z danymi/`_meta` (w kodzie nieobecne).
- Do poprawy w wiki (19 haseł): zakres „2–5 ¤/t" → dane 1–3; pola teren/technologia/epoka — brak lub ogólnikowe.
- Do decyzji produktowej: czy wiki ma podawać nazwy technologii, teren i epokę per cud (obecnie tego nie robi).
- Status tematu: audyt pełny 19 haseł; 20. hasło — nieodnalezione (patrz zastrzeżenie); epoka 15/19 nierozstrzygnięta; utrzymanie 50% nieobecne w kodzie.

Nie zmieniano plików `gra/`. Nie wykonano builda ani uruchomienia gry.
