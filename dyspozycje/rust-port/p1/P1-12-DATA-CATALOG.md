# P1.12 — Katalog pełnych danych `gra/data/*.json`

**Temat:** R-RUSTPORT-P1-12-DATA-CATALOG-Q1 · **Runda:** 1/5 · **Rola:** Operator (poprawka po zarzutach Evaluatora, obrona w tej samej rundzie)
**Pin webowy:** `main` = `edb8fb56` (`docs(robocza): close remote readback for F01-F03 release`)
**Źródło pomiaru:** `git archive edb8fb56 gra/data` rozpakowane do scratchpada
(`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p112-verify/gra/data`).
Pomiar nie pochodzi z drzewa roboczego: aktualny HEAD repo lokalnego to `e5c959c2` na gałęzi
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a w nim 5 plików `gra/data` różni się od `edb8fb56`
(m.in. `civs.json`, `units.json`). Rozmiary poniżej są z pinu `edb8fb56`.
**Metoda liczenia:** `ls` i `wc -c` na rozpakowanym pinie; liczby rekordów i kluczy przez `node -e`
(`require` każdego pliku, `Array.isArray` / `Object.keys`). Skrypt pomiarowy: `scratchpad/p112-check.js`
(w katalogu `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/`).

## Podsumowanie

- **Łączna liczba plików w `gra/data/`: 30** (`ls` na pinie `edb8fb56`; potwierdza liczbę z poprzedniego audytu).
- Z tego **29 plików `.json`** i **1 plik `earth-mask-source.png`** (nie JSON, poza liczeniem rekordów).
- Brak pominiętych plików: wszystkie 30 pozycji opisane poniżej.

## Katalog

Legenda: **tablica** = top-level array (rekordy = elementy); **obiekt** = top-level object.
Kolumna „Rekordy” podaje dla tablic liczbę elementów, dla obiektów z rekordami liczbę rekordów
(z opisem, co nim jest), a dla **obiektów bez rekordów** — wprost oznaczonych jako
„obiekt bez rekordów” — liczbę sekcji top-level (nie liczbę rekordów).

| # | Plik | Rozmiar (B) | Typ | Rekordy (zweryfikowane) | Schemat (klucze jednego rekordu) | Przeznaczenie |
|---|---|---:|---|---|---|---|
| 1 | `ai-params.json` | 23873 | obiekt | 136 kluczy top-level, każdy = obiekt parametru (to są parametry, nie rekordy domenowe) | `wartosc`, `sekcja`, `opis` | Parametry AI wg poziomu trudności (produkcja, nauka, agresja, dyplomacja, cele). |
| 2 | `auto-battle-params.json` | 487 | obiekt | **obiekt bez rekordów**: 4 sekcje top-level (`_opis`, `_maciej_kroki`[3], `kalibracja`, `straty`) | brak jednolitego rekordu | Parametry auto-bitwy: kalibracja i straty. |
| 3 | `buildings.json` | 123209 | tablica | 42 budynki | 21 kluczy: `id`, `nazwa`, `kategoria`, `grupa`, `epokaWejscia`, `maksPoziom`, `nazwyPoziomow`, `baza`, `przyrost`, `kosztBudowy`, `przyrostKosztu`, `utrzymanie`, `przyrostUtrzymania`, `wymagania`, `uwagi`, `historia`, `opis`, `top3`, `techUnlock`, `koszt_surowce`, `dajeSzczescie` | Katalog budynków miast: koszty, utrzymanie, efekty, epoki. |
| 4 | `citizen-resource-upkeep.json` | 2272 | obiekt | **obiekt bez rekordów**: 3 epoki (`epoki`[3]) + `_opis`, `_kara` (sekcje top-level) | `epoka`, `nazwa`, `surowce` | Utrzymanie zasobów przez obywateli wg epoki oraz kara. |
| 5 | `city-names-pools.json` | 30514 | obiekt | 15 pul nazw (np. `grecy`, `rzymianie`, `chinczycy`) | `nazwa_pl`, `miasta_cywilizacji` | Pule nazw miast per cywilizacja. |
| 6 | `civ-ai.json` | 5009 | obiekt | `cywilizacje`[15] + `_meta` | 10 kluczy: `Cywilizacja`, `agresywnosc`, `ekspansywnosc`, `priorytetMilitarny`, `priorytetEkonomia`, `priorytetNauka`, `tolerancjaRyzyka`, `sklonnoscDoPodboju`, `profilMapy`, `uwagi` | Profil zachowania AI per cywilizacja. |
| 7 | `civ-matrix.json` | 70801 | obiekt | `cywilizacje`[15]; `paramDefs`[93]; `defaults`; `_meta` | 5 kluczy per cywilizacja (`paramDefs` = definicje 93 parametrów) | Macierz parametrów cywilizacji z definicjami i formułami łączenia modyfikatorów. |
| 8 | `civ-params.json` | 3547 | obiekt | `cywilizacje`[15] + `_meta` | 6 kluczy: `Cywilizacja`, `preferowaneBudynki`, `preferowaneJednostki`, `modWzrostu`, `modEkonomii`, `uwagi` | Preferencje i modyfikatory wzrostu/ekonomii per cywilizacja. |
| 9 | `civs.json` | 63037 | obiekt | `cywilizacje`[15]; `start_gry`[11] | cywilizacje: 18 kluczy (m.in. `Cywilizacja`, `Styl / charakter`, `Jednostka specjalna`, `Bonus startowy`, `Religia`, `mnoznikHandelPieniadz`, `ikonaId`, `wodzowiePula`, `wodzowie`, `kolorHex`, `bonusy`, `typCywilizacji`); start_gry: `Parametr`, `Wartość`, `Uwagi` | Definicje 15 cywilizacji (bonusy, wodzowie, kolory, ikony) i parametry startu gry. |
| 10 | `combat-params.json` | 4167 | obiekt | **obiekt bez rekordów**: 12 sekcji top-level (`_opis`, `macierz_v2`, `tw_v3`, `ss5l_legacy`, `counter_multiplier`, `morale_przewaga_mocy`, `river_attack_mult`, `brod`, `oblężenie`, `siege_ai`, `unit_power`, `battle_loot`) | brak jednolitego rekordu | Parametry walki: macierze, mnożniki przeciwników, morale, rzeka, bród. |
| 11 | `counters.json` | 2705 | tablica | 17 wpisów | 5 kluczy: `Typ atakujący`, `Cel (typ)`, `Bonus`, `Rodzaj (Atak/Obrona)`, `Status` | Tabela przewag typów jednostek (atak/obrona). |
| 12 | `diplomacy-acceptance-points.json` | 3105 | obiekt | **obiekt bez rekordów**: 5 sekcji top-level (`_opis`, `traktaty`, `koszyk_pn`, `sweetener`, `fair_trade`) | brak jednolitego rekordu | Punkty akceptacji propozycji dyplomatycznych (traktaty, koszyk, słodzik, fair trade). |
| 13 | `diplomacy.json` | 35194 | obiekt | **11 sekcji top-level** (pełna lista): `params` (obiekt, 132 klucze), `handel_zloze` (obiekt, 5 kluczy), `handel_waluta` (obiekt, 2), `wartosc_katalog` (obiekt, 14), `pn_relacja` (obiekt, 9), `akcje_dyplomatyczne`[15], `parametry_relacji`[3], `zmiany_parametrów`[24], `respekt_-_czynniki`[8], `panel_sterowania` (obiekt, 6), `perNacja`[15] | `akcje_dyplomatyczne`: `Akcja`, `Opis`, `Dostępne: Główni rywale`, `Dostępne: Poboczni`, `Koszt`, `Efekt`; `perNacja`: `Cywilizacja`, `sklonnoscSojusze`, `lojalnosc`, `progWojny`, `pamietliwosc`, `otwartoscHandel`, `nastawienieBazowe`, `uwagi` | Dyplomacja: akcje dyplomatyczne, zmiany parametrów i czynniki respektu, parametry relacji per nacja (`perNacja`), ogólne parametry dyplomacji (`params`), handel (`handel_zloze`, `handel_waluta`, `wartosc_katalog`, `pn_relacja`) oraz panel sterowania. |
| 14 | `e-start-params.json` | 4250 | obiekt | **obiekt bez rekordów**: 11 sekcji top-level (`_opis`, `defaulty`, `skala_mapy`, `generator_e2`, `tempo_gry`, `city_limits`, `koszt_budynkow_pace`, `koszt_jednostek_pace`, `zwyciestwo`, `kreator_zaawansowane`, `decyzje_kanon`) | brak jednolitego rekordu | Parametry startu gry i kreatora: domyślne ustawienia, skala mapy, tempo, limity miast, warunki zwycięstwa. |
| 15 | `earth-mask-source.png` | 77618 | PNG (nie JSON) | — | — | Maska Ziemi jako źródło danych mapy; nie jest rekordowym JSON-em. |
| 16 | `econ-params.json` | 47361 | obiekt | **obiekt bez rekordów**: 7 sekcji top-level (`ekonomia_miasta`, `budynki`, `teren_mapa`, `wealth`, `globalne`, `handel_szlaki`, `handel_surowce`) | brak jednolitego rekordu (pola typu `próg_wzrostu_wspolczynnik`, `zywnosc_jednostka_ruch`, `suwak_*_domyslnie`) | Parametry ekonomii: wzrost miast, żywność, handel, szlaki, domyślne suwaki. |
| 17 | `epoka-ludnosc-manpower.json` | 1726 | obiekt | `epoki`[10] + `_opis`, `_formuly` | 4 klucze: `epoka`, `ludekNaLudka`, `manpowerNaLudka`, `manpowerNaJednostke` | Przelicznik ludności i manpower per epoka. |
| 18 | `map-gen-params.json` | 4709 | obiekt | **obiekt bez rekordów**: 7 sekcji top-level (`_meta`, `mgla`, `gestosc`, `mapa_skala`, `generator`, `deposit_rules`, `metal_deposit_min_era`) | brak jednolitego rekordu | Parametry generatora mapy, gęstości i złóż surowców. |
| 19 | `miasto-params.json` | 8016 | obiekt | 26 kluczy top-level, każdy = obiekt parametru (to są parametry, nie rekordy domenowe) | 3 klucze: `wartosc`, `jednostka`, `opis` | Parametry miast i jednostek: koszty, regeneracja manpower, oblężenie, minimalne odległości. |
| 20 | `power-params.json` | 5619 | obiekt | **obiekt bez rekordów**: 8 sekcji top-level (`_opis`, `_nazewnictwo`, `_formuly`, `mnoznikEpoki`, `skladniki`, `kalibracja`, `opcje`, `uwagi`) | brak jednolitego rekordu | Formuła siły armii/jednostek i jej kalibracja. |
| 21 | `resources.json` | 3720 | tablica | 15 surowców | 4 klucze: `Surowiec`, `Typ`, `Źródło / budynek`, `Uwagi` | Katalog surowców i źródeł ich pozyskania. |
| 22 | `society-params.json` | 40937 | obiekt | 7 sekcji top-level (`zdrowie`, `szczescie`, `kultura`, `religia`, `religie_cywilizacji`[9], `porzadek`, `prawo`) | `religie_cywilizacji`: `Cywilizacja`, `Religia / wyznanie`, `Główne bóstwo / idea`, `Wpływ na parametry (bonusy) [propozycja, edytowalne]` | Parametry społeczne: zdrowie, szczęście, kultura, religia, porządek, prawo. |
| 23 | `tech.json` | 47504 | obiekt | `technologie`[32]; 4 klucze top (`drzewko_model`, `_drzewko_model_opis`, `tempo_gry`, `technologie`) | 12 kluczy: `Technologia`, `Epoka`, `Poziom`, `Dostęp do surowca.`, `wymagany budynek`, `Wymaga (prereq)`, `Odblokowuje surowiec.`, `Odblokowuje budynek`, `Koszt nauki`, `Uwagi`, `Odblokowuje ulepszenie terenu`, `Historia` | Drzewko technologii: wymagania, koszty nauki, odblokowania. |
| 24 | `terrain-combat.json` | 2033 | tablica | 7 terenów | 6 kluczy: `Teren`, `Koszt wejścia (ruch)`, `Bonus Obrona`, `Δ Zasięg (dystansowi)`, `Kawaleria/Rydwan`, `Efekt specjalny` | Modyfikatory walki i ruchu wg terenu. |
| 25 | `terrain-improvements.json` | 45413 | obiekt | **22 rekordy ulepszeń** (`farma`, `irygacja`, `bydlo`, `owce`, `lama`, `stadnina`, `glinianka`, `kamieniolom`, `oboz_lowiecki`, `wyrab`, `tartak`, `tarasy`, `lodzie_rybackie`, `warzelnia_soli`, `fort`, `droga`, `droga_brukowana`, `kopalnia_miedzi`, `kopalnia_zelaza`, `kopalnia_cyny`, `kopalnia_zlota`, `posterunek`). 24 klucze top-level = 22 rekordy + `_meta` (opis schematu, nie rekord) + `_miasto_zasieg_ref` (pole `_komentarz`: notatka o zasięgu miasta, nie rekord). | Rekord ulepszenia (zweryfikowany na `farma`, analogicznie na `droga`): `nazwa`, `epoka`, `bonus`, `surowiecOdblokowany`, `teren`, `warunek`, `koszt_praca`, `tech`, `odblokowuje`, `uwagi`, `historia` (warianty). Klucze `opis`, `bonus_pola`, `decyzje_MIASTO`, `kanon_zywnosc_hodowla`, `decyzje_EKONOMIA`, `klucze_surowcow_ASCII`, `pole_surowiec_ilosc_tura` występują WYŁĄCZNIE w `_meta` (opis schematu), nie w rekordach. | Ulepszenia terenu (farmy, hodowla, kopalnie, drogi, posterunki): bonusy, epoki, decyzje. |
| 26 | `terrain-movement.json` | 181 | obiekt | `costs` (8 terenów) + `forestExtra` | `costs`: `Laka`, `Rownina`, `Pustynia`, `Wybrzeze`, `Wzgorza`, `Gory`, `Morze`, `Polarny` | Koszty ruchu wg terenu. |
| 27 | `terrain-yields.json` | 3163 | obiekt | `terrain_types`[8]; `terrain_modifiers`[2] | `terrain_types`: `Teren`, `Żywność`, `Praca`, `Podatek`, `Drewno`, `Kamień`, `Glina`, `Suma`, `Uwagi`; `terrain_modifiers`: `Modyfikator` + te same plony | Bazowe plony terenów i modyfikatory. |
| 28 | `ui-params.json` | 6259 | obiekt | **obiekt bez rekordów**: 4 sekcje top-level (`_opis`, `panel_miasta`, `menu`, `nowa_gra`) | brak jednolitego rekordu | Parametry UI: panel miasta, menu, ekran nowej gry. |
| 29 | `units.json` | 258242 | tablica | 75 jednostek | 59 kluczy (m.in. `Jednostka`, `Historia`, `Epoka`, `Kultura`, `Tech`, `Pieniądz (koszt)`, `Ludność`, `Surowiec`, `Utrzymanie (Pieniądz/turę)`, `Atak`, `Obrona`, `Ruch`, `Health`, `Typ`, `Klasa`, `Nacja`, `Bonus vs …` ×7, `meleeAttack`, `meleeDefence`, `weaponDamage`, `armor`, `health`, `fieldPower`, `Dostępna w epokach`, `Top3`) | Katalog jednostek: koszty, statystyki walki, utrzymanie, bonusy przeciw typom. |
| 30 | `wonders.json` | 51906 | obiekt | `cuda`[19]; `parkowane_epoka4plus`[5]; 4 klucze top (`_meta`, `cuda`, `panstwa`, `parkowane_epoka4plus`) | `cuda`: `id`, `nazwa`, `dostep`, `cywilizacje`, `techUnlock`, `wymagaTerenu`, `epokaWejscia`, `absolut`, `maxNaSwiecie`, `kosztBudowy`, `utrzymanie`, `bonusy`, `historia`; `parkowane`: `id`, `nazwa`, `dostep`, `cywilizacje`, `techUnlock`, `wymagaTerenu`, `epokaDocelowa`, `epokaDocelowaOpis`, `maxNaSwiecie`, `aktywne`, `uwagi` | Cuda świata (19 aktywnych + 5 parkowanych epoki 4+) i państwa. |

## Uwagi do pomiaru

- Liczby rekordów tablic (`buildings` 42, `units` 75, `tech.technologie` 32, `counters` 17,
  `resources` 15, `terrain-combat` 7, `terrain-yields.terrain_types` 8, `civs.cywilizacje` 15,
  `wonders.cuda` 19, `terrain-improvements` 22 rekordy ulepszeń) pochodzą z `node -e` na pinie `edb8fb56`.
- Dla plików typu „parametry” (`ai-params`, `miasto-params`) „rekordem” jest pojedynczy klucz parametru;
  liczba 136 / 26 to liczba kluczy top-level, nie liczba obiektów domenowych.
- Wiersze oznaczone „obiekt bez rekordów” (2, 4, 10, 12, 14, 16, 18, 20, 28) podają liczbę SEKCJI top-level,
  nie liczbę rekordów domenowych; takie pliki nie mają jednolitej tablicy rekordów. Pełna struktura wymaga
  szczegółowego audytu w P1.14/P3.5–P3.7, nie tego katalogu.
- `diplomacy.json` (wiersz 13): wszystkie 11 sekcji top-level wymienione, także `params` (132 klucze).
- Niezgodność z drzewem roboczym: 5 plików `gra/data` różni się między `edb8fb56` a lokalnym HEAD
  `e5c959c2`; ten katalog opisuje wyłącznie pin `edb8fb56`.
