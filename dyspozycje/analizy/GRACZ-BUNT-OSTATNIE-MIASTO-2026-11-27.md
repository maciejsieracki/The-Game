# Gracz: bunt a ostatnie miasto (R-WEB-PLAYER-LASTCITY-REVOLT-Q1, runda 3 Operatora)

STATUS: POMIAR WYKONANY NA ŻYWO (runda 3). Baza: origin/main 909a057fa. Jedyna zmiana w `gra/src`: instrumentacja
`civTest` w `gra/src/main.ts` (tylko odczyt i dopisywanie do tablicy; poza `?civTest=1` brak skutku). Dane:
`dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane-r3/` (jsonl.gz, state/summary json, zrzuty
ekranu porażki). UWAGA: plik `run.log` z readbackiem ustawień NIE jest w commicie (`*.log` w .gitignore); zob. §6. Tabela z danych: `node gra/tools/plrrevolt-r3-table.cjs <dane-r3>`.

## 0. STAN WIĄŻĄCY (wnioski runda 3)

1. **Utrata miasta gracza w tych biegach NIE jest buntem. To barbarzyńcy.** W 9 biegach (kultura gracza łatwy / normalny /
   trudny x ziarna 4242, 7, 778899; pasywny gracz, maksimum ustawień) gracz traci JEDYNE miasto: t16 / t29 / t12 (ziarno
   4242 / 7 / 778899), niezależnie od kultury. Każda zmiana właściciela to `0 -> -1` (BARBARIAN_OWNER_ID), ścieżka
   `applyCityCaptureToMap`. **Zmian na -99 (rebelianci): 0 w 9 + 7 dodatkowych biegach.**
2. **Mechanizm t16 (V4 normalny/normalny, ziarno 4242), potwierdzony stosem wywołań** (build bez minifikacji, bieg
   `V4-nomin-normalny-s4242`): `applyCityCaptureToMap <- applyMapBattleOutcome <- applyMapBattleOutcomeWithSummary <-
   doMapAutoResolveIncoming <- onAuto <- showPreBattle`. To jest bitwa barbarzyńców o miasto, rozstrzygnięta przyciskiem
   „Auto” z okna przedbitewnego. W momencie ataku gracz miał 0 jednostek wojskowych i 1 cywilną (stan z `cityThreatProbe`:
   `jednostkiWojskowe=0`, `miastaWojsko[0].wojsko=0`, 3 jednostki barbarzyńców w promieniu 3 od miasta w t14-15).
   Porządek miasta w chwili utraty: 49% (Niepokój), próg skrajnego buntu 12%.
3. **Dawny „t29 V4/4242” z AIBAL2** nie odtworzył się w t29: w świecie z barbarzyńcami Trudny (jak w REALDEF4) ten sam
   wariant ginie w t16. Rozbieżność z REALDEF4 NIE WYJAŚNIONA w pełni: tury utraty w REALDEF4 (4242 t10, 778899 t13, seed 7 ok. t14) różne od tych tu (t16, t12, t29); pkt 6 wyjaśnia tylko zmianę poziomu barbarzyńców, nie różnicę tur (§6, zarzut 2).
4. **Bunt gracza nie wystąpił w 60 turach; wniosek dotyczy tylko populacji 1-4, bo tam miasta gracza mają immunitet osiedla.**
   Miasto o populacji 1-4 nie wchodzi w bunt (`isOsiedleRevoltImmune`, próg `prawo_bonus_osada_prog` = 4 na każdym poziomie,
   `society-breakdown.ts:491-499`). Biegi z wyłączonymi barbarzyńcami (diagnostyka, pkt 5): w t60 gracz ma 1 miasto o
   populacji 3, Porządek 26-36% (nigdy poniżej 26,1%; próg buntu 12%).
5. **Ochrona ostatniego miasta gracza przed buntem: NIE MA** (kod: `society-breakdown.ts:522-533`, ochrona tylko AI;
   dla gracza `ownerIsHuman` zawsze zezwala). Bunt ostatniego miasta gracza pozostaje możliwy w mechanice, ale w 15
   żywych biegach nie wystąpił; przy populacji 1-4 wystąpić nie może (immunitet osiedla).
   NIE ZMIERZONO: bunt przy populacji >= 5 (gracz nie dociągnął do niej w 60 turach). Odpowiedź „jak często” dotyczy
   tylko krótkich gier z miastem pop 1-4 (zarzut 5).
6. **Czemu poprzednie rundy dawały 7/9 przeżyć do t60 (r2) przeciw 4/5 ginie t10-16 (REALDEF4):** runner r1/r2 miał
   zaszyte `barbariansLevel: "normalny"` oraz `kosztJednostekPace: "normalny"` (nadpisywane domyślnym `--pace`). Teraz
   runner startuje z `barbariansLevel` = Trudny (`--barb`, domyślnie trudny) i `--pace wysoki`. Readback ustawień NIE jest
   w commicie dla żadnego biegu: `*.run.log` jest w .gitignore, a jsonl/summary/state nie zawierają pól `barbariansLevel`
   ani „readback” (0 trafień). Wartość Trudny potwierdzona w trakcie biegu tylko dla wariantu V4-nomin (hak `settings()`),
   dla pozostałych NIE ZWERYFIKOWANO artefaktem (§6, zarzut 1).
7. **Skutek w UI po utracie ostatniego miasta (zmierzone, 9/9 biegów pasywnych + 2/3 autopilota):** gra kończy się
   natychmiast (`gameOver`), pokazuje się pełnoekranowa karta „TWOJE IMPERIUM UPADŁO / KLĘSKA” z liczbami (tury
   przetrwane, ostatnia epoka, zbadane technologie, cywilizacja, utracone miasta 1, utracone jednostki 1) i DWOMA
   przyciskami: „WCZYTAJ GRĘ” i „ROZPOCZNIJ OD NOWA” (przeładowanie strony). **Nie ma „Wróć na mapę” ani kontynuacji;**
   „Zakończ turę” jest zablokowane (`[EndTurn] blocked: gameOver`). Zrzuty: `dane-r3/*-defeat.png`. Gracz nie dostaje
   żadnego komunikatu o przyczynie (barbarzyńcy vs bunt) na ekranie porażki.

## 1. Tabela 9 biegów (pasywny gracz, maksimum: Trudny, Koszty jednostek Wysoki x4, Dyplomacja trudna, barbarzyńcy Trudny; kultura AI NORMALNY, nie trudny: odstępstwo od maksimum, zob. §6)

Porządek = `porPct` miast gracza z `cityOrderState` (min / średnia po turach do utraty). Skrajny bunt = `porPct < 12`.
Wszystkie biegi: 1 miasto, 0 jednostek wojskowych, populacja miasta 1-3 (osiedle = immunitet buntu).

| kultura gracza | ziarno | tura utraty miasta | kto (stary -> nowy) | Porządek min / śr | tura wejścia w skrajny bunt | zmian na -99 |
|---|---|---|---|---|---|---|
| łatwy | 4242 | 16 | 0 -> -1 | 64,5 / 67,8 | brak | 0 |
| łatwy | 7 | 29 | 0 -> -1 | 59,8 / 69,0 | brak | 0 |
| łatwy | 778899 | 12 | 0 -> -1 | 75,0 / 75,0 | brak | 0 |
| normalny | 4242 | 16 | 0 -> -1 | 52,9 / 52,9 | brak | 0 |
| normalny | 7 | 29 | 0 -> -1 | 44,9 / 54,9 | brak | 0 |
| normalny | 778899 | 12 | 0 -> -1 | 59,5 / 59,5 | brak | 0 |
| trudny | 4242 | 16 | 0 -> -1 | 37,4 / 37,4 | brak | 0 |
| trudny | 7 | 29 | 0 -> -1 | 39,2 / 42,3 | brak | 0 |
| trudny | 778899 | 12 | 0 -> -1 | 43,9 / 43,9 | brak | 0 |

Wszystkie 9: ścieżka `applyCityCaptureToMap` (wejście barbarzyńców do miasta), gracz bez obrońcy.

### 1a. Dodatkowo: autopilot gracza (`--player-ai 1`, kultura trudny, barbarzyńcy Trudny)

| ziarno | wynik | Porządek min / śr |
|---|---|---|
| 4242 | utrata miasta t18, `0 -> -1`, `applyCityCaptureToMap` | 26,4 / 27,1 |
| 7 | przeżycie do t25 (koniec segmentu), 1 miasto | 32,1 / 42,0 |
| 778899 | utrata miasta t15, `0 -> -1`, `applyCityCaptureToMap` | 32,9 / 37,6 |

Autopilot (decyzje jak AI) nie ratuje miasta przed barbarzyńcami Trudny w t15-18 w 2 z 3 ziaren.

### 1b. Diagnostyka POZA maksimum (barbarzyńcy WYŁĄCZENI, kultura trudny, pasywny, do t60)

Poziom barbarzyńców `brak` jest poniżej maksimum; użyty wyłącznie po to, by sprawdzić, czy bunt jest w ogóle osiągalny,
gdy gracz przeżywa. Wartości maksymalne pozostałych ustawień bez zmian.

| ziarno | tura końca | miasta | populacja w t60 | Porządek min / śr | tura < 12% | zmian na -99 |
|---|---|---|---|---|---|---|
| 4242 | 60 | 1 | 3 | 26,8 / 33,4 | brak | 0 |
| 7 | 60 | 1 | 3 | 26,1 / 36,4 | brak | 0 |
| 778899 | 60 | 1 | 3 | 26,7 / 36,2 | brak | 0 |

Porządek spada wraz z populacją (np. 4242: pop 1 = 37,4%, pop 2 = 33,5%, pop 3 = 29,4%), więc miasto, które urosłoby do
pop >= 5 (koniec immunitetu osiedla), byłoby przy kulturze trudnej wyraźnie bliżej progu 12%. NIE ZMIERZONO (brak takiego
miasta w 60 turach).

## 2. Log zmian właściciela (hak `__cityOwnerChangeLogDebug`, `gra/src/main.ts`)

- Dopisywanie do tablicy w miejscach zmiany `city.ownerId`: `resolveSiegeSurrender` (kapitulacja po oblężeniu),
  `annexCityState` (aneksja miasta-państwa), `transferCityToRebelFactionWithLedger` (bunt; -99), `transferCityByTreaty`
  (cesja), `applyCityCaptureToMap` (zdobycie bitwą/szturmem/wejściem do pustego miasta; wołający widać w stosie).
  Każdy wpis: tura, id i nazwa miasta, stary -> nowy właściciel, ścieżka, stos wywołań, populacja, `porPct`, pasmo,
  łaska buntu, ostrzeżenie, flaga rebelii, flaga osiedla. Funkcja `noteCityOwnerChangeForTest` wraca od razu, gdy
  nie jest `?civTest=1`.
- Odczyt: `log()`, `clear()`, `humanCities()` (Porządek miast gracza w bieżącej turze), `settings()` (readback poziomu
  barbarzyńców). Hak jest w istniejącym bloku civTest (obok `__aiEconomyMeasure`).
- Brak wpływu na grę: `tsc` 0; `ai-test` 297/0, `logic-test` 213/213 (zob. §4); dwa biegi tego samego ziarna (bundle
  zminifikowany i niezminifikowany, `pas-normalny-s4242` vs `V4-nomin-normalny-s4242`) mają identyczny skrót
  (`owners`, `terytorium`, `wars`) we wszystkich 15 turach. **NIE ZMIERZONO:** porównanie z bundlem BEZ haka
  (kandydat 909a057fa) bit w bit; opieramy się na przeglądzie kodu (hak tylko czyta `cityOrderState`/`cities`) i na
  bramkach.
- Wpisy w biegach: t8 `annexCityState` Kanesz 6 -> 5 (AI); t11 `applyCityCaptureToMap` Ostia 27 -> -1 (barbarzyńcy zdobyli
  miasto-państwo, `applyMapBattleOutcome <- doAutoPowerMapBattle`); t16 Rzym 0 -> -1 (miasto gracza).

## 3. Kod (bez zmian względem r2; numery linii z bazy 909a057fa)

- `gra/src/game/society-breakdown.ts:218-219` — `REVOLT_CRITICAL_POR_PCT = 12`, `REVOLT_GRACE_TURNS = 3`.
- `gra/src/game/society-breakdown.ts:232` — `REBEL_FACTION_OWNER_ID = -99`; `barbarians.ts:51` — `BARBARIAN_OWNER_ID = -1`.
- `gra/src/game/society-breakdown.ts:522-533` — `shouldStartCityRebellion`: ochrona ostatniego miasta (`aiKeepsLastCity`)
  tylko dla AI; dla gracza brak warunku na liczbę miast.
- `gra/src/game/society-breakdown.ts:477-499` — immunitet osiedla (pop <= `prawo_bonus_osada_prog` = 4).
- `gra/src/main.ts` pętla buntu (`rebelByPlayer = isHuman(...)`, komunikat „Miasto nie jest już Twoje”) oraz
  `transferCityToRebelFactionWithLedger` (`city.ownerId = REBEL_FACTION_OWNER_ID`).
- `gra/src/game/victory.ts:217` — `rodzaj: 'przegrana'` dla gracza bez miast; ekran: `pokazEkranPorazki`.

## 4. Bramki (kod r3, po `npm ci --ignore-scripts`, w worktree tej rundy)

`tsc --noEmit` 0 błędów; `logic-test` 213/213; `tech-tree-test` 20/0; `research-test` 33/33; `unit-replace-test` 21/21;
`combat-test` 6/6; `society-breakdown-test` 56 OK / 0 FAIL; `ai-city-rebellion-gate-test` PASS=37 FAIL=0;
`ai-city-order-need-wiring-test` 267/0; `ai-test` 297/0.

## 5. Zastrzeżenia

- Gracz w biegach jest pasywny (0 jednostek wojskowych) lub na autopilocie AI; to nie jest „rozsądna gra” człowieka
  (REALDEF5 bada obronę startu). Wniosek o częstości buntu dotyczy tej próby (15 biegów, 1 miasto o pop 1-3).
- Biegi 60-turowe wykonano w jednym segmencie (wznowienie ze slotu sypało Chromium dwa razy z rzędu, `diag-brak-trudny-s4242`
  powtórzono od zera). Kultura AI = normalny we wszystkich biegach: to NIE jest poziom maksymalny (maksimum = trudny);
  zapisane jako odstępstwo od reguły testowania na maksimum, bez ponownego pomiaru (§6, zarzut 5 i sekcja zakresu).
- Propozycje (NIE decyzje; bez zmiany balansu): (a) ekran porażki może podawać przyczynę utraty (barbarzyńcy / bunt);
  (b) decyzja o ochronie ostatniego miasta gracza przed buntem: pytanie ABC do właściciela dopiero po turnieju, i tylko
  jeśli bunt okaże się osiągalny przy populacji >= 5 (dziś niezmierzone).

## 6. Korekty po obronie r3 (zarzuty Evaluatora, commit e30c344 -> kolejny commit obrony)

Każdy zarzut: PRZYJĘTY (poprawka w tym dokumencie) albo ODRZUCONY z dowodem. Brak dowodu = przyjęty.

1. **Readback ustawień (PRZYJĘTY).** `*.run.log` NIE jest w repo (wzorzec `*.log` w .gitignore; `git ls-files` nie zawiera
   żadnego run.log). W `dane-r3/` 0 trafień `barbariansLevel` i `readback` we wszystkich 16 plikach jsonl.gz (sprawdzone
   `zcat | grep -c -i 'barbariansLevel\|readback'`). Readback zweryfikowany wyłącznie w trakcie biegu V4-nomin (hak
   `__cityOwnerChangeLogDebug.settings()`); zapis z tego biegu NIE trafił do commita. Pozostałe 15 biegów: barbarzyńcy
   Trudny NIE ZWERYFIKOWANI artefaktem. Naprawa wymaga ponownego biegu z zapisem readbacku do pliku w repo (NIE ZMIERZONO).
2. **Rozbieżność z REALDEF4 (PRZYJĘTY, wyjaśnienie wycofane do „NIE WYJAŚNIONE”).** REALDEF4: 4242 t10, 778899 t13,
   seed 7 ok. t14. Ta runda: 4242 t16, 778899 t12, seed 7 t29. Różne tury nawet przy tym samym ziarnie i ustawieniach
   barbarzyńców. Przyczyna różnicy NIE ZMIERZONA (możliwe: inne ustawienia tempa/kultury lub inna wersja gry; nie
   sprawdzono). Wniosek „barbarzyńcy Trudny to wyjaśnienie” jest niepotwierdzony.
3. **Bit-w-bit wpływ haka civTest (PRZYJĘTY, NIE ZMIERZONO).** Nie porównano biegów z bundlem bez haka (909a057fa)
   z tym samym ziarnem. Dowody dostępne: `git diff 909a057fa e30c344 -- gra/src` pokazuje wyłącznie dopisanie
   `noteCityOwnerChangeForTest(...)` w 5 miejscach (linie zmian `city.ownerId`), definicję funkcji zaczynającą się od
   `isCivTestEnabled` (bez `civTest` = natychmiastowy powrót) oraz blok `window.__cityOwnerChangeLogDebug` w bloku civTest.
   Funkcja czyta `cityOrderState`, zapisuje do lokalnej tablicy i nie wywołuje efektów ubocznych. `ai-test` i `logic-test`
   nie ładują `main.ts`, więc NIE są dowodem inertności. Dowód bit-w-bit wymaga biegu A/B (NIE ZMIERZONO).
4. **Kosmetyka danych (PRZYJĘTY, częściowo naprawione).** Ścieżki `screenshot` w `*.summary.json` i `*.state.json`
   wskazywały na worktree `wf_1780e1ff-d83-1`; zamieniono na ścieżki względem repo (`dyspozycje/autobot/runs/...`).
   Pole `why.ownerChangesTail` jest puste (`[]`) w summary: log zmian właściciela jest tylko w jsonl, a summary go nie
   przepisuje. NIE UZUPEŁNIONO (wymaga osobnego eksportu z jsonl; nie wykonano).
5. **Bunt przy pop >= 5 (PRZYJĘTY).** Wniosek „bunt niedostępny” dotyczy wyłącznie populacji 1-4 (immunitet osiedla,
   `society-breakdown.ts:491-499`) w 60 turach. Przy pop >= 5 NIE ZMIERZONO. Kultura AI = normalny zamiast maksimum
   (trudny) — odstępstwo, NIE ZMIERZONO na maksimum.

### Zakres i co pozostaje otwarte

- Mechanizm: utrata miasta gracza w tych biegach = zdobycie przez barbarzyńców (`applyCityCaptureToMap`), co jest
  potwierdzone stosem wywołań TYLKO dla V4-nomin t16. Dla pozostałych biegów ścieżka odczytana z zapisu (`0 -> -1`).
- Bunt gracza (-99): 0 zaobserwowanych zdarzeń; nie jest to dowód, że bunt jest niemożliwy (pop >= 5 NIE ZMIERZONO).
- UI porażki: zmierzone (sekcja 0 pkt 7) na 9 biegach pasywnych; zrzuty w `dane-r3/*-defeat.png`.
