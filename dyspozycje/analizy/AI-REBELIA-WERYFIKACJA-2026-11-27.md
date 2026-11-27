# AI-REBELIA — weryfikacja na żywo (R-WEB-AI-REBEL-VERIFY-LIVE-Q1, tag AIREBELVER)

Data: 2026-11-27. Baza kodu: `99375f77e` (origin/main, FALE 928–929). Operator: runda 2 (obrona po zarzutach Evaluatora; runda 1 = commit `1b22830d9`).
Surowe dane: `dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/`. Raport: `runs/.../10-operator-claude.md` i `runs/.../30-obrona-claude.md`.

Ustawienia maksymalne: Trudny, „Kultura i religia” trudny, „Koszty jednostek” Wysoki ×4 (`--pace wysoki`), `--city-state 1`.
Wyjątek poziomu: pozycja 1 (sandbox `?playtest=mapa`) działa na poziomie „normalny” — patrz niżej, dlaczego.

| Pozycja | Wynik | NIE ZMIERZONO + powód techniczny |
|---|---|---|
| 1. Ochrona ostatniego miasta AI (wymuszenie buntu) | ZMIERZONO na żywym silniku, poziom NORMALNY (nie maksimum): w t1 jedyne miasto AI wymuszone do buntu (`forceRevoltEligible`, grace=0, próg 95%) zostało przy właścicielu (`ownerId` = AI, `rebelState` = false). Kontrola na tym samym haku, na jedynym mieście GRACZA: bunt w t1 (`ownerId` = −99). Zob. `dane/last-city-ai-t6.txt`, `dane/last-city-player-kontrola-t6.txt`. | (a) Poziom maksymalny (Trudny) NIE osiągnięty w tym scenariuszu: `_menuDifficulty` ustawia się wyłącznie w `doStartGame` (`gra/src/main.ts`, ok. l.50375); `?playtest=mapa` tego nie wywołuje, więc zostaje „normal”. Start nowej gry z Trudnym (`__nnsMeasureDebug.startGame`) wymaga obsługi blokad modalnych jak w `ai-cult-rel-measure-run.cjs` — NIE ZROBIONE w tej rundzie. (b) Po t1 miasto AI rośnie (1→2→3→4 miasta w t2–t6), więc t2–t6 NIE są scenariuszem „ostatniego miasta”; dowód ochrony to wyłącznie tura 1. (c) Dowód wejść bramki: `ai-city-rebellion-gate-test.cjs` 37/0 (nie zastępuje żywego pomiaru). |
| 2. Stolica AI w buncie przy ≥2 miastach (flaga/efekty, Mennica, zwycięstwo) | NIE ZMIERZONO | Stolica nie jest eksportowana przez żaden hak pomiarowy: `capitalCityIdForOwner` (gra/src/main.ts) to funkcja wewnętrzna; `__aiEconomyMeasure.metrics`/`cityStateTurn` nie zawierają pola stolicy (sprawdzone grepem: brak `capital`/`stolic`/`mennic` w zakresie `__aiEconomyMeasure`). Odczyt wymaga nowego, tylko-odczytowego haka w `gra/src/main.ts` — poza allowlistą. DECISION_REQUIRED: czy dodać hak odczytu stolicy/Mennicy (jedno zdanie: „odczyt stanu stolicy AI do pomiaru buntu”). |
| 3. Round-trip zapisu z buntami AI i wpisem „rebelia” w „Wydarzeniach na świecie” | NIE ZMIERZONO | Lista trwała `worldDiploNewsList` nie ma haka odczytu; jedyny odczyt to `getWorldNews` przekazywany do okna dyplomacji (`gra/src/main.ts` ok. l.29492). Porównanie przed/po wczytaniu wymaga odczytu listy z DOM okna dyplomacji (otwarcie okna, selektory klas `dl-wn-*`) — NIE ZROBIONE w tej rundzie. Zapis/wczytanie w grze jest dostępne (`__truceTestDebug.saveForTest`, `loadGameFromSlot`), brakuje tylko odczytu listy. Hotseat nie sprawdzany. |
| 4. Zrzut okna dyplomacji z wpisem „rebelia” (Chromium) | NIE ZMIERZONO | Wpis powstaje tylko, gdy gracz ma kontakt z właścicielem (`recordAiCityRebellionNews`: `getDiplomaticContacts().has(prevOwnerId)`), a zrzut wymaga otwarcia okna dyplomacji w żywej grze z tym kontaktem. Ani scenariusz playtest (brak potwierdzonego kontaktu z AI), ani bieg 60-turowy (runner nie otwiera okna) tego nie wykonują. NIE ZROBIONE w tej rundzie. |
| 5. Bieg żywy 60+ tur na maksimum, seed 4242 i 7 | ZMIERZONO liczby miast w buncie i miast AI (poniżej). Liczby wpisów „rebelia” na liście i widocznych cywilizacji — NIE ZMIERZONO. | Runner eksportuje `cityState`/`owners`, nie listę wydarzeń (patrz pozycja 3). Zgodność z kodem NIE została sprawdzona; „−99” to miasta we frakcji rebelianckiej wg `cityState`, a nie licznik wpisów. |

## Pozycja 1 — szczegóły (playtest, poziom normalny)

Hak: `window.__rebelNotifyTestDebug.forceRevoltEligible(cityId)` (istnieje w `gra/src/main.ts`, blok `__rebelNotifyTestDebug`, ok. l.31476–31530). Ustawia populację ≥ 5, `revoltGraceRemaining = 0` i próg „bunt skrajny” = 95% dla bieżącego poziomu. Hak nie zmienia logiki buntu; wejścia (kwalifikacja) są wymuszone, decyzję podejmuje silnik.

Skrypt: `gra/tools/ai-rebel-verify-last-city-live.cjs` (nowy, w allowlistcie). Bundle budowany poza repo (`vite build --outDir <scratchpad>/rebel-dist`).

- `--target ai` (jedyne miasto AI w sandboxie, właściciel 1, miasto `city_enemy_1`): tura 0 po wymuszeniu: owner 1, grace 0, miasta AI = 1. Tury 1–6 (realne `endTurn`, `settled` we wszystkich): owner 1, `rebelState` false we wszystkich. Liczba miast AI: 1, 2, 3, 3, 4, 4 (ekspansja od t2).
- `--target player` (kontrola, jedyne miasto gracza `city0`): tura 1 po wymuszeniu: owner −99, `rebelState` true, utrzymane do t6.

Wniosek ostrożny: w t1 ochrona ostatniego miasta AI działa żywo (kontrola pokazuje, że ten sam hak bez ochrony prowadzi do buntu w t1). Poza t1 scenariusz nie jest czysty (AI rośnie). Pełne 60-turowe wymuszenie na maksimum to kolejny krok (zob. „NIE ZROBIONE”).

## Pomiar pozycji 5 (maksimum, 60 tur, 1 przebieg na ziarno)

Liczby z `dane/seed4242-maks.txt` i `dane/seed7-maks.txt` (pola `owners` i `cityState`). Jeden przebieg na ziarno: zmienność między przebiegami NIE ZMIERZONA, więc różnic rzędu kilku miast nie należy interpretować.

„Bunt” = miasta we frakcji −99 (`cityState`). „AI” = właściciele > 0 (bez gracza 0; bez −1 barbarzyńców).

| Tura | s4242: bunt (miasta) | s4242: miasta AI | s4242: AI z 0 miast | s7: bunt (miasta) | s7: miasta AI | s7: AI z 0 miast |
|---|---|---|---|---|---|---|
| t2 | 0 | 42 | 0 | 0 | 42 | 0 |
| t10 | 0 | 42 | 0 | 0 | 42 | 0 |
| t20 | 0 | 48 | 0 | 0 | 50 | 0 |
| t30 | 0 | 68 | 0 | 0 | 71 | 0 |
| t40 | 1 | 114 | 0 | 1 | 116 | 0 |
| t50 | 7 | 130 | 0 | 9 | 128 | 0 |
| t60 | 7 | 149 | 0 | 13 | 142 | 0 |

- Bunt startuje po ok. 30–40 turach i rośnie; w t60: 7 miast (s4242) i 13 miast (s7).
- Pole `lacznaZero` w `cityState` to liczba MIAST z łaską = 0, a nie liczba cywilizacji bez miast; w t60 wynosi 10 (s7). Nie dowodzi ochrony ostatniego miasta.
- „AI z 0 miast = 0” to wynik biegu naturalnego: nie dowodzi działania ochrony (ochrony nie wywołano w tym biegu).
- Wojsko AI w t60: 148 (s4242), 134 (s7). Brak porównania z biegiem PRZED.
- Wcześniejsze zdanie o „zgodności 149 z dokumentem AI-REBELIA-WDROZENIE (148 + 10)” WYCOFANE: porównanie nie zostało zmierzone (nie ma wartości z tego dokumentu w danych tej rundy) i nie wolno nazywać rozbieżności „szumem” bez zmierzonego szumu.

## Wnioski ostrożne

- Bunt AI działa na żywo na poziomie maksymalnym: 0 buntów do t30; 7 (s4242) i 13 (s7) miast w buncie w t60 (1 przebieg na ziarno).
- Ochrona ostatniego miasta AI: żywo potwierdzona tylko w t1 scenariusza wymuszonego, na poziomie normalnym (kontrola: gracz buntuje się przy tym samym haku).
- Pozycje 2–4 i liczby wpisów z pozycji 5 wymagają odczytu listy wydarzeń/stolicy (haki lub odczyt DOM okna dyplomacji); NIE ZROBIONE w tej rundzie.
