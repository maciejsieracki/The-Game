STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DATA-UNITS-HEALTH-SINGLE-FIELD-Q1
GOAL: jedno pole zdrowia jednostki w grze (usunąć `Health`, kanoniczne `health`). Runda 1/5. Baza: 3b1b123f2 (origin/main, ROBOCZA e2ba27c6 = ARCH456).
ZMIANY/COMMIT: brak zmian w kodzie gry (Faza 2 nie wykonana, patrz BLOKADY). Commitowany wyłącznie raport tego tematu.
TESTY: NIE ZMIERZONO (Faza 2 wstrzymana przed implementacją; bramki tsc/logic-test/combat-test nie uruchamiane, bo nie zmieniono kodu). Pomiary audytowe: grep po gra/src i odczyt gra/data/units.json (surowe wyniki poniżej).
BLOKADY: decyzja właściciela wymagana (sekcja 5): czytelnicy klasy B (ai.ts:3459, battleScene.ts:4308) zmieniliby zachowanie AI i bitw wieżyczek.
RUNDY: 1/5 · ostatni werdykt: brak (Evaluator/FC nie uruchomiony) · decyzja wymagana: A/B/C (sekcja 5).
NASTĘPNY KROK: decyzja właściciela (A/B/C); po niej nowa runda Operatora z zawężonym zakresem.
DEPLOY/PUSH: NIE WYKONANO

## 1. Stan zastany (zmierzony na 3b1b123f2)

- `gra/data/units.json`: 75 jednostek; każda ma `Health` i `health`. Różne wartości: **44 z 75** (dispatch podawał 49; pomiar bieżący jest miarodajny).
- `Health` = stara skala (Wojownik 60); `health` = skala bojowa (Wojownik 22).
- Silnik walki: `gra/src/game/combat.ts:203` `combatNormField(def['health'] ?? def['Health'], 30)` czyta **health**. `gra/src/battle/testBattle.ts:314` (`health ?? Health`) i `gra/src/main.ts:35775` (`def['health'] ?? def['Health']`) też czytają `health` pierwsze. Silnik bojowy liczy Wojownika jako 22.
- Czytelnik definicji z `Health` pierwszym: `gra/src/game/ai.ts:3457-3462` `_unitMaxHealth` (`def?.Health ?? null`). Komentarz mówi „TW health, fallback Health”, kod robi odwrotnie. Używany w `ai.ts:3555` i `ai.ts:5086`.

## 2. Czytelnicy `Health` w gra/src (grep, klasyfikacja)

| Plik:linia | Co robi | Klasa | Uwagi |
|---|---|---|---|
| `game/ai.ts:3459` | `_unitMaxHealth`: `def.Health` jako maxHp jednostki AI (60 dla Wojownika) | **B** | Przepięcie na `health` zmienia maxHp AI z 60 na 22 i wpływa na oceny sił/oblężeń AI (`ai.ts:3555`, `5086`). Zmiana zachowania. |
| `battle/battleScene.ts:4308` | `shooterRow['Health'] ?? shooterRow['health']`: HP wieżyczek oblężniczych | **B** | `Health` ma pierwszeństwo. Przepięcie zmienia HP wieżyczki w bitwie. Zmiana zachowania bojowego. |
| `game/siegeDefenders.ts:189` | Lista `MELEE_SCALED_KEYS` zawiera `health` i `Health` | **B** (skala) | Skaluje klucze obecne w definicji. Po usunięciu `Health` z JSON wpis staje się martwy; wymaga sprawdzenia skali milicji. |
| `game/siege.ts:148-205, 505-560` | Stała milicji `Health: 17` (zahardkodowana, komentarz „Health 30” Wojownika) i `SiegeUnit.Health` | **B / nie-definicja** | Stała nie czyta units.json, jest odpowiednikiem starej skali. Zmiana wymaga przeliczenia milicji — zachowanie. |
| `game/siegeAi.ts:85,86,95,176` | `unit.Health` = HP RUNTIME SiegeUnit | nie-definicja | NIE ruszać (zgodnie z dispatchem). |
| `game/siege.ts` (pozostałe ~15 trafień) | `attacker.Health`, `garrison` — HP RUNTIME | nie-definicja | NIE ruszać. |
| `main.ts:19252-19254` | `Health: u.hp ?? effectiveRuntimeUnitMaxHp(u, def)` — HP runtime obiektu oblężenia | nie-definicja | Komentarz w kodzie: „Health = bieżące HP”. NIE ruszać. |
| `game/combat.ts:203` | `def['health'] ?? def['Health']` | **C** | Już `health` pierwsze (silnik walki). |
| `battle/testBattle.ts:314` | `row?.health ?? row?.['Health']` | **C** | Już `health` pierwsze. |
| `main.ts:35775` | `def['health'] ?? def['Health']` | **C** | Już `health` pierwsze. |
| `ui/entityCards/unitAdapter.ts:118-126` | Regexy zamieniające tekst „Health” na polski w opisach | **A** | Tylko tekst. |
| `ui/unitEngineStats.ts:7` | Komentarz o kolumnach PL | A (komentarz) | Aktualizacja komentarza. |
| `data/loader.ts:57` | Typ `Health: number \| null` w wierszu units | A (typ) | Usunąć w Fazie 2. |
| `render/jednostki-*.ts`, `render/kamien-inka-opus5.ts` | Komentarze „Health 40” itd. | A (komentarze) | Brak wpływu na grę. |
| `data/wikiBundle.json` (wygenerowany) | Wiki z polem `Health` | A (generowany) | Tylko generatorem po zmianie danych. |

Uwaga: `gra/tools` ma 405 trafień w 66 plikach (w tym generowane `.*-bundle.cjs`, `.zeton-*/index.html`, skrypty `roster6-*-patch.cjs`, `apply-matrix-v2-stats.cjs`, `migrate-units-tw-v3.py`). Pełny audyt tools NIE został wykonany w tej rundzie; jest częścią Fazy 2 po decyzji.

## 3. Klasyfikacja i wniosek

- Klasa **B** (zmiana zachowania): `ai.ts:3459` (maxHp AI) i `battleScene.ts:4308` (HP wieżyczki), plus stała milicji `siege.ts` i skala `siegeDefenders.ts`. Silnik walki czyta `health`, więc Faza 2 nie może przejść bez decyzji.
- Klasa **A** (tekst/typ/komentarze): `unitAdapter.ts`, `loader.ts`, `unitEngineStats.ts`, `render/`, wiki generator.
- Klasa **C** (już `health` pierwsze): `combat.ts:203`, `testBattle.ts:314`, `main.ts:35775`.

## 4. Skutek balansowy (dla właściciela, bez zmiany liczb)

Silnik walki liczy Wojownika na **22 HP**, a AI (`ai.ts:3459`) na **60 HP**. To rzeczywisty rozjazd: AI ocenia siłę armii i oblężenia przy 60, a bitwa rozstrzyga przy 22. Usunięcie `Health` bez zmiany `ai.ts` zmieni ocenę AI (60 → 22), czyli zmieni zachowanie AI. Zostawienie `ai.ts` bez zmian zostawia dwa źródła prawdy. Obie drogi są decyzją balansową.

## 5. Decyzja wymagana (DECISION_REQUIRED)

- **A (kanoniczna skala bojowa, przeliczenie B):** przepiąć `ai.ts:3459` i `battleScene.ts:4308` na `health`. AI zacznie liczyć HP jak bitwa (60 → 22 dla Wojownika), HP wieżyczki spadnie do wartości bojowej. Zmiana zachowania AI i bitw; wymaga testów przed/po i akceptacji balansu.
- **B (dwa pola o jasnych rolach):** `Health` zostaje jako „zdrowie opisowe” bez odczytu przez logikę, `health` jako „zdrowie bojowe”; przepinane tylko A i C. Dług w `ai.ts` zostaje.
- **C (dwukrokowo):** najpierw `ai.ts` na `health` z pomiarem wpływu na AI (symulacja ≥3×150 tur), potem usunięcie `Health` z JSON i kodu w osobnym temacie.

Rekomendacja: **A**, po pomiarze wpływu na AI (pomiar w osobnej rundzie; w tej rundzie NIE ZMIERZONO).

## 6. Wykonane w tej rundzie

- Odczytano dispatch (origin/main nie ma pliku `00-dispatch.md`; czytany z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`).
- Baza 3b1b123f2 (ROBOCZA e2ba27c6 ARCH456).
- Audyt Fazy 1 (sekcje 1–4).
- Brak zmian kodu gry, `units.json`, testów, `WERSJE.md`.

## 7. Tabela jednostek (Faza 1a; surowe dane `gra/data/units.json` na 3b1b123f2; różnych: 44 z 75)

| # | Jednostka | Health (stare) | health (bojowe) | rozne |
|---|---|---|---|---|
| 1 | Wojownik | 60 | 22 | TAK |
| 2 | Procarz | 20 | 16 | TAK |
| 3 | Oszczepnik | 20 | 16 | TAK |
| 4 | Łucznik | 20 | 20 | nie |
| 5 | Zwiadowca | 20 | 10 | TAK |
| 6 | Włócznik | 160 | 32 | TAK |
| 7 | Wojownik z mieczem i tarczą | 100 | 28 | TAK |
| 8 | Rydwan (woły) | 400 | 96 | TAK |
| 9 | Konnica | 320 | 56 | TAK |
| 10 | Galera | 100 | 24 | TAK |
| 11 | Falanga | 40 | 40 | nie |
| 12 | Hieros Lochos (Święty Zastęp) | 170 | 42 | TAK |
| 13 | Hastati | 120 | 38 | TAK |
| 14 | Triari | 170 | 42 | TAK |
| 15 | Jeździec chiński | 300 | 88 | TAK |
| 16 | Hu Ben Wei (Gwardia Tygrysa) | 160 | 40 | TAK |
| 17 | Impi | 140 | 36 | TAK |
| 18 | Oszczepnik Zulu (Izijula) | 40 | 20 | TAK |
| 19 | uThulwana (Białe Tarcze) | 170 | 42 | TAK |
| 20 | Wojownik z maczugą (Chaska) | 80 | 20 | TAK |
| 21 | Wojownik z toporem | 100 | 24 | TAK |
| 22 | Procarz (Huaracoc) | 20 | 16 | TAK |
| 23 | Oszczepnik (Estólica) | 20 | 16 | TAK |
| 24 | Królewska Gwardia | 160 | 40 | TAK |
| 25 | Rydwan konny | 360 | 112 | TAK |
| 26 | Łucznik egipski | 20 | 20 | nie |
| 27 | Rydwan egipski | 360 | 112 | TAK |
| 28 | Wojownik z khopesh | 100 | 24 | TAK |
| 29 | Medżaj (Gwardia Faraona) | 170 | 42 | TAK |
| 30 | Łucznik nubijski | 20 | 20 | nie |
| 31 | Łucznik sumeryjski | 20 | 20 | nie |
| 32 | Rydwan sumeryjski | 380 | 112 | TAK |
| 33 | Włócznik sumeryjski | 164 | 40 | TAK |
| 34 | Gwardia Królewska Sumeru | 170 | 42 | TAK |
| 35 | Wojownik mykeński | 110 | 28 | TAK |
| 36 | Rydwan mykeński | 360 | 104 | TAK |
| 37 | Wojownik Sherden | 110 | 28 | TAK |
| 38 | Halabardnik Shang | 100 | 24 | TAK |
| 39 | Rydwan Shang | 380 | 120 | TAK |
| 40 | Łucznik akadyjski | 20 | 20 | nie |
| 41 | Gaesatae | 110 | 22 | TAK |
| 42 | Soldurii | 44 | 44 | nie |
| 43 | Rydwan celtycki | 340 | 104 | TAK |
| 44 | Wojownik germański | 120 | 30 | TAK |
| 45 | Berserker germański | 100 | 24 | TAK |
| 46 | Taran | 2800 | 700 | TAK |
| 47 | Taran okuty | 3000 | 750 | TAK |
| 48 | Katapulta | 1000 | 250 | TAK |
| 49 | Wieża oblężnicza | 3600 | 900 | TAK |
| 50 | Wojownik tyrreński | 100 | 24 | TAK |
| 51 | Wojownik szekelesz | 110 | 28 | TAK |
| 52 | Konnica lancowa asyryjska | 68 | 68 | nie |
| 53 | Konnica łucznicza asyryjska | 60 | 60 | nie |
| 54 | Łucznik asyryjski | 20 | 20 | nie |
| 55 | Drużynnik | 31 | 31 | nie |
| 56 | Jeździec z oszczepami | 56 | 56 | nie |
| 57 | Strażnik bram Harappy | 40 | 40 | nie |
| 58 | Piechota induska | 24 | 24 | nie |
| 59 | Garnizon Harappy | 26 | 26 | nie |
| 60 | Rydwan Kapadokijski | 72 | 72 | nie |
| 61 | Piechota hetycka | 32 | 32 | nie |
| 62 | Gwardia hetycka | 40 | 40 | nie |
| 63 | Gwardia Ishtar | 35 | 35 | nie |
| 64 | Wojownik babiloński | 24 | 24 | nie |
| 65 | Piechota neobabilońska | 26 | 26 | nie |
| 66 | Tyrski miecznik | 24 | 24 | nie |
| 67 | Wojownik fenicki | 20 | 20 | nie |
| 68 | Gwardia Tyreńska | 24 | 24 | nie |
| 69 | Thorakites | 42 | 42 | nie |
| 70 | Evocati | 55 | 55 | nie |
| 71 | iButho z iklwa | 29 | 29 | nie |
| 72 | Gwardzista z champi | 48 | 48 | nie |
| 73 | Wojownik z żelaznym khopesh | 23 | 23 | nie |
| 74 | Mur tarcz (Sargonid) | 34 | 34 | nie |
| 75 | Miecznik galijski | 38 | 38 | nie |

UWAGI-DLA-ORKIESTRATORA:
- Dispatch podawał 49 z 75 różnych (pierwszy dodatek) i 44 z 75 (drugi dodatek); pomiar bieżący: 44 z 75.
- Dispatch wskazywał `ai.ts:3427` i `battleScene.ts:4279`; w kodzie na 3b1b123f2 są to `ai.ts:3459` i `battleScene.ts:4308`.
- Pliki pomocnicze `.part-head.tmp`, `.part-tail.tmp`, `.tabela.tmp` w katalogu runu są robocze; NIE są commitowane. Pomyłkowy zrzut `/tmp/ignored` leży poza repo.
- Nie zakładano sesji, zadań ani harmonogramów.
