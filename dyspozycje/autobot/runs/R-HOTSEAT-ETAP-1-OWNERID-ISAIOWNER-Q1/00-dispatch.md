# R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1`
RUNDA: 1/5
DOMAIN: INFRA (podmiana semantyczna, behawioralny no-op przy jednym fotelu człowieka —
Etap 1 planu `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Etap 0 (`R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1`, zintegrowany, commit `94c475ec`) dostarczył
moduł `gra/src/game/human-owners.ts` z funkcją `isAiOwner(seats, ownerId)`, ale
świadomie NIE wpiął jej nigdzie — zero konsumentów. Ten temat to **Etap 1** z §C planu:
pierwszy realny konsument. Plan (§0 pkt 3, „UKRYTA PUŁAPKA"): w `main.ts` (i kilku
plikach `gra/src/game/`) wzorzec `ownerId > 0` jest dziś używany jako skrót „to jest
AI" — **bez naprawy tych miejsc, drugi fotel człowieka (przyszły Etap 7) dostałby
turę rozegraną automatycznie przez AI**, bo dodatni `ownerId` człowieka #2
kwalifikowałby się tak samo jak AI. Naprawa dziś, zanim drugi fotel w ogóle powstanie,
jest **behawioralnym no-opem** — `humanSeats` ma dziś zawsze dokładnie jeden fotel
(`[HUMAN_OWNER_PRIMARY]`), więc `isAiOwner(humanSeats, id) === (id > 0)` dla KAŻDEGO
`id` (barbarzyńca/rebeliant mają ujemny `ownerId`, więc `id > 0` już ich wyklucza —
matematycznie identyczny wynik, nie tylko „zwykle identyczny").

**KRYTYCZNE — przeczytaj PRZED jakimkolwiek ruchem:**
1. Plan cytuje konkretne numery linii i „31 miejsc" — **nieaktualne, zignoruj liczbę i
   numery, zrób WŁASNY, świeży audyt grepem** (`grep -rn "ownerId *> *0" gra/src`).
   Wstępny audyt orkiestratora (2026-09-07) znalazł **39 trafień w `gra/src/**.ts`**,
   z czego część to KOMENTARZE (nie dotykaj), a realny kod jest w: `main.ts` (kilkanaście
   miejsc, m.in. budowa `aiOwnerList` w pętli tur AI — **priorytet, to jest dokładnie
   miejsce z pułapki opisanej w planie**), `game/ai.ts:914`, `game/city-founding.ts:66,110`.
2. **Nie myl tego z `isMajorAiOwner`** — `game/owner-utils.ts` ma JUŻ istniejącą,
   inną, celowo węższą funkcję `isMajorAiOwner(ownerId, isCityState)` (`ownerId > 0 &&
   !barbarzyńca && !miasto-państwo` — wyklucza miasta-państwa). To NIE jest to samo co
   nowe `isAiOwner` z `human-owners.ts` (`!human && !barbarzyńca && !rebeliant` —
   miasta-państwa SĄ traktowane jako „AI" w tym szerszym sensie, bo nie są człowiekiem).
   Miejsca, które dziś poprawnie wołają `isMajorAiOwner` (albo replikują dokładnie jej
   logikę z dobrego powodu — „chcę tylko główne AI, nie miasta-państwa") **zostają
   nietknięte** — to nie jest błąd, to inne pytanie. Dla KAŻDEGO miejsca z gołym
   `ownerId > 0` rozstrzygnij: czy pytanie brzmi „czy to NIE jest człowiek" (→ nowe
   `isAiOwner`) czy „czy to główne AI, nie miasto-państwo" (→ zostaw, to zakres
   `isMajorAiOwner`, nie tego tematu).

## GOAL

1. W `main.ts`, obok istniejącej deklaracji `const player` (znajdź grepem — NIE ufaj
   numerowi linii z planu), dodaj JEDNĄ nową, minimalną, żywą zmienną:
   ```ts
   let humanSeats: HumanSeats = { humanOwnerIds: [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY };
   ```
   z importem `HumanSeats`/`HUMAN_OWNER_PRIMARY`/`isAiOwner` z `./game/human-owners`.
   **NIE dodawaj** w tej rundzie `playerStateByHuman`/`exploredByHuman`/aliasów
   `isHuman`/`isMe`/`ME` — te nie mają dziś konsumenta poza `isAiOwner`, zostają
   odłożone do etapów, które ich faktycznie potrzebują (Etap 2/3).
2. Świeżym grepem znajdź WSZYSTKIE realne (nie-komentarzowe) miejsca w `gra/src/**.ts`,
   gdzie `ownerId > 0` (lub analogiczny wariant: `.ownerId>0`, `oid > 0` po przypisaniu
   z `.ownerId`, itp.) jest używany w znaczeniu „to NIE jest człowiek/to jest
   AI-kontrolowane" (patrz punkt 2 „KRYTYCZNE" wyżej — rozróżnij od `isMajorAiOwner`).
   Podmień każde takie miejsce na `isAiOwner(humanSeats, <ownerId>)`.
3. Priorytet: budowa `aiOwnerList`/list tur AI w głównej pętli końca tury w `main.ts`
   (grep `AI TURN LOOP` albo `ownerId > 0) s.add` — to jest dokładnie miejsce z pułapki
   opisanej w GENEZIE, musi być naprawione w tej rundzie, nie odłożone).
4. Zero zmiany logiki poza mechaniczną podmianą — żadna funkcja nie zmienia sygnatury,
   żadna gałąź warunkowa nie zmienia się poza samym testem `ownerId > 0` →
   `isAiOwner(humanSeats, ownerId)`.

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz podmiany „na ślepo" każdego wystąpienia tekstu `ownerId > 0` bez przeczytania
kontekstu — część wystąpień to `isMajorAiOwner` w przebraniu (patrz punkt 2 KRYTYCZNE)
i mają zostać NIETKNIĘTE. Zakaz twierdzenia „behawioralny no-op" bez dowodu: musisz
pokazać, że `isAiOwner(humanSeats, id) === (id > 0)` dla każdego `id` w rozsądnym
zakresie (włącznie z sentinelami barbarzyńcy/rebelianta) ORAZ że pełny zestaw bramek
referencyjnych + bramki AI/dyplomacja/ekonomia dają IDENTYCZNY wynik przed i po zmianie
(ten sam wzorzec dowodu co w Etapie 0 — `git stash`/`git stash pop` albo dwa checkouty).

## BINARNE KRYTERIUM SUKCESU

- Nowa/rozszerzona bramka jednostkowa dowodzi matematycznie
  `isAiOwner(humanSeats, id) === (id > 0)` dla `id` w zakresie obejmującym: 0 (gracz),
  kilka dodatnich (AI/miasta-państwa), sentinel barbarzyńcy, sentinel rebelianta,
  kilka innych ujemnych wartości.
- Wszystkie realne miejsca `ownerId > 0` o semantyce „to jest AI/nie-człowiek" (nie
  `isMajorAiOwner`) w `gra/src/**` podmienione na `isAiOwner(humanSeats, ...)` —
  policz i podaj w raporcie DOKŁADNĄ liczbę podmienionych miejsc + listę plików.
- Priorytetowe miejsce (`aiOwnerList`/pętla tur AI) potwierdzone jako naprawione
  explicite w raporcie, z cytatem fragmentu po zmianie.
- Zero regresji: pełny zestaw bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test) + WSZYSTKIE bramki `ai-*-test.cjs` i
  `diplomacy-*-test.cjs` (nie próbka — cały zestaw, to jest rdzeń tego tematu) zielone
  I identyczne liczbowo przed/po (dowód `git stash`/`git stash pop` albo dwa checkouty
  z pełnym logiem obu przebiegów).
- `tsc --noEmit` czysto.

## ALLOWLISTA

- `gra/src/main.ts` — wyłącznie: (a) jedna nowa deklaracja `humanSeats` + import,
  (b) mechaniczne podmiany `ownerId > 0` → `isAiOwner(humanSeats, ownerId)` w miejscach
  o odpowiedniej semantyce.
- `gra/src/game/ai.ts`, `gra/src/game/city-founding.ts` — analogiczne mechaniczne
  podmiany, jeśli świeży grep potwierdzi tam realne miejsca tej semantyki (dodaj
  import `isAiOwner`/`humanSeats` — jeśli te moduły dziś nie mają dostępu do żywego
  `humanSeats` z `main.ts`, bo są osobnymi modułami bez tego stanu, PRZEMYŚL: albo
  funkcja przyjmuje `humanSeats`/`ownerId` jako parametr od wołającego z `main.ts`
  [preferowane, zero nowego globalnego stanu w module], albo — jeśli to niemożliwe bez
  zmiany sygnatury eksportowanej funkcji używanej w wielu miejscach — STOP,
  DECISION_REQUIRED z opisem, nie zmieniaj sygnatury publicznej funkcji bez zgody).
- Nowa/rozszerzona bramka (np. `gra/tools/hotseat-human-owners-test.cjs`, rozszerzenie
  istniejącej z Etapu 0, albo nowy plik `gra/tools/hotseat-etap1-ownerid-test.cjs`).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1/**`

Zakazane bezwzględnie: zmiana `gra/src/game/owner-utils.ts` (funkcja `isMajorAiOwner`
zostaje nietknięta, to inny zakres), `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`,
`playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap1`, gałąź
`autobot/R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1`, baza jawnie `origin/main` (commit
`b6895d2f` w chwili założenia, może być nowszy przy starcie pracy — potwierdź
`git log -1` PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian widocznego zachowania gry przy jednym fotelu człowieka (dzisiejszy stan).
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli dowolne miejsce budzi wątpliwość „czy to `isMajorAiOwner` czy nowe `isAiOwner`"
  i nie da się rozstrzygnąć z samego kodu/komentarza — STOP, DECISION_REQUIRED z listą
  wątpliwych miejsc, nie zgaduj.
- Jeśli podmiana w `game/ai.ts`/`game/city-founding.ts` wymagałaby zmiany sygnatury
  publicznej funkcji (nie tylko dodania parametru z sensownym defaultem) — STOP,
  DECISION_REQUIRED (patrz ALLOWLISTA wyżej).

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.
