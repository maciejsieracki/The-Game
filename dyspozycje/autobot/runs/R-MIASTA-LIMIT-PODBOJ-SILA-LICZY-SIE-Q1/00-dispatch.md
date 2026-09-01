TEMAT:  R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: „Ustawiłem w opcjach nowej gry limit miast w epoce kamienia na
15, jestem w epoce kamienia i mam już 21 miast — to regres." Po recon-u
orkiestrator początkowo podejrzewał dyplomatyczne „wchłonięcie" (adnotacja
poniżej), ale właściciel doprecyzował: „Mówisz, że gdy miasta są wchłonięte,
limit się zwiększa. A to była moja sytuacja, kiedy zdobyłem miasta SIŁĄ, nie
wchłonąłem ich. […] Powinny mieć limit w epoce kamienia taki, jaki
ustawiłem, czyli 15. Nie powinienem zrobić więcej. Faktycznie, być może
gdyby była opcja wchłonięcia, mogłaby obowiązywać ta sama zasada, że mogłoby
ich być więcej, ale nie wchłonąłem ich, tylko je zdobyłem." — czyli miasta
zdobyte SIŁĄ (bitwa/kapitulacja) mają SIĘ LICZYĆ do limitu miast danej
epoki, tak samo jak miasta założone. To ŚWIADOME ODWRÓCENIE wcześniejszej
decyzji `R-MIASTA-LIMIT-PODBÓJ-Q1=A` (miasta podbite miały być wyjęte spod
limitu) — na wyraźne, dwukrotnie potwierdzone życzenie właściciela.

## RECON (wykonany, nie powtarzać)
Limit miast per epokę: `gra/src/game/cities.ts`, `canFoundCity()` (linia
~1024-1037) liczy `ownersCities = cities.filter(c => c.ownerId===ownerId &&
countsTowardCityFoundingLimit(c)).length` i porównuje do `limit = base +
(era-1)*5`. `countsTowardCityFoundingLimit(city)` (linia 965-967): `return
city.foundedByOwner !== false`.

Pole `foundedByOwner` jest USTAWIANE NA `true` dla KAŻDEGO miasta w chwili
utworzenia — zarówno `freshCityPodzial`-owe (linia 1072) jak i
`foundCityAt()` (linia 1111, UŻYWANE TAKŻE dla city-states przy generacji
świata, `foundingCityState=true` — flaga i tak jest `true`, `startCityState`
to osobne pole). Jedyne miejsca, gdzie flaga jest PÓŹNIEJ nadpisywana na
`false` — czyli WYJĘTE spod limitu — to DWIE ścieżki PODBOJU ZBROJNEGO:
- `gra/src/game/post-battle-map.ts:488` (`applyPostCaptureLawOnCapture`
  ciąg, funkcja obsługująca przejęcie miasta w bitwie) — komentarz przy
  linii 486-487: „R-MIASTA-LIMIT-PODBÓJ-Q1=A: przejęte miasto nie zużywa
  puli miast zakładanych przez nowego właściciela."
- `gra/src/main.ts:12629` (`resolveSiegeSurrender`, kapitulacja głodowa) —
  identyczny komentarz i cel.

Dyplomatyczne „wchłonięcie" (`annexCityStateToOwner`, main.ts ~24120-24171)
NIE dotyka tej flagi w ogóle — miasta wchłoniętej cywilizacji ZACHOWUJĄ swoje
dotychczasowe `foundedByOwner` (zwykle `true`, bo każde miasto dostaje `true`
przy tworzeniu) i W ZWIĄZKU Z TYM JUŻ DZIŚ liczą się do limitu nowego
właściciela — to jest już zgodne z tym, czego chce właściciel, ZERO zmian
potrzebnych w `annexCityStateToOwner` w tym temacie (poprzednia hipoteza
orkiestratora o „brakującym foundedByOwner=false" w tej funkcji była błędna
i została odrzucona po doprecyzowaniu właściciela — NIE wprowadzać tamtej
zmiany, byłaby to zmiana w złym kierunku).

Pole `foundedByOwner` jest używane WYŁĄCZNIE przez `countsTowardCityFoundingLimit`
(potwierdzone grepem całego `gra/src` — zero innych odczytów) — bezpieczne
do zmiany bez efektów ubocznych gdzie indziej.

Istniejący test `gra/tools/city-limit-conquered-test.cjs` (11/11 dziś zielony)
asercjuje DZISIEJSZE (mające się zmienić) zachowanie — że miasto podbite w
bitwie/kapitulacji NIE zużywa puli. Ten test ma zostać PRZEPISANY (odwrócone
asercje), nie usunięty — to jest właśnie test tego mechanizmu, tylko z
odwróconym oczekiwanym wynikiem.

## GOAL
W DWÓCH miejscach — `gra/src/game/post-battle-map.ts:488` i
`gra/src/main.ts:12629` — usuń (lub odwróć) przypisanie `city.foundedByOwner
= false` po przejęciu miasta w wyniku podboju zbrojnego (bitwa / kapitulacja
głodowa), tak żeby PRZEJĘTE SIŁĄ miasto LICZYŁO SIĘ do limitu miast danej
epoki nowego właściciela — dokładnie tak samo jak miasto założone przez
osadnika. Najprostsza poprawna zmiana: usunąć linię przypisania w obu
miejscach (flaga zostaje wtedy taka, jaka była — `true` dla zdecydowanej
większości miast, bo każde miasto dostaje `true` przy założeniu) — NIE
wymyślaj nowej wartości/logiki, samo usunięcie tej jednej linii w każdym z
dwóch miejsc realizuje GOAL.

**JAWNIE POZA ZAKRESEM tego tematu** (nie dodawaj, nie projektuj):
- Blokowanie samego PODBOJU/kapitulacji, gdy nowy właściciel jest już przy
  limicie lub go przekroczy — podbój ZAWSZE się udaje jak dotychczas, zmienia
  się WYŁĄCZNIE to, czy podbite miasto liczy się do przyszłego limitu
  zakładania NOWYCH miast. Gracz/AI może więc nadal przekroczyć limit przez
  podbój — po prostu wtedy NIE będzie mógł zakładać kolejnych nowych miast,
  dopóki nie spadnie poniżej limitu (utrata miast) albo nie wejdzie w kolejną
  epokę (wyższy limit).
- `annexCityStateToOwner` (wchłonięcie dyplomatyczne) — ZERO zmian, już
  działa zgodnie z życzeniem właściciela (patrz RECON).
- Sama formuła limitu (`base + (era-1)*5`) i UI ustawień (`_menuCityLimitBase`)
  — nietknięte, poprawne.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Realny, żywy dowód (headless Chromium LUB test Node importujący
   PRAWDZIWY `applyCityCaptureAfterBattle`/`resolveSiegeSurrender` przez
   esbuild, NIE przepisana logika): gracz przy limicie miast N w epoce
   Kamień, po zdobyciu w bitwie/kapitulacji JESZCZE JEDNEGO miasta wroga —
   PRÓBA założenia NOWEGO miasta osadnikiem jest odrzucona przez
   `canFoundCity` z powodem „limit miast na tej epoce", DOKŁADNIE tak jakby
   to podbite miasto było założone przez osadnika.
2. `city-limit-conquered-test.cjs` przepisany (odwrócone asercje) i zielony —
   liczba asercji może się zmienić, ale test nadal pokrywa DOKŁADNIE ten sam
   mechanizm (podbój bitewny + kapitulacja), z nowym, poprawnym oczekiwanym
   zachowaniem.
3. Zero zmian w `annexCityStateToOwner` i zero zmian w zachowaniu
   wchłonięcia dyplomatycznego (dowód: istniejące testy wchłonięcia, jeśli
   są, zielone bez zmiany liczby asercji; jeśli nie ma dedykowanego testu,
   recon kodu potwierdzający zero diffu w tej funkcji).
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/game/post-battle-map.ts` (WYŁĄCZNIE linia z `foundedByOwner =
false` i bezpośrednio sąsiadujący komentarz — aktualizacja komentarza
dozwolona, żeby nie zostawić mylącej nieaktualnej notatki),
`gra/src/main.ts` (WYŁĄCZNIE analogiczna linia w `resolveSiegeSurrender`,
~12629, i jej komentarz), `gra/tools/city-limit-conquered-test.cjs`
(przepisanie asercji). Zakazane bezwzględnie: `gra/src/game/cities.ts`
(`canFoundCity`/`countsTowardCityFoundingLimit` zostają nietknięte — sama
FUNKCJA jest już poprawna, zmienia się tylko to, CO do niej trafia),
`annexCityStateToOwner` i cały kod wchłonięcia dyplomatycznego,
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione na podstawie samego usunięcia linii
bez realnego testu odtwarzającego scenariusz właściciela (podbój → próba
założenia nowego miasta → odrzucenie) — to jest DOKŁADNIE ta klasa błędu
(cichy warunek pomijający sprawdzenie), która już raz przeszła niezauważona
w tej rundzie tematu. Zakaz rozszerzania zakresu na blokowanie samego
podboju — to jest jawnie POZA zakresem (patrz GOAL), nawet jeśli wydaje się
„spójniejsze" — właściciel nie prosił o to i wymagałoby to osobnej decyzji
produktowej (co się dzieje z miastem, które by przekroczyło limit: odmowa
podboju? auto-zniszczenie? nic z tych rzeczy nie jest dziś ustalone).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce, jeśli potrzebny). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
