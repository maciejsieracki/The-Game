STATUS: DISPATCH
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1
GOAL: Zbudować samodzielną bramkę-narzędzie dowodu no-op dla przyszłego rozcięcia
`triggerPlayerEndTurn()` (Etap 4 planu hot-seat), zgodnie z rekomendacją §6.2
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`.
Ta runda NIE dotyka `main.ts` ani żadnego pliku produkcyjnego — wyłącznie nowy plik
testowy, uruchamiany przeciw DZISIEJSZEMU (nierozciętemu) kodowi, żeby ustalić
punkt odniesienia i dowieść, że sama bramka działa, zanim ktokolwiek zacznie
faktyczne rozcinanie funkcji.

WYZWALACZ / ZADANIE / KRYTERIUM (R-PROC-AUTOBOT.md §2a):
- Wyzwalacz: recon Etapu 4 (już zintegrowany, `72345570`) wskazał w §6.2 gotową do
  wdrożenia metodę weryfikacji no-op, ale sama bramka jeszcze nie istnieje — bez niej
  żadna przyszła runda faktycznego rozcięcia `triggerPlayerEndTurn()` nie ma jak
  dowieść bezpieczeństwa.
- Zadanie: napisać `gra/tools/hotseat-etap4-noop-test.cjs` wg specyfikacji §6.2 (patrz
  niżej), uruchomić go przeciw bieżącemu kodowi (bez żadnego rozcięcia) i potwierdzić,
  że generuje deterministyczną, powtarzalną sekwencję 30 hashy.
- Binarne kryterium sukcesu: dwa niezależne uruchomienia tego samego nowego testu na
  TYM SAMYM (nierozciętym) kodzie źródłowym dają IDENTYCZNĄ listę 30 hashy SHA-256
  (jedno per turę, tury 1..30, `endTurn()` bez żadnych innych rozkazów gracza) —
  PRAWDA/FAŁSZ, sprawdzalne bezpośrednio z outputu testu.

SPECYFIKACJA (z recon §6.2, powtórzona dosłownie dla tej rundy):
1. Nowa gra, ustalony seed mapy — użyj tego samego wzorca inicjalizacji stanu gry
   headless co istniejący `gra/tools/logic-test.cjs` (wzorzec `_menuAdvanced`/seed).
2. Pętla: wywołaj hak testowy końca tury (ten sam używany przez istniejące testy
   Playwright wg komentarzy w main.ts @ ok. 19228/22231/22333, np. `__eraTestDebug.endTurn()`
   albo bezpośrednio `triggerPlayerEndTurn()` w środowisku headless Node) **30 razy
   pod rząd**, bez żadnych innych rozkazów gracza między wywołaniami.
3. Po KAŻDEJ turze policz hash stanu: użyj `buildSaveGameSnapshot()` (main.ts ~26713+,
   już istnieje) jako źródła kanonicznego stanu, zserializuj deterministycznie
   (`JSON.stringify` z kluczami posortowanymi albo dedykowany stabilny stringifier),
   policz SHA-256 (Node `crypto.createHash('sha256')`).
4. Przed uruchomieniem obu wariantów porównawczych: wstrzyknij deterministyczny
   `Math.random` na czas testu (monkey-patch, np. `mulberry32(seed)`), żeby wyeliminować
   niedeterminizm z 6 generatorów ID jednostek i `pickVillageReward` (11 wystąpień
   `Math.random()` w main.ts wg planu §H3 pkt 2) — bez żadnej zmiany w main.ts, patch
   wyłącznie wewnątrz pliku testowego, przed jego importem/uruchomieniem silnika.
5. Zapisz listę 30 hashy z uruchomienia A, uruchom PONOWNIE (uruchomienie B, ten sam
   seed, ten sam patch determinizmu), porównaj listy — muszą być identyczne.
6. Kryterium PASS tej rundy: 30/30 identycznych hashy między uruchomieniem A i B, na
   DZISIEJSZYM (nierozciętym) kodzie. To NIE dowodzi jeszcze niczego o Etapie 4 samym
   w sobie (nie ma jeszcze czego porównywać z „po rozcięciu") — dowodzi wyłącznie, że
   bramka jest sama w sobie deterministyczna i gotowa do użycia w przyszłej rundzie
   faktycznego rozcięcia (gdzie porówna się hash-listę SPRZED i PO).

ALLOWLISTA:
- `gra/tools/hotseat-etap4-noop-test.cjs` (NOWY plik, jedyna zmiana produkcyjna/testowa)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1/*` (raporty własne)
Zakaz jakiejkolwiek zmiany w `gra/src/main.ts` lub innym pliku poza powyższymi —
to jest INFRASTRUKTURA TESTOWA, nie zmiana zachowania gry. Zakaz `git add -A`.
Zakazane bezwzględnie: `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

IZOLACJA: worktree `/home/user/wt-hotseat-etap4-noop-harness`, gałąź
`autobot/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1`, baza `origin/main` @ `a5bb7651`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node tools/*-test.cjs` są
dozwolone bez ograniczeń.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania bramki za działającą na podstawie
jednego uruchomienia albo bez faktycznego pokazania 30 hashy w obu przebiegach —
jeśli test nie da się uruchomić headless (np. silnik wymaga DOM/Playwright), zgłoś
to jako BLOCK z konkretnym błędem zamiast upraszczać specyfikację po cichu (np.
redukując liczbę tur albo pomijając krok determinizmu Math.random).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1
na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow, effort per rola wg
R-PROC-AUTOBOT.md §5a) → orkiestrator dispatchuje Final Control osobno → integracja
allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
