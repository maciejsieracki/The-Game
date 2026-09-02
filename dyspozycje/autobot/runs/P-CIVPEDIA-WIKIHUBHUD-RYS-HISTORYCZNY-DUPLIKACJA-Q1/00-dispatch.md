TEMAT:  P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Podczas batcha treści `R-CIVPEDIA-TECHNOLOGIE-Q1`, Operator, Evaluator i Final
Control NIEZALEŻNIE odkryli i potwierdzili pre-istniejący bug w
`gra/src/ui/wikiHubHud.ts`, wprowadzony wcześniej w commicie infrastruktury
`R-CIVPEDIA-HISTORIA-INFRA-Q1` (`d6032099`), poza allowlistą tamtego tematu —
stąd nie naprawiony na miejscu, zgłoszony jako osobny temat.

## RECON (wykonany, nie powtarzać)
`gra/src/ui/wikiHubHud.ts::pickEncyContent(entry, depth)` (linie ~319-327):
dla `depth==='full'` zwraca `entry.full` (cała treść pliku `.md`, WŁĄCZNIE z
sekcją `## Rys historyczny`, bo `entry.full` to surowy `body` pliku po
`bundle-wiki-for-game.cjs`), a NASTĘPNIE dokleja `historiaBlock`
(`\n\n## Rys historyczny\n\n${entry.historia}`) PONOWNIE na końcu — sekcja
występuje w DOM dwukrotnie. Dla `depth==='m'` używane jest `entry.wikiM`
(osobna, wyekstrahowana sekcja "Wiki-M", NIE zawierająca "## Rys
historyczny"), więc tam doklejenie jest poprawne, jednorazowe — bug dotyczy
WYŁĄCZNIE widoku 'full'. Potwierdzone empirycznie żywym renderem w headless
Chromium (Playwright) na hasłach "Astronomia"/"Obróbka drewna"/"waluta"/
"oblężnictwo" przez 3 niezależne agenty (Operator, Evaluator, Final Control
tematu R-CIVPEDIA-TECHNOLOGIE-Q1) — `occurrences=2` nagłówka "Rys
historyczny" w DOM przy `depth==='full'`.

## GOAL
W `pickEncyContent(entry, depth)` (`gra/src/ui/wikiHubHud.ts`), gałąź
`depth==='full'`: nie doklejaj `historiaBlock` jeśli `entry.full` JUŻ
zawiera sekcję `## Rys historyczny` (np. sprawdzenie
`entry.full.includes('\n## Rys historyczny\n')` przed doklejeniem, analogicznie
do tego jak inne gałęzie już warunkują doklejenie na `entry.historia`
niepustym). Cel: przy `depth==='full'` sekcja "Rys historyczny" ma wystąpić
w DOM DOKŁADNIE RAZ dla wpisów mających niepuste `entry.historia`, zero razy
dla wpisów bez `historia`. Zero zmian w zachowaniu `depth==='m'`/`'s'` (już
działają poprawnie, nie dotykaj).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: dla DOWOLNEGO hasła z niepustym
   `entry.historia` (np. dowolna z 5 kategorii już zintegrowanych na `main` —
   budynki/ulepszenia/technologie/jednostki), widok `depth==='full'` pokazuje
   nagłówek "Rys historyczny" DOKŁADNIE RAZ w DOM (nie zero, nie dwa razy).
2. Ten sam żywy dowód dla `depth==='m'` — nadal DOKŁADNIE RAZ (zero regresu
   istniejącego, poprawnego zachowania).
3. Dla wpisu BEZ `entry.historia` (puste) — zero wystąpień nagłówka na obu
   głębokościach `'m'`/`'full'` (zero regresu).
4. Dowód nietautologiczności: zmutuj warunek z powrotem na "zawsze dokleja"
   (odtwórz bug) — test musi się zaczerwienić na kryterium 1, potwierdzając
   że faktycznie sprawdza duplikację, nie coś przypadkowego.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
`gra/src/ui/wikiHubHud.ts` (WYŁĄCZNIE funkcja `pickEncyContent`, gałąź
`depth==='full'`), nowy/rozszerzony plik testowy w `gra/tools/`. Zakazane
bezwzględnie: `gra/tools/bundle-wiki-for-game.cjs`, `docs/encyklopedia/**`,
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów za spełnione bez realnego zrzutu z żywej przeglądarki
liczącego FAKTYCZNE wystąpienia nagłówka w DOM (np.
`document.querySelectorAll('h3').filter(...)`.length`), nie samego faktu że
sekcja "jest widoczna". Wymagany dowód mutacyjny (kryterium 4).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
