# R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1 — raport końcowy (transkrypcja orkiestratora, FC R3 PASS-WITH-NOTES)

Artefakty (CSV, narzędzia, logi): gałąź `claude/aiecon4-fc`, SHA `204dd3d7dc776334ab03833c6e51069dd6bf8f1e`, katalog tego runu + `gra/tools/ai-vs-player-*.cjs`, `ai-econ-live-*.cjs`. Zero zmian w `gra/src` i `gra/data`.

## Wynik główny (poziom Normalny)
Macierz parytetu gracz (ownerId 0) vs AI, wołająca realne funkcje gry: koszty budynków (990 kombinacji), pełna lista produkcji (360), ulepszenia terenu (1320), koszt jednostek złoto/MP/surowce (1125), utrzymanie jednostek (1125), przychody dwóch identycznych miast (1980 par) — **0 różnic gracz≠AI**. Hipoteza „koszty zmieniane tylko dla gracza” nie potwierdzona (historia git: żadna zmiana nie rozgałęzia po ownerId).

## Zamierzone różnice
- Easy: AI płaci ×2 (budynki, jednostki); Hard: gracz płaci ×2 (`difficulty-cost.ts:50-58`). Na Normalnym brak.
- AI Normal: Praca +10% (main.ts:37724), Nauka +1 (main.ts:36986); Pieniądz AI przy domyślnych suwakach o 63% niższy niż gracza. Nie zwiększa budżetu armii.
- Bonusy cywilizacji (dla każdego, kto je wybierze): Fenicjanie Pieniądz +81%, Grecy i Harappa +31%, Babilonia +15%, Rzymianie −20% kosztu Pracy budynków, Zulusi −10% ceny jednostek. Sumerowie i Chińczycy to civ bazowe.

## Dlaczego armia AI jest większa (pomiar żywej gry do T40, seed 4242, 3 AI, pasywny gracz z 1 miastem)
- AI ma 7–13 miast (gracz pasywny: 1).
- Trasy handlowe = 55–88% Pieniądza AI (176–272 zł/turę); skarbce rosną niewydane (Grecy 1920 zł w T40).
- Armia AI to głównie najtańsze jednostki; 22–33 jednostek ogółem (bojowe 17–29). Złoto nie ogranicza AI w T≤40; Inkowie ograniczeni Manpower.
- Cena a utrzymanie: Wojownik 5 zł jednorazowo vs 4 zł/turę — rozmiar armii wyznacza dochód minus utrzymanie budynków.
- Design zwiększający armię AI: zakup bez rezerwy na utrzymanie (`shouldAIPurchaseUnit`, ai.ts:7178) i brak limitu armii.

## Plakietka ×N (np. ×198)
`stack.length` jednostek na jednym heksie (`armyMerge.ts:552-558`). Cała armia AI stoi w stolicy (T40: ×17, ×27, ×21). W kodzie nie ma globalnego ani per-cywilizacja limitu jednostek (jest tylko limit wodzów, `rally_hex_max_units`=12 dla zbiórki, Manpower). ×198 w pomiarze NIE osiągnięto (maks. ×27) — to hipoteza.

## Asymetrie niezamierzone (bez wpływu na 2× armię) — kandydaci na tematy naprawcze
1. Seed suwaków AI w turze 1: 60/60/20 (suma 140%).
2. Floor 0 skarbca w dyplomacji dotyczy tylko AI (main.ts:21351-21362).
3. Miasta-państwa: inna trudność w zakupie niż w produkcji (Easy/Hard).
4. Cena w kolejce zapisana przy dodaniu.
5. Martwy fallback `ownerId===0` w `turn-economy.ts`; martwy parametr `ai_rush_jednostka_rezerwa_zlota`.

## NIE_ZMIERZONO
Tury T41–T100; aktywny gracz vs AI; cuda w tickach; konwertery i cap Magazynu; łupy z wojen i efekt Spichlerza; ×198.

## Decyzja właściciela (ABC) — limit armii
A: limit wg epoki; B: limit wg liczby miast lub Manpower; C: rezerwa utrzymania w decyzji zakupu AI (AI przestaje kupować, gdy dochód − utrzymanie < progu).
