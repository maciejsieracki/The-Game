# TARGOWISKO-NETTO-PODATEK (tag TAXNET, temat R-WEB-TAX-NET-DECOMPOSE-Q1) — rozkład 20 Podatku na składniki

Data: 2026-11-27. Baza kodu: `3218654a1f8203a3ecf57b2efdb6127915efa355` (origin/main).
Zakres: analiza kodu i arytmetyka. Zero zmian w `gra/src/**` i `gra/data/**`.
Źródło pomiaru: VLIVE3 (`dyspozycje/analizy/VERIFY-LIVE-3-2026-11-27.md`, dane `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/vlive3-targowisko-1tura-max-stdout.txt`).

## 1. Pytanie

Zamiana 100 Żywności na Podatek w Targowisku (kurs 0,2) daje 20 w kolejce podatku. Po jednej turze skarbiec gracza
rośnie o 6 (ramię B 0 → 7, ramię A 0 → 1 bez zamiany). Pytanie: co składa się na te 20, czy 6 wynika z wzoru zgodnego z intencją.

## 2. Wzór (kod)

Kolejność w `gra/src/game/economy.ts` (funkcja `cityYieldPerTurn`) i `gra/src/game/turn-economy.ts`:

1. Podatek ręczny (`additionalTax`, z zamiany Pracy/Żywności) dodawany do bazy handlu PO premiach tras i mnożniku handlu,
   PRZED korupcją: `economy.ts:980` (`handelBrutto += Math.max(0, ctx.additionalTax ?? 0)`).
2. Mnożnik ściągalności podatków administratora (×1,00 gdy brak administratora), przed korupcją.
3. Korupcja: `strata = min(strataBazowa × (1 − redukcjaBudynków), korupcjaCap)` (`economy.ts:991`).
   `strataBazowa = dystans × korupcja_wspolczynnik_dystansu + liczba_miast × korupcja_wspolczynnik_miast`, cap w %.
   Stolica ma dystans 0 (`turn-economy.ts`, `dystansOdStolicy`).
4. Mennica: mnożnik `mennicaMnoznikForCiv` tylko gdy `walutaOdkryta` i `maMennica` (`economy.ts:994`). W tym pomiarze Mennicy nie ma: ×1,00.
5. Podział suwakiem `splitHandelLargestRemainder(handelNetto, podziałHandlu)` (`economy.ts:1008`, `cities.ts:631`):
   pula zaokrąglana w dół do pełnych jednostek, potem metoda największych reszt na trzy strumienie:
   Nauka / Pieniądz (= Skarb) / Luksus (= Zamożność).
6. Skarb = strumień Pieniądz. Zamożność = Luksus, trafia do stanu Wealth (`advanceWealth`, `turn-economy.ts:3087`),
   nie do skarbca w tej samej turze. Mnożnik Wealth stosowany do Skarbu z `prevWealth` (`turn-economy.ts:3102`).

Wartości z `gra/data/econ-params.json` (trzy poziomy trudności, hard = poziom maksymalny):

| Parametr | easy | normal | hard | Uwaga |
|---|---|---|---|---|
| `suwak_handel_nauka_domyslnie` | 60 | 60 | 60 | udział Nauki w Podatku |
| `suwak_handel_pieniadz_domyslnie` | 30 | 30 | 30 | udział Skarbu w Podatku |
| `suwak_handel_luksus_domyslnie` | 10 | 10 | 10 | udział Zamożności w Podatku |
| `korupcja_wspolczynnik_miast` | 0,5 | 0,5 | 1 | pkt proc. na miasto |
| `korupcja_wspolczynnik_dystansu` | 0,5 | 1 | 1,5 | pkt proc. na pole od stolicy |
| `korupcja_cap` | 38 | 50 | 62 | % w jednym mieście |
| `targowisko_zywnosc_na_podatek_kurs` | 0,2 | 0,2 | 0,2 | kurs zamiany |

Dodatkowo mnożnik Mennicy hard ×1,38 (`mennica_mnoznik_po_walucie`), aktywny tylko z Mennicą w stolicy i dostępem do Złota.

## 3. Rozkład 20 (warunki pomiaru: hard, jedno miasto = stolica, Targowisko, bez Mennicy, bez Wealth)

Liczby dla samej kolejki 20 (w izolacji od puli bazowej):

| Krok | Wartość | Źródło |
|---|---|---|
| Podatek ręczny w puli | 20,00 | `additionalTax` = 100 × 0,2 |
| Korupcja: 1 miasto × 1 pkt = 1% (stolica, dystans 0) | −0,20 | `korupcja_wspolczynnik_miast` hard |
| Pula po korupcji | 19,80 | |
| Zaokrąglenie puli w dół do pełnych jednostek | −0,80 | `splitHandelLargestRemainder` (`floor(pool)`) |
| Pula podzielona | 19 | |
| **Nauka** 60% | **11** | strumień Nauki (BADANIA) |
| **Skarb (Pieniądz)** 30% | **6** | strumień Skarbu, tu zmierzony przyrost |
| **Zamożność (Luksus)** 10% | **2** | stan Wealth, nie skarbiec w tej turze |
| Suma składników | 19 | 20 − 19 = 1 utracone (0,2 korupcja + 0,8 zaokrąglenie) |

Wariant z 0% korupcji (np. stolica z Sądem lub Pałacem, redukcja −30 pkt na budynek): pula 20, Skarb = 6,00 dokładnie.
Wynik Skarbu jest więc 6 w obu wariantach. Nie zależy od tego, czy stolica ma Sąd/Pałac.

Porównanie z pomiarem:

- Zmierzone B − A = 7 − 1 = 6 (`deltaTreasuryB_minus_A`: 6; `expectedTax`: 20).
- Model: Skarb z kolejki 20 = 6 (izolowanie) lub 6 (z korupcją 1%, zaokrąglenie łącznie z bazą).
- Uwaga: wartość A = 1 pochodzi z puli bazowej gracza, której nie rozbijano. Pula bazowa i pula z podatkiem łączą się
  przed zaokrągleniem `floor` i podziałem. Dlatego 6 z modelu izolowanego jest zgodne z pomiarem, ale nie jest dowodem
  rozkładu pomiaru składnik po składniku. Zob. sekcja 5.

## 4. Porównanie z intencją (dokumentacja i kod)

- `economy.ts:942–944` (komentarz w kodzie): „Manual Work tax is added after local and route-only gross modifiers ... then follows
  the ordinary corruption, Mint and slider stages.” Podatek ręczny ma przechodzić przez zwykłą korupcję, Mennicę i suwaki.
- `work-tax.ts:63` (dokument modułu): „Podatek NIE trafia 1:1 do Skarbca: silnik stosuje korupcje, Mennice, suwak i mnoznik
  Zamoznosci”. Ten sam wniosek, zapisany wprost.
- `work-tax.ts:83` (komunikat gracza): „+X do Skarbca, +Y do Nauki (wartości z silnika: po korupcji i Mennicy, wg suwaka
  Podatek/Nauka/Zamożność stolicy)”. Gracz widzi, że wynik zależy od suwaka.
- `econ-params.json` (opis Skarbu): udział Pieniądza (= SKARB) w Daninie netto domyślnie 30%, decyzja właściciela
  2026-11-14 (R-WEB-SETTINGS-DEFAULT-TAX-SPLIT-30-60-10-Q1).
- `econ-params.json` (opis kursu): „ręcznej, jednorazowej zamiany Żywności z zapasu imperium na Podatek: 0,2 Podatku za
  1 Żywności (decyzja właściciela 2026-11-19, A)”. Decyzja dotyczy kursu, nie tego, dokąd trafia Podatek.

Wniosek: 20 → 6 jest zgodne z wzorem i z udokumentowaną intencją. Podatek ręczny nie jest zapisany jako strumień bezpośredni
do Skarbu. Przechodzi przez suwak domyślny 60/30/10, a 6 = 30% z 20 po korupcji i zaokrągleniu.
Nie wykryto rozjazdu dokumentacji z kodem.

## 5. Zależność od poziomu, epoki i stawek (z kodu, NIE ZMIERZONO poza hard)

- Zmierzono: tylko hard (Trudny), suwaki domyślne 60/30/10, Targowisko, jedno miasto, bez Mennicy.
- Mennica (hard ×1,38, po warunku Waluty i Złota) mnoży całą pulę przed podziałem. Skarb z tej samej kolejki 20 wyniósłby
  ok. 20 × 0,99 × 1,38 × 0,30 ≈ 8,2 (wyliczenie, NIE ZMIERZONO).
- Suwak Skarbu wyższy (np. 60%, zamiast 30%) podniósłby Skarb z 20 do ok. 11 przy tej samej korupcji (60% z 19 po zaokrągleniu) (wyliczenie, NIE ZMIERZONO).
- Zamożność (10%) trafia do stanu Wealth. Od następnej tury mnożnik Wealth może zwiększać Skarb. Nie zmierzono (wymagałby hak odczytu `wealthState`).
- Epoka i kurs: kurs 0,2 jest identyczny dla easy/normal/hard. Korupcja różni się tylko o 0,5 pkt na miasto i na pole.
  Dla jednego miasta różnica między poziomami to ≤ 0,2 jednostki kolejki (wyliczenie).

## 6. Co zostało NIE ZMIERZONE i dlaczego

- Rozkład 20 na Nauka 11 / Skarb 6 / Zamożność 2 z żywej gry: NIE ZMIERZONO. Runner VLIVE3 odczytuje tylko skarbiec,
  rezerwę i kolejkę. Do odczytu składników Nauki i Wealth trzeba haka odczytu `__settingsLive` (np. ostatnia tura
  `result.perCity[].nauka` i `wealthState`). Haka nie dodano: zasada zakazu zmian w `gra/src` i wymóg decyzji przy haku odczytu.
- Pula bazowa gracza (A = +1) nie została rozbita. Stąd różnica 6 jest zgodna z modelem, a nie wyprowadzona z pomiaru składników.
- Poziomy inne niż hard i Mennica: NIE ZMIERZONO (wyliczenia z kodu w sekcji 5).
- Dwa biegi live i runner `taxnet-decompose-live.cjs`: NIE URUCHOMIONO. Ten temat ograniczył się do analizy kodu i arytmetyki.

## 7. Do decyzji orkiestratora (nie rozstrzygam)

DECISION_REQUIRED (jedno zdanie, skutek dla gracza): Czy Żywność zamieniona na Podatek ma trafiać do Skarbu zgodnie z suwakiem
(dziś 30% z 20 = 6 w tej turze, reszta do Nauki i Zamożności), czy mieć osobny, stały udział bezpośrednio do Skarbu?
Wariant A (dziś): Skarb dostaje część zgodną z suwakiem, Nauka i Zamożność resztę; gracz widzi to w komunikacie.
Wariant B: Skarb dostaje większy stały udział z zamiany, Nauka i Zamożność mniej z tej zamiany.
Obie wersje wymagają ustalenia skutku testowego (testy podatku ręcznego w `gra/src`).

Rekomendacja operatora: pozostawić wariant A jako zgodny z kodem i dokumentacją. Pytanie o zmianę jest decyzją o grze, nie błędem.
