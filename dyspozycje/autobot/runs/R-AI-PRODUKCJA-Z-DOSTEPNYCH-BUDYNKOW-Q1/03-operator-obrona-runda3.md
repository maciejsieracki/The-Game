# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, Obrona rundy 3/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa. Runda 3: Spichlerz/Spichlerz II muszą być REALNYM, wysokim priorytetem tam, gdzie miasto faktycznie potrzebuje ich, żeby przełamać sufit populacji — niezależnie od trudności gry.

## Zarzut 1 — PRZYJMUJE (naprawione, z dowodem)

Trafny w całości. `granaryPriorityBonus()` porównywała populację do sztywnego
`AI_POP_CAP_NO_GRANARY=5`, mimo że `opts.menuDifficulty` był dostępny w tym
samym zakresie (linia wywołania używa już `opts.defensiveCopy`) i mimo że
`econ-params.json::akwedukt_prog_ludnosci` skaluje ten dokładny próg z
trudnością (easy=6/normal=5/hard=4 — sprawdzone bezpośrednio w danych). Skutek
na "hard": miasto na populacji 4 (realny sufit=4, czyli JUŻ zablokowane) było
traktowane jak "jeszcze ma zapas" (4<5) → tylko WEAK bonus, nigdy STRONG.
Skutek na "easy": miasto na populacji 5 (realny sufit=6, jeszcze 1 zapasu)
dostawało błędnie STRONG (5>=5). Fixture chronionego gate'u
(`ai-jednostki-tylko-zakup-test`, scenariusz B) nie ustawia `menuDifficulty` —
milcząco zakłada "normal", dokładnie jak zarzut mówi.

Naprawa: `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY: Record<DifficultyLevel, number>`
(ten sam wzorzec co istniejący `CS_EARLY_GARRISON_TARGET` w tym samym pliku),
`granaryPriorityBonus(city, built, menuDifficulty)` przyjmuje trzeci parametr,
wołanie przekazuje `opts.menuDifficulty`. Brak `menuDifficulty` (stare
wywołania/testy) → domyślnie `"normal"`, zero zmiany zachowania dla
chronionego gate'u. Próg ZE Spichlerzem I (`AI_POP_CAP_WITH_GRANARY_I=8`) NIE
zyskał analogicznej tabeli — potwierdzone w danych, że
`spichlerz_prog_ludnosci` jest płaskie 8/8/8 na wszystkich trudnościach, więc
skalowanie tam byłoby bez znaczenia (nie błędem, tylko zbędnym kodem).

Status "PASS-WITH-NOTES" zamiast czystego PASS: naprawa jest merytoryczna i
zweryfikowana, ale to DRUGA poprawka tej samej funkcji w tej samej rundzie —
sygnał, że zakres dispatchu (progi ekonomii duplikowane ręcznie w `ai.ts` bez
importu `economy.ts`) jest z natury podatny na tego typu rozjazd przy
przyszłych zmianach `econ-params.json`. Nie zgłaszam DECISION_REQUIRED — to
nie nowa decyzja produktowa, tylko utrzymywana świadomie kompromisowa
architektura (komentarz w kodzie wprost tłumaczy dlaczego), ale odnotowuję to
jako ryzyko na przyszłość, nie do rozstrzygnięcia w tej rundzie.

## Testy

`tsc --noEmit`: 0 błędów. Chroniony gate `ai-jednostki-tylko-zakup-test`:
44/0, bez zmian. `ai-produkcja-pokrycie-katalogu-test`: 6/6.
`ai-threat-mode-test`: 12/12. `ai-production-priority-test`: 9/9.

Bezpośrednia weryfikacja funkcji (Node, poza `tools/`, bez artefaktów w
repo): `hard, pop=4 (przy realnym sufitu 4)` → STRONG (PO) / WEAK (PRZED,
błąd). `easy, pop=5 (przy realnym suficie 6)` → WEAK (PO, poprawnie) / STRONG
(PRZED, błąd o punkt za wcześnie). `normal, pop=4` (fixture gate'u) → WEAK w
obu wariantach — gate nietknięty.

Proxy-symulacja własnym skryptem (metoda identyczna z
`ai-produkcja-pokrycie-katalogu-test.cjs`: `chooseCityProduction` w pętli,
`canAfford` odrzuca wyłącznie jednostki, esbuild + prawdziwe `buildings.json`;
skrypt i bundle usunięte po użyciu, drzewo czyste) — 3 miasta major AI,
`population: 4`, `menuDifficulty: 'hard'`, pierwsze 12 wyborów:

| # | PRZED (bug: sztywne 5, ignoruje hard) | PO (naprawione: próg=4 na hard) |
|---|---|---|
| 1 | stolarnia | stolarnia |
| 2 | koszary | **spichlerz** |
| 3 | studnia | koszary |
| 4 | akwedukt | studnia |
| 5 | laznia_publiczna | akwedukt |
| 6 | kamieniarski | laznia_publiczna |
| 7 | garncarnia | kamieniarski |
| 8 | cegielnia | garncarnia |
| 9 | kuznia | cegielnia |
| 10 | odlewnia_brazu | kuznia |
| 11 | odlewnia_zelaza | odlewnia_brazu |
| 12 | **spichlerz** | odlewnia_zelaza |

PRZED: Spichlerz dopiero #12 — i to PO Akwedukcie (#4), co w tym mechanizmie
zeruje bonus na stałe (`built.includes('akwedukt') → return 0`), więc
faktyczny wybór Spichlerza w #12 wynika z bazowego scoringu grupy, nie z
priorytetu granary — na trudności "hard" mechanizm z rundy 3 był w praktyce
martwy, dokładnie jak zarzut mówi. PO: Spichlerz #2, przed Koszarami —
zgodnie z zadaniem 1 dispatchu ("jeden z pierwszych budynków").

## BLOKADY

Brak nowych. Kryterium 4 (150 tur w realnym silniku) — nadal odroczone do
nocnego przebiegu i playtestu właściciela, bez zmian, zgodnie z ratyfikacją.

RUNDY: 3/5
NASTĘPNY KROK: Final Control rundy 3.
DEPLOY/PUSH: NIE WYKONANO
