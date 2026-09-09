STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-E-Q1
GOAL: Migracja modułu „stołu negocjacyjnego" (`negotiationTable`, 15 funkcji — dispatch mylnie
liczył 14, poprawka odnotowana w `00-dispatch.md` KONTEKST pkt 3) na `isMe()`/`ME()`.

WERDYKTY PER ZARZUT (§3c, sprawdzone bezpośrednio na wytworze w worktree, nie na deklaracjach):

ZARZUT 1 (brak raportu Operatora w chwili zgłoszenia do Evaluatora) — ODDAL.
Dowód własny: `01-operator-runda1.md` istnieje, treść zgodna z faktycznym `git diff` i
uruchomionymi testami tej rundy. Defekt był proceduralny (brak artefaktu), nie merytoryczny —
naprawiony w tym samym worktree bez zmiany kodu produkcyjnego. Zamknięte.

ZARZUT 2 (`source-test.cjs` sprawdza wyłącznie regex na tekście, main.ts nigdy nie jest
wykonywany) — ODDAL.
Dowód własny (nie deklaracja Obrony): przeczytałem `hotseat-etap6d-podetap-e-exec-test.cjs`
linia po linii i porównałem RĘCZNIE wycięte ciała z main.ts dla 2 funkcji
(`handleNegotiationCounter` linia 16527, `resolveNegotiationEntryAt` linia 16229) — tekst
identyczny co w main.ts, `esbuild.transformSync` z `loader:'ts'` zdejmuje wyłącznie adnotacje
typów. Mocki przekazane do `new Function` to dane wejściowe/spy (tablice, Mapy, funkcje
zapisujące argumenty), NIE reimplementacja logiki guardów/gałęzi — guard `isMe(...)`, wybór
`aiOwnerId`, wywołanie `applyCounterOffer(entry, uiPayload, ME(), turn)` wykonują się z
PRAWDZIWEGO ciała.
Test nietautologiczności WYKONANY PRZEZE MNIE, nie tylko odczytany z deklaracji: uruchomiłem
`exec-test.cjs` na REALNYM main.ts → 24/24 PASS; następnie ręcznie zmutowałem main.ts
(`applyCounterOffer(entry, uiPayload, ME(), turn)` → `..., 0, turn)`, dokładnie ta klasa
regresji, przed którą migracja broni) → `exec-test.cjs` natychmiast złapał: **23 PASS, 1 FAIL**
(assercja `authorOwnerId=ME()=7` dostała `0`), exit code 1. Przywróciłem plik z kopii, `git diff`
wraca do stanu identycznego jak przed mutacją (potwierdzone `md5sum` diffu vs merge-base).
`source-test.cjs`: 77/77 PASS niezależnie uruchomione. `live-test.cjs`: 13/13 PASS niezależnie
uruchomione (build PO + build ZEPSUTY z `isMe()→false`, żywy Chromium, mutacja czerwieni
asercję (11) poprawnie). Zamknięte.

UWAGA UBOCZNA (nie blokuje tego zarzutu, do rejestru osobno): przy okazji mutacji odkryłem, że
`ARG_HARDCODE_RE` w `source-test.cjs` (`\(\s*[^,()]*,\s*0\s*[,)]`) łapie literał `0` WYŁĄCZNIE
jako DRUGI argument — moja mutacja (trzeci argument `applyCounterOffer`) przeszła przez
`source-test.cjs` niezauważona (nadal 77/77), złapał ją wyłącznie `exec-test.cjs`. Realny kod
main.ts jest poprawnie zmigrowany (potwierdzone niezależnie), więc to nie jest żywy defekt gry —
to luka w regexie jednej bramki, osłonięta przez drugą. Rekomendacja: osobny, drobny temat
PROCESS rozszerzający `ARG_HARDCODE_RE` o dowolną pozycję argumentu, nie blokować tej integracji.

ZARZUT 3 (`handleNegotiationCounter` bez żywego dowodu Chromium, dispatch wprost wymagał tu
Chromium) — ODDAL, rozstrzygnięcie własne Final Control.
Uzasadnienie: (a) exec-test.cjs sekcja 5 wykonuje PRAWDZIWE ciało `handleNegotiationCounter`
(zweryfikowane wyżej, ta sama metoda co Zarzut 2, ten sam dowód mutacyjny co potwierdziłem
ręcznie); (b) funkcja ma DOKŁADNIE jeden guard zależny od migracji —
`!isMe(entry.awaitingOwnerId)` (main.ts:16531) — obie gałęzie (awaitingOwnerId=gracz przechodzi
do `applyCounterOffer(..., ME(), ...)`; awaitingOwnerId=AI blokowane guardem) pokryte osobnymi
blokami exec-test (5a/5b), oba z realnym wykonaniem; (c) DOM/wiring przycisku kontroferty w
`.civ-diplo-aud` NIE był dotknięty przez ten dispatch (allowlista = wyłącznie ciała funkcji,
nie renderowanie audiencji) — ten sam wzorzec renderowania (`data-negot-act`) jest już żywo
zweryfikowany dla accept/reject w `live-test.cjs` (asercje 3, 6-8), więc ryzyko "guzik nie
podłączony" nie jest unikalne dla tej funkcji i nie zostało wprowadzone tym tematem; (d) próba
Obrony sprowokowania realnej kontroferty AI przez żywy klik jest udokumentowana i
zweryfikowana jako ograniczenie zachowania AI (Relacja 100/100 + domyślny PN → AI zawsze
akceptuje, `kind:'countered'` nieosiągalny bez nowego haka POZA allowlistą main.ts) — to
ograniczenie silnika/RNG, nie próba obejścia dowodu. Dedykowany hak wstrzykujący
`negotiationTable` wprost byłby MNIEJ realny niż obecny exec-test (który wykonuje prawdziwe
ciało z main.ts), nie bardziej. Łączny poziom rygoru (realne wykonanie + realna mutacja
main.ts + weryfikacja niezależna Final Control) uznaję za równoważny dowodowo żywemu klikowi
dla TEJ jednej funkcji. Zamknięte, bez rundy 2.

DOWÓD WŁASNEJ WERYFIKACJI (niezależnie od raportów):
- Przeczytane w całości: `hotseat-etap6d-podetap-e-exec-test.cjs` (441 linii), fragmenty
  main.ts dla `handleNegotiationCounter`, `handleNegotiationEditOwn` (kontrola: NIE w
  allowliście, poprawnie POMINIĘTA, nadal ma literał `0` — poza zakresem tematu),
  `resolveNegotiationEntryAt`, `resolvePendingNegotiationsForOwner`, `handleNegotiationAccept`,
  `handleNegotiationReject`.
- `git diff cb667e5d..HEAD -- gra/src/main.ts`: 15 funkcji dotknięte (14 z dispatchu +
  `handleNegotiationReject`, zgodnie z poprawką w `00-dispatch.md`), zero literałów
  `proposerOwnerId/responderOwnerId/awaitingOwnerId ===0/!==0` pozostałych w zmienionych
  fragmentach, `applyProposalOutcome` NIEOBECNA w diffie (nietknięta, potwierdzone).
- `npx tsc --noEmit`: 0 błędów.
- `node tools/hotseat-etap6d-podetap-e-source-test.cjs`: 77/77 PASS (uruchomione samodzielnie).
- `node tools/hotseat-etap6d-podetap-e-exec-test.cjs`: 24/24 PASS na realnym kodzie; 23/24 (1
  FAIL) po mojej ręcznej mutacji main.ts, przywrócone czysto.
- `node tools/hotseat-etap6d-podetap-e-live-test.cjs`: 13/13 PASS (uruchomione samodzielnie,
  synchronicznie, w tle z powodu limitu czasu narzędzia — wynik odczytany po zakończeniu, nie
  zgadywany).
- 5 bramek referencyjnych, uruchomione samodzielnie z `gra/`: logic-test 213/213,
  tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6.
- `git status --short`: wyłącznie `M gra/src/main.ts` + 3 nowe `gra/tools/*-test.cjs` + katalog
  runu — wszystko w allowlicie. Brak `git add -A`. Brak commitu (poprawnie, przed integracją).
- Guard bazy: `git -C worktree log -1` = `cb667e5d` = `git merge-base HEAD origin/main` —
  zgodne, brak rozjazdu.
- `REJESTR-PROSB-I-ZADAN.md` odzwierciedla stan „w toku" — zgodne z etapem procesu w chwili
  kontroli.

ZMIANY/COMMIT: `gra/src/main.ts` (28+/28- wg `git diff --stat` względem merge-base
`cb667e5d`, wyłącznie ciała 15 funkcji stołu negocjacyjnego). Nowe pliki (allowlista
`gra/tools/*-test.cjs`): `hotseat-etap6d-podetap-e-source-test.cjs`,
`hotseat-etap6d-podetap-e-live-test.cjs`, `hotseat-etap6d-podetap-e-exec-test.cjs`. Brak
commitu — praca w worktree, przed integracją orkiestratora.

TESTY: tsc 0/0 błędów; source-test 77/77; exec-test 24/24 (real) + 23/24 (mutacja ręczna
main.ts, potwierdza czułość bramki, przywrócone); live-test 13/13; 5 bramek referencyjnych
zielone (213/213, 19/19, 33/33, 13/13, 6/6). Wszystko uruchomione niezależnie przeze mnie,
synchronicznie.

BLOKADY: brak blokujących. Uwaga niekrytyczna zarejestrowana do osobnego tematu PROCESS:
`ARG_HARDCODE_RE` w `source-test.cjs` nie łapie hardkodu `0` poza drugą pozycją argumentu
(patrz ZARZUT 2 wyżej) — nie blokuje tej integracji, bo `exec-test.cjs` już to pokrywa.

RUNDY: 1/5 (Final Control jest częścią rundy 1, §3b-bis — nie zużywa nowej rundy).
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, per plik) → `READY_FOR_DEPLOY` po
faktycznej integracji. Gotowość do integracji: TAK (agregat: same ODDAL → PASS, §3c pkt 3).
Zalecenie dodatkowe: zarejestrować uwagę o `ARG_HARDCODE_RE` jako osobny, drobny temat PROCESS
w `REJESTR-PROSB-I-ZADAN.md` (§3b — uwaga kosmetyczna nie blokuje zamknięcia, ale musi być
zapisana, nie zostawiona wyłącznie w tym raporcie).
DEPLOY/PUSH: NIE WYKONANO
