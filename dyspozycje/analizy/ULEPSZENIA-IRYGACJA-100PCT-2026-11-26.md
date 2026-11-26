# Irygacja przy suwaku automatu 100% (AUTOIMPPCT, #186)

Data pomiaru: 2026-11-26. Baza: origin/main `8eccf5f08` (kandydat AUTOIMPTESTS). Zero zmian w `gra/src` i `gra/data`.
Narzędzie: `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs` (produkcyjny `pickAutoImprovements`, 10 miast, rosnąca populacja, pula +120 Pracy/turę, odkrycie technologii w turze 10).
Suwak: `PRACA_PCT` (domyślnie **100** = maksimum `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`; 33 = dawny domyślny poziom, tylko do porównania).

## Wynik w prostych słowach

- Suwak 100% **nie przyspiesza irygacji**. Irygacja pojawia się w tej samej turze co przy 33%, a różnice wynoszą 0 albo ±1 turę przy tym samym ziarnie.
- Kolejność jest zachowana: wycinka, potem farmy, potem trzoda, na końcu irygacja. Trzoda startuje w turze odkrycia (0 tur po odkryciu).
- Czas do irygacji wynika z kolejności etapów (E3 trzoda na wszystkich farmach, potem E4 irygacja), a nie z limitu puli. Pula nie jest wąskim gardłem: nawet przy 33% zostawało w niej dużo Pracy.

## Tabela: tury od odkrycia do pierwszej irygacji (odkrycie tura 10, horyzont 90 tur)

| Ziarno | 33% (PRZED) | 100% (PO) |
|---|---|---|
| 1 | 46 | 46 |
| 2 | 37 | 36 |
| 3 | 45 | 46 |
| 4 | 36 | 36 |
| 5 | — | 50 |
| 6 | — | 38 |
| 7 | — | 50 |
| 8 | — | 42 |
| 9 | — | 36 |
| 10 | — | 31 |
| 11 | — | 33 |
| 12 | — | 34 |
| 13 | — | 37 |
| 14 | — | 38 |

Ziarna 5–14 zmierzono tylko przy 100% (PRZED nie liczono). Maksimum przy 100%: **50 tur** (ziarna 5 i 7). Pierwsza trzoda: 0 tur po odkryciu we wszystkich ziarnach. Starved = 0 we wszystkich.

## Mutacja E4 (irygacja wyłączona: `keys: []`), suwak 100%

| Ziarno | tury po odkryciu do irygacji |
|---|---|
| 1 | 56 |
| 5 | 59 |
| 7 | 58 |

Próg testu (e) ustawiono na **53 tury** (maksimum 50 + margines 3). Mutacja daje 56–59, więc test pada (potwierdzone uruchomieniem na kopii źródeł z mutacją).

## Owner-rules przy suwaku 100%

- Wydatek tury do 99% puli (ii-a). Zero wydatków poza żywnością i wycinką (ii-b). Farma przed trzodą, trzoda przed irygacją (ii-c).
- Uwaga: 2 irygacje stoją na **pustyni przy rzece**, bez farmy na tym heksie. Dane (`data/terrain-improvements.json`) dopuszczają irygację na Pustyni, a farma tam nie stoi. Asercja (ii-c) liczy więc tylko Łąkę i Równinę. Zob. UWAGI w raporcie.

## Otwarte (dla orkiestratora)

- Uzasadnienie w komentarzu testu „limit 33% puli gracza” nie jest potwierdzone: 100% nie zmienia czasu do irygacji.
- Przy 100% w turze 100 zostaje 10 (ziarno 1) i 12 (ziarno 3) farm przy rzece bez irygacji; przy 33% — 8 i 6. Przyczyny nie badano.
