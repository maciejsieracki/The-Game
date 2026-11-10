# P1.16D — Opisy vs dane: rozjazd ekonomii ×5 i pozycje panelu „ściąga" (pin `edb8fb56`)

**Temat:** R-RUSTPORT-P1-16D-OPISY-EKONOMIA5X-Q1 · **Runda:** 2/5 (naprawa po FAIL rundy 1; obrona zarzutów w `02-operator-obrona.md`, tura 2) · **Rola:** Operator (Haiku 5.5 medium)
**Źródło audytu:** `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2c, §2e, §3 oraz `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 (Akademia pominięta — już sprawdzona w §9.5 i w wierszu akademia_wojskowa poniżej).
**Pin:** `edb8fb56` (`main`). Commit skali: `e401c1c2` (ancestor pinu). Commit zmiany tartak/kamieniołom: `9175f031` (ancestor pinu).
**Źródła webowe (ścieżki pełne, pin):** wiki = `gra/src/data/wikiBundle.json` (generated 2026-09-05; kopia `gra-robocza/srcKopiaMaster/data/wikiBundle.json` NIE użyta — inna wersja, generated 2026-07-03); dane = `gra/data/*.json`; kod = `gra/src/ui/cityPanel.ts`, `gra/src/game/okolica.ts`.
**Metoda:** wyłącznie `git show edb8fb56:<ścieżka>` / `git grep edb8fb56` / `git diff` / `git log` oraz parsowanie JSON przez `python3 -I` z kopii w scratchpadzie. Linie z tych poleceń, nie z audytu. Brak zapisu w `gra/**`, brak testów, brak `npm`/`cargo`.
**P1-16-EDGE-CASES.md (§9.3, §9.5):** plik NIE istnieje na pinie `edb8fb56` (`git show edb8fb56:dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` = brak; plik jest tylko w working tree repo, HEAD `cd14272f`) — odczytany z working tree, nie z pinu. Wniosek z §9.3 dla Budynków: pozycja 8a — frazę „(+1 ¤/poziom)” nadal zawierają biblioteka, laznia_publiczna, palac, port, sad, swiatynia, teatr (NADAL ISTNIEJE; `economy-upkeep.ts:585` `budynekUtrzymanieFlat: 1`); §9.3 nie zawiera żadnego przeliczenia ×5 dla haseł Budynki, więc nie zmienia statusów z §1; generator `tools/generate-encyklopedia.cjs:97–99` (`|| 10` / `|| 1`) — NADAL ISTNIEJE (§9.3, wiersz generatora).

**Legenda statusów:** NAPRAWIONY / NADAL ISTNIEJE (rozjazd potwierdzony na pinie) / NIEROZSTRZYGNIĘTY (nie przeliczono — z powodu braku liczby w wiki lub zakresu).

---

## 1. Rozjazd ×5: CivPedia „Budynki" (10 haseł poza Akademią) — `wikiBundle.json` vs `buildings.json`

Metoda: w polu `wikiS` (tekst kosztu) odczytano jawne liczby surowców `N× materiał`, porównano z `koszt_surowce` w `gra/data/buildings.json` na pinie. Regułę „×5" uznano za potwierdzoną tylko przy `data = N × 5` dla każdego materiału wymienionego w haśle.

| Hasło (id) | Wiki (wikiS) | Dane (pin `koszt_surowce`) | Wynik |
|---|---|---|---|
| akademia_wojskowa | 10× drewno, 14× cegła (wiki pełne/wikiM) | drewno 50, cegla 70 | ×5 — NADAL ISTNIEJE |
| baszta | 10× drewno, 20× kamień | drewno 50, kamien 100 | ×5 — NADAL ISTNIEJE |
| fort (Cytadela) | 10× drewno, 20× kamień | drewno 50, kamien 100 | ×5 — NADAL ISTNIEJE |
| koszary | 8× drewno, 8× kamień | drewno 40, kamien 40 | ×5 — NADAL ISTNIEJE |
| kuznia (Kuźnia brązu) | 6× drewno, 6× kamień | drewno 30, kamien 30 | ×5 — NADAL ISTNIEJE |
| kuznia_zelaza | 8× drewno, 10× cegła | drewno 40, cegla 50 | ×5 — NADAL ISTNIEJE |
| mury | 8× drewno, 16× kamień | drewno 40, kamien 80 | ×5 — NADAL ISTNIEJE |
| pretorium | 8× drewno, 10× cegła | drewno 40, cegla 50 | ×5 — NADAL ISTNIEJE |
| targowisko | 6× drewno | drewno 30 | ×5 — NADAL ISTNIEJE |
| warsztat_oblezniczy | 10× drewno, 10× kamień | drewno 50, kamien 50 | ×5 — NADAL ISTNIEJE |

Wynik: **10/10 potwierdzonych ×5** (razem z Akademią 11/25, zgodnie z audytem §2c/§5). Źródło liczby: `wikiBundle.json` pole `encyklopedia[*].wikiS`, kategoria „Budynki" (26 wpisów, w tym `wielka_kuznia`).

**Dodatkowe rozjazdy NIE-×5 (poza audytem, znalezione przy tym samym przeglądzie):**

| Hasło | Wiki | Dane (pin) | Wynik |
|---|---|---|---|
| garnizon | 60 drewna z magazynu (+ 5 drewna/t utrzymania) | drewno 30 | NADAL ISTNIEJE (×0,5, nie ×5) |
| laznia_publiczna | 10× cegła (bez drewna) | drewno 40, cegla 60 | NADAL ISTNIEJE (10×5=50≠60; drewno niewymienione w wiki) |
| **spichlerz** (poprawione tura 2) | poz. 1: „koszt od 20 pracy”, bez kosztu surowcowego; poz. 2 (Spichlerz II): **10× cegła** („poz. 1 bez kosztu surowcowego”) | poz. 1 (`spichlerz`): **drewno 40**; poz. 2 (`spichlerz_ii`): **drewno 40, kamien 50** (brak cegły) | NADAL ISTNIEJE: poz. 1 — wiki „brak surowca” vs dane drewno 40; poz. 2 — materiał cegła (wiki) nieobecny w danych. Porównanie ×5 nieprzeprowadzalne (materiały różne). |
| biblioteka | 5× ceramika | drewno 30, kamien 30 | NADAL ISTNIEJE (materiał „ceramika" nieobecny w danych) |
| swiatynia | 6× ceramika | drewno 30, kamien 40 | NADAL ISTNIEJE (materiał „ceramika" nieobecny w danych) |

Hasła bez jawnej liczby materiałowej w żadnym polu wiki (`magazyn`, `palac`, `port`, `sad`, `teatr`, `stolarnia`, `studnia`, `stela`, `kamieniarski`, `wielka_kuznia`) — **NIEROZSTRZYGNIĘTY** dla liczb (wiki nie podaje wartości do porównania). Hasło `kuznia_zelaza` ma w `wikiS` tylko „Koszt 60 pracy", ale liczby surowców są w `wikiM`/`full` (tabela powyżej).

---

## 2. Rozjazd ×5 w `units.json` i `terrain-improvements.json`

### 2.1 `units.json` (pin `gra/data/units.json`)
- **Potwierdzone:** commit `e401c1c2` zmienił `Surowiec (ilość)` 10→50 oraz `Utrzymanie surowiec (ilość)` 2→10 (diff `e401c1c2~1..e401c1c2`, wiele wierszy). Skala ×5 jest więc w danych.
- **Pełne porównanie wiki vs dane** (wszystkie 31 haseł kategorii „Jednostki" z jawnym `N× materiał` w `wikiS`/`wikiM`/`full`; regex `(\d+)\s*×\s*(\w+)`; dane = `Surowiec` / `Surowiec (ilość)` z `gra/data/units.json` dopasowane po nazwie). Stosunek = dane / wiki.

| Jednostka (id) | Wiki | Dane (Surowiec, ilość) | Stosunek | Materiał dosłownie zgodny | Wynik |
|---|---|---|---|---|---|
| falanga | 5× żelazo | Żelazo 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE (wiki nieaktualna) |
| halabardnik-shang | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| hastati | 5× żelazo | Żelazo 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| ucznik-akadyjski | 5× drewno | Drewno 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| wojownik-celtycki („Soldurii”) | 5× stal | Żelazo 25 | 5 | NIE (stal ≠ Żelazo) | ×5, zły materiał |
| w-ocznik-sumeryjski | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| wojownik-mykenski | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| wojownik-sherden | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| wojownik-z-khopesh | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| wojownik-z-mieczem-i-tarcza | 5× brąz | Brąz 25 | 5 | tak | ×5 zgodne — NADAL ISTNIEJE |
| impi | 4× brąz | Brąz 25 | 6,25 | tak | inna liczba — NADAL ISTNIEJE |
| w-ocznik | 4× brąz | Brąz 25 | 6,25 | tak | inna liczba — NADAL ISTNIEJE |
| wojownik-tyrrenski | 4× brąz | Brąz 25 | 6,25 | tak | inna liczba — NADAL ISTNIEJE |
| wojownik-z-toporem | 4× brąz | Brąz 25 | 6,25 | tak | inna liczba — NADAL ISTNIEJE |
| wojownik-szekelesz | 3× brąz | Brąz 25 | 8,33 | tak | inna liczba — NADAL ISTNIEJE |
| berserker-germanski | 3× stal | Żelazo 25 | 8,33 | NIE (stal ≠ Żelazo) | inna liczba, zły materiał |
| gaesatae | 3× stal | Żelazo 25 | 8,33 | NIE (stal ≠ Żelazo) | inna liczba, zły materiał |
| królewska-gwardia | 3× brąz | Brąz 38 | 12,67 | tak | inna liczba — NADAL ISTNIEJE |
| ucznik | 4× drewno | Drewno 13 | 3,25 | tak | inna liczba — NADAL ISTNIEJE |
| ucznik-egipski | 4× drewno | Drewno 13 | 3,25 | tak | inna liczba — NADAL ISTNIEJE |
| ucznik-sumeryjski | 4× drewno | Drewno 13 | 3,25 | tak | inna liczba — NADAL ISTNIEJE |
| galera | 4× drewno | Brąz 25 | 6,25 | NIE (drewno ≠ Brąz) | inna liczba, zły materiał |
| rydwan-celtycki | 1× żelazo | Żelazo 25 | 25 | tak | inna liczba — NADAL ISTNIEJE |
| rydwan-wo-y | 1× bydło | Brąz 25 | 25 | NIE (bydło ≠ Brąz) | inna liczba, zły materiał |
| jezdziec-chinski | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| konnica | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| rydwan-egipski | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| rydwan-konny | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| rydwan-mykenski | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| rydwan-shang | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |
| rydwan-sumeryjski | 1× koń | Brąz 25 | 25 | NIE (koń ≠ Brąz) | inna liczba, zły materiał |

Podsumowanie (31 haseł z liczbą): stosunek dokładnie 5 w **10** wierszach (9 z materiałem dosłownie zgodnym + wojownik-celtycki z `stal`); stosunek ≠ 5 w **21** wierszach. Materiał dosłownie niezgodny w **12** wierszach: 3× stal/Żelazo (wojownik-celtycki, berserker-germanski, gaesatae), 1× galera (drewno/Brąz), 7× koń/Brąz, 1× bydło/Brąz. Stosunki liczone z pinowych danych; zgodność materiału bez mapowań (koń/stal/bydło nie są utożsamiane z Brąz/Żelazo).

Pozostałe jednostki: **18 z 49 haseł kategorii „Jednostki" nie ma żadnej jawnej liczby surowca w wiki** (lista: gwardia-krolewska-sumeru, hieros-lochos-swiety-zastep, hu-ben-wei-gwardia-tygrysa, katapulta, medzaj-gwardia-faraona, oszczepnik, oszczepnik-estolica, oszczepnik-zulu-izijula, procarz, procarz-huaracoc, taran, triari, uthulwana-bia-e-tarcze, wieza-obleznicza, wojownik, wojownik-germanski, wojownik-z-maczuga-chaska, zwiadowca) — **NIEROZSTRZYGNIĘTY** (brak wartości wiki do porównania). Poprzednie „48 z 49" było błędne.

### 2.2 `terrain-improvements.json` (pin `gra/data/terrain-improvements.json`)
- **Potwierdzone w danych:** commit `e401c1c2` zmienił `surowiec_ilosc_tura` ×5 (diff: np. glinianka 10→50, warzelnia_soli 10→50, farma 5→25). Pin: `glinianka` 50, `warzelnia_soli` 50, `stadnina` 25, `kopalnia_miedzi` 20, `kopalnia_zelaza` 20, `kopalnia_cyny` 20, `kopalnia_zlota` 1.
- **Wiki „Ulepszenia terenu"** nie podaje wartości `surowiec_ilosc_tura` w tekście — **brak rozjazdu wiki vs dane dla TI** na pinie. Audytowe twierdzenie o analogicznym rozjeździe w CivPedii „Ulepszenia terenu" **NIE potwierdza się** w treści wiki.
- **Nowy rozjazd `_meta` vs dane (poza audytem) — przyczyna zbadana (tura 2):** `_meta.pole_surowiec_ilosc_tura` deklaruje `Tartak->drewno 50` i `Kamieniołom->kamien 50`, a dane na pinie mają `tartak.surowiec_ilosc_tura` = **200** (linia 201) i `kamieniolom.surowiec_ilosc_tura` = **200** (linia 142). Historia (`git show`/`git log -S`):
  - wartość 50 ustawił `e401c1c2` (2026-08-12/13, skala ×5);
  - wartość **200** wprowadził commit **`9175f031`** (2026-09-09, „Integracja Hermes PR #135 (H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1) + wiring PR #134”), już po `e401c1c2`; w tym samym commicie zmieniono `kamieniolom.surowiec_ilosc_tura` i jego `surowiecOdblokowany_uwaga` (obecnie: „produkcja terytorialna bazowo 200/turę, skalowana +50% za epokę”);
  - `tartak.surowiec_ilosc_tura` zmieniono w tym samym commicie, ale **uwaga tartaku nie została zmieniona** — nadal mówi „×5 → 50/turę (było 10/turę)” (tzn. wewnątrz wpisu tartaku uwaga i wartość są sprzeczne);
  - `_meta` nie został zaktualizowany przez `9175f031` (nadal 50).
  - Stan: **NADAL ISTNIEJE**. Czy 200 jest zamierzone (zmiana mechanizmu w PR #135), czy przypadkowe — **decyzja właściciela danych**; w repo nie ma dowodu intencji poza uwagą kamieniołomu.

---

## 3. `cityPanel.ts` — literały „normal" (§2e)

Szukano po symbolu (`'normal'`/`(normal)`) w `gra/src/ui/cityPanel.ts` na pinie.

- **Fallbacki `cfg.difficulty ?? 'normal'`** (np. linie 1012, 1029, 1139, 1154, 1190, 1240, 1271, 3053, 3115, 3289, 3391, 3843, 4780, 5214, 5481, 5593): wartości domyślne przy braku konfiguracji, nie tekst dla gracza — **nie są błędem prezentacji**. Wpływu na wartości nie śledzono — **NIEROZSTRZYGNIĘTY**.
- **Literał tekstowy w UI:** `cityPanel.ts:3927` `appendDetailSection(card, 'Religia — parametry (normal)')` — leży wewnątrz funkcji **`buildKulturaDetailCard` (l. 3836–3991; następna funkcja `renderKultura` od l. 3992)** — **NADAL ISTNIEJE** (nagłówek sztywny; liczby ładowane dla aktualnej trudności). Poprzednia wzmianka „funkcja od l. ~3718” była błędna: l. 3718 to `buildSurowceDetailCard`.

---

## 4. §3 — wagi okolicy `{3,0.5,0.5}`

- Literał w `cityPanel.ts:9684` (funkcja `buildOkolicaDetailCard`, l. 9617): `Profil „…”: wagi score — np. Żywność 3/0.5/0.5, Zrówn. 1/1/1.`
- Kod na pinie `gra/src/game/okolica.ts:317–319` (`wagiForFocus`): `zywnosc` → `{zywnosc:10, praca:0, handel:0}`; `produkcja` → `{zywnosc:0.5, praca:3, handel:0.5}`; `podatki` → `{zywnosc:0.5, praca:0.5, handel:3}`; `zrownowazone` → `{1,1,1}`.
- Wniosek: profil „Żywność" w kodzie to `{10,0,0}`; literal `3/0.5/0.5` nie odpowiada profilowi żywności (kształtem przypomina profil „produkcja" z zamienionym porządkiem pól). **NADAL ISTNIEJE**.

---

## 5. §3 — próg buntu „10%/2 tury (hard)"

- Literały w `cityPanel.ts`: l. 3480 (`bunt_skrajny: '<10% — alert krytyczny, 2 tury grace …'`) i l. 3523 (`gridDetailRow(gt, '<10% Bunt skrajny', 'Kary max + grace 2 tury → rebelia')`), funkcja `buildPorzadekDetailCard` (od l. 3427); l. 3545 `PorPct <10%: licznik grace`. Dane: `gra/data/society-params.json` l. 681–692.

| Parametr (pin, society-params.json) | easy | normal | hard |
|---|---|---|---|
| `porzadek_prog_bunt_skrajny_pct` (l. 681) | 6 | **12** | **14** |
| `porzadek_grace_tur_bunt` (l. 688) | 4 | **3** | **2** |

- Wniosek: „2 tury grace" zgadza się tylko z **hard**; próg „10%" **nie zgadza się z żadnym poziomem** (hard = 14%, normal = 12%). Audytowe „10% to wartości hard" — **nieprawdziwe na pinie**. Stan: **NADAL ISTNIEJE**.

---

## 6. §3 — podział daniny „batony 1/2/3"

- Literał w `cityPanel.ts:11002`: `racje żywności — per miasto (batony 1/2/3).` (nota w kolumnie ustawień, okolice l. 10998–11003).
- Na pinie nie znaleziono innego opisu skali „batony"; poziomy racji są w `gra/data/econ-params.json` (`koszt racji poziom 1–3`, l. 190–204). Suwak „Wyżywienie 0–6" jako docelowy zamiennik **nie został zweryfikowany** (brak odczytu komponentu suwaka).
- Stan: **NADAL ISTNIEJE** (literal „batony 1/2/3" obecny na pinie; zamiennik — NIEROZSTRZYGNIĘTY).

---

## 7. §3 — liczba paneli „ściąga" (27) i ile z recenzją (10)

**Recenzje (tura 2, zweryfikowane na pinie):** audyt na `edb8fb56` (`git show edb8fb56:dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`) w §3 ma tabelę „Recenzowane z werdyktem” (wiersze 96–105 = **10** paneli z werdyktem) i tabelę „Skatalogowane, BEZ recenzji” (wiersze 111–127 = **17** paneli). Suma 27 zgodna z tekstem audytu (linia 90: „10 z 27 zostało recenzowanych”). Status: **ZWERYFIKOWANE na pinie** (liczba recenzji = 10; status D nie jest już nierozstrzygnięty co do liczby).

**Licznik kandydatów w kodzie (tura 2, mapowanie wiersz po wierszu):**
- Pin: `cityPanel.ts` zawiera **28** funkcji `build*(Detail|Tooltip)*Card` (`git show edb8fb56:gra/src/ui/cityPanel.ts | grep -oE "^(export )?function build\w*(Detail|Tooltip)\w*Card"`), plus `resUsageDetailsHtml` w `empireDetailPanel.ts` (l. **3289**, `export function resUsageDetailsHtml`; `git show edb8fb56:gra/src/ui/empireDetailPanel.ts | grep -n resUsageDetailsHtml`) = **29** kandydatów.
- Mapowanie: 26 z 28 funkcji ma nazwę w audycie (`grep` po nazwie w pinowym audycie; każda ma trafienie). Dwie nie mają trafienia: `buildBuildingDetailCardViaEntityCard` (l. 7537) i `buildUnitDetailCardViaEntityCard` (l. 7861) — są to **pełne, osobne funkcje** (własny render entity-card, nie cienkie wrappery), nieopisane w audycie po nazwie.
- Wiersze audytu: 27 = 25 wierszy zawierających 26 funkcji `build*` (wiersz „[Budynek] — karta charakterystyki” wymienia 2 funkcje: `buildBuildingDetailCard` + `buildBuildingBuildTabDetailCard`) + 1 wiersz `resUsageDetailsHtml` + 1 wiersz inline („Religia — szczegóły (wariant fallback)” @3789–3805, bez funkcji).
- Wniosek: **29 = 26 funkcji audytu + 2 nieaudytowane warianty ViaEntityCard + 1 resUsage**. Audyt ma 27 wierszy = 25 wierszy z funkcjami `build*` (w tym jeden wiersz z dwiema funkcjami, czyli 26 funkcji) + 1 wiersz `resUsageDetailsHtml` + 1 wiersz inline bez funkcji. Różnica 27 vs 29 jest więc wyjaśniona dokładnie przez 2 warianty ViaEntityCard (wiersz inline nie jest funkcją i nie wchodzi do 29). Audyt jawnie wymienia część wpisów jako „info-karty” (`buildBuildingDetailCard`, `buildUnitDetailCard`) — to jest w tekście audytu, nie spekulacja operatora. **NADAL ISTNIEJE** jako rozbieżność liczby (29 kandydatów vs 27 w audycie), z wyjaśnieniem powyżej.
- Nazwy w audycie (np. `buildOkolicaDetailCard @8592`, `buildPorzadekDetailCard @3118`) są **nieaktualne linią** — na pinie: `buildOkolicaDetailCard` l. 9617, `buildPorzadekDetailCard` l. 3427, `buildKulturaDetailCard` l. 3836.
- Dla 17 paneli bez recenzji: nadal **NIEROZSTRZYGNIĘTE** co do treści (jasność/aktualność) — poza zakresem tego tematu.

---

## 8. Podsumowanie czterech grup

| Grupa | Pozycje | Status na pinie |
|---|---|---|
| A. Ekonomia ×5 — Budynki (10 haseł poza Akademią) | 10 | **10 × NADAL ISTNIEJE** (dowód §1); + 5 rozjazdów nie-×5 (§1, tabela 2; spichlerz doprecyzowany) |
| A'. Ekonomia ×5 — units / terrain | units (31 z liczbą), TI | units: ×5 dokładne w 10/31 (9 z zgodnym materiałem), stosunek ≠5 w 21/31, materiał niezgodny w 12/31 (§2.1), 18/49 bez liczby (NIEROZSTRZYGNIĘTY); TI: dane ×5 potwierdzone, wiki bez rozjazdu, **nowy** rozjazd `_meta` vs dane (tartak/kamieniołom 200 vs 50; przyczyna: `9175f031`) |
| B. `cityPanel.ts` literały | „normal” (nagłówek l. 3927 w `buildKulturaDetailCard` l. 3836–3991), okolica (l. 9684), bunt (l. 3480/3523), batony (l. 11002) | **NADAL ISTNIEJE** (4/4 literałów obecne; fallbacki `?? 'normal'` — nie błąd prezentacji) |
| C. Wartości w §3 | okolica `{3,0.5,0.5}` vs kod `{10,0,0}`; bunt „10%” vs dane 12/14; „2 tury” = tylko hard; batony | okolica: **NADAL ISTNIEJE**; bunt: **NADAL ISTNIEJE** (audytowe „hard” błędne — hard = 14%); batony: **NADAL ISTNIEJE** |
| D. Liczba paneli „ściąga” | 27 w audycie; pin 29 kandydatów = 26 funkcji audytu + 2 ViaEntityCard + resUsage; recenzje 10 | liczba recenzji **ZWERYFIKOWANA = 10** (audyt §3, wiersze 96–105); licznik kodu **wyjaśniony** (2 nieaudytowane warianty ViaEntityCard); 17 bez recenzji — treść NIEROZSTRZYGNIĘTA |

**Kryterium binarne z dispatchu** („wszystkie 4 grupy pozycji mają status z dowodem”): **spełnione dla statusów** w czterech grupach (A, A', B, C, D mają status i dowód pinowy). Poza zakresem tych pozycji pozostają **NIEROZSTRZYGNIĘTE**: 18 jednostek bez liczby w wiki (§2.1), 17 paneli bez oceny treści (§7), hasła Budynki bez jawnej liczby (§1), zamiennik „Wyżywienie 0–6” (§6), oraz pozostały zakres audytu §2a/§2b/§3 Poradnika.

## 9. Zastrzeżenia

- Nie uruchomiono testów, `npm`/`cargo`, gry. `gra/**` nietknięte (tylko odczyt przez `git show`/`git log`).
- Liczby w wiki odczytano z pól `wikiS`/`wikiM`/`full` regexem; hasła bez jawnej liczby nie są porównywane.
- Zgodność materiału w §2.1 jest dosłowna (bez mapowań koń/stal/bydło na inne surowce). Stosunki i ich interpretacja przy wartościach 25 (wiele jednostek ma w danych tę samą wartość 25) wymagają decyzji właściciela danych.
- Tartak/kamieniołom: przyczyna ustalona do commitu `9175f031`; intencja zmiany na 200 — do rozstrzygnięcia przez właściciela danych.
- Pozostałe równoległe tematy P1.16D-* piszą do własnych plików; ten plik nie dotyka `P1-16-EDGE-CASES.md`.
