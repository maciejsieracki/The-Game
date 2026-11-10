# P1.16f — Audyt 32 haseł „Technologie" (CivPedia) wobec `tech.json`

**Temat:** `R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1`
**Runda:** 1/5 (Operator, runda 2 — obrona po zarzutach Evaluatora; wersja poprawiona)
**Pin web:** `edb8fb56`. Dane czytane przez `git show edb8fb56:…`, NIE z working tree. Working tree na HEAD `cff7a5e9` (sprawdzone w rundzie 2; wpis „68069973" z rundy 1 był błędny).

**Źródła:**
- Hasła: `gra/src/data/wikiBundle.json` @ `edb8fb56`, `encyklopedia[]` z `id` = `technologie/*` (32 sztuki; bundle `generated` = 2026-09-05).
- Dane: `gra/data/tech.json` @ `edb8fb56`, `technologie[]` (32 sztuki).
- Semantyka kosztu: `gra/data/tech.json` `tempo_gry._opis`; `gra/src/game/tech-tempo.ts` @ `edb8fb56`; `gra/src/game/difficulty-cost.ts` @ `edb8fb56` (`scaledResearchCost`).
- Prereq w runtime: `gra/src/game/playerState.ts` @ `edb8fb56` (linie 34, 181: pole „Wymaga (prereq)").

**Skrypt i dowód odtwarzalny:** `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1/02-skrypt-porownawczy.py` (uruchomienie: `python3 -I 02-skrypt-porownawczy.py > 02-wyniki.md`). Wyniki surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1/02-wyniki.md`. Skrypt porównuje każde hasło po polach: epoka+poziom, prereq (zbiór, bez kolejności), koszt (wiki vs JSON, liczba), wymagany budynek, dostęp do surowca, budynki, jednostki (JSON trzyma je w polu „Odblokowuje budynek" po „Jednostki:"), ulepszenia terenu, surowce, awansDoEpoki, wymagane ulepszenie. Kontrola negatywna: parser różnicuje zbiory (`A, B` ≠ `A, C`); wiersz Brązownictwo: 12 jednostek po obu stronach.

**Metoda statusu:** ZGODNE = każde pole porównane przez skrypt zgodne. NIEZGODNE = co najmniej jedno pole rozjechane (w tabeli nazwane). UWAGA = pola zgodne, ale treść Uwag wymaga osobnego ruchu (ręczny przegląd; wymienione w „Ustaleniach").

**Poza zakresem:** narracyjne `historia`, `full`, `wikiM` poza wymienionymi polami, styl i treść opisowa.

## Wynik — status per hasło (32/32, każde z dowodem wierszowym)

Tabela: `koszt wiki` vs `koszt JSON` = wartości liczbowe z obu źródeł; `ratio` = JSON / wiki. Pola bez rozjazdu = „OK". Pozycje UWAGA są opisane w „Ustaleniach".

<!-- pin edb8fb56; wiki generated=2026-09-05; tech.json technologie=32; wpisow wiki=32 -->
| # | slug | Technologia | Epoka/poziom | prereq | koszt wiki | koszt JSON | ratio | wym. budynek | dostęp surowca | budynki | jednostki | ulepszenia terenu | surowce | awans epoki | wym. ulepszenie | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | astronomia | Astronomia | Brąz 6 / Brąz 6 | OK | 220 vs 440 | 440 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 2 | brazownictwo | Brązownictwo | Kamień 3 / Kamień 3 | OK | 90 vs 180 | 180 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 3 | budownictwo | Budownictwo | Brąz 6 / Brąz 6 | OK | 170 vs 340 | 340 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 4 | drogi_brukowane | Drogi brukowane | Żelazo 8 / Żelazo 8 | OK | 340 vs 680 | 680 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 5 | filozofia | Filozofia | Żelazo 7 / Żelazo 7 | OK | 300 vs 600 | 600 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 6 | garncarstwo | Garncarstwo | Kamień 2 / Kamień 2 | OK | 20 vs 40 | 40 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 7 | gospodarka_wodna | Gospodarka wodna | Kamień 2 / Kamień 2 | OK | 36 vs 72 | 72 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 8 | handel | Handel | Brąz 5 / Brąz 5 | OK | 148 vs 296 | 296 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 9 | hutnictwo_zelaza | Hutnictwo żelaza | Brąz 6 / Brąz 6 | OK | 240 vs 480 | 480 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 10 | inzynieria | Inżynieria | Żelazo 7 / Żelazo 7 | OK | 260 vs 520 | 520 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 11 | jezdziectwo | Jeździectwo | Brąz 4 / Brąz 4 | OK | 112 vs 224 | 224 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 12 | kodeks | Kodeks | Brąz 5 / Brąz 5 | OK | 124 vs 248 | 248 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 13 | ko_o | Koło | Kamień 3 / Kamień 3 | OK | 44 vs 88 | 88 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 14 | owiectwo | Łowiectwo | Kamień 1 / Kamień 1 | OK | 5 vs 5 | 5 | 1 | OK | OK | OK | OK | OK | OK | OK | OK | ZGODNE |
| 15 | ucznictwo | Łucznictwo | Kamień 3 / Kamień 3 | OK | 28 vs 56 | 56 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 16 | matematyka | Matematyka | Brąz 5 / Brąz 5 | OK | 136 vs 272 | 272 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 17 | medycyna | Medycyna | Żelazo 8 / Żelazo 8 | OK | 324 vs 648 | 648 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 18 | mistycyzm | Mistycyzm | Kamień 2 / Kamień 2 | OK | 20 vs 40 | 40 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 19 | murarstwo | Murarstwo | Kamień 2 / Kamień 2 | OK | 28 vs 56 | 56 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 20 | obleznictwo | Oblężnictwo | Żelazo 7 / Żelazo 7 | OK | 280 vs 560 | 560 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 21 | obrobka_drewna | Obróbka drewna | Kamień 1 / Kamień 1 | OK | 5 vs 5 | 5 | 1 | OK | OK | OK | OK | OK | OK | OK | OK | ZGODNE |
| 22 | obrobka_zelaza | Obróbka żelaza | Żelazo 9 / Żelazo 9 | OK | 370 vs 740 | 740 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 23 | oswojenie_zwierzat | Oswojenie zwierząt | Kamień 1 / Kamień 1 | OK | 5 vs 5 | 5 | 1 | OK | OK | OK | OK | OK | OK | OK | OK | ZGODNE |
| 24 | pismo | Pismo | Brąz 4 / Brąz 4 | OK | 90 vs 180 | 180 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 25 | prawo | Prawo | Żelazo 8 / Żelazo 8 | OK | 310 vs 620 | 620 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 26 | religia | Religia | Brąz 4 / Brąz 4 | OK | 96 vs 192 | 192 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 27 | rolnictwo | Rolnictwo | Kamień 1 / Kamień 1 | OK | 5 vs 5 | 5 | 1 | OK | OK | OK | OK | OK | OK | OK | OK | ZGODNE |
| 28 | sztuka_wojenna | Sztuka wojenna | Żelazo 9 / Żelazo 9 | OK | 400 vs 800 | 800 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 29 | waluta | Waluta | Brąz 6 / Brąz 6 | OK | 200 vs 400 | 400 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 30 | wojskowosc | Wojskowość | Brąz 4 / Brąz 4 | OK | 104 vs 208 | 208 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 31 | wymiana | Wymiana | Kamień 2 / Kamień 2 | OK | 32 vs 64 | 64 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |
| 32 | zegluga | Żegluga | Brąz 4 / Brąz 4 | OK | 80 vs 160 | 160 | 2 | OK | OK | OK | OK | OK | OK | OK | OK | NIEZGODNE (koszt) |

<!-- PODSUMOWANIE: ZGODNE=4 ['owiectwo', 'obrobka_drewna', 'oswojenie_zwierzat', 'rolnictwo']; NIEZGODNE=28; NIEDOPASOWANE=[] -->

## Ustalenia

1. **RT-1 — koszt badań, 28 haseł (kierunek: `tech.json` jest źródłem prawdy).**
   - Wszystkie 28 rozjazdów kosztu to ratio 2 (wiki = 1/2 JSON). 4 tier-1 (Łowiectwo, Obróbka drewna, Oswojenie zwierząt, Rolnictwo) mają ratio 1 i są ZGODNE.
   - Dowód semantyki: `tech.json` `tempo_gry._opis` = „Bazowe 'Koszt nauki' w JSON = koszt przy tempie Szybka (x1)". Nagłówek `tech-tempo.ts`: „NIE zmienia to bazowych kosztow w tech.json — to tryb szybki (x1.0)". Runtime: `difficulty-cost.ts` `scaledResearchCost(baseCost, tempo)` wywołuje `applyTempoKoszt(baseCost, tempo)`, gdzie `baseCost` to wartość z JSON; przy tempie szybka wynik = wartość JSON. Wiki („220 PN (baza, tempo Szybka)") opisuje więc koszt, którego gra nie stosuje.
   - Historia pinu: commit `ab75bb4f` (2026-08-29, przodek `edb8fb56`, sprawdzone `git merge-base --is-ancestor`) — komunikat „podwojenie Koszt nauki dla 28 technologii (Q1)"; zmienia wyłącznie `gra/data/tech.json`, 28 pól, tier 1 bez zmian. Zmiana w JSON jest celowa i udokumentowana.
   - Rozbieżność wiki: bundle `generated` = 2026-09-05, czyli PO commicie `ab75bb4f`, a mimo to pokazuje wartości sprzed podwojenia. Mechanizm generatora (stare dane wejściowe czy inny zrzut) pozostaje nieustalony. Nieustalony jest wyłącznie mechanizm rozjazdu wiki; przyczyna zmiany JSON jest udokumentowana.
   - Zastrzeżenie: docstring parametru `bazowyKoszt` w `tech-tempo.ts` mówi „(bazowe, dla trybu standardowego)" — sprzeczne z nagłówkiem tego samego pliku, z `tempo_gry._opis` i z zachowaniem `applyTempoKoszt`. Ta jedna linia nie rozstrzyga sporu; rozstrzyga zachowanie runtime (powyżej).
   - Korekta wiki należy do osobnej decyzji (poza zakresem Operatora; `gra/**` read-only).
2. **Astronomia — sprzeczny prereq (UWAGA).** Pole „Wymaga (prereq)" w JSON i wiki = Matematyka + Religia (zgodne ze sobą; czyta je runtime, `playerState.ts` linie 34, 181). Uwagi w JSON i wiki zawierają „prereq Matematyka+Mistycyzm". Do decyzji, która wersja jest obowiązująca; pól nie zmieniano.
3. **Waluta — wymóg w Uwagach (UWAGA).** Pole „wymagany budynek" = null (JSON i wiki zgodnie). Uwagi (JSON i wiki) podają: Mennica wymaga dostępu do Złota (Kopalnia złota) i Targowiska w mieście. Brak strukturalnego pola dla tego wymogu.
4. **Oblężnictwo — jednostki w Uwagach (UWAGA).** Pola odblokowań (JSON i wiki) = Katapulta. Uwagi wymieniają też Taran i Wieżę oblężniczą („weryfikacja przez UNITS"). Wieża oblężnicza jest w polu Brązownictwa (JSON i wiki zgodnie). Taran nie występuje w żadnym polu odblokowań technologii.

## Lista niedokończonych

Brak. Wszystkie 32 hasła mają status z dowodem w tabeli powyżej (pola porównane skryptem; jeden wiersz = jedno hasło).

## Zakres zmian

- Nowy plik: `dyspozycje/rust-port/p1/P1-16F-TECHNOLOGIE.md` (ten dokument).
- Katalog runu: `dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1/` (skrypt, wyniki, raport Operatora).
- Nie zmieniano `gra/**`, innych plików `P1-16*`, `LEDGER.md` ani `GOAL-*`. Brak commita.
