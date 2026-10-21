# P1.16F — CivPedia „Cuda świata": audyt pól opisu wobec danych (pin web edb8fb56)

**Temat:** R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1 (runda 1/5, Operator, Haiku 5.5 medium)
**Dispatch:** `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1/00-dispatch.md`
**Pin:** `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` — dane wyłącznie przez `git show edb8fb56:<ścieżka>` (bez checkout, builda, dev).
**Źródła:** `gra/src/data/wikiBundle.json` (`encyklopedia[]`, `category == "Cuda świata"`, pola `wikiS`/`wikiM`/`full`), `gra/data/wonders.json` (`cuda[]`, `_meta`), `gra/src/game/wonders-data.ts` (helpery absolut/tourism).
**Pominięte (zamknięte gdzie indziej):** bonus „×3 plony w mieście wzniesienia" — wg P1-16D-OPISY-BOILERPLATE §2.

## Zastrzeżenie o liczebności

Dispatch mówi o **20** hasłach. Na pinie kategoria „Cuda świata" ma **19** wpisów, a `wonders.json` `cuda[]` ma **19** wpisów; zbiory identyczne (0 rozbieżności w id). Audytowano 19. Dwudziestego hasła nie znaleziono; jeśli istnieje pod inną kategorią, wymaga osobnego wskazania.

## Metoda

1. Koszt i unikalność: pierwsza linia `wikiS` (`koszt **N** pracy, max **1 na świat**`, typ R/E) porównana z `kosztBudowy`, `maxNaSwiecie`, `dostep`.
2. Utrzymanie: wiki nie podaje wartości bazowej; podaje regułę „spada do 50%" (`wikiM` → „Po absolut"). Porównano z `_meta.absolut.po_absolut.utrzymanie_wygasly_opis` (floor(utrzymanie/2), min 0) oraz z przykładem liczbowym („utrzymanie z JSON, np. 2–5 ¤/t").
3. Wymagana technologia i teren: wiki pisze ogólnie „Heks w **twoim terytorium**, wymagana technologia epoki" — bez nazw technologii, terenów i numeru epoki. Odnotowano dane JSON (`techUnlock`, `wymagaTerenu`, `epokaWejscia`) i status pokrycia.
4. Przykład „Plan budowy" (cost / 12 pracy/t, zaokrąglenie w górę): przeliczono na pinie.

## Wyniki zbiorcze (per hasło — status w tabeli)

- **Koszt budowy: ZGODNE 19/19** (wiki = JSON).
- **Unikalność (max 1 na świat): ZGODNE 19/19.**
- **Dostęp E/R: ZGODNE 19/19** (R: brama_narodow, hamonga, wyrocznia — zgodnie z `_meta.cuda_wyscigowe`).
- **Utrzymanie — reguła 50%: ZGODNE 19/19** z `_meta` (floor). Wiki nie precyzuje zaokrąglenia dla wartości nieparzystych (3→1); nieistotne dla zgodności, odnotowane.
- **Utrzymanie — przykład liczbowy („np. 2–5 ¤/t"): NIEZGODNE 19/19.** Dane JSON na pinie mają wartości **1–3**, nigdy 4–5; wartość 1 (4 cuda) wypada poza zakres.
- **Wymagana technologia: NIEROZSTRZYGNIĘTE 19/19** — wiki nie podaje nazwy technologii, więc nie ma czego porównać; JSON `techUnlock` istnieje.
- **Teren wejścia: NIEPEŁNE 19/19** — wiki podaje tylko „w twoim terytorium"; JSON `wymagaTerenu` jest niepusty dla wszystkich 19 (np. piramidy: pustynia + rzeka_sasiad).
- **Epoka wejścia: NIEROZSTRZYGNIĘTE 19/19** — wiki nie podaje numeru epoki; JSON `epokaWejscia` (1–3).
- **Przykład „Plan budowy" (cost/12 pracy/t): ZGODNE 19/19** (zaokrąglenie w górę poprawne, np. 280/12 → 24 tury).

## Tabela per hasło

Format: koszt wiki / JSON; max wiki / JSON; dostęp wiki / JSON; utrzymanie JSON → po absolut (floor); teren JSON; tech JSON; epoka JSON; status.

| Hasło (id) | Koszt | Max | Dostęp | Utrzymanie | Teren (JSON) | Tech (JSON) | Epoka | Status |
|---|---|---|---|---|---|---|---|---|
| Brama wszystkich narodów (`brama_narodow`) | 280 / 280 (OK) | 1 / 1 (OK) | R / R (OK) | 3 → 1 | przy_miescie | Inżynieria,Wojskowość | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Dur-Sharrukin (`dur_sharrukin`) | 260 / 260 (OK) | 1 / 1 (OK) | E / E (OK) | 3 → 1 | przy_miescie | Budownictwo,Wojskowość | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Kamień Ha'amonga (`hamonga`) | 220 / 220 (OK) | 1 / 1 (OK) | R / R (OK) | 1 → 0 | plytkie_morze | Żegluga | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Kolos Rodyjski (`kolos`) | 230 / 230 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | plytkie_morze | Inżynieria | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Koloseum (`koloseum`) | 310 / 310 (OK) | 1 / 1 (OK) | E / E (OK) | 3 → 1 | przy_miescie | Inżynieria | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Osada Aschaffenburg (hala dębowa) (`osada_aschaffenburg`) | 300 / 300 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | rzeka_sasiad | Inżynieria | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Pałac Weiyang (`palac_weiyang`) | 290 / 290 (OK) | 1 / 1 (OK) | E / E (OK) | 3 → 1 | laka | Wymiana,Murarstwo | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Petra (`petra`) | 165 / 165 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | pustynia | Inżynieria | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Piramidy (`piramidy`) | 160 / 160 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | pustynia,rzeka_sasiad | Murarstwo | 1 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Posąg Peruna (`posag_peruna`) | 140 / 140 (OK) | 1 / 1 (OK) | E / E (OK) | 1 → 0 | wzgorze | Obróbka żelaza | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Roquepertuse (`roquepertuse`) | 290 / 290 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | wzgorze,trudny_teren | Inżynieria | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Stupa w Sanchi (`stupa_sanchi`) | 210 / 210 (OK) | 1 / 1 (OK) | E / E (OK) | 1 → 0 | rownina | Religia | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Świątynia Mundo Perdido (`mundo_perdido`) | 220 / 220 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | tropiki | Matematyka,Murarstwo | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Terakotowa armia (`terakotowa_armia`) | 320 / 320 (OK) | 1 / 1 (OK) | E / E (OK) | 3 → 1 | laka | Wojskowość | 3 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Wielka stela (`wielka_stela`) | 220 / 220 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | rownina | Pismo | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Wiszące ogrody (`wiszace_ogrody`) | 150 / 150 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | rzeka_sasiad | Pismo | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Wyrocznia (`wyrocznia`) | 180 / 180 (OK) | 1 / 1 (OK) | R / R (OK) | 1 → 0 | trudny_teren | Mistycyzm | 1 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Yerkapı (Brama w ziemi) (`yerkapi`) | 240 / 240 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | wzgorze,trudny_teren | Wojskowość | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |
| Ziggurat / Piramida Słońca (`ziggurat`) | 240 / 240 (OK) | 1 / 1 (OK) | E / E (OK) | 2 → 1 | plaski_teren | Matematyka | 2 | przykład: zakres 2–5 ¤/t NIEZGODNY z danymi (1–3); tech i teren: NIEPEŁNE w wiki |

## Poza zakresem / nie sprawdzano

- „Teatr 55 pracy" (przykład porównawczy) — pozycja z kategorii Budynki, nie zweryfikowana.
- „stolica 12 pracy/t, suwak pracy 70%" — założenia przykładu, nie zweryfikowane wobec silnika.
- Wartości yield po absolut („+10 handlu") — zgodne z `_meta.absolut.po_absolut.jedyny_efekt` (typ handel_turystyka, wartość 10), ale nie sprawdzano implementacji w `wonders-data.ts` poza helperem `getWonderTourismTradeBonus`.
- Brama wszystkich narodów: `uwagi` w JSON mówi „odblokowanie po Inżynierii", a `techUnlock` ma dwie technologie (Inżynieria, Wojskowość) — rozstrzygnięcie semantyki (AND/OR) poza zakresem wiki; odnotowane jako uwaga do `wonders.json`.

## Wniosek

- Zgodne: koszt, unikalność, dostęp E/R, reguła 50% utrzymania, przykład „Plan budowy".
- Do poprawy w wiki (opis, 19 haseł): zakres „2–5 ¤/t" → dane 1–3; pola teren/technologia/epoka — brak lub ogólnikowe.
- Do decyzji produktowej: czy wiki ma podawać nazwy technologii, teren i epokę per cud (obecnie tego nie robi).
- Status tematu: wykonano audyt pełny dla 19 haseł; 20. hasło — nieodnalezione (patrz zastrzeżenie).

Nie zmieniano plików `gra/`. Nie wykonano builda ani uruchomienia gry.
