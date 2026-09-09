STATUS: FAIL
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-E-Q1
GOAL: Migracja całego modułu „stołu negocjacyjnego" (`negotiationTable`, funkcje operujące na
proposerOwnerId/responderOwnerId/awaitingOwnerId) na `isMe()`/`ME()`, kontynuacja Etapu 6d
(z 00-dispatch.md — nie mogę potwierdzić zgodności GOAL z raportem Operatora, patrz ZARZUT 1).

## Weryfikacja niezależna — worktree /home/user/wt-6d-PODETAP-E

### ZARZUT 1 — brak raportu Operatora (kontrakt raportu, CLAUDE.md; R-PROC-AUTOBOT §16a pkt 9)

W `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1/` istnieje WYŁĄCZNIE `00-dispatch.md`.
Brak jakiegokolwiek `01-operator-rundaX.md`. Potwierdzone dwukrotnie:

```
$ find /home/user/The-Game/dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1 -type f
dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1/00-dispatch.md

$ find /home/user/wt-6d-PODETAP-E/dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1 -type f
find: ... No such file or directory   (katalogu nie ma WCALE w worktree)
```

Tekst przekazany do tej rundy jako „Raport Operatora" — *"I'll stop polling now and wait for
the Monitor notification to report the test's completion."* — nie zawiera ŻADNEGO z
wymaganych pól kontraktu (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY
KROK/DEPLOY-PUSH) i wprost sugeruje, że Operator pozostawał w trakcie oczekiwania na wynik
własnej bramki (prawdopodobnie żywej Chromium — patrz ZARZUT 3, ta bramka faktycznie trwa
kilka minut) w momencie dispatchu tej rundy Evaluatora, nie ukończył procedury raportowej.
Konsekwencja: nie da się wykonać R-PROC-AUTOBOT §16a pkt 9 („czy GOAL w raporcie zgadza się z
GOAL z 00-dispatch.md") — nie ma GOAL-u do porównania. Weryfikację techniczną niżej wykonałem
mimo to, bezpośrednio na wytworze w worktree (zgodnie z dyspozycją tej rundy), ale bez raportu
formalnie nie ma czego oceniać jako „ukończonej pracy Operatora".

### ZARZUT 2 — bramka jednostkowa dla ścieżek silnikowych NIE woła żadnej realnej funkcji

`gra/tools/hotseat-etap6d-podetap-e-source-test.cjs` (cała bramka) NIE importuje, NIE bunduje
i NIE wykonuje main.ts ani żadnej z 14/15 funkcji. Metoda (funkcja `extractFunctionBody`,
linie 51-100): brace-matched wycięcie ciała funkcji **jako tekst** z pliku źródłowego, po czym
wyłącznie **regex** (`FIELD_HARDCODE_RE`, `ARG_HARDCODE_RE`, `hasIsMeOrMe`, linie 103-112)
sprawdza obecność/brak wzorców tekstowych w PO (bieżący worktree) i PRZED (`git show
HEAD:gra/src/main.ts`). Żaden kod nigdy nie jest uruchomiony — to nie jest „unit wołający
realne funkcje" wymagany wprost przez dispatch („Dla ścieżek silnikowych: wystarczy unit
wołający realne funkcje") ani przez punkt (4) zlecenia tej rundy.

To NIE jest ten sam błąd co w P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 runda 2 (tam: równoległa
REIMPLEMENTACJA logiki w teście) — to postać dalej idąca: ZEROWE wykonanie jakiejkolwiek
logiki. Test nie wykryje błędu semantycznego (np. zamiana `isMe(entry.proposerOwnerId)` ↔
`isMe(entry.responderOwnerId)` w gałęzi warunku) dopóki tekstowo zniknie wzorzec `===0`/`!==0`
i gdziekolwiek w ciele pojawi się `isMe(`/`ME()` — regex sprawdza OBECNOŚĆ podstawienia, nie
jego POPRAWNOŚĆ ani zachowanie w runtime.

Dowód: `gra/tools/hotseat-etap6d-podetap-e-source-test.cjs:51-135`; potwierdzone uruchomieniem
— `node tools/hotseat-etap6d-podetap-e-source-test.cjs` → 77 PASS, 0 FAIL, ale wszystkie 77
asercji to porównania tekstu wyekstrahowanego ciała funkcji, żadna nie woła funkcji w runtime
(brak `require`/`import` main.ts, brak `eval`/`vm` na wyciętym ciele — cała bramka operuje na
`fs.readFileSync` + `RegExp`).

Dotyczy w szczególności 4 funkcji, dla których dispatch WPROST zwolnił Operatora z Chromium
POD WARUNKIEM realnego testu jednostkowego: `collectTurnEvents`,
`collectOpenDiploProposalQueue`, `resolvePendingNegotiationsForOwner`,
`resolveNegotiationEntryAt` — żadna z nich nie ma dowodu wykonania kodu, tylko dowód tekstowy.

### ZARZUT 3 — `handleNegotiationCounter`: zero dowodu wykonania, ani żywego, ani jednostkowego

Dispatch (`00-dispatch.md`, sekcja RYZYKO ŚREDNIE-WYSOKIE) wprost wymienia
`handleNegotiationAccept`/`Counter`/`Reject` jako wymagające żywego dowodu Chromium
(„panel audiencji/stołu negocjacyjnego"). Żywa bramka
`gra/tools/hotseat-etap6d-podetap-e-live-test.cjs` NIE zawiera żadnego kliknięcia ani
selektora dla kontroferty:

```
$ grep -n -i "counter" gra/tools/hotseat-etap6d-podetap-e-live-test.cjs
27: * (AI inicjuje ofertę do gracza) `handleNegotiationAccept`/`Reject`/`Counter`,
```

Jedyne wystąpienie to komentarz nagłówkowy klasyfikujący całą rodzinę „incoming" (w tym
CAŁĄ funkcję `handleNegotiationCounter`) jako „ŚWIADOMIE NIE OTWARTE ... wymagają AI, które
SAMO zaproponuje coś graczowi". Problem: `handleNegotiationCounter` (main.ts:16527) ma
JEDYNY guard `if (!isMe(entry.awaitingOwnerId) || !canPlayerCounterNegotiation(entry))
return` — funkcja NIE MA osobnej gałęzi „own"; CAŁA jej logika to wyłącznie ścieżka
„gracz kontruje przychodzącą ofertę AI". Nie istnieje więc żadna część tej funkcji pokryta
żywym kliknięciem. Jedyne zabezpieczenie to statyczny regex z ZARZUTU 2 (który — jak
wykazano tam — niczego nie wykonuje). Efekt: `handleNegotiationCounter` jest migrowana w
kodzie (potwierdzam poprawność podstawienia manualnym `Read`, patrz TESTY niżej), ale binarne
kryterium sukcesu dispatchu (3) „żywa bramka Chromium dla ścieżek UI (accept/counter/reject
faktycznie klikane)" nie jest spełnione dla członu „counter".

## TESTY — wykonane niezależnie w /home/user/wt-6d-PODETAP-E

1. `cd gra && npx tsc --noEmit -p .` → **0 błędów**, exit 0.
2. Manualny `Read` pełnych ciał WSZYSTKICH 15 funkcji wymienionych w dispatchu (lista dispatchu
   mówi „14 funkcji" ale wymienia 15 nazw — `handleNegotiationReject` policzona osobno w
   recon §2/§6, poza tabelą §1b — to niespójność odziedziczona z dispatchu/recon, nie wina tej
   rundy; migracja objęła poprawnie WSZYSTKIE 15): `negotiationPartnerOwnerIdOf`,
   `resolveNegotiationEntryAt`, `resolvePendingNegotiationsForOwner`, `handleNegotiationAccept`,
   `handleNegotiationCounter`, `handleNegotiationReject`, `handleRequestAiNegotiationResponse`,
   `getNegotiationsForPair`, `negotiationSummary`, `previewNegotiationEntry`,
   `collectTurnEvents`, `collectOpenDiploProposalQueue`, `openDiplomacyAudienceForNegotiation`,
   `actionableNegotiationIdsForPair`, `findIncomingNegotiationForAction` — dokładne granice
   funkcji ustalone świeżym `grep -n "^    function "` (nie zaufałem numeracji z recon), każde
   ciało odczytane w całości między jego startem a startem następnej funkcji na tym samym
   poziomie wcięcia. **Zero pozostałych literałów `0` reprezentujących aktywny fotel** w
   żadnym z 15 ciał (sprawdzone wzorce: `===0`, `!==0`, `(0,`, `, 0)` na polach
   `proposerOwnerId`/`responderOwnerId`/`awaitingOwnerId` i na drugim argumencie
   `ownerDeclareWarOn`/`getDiploRelation`/`setDiploRelation`/`applyDiploEventTracked`/
   `applyCounterOffer`). Krzyżowa walidacja: suma zmienionych linii w moim ręcznym przeglądzie
   diffu = 28, dokładnie zgodna z `git diff --stat` (28 insertions, 28 deletions) — brak
   edycji poza tym, co zweryfikowałem.
3. `git diff gra/src/main.ts` NIE zawiera definicji `applyProposalOutcome` (main.ts:19448) —
   jedyne wystąpienie nazwy w diffie to niezmieniona linia wywołania wewnątrz
   `resolveNegotiationEntryAt`. Niezależnie potwierdzone przez samą bramkę Operatora
   (`hotseat-etap6d-podetap-e-source-test.cjs`, sekcja C): ciało PO === ciało PRZED bajt w
   bajt — **NIETKNIĘTA**, zgodnie z binarnym kryterium (2).
4. Bramka jednostkowa silnikowa: uruchomiona (`node tools/hotseat-etap6d-podetap-e-source-test.cjs`
   → 77 PASS, 0 FAIL) — **ale patrz ZARZUT 2: nie woła realnych funkcji, wyłącznie regex na
   tekście źródła**.
5. Żywa bramka Chromium: uruchomiona (`node tools/hotseat-etap6d-podetap-e-live-test.cjs`,
   pełny realny `vite build` PO i ZEPSUTY, headless Chromium, `?playtest=mapa`) →
   **13 PASS, 0 FAIL**. Potwierdzam REALNE kliknięcia (nie symulację stanu): selektory
   `.civ-diplo-aud [data-negot-act="accept-package"]` i `[data-negot-act="reject-package"]`
   klikane przez Playwright (`btn.click()`) na realnie wyrenderowanym DOM po realnym
   `vite build --outDir ... --emptyOutDir` i `page.goto('file://.../index.html?playtest=mapa')`
   — pokrywa gałąź „własna" `handleNegotiationAccept`/`handleNegotiationReject` oraz plumbing
   (`getNegotiationsForPair`, `actionableNegotiationIdsForPair`,
   `negotiationPartnerOwnerIdOf`, `handleRequestAiNegotiationResponse`,
   `resolveNegotiationEntryAt`, `previewNegotiationEntry`, `negotiationSummary`). Gałąź
   „incoming" tych samych funkcji oraz cała `handleNegotiationCounter` NIE są pokryte
   (patrz ZARZUT 3).
6. Bramki czerwienieją na mutacji: **żywa bramka — POTWIERDZONE** (asercja (11):
   `isMe()` na sztywno `false` → `getNegotiationsForPair` przestaje widzieć własną pozycję na
   stole mimo że wpis realnie istnieje w `negotiationTable` — test faktycznie łapie regresję).
   **Bramka jednostkowa — SŁABE**: „mutacja" to wyłącznie porównanie tekstu PRZED (`git show
   HEAD`) vs PO, nie wstrzyknięcie błędu behawioralnego — spójne z ZARZUTEM 2, regex nie
   odróżni poprawnego podstawienia od błędnego, tylko obecność/brak wzorca.
7. 5 bramek referencyjnych (z katalogu `gra/`), wynik **zgodny co do liczby** z
   `R-PROC-AUTOBOT.md` §6:
   - `node tools/logic-test.cjs` → **213/213** (LOGIC OK)
   - `node tools/tech-tree-test.cjs` → **19 pass, 0 fail**
   - `node tools/research-test.cjs` → **33/33, ALL GREEN**
   - `node tools/unit-replace-test.cjs` → **13/13, WSZYSTKIE TESTY ZIELONE**
   - `node tools/combat-test.cjs` → **6/6 pass**
8. `git diff --stat` (worktree): `gra/src/main.ts | 56 ++++++++++++++++++++++++++++----------------------------`,
   `1 file changed, 28 insertions(+), 28 deletions(-)`; `git status --porcelain`: `M
   gra/src/main.ts`, `?? gra/tools/hotseat-etap6d-podetap-e-live-test.cjs`, `??
   gra/tools/hotseat-etap6d-podetap-e-source-test.cjs` — **zgodne z allowlistą** dispatchu
   (wyłącznie ciała funkcji w main.ts + dwie nowe bramki w `gra/tools/`). `git diff --check`
   → czysty (exit 0), brak whitespace errors. Brak `git add -A` (nic nie jest zestaged).

## BLOKADY

- Brak raportu Operatora (ZARZUT 1) — formalnie nie ma czego przyjmować do integracji, mimo
  że kod w worktree jest w dużej części poprawny.
- Bramka jednostkowa silnikowa nie spełnia wymogu dispatchu „unit wołający realne funkcje"
  (ZARZUT 2) — dotyczy w szczególności 4 funkcji zwolnionych z Chromium pod tym właśnie
  warunkiem.
- `handleNegotiationCounter` bez jakiegokolwiek dowodu wykonania w runtime (ZARZUT 3).

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (ten sam Operator, drugie wywołanie) — PRZYJMUJĘ/ODRZUCAM z
dowodem z wytworu dla każdego z 3 zarzutów osobno (R-PROC-AUTOBOT §3c pkt 2); jeśli
PRZYJMUJĘ dla zarzutu 1 — dokończenie i zapisanie właściwego raportu Operatora; jeśli
PRZYJMUJĘ dla zarzutu 2 — bramka jednostkowa silnikowa musi faktycznie wołać funkcje z
main.ts w runtime (np. przez ten sam mechanizm testowych haków `window.__xyzTestDebug` co
bramka żywa, uruchamiany bez pełnych kliknięć UI, albo przez ekstrakcję+`vm`/`eval` z
realnymi mockami wolnych zmiennych — nie wystarczy regex na tekście); jeśli PRZYJMUJĘ dla
zarzutu 3 — żywa bramka musi dodać realne kliknięcie ścieżki kontroferty (przycisk/akcja
`counter` w panelu audiencji) albo nowy hak testowy pozwalający wymusić ofertę AI→gracz
(poza allowlistą main.ts obecnego dispatchu, do jawnego zgłoszenia).
DEPLOY/PUSH: NIE WYKONANO
