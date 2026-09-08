# R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 — Final Control

**Metoda:** worktree `/home/user/wt-hotseat-etap5-switch-human`, HEAD `a1d779f7` (`git status`
czysty). Przeczytany CAŁY `git diff 9030e1f9 HEAD -- gra/src/main.ts` (350 linii) linia po
linii, `ui/hotSeatHandoff.ts` i `escapeOverlayStack.ts` w całości, oba raporty rundy 1 i 2b
oraz cały recon (1015 linii, wszystkie 3 rundy). Własne, niezależne uruchomienia — nie ufam
deklaracjom Operatora/Evaluatora.

## 1. Diff main.ts — zgodność z projektem

7 kroków `switchActiveHuman()` (main.ts:10426-10549) zgodne 1:1 z recon §2, w tym poprawki
rund 2/3 (KROK 1b toast, KROK 1c build-mode z pełnym odtworzeniem `clearBuildModeVisuals()`+
`popOverlay`). `ui/hotSeatHandoff.ts` zgodny z kontraktem §3.3 — Escape no-op, synchroniczne,
z-index 9970/9980. Naprawa Zarzutu #2 rundy 1 (`ME() === HUMAN_OWNER_PRIMARY && playerStartHex
!== null`, main.ts:9771) obecna, nie dotknięta w rundzie 2b. Allowlista: WYŁĄCZNIE
`gra/src/main.ts`, `gra/src/ui/hotSeatHandoff.ts`, `gra/tools/hotseat-etap5-no-leak-test.cjs`,
raporty runu — zero wykroczeń (`git diff --stat`).

## 2. Bramka "no leak" — 2x niezależne, świeże uruchomienie (mój przebieg)

`node tools/hotseat-etap5-no-leak-test.cjs`, dwa osobne procesy od zera: **PASS/PASS**
(A=PASS, B=PASS, exit 0 oba razy). `tsc --noEmit`: 0 błędów.

## 3. Weryfikacja WŁASNA (nie skopiowana) dowodu no-opu straznika

`ME()` zwraca `humanSeats.activeHumanOwnerId` (main.ts:10376). `humanSeats` jest
przypisywane WYŁĄCZNIE w KROKU 4 `switchActiveHuman()` (main.ts:10426+) — potwierdzone
grepem: zero innych `humanSeats =` w main.ts. `switchActiveHuman` ma zero call-site
produkcyjnego (p. 4 niżej). Wniosek: w dzisiejszej grze jednoosobowej
`activeHumanOwnerId` nigdy nie zmienia wartości startowej `HUMAN_OWNER_PRIMARY`
(main.ts:10370) — `ME() === HUMAN_OWNER_PRIMARY` jest tautologicznie prawdziwe, warunek
redukuje się do dokładnie starego `playerStartHex !== null`. Dowód logiczny potwierdzony,
niezależnie wyprowadzony.

## 4. Zero call-site produkcyjnego

`grep -n "advanceSeat\|endActiveHumanTurn" gra/src/main.ts` → jedno trafienie, wyłącznie
komentarz. `switchActiveHuman(` → definicja + jedno wywołanie, wewnątrz
`__hotSeatTestDebug.switchActiveHuman: (ownerId) => switchActiveHuman(ownerId)`. Zero
eksportu.

## 5. Pięć bramek referencyjnych (mój przebieg, z `gra/`)

`logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test`
13/13, `combat-test` 6/6 — wszystkie na wyniku referencyjnym §6 CLAUDE.md.

## 6. Decyzja ABC z dispatchu (odstąpienie od R-PIERWSZE-MIASTO w KROKU 1c)

`docs/decyzje/R-PIERWSZE-MIASTO.md` potwierdza istniejący, wdrożony invariant (Maciej
2026-07-24). KROK 1c (main.ts:10504-10528) implementuje DOKŁADNIE to, co dispatch nakazał:
odtworzenie ręczne 4 zmiennych + `clearBuildModeVisuals()` + `popOverlay('build-mode')` w
gałęzi `isAwaitingFirstPlayerCity()===true`, z komentarzem odsyłającym do tego dispatchu i
recon §6 pkt 6, jawnie nazwanym odstępstwem w kontekście handoff. Zgodne z dyspozycją — nie
rozstrzygam samej decyzji (właściwie oznaczona jako do potwierdzenia ABC rano), tylko
potwierdzam poprawną implementację.

## Nowa obserwacja tej rundy (nie blokująca, do rejestracji)

Komentarz w `ui/hotSeatHandoff.ts:20` twierdzi, że z-index 9950 (`preBattle`) jest
"najwyższa dotąd używana wartość w src/". **Nieprawda** — `ui/turnTransitionOverlay.ts:23`
ma z-index **100400** (pasek postępu końca tury, `beginTurnTransition`/`setTurnTransition`,
wołany z `triggerPlayerEndTurn()`). Handoff (9970/9980) NIE przebija tego overlaya. Dziś
nieszkodliwe — `switchActiveHuman`/`hotSeatHandoff` mają zero call-site'u produkcyjnego,
więc oba overlaye nie mogą dziś współwystąpić — ale to jest przyszły haczyk dla Etapu 4b
(`advanceSeat()`), gdy oba mechanizmy się połączą. Do zarejestrowania jako dług tego etapu,
nie do naprawy teraz.

## Agregat (§3c pkt 8)

Evaluator rundy 2b: zero zarzutów, potwierdzone jako realna weryfikacja (nie deklaracja).
Moja niezależna weryfikacja: brak `NAPRAW`, brak `DO DECYZJI CZŁOWIEKA` nowego (poza znaną,
już oznaczoną pozycją ABC z pkt 6). **Same ODDAL/PASS → STATUS: PASS.**

Uwaga proceduralna: `REJESTR-PROSB-I-ZADAN.md` zawiera dziś wpis WYŁĄCZNIE dla
`R-HOTSEAT-ETAP5-RECON-...`, nie dla tego tematu implementacyjnego — orkiestrator powinien
dopisać wpis przy integracji.

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
GOAL: `switchActiveHuman()` + `ui/hotSeatHandoff.ts` + dowód "no leak" (bramka
hotseat-etap5-no-leak-test.cjs, oba scenariusze A/B, wszystkie asercje zielone) — jak w
00-dispatch.md.
ZMIANY/COMMIT: HEAD `a1d779f7` (worktree), diff `9030e1f9..HEAD`: `gra/src/main.ts`,
`gra/src/ui/hotSeatHandoff.ts`, `gra/tools/hotseat-etap5-no-leak-test.cjs`, raporty
`runs/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1/*` — allowlista spełniona, zero wykroczeń.
TESTY (wszystkie uruchomione NIEZALEŻNIE przeze mnie): `tsc --noEmit` PASS (0 błędów);
`hotseat-etap5-no-leak-test.cjs` **2/2 niezależne, świeże uruchomienia = PASS** (A=PASS,
B=PASS, exit 0 oba razy); 5 bramek referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6;
`river-fog-visibility-test.cjs` 31/31 (regresja fallbacku `currentVisible()`, no-op
potwierdzony).
BLOKADY: brak. Nota nieblokująca: nieścisłość komentarza z-index w `hotSeatHandoff.ts`
(patrz wyżej) — do zarejestrowania jako dług Etapu 4b, nie wymaga naprawy w tej rundzie.
Brak wpisu tego tematu (osobno od recon) w `REJESTR-PROSB-I-ZADAN.md` — do uzupełnienia
przy integracji.
RUNDY: 2b/5 (kontynuacja rundy 2 po restarcie kontenera, zgodnie z dyspozycją
orkiestratora — licznik nie zresetowany).
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, per plik/hunk) → `READY_FOR_DEPLOY`
wyłącznie po faktycznej integracji. Do jawnego potwierdzenia ABC (nie blokuje integracji):
odstąpienie od `R-PIERWSZE-MIASTO` w KROKU 1c w kontekście handoff (dispatch, sekcja
"DECYZJE Z RECON"; recon §6 pkt 6) — zaimplementowane poprawnie, czeka na potwierdzenie
właściciela, nie na zmianę kodu.
DEPLOY/PUSH: NIE WYKONANO
