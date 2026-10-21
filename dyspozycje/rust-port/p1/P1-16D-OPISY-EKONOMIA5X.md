# P1.16D — Opisy vs dane: rozjazd ekonomii ×5 i pozycje panelu „ściąga" (pin `edb8fb56`)

**Temat:** R-RUSTPORT-P1-16D-OPISY-EKONOMIA5X-Q1 · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Źródło audytu:** `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2c, §2e, §3 oraz `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 (Akademia pominięta — już sprawdzona w §9.5).
**Pin:** `edb8fb56` (`main`, `git cat-file -t` = commit). Commit skali: `e401c1c2` (ancestor pinu, potwierdzone `git merge-base --is-ancestor`).
**Metoda:** wyłącznie odczyt `git show edb8fb56:<ścieżka>` / `git grep edb8fb56` / `git diff e401c1c2~1 e401c1c2` oraz parsowanie JSON przez `python3 -I` z kopii w scratchpadzie. Linie podawane z tych poleceń, nie z audytu. Brak zapisu w `gra/**`, brak testów, brak `npm`/`cargo`.

**Legenda statusów:** NAPRAWIONY / NADAL ISTNIEJE (rozjazd potwierdzony na pinie) / NIEROZSTRZYGNIĘTY (nie przeliczono z powodu zakresu).

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
| spichlerz | 10× cegła | drewno 40 (brak cegły) | NADAL ISTNIEJE (zły materiał) |
| biblioteka | 5× ceramika | drewno 30, kamien 30 | NADAL ISTNIEJE (materiał „ceramika" nieobecny w danych) |
| swiatynia | 6× ceramika | drewno 30, kamien 40 | NADAL ISTNIEJE (materiał „ceramika" nieobecny w danych) |

Hasła bez jawnej liczby materiałowej w żadnym polu wiki (`magazyn`, `palac`, `port`, `sad`, `teatr`, `stolarnia`, `studnia`, `stela`, `kamieniarski`, `wielka_kuznia`, `spichlerz` poza cegłą z tabeli wyżej) — **NIEROZSTRZYGNIĘTY** dla liczb (wiki nie podaje wartości do porównania). Hasło `kuznia_zelaza` ma w `wikiS` tylko „Koszt 60 pracy", ale liczby surowców są w `wikiM`/`full` (tabela powyżej).

---

## 2. Rozjazd ×5 w `units.json` i `terrain-improvements.json`

### 2.1 `units.json` (pin `gra/data/units.json`)
- **Potwierdzone:** commit `e401c1c2` zmienił `Surowiec (ilość)` 10→50 oraz `Utrzymanie surowiec (ilość)` 2→10 (diff `e401c1c2~1..e401c1c2`, wiele wierszy). Skala ×5 jest więc w danych.
- **Porównanie z wiki „Jednostki"** (pole `Surowiec: N× drewno` w `wikiM/full`, vs `Surowiec (ilość)` w `units.json`):
  - `ucznik-akadyjski`: wiki 5× → dane 25 — zgodne ×5 — NADAL ISTNIEJE (wiki nieaktualna).
  - `ucznik`: wiki 4× → dane 13 (drewno) — NIE jest to ×5 — NADAL ISTNIEJE (rozjazd innego rodzaju).
  - `ucznik-egipski`, `ucznik-sumeryjski`: wiki 4× → dane 13 — NADAL ISTNIEJE (jw.).
  - `galera`: wiki „4× drewno" → dane `Surowiec` = „Brąz", 25 — NADAL ISTNIEJE (zły materiał).
- Pozostałe jednostki (48 z 49 haseł „Jednostki" bez jawnej liczby surowca w wiki) — **NIEROZSTRZYGNIĘTY**.

### 2.2 `terrain-improvements.json` (pin `gra/data/terrain-improvements.json`)
- **Potwierdzone w danych:** commit `e401c1c2` zmienił `surowiec_ilosc_tura` ×5 (diff: np. glinianka 10→50, kopalnia zlota 1 bez zmian). Przykładowo pin: `glinianka` 50, `warzelnia_soli` 50, `stadnina` 25, `kopalnia_miedzi` 20, `kopalnia_zelaza` 20, `kopalnia_cyny` 20, `kopalnia_zlota` 1.
- **Wiki „Ulepszenia terenu"** (17 haseł) nie podaje wartości `surowiec_ilosc_tura` w tekście (brak wzmianek „N/turę" dla tych ulepszeń) — **brak rozjazdu wiki vs dane dla TI** na pinie. Audytowe twierdzenie „analogiczny rozjazd ×5 w CivPedii Ulepszenia terenu" **NIE potwierdza się** w treści wiki.
- **Nowy rozjazd dokumentacja vs dane (poza audytem):** `_meta.pole_surowiec_ilosc_tura` (ta sama linia commitu) deklaruje `Tartak->drewno 50` i `Kamieniołom->kamien 50`, ale w danych pin: `tartak.surowiec_ilosc_tura` = **200**, `kamieniolom.surowiec_ilosc_tura` = **200**. Stan: **NADAL ISTNIEJE** (rozjazd między komentarzem opisowym a wartością; przyczyny nie zbadano).

---

## 3. `cityPanel.ts` — literały „normal" (§2e)

Szukano po symbolu (`'normal'`/`(normal)`) w `gra/src/ui/cityPanel.ts` na pinie.

- **Fallbacki `cfg.difficulty ?? 'normal'`** (np. linie 1012, 1029, 1139, 1154, 1190, 1240, 1271, 3053, 3115, 3289, 3391, 3843, 4780, 5214, 5481, 5593): to wartości domyślne przy braku konfiguracji, nie tekst dla gracza — **nie są błędem prezentacji**; **NIEROZSTRZYGNIĘTY** co do wpływu (wymagałoby śledzenia `cfg.difficulty`).
- **Literał tekstowy w UI:** `cityPanel.ts:3927` `appendDetailSection(card, 'Religia — parametry (normal)')` w `buildKulturaDetailCard` (funkcja od l. ~3718) — **NADAL ISTNIEJE** (nagłówek sztywny; liczby ładowane dla aktualnej trudności, jak w audycie §3).

---

## 4. §3 — wagi okolicy `{3,0.5,0.5}`

- Literał w `cityPanel.ts:9684` (funkcja `buildOkolicaDetailCard`, l. 9617): `Profil „…”: wagi score — np. Żywność 3/0.5/0.5, Zrówn. 1/1/1.`
- Kod na pinie `gra/src/game/okolica.ts:317–319` (`wagiForFocus`): `zywnosc` → `{zywnosc:10, praca:0, handel:0}`; `produkcja` → `{zywnosc:0.5, praca:3, handel:0.5}`; `podatki` → `{zywnosc:0.5, praca:0.5, handel:3}`; `zrownowazone` → `{1,1,1}`.
- Wniosek: profil „Żywność" w kodzie to `{10,0,0}`; wartość `3/0.5/0.5` z panelu nie odpowiada profilowi żywności (odpowiada kształtem profilowi „produkcja" z zamienionym porządkiem pól). **NADAL ISTNIEJE** (literal rozjechany z kodem; zgodne z audytem §2e/§3).

---

## 5. §3 — próg buntu „10%/2 tury (hard)"

- Literały w `cityPanel.ts`: l. 3480 (`bunt_skrajny: '<10% — alert krytyczny, 2 tury grace …'`) i l. 3523 (`gridDetailRow(gt, '<10% Bunt skrajny', 'Kary max + grace 2 tury → rebelia')`), funkcja `buildPorzadekDetailCard` (od l. ~3427); l. 3545 `PorPct <10%: licznik grace`. Dane: `gra/data/society-params.json` l. 681–692.

| Parametr (pin, society-params.json) | easy | normal | hard |
|---|---|---|---|
| `porzadek_prog_bunt_skrajny_pct` (l. 681) | 6 | **12** | **14** |
| `porzadek_grace_tur_bunt` (l. 688) | 4 | **3** | **2** |

- Wniosek: „2 tury grace" zgadza się tylko z wartością **hard**; próg „10%" **nie zgadza się z żadnym poziomem** (hard = 14%, normal = 12%). Audytowe „10% to wartości hard" — **nieprawdziwe na pinie**. Stan: **NADAL ISTNIEJE** (literal sprzeczny z danymi, także na normal i hard).

---

## 6. §3 — podział daniny „batony 1/2/3"

- Literał w `cityPanel.ts:11002`: `racje żywności — per miasto (batony 1/2/3).` (nota w kolumnie ustawień, okolice l. 10998–11003).
- Na pinie nie znaleziono innego opisu skali „batony"; poziomy racji są w `gra/data/econ-params.json` (`koszt racji poziom 1–3`, l. 190–204, z opisami „koszt racji poziom N"). Suwak „Wyżywienie 0–6" jako docelowy zamiennik **nie został zweryfikowany** w tej rundzie (brak odczytu komponentu suwaka).
- Stan: **NADAL ISTNIEJE** (literal „batony 1/2/3" obecny na pinie; zamiennik — NIEROZSTRZYGNIĘTY).

---

## 7. §3 — liczba paneli „ściąga" (27) i ile z recenzją (10)

- Pin: w `cityPanel.ts` jest **28** funkcji `build*(Detail|Tooltip)*Card` (`git show edb8fb56:gra/src/ui/cityPanel.ts | grep -oE "^(export )?function build\w*(Detail|Tooltip)\w*Card"`), w tym 2 nieskatalogowane w audycie: `buildBuildingDetailCardViaEntityCard`, `buildUnitDetailCardViaEntityCard`. W `empireDetailPanel.ts` jest dodatkowo eksportowana `resUsageDetailsHtml` (audyt: „Zobacz szczegóły zużycia").
- Wniosek: liczba kandydatów na pinie to **29** (28 + 1), nie 27. Różnica wynika z: 2 nieskatalogowanych wariantów `…ViaEntityCard` oraz z tego, że audyt nie liczy wszystkich `build*` jako „ściąga" (część to info-karty). **NADAL ISTNIEJE** jako rozbieżność liczby.
- „10 z recenzją": nie da się zweryfikować na pinie (status recenzji istnieje tylko w dokumencie audytu, nie w kodzie). Stan: **NIEROZSTRZYGNIĘTY** co do recenzji; licznik paneli — rozbieżny (29 vs 27).
- Nazwy w audycie (np. `buildOkolicaDetailCard @8592`, `buildPorzadekDetailCard @3118`) są **nieaktualne linią** — na pinie: `buildOkolicaDetailCard` l. 9617, `buildPorzadekDetailCard` l. ~3427, `buildKulturaDetailCard` l. ~3718.

---

## 8. Podsumowanie czterech grup

| Grupa | Pozycje | Status na pinie |
|---|---|---|
| A. Ekonomia ×5 — Budynki (10 haseł poza Akademią) | 10 | **10 × NADAL ISTNIEJE** (dowód §1); + 5 rozjazdów nie-×5 (§1, tabela 2) |
| A'. Ekonomia ×5 — units / terrain | units, TI | units: ×5 w danych potwierdzone, rozjazd wiki (§2.1: 1× ×5, 3× inne, 1× materiał); TI: dane ×5 potwierdzone, wiki bez rozjazdu, **nowy** rozjazd `_meta` vs dane (tartak/kamieniolom 200 vs 50) |
| B. `cityPanel.ts` literały | „normal" (nagłówek l. 3927), okolica (l. 9684), bunt (l. 3480/3523), batony (l. 11002) | **NADAL ISTNIEJE** (4/4 literałów obecne; fallbacki `?? 'normal'` — nie błąd prezentacji) |
| C. Wartości w §3 | okolica `{3,0.5,0.5}` vs kod `{10,0,0}`; bunt „10%" vs dane 12/14; „2 tury" = tylko hard; batony | okolica: **NADAL ISTNIEJE**; bunt: **NADAL ISTNIEJE** (audytowe „hard" błędne — hard = 14%); batony: **NADAL ISTNIEJE** |
| D. Liczba paneli „ściąga" | 27 vs pin 29 kandydatów; recenzje 10 | licznik **rozbieżny**; recenzje **NIEROZSTRZYGNIĘTY** (nieweryfikowalne w kodzie) |

**Kryterium binarne z dispatchu** („wszystkie 4 grupy pozycji mają status z dowodem"): **spełnione dla statusów** — każda grupa ma status i dowód pinowy. Nie spełnione w pełnym zakresie treści: poza tymi pozycjami wciąż **NIEROZSTRZYGNIĘTE** są: 48 jednostek bez liczby surowca w wiki (§2.1), 17 paneli UI bez oceny treści (§7), reszta haseł „Budynki" bez jawnej liczby (§1), oraz zakres audytu §2a/§2b/§3 Poradnika (poza czterema grupami dispatchu).

## 9. Zastrzeżenia

- Nie uruchomiono testów, `npm`/`cargo`, gry. `gra/**` nietknięte (tylko odczyt przez `git show`).
- Liczby w wiki odczytano z pól `wikiS`/`wikiM`/`full` regexem; hasła bez jawnej liczby nie są porównywane.
- Przyczyny rozjazdu `tartak`/`kamieniolom` (200 vs 50) nie zbadano; możliwe, że `_meta` jest nieaktualny po późniejszym commicie — do rozstrzygnięcia przez właściciela danych.
- Pozostałe równoległe tematy P1.16D-* piszą do własnych plików; ten plik nie dotyka `P1-16-EDGE-CASES.md`.
