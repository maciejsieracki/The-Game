# 50 — Final Control — R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1
GOAL: okno przed bitwą pokazuje ostrzeżenie o osłabieniu jednostek strony przez głód wojska / deficyt złota (tylko wyświetlanie; brak kary = brak ostrzeżenia; barbarzyńcy nigdy).
ZMIANY/COMMIT: kandydat do integracji `8e8515c9e2d013894a3546431dc6006ed919796f` (kod `b107be3d0` + raport obrony). Potomek bazy `b933923a5` (git merge-base --is-ancestor: tak). Diff vs baza: 7 plików (gra/src/ui/battle-weakened-note.ts [nowy], gra/src/ui/preBattle.ts, gra/src/battle/mapFieldBattle.ts, gra/src/main.ts, gra/tools/prebattle-weakened-warning-test.cjs, 2 raporty runs/) -- wszystko w allowliście; brak zmian w gra/data, combat.ts, units.json, combat-params.json, empire-food.ts, WERSJE.md.

## Zarzuty Evaluatora
1. Render bloku .pb-weak bez asercji: ODDAL (naprawione). Test sekcja (h)-(k) renderuje prawdziwe showPreBattle w Chromium --dump-dom. Własna mutacja (usunięcie linii `weakenedHtml +` w preBattle.ts): `19 OK, 3 FAIL`; po przywróceniu `22 OK, 0 FAIL`.
2. Brak weryfikacji w Chromium: ODDAL w części (zrzuty 1280x800 renderu prawdziwego preBattle.ts z karą i bez obejrzane: linia „▼ Osłabieni: głód wojska −25%, deficyt złota −25% (poza pancerzem)” zawija się na 2 linie w karcie, okno nie jest rozpychane; bez kary brak linii). NIE_ZMIERZONO: ścieżka live kampania -> bitwa z mapy w pełnej grze. Nota, nie blokada: wpięcie w main.ts używa tych samych flag i mnożników co silnik (main.ts 34661/34671 vs 34786/34787, to samo źródło buildEmpireFoodParams/buildGoldDeficitParams), tsc zielone. Weryfikacja live po deployu na ROBOCZĄ.
3. Plik poza allowlistą: ODDAL (przeniesiony do gra/src/ui/, rename 100%).
Żaden zarzut nie wymaga NAPRAW.

## TESTY (surowe wyjście, kandydat 8e8515c9e)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0, ALL GREEN
- unit-replace-test: 21/21 zielone
- combat-test: 6/6 pass, All sanity checks passed
- prebattle-weakened-warning-test: WYNIK 22 OK, 0 FAIL (exit 0); mutacja usunięcia renderu: 19 OK, 3 FAIL
- git diff --check baza..kandydat: czysto
- merge-tree origin/main (359d2df9c) z kandydatem: bez konfliktów, drzewo 52158d3a5
- Pięć bramek referencyjnych zielonych na kandydacie, więc porównanie z bazą dla czerwonych nie było potrzebne. Nowy test czerwony na bazie: pliku testu i modułu na bazie nie ma (mutacja renderu daje czerwony).

## BLOKADY
Brak blokad. Noty: (a) punkt 6 dispatchu (zdanie w Civpedii + regeneracja wikiBundle) NIE_ZROBIONE -- warunkowy („jeśli istnieje właściwe hasło”); do osobnego kroku orkiestratora lub uznania za poza zakresem; (b) ścieżka live NIE_ZMIERZONO; (c) asercja (k) o barbarzyńcach jest słaba w DOM, główną ochronę dają test modułu i filtr w main.ts.

RUNDY: Final Control po rundzie 2 obrony (limit 5 nie przekroczony).
NASTĘPNY KROK: integracja orkiestratora (merge 8e8515c9e do main, build poza repo, deploy ROBOCZA, weryfikacja live w grze), opcjonalnie osobny temat na wpis w Civpedii.
DEPLOY/PUSH: NIE WYKONANO
