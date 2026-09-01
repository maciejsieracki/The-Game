TEMAT:  P-KARTY-HISTORIA-TEST-TARASY-HARDCODE-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Final Control tematu `R-KARTY-HISTORIA-I2-Q1` (batch treści wypełniający
pole `historia` dla „Tarasy uprawne" i 10 innych ulepszeń) znalazł NOWĄ,
dotąd nieujawnioną regresję: `gra/tools/entity-card-historia-section-test.cjs`,
sekcja [1] (linie ~161-163), ma twardą asercję:
```
check('Tarasy uprawne: sekcja "Rys historyczny" nie istnieje (pole "historia" jeszcze puste w danych)',
  tarasy.historiaExists === false, tarasy);
```
To DOKŁADNIE ta sama klasa błędu, którą naprawił już
`P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1` (sekcje [4]/[5] tego samego
pliku) — ale TA konkretna asercja w sekcji [1] nie była w zakresie tamtego
tematu (dotyczy innej sekcji testu, innego celu — regresji dev-tekstu na
Tarasach, nie ogólnego mechanizmu historia/Historia). Po integracji
`R-KARTY-HISTORIA-I2-Q1` (Tarasy dostają realną treść `historia`) ta
asercja fałszywie czerwienieje: 30 pass/1 fail zamiast 31/31.

## GOAL
W `gra/tools/entity-card-historia-section-test.cjs`, sekcja [1] (linie
~140-163): zmień asercję linii 162-163 z twardego `tarasy.historiaExists
=== false` na WARUNKOWĄ, analogicznie do naprawy zastosowanej w sekcji [4]
przez `P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1` — odczytaj realny stan
pola `historia` dla `tarasy` (np. `window.__resolveImprovementRow('tarasy').historia`)
i asercjuj `tarasy.historiaExists === (pole niepuste)`. Zbierz tę wartość w
tym samym `page.evaluate()` co reszta danych o Tarasach (linie 140-155),
żeby nie duplikować logiki. Nie zmieniaj żadnej INNEJ asercji tej sekcji
(civRow/techRow/uwagiRowExists — te sprawdzają REALNY, trwały regres
dev-tekstu i mają zostać dokładnie takie jak są).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Test przechodzi w 100% NA DZISIEJSZYM stanie `main` (przed integracją
   `R-KARTY-HISTORIA-I2-Q1`, gdzie `tarasy.historia` jest jeszcze puste).
2. Test PRZECHODZI RÓWNIEŻ po scherry-pickowaniu `R-KARTY-HISTORIA-I2-Q1`
   (commit `89a25638`) na wierzch — dowód: wykonaj ten cherry-pick w swoim
   worktree (albo symuluj wstrzyknięciem `historia` dla `tarasy` w pamięci
   testu) i pokaż 31/31.
3. Pozostałe asercje sekcji [1] (civRow/techRow/uwagiRowExists) NIEZMIENIONE
   co do treści i zachowania — nadal łapią oryginalny regres dev-tekstu,
   gdyby ktoś go przywrócił.
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/tools/entity-card-historia-section-test.cjs` WYŁĄCZNIE. Zakazane
bezwzględnie: `gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-KARTY-HISTORIA-TEST-TARASY-HARDCODE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 2 za spełnione bez REALNEGO odtworzenia (cherry-pick
albo wstrzyknięcie w pamięci testu) scenariusza „Tarasy mają już treść" —
dokładnie ta klasa błędu już dwa razy naprawdę wystąpiła w tej sesji.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only, następnie NATYCHMIAST integruje
`R-KARTY-HISTORIA-I2-Q1` (już PASS merytorycznie, czekał wyłącznie na to).
