# TARGOWISKO-NETTO-PODATEK (tag TAXNET, temat R-WEB-TAX-NET-DECOMPOSE-Q1) — rozkład 20 Podatku na składniki

Data: 2026-11-27. Baza kodu: `3218654a1f8203a3ecf57b2efdb6127915efa355` (origin/main), kod obrony: `c4cbac45a`.
Zakres: analiza kodu i arytmetyka. Zero zmian w `gra/src/**` i `gra/data/**`.
Źródło pomiaru: VLIVE3 (`dyspozycje/analizy/VERIFY-LIVE-3-2026-11-27.md`, dane `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/vlive3-targowisko-1tura-max-stdout.txt`).
Wersja 2 (runda obrony 2/5): poprawiono błędy opisu Wealth, dopisano brakujące czynniki, doprecyzowano zakres wyniku i oznaczenia NIE ZMIERZONO. Odpowiedzi na zarzuty Evaluatora: §8.

## 1. Pytanie

Zamiana 100 Żywności na Podatek w Targowisku (kurs 0,2) daje 20 w kolejce podatku. Po jednej turze skarbiec gracza
rośnie o 6 (ramię B 0 → 7, ramię A 0 → 1 bez zamiany). Pytanie: co składa się na te 20, czy 6 wynika z wzoru zgodnego z intencją.

## 2. Wzór (kod)

Kolejność w `gra/src/game/economy.ts` (funkcja `cityYieldPerTurn`) i `gra/src/game/turn-economy.ts`:

1. Podatek ręczny (`additionalTax`, z zamiany Pracy/Żywności) dodawany do bazy handlu PO premiach tras i mnożniku handlu,
   PRZED korupcją: `economy.ts:980` (`handelBrutto += Math.max(0, ctx.additionalTax ?? 0)`). Mnożnik handlu z macierzy
   (`eko_handel_brutto_proc`) działa wcześniej, więc na podatek ręczny nie wpływa.
2. Mnożnik ściągalności podatków administratora (×1,00 gdy brak administratora), przed korupcją.
3. Korupcja: `strata = min(strataBazowa × (1 − redukcjaBudynków), korupcjaCap)` (`economy.ts:991`).
   `strataBazowa = corruptionRate(dystans, liczba_miast)` (`economy.ts:1257-1266`): `dystans × korupcja_wspolczynnik_dystansu + liczba_miast × korupcja_wspolczynnik_miast`, w %, cap.
   Stolica ma dystans 0 (`turn-economy.ts:3020-3030`). W pomiarze: 1 miasto × 1 pkt = 1%.
4. Mennica: mnożnik `mennicaMnoznikForCiv` tylko gdy `walutaOdkryta` i `maMennica` (`economy.ts:994`). W tym pomiarze Mennicy nie ma: ×1,00.
5. Podział suwakiem `splitHandelLargestRemainder(handelNetto, podziałHandlu)` (`economy.ts:1008`, `cities.ts:631`):
   pula zaokrąglana w dół do pełnych jednostek, potem metoda największych reszt na trzy strumienie:
   Nauka / Pieniądz (= Skarb) / Luksus (= Zamożność).
5a. Mnożniki macierzy cywilizacji (`eko_pieniadz_proc`, `eko_korupcja_proc`, `eko_handel_brutto_proc`) mają formułę
   `mul_proc` = `base × (1 + val)` (`civ-matrix.ts:110-130`). Dla Rzymian wszystkie trzy wynoszą 0 (`civ-matrix.json:818-826`),
   czyli ×1 (neutralne). Pominięcie ich w modelu nie zmienia wyniku dla tej cywilizacji.
   Dochód z tras (`pieniadzZTras`, `turn-economy.ts:3103`) idzie do Skarbu osobno i jest identyczny w ramionach A i B,
   więc znika w różnicy B − A.
6. Skarb = strumień Pieniądz × mnożnik Wealth z TEGO SAMEGO ticku: `pieniadzPoWealth = Math.floor(yld.pieniadz × wt.mnoznik)`,
   gdzie `wt = advanceWealth(prevWealth, yld.luksus, yld.pieniadz, ...)` (`turn-economy.ts:3087-3102`).
   Mnożnik NIE pochodzi więc wprost z `prevWealth`, lecz z wyniku `advanceWealth` (poprzedni stan + luksus i pieniądz bieżącej tury).
   Zamożność (Luksus) wchodzi do puli Wealth (`pula`), nie do skarbca w tej turze.
   Awans poziomu wymaga `pula ≥ progNaPoziom × (L+1) × epoka` (`wealth.ts:177-179`), `progNaPoziom = 4,5` (`wealth.ts:81`;
   w `gra/data/*.json` nie znaleziono nadpisania). Świeży stan to poziom 1 i mnożnik ×1 (`wealth.ts:133-135`, `freshWealthState`).
   W mierzonej turze pula po ticku wynosi kilka jednostek, czyli mniej niż próg 9 (4,5 × 2 × epoka ≥ 9),
   więc awansu nie ma i Skarb = Pieniądz bez mnożnika (×1). Od kolejnych tur Wealth może już mnożyć Skarb (nie zmierzono).

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

Mennica hard ×1,38 (`mennica_mnoznik_po_walucie`, `econ-params.json:648`). Wartość per cywilizacja NIE SPRAWDZONA w tej rundzie.

## 3. Rozkład 20 (warunki pomiaru: hard, jedno miasto = stolica, Targowisko, bez Mennicy, Wealth ×1 w turze)

Liczby dla samej kolejki 20 (model izolowany, bez puli bazowej):

| Krok | Wartość | Źródło |
|---|---|---|
| Podatek ręczny w puli | 20,00 | `additionalTax` = 100 × 0,2 |
| Korupcja: 1 miasto × 1 pkt = 1% (stolica, dystans 0) | −0,20 | `korupcja_wspolczynnik_miast` hard |
| Pula po korupcji | 19,80 | |
| Zaokrąglenie puli w dół do pełnych jednostek (łącznie z bazą) | −0,80 | `splitHandelLargestRemainder` (`floor(pool)`) |
| Pula podzielona (izolowanie) | 19 | |
| **Nauka** 60% | **11** | strumień Nauki (BADANIA) |
| **Skarb (Pieniądz)** 30% | **6** | strumień Skarbu, tu zmierzony przyrost |
| **Zamożność (Luksus)** 10% | **2** | stan Wealth (pula), nie skarbiec w tej turze |
| Suma składników | 19 | 20 − 19 = 1 utracone (0,2 korupcja + 0,8 zaokrąglenie) |

Zakres wyniku dla Skarbu (wyliczenie, nie pomiar): pula B = pula A + 19,80 rzeczywistych jednostek, a liczba całkowita puli
zmienia się o 19 lub 20 w zależności od części ułamkowej puli bazowej A (nieznanej). Przy suwaku 30% i metodzie
największych reszt Skarb z tej różnicy wynosi 5, 6 albo 7. Wynik 6 mieści się w tym zakresie, ale nie jest z niego wyprowadzony.

Wariant z 0% korupcji (np. stolica z Sądem lub Pałacem, redukcja −30 pkt na budynek, §5): pula 20, Skarb = 6,00 dokładnie
w modelu izolowanym. Wynik Skarbu nie zależy istotnie od tego, czy stolica ma Sąd/Pałac.

Porównanie z pomiarem:

- Zmierzone B − A = 7 − 1 = 6 (`deltaTreasuryB_minus_A`: 6; `expectedTax`: 20).
- Model: Skarb z kolejki 20 = 6 (izolowanie) lub 5–7 (różnica dwóch puli z zaokrągleniem). Zgodne, ale nie rozbite na składniki.
- Wartość A = 1 pochodzi z puli bazowej gracza, której NIE ROZBITO na składniki. Stąd 6 nie jest dowodem rozkładu pomiaru.

## 4. Porównanie z intencją (dokumentacja i kod)

- `economy.ts:956-958` (komentarz w kodzie): „Manual Work tax is added after local and route-only gross modifiers ... then follows
  the ordinary corruption, Mint and slider stages.” Podatek ręczny ma przechodzić przez zwykłą korupcję, Mennicę i suwaki.
- `work-tax.ts:63` (dokument modułu): „Podatek NIE trafia 1:1 do Skarbca: silnik stosuje korupcje, Mennice, suwak i mnoznik
  Zamoznosci” (zmierzone live: 20 000 Podatku → ok. +20 900 Skarbca). Ten sam wniosek, zapisany wprost. Wpływ Zamożności
  na Skarb dotyczy kolejnych tur (wielokrotne ticki Wealth), nie pierwszej tury.
- `work-tax.ts:83` (komunikat gracza): „+X do Skarbca, +Y do Nauki (wartości z silnika: po korupcji i Mennicy, wg suwaka
  Podatek/Nauka/Zamożność stolicy)”. Gracz widzi, że wynik zależy od suwaka.
- `econ-params.json` (opis Skarbu): udział Pieniądza (= SKARB) w Daninie netto domyślnie 30%, decyzja właściciela
  2026-11-14 (R-WEB-SETTINGS-DEFAULT-TAX-SPLIT-30-60-10-Q1).
- `econ-params.json` (opis kursu): „ręcznej, jednorazowej zamiany Żywności z zapasu imperium na Podatek: 0,2 Podatku za
  1 Żywności (decyzja właściciela 2026-11-19, A)”. Decyzja dotyczy kursu, nie tego, dokąd trafia Podatek.

Wniosek: 20 → 6 jest ZGODNE Z MODELEM kodu (zakres 5–7) i z udokumentowaną intencją (podatek przez suwak). Nie wykryto rozjazdu
dokumentacji z kodem. Rozkład 11/6/2 jest wyliczeniem z kodu, NIE ZMIERZONYM składnikiem w grze.

## 5. Zależność od poziomu, epoki i stawek (z kodu, NIE ZMIERZONO poza hard)

- Zmierzono: tylko hard (Trudny), suwaki domyślne 60/30/10, Targowisko, jedno miasto, bez Mennicy.
- Redukcja korupcji budynkami: Sąd, Pretorium, Pałac (I–III) i Trybunał, każdy −30 pkt proc. na stratę bazową, sufit 0,60
  (`economy.ts:1275` `KORUPCJA_REDUKCJA_NA_BUDYNEK = 0,30`; `economy.ts:1283` `KORUPCJA_REDUKCJA_SUFIT = 0,60`). Wartość
  sprawdzona w kodzie. Efekt na 20: stolica bez budynków traci 1% (−0,20); z Sądem strata 1% × (1 − 0,30) = 0,7% (−0,14).
  Różnica między wariantami na Skarbie jest rzędu 0,1–0,2 jednostki przed zaokrągleniem. NIE ZMIERZONO w żywej grze.
- Mennica (hard ×1,38 globalnie, per cywilizacja może się różnić; po warunku Waluty i Złota) mnoży całą pulę przed podziałem.
  Skarb z kolejki 20 wyniósłby ok. 20 × 0,99 × 1,38 × 0,30 ≈ 8,2 (wyliczenie z wartością globalną, NIE ZMIERZONO).
- Suwak Skarbu 60% zamiast 30% (Nauka 30%, Zamożność 10%) przy tej samej korupcji: pula 19 → Skarb 11 (60% z 19 = 11,4,
  reszty w metodzie największych reszt) (wyliczenie, NIE ZMIERZONO).
- Zamożność (10%) trafia do stanu Wealth. Od następnej tury mnożnik Wealth może zwiększać Skarb (nie zmierzono,
  wymaga haka odczytu `wealthState`).
- Epoka i kurs: kurs 0,2 jest identyczny dla easy/normal/hard. Korupcja różni się tylko o 0,5 pkt na miasto i na pole.
  Dla jednego miasta różnica między poziomami to ≤ 0,2 jednostki kolejki (wyliczenie).

## 6. Co zostało NIE ZMIERZONE i dlaczego

- Rozkład 20 na Nauka 11 / Skarb 6 / Zamożność 2 z żywej gry: NIE ZMIERZONO. Runner VLIVE3 odczytuje tylko skarbiec,
  rezerwę i kolejkę. Hak `ownerRatesLive` zwraca 4 / 8,8 w obu ramionach (dane VLIVE3, linie „rates”), czyli NIE odzwierciedla
  podatku w kolejce i nie służy do rozkładu. Do odczytu składników Nauki i Wealth potrzebny jest NOWY hak odczytu
  (np. `result.perCity[].nauka`, `wealthState`) w `__settingsLive`. Hak nie został dodany: dispatch zakazuje zmian w `gra/src`
  bez decyzji orkiestratora (DECISION_REQUIRED, §7).
- Pula bazowa gracza (A = +1) nie została rozbita. Stąd 6 jest zgodne z modelem (zakres 5–7), a nie wyprowadzone z pomiaru składników.
- Poziomy inne niż hard, Mennica i suwaki inne niż domyślne: NIE ZMIERZONO (wyliczenia z kodu w §5). Nie wykonano
  dodatkowych biegów live: każdy wymaga nowego uruchomienia przeglądarki i nowego haka odczytu (§7).
- Dwa biegi live (VLIVE3 A/B) w tej rundzie NIE URUCHOMIONO. Dane pochodzą z VLIVE3 (dane w runs/R-WEB-VERIFY-LIVE-3-Q1).
- Przerwany bieg ON w turze 12 (endTurnInProgress, VLIVE3) jest poza zakresem tej analizy.

## 7. Do decyzji orkiestratora (nie rozstrzygam)

DECISION_REQUIRED (jedno zdanie, skutek dla gracza): Czy Żywność zamieniona na Podatek ma trafiać do Skarbu zgodnie z suwakiem
(dziś 30% z 20 = około 6 w tej turze, reszta do Nauki i Zamożności), czy mieć osobny, stały udział bezpośrednio do Skarbu?
Wariant A (dziś): Skarb dostaje część zgodną z suwakiem, Nauka i Zamożność resztę; gracz widzi to w komunikacie.
Wariant B: Skarb dostaje większy stały udział z zamiany, Nauka i Zamożność mniej z tej zamiany.
Obie wersje wymagają ustalenia skutku testowego (testy podatku ręcznego w `gra/src`).

Zgoda na NOWY hak odczytu (test-only, pod `?civTest=1`, bez wpływu na grę) jest osobną decyzją orkiestratora. Bez niej rozkład
składników w grze pozostaje NIE ZMIERZONY.

Rekomendacja operatora: pozostawić wariant A jako zgodny z kodem i dokumentacją. Pytanie o zmianę jest decyzją o grze, nie błędem.

## 8. Odpowiedzi na zarzuty Evaluatora (runda obrony 1)

1. PRZYJMUJĘ. Nie utworzono `gra/tools/taxnet-decompose-live.cjs` ani nie wykonano nowego biegu live. Składniki Nauki
   i Zamożności nie zostały zmierzone. Powód: brak haka odczytu, a dispatch zakazuje zmian w `gra/src` bez decyzji (§6, §7).
2. PRZYJMUJĘ. Pomiary na 2–3 ustawieniach stawek lub epok nie zostały wykonane. Runner VLIVE3 ma zakodowane parametry
   maksymalne; zmiana wymaga nowych biegów. Hak `ownerRatesLive` nie pokazuje wpływu podatku (4 / 8,8 w obu ramionach),
   więc nie był użyteczny do rozkładu.
3. PRZYJMUJĘ. Wersja 1 błędnie opisywała źródło mnożnika Wealth (§2.6). Poprawiono: mnożnik pochodzi z `wt` z tego samego ticku
   (`turn-economy.ts:3087-3102`). Dodano wyjaśnienie, dlaczego w mierzonej turze mnożnik = ×1 (`wealth.ts:133-135`, `177-179`).
4. PRZYJMUJĘ. Wersja 1 podawała 6 jako wynik modelu. Poprawiono: zakres modelu to 5–7 (różnica dwóch puli po zaokrągleniu).
   Składnik bazowy A nie został rozbity.
5. PRZYJMUJĘ (uchybienie procesowe, naprawione). Bramki uruchomiono w tej rundzie (npm ci --ignore-scripts w `gra/`, 2 s):
   `npx tsc --noEmit` rc 0; `node tools/logic-test.cjs` LOGIC OK (213/213); `node tools/ai-test.cjs` 297 passed, 0 failed.
   Wyniki z surowego wyjścia: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tsc-taxnet.txt`, `.../logic-taxnet.txt`, `.../aitest-taxnet.txt`.
6. CZĘŚCIOWO ODRZUCAM z dowodem: stała −30 pkt jest sprawdzona w kodzie (`economy.ts:1275`, 0,30; sufit `economy.ts:1283`, 0,60).
   Wyliczenie Mennicy ok. 8,2 i suwaka 60% → ok. 11 jest arytmetyką; wartość Mennicy użyta w wyliczeniu jest globalna (1,38),
   a wartość per cywilizacja nie była sprawdzana. Oznaczono jako NIE ZMIERZONO / NIE SPRAWDZONO. Suwak 60% → 11 zweryfikowany
   aryt. metodą największych reszt (11,4 / 5,7 / 1,9 → 11 / 6 / 2 w wariancie Nauka 30%, Skarb 60%, Zamożność 10%).
