# R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1 — obrona Operatora (runda 2, Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja i model; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1
GOAL: usunąć niepodparte wnioski z dokumentu KOSZTY-JEDNOSTEK-STAN-2026-11-20.md i naprawić model Spichlerza (racje, armia) względem zarzutów Evaluatora z abe6646380dc52d6f142a2d893a995bf3bc302b2.
BAZA: 3f7776fc57c3bf5fe22ff33d6ffdbe3b292527c5 (kandydat rundy 1).

## Odpowiedzi na zarzuty

1. **PRZYJMUJĘ.** Rekomendacja A w §6 opierała się na armii 10 jednostek i ignorowała wrażliwość z §4. Poprawiono §4 (wniosek: netto zależy od składu armii; dla puli 376 w Brązie netto −740) oraz §6 A (rekomendacja A uzasadniona brakiem danych, bez twierdzenia „skarbiec nie jest ciasny”). Dowód: wyjście `treasury-unit-cost-model.cjs` sekcja 3: 1550 − 786 − 240 = 524 (armia 10) oraz tabela wrażliwości 752/1504/3008 → netto 12/−740/−2244.

2. **PRZYJMUJĘ.** Wiersz „312 → 320” porównywał różne armie. Wiersz w §5 zastąpiono opisem: 312 = stare wzory, ok. 26 jednostek po 12/t; 320 = 10 × Brąz po 32/t; ta sama armia 26 × Włócznik w nowych wzorach = 26 × 32 = 832/t (skład zrzutu NIE_ZMIERZONO). Wynik `food-granary-model.cjs`: `armia zrzutu w nowych wzorach (26 × Włócznik Brąz own Normalny) = 832`.

3. **PRZYJMUJĘ.** `food-granary-model.cjs` używał stałej racji 1046 i armii 10 jednostek. Zmiany w modelu:
   - racje przeskalowane: `consNow = round(1046 × m(2) / 1,5)` = 1395/t, gdzie m(2) = `citizenConsumptionEraMultiplier(2)` z kodu (ZMIERZONO), 1,5 = stary mnożnik zrzutu;
   - dodana druga armia: „armia zrzutu” = 832/t (NIE_ZMIERZONO skład), obok armii 10 × Brąz = 320/t;
   - symulacja V0–V3 liczona dla obu armii (kolumna „armia”).
   Wynik (zapas 54 000 cap): V0 osiąga cap w 16 turze (armia 10) lub 22 (armia zrzutu), netto/t 1648 lub 1136 (poprzednio 13 tur, netto 1997). Doc §5 zaktualizowany tym wynikiem. Prognozy V0–V3 opisane jako propozycje.

4. **PRZYJMUJĘ.** Kurs żywność → Podatek 0,2 odczytany z `gra/data/econ-params.json`, klucz `targowisko_zywnosc_na_podatek_kurs`, pole `normal` = 0,2 (ZMIERZONO odczytem pliku danych). Wiersz w §5 zmieniony.

## Dodatkowe poprawki (wynik własnej kontroli)

- Etykieta wariantu V0 w `food-granary-model.cjs` poprawiona z „armia real” na „bez zmian produkcji (produkcja zrzutu 3363/t)”.
- Usunięto martwą stałą `DUMP_ARMY_OLD_PER_UNIT`; komentarz przy `DUMP_ARMY_UNITS_OLD` opisuje 26 × 12 = 312.

## ZMIERZONO (surowe wyjście, bramki)

- `npm ci --ignore-scripts` w gra/: exit 0 (57 pakietów w node_modules; po sprawdzeniu `df -h /`: 5,7 GB wolne przed instalacją).
- `node gra/tools/treasury-unit-cost-model.cjs`: exit 0. Sekcja 3: `wpływy brutto 1550 − budynki 786 − utrz. jednostek (10 × Brąz, Normalny) 240 = netto 524 ¤/turę`; sekcja 1 Falanga Nm rekrutacja 288, utrzymanie 64, żywność own/obóz/poza 128/64/256 (bez zmian względem rundy 1).
- `node gra/tools/food-granary-model.cjs`: exit 0. Sekcja 3: `cap = 54000`, `racje ... = 1395/t`, `armia 10 × Brąz = 320`, `armia zrzutu = 832`, `netto/t po przeskalowaniu: armia 10 × Brąz = 1648; armia zrzutu = 1136`, `tury do capu (netto zrzutu, stare wzory): 13`.
- `git diff --check`: bez wyjścia (czysto).
- Zakres zmian: 2 pliki modeli/dokumentu z allowlisty (`gra/tools/food-granary-model.cjs`, `dyspozycje/analizy/KOSZTY-JEDNOSTEK-STAN-2026-11-20.md`) oraz ten raport. Brak zmian w gra/src, gra/data, WERSJE.md.

## NIE_ZMIERZONO

- Skład armii w zrzucie (376 utrzymania, 312 żywności) i moment zrzutu.
- Dekompozycja capu 54 000 (10 I + 11 II to założenie).
- Różnica 388 vs 345 (netto panelu) w zrzucie.
- Skład populacji miast (przeskalowanie racji zakłada, że 1046 odpowiada m = 1,5).
- Realne zużycie w grze (pomiar VERIFY-LIVE, #38).

## BLOKADY

brak

## RUNDY

2/5 (obrona po FAIL/PASS-WITH-NOTES rundy 1; zarzuty przyjęte bez odrzucenia).

## UWAGI-DLA-ORKIESTRATORA

- Pytanie ABC A w §6 nadal wymaga decyzji właściciela; rekomendacja A jest teraz uzasadniona brakiem danych, nie wynikiem modelu.
- Stare dokumenty (SKARBIEC-BRAZ-…, ZYWNOSC-SPICHLERZ-…) nie zostały zmienione w tej rundzie; nagłówki NIEAKTUALNE z rundy 1 pozostają.

## NASTĘPNY KROK

Final Control (Sonnet 5.5) na czubku commita obrony; następnie integracja orkiestratora po werdykcie.

## DEPLOY/PUSH: NIE WYKONANO
