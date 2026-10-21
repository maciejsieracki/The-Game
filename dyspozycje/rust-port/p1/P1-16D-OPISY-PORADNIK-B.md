# P1.16D — OPISY-PORADNIK-B: rozdz. 14, 15, 16 (treść główna) + 8 pozycji z §9.5

**Temat:** R-RUSTPORT-P1-16D-OPISY-PORADNIK-B-Q1
**Pin web:** `edb8fb56` (czytane przez `git show edb8fb56:<ścieżka>`; working tree repo jest na innej gałęzi (`claude/sprawdzenie-funkcjonalnosci-ek4ra0`) i nie był źródłem)
**Źródło listy B:** `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 (wiersze: rozdz. 06, 11, 12, 13, 17, 28, 57, 91)
**Pominięte (zgodnie z dispatchem):** bloki „Przykład liczbowy / Strategia gracza / Typowe błędy" oraz powtarzalne linie szablonowe („Trudny: AI +15% produkcji — miasto AI z 10 pracy/t…", „Barbarzyńca 3 jednostki M=6…", „Scenariusz na Normalnym: przyrost +10/turę…", „Rzymianie: bonus −5% kary korupcji…"). Te linie są kopiowane do każdego rozdziału; pozycje sprzeczne z kodem zgłaszam poniżej jako osobne wiersze.

**Legenda statusów:**
- **ZGODNE** — treść = pin (wskazano źródło).
- **NIEZGODNE** — rozjazd potwierdzony (treść ≠ pin).
- **CZĘŚCIOWO** — część twierdzeń zgodna, część nie.
- **NIEROZSTRZYGNIONY** — nie sprawdzono lub nie dało się jednoznacznie zweryfikować (powód podany).

---

## Część B — 8 pozycji z §9.5 (kryterium binarne: każda ma status z dowodem)

| # | Pozycja (§9.5) | Status | Dowód na pinie `edb8fb56` |
|---|---|---|---|
| B1 | Rozdz. 06 — tabela §35.2a/§35.3: pomylone kolumny trudności, SzMax 12/18/24 | NIEZGODNE | (a) §35.2a (`06-miasto-spoleczenstwo.md` l.251–262) podaje **trzy różne kolumny** Łatwy/Normalny/Trudny (np. 90–100%: +10/+8/+7; 0–9%: +1/−1/−2). Kod: `gra/data/society-params.json` `szczescie_podatki_min = −10`, `szczescie_podatki_max = +10`, `szczescie_podatki_prog_pct = 90` — **identyczne dla easy/normal/hard** (G7); liniowa interpolacja w `society-breakdown.ts:643–662` (`luksusHappinessBonus`). Kolumny trudności w tabeli nie mają odpowiednika w danych. (b) §35.3: „Wojna −3" — kod `szczescie_kara_wojna = −5` na wszystkich trudnościach (G9; `society-breakdown.ts:771`). (c) §35.3: „Obca religia dominuje −2" — komentarz w `society-breakdown.ts:~650–700` (G5): „usunięte dwie kary już zawarte w skali ±x: obca religia, podbój podwójnie obcy" → NIEZGODNE. (d) §35.3 „Zagęszczenie −1 × (ludność − próg)": **kara nieobecna w kodzie** — G12 (`society-breakdown.ts:748–750`) usuwa karę; `szczescie_kara_wielkosc_miasta` nie występuje w `gra/src` ani `gra/data` na pinie (jedyne trafienie: komentarz l.748). `society-breakdown.ts:751` czyta `szczescie_prog_zagęszczenia` (JSON: easy 6 / normal 5 / hard 4, fallback 4), ale ten odczyt zasila `legacyMale` (l.752–754) przez `szczescie_male_miasto_bonus`, czyli jest **bonusem dla małych miast, nie karą** (nota: komentarz G12 i odczyt są zgodne co do braku kary; nazwa odczytu w komentarzu nie wspomina o bonusie). (e) „SzMax 12/18/24": **nie występuje w rozdz. 06**; występuje tylko w `HANDOFF-rev-E-2026-07-03.md` l.27. Pin: `szczescie_max_epoka` = easy [20,40,60] / **normal [30,50,70]** / hard [35,55,80]. Wartości 12/18/24 nieaktualne. |
| B2 | Rozdz. 11 — „mur 5+3/poziom" (`11-oblezanie.md` l.58) | NIEZGODNE | Wprost w `docs/PORADNIK-GRACZA/11-oblezanie.md` l.58: „poziom muru daje stały bonus Obrony (5 + 3/poziom, `buildings.json`)". Pin: `buildings.json` `mury`: `baza.obrona = 0`, `przyrost.obrona = 0`, `maksPoziom = 2`; uwagi: „Obrona miasta WYLACZNIE procentowa… Mury +200% Obrony". `miasto-params.json` `bonus_obrona_mur_proc = 200`. `combat-params.json` l.41: `wall_base_obrona` / `wall_per_level_obrona` **ZEROWANE**. `git grep '5+3'` na pinie w `docs/`, `gra/src`, `gra/data`: 0 trafień. Zakres „Maks. 2 poziomy" zgodny z `maksPoziom`. |
| B3 | Rozdz. 13 — Rzymianie „+35% odnowy" / kary Chińczyków | CZĘŚCIOWO | **Rzymianie +35% odnowy: ZGODNE** — `civ-matrix.json` Rzymianie `mp_regen_proc = 0.35` (`manpower.ts`). Rzymianie „+15% ataku i pancerza piechoty": ZGODNE (`walka_atak_piechota 0.15`, `walka_pancerz_piechota 0.15`). **Rzymianie „−20% kosztu produkcji budynków": NIEZGODNE (kierunek)** — dane `prod_koszt_budynku_proc = +0.2` (`civ-matrix.json`, Rzymianie); `paramDefs.prod_koszt_budynku_proc.formula = mul_proc`, a `_meta.formula_mul_proc = "wynik = baza * (1 + wartosc)"`, więc +0,2 = koszt **×1,2 (+20%)**, nie redukcja; klucz w `HARMFUL` (`civ-matrix-semantic.ts:206–215`). Poradnik (rozdz. 13 l.163) podaje −20%. Nota: brak konsumenta runtime tego klucza w `gra/src` poza klasyfikatorem (grep: 0 trafień), więc rozbieżność dotyczy treści/danych, nie zachowania gry. **Chińczycy: ZGODNE** — `walka_obrona_piechota −0.05` (kara −5%), `walka_dystans_lukownicy +0.2` (+20%), `walka_uderzenie_kawaleria +0.15` (+15%). |
| B4 | Rozdz. 12 — próg Handlu „Relacja ≥ 40" | CZĘŚCIOWO | **Tabela (l.169) ZGODNA:** `gra/data/diplomacy.json` `handel_prog_relacja = 40`; używane w `diplomacy-proposals.ts:1399–1400` (komunikat „wymagane ≥ progHandelRelacja") i `diplomacy-locks.ts:236,244`. **NIEZGODNE w tym samym rozdziale:** 7 wystąpień „odblokowuje handel (próg **+20**)" — l.57, 92, 147, 197, 258, 293, 367 (grep na pinie: `próg \*\*\+20\*\*`, 7 trafień) — sprzeczne z l.169 i danymi. Fallback UI `diplomacyTradeBasket.ts:188` (`PROG_HANDEL_REL = 100`) używany tylko gdy kontekst nie podaje wartości (pin: kontekst podaje z danych). |
| B5 | Rozdz. 17 — boks „Skrót Spacja = Wykonaj" | NIEZGODNE | Poradnik sprzeczny sam ze sobą: l.41 i l.88 „Skrót **Spacja** = Wykonaj"; l.78 (§101.3) „nie ma jednego skrótu klawiszowego dla wszystkich akcji (Wykonaj)". Kod: `gra/src/main.ts:36131–36137` — Spacja = `cycleToAdjacentPlayerUnit(selectedId, 1)` (następna armia gracza z ruchem w turze), nie „Wykonaj". Komentarz w kodzie: „Spacja: następna armia gracza…". `battleScene.ts:16474` (Space w bitwie) nie zweryfikowany co do funkcji. |
| B6 | Rozdz. 28 — „Kopalnia" (usunięta mechanika?), „Bydło" | NIEZGODNE | **Kopalnia:** `28-katalog-ulepszen.md` l.16 i 170: „Kopalnia | Kamień | 25 pracy | +2 praca | Murarstwo". Pin `gra/data/terrain-improvements.json`: **brak wpisu ogólnego „kopalnia"**; są `kopalnia_miedzi` (epoka 2), `kopalnia_cyny` (2), `kopalnia_zlota` (2), `kopalnia_zelaza` (3). Żadna nie jest w epoce Kamień → NIEZGODNE. **Bydło:** ZGODNE w: koszt 20 (`koszt_praca: "20"`), tech „Oswojenie zwierząt", epoka 1 (Kamień), teren Łąka/Równina, żywność +2. **NIEZGODNE w: praca** — doc „+3 praca", dane `bonus.praca = 4`; dane dodają `handel = 3` (brak w poradniku). Nazwa w danych: „Trzoda" (klucz `bydlo`). Dane wymagają złoża bydła dla pierwszego pastwiska (`surowiecOdblokowany_uwaga`, ABC-18) — poradnik l.40 tego nie opisuje (CZĘŚCIOWO). |
| B7 | Rozdz. 57 — 47/47 „Moc w polu" w prozie (przelicz systematycznie) | NIEZGODNE | Przeliczono **wszystkie** wiersze `Moc w polu: **X**` w `57-katalog-jednostek.md` na pinie: **50 wierszy**. Dopasowanie po nazwie (kolumna `Jednostka`) w `gra/data/units.json` (pole `fieldPower`): **49 znalezionych, 1 nieznaleziona** (Kusznik — zgodnie z §82.1, jednostki nie ma w danych). Zgodnych: **1 z 49**. Niezgodnych: **48 z 49** (np. Wojownik doc 21.5 / dane 27; Oszczepnik 10 / 12; Katapulta 67.5 / 128; Taran 177.5 / 352.5; Rydwan konny 40 / 108; Jeździec chiński 34.5 / 91). Stosunek doc/dane dla 48 niezgodnych wierszy wynosi od **0,37** (Rydwan konny 40/108; Rydwan Shang 43/116) do **0,90** (Łucznik egipski 13,5/15) — to nie jest stała korekta. Jedyny zgodny wiersz: Miecznik galijski (1,0) (doc l.77 deklaruje „kolumna = fieldPower", ale wartości są ze starego snapshotu). Uwaga metodyczna: dopasowanie bierze pierwszy wpis o danej nazwie; duplikatów nazw nie badano osobno. |
| B8 | Rozdz. 91 — Posąg Peruna (epoka) | NIEZGODNE | `91-katalog-cudow-antyk.md` l.37 i 227: „Posąg Peruna — epoka **Kamień**, Tech: **Mistycyzm, Murarstwo**, koszt 140 pracy". Pin `gra/data/wonders.json` `posag_peruna`: `epokaWejscia: 3` (mapowanie 1=Kamień, 2=Brąz, 3=Żelazo wg `building-stock-cost.ts:70–73` / `civ-entry-epoch.ts:10`), `techUnlock: ['Obróbka żelaza']`, `kosztBudowy: 140` (**ZGODNE**), `wymagaTerenu: ['wzgorze']` (ZGODNE). Epoka i technologia NIEZGODNE. |

### Wiersz dodatkowy — linia szablonowa z „Pominięte" (wynik obrony, zarzut 4)

| # | Pozycja | Status | Dowód na pinie `edb8fb56` |
|---|---|---|---|
| B-x | „Rzymianie: bonus **−5%** kary korupcji przy stracie 20% → 19%" (rozdz. 12 l.328–329; rozdz. 13 l.74–75, 125–126, 235–236, 272–273, 319–320) | NIEZGODNE | `civ-matrix.json`, Rzymianie: `eko_korupcja_proc = 0` (`paramDefs`: `formula mul_proc`, moduł `economy.ts`). Brak modyfikatora −5% w danych; zero wartości oznacza brak bonusu. |

---

## Część A — treść główna rozdz. 14, 15, 16 (twierdzenia liczbowe i mechaniczne)

### Rozdz. 14 — AI i zagrożenia (`14-ai-zagrozenia.md`)

| Twierdzenie | Status | Dowód na pinie |
|---|---|---|
| §87.2 Agresja AI: Zulusi 9, Rzymianie 8, Celtowie/Germanie 6, Grecy/Inkowie/Egipt 4, Chińczycy 2, Sumerowie 3 | ZGODNE | `civ-matrix.json` `ai_agresywnosc`: Zulusi 9, Rzymianie 8, Celtowie 6, Germanie 6, Grecy 4, Inkowie 4, Egipt 4, Chińczycy 2, Sumerowie 3 |
| §87.2 Sumerowie: priorytet nauki 8/9 | ZGODNE | `civ-matrix.json` Sumerowie `ai_priorytet_nauka = 8` |
| §87.3 / §89.1 Normal: +10% produkcji AI, +1 nauka/turę, +1 jednostka startowa | ZGODNE | `ai-params.json` `trudnosc_poziom2_bonus_produkcja = 0.1`, `…_bonus_nauka = 1`, `…_startowe_jednostki = 1` |
| §89.3 Trudny: +25% produkcji, +1 miasto startowe, +5% statystyk walki | ZGODNE | `ai-params.json` `trudnosc_poziom3_bonus_produkcja = 0.25`, `…_startowe_miasta = 1`, `…_bonus_walka = 0.05` |
| §87.3 tabela Trudny: „Bonus nauki AI: 0 (w danych v1)" | NIEZGODNE | `ai-params.json` `trudnosc_poziom3_bonus_nauka = 2` (+2/turę) |
| Przykład „Trudny: AI **+15%** produkcji" (powtórzone w 14, 15, 16) | NIEZGODNE | Dane: +25% (`trudnosc_poziom3_bonus_produkcja = 0.25`) |
| §87.3 Łatwy: 0% produkcji, 0 nauki, brak dodatkowych jednostek | ZGODNE (uzupełnienie) | `trudnosc_poziom1_*` = 0; dodatkowo Łatwy ma `bonus_walka = −0.05` i mnożniki agresji 0,85 / dyplomacji 0,8 — poradnik tego nie opisuje |
| §88.6 Min. populacja źródła ≥ 5 („po founding 5→4") | NIEZGODNE | `city-founding.ts:65–68`: `minPop = max(popCost + 1, AI_FOUNDING_SOURCE_MIN_POP)`, `AI_FOUNDING_SOURCE_MIN_POP = 3` (`city-founding.ts:53`), `zaloz_miasto_koszt_ludnosci = 1` (`miasto-params.json`) → **min. 3**, nie 5 |
| §88.6 Min. dystans 4 heksy między miastami AI | ZGODNE | `ai-params.json` `ekspansja_min_dystans_miast = 4`; `miasto-params.json` `min_dystans_miast = 4` |
| §88.6 Tempo do 2 foundingów/turę; epoki 1–3 wyższa agresja | NIEROZSTRZYGNIONY | Nie zlokalizowano limitu „2/turę" w `city-founding.ts` w tej rundzie |
| §88.5 AI throttle: 1 ulepszenie/miasto/turę; wyrąb lasu tylko gdy ≥3 lasy w promieniu | NIEROZSTRZYGNIONY | Nie sprawdzono w tej rundzie |
| §88.1 Miasta-państwa nie zakładają miast; posiłki tylko w sojuszu | NIEROZSTRZYGNIONY | Nie sprawdzono w tej rundzie |
| Wzór „Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%" | CZĘŚCIOWO | `society-params.json` `porzadek_waga_szczescie / porzadek_waga_prawo` = **0,5 / 0,5 na normal** (ZGODNE); easy 0,55 / 0,45, hard 0,45 / 0,55 (poradnik nie wspomina o trudności) |
| Wzór „Próg(N) = 20 + N × 16" (powtórzone w 14 i 16) | NIEROZSTRZYGNIONY | Brak takiej formuły w `gra/src` (grep na `20 + N × 16` / `× 16 + 20`: 0 trafień). Wartość 16 występuje tylko jako `szczescie_skala_kultura_religia` (10/16/23 per epoka), co nie jest tą samą formułą |
| Sekcja „Podsumowanie — hierarchia zagrożeń" (kolejność) | NIEROZSTRZYGNIONY | Ocena priorytetów, nie twierdzenie mechaniczne |

### Rozdz. 15 — Kultura, religia, cuda (`15-kultura-religia-cuda.md`)

| Twierdzenie | Status | Dowód na pinie |
|---|---|---|
| §94.2 Wyrocznia — epoka Kamienia, Mistycyzm | ZGODNE | `wonders.json` `wyrocznia`: `epokaWejscia: 1`, `techUnlock: ['Mistycyzm']` |
| §94.2 Kamień Ha'amonga — Brąz, Żegluga | ZGODNE | `wonders.json` `hamonga`: `epokaWejscia: 2`, `techUnlock: ['Żegluga']` |
| §94.2 Brama wszystkich narodów — Żelazo, Inżynieria + Wojskowość | ZGODNE | `wonders.json` `brama_narodow`: `epokaWejscia: 3`, `techUnlock: ['Inżynieria', 'Wojskowość']` |
| §95.1 Piramidy: +3 złoto i +3 praca × każde miasto | ZGODNE | `wonders.json` `piramidy.bonusy.miasto = {pieniadz: 3, praca: 3}` |
| §96.2 Utrzymanie Piramid 2 → 1 po absolut (floor/2) | CZĘŚCIOWO | Wartość bazowa `utrzymanie = 2` ZGODNA; reguła „floor/2 po absolut" **NIEROZSTRZYGNIONA** (nie sprawdzono kodu absolutu w tej rundzie) |
| §91.3 Progi szczęścia wg % własnej kultury (100% max, ≥75% dobry, 50% neutralnie, <25% silna kara) | NIEROZSTRZYGNIONY | Mechanika jest liniowa (`2·x·udział − x`, G4 w `society-breakdown.ts`); progi z tabeli nie przeliczone |
| §91.2/§93 „Podbite miasto: obca religia dominuje **−2**, obca kultura **−1**" | NIEZGODNE | Komentarz G5 w `society-breakdown.ts`: „usunięte dwie kary już zawarte w skali ±x: obca religia, podbój podwójnie obcy"; kultura: linia proporcjonalna G4, nie stałe −1 |
| §93 „Świątynia +2 kultury/t + bonus religii +2 szczęścia po >50%" | NIEROZSTRZYGNIONY | Nie sprawdzono w tej rundzie |
| §93 „Po 8 turach konwersji +1%/t → 38%" | NIEROZSTRZYGNIONY | Arytmetyka wewnętrznie poprawna (30 + 8 = 38); mechanizmu konwersji nie zweryfikowano |
| §94.0 „AI nadal nie buduje cudów (CUDA-AI=A nie wdrożone)" | NIEROZSTRZYGNIONY | Wymaga przeszukania ścieżki budowy cudów AI; nie wykonano w tej rundzie |
| §96.1 Absolut Antyku — koniec epoki 6 (Średniowiecze) | NIEROZSTRZYGNIONY | Nie sprawdzono w tej rundzie |
| §96.3 Turystyka: +10 Daniny po ruinie | NIEROZSTRZYGNIONY | Nie sprawdzono w tej rundzie |

### Rozdz. 16 — Zwycięstwo i koniec gry (`16-zwyciestwo.md`)

| Twierdzenie | Status | Dowód na pinie |
|---|---|---|
| §97.1 Dominacja: siła > 50% sumy, tylko w ostatniej epoce (Żelazo = 3) | ZGODNE | `victory.ts:7–8, 31, 138–146` (`PROG_DOMINACJI_POWER`, `OSTATNIA_EPOKA_GRY_V1`); `e-start-params-loader.ts:137–139` (domyślnie 0,5); `e-start-params.json` `zwyciestwo.prog_dominacji_power = 0.5`, `ostatnia_epoka_v1 = 3` |
| §97.2 Nauka: wszystkie tech w zakresie + rakieta wystrzelona | ZGODNE | `victory.ts:149–156` (`isNaukaVictory(wszystkieTech, rakieta)`) |
| §98.1 Porażka: zero miast po wcześniejszym posiadaniu miasta | ZGODNE (z uwagą) | `victory.ts:127` (`citiesOf(...).length === 0`), `victory.ts:225` (`isEliminated && osadnicy === 0 && kiedysMial`). Kod dodatkowo wymaga braku osadników — poradnik twierdzi, że osadnika nie ma, co jest spójne |
| §97.3 Zwycięstwa kulturowe/religijne/dyplomatyczne — 🔮 plan v2, brak punktacji | NIEROZSTRZYGNIONY | Brak tych trybów w `victory.ts` potwierdzony tylko częściowo (tryby wymienione w nagłówku pliku); nie przeszukano pełnie |
| §97.4 „AI też wygrywa — jeśli rywal osiągnie próg dominacji lub rakietę, ty przegrywasz" | NIEZGODNE w `victory.ts` (zakres modułu) | `victory.ts:219, 226, 235`: każdy zwrot `checkVictory` ma `winner: gracz`; jedyna porażka to eliminacja (`victory.ts:225–226`); brak gałęzi „AI wygrywa”. Wywołania `checkVictory` poza `victory.ts` nie przeszukano (R2) |
| §99 Ekran zwycięstwa — „status UI: w trakcie wdrożenia w v1.0" | NIEROZSTRZYGNIONY | Stan UI (`victoryScreen.ts`) nie sprawdzony w tej rundzie |

---

## Zastrzeżenia i ograniczenia tej rundy

- Pozycje B1–B8 mają status z dowodem (kryterium binarne z dispatchu spełnione dla listy B).
- Część A nie jest pełnym przeliczeniem wszystkich wierszy rozdz. 14/15/16. **Jawny zakres R2** (wiersze NIEROZSTRZYGNIONY, bez dowodu w tej rundzie): tempo foundingów „2/turę" (§88.6); throttle ulepszeń AI i wyrąb lasu (§88.5); miasta-państwa nie zakładają miast (§88.1); „Próg(N) = 20 + N × 16" (§87/§90/§91-tekst); sekcja „hierarchia zagrożeń" (ocena, nie twierdzenie); §91.3 progi kultury; §93 Świątynia +2 kultury i bonus religii; §93 konwersja „8 tur → 38%"; §94.0 „CUDA-AI = A"; §96.1 Absolut Antyku (koniec epoki 6); §96.2 reguła „floor/2 po absolut"; §96.3 turystyka +10 daniny; §97.3 tryby kulturowe/religijne/dyplomatyczne; §99 ekran zwycięstwa (`victoryScreen`).
- B1 (d): rozstrzygnięte w tabeli (kara nieobecna; odczyt progu zasila bonus dla małych miast, nie karę).
- Nie uruchomiono `npm`/`cargo`, nie modyfikowano `gra/**`, nie zapisano nic poza tym plikiem i katalogiem runu. Brak commitów, brak push/deploy.
