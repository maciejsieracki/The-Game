# VERIFY-LIVE-3 (tag VLIVE3, temat R-WEB-VERIFY-LIVE-3-Q1) — pomiary na żywej grze (runda obrony 2)

Data: 2026-11-27. Baza kodu: origin/main `3608af1ce2aae306c6fa2f77413f8817d2c7bed0`; kandydat rundy 1: `6b052ce27`.
Zmiany w tej rundzie: hooki odczytu/wymuszenia w bloku `__settingsLive` (tylko `?civTest=1`) w `gra/src/main.ts`,
nowy krok w `gra/tools/diplomacy-city-cession-live-test.cjs` (T4), nowe runnery `gra/tools/vlive3-targowisko-live.cjs`
i `gra/tools/vlive3-fortring-live.cjs`, surowe logi w `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/`.
Reguła testowania: poziom MAKSYMALNY nowej gry = `difficulty 'Trudny'` (klucz `hard`), `diplomacyWarLevel 'trudna'`,
`kosztJednostekPace 'wysoki'` (×4), `kulturaReligiaLevel 'trudny'`. Rozmiar mapy `Maly` (seed 4242 lub 778899) — to nie jest
ustawienie trudności ani kosztów; nie był zmieniany na maksimum (zapisane jako odstępstwo, patrz niżej).

## Tabela

| Pomiar | Wynik | Poziom ustawień | NIE ZMIERZONO + powód |
|---|---|---|---|
| 1. Targowisko (Żywność → Podatek), jedna tura, żywa gra | ZMIERZONO. Zamiana 100 Żywności (realna ścieżka io = wiązka z przycisku UI) → rezerwa 100 → 0, kolejka podatku 0 → 20 (kurs 0,2 zgodny z `econ-params.json`). Po JEDNEJ turze skarbiec gracza: 0 → 7 w ramieniu B i 0 → 1 w ramieniu A, czyli netto +6 (6/20 = 0,30 podatku). | hard (Trudny), wszystkie pozostałe maksima | Nie zmierzono mechanizmu, który zamienia 20 kolejki w +6 skarbca (podział Skarb/Nauka/Zamożność i modyfikatory stolicy w `turn-economy.ts`, `additionalTax`). Kurs 0,2 jest zmierzony; netto 0,30 jest obserwacją bez rozłożenia na składniki. |
| 2. Cesja >1 miasta w pokoju | ZMIERZONO (T4 w `diplomacy-city-cession-live-test.cjs`, zielone): AI z 3 miastami oddaje w jednej komendzie 2 miasta (`cityId` + `dodatkoweMiasta`); oba przechodzą do gracza (owner 0), AI traci dokładnie 2 (3 → 1), status pary = `pokoj`, komunikat „Pokój zawarty”. Całość: 23 pass / 0 fail (T1–T4 + brak pageerror). | NIE maksimum: scenariusz `?playtest=mapa` ma domyślne ustawienia dyplomacji | Ceny pokoju (pn 1010 i 960) zależą od poziomu dyplomacji (kary ×3/bonusy ÷3 przy „trudna”); nie zmierzono ceny na poziomie maksymalnym, bo scenariusz playtest nie przechodzi przez kreator. Mechanizm przeniesienia własności nie zależy od poziomu. |
| 3a. FORTRING: wpływ pierścienia ON vs OFF | NIE ZMIERZONO jako wpływ. Oba warianty na maksimum, 20 tur każdy, wymuszony 1 fort: liczba fortów = 1 w każdej turze obu wariantów (`fortsBefore = forts`). Nie znaleziono obserwowalnej różnicy, którą runner mierzy. | hard / trudna / wysoki ×4 / trudny, seed 4242 | Runner mierzy liczbę fortów, czas tury i round-trip. Pierścień nie zmienia liczby fortów w 20 turach (AI nie postawiło żadnego fortu). Wpływu pierścienia nie wskazano w tej rundzie; wymagany osobny pomiar po zidentyfikowaniu, co pierścień zmienia. |
| 3b. FORTRING: round-trip zapisu | ZMIERZONO: ON → `saved: true`, forts 1 → 1, `equal: true`. OFF → `saved: true`, forts 1 → 1, `equal: true`. Round-trip obejmuje ustawienia i liczbę fortów (nie pełny skrót stanu). | maksimum | Pełny skrót stanu (`snapshotJson`) nie jest częścią tego runnera; zgodność to liczba fortów + echo ustawień. |
| 3c. FORTRING: czas tury (endTurn → koniec tury) | ON: mediana 485,5 ms, max 1574 ms (20 tur). OFF: mediana 511,5 ms, max 1581 ms (20 tur). | maksimum | Nie jest to czas tury AI z biegu domyślnego (wcześniejsze 12–35 s dotyczyły innego ustawienia i rozmiaru mapy). |

Zamiana ON: jeden przebieg zatrzymał się w turze 12 (`[EndTurn] blocked: endTurnInProgress`, bez otwartego modala ani bitwy; log
`dane/vlive3-fortring-on-max-PRZERWANY-t12-endturn-blocked.txt`). Powtórka tego samego wariantu i seeda przeszła 20/20 tur
(`dane/vlive3-fortring-on-max-20t.txt`). Stan nie jest deterministyczny w tym runnerze; przyczyna zablokowanego końca tury nie jest
zidentyfikowana (patrz „Do rozstrzygnięcia”).

## Dane (surowe, w repo)

- `dane/vlive3-targowisko-1tura-max-stdout.txt` — JSON obu ramion (A bez zamiany, B z zamianą), kurs z danych 0,2.
- `dane/vlive3-cesja-2-miasta-playtest-stdout.txt` — 23/0, T4 z liczbami.
- `dane/vlive3-fortring-on-max-20t.txt`, `dane/vlive3-fortring-off-max-20t.txt` — po jednej linii na turę (`VLIVE3-FORT`), start, wymuszenie fortu, round-trip, done.
- `dane/vlive3-fortring-on-max-PRZERWANY-t12-endturn-blocked.txt` — przebieg przerwany w turze 12 (zachowany jako dowód).
- `dane/bramki-g-*.txt` — wyjścia bramek (patrz niżej).
- Starsze dane (sprzed tej rundy, poziom domyślny, 33 tury, `forts = 0`): `dane/fortring-on-seed4242.rows.jsonl` / `.state.json`. Nie są pomiarem maksimum.

## Bramki (po zmianach w `gra/src/main.ts` i `gra/tools/`)

tsc 0 · logic-test 213/213 · tech-tree-test 20/0 · research-test 33/0 · combat-test 6/6 · ai-unit-replace-same-rules-test 45/0
(dispatch podawał 21; wynik z surowego wyjścia: 45) · ai-test 297/0 · ai-city-rebellion-gate-test 37/0 · ai-city-rebellion-news-test 24/0.

## Odstępstwa od dispatchu (jawnie)

- Rozmiar mapy: `Maly` zamiast `Super Huge` w runnerach (rozmiar nie jest ustawieniem trudności/kosztów; chodziło o czas biegu).
- Cesja (pozycja 2) na scenariuszu `?playtest=mapa`, nie na kreatorze maksimum; ceny pokoju nie zmierzone na maksimum (patrz tabela).
- Pierścień fortów (pozycja 3a): brak obserwowalnej różnicy w mierzonych wielkościach; wpływ NIE ZMIERZONO.

## Do rozstrzygnięcia przez orkiestratora (nie naprawiano; bez decyzji gry po stronie Operatora)

- Netto skarbca po turze z zamiany 100 Żywności = +6 zamiast +20 (kurs 0,2 zgodny). Czy 0,30 netto jest zamierzone, to pytanie o grę (ekonomia), do ABC — nie rozstrzygam.
- Jedna z 2 przebiegów ON zatrzymała się w turze 12 z `endTurnInProgress` bez widocznego modala. Kandydat na osobny temat (błąd gry lub harness); nie odtworzono deterministycznie.
- Fort nie powstaje samoistnie przez 20 tur (seed 4242, maksimum). Obserwacja, nie błąd.
- Pierścień fortów: trzeba wskazać, co zmienia, zanim da się zmierzyć jego wpływ.
