STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1
GOAL: Przywrócić czytelny pasek POZOSTAŁEGO RUCHU na kartach jednostek w panelu armii i na mini-kartach stosu: wypełnienie = ruchLeft/ruchMax, tor widoczny przy 0, podpowiedź „Ruch: X z Y”.
ZMIANY/COMMIT: baza origin/main (b765e4994). Allowlista: gra/src/ui/armyListHud.ts (tor ruchu), gra/src/ui/armyStackHud.ts (pasek ruchu mini-karty + import pctClamped), nowy test gra/tools/army-panel-card-move-bar-test.cjs, runs/R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1/. Commit: SHA w sekcji DEPLOY/PUSH (wpisany po commicie w tej samej rundzie).

DIAGNOZA (kod, nie zrzut):
- Panel armii (armyListHud.ts, karta z listy armii): pasek ruchu JEST renderowany, gdy ruchMax > 0. Wypełnienie = pctClamped(ruchLeft, ruchMax). Przy ruchLeft=0 wypełnienie wynosi 0% — tor jest pusty, to zgodne z ruchem 0/12 w tej turze. Tor miał tło rgba(0,0,0,.35) bez obwódki, więc na ciemnym panelu był słabo widoczny (wrażenie „czarnego pustego paska”).
- Mini-karta stosu (armyStackHud.ts, .ash-card): paska ruchu NIE BYŁO. Był tylko tekst „X/Y ruch”. To jest główna luka względem zgłoszenia (karty niespójne).
- Nie ustalono, czy pasek znikł po zmianach FOLLOW-LEADER/ARMY-PANEL/stackgroup (historia gita nie była przeglądana w tej rundzie) — NIE_ZMIERZONO.
- Liczba „34/33.6” z zrzutu NIE pochodzi z tych plików (karta armii używa Math.round; formatLiczbaPl jest w armyMergePanel.ts, poza allowlistą) — NIE_ZMIERZONO, do weryfikacji w osobnym temacie, jeśli właściciel potwierdzi.

NAPRAWA:
1. armyStackHud.ts: mini-karta ma teraz dwa paski — .ash-card-hp (zdrowie, bez zmian) i nowy .ash-card-mvbar (ruch) z <i style="width:pctClamped(ruchLeft,ruchMax)%">. Tekst „X/Y ruch” zachowany (test army-stack-commander-identity-test oczekuje „12/12 ruch”). Dodany title „Ruch: X z Y” na karcie tekstu i na pasku. CSS: tor 4 px, rgba(0,0,0,.35) + obwódka inset rgba(111,176,240,.28); wypełnienie gradient #1d4e8f→#6fb0f0.
2. armyListHud.ts: tor .al-mvbar dostał obwódkę inset rgba(111,176,240,.28), żeby tor był widoczny przy 0. Logika wypełnienia, etykieta „Ruch X/Y” i tooltip „Ruch: X z Y” bez zmian.
3. Etykieta: w karcie armii etykieta to „Ruch” + „0/12” (czytelne); w mini-karcie „0/12 ruch” (format zachowany ze względu na istniejący test). Nie zmieniano na „ruch 0/12” — zgłoszenie opisywało to jako postulat, nie wymóg; przy zmianie trzeba by poprawić test army-stack-commander-identity-test.

TESTY:
- node tools/army-panel-card-move-bar-test.cjs — 15/15 PASS (strukturalny: pctClamped, dwa paski w mini-karcie, szerokość = pctClamped(ruchLeft,ruchMax), title „Ruch: X z Y”, widoczny tor, pasek armii dla ruchMax>0, etykieta i tooltip).
- PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node tools/army-stack-commander-identity-test.cjs — 8/8 PASS (renderer Chromium, karty 89-jednostkowego stosu, tekst „12/12 ruch” zachowany).
- node tools/side-list-hud-panel-coverage-test.cjs — OK (74/74).
- tsc --noEmit -p gra — exit 0, 0 błędów TS.
- git diff --check — czysto.
- Test npm ci w worktree: `npm ci --ignore-scripts` (71 pakietów) — tylko do uruchomienia testów, node_modules nieśledzone.
- NIE_ZMIERZONO: wizualny zrzut karty armii w realnej grze (ani w Chromium, ani w przeglądarce właściciela) — nie wykonano screenshotu panelu armii; dowodem jest test strukturalny i renderer mini-karty. Weryfikacja na żywo wymagana przed uznaniem wizualnym.
- NIE_ZMIERZONO: regresje army-merge-panel-* (nie dotykają zmienionych plików; nie uruchamiane).

BLOKADY: brak zmian poza allowlistą; brak WERSJE.md, gra-robocza/, build/dev, git add -A, push, deploy. Pytania właściciela z innych tematów zignorowane zgodnie z dispatchem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) + Final Control na commicie tematu; weryfikacja wizualna karty armii w realnej grze przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
