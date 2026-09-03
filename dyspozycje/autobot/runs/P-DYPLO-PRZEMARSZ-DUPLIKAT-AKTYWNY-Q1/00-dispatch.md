TEMAT: P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/diplomacy-locks.ts (case '4'), gra/src/main.ts (budowa ctx dla
resolveDiplomacyActionLock — funkcja zawierająca `hasNap:`/`hasWymiana:` ok. linii 18474-18510)
MODEL+EFFORT: claude-sonnet-5, effort high (potwierdzony błąd logiki, wymaga żywej
weryfikacji w przeglądarce jak każdy temat dotykający UI audiencji)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu panelu audiencji dyplomatycznej)
"Po drugie, pomimo podpisanej umowy na traktat przemarszu, nadal jest dostępny. Powinien
być tylko jeden; powinna być możliwość ustanowienia, a nie kolejny traktat. Tutaj jest
błąd. Trzeba było też sprawdzić, jak jest z innymi traktatami. Większość powinna być
jednorazowa, poza umową wymiany surowców. Ale trzeba to logicznie też przejrzeć."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Zrzut ekranu właściciela pokazuje: panel „Aktywne traktaty" zawiera już „Traktat
  przemarszu (wojskowy)" (od 0 tur), a mimo to panel „Możliwe umowy" nadal pokazuje
  „Traktat przemarszu" jako klikalny, bez ikony kłódki, bez adnotacji „już zawarty" —
  identycznie jak pozycje, które NIGDY nie były podpisane.
- Przyczyna zlokalizowana z pewnością: `resolveDiplomacyActionLock()`
  (`gra/src/game/diplomacy-locks.ts:171-309`) ma dla działań '2' (Pakt), '3' (Sojusz),
  '5' (Handel), '14' (Wymiana surowców) identyczny wzorzec — sprawdzenie flagi
  `ctx.hasNap`/`hasSojusz`/`hasHandel`/`hasWymiana` NA POCZĄTKU case'a, zwracające
  `{ locked: false, active: true, note: 'już zawarty/zawarta' }` (stała `ALREADY_NOTE`,
  linie 159-164). **Case '4' (linie 191-196, „Otwarte granice / prawo przemarszu") TEGO
  SPRAWDZENIA NIE MA** — od razu leci w `dualGate(...)` na Relację/Zaufanie i zwraca
  `{ locked: false, note: 'przemarsz wojsk dozwolony' }` niezależnie od tego, czy traktat
  jest już aktywny.
- Kontekst (`DiplomacyActionLockContext`) budowany w `main.ts` (funkcja lokalna ok. linii
  18459-18511) NIE ma pola odpowiednika `hasGranice`/`hasPrzemarsz` — trzeba je dodać
  analogicznie do istniejącego `hasNap: hasTreaty(activeDeals, 0, ownerId,
  RodzajTraktatu.PaktNieagresji)` (linia 18480), tylko sprawdzając WSZYSTKIE trzy warianty
  traktatu przemarszu jednocześnie: `RodzajTraktatu.OtwartGranice`,
  `RodzajTraktatu.PrawoWojskowePrzemarszu`, `RodzajTraktatu.WspolnaWalkaBarbarzyncy` (import
  z `../types/diplomacy`, już zaimportowany w main.ts jako `RodzajTraktatu`).
- Traktat jest symetryczny (`dealsForPair`/`hasTreaty` w `diplomacy-treaties.ts:223-231,
  297-300` normalizują parę stron przez `pairKey`, bez względu na kolejność) — sprawdzenie
  `hasTreaty(activeDeals, 0, ownerId, <rodzaj>)` jest więc poprawnym, symetrycznym
  wzorcem identycznym jak dla `hasNap`.
- AUDYT INFORMACYJNY (do zebrania przez Operatora, NIE do naprawy w tym temacie poza
  case '4'): case '12' (Wasalizacja) w `diplomacy-locks.ts:269-274` też nie ma sprawdzenia
  „już aktywna" mimo `ctx.hasWasal` istniejącego w kontekście (używanego tylko w case
  '15') — może to być zamierzone (renegocjacja stawki trybutu wasala) albo kolejny
  przypadek tego samego błędu. Case '14' (Wymiana surowców) MA sprawdzenie „już zawarta"
  — czy to poprawne dla umowy, która z natury powinna być odnawialna (cytat właściciela:
  „większość powinna być jednorazowa, poza umową wymiany surowców"), zależy od tego, czy
  traktat `UmowaWymiany` faktycznie wygasa (`wygasaTura`) i sam znika z `activeDeals` po
  czasie — SPRAWDŹ EMPIRYCZNIE i opisz w raporcie jako osobne ustalenie, nie zmieniaj kodu
  poza allowlistą.

GOAL
1. Case '4' w `resolveDiplomacyActionLock` sprawdza NA POCZĄTKU (przed `dualGate`), czy
   traktat przemarszu w KTÓREJKOLWIEK z trzech odmian (cywilny/wojskowy/wspólna walka z
   barbarzyńcami) jest już aktywny między graczem a partnerem — jeśli tak, zwraca
   `{ locked: false, active: true, note: 'już zawarty' }` (dopisz do `ALREADY_NOTE['4']`),
   dokładnie jak case '2'/'3'/'5'/'14'.
2. `main.ts`: nowe pole w kontekście (np. `hasGranice`) obliczone jako `hasTreaty(...,
   OtwartGranice) || hasTreaty(..., PrawoWojskowePrzemarszu) || hasTreaty(...,
   WspolnaWalkaBarbarzyncy)`, przekazane do `resolveDiplomacyActionLock` przez case '4'.
3. Interfejs `DiplomacyActionLockContext` (diplomacy-locks.ts) rozszerzony o to pole z
   komentarzem analogicznym do istniejących.
4. Zero zmian w progach `progGraniceRelacja`/`progGraniceZaufanie`/`progGraniceWojskoweRespekt`
   ani w logice samego zawierania traktatu (`diplomacy-proposals.ts`) — WYŁĄCZNIE logika
   blokady/wyświetlania na liście „Możliwe umowy".
5. Raport zawiera krótką tabelę audytu (2-3 zdania) dla case '12' i '14' — ustalenie, nie
   naprawa, chyba że naprawa jest trywialna i oczywista (np. jeśli '14' faktycznie
   wygasa poprawnie i zachowanie jest zamierzone — zostaw bez zmian).

KRYTERIA KOŃCA (binarne)
1. Żywy render w headless Chromium (Playwright): po zawarciu Traktatu przemarszu (dowolny
   wariant) między graczem a AI, panel „Możliwe umowy" pokazuje pozycję „Traktat
   przemarszu" z ikoną/klasą identyczną jak zawarty Pakt o nieagresji (`locked: false,
   active: true`, tekst „już zawarty"), NIE jako klikalną propozycję.
2. Ten sam test PRZED naprawą (na kodzie z HEAD) reprodukuje błąd — pozycja klikalna mimo
   aktywnego traktatu — potwierdzone czerwonym testem przed poprawką.
3. Zero regresji na case'ach '2'/'3'/'5'/'14' (te same testy co dziś, jeśli istnieją, albo
   nowy test pokrywający wszystkie cztery + nowy '4' w jednym scenariuszu).
4. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/diplomacy-locks.ts — case '4', `ALREADY_NOTE`, interfejs
  `DiplomacyActionLockContext` (nowe pole).
- gra/src/main.ts — WYŁĄCZNIE funkcja budująca kontekst dla `resolveDiplomacyActionLock`
  (ok. linii 18459-18511) i miejsce wywołania dla case '4' w `buildAudienceActions`.
- Nowy lub rozszerzony test w gra/tools/*-test.cjs (np. diplomacy-locks-*-test.cjs, jeśli
  istnieje — sprawdź reconem przed pisaniem nowego pliku).
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana progów
dyplomatycznych, zmiana `diplomacy-proposals.ts` (zawieranie traktatu), zmiana case '12'
lub '14' poza opisowym ustaleniem w raporcie.

IZOLACJA
worktree /home/user/wt-dyplo-przemarsz-duplikat, gałąź
autobot/P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-przemarsz-dup --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione na podstawie samego czytania kodu — wymagany żywy
render w Chromium PRZED i PO poprawce na tej samej fixture (zawarty traktat przemarszu),
pokazujący zmianę stanu kafelka. Zakaz twierdzenia, że case '12'/'14' są poprawne bez
faktycznego sprawdzenia w kodzie/teście, czy traktat wygasa i znika z `activeDeals`.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
