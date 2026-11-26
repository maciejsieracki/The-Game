# Irygacja przy suwaku automatu 100% (AUTOIMPPCT, #186)

Data pomiaru: 2026-11-26. Baza: origin/main `8eccf5f08` (kandydat AUTOIMPTESTS). Zero zmian w `gra/src` i `gra/data`.
Narzędzie: `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs` (produkcyjny `pickAutoImprovements`, 10 miast, rosnąca populacja, pula +120 Pracy/turę, odkrycie technologii w turze 10, horyzont 100 tur).
Suwak: `PRACA_PCT` (domyślnie **100** = maksimum `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`, `gra/src/game/cities.ts`; 33 = dawny domyślny poziom, tylko do porównania).

## Wynik w prostych słowach

- Suwak 100% **nie przyspiesza irygacji**. Przy tym samym ziarnie różnica między 100% a 33% wynosi od −2 do +1 tury (ziarna 1–14).
- Średnio: 39,5 tury (100%) wobec 40,1 tury (33%) do pierwszej irygacji po odkryciu.
- Kolejność jest zachowana: wycinka, potem farmy, potem trzoda, na końcu irygacja. Trzoda startuje w turze odkrycia (0–2 tury po odkryciu). Starved = 0, naruszeń kolejności = 0 we wszystkich zmierzonych przebiegach.
- Co przyczynia się do opóźnienia irygacji, **nie jest ustalone**. Hipoteza (kolejność E3 → E4: trzoda na wszystkich farmach przed irygacją) nie została zbadana wprost. Pomiar pary 33% / 100% pokazuje tylko, że limit puli nie jest tu czynnikiem różnicującym.

## Tabela: tury od odkrycia do pierwszej irygacji (odkrycie tura 10, 100 tur)

| Ziarno | 33% (PRZED) | 100% (PO) | różnica 100% − 33% |
|---|---|---|---|
| 1 | 46 | 46 | 0 |
| 2 | 37 | 36 | −1 |
| 3 | 45 | 46 | +1 |
| 4 | 36 | 36 | 0 |
| 5 | 51 | 50 | −1 |
| 6 | 37 | 38 | +1 |
| 7 | 52 | 50 | −2 |
| 8 | 43 | 42 | −1 |
| 9 | 37 | 36 | −1 |
| 10 | 32 | 31 | −1 |
| 11 | 35 | 33 | −2 |
| 12 | 35 | 34 | −1 |
| 13 | 36 | 37 | +1 |
| 14 | 40 | 38 | −2 |

Maksimum przy 33%: **52** (ziarno 7). Maksimum przy 100%: **50** (ziarna 5 i 7 — ziarno 5 przy 100% = 50, ziarno 7 przy 100% = 50). Ziarna 1–4 w obu wariantach zmierzone w tej rundzie (test `autoimprove-max-pct-test.cjs`). Ziarna 5–14 przy 33% zmierzone w tej rundzie; ziarna 5–14 przy 100% z poprzedniej rundy (w tej rundzie potwierdzono ziarna 1–5; ziarno 7 przy 100% z poprzedniej rundy). Pierwsza trzoda: 0–2 tury po odkryciu. Starved = 0 we wszystkich przebiegach.

Próg testu (e) = **53 tury** = maksimum 100% (50) + margines 3. Ten sam próg obejmuje też wynik przy 33% (maksimum 52), więc nie zależy od wyboru poziomu suwaka.

## Mutacja E4 (irygacja wyłączona: `keys: []`), suwak 100%

| Ziarno | tury po odkryciu do irygacji |
|---|---|
| 1 | 56 |
| 5 | 59 |
| 7 | 58 |

Próg 53 wykrywa mutację (56–59 > 53). Pomiar mutacji z poprzedniej rundy; w tej rundzie nie powtarzany (nie zmieniano kodu gry ani progu).

## Owner-rules przy suwaku 100%

- Domyślny poziom testu `autoimprove-owner-rules-test.cjs` ustawiono na **100%** (wcześniej 50%; `OWNER_RULES_PCT=50` zostaje tylko do porównania). Wynik: 7 OK / 0 FAIL.
- Wydatek tury do 99% puli (ii-a). Zero wydatków poza żywnością i wycinką (ii-b). Farma przed trzodą, trzoda przed irygacją (ii-c) na polach Łąka/Równina.
- Uwaga: 2 irygacje stoją na **pustyni przy rzece**, bez farmy na tym heksie. `data/terrain-improvements.json`: Irygacja dopuszcza „Łąka, Równina, Pustynia”, Farma dopuszcza tylko „Łąka, Równina (bez lasu)”. Farma na pustyni nie jest możliwa, więc reguła „farma przed irygacją” nie ma tam zastosowania. Asercja (ii-c) jest zawężona do Łąki i Równiny; przypadki na pustyni są wypisywane jako `[info]`. **Zawężenie zakresu asercji wymaga akceptacji orkiestratora** (nie jest to złagodzenie reguły na polach, na których farma może stanąć).

## Nowy test porównawczy

`gra/tools/autoimprove-max-pct-test.cjs` (10 OK / 0 FAIL, ok. 3 min):
- (a) domyślny poziom pomiaru = 100%;
- (b) ziarna 1–4 przy 100%: starved = 0, naruszeń kolejności = 0;
- (c) irygacja przy 100% nie opóźnia się względem 33% o więcej niż 2 tury (najgorzej +1);
- (d) irygacja przy 100% powstaje w horyzoncie.

## Otwarte (dla orkiestratora)

- Przyczyna czasu do irygacji (kolejność E3 → E4 czy inny czynnik) nie została zbadana.
- Przy 100% w turze 100 zostaje 10 (ziarno 1) i 12 (ziarno 3) farm przy rzece bez irygacji; przy 33% — 8 i 6. Przyczyny nie badano.
- Czy irygacja na pustyni bez farmy jest zamierzona — do potwierdzenia przez właściciela; test traktuje ją jako zgodną z danymi.
