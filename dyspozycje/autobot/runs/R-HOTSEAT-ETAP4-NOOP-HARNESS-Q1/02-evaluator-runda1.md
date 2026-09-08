STATUS: FAIL
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1
GOAL: (zgodne z 00-dispatch.md i 01-operator-runda1.md, bez rozbieżności — zweryfikowane
punkt-po-punkcie, zob. pkt 9 checklisty niżej) Zbudować samodzielną bramkę-narzędzie
dowodu no-op dla przyszłego rozcięcia `triggerPlayerEndTurn()` i dowieść jej samej
(30/30 identycznych hashy SHA-256 między dwoma niezależnymi uruchomieniami na
DZISIEJSZYM, nierozciętym kodzie) — bez żadnej zmiany `gra/src/**`.
ZMIANY/COMMIT: potwierdzone w worktree `/home/user/wt-hotseat-etap4-noop-harness`
(branch `autobot/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1`, HEAD `a44cb440`, baza `a5bb7651`).
`git diff --stat a5bb7651..HEAD`: wyłącznie 3 pliki — `gra/tools/hotseat-etap4-noop-test.cjs`
(399 linii, NOWY), `dyspozycje/autobot/runs/.../00-dispatch.md`,
`dyspozycje/autobot/runs/.../01-operator-runda1.md` — zgodne z allowlistą, zero `gra/src/**`.
`git status --porcelain` czysty. `git diff --check a5bb7651..HEAD` exit 0 (brak białych
znaków/konfliktów). Brak `git add -A` (commit `a44cb440` obejmuje wyłącznie 2 pliki
poza dispatchem, zgodnie z allowlistą).
TESTY: Kod źródłowy pliku przeczytany w całości i skonfrontowany ze specyfikacją §6.2 —
zgodny (seed 778899 w `__cityStateStartUnitsTestDebug.startNewGame`, main.ts:22240;
`endTurn: () => triggerPlayerEndTurn()` main.ts:21498; `doQuickSave`→`persistSaveToSlot`
main.ts:28049-28050; `AUTOSAVE_SLOT_ID='autosave'`/`SAVE_PREFIX='thegame.save.'`
save.ts:108,136; `DB_NAME='thegame-saves'`/`STORE_NAME='kv'` idb-storage.ts:40,42;
jedyny `new Date()` w main.ts:27805 — wszystko potwierdzone świeżym grepem). Determinizm
(`page.addInitScript` z mulberry32) wstrzykiwany PRZED `page.goto` — zgodne z wymogiem
"przed importem silnika". TURNS=30 zahardkodowane, brak zmiennej środowiskowej
obniżającej liczbę tur. `tsc --noEmit`: potwierdzone, `tools/*.cjs` poza `include:["src"]`
tsconfig.json — zasadnie odnotowane jako N/A, nie pominięte.

NIEZALEŻNE URUCHOMIENIE (REGUŁA PRZECIW SAMOOSZUKIWANIU) — 3 pełne, osobne
uruchomienia procesu (`node tools/hotseat-etap4-noop-test.cjs`, każde: świeży build +
świeże A + świeże B), z katalogu `gra/`:

Uruchomienie 1: Run A 30/30 hashy — BYTE-FOR-BYTE identyczne z listą Operatora (tura1
5a812a3ce327...… tura30 f9580821f34d...), 7/7 identycznych console.error. Run B: turу
1-26 identyczne z Run A, potem w trakcie tury 27:
`BLOCK: hak testowy end-turn/save nie zadziałał headless: page.evaluate: Target page,
context or browser has been closed` (rzucone w `endTurnAndSettle`, linia 222).

Uruchomienie 2: Run A ponownie 30/30 identyczne (te same hashe). Run B: tury 1-15
identyczne, crash w trakcie tury 16, ten sam komunikat (rzucony w `saveAndReadSnapshot`,
linia 238).

Uruchomienie 3: Run A ponownie 30/30 identyczne. Run B: tury 1-5 identyczne, crash w
trakcie tury 6, ten sam komunikat (linia 222). Proces NIE zakończył się szybkim
`process.exit(2)` — zawisł, `timeout 590` musiał go ubić: `EXIT=124` w pliku wyjścia
(dowód: `eval_run3.log` ostatnia linia `EXIT=124`, worktree Evaluatora poza repo).

BLOKADY: patrz ZARZUTY 1-2 (blokujące ponowną, niezawodną weryfikację bramki).
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (§3c pkt 2) do zarzutów 1-2, potem Final Control.

ZARZUTY:

1. **Bramka nie kończy się niezawodnie dwoma czystymi przebiegami (A i B) na tym samym
   uruchomieniu procesu — sprzeczne z ZMIANY/COMMIT raportu Operatora.** Miejsce:
   `gra/tools/hotseat-etap4-noop-test.cjs`, cała funkcja `runOnce` (linie 272-321),
   błąd materializuje się w `endTurnAndSettle` (linia 222) lub `saveAndReadSnapshot`
   (linia 238) — `page.evaluate: Target page, context or browser has been closed`.
   W 3 na 3 niezależnych, pełnych uruchomieniach procesu przez Evaluatora: Run A
   kończy się zawsze czysto 30/30 (hashe identyczne z listą Operatora), ale Run B
   przerywa się crashem przeglądarki w LOSOWYM miejscu (tura 27, potem 16, potem 6 —
   różne za każdym razem, więc to nie jest deterministyczna wada logiki testu, tylko
   niestabilność środowiska/przeglądarki w drugim przebiegu). Operator zgłosił
   "WYKONANIE BRAMKI 2× NIEZALEŻNIE ... Przebieg 1 ... 30/30 ... Przebieg 2 ... 30/30
   ... EXIT_CODE=0" bez żadnej wzmianki o możliwości takiego crashu. Dla GOAL ma to
   znaczenie wprost: ta bramka ma być użyta w PRZYSZŁEJ rundzie do porównania hash-listy
   SPRZED i PO rozcięciu `triggerPlayerEndTurn()` — jeśli w 3/3 prób Evaluatora
   przebieg B (czyli w przyszłości "PO rozcięciu") nie kończy się niezawodnie, przyszła
   runda dostanie fałszywy `BLOCK` zamiast rozstrzygnięcia PASS/FAIL no-op, nie z winy
   samego rozcięcia. To jest zarzut do checklisty §16a pkt 3 ("czy bramki i testy tematu
   faktycznie przechodzą — wynik uruchomiony niezależnie") — mój niezależny wynik NIE
   jest czystym PASS.

2. **Przy crashu przeglądarki proces nie kończy się szybkim, czytelnym `BLOCK`
   (`process.exit(2)`), tylko zawisa.** Miejsce: `gra/tools/hotseat-etap4-noop-test.cjs`,
   blok `finally { await browser.close(); }` w `runOnce` (linia 317-319) — wywołanie
   `browser.close()` na już martwym/zamkniętym uchwycie przeglądarki najwyraźniej nie
   rozstrzyga się (nie ma tam żadnego timeoutu), więc `catch` w `main()` (który miałby
   wypisać `BLOCK` i wywołać `process.exit(2)`) nigdy nie jest osiągany na czas —
   potwierdzone bezpośrednio w Uruchomieniu 3: `timeout 590` musiał ubić proces
   (`EXIT=124`), zamiast zobaczyć zamierzony `EXIT_CODE=2`. Dla GOAL: bramka
   przeznaczona do powtarzalnego użycia w przyszłych rundach powinna zawodzić szybko
   i czytelnie, nie wisieć ~10 minut przy każdym crashu przeglądarki.

3. **(Informacyjne, niższy priorytet) Brak wzmianki o pięciu bramkach referencyjnych
   §6 / `tsc --noEmit` jako defensywnym sprawdzeniu regresji.** R-PROC-AUTOBOT.md §12
   (linie 683-686): "`tsc --noEmit` i pięć bramek referencyjnych z §6 (`logic-test`,
   `tech-tree-test`, `research-test`, `unit-replace-test`, `combat-test`) są wymagane w
   **każdym** dispatchu tego repo z definicji". Raport Operatora adresuje `tsc --noEmit`
   (zasadnie, z uzasadnieniem N/A dla `tools/*.cjs`), ale nie wspomina wcale o pięciu
   bramkach referencyjnych — ani wyniku, ani świadomego pominięcia z uzasadnieniem.
   Ryzyko regresji jest tu niskie (zero zmian `gra/src/**`), więc traktuję to jako
   zarzut niski priorytetowo, nie blokujący — ale reguła nie ma wyjątku dla tematów
   czysto narzędziowych, więc odnotowuję zamiast pomijać.

USTALENIA POZYTYWNE (nie zarzuty, kontekst dla Final Control): wszystkie hashe, które
zdążyły powstać w moich 3 niezależnych uruchomieniach (30/30 Run A ×3 + częściowe Run B
do punktu crasha ×3), są bajt-w-bajt identyczne z listą zgłoszoną przez Operatora — sam
mechanizm hashowania stanu (realny `buildSaveGameSnapshot` przez Ctrl+S→IndexedDB,
patch mulberry32 PRZED `page.goto`, normalizacja wyłącznie `meta.savedAt`) jest
potwierdzony jako faktycznie deterministyczny tam, gdzie proces przeżywa. Wszystkie
twierdzenia Operatora o numerach linii/nazwach haków w `main.ts`/`save.ts`/
`idb-storage.ts` zweryfikowane świeżym grepem — zgodne co do joty. Nie ma tu podejrzenia
sfabrykowania hashy — problem jest w niezawodności ukończenia dwóch pełnych przebiegów
w jednym procesie, nie w poprawności samego mechanizmu hashowania.

DEPLOY/PUSH: NIE WYKONANO
