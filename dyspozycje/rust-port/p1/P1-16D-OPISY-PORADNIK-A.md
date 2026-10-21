# P1.16D — OPISY-PORADNIK-A: rozjazd treści Poradnika vs kod/dane

**Temat:** R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1
**Pin web:** `edb8fb56` (czytane przez `git show edb8fb56:<ścieżka>`; working tree repo jest na innym commicie i nie był źródłem)
**Zakres:** `docs/PORADNIK-GRACZA/` rozdziały 00, 01, 02, 04, 05, 08, 09, 10 — treść główna.
**Pominięte (zgodnie z dispatchem):** bloki „Przykład liczbowy / Strategia gracza / Typowe błędy" oraz powtarzalne linie „Po 5 turach akumulacja…", „Miasto pop 8…", „Farma 20 pracy…". Uwaga: linie „Kreator: Standard… 6 rywali" i „Tempo Szybka ×0,2 — tech 50 kosztuje 10" są kopiowane do każdej sekcji jako blok szablonowy; wpis z tempem zgłaszam poniżej, bo jest sprzeczny z kodem.

**Legenda statusów (per twierdzenie):**
- **NADAL ISTNIEJE** — rozjazd potwierdzony (treść ≠ pin).
- **NAPRAWIONY** — treść zgadza się z pinem (wskazano źródło).
- **NIEROZSTRZYGNIĘTY** — nie dało się jednoznacznie zweryfikować (powód podany).

Źródła kodu/danych: `gra/data/*.json`, `gra/src/**/*.ts` na `edb8fb56`.

---

## 00 — Jak czytać

| # | Twierdzenie (linia) | Status | Dowód na pinie |
|---|---|---|---|
| 00.1 | Cel: dominacja >50% siły w epoce Żelaza (l.21) | NAPRAWIONY | `e-start-params.json` `zwyciestwo`: `prog_dominacji_power 0.5`, `ostatnia_epoka_v1 3` |
| 00.2 | Tempo Szybka ×0,2 — tech 50 kosztuje efektywnie 10 (l.29; powtórzone w bloku szablonowym) | NADAL ISTNIEJE | `tech-tempo.ts`: szybka ×1.0, standardowa ×2.0, długa ×4.0; `R_STAWKI_KOSZT_MULT=2` (globalnie) → 50 daje 100 PN przed trudnością |
| 00.3 | 9 typów cywilizacji (l.79) | NADAL ISTNIEJE | `civs.json`: pula 15 typów (D-ROSTER-Q3); liczba typów na mapie zależy od rozmiaru: `typy_cywilizacji` 4–14 (`e-start-params.json`). Poradnik wymienia 9 pierwszych z listy 15 |
| 00.4 | Mapa Standard 84×60 = 5040 heksów (l.225) | NADAL ISTNIEJE | `map-gen-params.json` `rozmiar_dims.standardowy = [168,120]` (generator `ROZMIAR_DIMS`). Uwaga: `ui-params.json` opis „~5000 hex (84×60)" jest zgodny z poradnikiem — sprzeczność wewnątrz danych, wymaga decyzji właściciela, który wymiar jest kanoniczny |
| 00.5 | Zasięg wzroku 2 → 19 heksów (l.225) | NADAL ISTNIEJE | Poradnik w §8.1 (cz. II) mówi „domyślnie 3"; `units.json` `Widok pola`: 1–5, większość 1–2; fallback `mgla.default_sight_jednostki=3`. Arytmetyka 19 = promień 2 — poprawna, ale nie odpowiada danym |
| 00.6 | Kultura próg 100 → +1 pierścień (~6 heksów) (l.226) | NAPRAWIONY | `society-params.json` `kultura_prog_zasieg_1` normal=100; pierścień 1 = 6 heksów |

## 01 — Pierwsze kroki

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 01.1 | Domyślna cywilizacja Rzymianie (§2.3, §2.6) | NAPRAWIONY | `e-start-params.json` `defaulty.player_civ_id = rzymianie` |
| 01.2 | Epoka startowa domyślnie Kamień (§2.2, §2.6) | NAPRAWIONY | `defaulty.start_epoch_id = kamien` |
| 01.3 | Typ świata: Kontynenty, Pangea, Wyspy, Ziemia; domyślnie Kontynenty (§2.4) | NAPRAWIONY | `ui-params.json` `world_type`, `domyslny: 0` |
| 01.4 | Rozmiar domyślnie Standardowy (§2.4) | NAPRAWIONY | `ui-params.json` `map_size`, `domyslny: 2` = Standardowy |
| 01.5 | Rozmiary: Malenki · Mały · Standardowy · Duży · Ogromny (§2.4) | NADAL ISTNIEJE | `ui-params.json` i `generator.ts` `ROZMIAR_MENU_LABELS` mają 6 pozycji — brakuje **Super Huge** |
| 01.6 | Standardowy = 84×60 heksów (§2.4) | NADAL ISTNIEJE | Patrz 00.4 |
| 01.7 | Tempo: Szybka ×0,2 · Standard ×1 · Długa ×5 (§2.4, §6.3) | NADAL ISTNIEJE | Kod: szybka ×1, standardowa ×2, długa ×4 (`e-start-params.json` `tempo_gry`, `tech-tempo.ts`). Zgodny z tym jest dopiero §51.2 cz. VIII |
| 01.8 | Rywale AI ok. 6 na Standardowym (§2.4) | NAPRAWIONY | `e-start-params.json` `skala_mapy.Standardowy.rywale_ai = 6` |
| 01.9 | Tempo domyślnie Standard (§2.6) | NAPRAWIONY | `main.ts` ~L36903 `speed: 'Standardowa'` |
| 01.10 | Dziewięć aktywnych typów cywilizacji (§2.3) | NADAL ISTNIEJE | Patrz 00.3 |
| 01.11 | Próg wzrostu ludności wyższy na Trudnym (§5.2) | NAPRAWIONY | `econ-params.json` `próg_wzrostu_wspolczynnik`: easy 12, normal 16, hard 20 |
| 01.12 | Osada: bonus dla miasta 1–4 mieszkańców, słabnie z trudnością (§3.3) | NAPRAWIONY | `society-params.json` `zdrowie_bonus_osiedle_pop` (indeks pop1…pop4, malejący) |
| 01.13 | Koszt nowego miasta 20 Pracy + 1 ludność; min. 4 heksy (§3.1) | NAPRAWIONY | `miasto-params.json`: `zaloz_miasto_koszt_praca=20`, `zaloz_miasto_koszt_ludnosci=1`, `min_dystans_miast=4` |
| 01.14 | Okolica miasta: promień 3 heksów (§3.2) | NADAL ISTNIEJE | `miasto-params.json` `zasieg_okolicy_baza = 5` („start miasta = 5 heksów"), `zasieg_okolicy_max = 15` |
| 01.15 | „W tej grze nie ma jednostki osadnika" (§3.1) | NIEROZSTRZYGNIĘTY | Mechanika zgodna (`city-founding.ts`: „bez osadnika", `foundCityAt`). Ale `e-start-params`/`start_gry` w `civs.json` pisze „gracz zawsze startuje z 1 osadnikiem" — wpis danych do wyjaśnienia |
| 01.16 | Brąz jako start: wszystkie tech Kamienia zbadane (§6.1) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano mechanizmu kaskady w kodzie |
| 01.17 | Żelazo „Wkrótce" (wyszarzona) w kreatorze (§2.2) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano flagi UI |

## 02 — Mapa świata

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 02.1 | Zasięg wzroku: większość jednostek 3 heksy; zwiadowca min. 5 (§8.1) | NADAL ISTNIEJE | `units.json` `Widok pola`: 2 → 31 jednostek, 1 → 24, 3 → 8, 4 → 10, 5 → 2. Zwiadowca = 5 (zgodnie) |
| 02.2 | Seed mapy losowy przy każdym Start (§7.2) | NAPRAWIONY | `e-start-params.json` `kreator_zaawansowane.seed_mode_default = random` |
| 02.3 | Gęstość Mało/Średnio/Dużo (§7.3) | NAPRAWIONY | `generator_e2` resource_mult low 0.6 / normal 1.0 / high 1.4 |
| 02.4 | Relacja startowa +15 (neutralna) (§7.4) | NADAL ISTNIEJE | `diplomacy.json` `parametry_relacji`: Relacja = Zaufanie + Respekt, start 50 (Zaufanie 20 + Respekt 30) |
| 02.5 | Próg odblokowania handlu: relacja +20 (§7.4) | NADAL ISTNIEJE | `diplomacy.json` `wartosc_katalog.handel_prog_relacja = 40` |
| 02.6 | Prezent +8 PN → +23 (§7.4) | NIEROZSTRZYGNIĘTY | Nie znaleziono wartości akcji „Prezent" w danych |
| 02.7 | Wspólna religia +10 relacji (§7.4) | NADAL ISTNIEJE | `diplomacy.json` `wspolnaReligia_zaufanie_perTura = 0.5` (zaufanie co turę, nie +10 relacji jednorazowo) |
| 02.8 | Rzymianie −5% kary korupcji (§8.4) | NIEROZSTRZYGNIĘTY | Nie znaleziono bonusu korupcji dla Rzymian w `civs.json` |
| 02.9 | Zasięg terytorium: Miasto ~10, Posterunek ~5, Fort ~10 (§9.1) | NAPRAWIONY | `terrain-improvements.json`: posterunek `zasieg_terytorium=5`, fort `10`; `_miasto_zasieg_ref`: miasto bazowo 10 |
| 02.10 | Koszt/odległość/źródło ludności przy zakładaniu miasta (§9.2) | NAPRAWIONY | Patrz 01.13 |
| 02.11 | Trudny: AI +15% produkcji (§9.3) | NIEROZSTRZYGNIĘTY | Mnożnika 1,15 nie znaleziono. Kod: Trudny = gracz koszt ×2, AI ×1; progi wzrostu AI ×0,5 (`difficulty-cost.ts`) |
| 02.12 | Podbite miasto: 30% kultury własnej; obca religia −2 szczęścia; obca kultura −1 (§10.3) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano stałych (`society-params` zawiera tylko opisy konwersji) |
| 02.13 | Świątynia +2 kultury/t; +2 szczęścia przy >50% wyznawców (§10.3) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano |
| 02.14 | Miedź widoczna od Brązu, żelazo od Żelaza, tylko na Górach (§11.2) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano w `resources.json` |
| 02.15 | Kamień bez złoża (kamieniołom na wzgórzu/górze) (§11.2) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano wymogu terenu |
| 02.16 | Mury = 15 cegły (§11.3) | NADAL ISTNIEJE | `buildings.json` `Mury.koszt_surowce = {drewno 40, kamien 80}` — brak cegły; nie znaleziono nadpisania w kodzie |
| 02.17 | Modele miast Brązu: Sumer, Egipt, Inkowie, Zulusi (§12.2) | NIEROZSTRZYGNIĘTY | Zakres wizualny, poza weryfikacją danych |
| 02.18 | Stała mapy 84×60 = 5040; wzrok 2 → 19 (l.155) | NADAL ISTNIEJE | Patrz 00.4, 00.5 |
| 02.19 | Kultura 100 → +1 pierścień (l.156) | NAPRAWIONY | Patrz 00.6 |
| 02.20 | Łódź rybacka tylko na wybrzeżu w terytorium (§13.2) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano warunku |

## 04 — Jednostki na mapie

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 04.1 | Katalog: 50 jednostek v1.0 (l.4) | NADAL ISTNIEJE | `units.json`: 75 wierszy z kluczem `Jednostka` (cz. X mówi 73 — oba rozjechane z danymi) |
| 04.2 | Widok domyślnie 3, zwiadowca min. 5 (§22.1) | NADAL ISTNIEJE | Patrz 02.1 |
| 04.3 | Włócznik: ruch 2 (§22.2) | NAPRAWIONY | `units.json` Włócznik `Ruch = 2` |
| 04.4 | Włócznik: M=8 | NIEROZSTRZYGNIĘTY | Dane nie mają pola „M"; `Obrona = 8`, `fieldPower = 44` — definicja M nie potwierdzona |
| 04.5 | Włócznik: koszt 20 Pracy + 1 🍞 utrzymanie (§22.2) | NADAL ISTNIEJE | `units.json` Włócznik: `Pieniądz (koszt) = 8`, `Surowiec (ilość) = 25 Brąz`, `Utrzymanie (Pieniądz/turę) = 2`, `żywność/turę = 1` |
| 04.6 | Armia 4 włóczników: koszt 4 🍞/t (§22.2) | NAPRAWIONY | `żywność/turę = 1` × 4 |
| 04.7 | Las, wzgórze: drożej niż łąka; rzeka: kara atakującego (§23.1–23.2) | NAPRAWIONY | `terrain-combat.json`: Las koszt 2, Wzgórza 2, Rzeka = STOP; `combat-params.json` `river_attack_mult = 0.75` |
| 04.8 | Posiłki w promieniu 1 heksa (§26.1) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano w kodzie |
| 04.9 | Łączenie armii, garnizon, murów (§24–25) | NIEROZSTRZYGNIĘTY | Opisy UI/mechaniki bez liczb |

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
| 05.8 | Tartak: +3 drewno/pole (§53.6) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano wartości tartaku (poza cz. VIII) |
| 05.9 | Warunki terenu (Farma nie na lesie, Irygacja przy rzece, Kopalnia na wzgórzu/górze…) (§30.1) | NIEROZSTRZYGNIĘTY | Pola `warunek` w danych są opisowe; nie zweryfikowano każdego |

## 08 — Ekonomia imperium

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 08.1 | Korupcja — współczynnik dystansu: Łatwy 0,5 / Normalny 1 / Trudny 1,5 (§49.3a) | NAPRAWIONY | `econ-params.json` `korupcja_wspolczynnik_dystansu` 0.5 / 1 / 1.5 |
| 08.2 | Korupcja — współczynnik miast: 0,5 / 0,5 / 1 (§49.3a) | NAPRAWIONY | `korupcja_wspolczynnik_miast` 0.5 / 0.5 / 1 |
| 08.3 | Korupcja — sufit: 38% / 50% / 62% (§49.3a) | NAPRAWIONY | `korupcja_cap` 38 / 50 / 62 |
| 08.4 | Sąd, Pretorium, Pałac: po 30 pp, max 60 pp (§49.3a) | NAPRAWIONY | `economy.ts` `KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.30`, `..._SUFIT = 0.60`; lokalizacje Pałac=stolica, Pretorium=region |
| 08.5 | Mennica ×2 / ×1,5 / ×1 (Łatwy/Normalny/Trudny) (§49.3b) | NAPRAWIONY | `econ-params.json` `globalne.mennica_mnoznik_po_walucie` 2 / 1.5 / 1 |
| 08.6 | Spichlerz: 50% bufora po wzroście; pojemność państwa 100 🍞 (§50.1, §50.4) | NAPRAWIONY | `spichlerz_zachowanie_po_wzroscie` normal 0.5; `spichlerz_pojemnosc_zapasow_panstwa` normal 100 |
| 08.7 | Głód wojska: −8% max HP na turę (§50.3) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano stałej w kodzie |
| 08.8 | Tempo: Szybka ×1, Standard ×2, Długa ×4; ×2 korekta globalna; mnożnik trudności (§51.2) | NADAL ISTNIEJE | Tempo i ×2 zgodne (`tech-tempo.ts`, `r-stawki-strojenie.ts`). Niepełne: pomija **FALA2 ×2 dla Brązu i Żelaza** (`difficulty-cost.ts` `scaledResearchCost`) |
| 08.9 | Magazyn surowców państwa: baza 500 szt/typ + 100 za Magazyn (§53.2) | NADAL ISTNIEJE | `econ-params.json` `globalne.magazyn_baza_surowce = 50000` (szt/typ, epoka 1); `magazyn_centralny_bonus_zywnosc_na_budynek = 100` dotyczy żywności |
| 08.10 | Koszty materiałowe 9 budynków: ceramika/cegła, np. Mury 15 cegły, Akademia 14 cegły (§53.2) | NADAL ISTNIEJE | `buildings.json` `koszt_surowce`: Mury `drewno 40, kamien 80`; Akademia `drewno 40, cegla 70`; Świątynia `drewno 30, kamien 40`. Nie znaleziono nadpisania w `building-stock-cost.ts` (nie czytano w całości) |
| 08.11 | Szlaki: dystans ≤12 ląd / ≤20 morze (§53.3) | NAPRAWIONY | `econ-params.json` `handel_szlaki.lad_max_dystans 12`, `morze_max_dystans 20` |
| 08.12 | Szlaki: dochód = baza 8 ¤ + 0,4 ¤/heks, podłoga 1 ¤ (§53.3) | NADAL ISTNIEJE | `handel_szlaki` używa tablic `dochody_ladowe` (13 wartości) i `dochody_morskie` (21); brak parametrów 8 / 0,4 / 1 |
| 08.13 | Szlaki: +5% Daniny za każdą trasę (§53.3) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano |
| 08.14 | Cennik koszyka: drewno 2, glina 2, kamień 3, ruda 4, cegła 5, ceramika 6 PN/szt (§53.5) | NIEROZSTRZYGNIĘTY | `econ-params.json` `cena_*` mają kroki po 10 szt. i wartości per `easy/normal/hard`; `cena_drewno.normal = 1`; cena cegły w opisie 5 PN/blok — jednostka do potwierdzenia |
| 08.15 | Dominacja: >50% siły w epoce Żelaza (§52.5) | NAPRAWIONY | Patrz 00.1 |

## 09 — Nauka i epoki

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 09.1 | Wzór kosztu: bazowy × tempo × 2 (korekta) × trudność (§54.6) | NADAL ISTNIEJE | Wzór pomija **FALA2 ×2 dla Brązu i Żelaza** (`difficulty-cost.ts`) |
| 09.2 | Tabela tempa: Szybka ×1 · Standardowa ×2 · Długa ×4 (§54.6) | NAPRAWIONY | `tech-tempo.ts`, `e-start-params.json` `tempo_gry` |
| 09.3 | Przykład: 12 × 2 × 2 × 2 = 96 PN (Trudny, gracz) (§54.6) | NAPRAWIONY | Zgodne z formułą bez FALA2 (przykład dotyczy innej epoki) |
| 09.4 | Trudny: gracz ×2, AI ×1; Łatwy: gracz ×1, AI ×2 (§54.6) | NAPRAWIONY | `difficulty-cost.ts` `getCostMultiplierForOwner` |
| 09.5 | Start w Kamieniu/Brązie/Żelazie: kaskada tech (§55.4) | NAPRAWIONY | `e-start-params.json` `e1_tech_kaskada_epok = true` (mechanizm nie weryfikowany szczegółowo) |
| 09.6 | Łucznictwo wymaga Łowiectwa (§56.2) | NAPRAWIONY | `tech.json`: Łucznictwo `Wymaga (prereq) = Łowiectwo` |
| 09.7 | Brązownictwo kończy Kamień; Hutnictwo żelaza kończy Brąz (§55.3) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano flag „kamień milowy" w `tech.json` |
| 09.8 | Epoki v1.0: Kamień, Brąz, Żelazo, „Średniowiecze+" (§55.1) | NIEROZSTRZYGNIĘTY | `ostatnia_epoka_v1 = 3` (Żelazo) zgodne; „Średniowiecze+" jest poza v1, nie zweryfikowano |
| 09.9 | Mapa standard 84×60 / wzrok 2 → 19 / pierścień 100 (l.87–88) | NADAL ISTNIEJE / NAPRAWIONY | Patrz 00.4, 00.5, 00.6 |

## 10 — Walka

| # | Twierdzenie | Status | Dowód |
|---|---|---|---|
| 10.1 | Liczba jednostek: 73 (§61.1) | NADAL ISTNIEJE | `units.json`: 75 wierszy |
| 10.2 | Pięć ról: Wręcz, Dystans, Kawaleria/flanka, Oblężnicza, Wsparcie (§61.1) | NIEROZSTRZYGNIĘTY | `units.json` ma `Rola (linia)`; nie zestawiono zbioru ról |
| 10.3 | Counter ×1,5 (§61.2) | NAPRAWIONY | `combat-params.json` `counter_multiplier = 1.5` |
| 10.4 | Włócznia vs konnica +50%; „12 jednostek uzbrojonych we włócznię" (§61.2) | NADAL ISTNIEJE (liczba) / NAPRAWIONY (+50%) | `Bonus vs Mount % = 50` ma **15** jednostek, nie 12 |
| 10.5 | Wzgórze: obrona ×1,5 (§63.2) | NAPRAWIONY | `terrain-combat.json` Wzgórza `+50%` |
| 10.6 | Góra: obrona ×1,75; ruch 2; konnica niedostępna (§63.2) | NAPRAWIONY (obrona, ruch) / NIEROZSTRZYGNIĘTY (konnica) | `terrain-combat.json` Góry `+75%`, koszt 2 |
| 10.7 | Bród: ruch ×0,5, kara ataku −25%, obrona brzegu +15% (§63.1) | NAPRAWIONY | `combat-params.json` `brod`: `ruchMult 0.5`, `karaAtak 0.25`, `bonusObronaBrzegu 0.15` |
| 10.8 | Rzeka poza brodem: kara ataku ok. ×0,75 (§63.1) | NAPRAWIONY | `river_attack_mult = 0.75` |
| 10.9 | Weterani: Doświadczony po 1 bitwie +10%; Weteran po 2+ bitwach +20% (sufit) (§65.2a) | NADAL ISTNIEJE | `veteran.ts`: 1 wygrana → poziom 2 (+10%); **2 wygrane → poziom 2 (+15%)**; poziom 3 (Weteran, +20%) dopiero od **3** wygranych |
| 10.10 | Po 2. bitwie: atak 12, zdrowie 60, próg dezercji 24% (§65.2a) | NADAL ISTNIEJE | Wynika z 10.9 (2 wygrane = +15%, nie +20%) |
| 10.11 | Pancerz wyłączony z premii weterana; premie nie kumulują się (§65.2a) | NIEROZSTRZYGNIĘTY | Nie zweryfikowano listy pól w `veteran.ts` (kumulacja: zgodne z `VETERAN_BONUS_FRAC`) |
| 10.12 | Piechota 10 vs włócznik 8, bonus terenu +15% → 11,5 (§57.5, §59.4, §60.4) | NIEROZSTRZYGNIĘTY | Przykład liczbowy; `terrain-combat.json` nie ma +15% (Las/Wzgórza +50%, Góry +75%) — do korekty lub oznaczenia jako ilustracja |
| 10.13 | Auto-walka: straty ~30% słabszej strony przy ×1,4 mocy (§57.5, §59.4) | NIEROZSTRZYGNIĘTY | Wzór „coef v2b" nie zweryfikowany |
| 10.14 | Preboard: cztery opcje (Auto, Ręczna, Wycofaj, Zapisz) (§57.1) | NIEROZSTRZYGNIĘTY | Opis UI, nie weryfikowano |

---

## Podsumowanie

- Pozycje w tabelach: 99 (ch00: 6, ch01: 17, ch02: 20, ch04: 9, ch05: 9, ch08: 15, ch09: 9, ch10: 14). Powtórzenia z bloku szablonowego liczone jako jedna pozycja (00.2).
- **NADAL ISTNIEJE** (rozjazd potwierdzony): 00.2, 00.3/01.10, 00.4/01.5/01.6/09.9, 00.5/02.1/04.2, 01.7 (tempo), 01.14 (okolica 3 vs 5), 02.4, 02.5, 02.7, 02.16, 04.1, 04.5, 05.1, 05.3, 05.4, 08.8, 08.9, 08.10, 08.12, 09.1, 10.1, 10.4, 10.9, 10.10.
- **Najważniejsze do decyzji właściciela:**
  1. Kanoniczny wymiar Standardowego: 84×60 (ui-params, poradnik) vs 168×120 (`map-gen-params.json`, generator).
  2. Tempo: poradnik cz. 00/01 (×0,2/×1/×5) vs kod i cz. 08/09 (×1/×2/×4).
  3. Weterani: próg poziomu 3 — 2 czy 3 wygrane.
  4. Magazyn: 500 (poradnik) vs 50000 (dane) per typ surowca.
  5. Koszty materiałowe budynków: cegła/ceramika (poradnik) vs drewno/kamień (`buildings.json`).
- **Błąd wewnętrzny poradnika:** §8.1 (cz. II) podaje wzrok 3, §155 tej samej części podaje wzrok 2 → 19 heksów.
- **Wpisy danych do wyjaśnienia (nie treść poradnika):** `civs.json` `start_gry` ma „gracz zawsze startuje z 1 osadnikiem" i „9 typów × 10 miast", sprzecznie z mechaniką bez osadnika i pulą 15 typów.

Rekomendacja dla autora poradnika: najpierw korekta bloku szablonowego (tempo, rozmiary, liczba typów) w jednym miejscu, potem sekcje 05, 08 i 10.
