# P1.16D — OPISY-PORADNIK-A: rozjazd treści Poradnika vs kod/dane

**Temat:** R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1
**Runda:** 3/5 (runda 3: naprawa defektu #6, 04.9c) (obrona po zarzutach Evaluatora rundy 1; zmiany oznaczone jako „runda 2")
**Pin web:** `edb8fb56` (czytane przez `git show edb8fb56:<ścieżka>`; working tree repo jest na innym commicie i nie był źródłem)
**Zakres:** `docs/PORADNIK-GRACZA/` rozdziały 00, 01, 02, 04, 05, 08, 09, 10 — treść główna.
**Pominięte (zgodnie z dispatchem):** bloki „Przykład liczbowy / Strategia gracza / Typowe błędy" oraz powtarzalne linie szablonowe. Uwaga: linie „Kreator: Standard… 6 rywali" i „Tempo Szybka ×0,2 — tech 50 kosztuje 10" są kopiowane do każdej sekcji jako blok szablonowy; wpis z tempem zgłaszam poniżej, bo jest sprzeczny z kodem.

**Zakres dodatkowy (jawnie, runda 2, zarzut 1):** poniższe pozycje pochodzą z bloku „Przykład liczbowy" (treść poradnika, nie blok szablonowy) i były ocenione mimo wyłączenia bloków. Są zachowane, bo rozjeżdżają się z danymi, ale pokrywa je też temat BOILERPLATE:
- ch00 l.225–226 → 00.4, 00.5, 00.6 (blok „Przykład liczbowy" od l.223)
- ch02 l.68–69 → 02.4, 02.5, 02.6, 02.7 (blok od l.66)
- ch09 l.170 → 09.9 (blok od l.168)
- ch10 l.173–174 → 10.12, 10.13 (blok od l.171)
- ch08 l.383 → 05.8 (blok „Przykład liczbowy" §53.6 od l.381; źródło wiersza poprawione z „ch05 §53.6")

**Legenda statusów (per twierdzenie):**
- **NADAL ISTNIEJE** — rozjazd potwierdzony (treść ≠ pin).
- **NAPRAWIONY** — treść zgadza się z pinem (wskazano źródło).
- **NIEROZSTRZYGNIĘTY** — nie dało się jednoznacznie zweryfikować (powód podany; przy braku przeszukania powód mówi, czego nie sprawdzono).

Źródła kodu/danych: `gra/data/*.json`, `gra/src/**/*.ts` na `edb8fb56`.

---

## 00 — Jak czytać

| # | Twierdzenie (linia) | Status | Dowód na pinie |
|---|---|---|---|
| 00.1 | Cel: dominacja >50% siły w epoce Żelaza (l.21) | NAPRAWIONY | `e-start-params.json` `zwyciestwo`: `prog_dominacji_power 0.5`, `ostatnia_epoka_v1 3` |
| 00.2 | Tempo Szybka ×0,2 — tech 50 kosztuje efektywnie 10 (l.29; powtórzone w bloku szablonowym) | NADAL ISTNIEJE | `tech-tempo.ts`: szybka ×1.0, standardowa ×2.0, długa ×4.0; `R_STAWKI_KOSZT_MULT=2` (globalnie) → 50 daje 100 PN przed trudnością |
| 00.3 | 9 typów cywilizacji (l.79) | NADAL ISTNIEJE | `civs.json`: pula 15 typów (D-ROSTER-Q3); liczba typów na mapie zależy od rozmiaru: `typy_cywilizacji` 4–14 (`e-start-params.json`). Poradnik wymienia 9 pierwszych z listy 15 |
| 00.4 | Mapa Standard 84×60 = 5040 heksów (l.225, blok przykładu) | NADAL ISTNIEJE | `e-start-params.json` `skala_mapy.Standardowy`: `hex_w 168, hex_h 120`; `map-gen-params.json` `rozmiar_dims.standardowy = [168,120]` (generator `ROZMIAR_DIMS`). Malenki: `e-start` 76×52 vs `ui-params.json` opis „~1000 hex (38×26)" (l.111) — rozjazd także wewnątrz danych UI. Sprzeczność w danych (ui-params „84×60" vs e-start/generator 168×120) — decyzja właściciela, który wymiar jest kanoniczny |
| 00.5 | Zasięg wzroku 2 → 19 heksów (l.225, blok przykładu) | NADAL ISTNIEJE | Poradnik w §8.1 (cz. II) mówi „domyślnie 3"; `units.json` `Widok pola`: 1–5, większość 1–2; fallback `mgla.default_sight_jednostki=3`. Arytmetyka 19 = promień 2 — poprawna, ale nie odpowiada danym |
| 00.6 | Kultura próg 100 → +1 pierścień (~6 heksów) (l.226, blok przykładu) | NAPRAWIONY | `society-params.json` `kultura_prog_zasieg_1` normal=100; pierścień 1 = 6 heksów |

## 01 — Pierwsze kroki

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 01.1 | Domyślna cywilizacja Rzymianie (§2.3, §2.6) | NAPRAWIONY | `e-start-params.json` `defaulty.player_civ_id = rzymianie` |
| 01.2 | Epoka startowa domyślnie Kamień (§2.2, §2.6) | NAPRAWIONY | `defaulty.start_epoch_id = kamien` |
| 01.3 | Typ świata: Kontynenty, Pangea, Wyspy, Ziemia; domyślnie Kontynenty (§2.4) | NAPRAWIONY | `ui-params.json` `world_type`, `domyslny: 0` |
| 01.4 | Rozmiar domyślnie Standardowy (§2.4) | NAPRAWIONY | `ui-params.json` `map_size`, `domyslny: 2` = Standardowy |
| 01.5 | Rozmiary: Malenki · Mały · Standardowy · Duży · Ogromny (§2.4) | NADAL ISTNIEJE | Poprawka dowodu (runda 2, zarzut 9): na pinie **Super Huge jest** w `ui-params.json` `map_size.opts` (l.108) i w `generator.ts` `ROZMIAR_MENU_LABELS` (l.787, 6. pozycja). Rozjazd dotyczy wyłącznie treści poradnika: `01-pierwsze-kroki` l.92 wymienia 5 rozmiarów, bez Super Huge |
| 01.6 | Standardowy = 84×60 heksów (§2.4) | NADAL ISTNIEJE | Patrz 00.4 (`e-start-params` Standardowy 168×120) |
| 01.7 | Tempo: Szybka ×0,2 · Standard ×1 · Długa ×5 (§2.4, §6.3) | NADAL ISTNIEJE | Kod: szybka ×1, standardowa ×2, długa ×4 (`e-start-params.json` `tempo_gry`, `tech-tempo.ts`). Zgodny z tym jest dopiero §51.2 cz. VIII |
| 01.8 | Rywale AI ok. 6 na Standardowym (§2.4) | NAPRAWIONY | `e-start-params.json` `skala_mapy.Standardowy.rywale_ai = 6` |
| 01.9 | Tempo domyślnie Standard (§2.6) | NAPRAWIONY | `main.ts` ~L36903 `speed: 'Standardowa'` |
| 01.10 | Dziewięć aktywnych typów cywilizacji (§2.3) | NADAL ISTNIEJE | Patrz 00.3 |
| 01.11 | Próg wzrostu ludności wyższy na Trudnym (§5.2) | NAPRAWIONY | `econ-params.json` `próg_wzrostu_wspolczynnik`: easy 12, normal 16, hard 20 |
| 01.12 | Osada: bonus dla miasta 1–4 mieszkańców, słabnie z trudnością (§3.3) | NAPRAWIONY | `society-params.json` `zdrowie_bonus_osiedle_pop` (indeks pop1…pop4, malejący) |
| 01.13 | Koszt nowego miasta 20 Pracy + 1 ludność; min. 4 heksy (§3.1) | NAPRAWIONY | `miasto-params.json`: `zaloz_miasto_koszt_praca=20`, `zaloz_miasto_koszt_ludnosci=1`, `min_dystans_miast=4` |
| 01.14 | Okolica miasta: promień 3 heksów (§3.2) | NADAL ISTNIEJE | Poprawka dowodu (runda 2, zarzut 10): `miasto-params.json` `zasieg_okolicy_miasta = 10` („promien okolicy = 10 (bylo 5)", pola na plony z każdej strony; ~21×21), `zasieg_okolicy_baza = 5` (minimum przy pop 1–4), `zasieg_okolicy_max = 15`. Poradnik: 3 — rozjazd z każdą wartością danych |
| 01.15 | „W tej grze nie ma jednostki osadnika" (§3.1) | NIEROZSTRZYGNIĘTY | Mechanika zgodna (`city-founding.ts`: „bez osadnika", `foundCityAt`). Ale `civs.json` `start_gry` pisze „gracz zawsze startuje z 1 osadnikiem" — wpis danych do wyjaśnienia (poza treścią poradnika) |
| 01.16 | Brąz jako start: wszystkie tech Kamienia zbadane (§6.1) | NIEROZSTRZYGNIĘTY | Powód (runda 2): zlokalizowano `e-start-params.json` `e1_tech_kaskada_epok = true` oraz `production.ts:880` (R-EPOKA-KASKADA-JEDNA-Q1) i `civ-entry-epoch.ts`; nie przeczytano mechanizmu, który zalicza wszystkie tech Kamienia — rozstrzygnięcie wymaga lektury tych plików |
| 01.17 | Żelazo „Wkrótce” (wyszarzona) w kreatorze (§2.2) | NADAL ISTNIEJE | Runda 2 (obrona, zarzut 7): mechanizm to `renderEpochStep` (`gra/src/ui/newGameFlow.ts` l.1533–1545): karta dostaje klasę `lock` tylko gdy `!epochHasCivs(e.id)` (l.1537). `epochHasCivs` (l.588–590) → `civsForEpoch` (l.584–586) → `civAvailableAtEpoch` (`civMinStartEpochIndex` l.518–521 ≤ `startEpochIndex` l.512–515; `START_EPOCH_ORDER` l.510 = kamien, braz, zelazo). Żelazo ma cywilizacje (`zelazo` w `civs.json`, 17 trafień), więc karta NIE jest zablokowana. Pola `avail: true` i `badge: 'Dostepna'` (l.639) nie są czytane (brak odczytu `.avail`; badge nie jest renderowany, l.1540 pokazuje `N cyw.`). Napis „Wkrótce” w `gra/src/ui` tylko w `scienceHubHud.ts` l.610 |

## 02 — Mapa świata

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 02.1 | Zasięg wzroku: większość jednostek 3 heksy; zwiadowca min. 5 (§8.1) | NADAL ISTNIEJE | `units.json` `Widok pola`: 2 → 31 jednostek, 1 → 24, 3 → 8, 4 → 10, 5 → 2. Zwiadowca = 5 (zgodnie) |
| 02.2 | Seed mapy losowy przy każdym Start (§7.2) | NAPRAWIONY | `e-start-params.json` `kreator_zaawansowane.seed_mode_default = random` |
| 02.3 | Gęstość Mało/Średnio/Dużo (§7.3) | NAPRAWIONY | `generator_e2` resource_mult low 0.6 / normal 1.0 / high 1.4 |
| 02.4 | Relacja startowa +15 (neutralna) (§7.4, blok przykładu l.68) | NADAL ISTNIEJE | `diplomacy.json` `parametry_relacji`: Relacja = Zaufanie + Respekt, start 50 (Zaufanie 20 + Respekt 30) |
| 02.5 | Próg odblokowania handlu: relacja +20 (§7.4, blok przykładu) | NADAL ISTNIEJE | `diplomacy.json` `wartosc_katalog.handel_prog_relacja = 40` |
| 02.6 | Prezent +8 PN → +23 (§7.4, blok przykładu) | NIEROZSTRZYGNIĘTY | Powód: przeszukano `gra/data/diplomacy.json` pod kątem akcji „Prezent" bez wyniku; nie przeszukano `gra/src/game` (akcje dyplomacji) |
| 02.7 | Wspólna religia +10 relacji (§7.4, blok przykładu) | NADAL ISTNIEJE | `diplomacy.json` `wspolnaReligia_zaufanie_perTura = 0.5` (zaufanie co turę, nie +10 relacji jednorazowo) |
| 02.8 | Rzymianie −5% kary korupcji (§8.4) | NIEROZSTRZYGNIĘTY | Powód: nie znaleziono w `civs.json`; nie przeszukano `gra/src/game/economy.ts` (kara korupcji per cywilizacja) |
| 02.9 | Zasięg terytorium: Miasto ~10, Posterunek ~5, Fort ~10 (§9.1) | NAPRAWIONY | `terrain-improvements.json`: posterunek `zasieg_terytorium=5`, fort `10`; `_miasto_zasieg_ref`: miasto bazowo 10 |
| 02.10 | Koszt/odległość/źródło ludności przy zakładaniu miasta (§9.2) | NAPRAWIONY | Patrz 01.13 |
| 02.11 | Trudny: AI +15% produkcji (§9.3) | NADAL ISTNIEJE | Zmiana statusu (runda 2, zarzut 8). Brak mnożnika 1,15 w `gra/data/*` (wyszukiwanie `1[.,]15` puste) i w `gra/src/game` nie ma mnożnika produkcji AI na trudności; jedyne `1.15` w `game/` to niezwiązane parametry (`ai-cs-absorption.ts:151`, `auto-battle-params.ts:40`). Model kodu: `difficulty-cost.ts` l.11–13, 62–71 — Trudny = gracz koszt ×2, AI ×1 (koszt, nie produkcja). Poradnik opisuje efekt, którego w danych nie ma |
| 02.12a | Podbite miasto: „30% twojej kultury” (§10.3) | NADAL ISTNIEJE | Runda 2: brak stałej 30% w `society-params.json` (`kultura_konwersja_*` to %/turę, normal 1–2). Przy zdobyciu `onCityCapturedCulture` (`gra/src/game/conquest-stability.ts` l.40–55) udział kultury nowego właściciela = 1 − udział poprzedniego, nie 30% |
| 02.12b | Obca religia dominuje: „−2 szczęścia” (§10.3) | NADAL ISTNIEJE | Runda 2: `society-params.json` `religia_kara_obca` (l.539–545): easy −2, **normal −4**, hard −6, jednostka „pkt Zadowolenia”. Kara nie steruje już linią szczęścia (G5, `society-breakdown.ts` l.109–113 — linia proporcjonalna) |
| 02.12c | Obca kultura: „−1” (§10.3) | NADAL ISTNIEJE | Runda 2: `society-params.json` `kultura_kara_zadowolenie_lt50` (l.397–403): easy −1,5, **normal −2**, hard −2,5. Wartość −1 to tylko fallback w `culture-religion.ts` l.214, gdy brak danych |
| 02.13a | Świątynia +2 kultury/t (§10.3) | NAPRAWIONY | Runda 2 (obrona, zarzut 3): cytowane źródło efektywne `gra/data/buildings.json` `swiatynia.baza.kultura` = 2 (zgodne z „+2 kultury/t”). `society-params.json` `kultura_swiatynia` (l.320–326, normal 2) nie ma czytelnika w `gra/src` i nie jest dowodem |
| 02.13b | Świątynia: +2 szczęścia (§10.3) | NAPRAWIONY | Runda 2 (obrona, zarzut 1): efektywna wartość `gra/data/buildings.json` `swiatynia.baza.zadowolenie` = 2 (zgodne z „+2”). Parametr `religia_swiatynia_zadowolenie` (`society-params.json` l.525–531, normal 1) nie ma czytelnika w `gra/src` i nie jest dowodem. Zastrzeżenie: poradnik wiąże +2 z „bonusem własnej religii po 50%” — bramkę opisuje wiersz 02.13c |
| 02.13c | Świątynia: próg 50% wyznawców dla bonusu (§10.3) | NADAL ISTNIEJE | Runda 2 (obrona, zarzut 2 — poprawiony powód): bramka 50% nie istnieje dla bonusu Świątyni — `buildings.json` `swiatynia.baza.zadowolenie` = 2 bez warunku. `religia_prog_dominacji` = 50 (`society-params.json` l.490–495) jest czytany w `dominantReligion` (`culture-religion.ts` l.675–689, `share > 0.5`), ale nie steruje bonusem Świątyni. Skok przy 49/51% zastąpiony linią proporcjonalną (G4, `culture-religion.ts` l.912–925); `religia_zadowolenie_dominujaca` (normal 4) nie steruje już szczęściem |
| 02.14a | Miedź widoczna od epoki Brązu (§11.2) | NAPRAWIONY | Runda 2: `terrain-improvements.json` `kopalnia_miedzi.epoka = 2`; `resources.json` Ruda (miedź) — wejście Odlewni brązu. Ukrywanie złoża (E3) nie prześledzone w kodzie; zgodna jest epoka kopalni |
| 02.14b | Żelazo widoczne od epoki Żelaza (§11.2) | NAPRAWIONY | Runda 2: `terrain-improvements.json` `kopalnia_zelaza.epoka = 3` (l.341–); `resources.json` Żelazo — Odlewnia żelaza |
| 02.14c | Miedź i żelazo „tylko na Górach” (§11.2) | NADAL ISTNIEJE | Runda 2: `kopalnia_miedzi.teren` = „Wzgórza, Góry, złoże miedzi…” (l.332); `kopalnia_zelaza.teren` = „Wzgórza, Góry, złoże żelaza” (l.350). Dane dopuszczają Wzgórza, poradnik tylko Góry |
| 02.15 | Kamień bez złoża (kamieniołom na wzgórzu/górze) (§11.2) | NAPRAWIONY | Runda 2: `terrain-improvements.json` `kamieniolom` (l.136–149): `teren` = „Wzgórza, Góry (kamień)”, `warunek` = „budulec — mury, budynki”, brak wymogu złoża; `surowiecOdblokowany = kamien`. Uwaga o danych (nie o poradniku): `resources.json` Kamień ma „Wzgórza/Góry + Kopalnia”, a `terrain-improvements.json` nie ma kopalni kamienia (są tylko miedzi, żelaza, cyny, złota) |
| 02.16 | Mury = 15 cegły (§11.3) | NADAL ISTNIEJE | `buildings.json` `Mury.koszt_surowce = {drewno 40, kamien 80}` — brak cegły |
| 02.17 | Modele miast Brązu: Sumer, Egipt, Inkowie, Zulusi (§12.2) | NIEROZSTRZYGNIĘTY | Zakres wizualny (assety), poza weryfikacją danych w tym temacie |
| 02.18 | Stała mapy 84×60 = 5040; wzrok 2 → 19 (l.155) | NADAL ISTNIEJE | Patrz 00.4, 00.5 |
| 02.19 | Kultura 100 → +1 pierścień (l.156) | NAPRAWIONY | Patrz 00.6 |
| 02.20 | Łódź rybacka tylko na wybrzeżu w terytorium (§13.2) | NIEROZSTRZYGNIĘTY | Powód (runda 2): wpis `lodzie_rybackie` istnieje (`terrain-improvements.json` l.234); pola warunku nie porównano z „wybrzeże w terytorium" |

## 04 — Jednostki na mapie

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 04.1 | Katalog: 50 jednostek v1.0 (l.4) | NADAL ISTNIEJE | `units.json`: 75 wierszy z kluczem `Jednostka` (cz. X mówi 73 — oba rozjechane z danymi) |
| 04.2 | Widok domyślnie 3, zwiadowca min. 5 (§22.1) | NADAL ISTNIEJE | Patrz 02.1 |
| 04.3 | Włócznik: ruch 2 (§22.2) | NAPRAWIONY | `units.json` Włócznik `Ruch = 2` |
| 04.4 | Włócznik: M=8 | NIEROZSTRZYGNIĘTY | Powód: dane nie mają pola „M"; `Obrona = 8`, `fieldPower = 44` — definicja M nie potwierdzona w poradniku ani w danych |
| 04.5 | Włócznik: koszt 20 Pracy + 1 🍞 utrzymanie (§22.2) | NADAL ISTNIEJE | `units.json` Włócznik: `Pieniądz (koszt) = 8`, `Surowiec (ilość) = 25 Brąz`, `Utrzymanie (Pieniądz/turę) = 2`, `żywność/turę = 1` |
| 04.6 | Armia 4 włóczników: koszt 4 🍞/t (§22.2) | NAPRAWIONY | `żywność/turę = 1` × 4 |
| 04.7 | Las, wzgórze: drożej niż łąka; rzeka: kara atakującego (§23.1–23.2) | NAPRAWIONY | `terrain-combat.json`: Las koszt 2, Wzgórza 2, Rzeka = STOP; `combat-params.json` `river_attack_mult = 0.75` |
| 04.8 | Posiłki w promieniu 1 heksa (§26.1) | NIEROZSTRZYGNIĘTY | Powód (runda 2): przeszukano `gra/data/*.json` (brak parametru promienia posiłków) i `gra/src/game/ai.ts` (posiłki AI „D-START", bez promienia 1 w wyniku przeglądu); reguła gracza nie zlokalizowana |
| 04.9a | Łączenie armii: okno „połączyć? Tak / Nie” dla sąsiednich jednostek (§24.1) | NADAL ISTNIEJE | Runda 2: panel `gra/src/ui/armyMergePanel.ts` l.199–200 — przyciski „Połącz armie” / „Zostaw osobno”, nie Tak/Nie. Wyzwalacz w `main.ts` ~l.12385 (`coLocatedForMergePrompt`, ten sam heks). Sąsiednie heksy (`main.ts` ~l.12390, ~12460) użyte w logice ruchu; pełnego wyzwalacza nie prześledzono |
| 04.9b | Rozdzielanie armii: menu lub przycisk (§24.1) | NAPRAWIONY | Runda 2: `armyMergePanel.ts` l.199 „Zostaw osobno” (split) — przycisk istnieje; cele rozdzielenia: `armyMerge.ts` `findSplitDestHexes` |
| 04.9c-a | Garnizon: wojsko stojące na polu miasta (heks miasta) wchodzi do obrony przy ataku (§25.1) | NAPRAWIONY | Runda 3 (defekt #6): obrońcy bitwy = `collectCityDefRoster` (`gra/src/game/siegeDefenders.ts` l.119–124) → `defenderUnitsNearCity` (l.42–47) → `collectDefRosterNearCity` (`gra/src/units/battleRoster.ts` l.126–151). Filtr `hexDistance(...) > 1` (l.151) przepuszcza dystans 0, czyli heks miasta. Użycie: `gra/src/battle/mapFieldBattle.ts` l.325 |
| 04.9c-b | Zakres obrony ograniczony do heksu miasta (implikacja nawiasu „tym samym heksie co centrum”, §25.1) | NIEROZSTRZYGNIĘTY (wykładnia zakresu) | Runda 3 (zarzut 1 Evaluatora przyjęty): poradnik `docs/PORADNIK-GRACZA/04-jednostki-mapa.md` l.137 (pin edb8fb56) pisze tylko „Wojsko stojące na polu miasta (tym samym heksie co centrum) wchodzi do obrony” — bez „tylko” i bez wykluczenia sąsiednich heksów. Przeszukanie `docs/PORADNIK-GRACZA` na pinie (`git grep -n -i -E 'obron|garnizon'`, filtr miast/heks/sąsied/pol) nie daje zdania zawężającego obronę miasta do heksu centrum; l.6 wspomina „posiłki z sąsiednich heksów” (inny mechanizm). Kod bierze dystans ≤1 (`battleRoster.ts` l.151 `> 1` → continue). Czy nawias zawęża zakres do dystansu 0, jest wykładnią, której tekst poradnika nie rozstrzyga; brak cytatu zawężającego, więc nie jest to dowiedziony rozjazd treści z pinem. Ta sama reguła dystansu ≤1 jest w `main.ts` l.15084–15090 (`buildSiegeCityFromRuntime` → pole `garrison`), które zasila decyzję stanowiska AI oblężenia (`decideAISiegeStance`), a nie walkę gracza |
| 04.9c-c | Licznik garnizonu w panelu miasta (§25.1: „może być widoczny”) | NAPRAWIONY (istnienie licznika); zakres licznika węższy niż obrona | Runda 3: chip „Garnizon: N jedn.” w `gra/src/ui/cityPanel.ts` l.3313 (`gCount` l.3135 = `cfg.getUnitsAt(city.q, city.r)`). Hook `gra/src/main.ts` l.7744–7747 → `unitsOnCityHexForLaw` (`gra/src/game/armyMerge.ts` l.1003–1015): własne jednostki na heksie miasta, bez `oblegaCityId`. Licznik NIE obejmuje obrońców z dystansem 1 z 04.9c-b. Poradnik nie podaje liczby ani zakresu licznika |

## 05 — Budowa na mapie

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 05.1 | Pełna lista 17 ulepszeń v1.0 (§4, §28) | NADAL ISTNIEJE | `terrain-improvements.json`: 22 wpisy (bez `_meta`/`_miasto_zasieg_ref`) |
| 05.2 | Koszt Załóż miasto: 20 Pracy, −1 ludność, min. 4 heksy (§27.3) | NAPRAWIONY | Patrz 01.13 |
| 05.3 | Farma: 20 Pracy, bonus +2 🍞 + pole 3 🍞 = 5 🍞/t (§28, §29.2, §30.2, §31.2) | NADAL ISTNIEJE | `terrain-improvements.json` `farma`: `koszt_praca 20` (zgodne), `bonus.zywnosc = 3` (nie +2) |
| 05.4 | Droga: 15 Pracy → +1 Daniny (§28) | NADAL ISTNIEJE | `droga`: `koszt_praca 15` (zgodne); `bonus.handel = 2` (Handel +2/t, nie Danina +1); ruch 3× szybszy |
| 05.5 | Posterunek +5 heksów, +50% obrony (§28, §31.2) | NAPRAWIONY | `posterunek`: `zasieg_terytorium 5`, `bonus_obrona_proc 50` |
| 05.6 | Fort +10 heksów, +100% obrony (§31.2) | NAPRAWIONY | `fort`: `zasieg_terytorium 10`, `bonus_obrona_proc 100` |
| 05.7 | Posterunek rozszerza terytorium o ~5, Fort ~10 (§28) | NAPRAWIONY | Patrz 05.5, 05.6 |
| 05.8 | Tartak: +3 drewno/pole × 2 pola = +6 drewna/t (źródło: ch08 §53.6, blok przykładu l.383) | NADAL ISTNIEJE | Zmiana statusu (runda 2, zarzut 2). `gra/data/terrain-improvements.json` `tartak`: `bonus: {praca: 3, handel: 3}` — bonus pracy, nie „+3 drewno/pole"; surowiec drewno, stawka po skali ×5 = **50/turę** (uwaga `surowiecOdblokowany_uwaga`: „R-EKONOMIA-SUROWCE-SKALA-5X (2026-08-13): ×5 → 50/turę (było 10/turę)"). Poradnik +6 drewna/t ≠ 50/t. Zdanie „+3 drewno/pole" nie występuje w ch05 (grep `53.6` w ch05: 0 trafień) |
| 05.9a | Farma: łąka/równina, bez złoża (§30.1) | NADAL ISTNIEJE | Runda 2 (obrona, zarzut 4): `farma` w `terrain-improvements.json` nie ma warunku „bez złoża” (`warunek`: „ziemia uprawna; rzeka NIE jest wymagana; NIE na lesie”). Reguła budowy `gra/src/map/improvement-build.ts` l.1004–1007: `farma` = `isFarmBaseTerrain && !hasBlockingDepositForFarm(hex) && inPlayerTerritory`; `hasBlockingDepositForFarm` (l.743–747) zwraca zawsze `false` („WOLNE WSPÓŁISTNIENIE”, Maciej 2026-07-09). Farma stoi więc na heksie ze złożem. `improvementHidesDepositOnHex` (`terrain-improvements.ts` l.333–) nie ma gałęzi dla farmy; `city-hex-clear.ts` dotyczy zakładania miasta, nie budowy farmy. Poradnik §30.1 rozjeżdża się z kodem |
| 05.9b | Irygacja: łąka/równina/pustynia + sąsiad z rzeką (§30.1) | NAPRAWIONY | Runda 2: `irygacja.teren` = „Łąka, Równina, Pustynia”; `warunek` = „TYLKO pole sąsiadujące z rzeką (1 pole) lub na rzece” |
| 05.9c | Tartak: las, po wyrębie zostaje puste pole (§30.1) | NADAL ISTNIEJE | Runda 2: `tartak` (`terrain-improvements.json`): `teren` = „Ląd w terytorium (łąka, lasy, wzgórza…)”, `warunek` = „MOŻE na lesie — las NIE znika”. Dane: tartak nie wymaga lasu i las zostaje; poradnik: wymaga lasu, a wyrąb zamienia go w pole |
| 05.9d | Kopalnia: wzgórze/góra; przy złożu rudy (§30.1) | NAPRAWIONY | Runda 2 (obrona, zarzut 5): koniunkcja potwierdzona w kodzie: `gra/src/map/improvement-build.ts` l.1129–1132, `kopalnia_miedzi`: `terrainOk = inPlayerTerritory && (Wzgorza || Gory) && (zloze==='miedz' || nakladka===ZlozeRudy || zloze==='ruda')`. Zbiór terenów kopalń l.692–697 (Wzgórza, Góry); złoże per typ `depositAllowsPlayerImprovement` l.782–787. Zgodne z poradnikiem „wzgórze/góra; przy złożu rudy” |
| 05.9e | Glinianka: złoże gliny + Garncarstwo (§30.1) | NAPRAWIONY | Runda 2: `glinianka.teren` = „złoże Gliny”, `tech` = „Garncarstwo” (`terrain-improvements.json`) |

## 08 — Ekonomia imperium

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 08.1 | Korupcja — współczynnik dystansu: Łatwy 0,5 / Normalny 1 / Trudny 1,5 (§49.3a) | NAPRAWIONY | `econ-params.json` `korupcja_wspolczynnik_dystansu` 0.5 / 1 / 1.5 |
| 08.2 | Korupcja — współczynnik miast: 0,5 / 0,5 / 1 (§49.3a) | NAPRAWIONY | `korupcja_wspolczynnik_miast` 0.5 / 0.5 / 1 |
| 08.3 | Korupcja — sufit: 38% / 50% / 62% (§49.3a) | NAPRAWIONY | `korupcja_cap` 38 / 50 / 62 |
| 08.4 | Sąd, Pretorium, Pałac: po 30 pp, max 60 pp (§49.3a) | NAPRAWIONY | `economy.ts` `KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.30`, `..._SUFIT = 0.60`; lokalizacje Pałac=stolica, Pretorium=region |
| 08.5 | Mennica ×2 / ×1,5 / ×1 (Łatwy/Normalny/Trudny) (§49.3b) | NAPRAWIONY | `econ-params.json` `globalne.mennica_mnoznik_po_walucie` 2 / 1.5 / 1 |
| 08.6 | Spichlerz: 50% bufora po wzroście; pojemność państwa 100 🍞 (§50.1, §50.4) | NAPRAWIONY | `spichlerz_zachowanie_po_wzroscie` normal 0.5; `spichlerz_pojemnosc_zapasow_panstwa` normal 100 |
| 08.7 | Głód wojska: −8% max HP na turę (§50.3) | NAPRAWIONY (z notką) | Zmiana statusu (runda 2, zarzut 5). `econ-params.json` `ekonomia_miasta/glod_wojska_hp_frac` normal **0,08** (= −8% maxHP/tura). Notka: poradnik l.143 pomija **karencję 3 tur** (`glod_wojska_karencja_tur` = 3) i mnożnik parametrów bojowych ×0,75 (`glod_wojska_stat_mult`); wartość zgodna, treść niepełna |
| 08.8 | Tempo: Szybka ×1, Standard ×2, Długa ×4; ×2 korekta globalna; mnożnik trudności (§51.2) | NADAL ISTNIEJE | Tempo i ×2 zgodne (`tech-tempo.ts`, `r-stawki-strojenie.ts`). Niepełne: pomija **FALA2 ×2 dla Brązu i Żelaza** (`difficulty-cost.ts` l.96–98) |
| 08.9 | Magazyn surowców państwa: baza 500 szt/typ + 100 za Magazyn (§53.2, l.314) | NADAL ISTNIEJE | Uzupełnienie (runda 2, zarzut 4): `econ-params.json` `globalne.magazyn_baza_surowce = 50000` (szt/typ, PAŃSTWO, epoka 1) i `magazyn_bonus_surowce_na_budynek = 500` za KAŻDY Magazyn w imperium (poradnik: +100 na typ surowca). Rozjazd dwukrotny: baza 500 vs 50000 oraz +100 vs +500. Osobno: `magazyn_centralny_bonus_zywnosc_na_budynek = 100` dotyczy żywności, nie surowców |
| 08.10 | Koszty materiałowe 9 budynków: ceramika/cegła, np. Mury 15 cegły, Akademia 14 cegły (§53.2) | NADAL ISTNIEJE | `buildings.json` `koszt_surowce`: Mury `drewno 40, kamien 80`; Akademia `drewno 40, cegla 70` (odczyt bezpośredni, runda 2); Świątynia `drewno 30, kamien 40`. Mnożnik ×5 (R-EKONOMIA-SUROWCE-SKALA-5X) **nie został potwierdzony dla budynków** — w `buildings.json` nie ma wpisu SKALA-5X (0 trafień), więc wartość 70 podano jako wartość z pliku bez przypisywania jej mnożnikowi. Rozjazd z poradnikiem (14 cegły) pozostaje |
| 08.11 | Szlaki: dystans ≤12 ląd / ≤20 morze (§53.3) | NAPRAWIONY | `econ-params.json` `handel_szlaki.lad_max_dystans 12`, `morze_max_dystans 20` |
| 08.12 | Szlaki: dochód = baza 8 ¤ + 0,4 ¤/heks, podłoga 1 ¤ (§53.3) | NADAL ISTNIEJE | `handel_szlaki` używa tablic `dochody_ladowe` (13 wartości) i `dochody_morskie` (21); brak parametrów 8 / 0,4 / 1 |
| 08.13 | Szlaki: +5% Daniny za każdą trasę (§53.3, l.343) | NIEROZSTRZYGNIĘTY | Powód (runda 2, zarzut 6): znaleziono `gra/src/game/trade-routes.ts:1646` `TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05` (bonus 5% jednej konkretnej trasy z budynkiem) i `trade-routes.ts:1732` („zwykły mnożnik Handlu +5%/trasa"). Kod mówi o mnożniku Handlu, poradnik o Danina netto; rozstrzygnięcie wymaga lektury `trade-routes.ts` ok. l.1640–1760 i `turn-economy.ts:1887` |
| 08.14 | Cennik koszyka: drewno 2, glina 2, kamień 3, ruda 4, cegła 5, ceramika 6 PN/szt (§53.5) | NIEROZSTRZYGNIĘTY | Powód: `econ-params.json` `cena_*` mają kroki po 10 szt. i wartości per `easy/normal/hard`; `cena_drewno.normal = 1`; jednostka (PN/szt vs PN/pakiet 10) do potwierdzenia |
| 08.15 | Dominacja: >50% siły w epoce Żelaza (§52.5) | NAPRAWIONY | Patrz 00.1 |

## 09 — Nauka i epoki

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 09.1 | Wzór kosztu: bazowy × tempo × 2 (korekta) × trudność (§54.6, l.53) | NADAL ISTNIEJE | Wzór pomija **FALA2 ×2 dla Brązu i Żelaza** (`difficulty-cost.ts` l.96–98) |
| 09.2 | Tabela tempa: Szybka ×1 · Standardowa ×2 · Długa ×4 (§54.6, l.58) | NAPRAWIONY | `tech-tempo.ts`, `e-start-params.json` `tempo_gry` |
| 09.3 | Przykład: tech bazowy 12, Standardowa, Trudny (gracz): 12 × 2 × 2 × 2 = 96 PN (§54.6, l.62, treść główna) | NAPRAWIONY (z doprecyzowaniem) | Poprawka uzasadnienia (runda 2, zarzut 13): usunięto twierdzenie „przykład dotyczy innej epoki" — przykład **nie podaje epoki**. Wynik 96 zgadza się z kodem dla epoki **Kamień**, bo FALA2 ×2 (`difficulty-cost.ts` l.96–98) dotyczy wyłącznie Brązu i Żelaza. Dla Brązu/Żelaza kod dałby 192 — przykład należy uzupełnić o epokę |
| 09.4 | Trudny: gracz ×2, AI ×1; Łatwy: gracz ×1, AI ×2 (§54.6, l.60) | NAPRAWIONY | `difficulty-cost.ts` `getCostMultiplierForOwner` (l.70–71) |
| 09.5 | Start w Kamieniu/Brązie/Żelazie: kaskada tech (§55.4) | NAPRAWIONY | `e-start-params.json` `e1_tech_kaskada_epok = true` (mechanizm nie weryfikowany szczegółowo — patrz 01.16) |
| 09.6 | Łucznictwo wymaga Łowiectwa (§56.2) | NAPRAWIONY | `tech.json`: Łucznictwo `Wymaga (prereq) = Łowiectwo` |
| 09.7 | Brązownictwo kończy Kamień; Hutnictwo żelaza kończy Brąz (§55.3) | NAPRAWIONY | Zmiana statusu (runda 2, zarzut 7). `tech.json`: Brązownictwo `Epoka = Kamień`, `Poziom 3`, Uwagi „kończy Epokę 1"; Hutnictwo żelaza `Epoka = Brąz`, `Poziom 6`, Uwagi „kończy Epokę 2 / otwiera Epokę 3". Zgodne z treścią poradnika |
| 09.8 | Epoki v1.0: Kamień, Brąz, Żelazo, „Średniowiecze+" (§55.1) | NIEROZSTRZYGNIĘTY | Powód: `ostatnia_epoka_v1 = 3` (Żelazo) zgodne; „Średniowiecze+" jest poza v1 — status epoki poza zakresem danych v1 nie rozstrzygnięty |
| 09.9 | Mapa standard 84×60 / wzrok 2 → 19 / pierścień 100 (l.170, blok przykładu) | NADAL ISTNIEJE / NAPRAWIONY | Patrz 00.4, 00.5 (NADAL ISTNIEJE), 00.6 (NAPRAWIONY) |

## 10 — Walka

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 10.1 | Liczba jednostek: 73 (§61.1) | NADAL ISTNIEJE | `units.json`: 75 wierszy |
| 10.2 | Pięć ról: Wręcz, Dystans, Kawaleria/flanka, Oblężnicza, Wsparcie (§61.1) | NADAL ISTNIEJE | Zmiana statusu (runda 2, zarzut 3). `units.json` `Rola (linia)`: 6 wartości — Wręcz 45, Flanka 13, Dystans 11, Oblężnicza 4, Wsparcie 1, **Morska 1**. Poradnik nie wymienia „Morska" w liście ról (pięć ról) |
| 10.3 | Counter ×1,5 (§61.2) | NAPRAWIONY | `combat-params.json` `counter_multiplier = 1.5` |
| 10.4 | Włócznia vs konnica +50%; „12 jednostek uzbrojonych we włócznię" (§61.2) | NADAL ISTNIEJE (liczba) / NAPRAWIONY (+50%) | `Bonus vs Mount % = 50` ma **15** jednostek, nie 12 |
| 10.5 | Wzgórze: obrona ×1,5 (§63.2) | NAPRAWIONY | `terrain-combat.json` Wzgórza `+50%` |
| 10.6 | Góra: obrona ×1,75; ruch 2; konnica niedostępna (§63.2) | NAPRAWIONY (obrona, ruch) / NIEROZSTRZYGNIĘTY (konnica) | `terrain-combat.json` Góry `+75%`, koszt 2. Konnica na Górach: nie przeszukano reguły dostępności |
| 10.7 | Bród: ruch ×0,5, kara ataku −25%, obrona brzegu +15% (§63.1) | NAPRAWIONY | `combat-params.json` `brod`: `ruchMult 0.5`, `karaAtak 0.25`, `bonusObronaBrzegu 0.15` |
| 10.8 | Rzeka poza brodem: kara ataku ok. ×0,75 (§63.1) | NAPRAWIONY | `river_attack_mult = 0.75` |
| 10.9 | Weterani: Doświadczony po 1 bitwie +10%; Weteran po 2+ bitwach +20% (sufit) (§65.2a) | NADAL ISTNIEJE | `veteran.ts` l.16: ★ +10% · ★★ +15% · ★★★ +20%. Rozjazd: 2 wygrane = ★★ (+15%), poziom 3 (+20%) dopiero od 3 wygranych |
| 10.10 | Po 2. bitwie: atak 12, zdrowie 60, próg dezercji 24% (§65.2a) | NADAL ISTNIEJE | Wynika z 10.9 (2 wygrane = +15%, nie +20%) |
| 10.11 | Pancerz wyłączony z premii weterana; premie nie kumulują się (§65.2a) | NAPRAWIONY (pancerz) / NIEROZSTRZYGNIĘTY (kumulacja) | Poprawka (runda 2, zarzut 6): `veteran.ts` l.16 („pancerz bez zmian") i l.39 („BEZ ZMIAN NA ŻADNYM POZIOMIE — armor / Pancerz") — wyłączenie pancerza zgodne. Kumulacja: nie odczytano pełnej logiki `VETERAN_BONUS_FRAC` w `veteran.ts` |
| 10.12 | Piechota 10 vs włócznik 8, bonus terenu +15% → 11,5 (§57.5, §59.4, §60.4; blok przykładu l.173) | NIEROZSTRZYGNIĘTY | Powód: `terrain-combat.json` nie ma +15% (Las/Wzgórza +50%, Góry +75%); przykład liczbowy to ilustracja — rozstrzygnięcie: korekta lub oznaczenie jako ilustracja (decyzja autora poradnika) |
| 10.13 | Auto-walka: straty ~30% słabszej strony przy ×1,4 mocy (§57.5, §59.4; blok przykładu l.174) | NIEROZSTRZYGNIĘTY | Powód (runda 2): wzór „coef v2b" nie zlokalizowany w `gra/src/game` w tej rundzie; wymaga przeszukania `auto-battle-params.ts` |
| 10.14 | Preboard: cztery opcje (Auto, Ręczna, Wycofaj, Zapisz) (§57.1) | NADAL ISTNIEJE | Runda 2: `gra/src/ui/preBattle.ts` l.826–833: Auto — tak (l.830). Przycisk walki ręcznej ma etykietę „BITWA” (l.831), nie „Ręczna”. „Wycofaj” tylko gdy `showRetreat` lub wyszarzony (l.826–828). „Zapisz” tylko gdy `hasSave` (l.832) |

---

## Podsumowanie

- Pozycje pierwotne: 99. Wiersze z podpunktami rozbite na a/b/c (02.12, 02.13, 02.14, 04.9, 05.9) — łącznie 113 wierszy tabel z numerem (liczba po korekcie runda 3, zarzut 3 Evaluatora: 111 wierszy a–c + 05.9d, 05.9e).
- **Runda 2 (defekt #6): rozstrzygnięte wiersze z listy Evaluatora.** 01.17 → NADAL ISTNIEJE (dowód: mechanizm `epochHasCivs`). 02.12 → 3× NADAL ISTNIEJE. 02.13 → a NAPRAWIONY (efektywne `buildings.json`), b NAPRAWIONY (efektywne `buildings.json`), c NADAL ISTNIEJE. 02.14 → a, b NAPRAWIONY, c NADAL ISTNIEJE. 02.15 → NAPRAWIONY (z uwagą o danych). 04.9 → a NADAL ISTNIEJE, b NAPRAWIONY, c NIEROZSTRZYGNIĘTY (próba niepełna, powód podany; rozstrzygnięte w rundzie 3, patrz niżej). 05.9 → a NADAL ISTNIEJE (zarzut 4), b NAPRAWIONY, c NADAL ISTNIEJE, d NAPRAWIONY (zarzut 5: AND w kodzie), e NAPRAWIONY. 10.14 → NADAL ISTNIEJE.
- **Runda 3 (defekt #6): 04.9c rozstrzygnięty w 2 z 3 części** (a NAPRAWIONY, c NAPRAWIONY; b NIEROZSTRZYGNIĘTY, wykładnia zakresu). Wcześniejsze stwierdzenie „0 trafień garnizonu w game/combat.ts i game/battle*.ts” było błędem przeszukania: szukano tylko w `game/`. Na pinie `garnizon|garrison|inGarnizon` trafia w 60 plikach `gra/src` (`git grep -l` na edb8fb56: 60 zarówno z rozróżnianiem wielkości liter, jak i bez; poprawka zarzutu 2 Evaluatora) (m.in. `main.ts`, `cityPanel.ts`, `siegeDefenders.ts`, `battle/battleScene.ts` l.7520 = licznik żywych jednostek HUD oblężenia). `inGarnizon` nie jest ograniczone do `ai.ts`/`army-*`/`armyMerge.ts`/`post-battle-map.ts`. Wynik: 04.9c-a NAPRAWIONY, 04.9c-b NIEROZSTRZYGNIĘTY (wykładnia zakresu), 04.9c-c NAPRAWIONY (istnienie licznika).
- **NADAL ISTNIEJE** (rozjazd potwierdzony), runda 2 dodatkowo: 01.17, 02.12a–c, 02.13c, 02.14c, 04.9a, 05.9a, 05.9c, 10.14. Wcześniejsze: 00.2, 00.3/01.10, 00.4/01.5/01.6/09.9, 00.5/02.1/04.2, 01.7, 01.14, 02.4, 02.5, 02.7, 02.11, 02.16, 04.1, 04.5, 05.1, 05.3, 05.4, 05.8, 08.8, 08.9, 08.10, 08.12, 09.1, 10.1, 10.2, 10.4, 10.9, 10.10.
- **NIEROZSTRZYGNIĘTY** (pozostałe, z powodem w wierszu): 01.15, 01.16, 02.6, 02.8, 02.17, 02.20, 04.4, 04.8, 04.9c-b (wykładnia zakresu, runda 3), 08.13, 08.14, 09.8, 10.6 (konnica), 10.11 (kumulacja), 10.12, 10.13.
- **Najważniejsze do decyzji właściciela:**
  1. Kanoniczny wymiar Standardowego: 84×60 (ui-params opis, poradnik) vs 168×120 (`e-start-params.json` `skala_mapy`, `map-gen-params.json`, generator).
  2. Tempo: poradnik cz. 00/01 (×0,2/×1/×5) vs kod i cz. 08/09 (×1/×2/×4).
  3. Weterani: próg poziomu 3 — 2 czy 3 wygrane.
  4. Magazyn surowców: poradnik (500 baza, +100 za Magazyn) vs dane (50000 baza, +500 za Magazyn) per typ surowca.
  5. Koszty materiałowe budynków: cegła/ceramika (poradnik) vs drewno/kamień/cegła z `buildings.json` (rozbieżne także wewnętrznie — Mury bez cegły).
  6. Obca religia / obca kultura (02.12b–c): poradnik −2/−1, dane normal −4/−2; mechanizm po G4/G5 jest proporcjonalny — decyzja, czy poradnik ma opisywać parametr, czy mechanikę.
  7. Panel preboard: nazwa przycisku „BITWA” (kod) vs „Bitwa ręczna” (poradnik).
- **Błąd wewnętrzny poradnika:** §8.1 (cz. II) podaje wzrok 3, §155 tej samej części podaje wzrok 2 → 19 heksów.
- **Wpisy danych do wyjaśnienia (nie treść poradnika):** `civs.json` `start_gry` ma „gracz zawsze startuje z 1 osadnikiem” i „9 typów × 10 miast”, sprzecznie z mechaniką bez osadnika i pulą 15 typów; `resources.json` Kamień „Wzgórza/Góry + Kopalnia” bez kopalni kamienia w `terrain-improvements.json` (02.15).
- **Uwaga do przykładu 09.3:** przykład nie podaje epoki; poprawny tylko dla Kamienia (dla Brązu/Żelaza kod daje ×2 więcej przez FALA2).

Rekomendacja dla autora poradnika: najpierw korekta bloku szablonowego (tempo, rozmiary, liczba typów) w jednym miejscu, potem sekcje 05, 08 i 10.
