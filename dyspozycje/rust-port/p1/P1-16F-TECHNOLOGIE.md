# P1.16f — Audyt 32 haseł „Technologie" (CivPedia) wobec `tech.json`

**Temat:** `R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1`
**Runda:** 1/5 (Operator)
**Pin web:** `edb8fb56` (odczyt przez `git show edb8fb56:...`, NIE z working tree — working tree na HEAD `68069973` różni się od pinu w 138 plikach `gra/`)
**Źródła:**
- Hasła: `gra/src/data/wikiBundle.json` @ `edb8fb56`, pozycje `encyklopedia[]` z `id` = `technologie/*` (32 sztuki).
- Dane: `gra/data/tech.json` @ `edb8fb56`, tablica `technologie[]` (32 sztuki).
- Semantyka kosztu: `gra/src/game/tech-tempo.ts` @ `edb8fb56` — `applyTempoKoszt(bazowyKoszt, tempo)`; wartości `tech.json` = tempo **szybka** (×1.0), standardowa ×2, długa ×4.
- Prereq w runtime: `gra/src/game/playerState.ts` @ `edb8fb56` (`parsePrereqs` z pola „Wymaga (prereq)").

**Metoda:** skrypt porównujący pola wiki (sekcja „Wymagania" / „Co odblokowuje" w `wikiM`, plus `wikiS`) z polami JSON. Sprawdzone pola: Epoka, Poziom, Wymaga (prereq), Koszt nauki (wiki „baza, tempo Szybka" vs JSON), Wymagany budynek, Dostęp do surowca, Odblokowuje budynek (bez listy jednostek), lista jednostek (osobno), Odblokowuje ulepszenie terenu, Odblokowuje surowiec, awansDoEpoki / sekcja „Postęp epoki", Wymagane ulepszenie (Żegluga). Wynik skryptu: wszystkie pola poza kosztem zgodne (0 rozjazdów); koszt rozjechany w 28/32. Zgodność z ręcznym przeglądem `wikiM`/Uwag potwierdzona dla każdej pozycji.

**Poza zakresem tego tematu:** narracyjne `historia`, `full`, `wikiM` poza wymienionymi polami — nie oceniano stylu ani treści opisowej.

## Wynik — status per hasło (32/32)

Legenda: **NIEZGODNE** = rozjazd z `tech.json` na pinie (dowód w kolumnie); **ZGODNE** = wszystkie sprawdzone pola zgodne; **UWAGA** = pola zgodne, ale treść Uwag/dokumentacji wymaga osobnego ruchu.

| # | id (`technologie/…`) | Technologia | Status | Dowód (wiki vs `tech.json`) |
|---|---|---|---|---|
| 1 | astronomia | Astronomia | NIEZGODNE + UWAGA | koszt wiki 220 vs JSON 440; Uwagi (JSON i wiki) podają „prereq Matematyka+Mistycyzm", pole prereq = Matematyka + Religia (runtime czyta pole) |
| 2 | brazownictwo | Brązownictwo | NIEZGODNE | koszt 90 vs 180 |
| 3 | budownictwo | Budownictwo | NIEZGODNE | koszt 170 vs 340 |
| 4 | drogi_brukowane | Drogi brukowane | NIEZGODNE | koszt 340 vs 680 |
| 5 | filozofia | Filozofia | NIEZGODNE | koszt 300 vs 600 (wymagany budynek Biblioteka — zgodny) |
| 6 | garncarstwo | Garncarstwo | NIEZGODNE | koszt 20 vs 40 |
| 7 | gospodarka_wodna | Gospodarka wodna | NIEZGODNE | koszt 36 vs 72 |
| 8 | handel | Handel | NIEZGODNE | koszt 148 vs 296 |
| 9 | hutnictwo_zelaza | Hutnictwo żelaza | NIEZGODNE | koszt 240 vs 480 (wymagany budynek Odlewnia brązu — zgodny) |
| 10 | inzynieria | Inżynieria | NIEZGODNE | koszt 260 vs 520 |
| 11 | jezdziectwo | Jeździectwo | NIEZGODNE | koszt 112 vs 224 |
| 12 | ko_o | Koło | NIEZGODNE | koszt 44 vs 88 |
| 13 | kodeks | Kodeks | NIEZGODNE | koszt 124 vs 248 |
| 14 | matematyka | Matematyka | NIEZGODNE | koszt 136 vs 272 |
| 15 | medycyna | Medycyna | NIEZGODNE | koszt 324 vs 648 (wymagany budynek Studnia — zgodny) |
| 16 | mistycyzm | Mistycyzm | NIEZGODNE | koszt 20 vs 40 |
| 17 | murarstwo | Murarstwo | NIEZGODNE | koszt 28 vs 56 |
| 18 | obleznictwo | Oblężnictwo | NIEZGODNE + UWAGA | koszt 280 vs 560; Uwagi JSON wymieniają Taran i Wieżę oblężniczą, pola odblokowań — tylko Katapulta; Wieża oblężnicza jest w polu Brązownictwa |
| 19 | obrobka_drewna | Obróbka drewna | ZGODNE | koszt 5 = 5 (tier 1) |
| 20 | obrobka_zelaza | Obróbka żelaza | NIEZGODNE | koszt 370 vs 740 (wymagany budynek Kuźnia żelaza — zgodny) |
| 21 | oswojenie_zwierzat | Oswojenie zwierząt | ZGODNE | koszt 5 = 5 (tier 1) |
| 22 | owiectwo | Łowiectwo | ZGODNE | koszt 5 = 5 (tier 1) |
| 23 | pismo | Pismo | NIEZGODNE | koszt 90 vs 180 (wymagany budynek Cegielnia — zgodny) |
| 24 | prawo | Prawo | NIEZGODNE | koszt 310 vs 620 |
| 25 | religia | Religia | NIEZGODNE | koszt 96 vs 192 (wymagany budynek Cegielnia — zgodny) |
| 26 | rolnictwo | Rolnictwo | ZGODNE | koszt 5 = 5 (tier 1) |
| 27 | sztuka_wojenna | Sztuka wojenna | NIEZGODNE | koszt 400 vs 800 |
| 28 | ucznictwo | Łucznictwo | NIEZGODNE | koszt 28 vs 56 |
| 29 | waluta | Waluta | NIEZGODNE + UWAGA | koszt 200 vs 400; wymóg Targowiska i dostępu do Złota tylko w Uwagach (pole „wymagany budynek" = null), wiki też tylko w Uwagach |
| 30 | wojskowosc | Wojskowość | NIEZGODNE | koszt 104 vs 208 |
| 31 | wymiana | Wymiana | NIEZGODNE | koszt 32 vs 64 |
| 32 | zegluga | Żegluga | NIEZGODNE | koszt 80 vs 160 (wymagane ulepszenie Tartak — zgodne) |

**Podsumowanie (liczby z tabeli, nie szacunek):** 32 sprawdzone / 32 ocenione. ZGODNE: 4 (obrobka_drewna, oswojenie_zwierzat, owiectwo, rolnictwo — wszystkie tier 1 o koszcie 5). NIEZGODNE: 28. Pola inne niż koszt: 0 rozjazdów wiki vs JSON (poza Uwagami wymienionymi wyżej).

## Ustalenia

1. **RT-1 potwierdzony (koszt, 28 haseł).** Wiki podaje koszt = połowę `Koszt nauki` z `tech.json` przy deklarowanym „tempo Szybka (×1.0)". Zgodne z wpisem RT-1 w `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` (28 technologii, tier 1 zgodny). Zgodnie z `tech-tempo.ts` źródłem prawdy jest `tech.json`, więc to wiki jest rozjechana. Przyczyna nieustalona w RT-1 (wzmiankowany commit `ab75bb4f`); ten temat jej nie rozstrzyga.
2. **Sprzeczność w danych (Astronomia).** Pole prereq (runtime) = Matematyka + Religia; Uwagi w JSON i wiki = Matematyka+Mistycyzm. Wymaga decyzji, którą wersję uznać za obowiązującą, przed korektą Uwag.
3. **Brak pól strukturalnych dla wymogów budynkowych Waluty (Targowisko) i Oblężnictwa (Taran/Wieża).** To rozjazd między Uwagami a polami, nie między wiki a JSON.

## Lista niedokończonych

Brak. Wszystkie 32 hasła mają status z dowodem w tabeli powyżej.

## Zakres zmian

- Nowy plik: `dyspozycje/rust-port/p1/P1-16F-TECHNOLOGIE.md` (ten dokument).
- Raport Operatora: `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1/01-operator.md`.
- Nie zmieniano `gra/**`, innych plików `P1-16*`, `LEDGER.md` ani `GOAL-*`. Brak commita (integracja po Final Control, poza rolą Operatora).
