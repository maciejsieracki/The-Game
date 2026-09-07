# R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1`
RUNDA: 1/5
DOMAIN: INFRA (refaktor akcesorów ekonomicznych na per-człowiek, behawioralny no-op
przy jednym fotelu — Etap 3 planu `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, plan ocenia
tę kategorię jako „bezpieczny")
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Etapy 0-2 (zintegrowane: `94c475ec`/`87b33da3`/`f3c0becf`) dostarczyły fundament
(`human-owners.ts`), pierwszy konsument w pętli tur AI, i migrację warstwy mgły/
widoczności. Ten temat to **Etap 3** z §C planu: warstwa akcesorów ekonomicznych.
Plan (§0 pkt 1): „Warstwa akcesorów per-owner JUŻ ISTNIEJE... każda z nich to
`ownerId === 0 ? player.X : aiXByOwner.get(ownerId)` — dispatch między dwoma
backendami storage w JEDNYM miejscu". Zadanie: podmienić `ownerId === 0` w TYCH
konkretnych funkcjach na `isHumanOwner(humanSeats, ownerId)` i backend „gracz" z
bezpośredniego `player.X`/luźnych zmiennych (`playerPracaPool`) na
`playerStateByHuman.get(ownerId)!.X` — analogiczny wzorzec do `exploredByHuman` z
Etapu 2 (scaffold: dziś jedna wartość w mapie, ten sam obiekt co `player`, zero
zmiany zachowania).

**Stan zweryfikowany bezpośrednio w kodzie (2026-09-07, main.ts obecny — PRZED pracą
potwierdź własnym grepem, main.ts zmienia się codziennie):**
- `empireEpochForOwner(ownerId)` (~main.ts:1893), `initOwnerEra(ownerId, era)` (~1898)
- `ownerTreasury(ownerId)`/`setOwnerTreasury(ownerId, value)` (~26008/26011)
- `ownerPracaPool(ownerId)`/`setOwnerPracaPool(ownerId, value)` (~26020/26023) —
  UWAGA: `setOwnerPracaPool` przy `ownerId===0` dodatkowo pisze do cache HUD
  `_lastPraca` (jedno miejsce, nie cały mechanizm 19 cache'y z Etapu 5) — zachowaj
  ten zapis, tylko zmień warunek gałęzi.
- `ownerNaukaPool(ownerId)`/`setOwnerNaukaPool(ownerId, value)` (~26041/26044)
- `ownerResearchedTechs(ownerId)`/`addOwnerResearchedTechs(ownerId, ids)`
  (~26117/26120)

Wszystkie osiem funkcji ma identyczny wzorzec: `ownerId === 0 ? <pole gracza> :
<mapaByOwner>.get(ownerId) ?? <domyślna>`.

**Osobne znalezisko do rozstrzygnięcia, NIE zakładaj z góry kierunku:**
`gra/src/game/difficulty-cost.ts` eksportuje `isPlayerOwner(ownerId): boolean {
return ownerId === 0; }` — czysty, samodzielny moduł BEZ dostępu do `humanSeats`
(które żyje w `main.ts`). Ta funkcja jest używana w wielu miejscach do liczenia
mnożnika trudności. Przeczytaj WSZYSTKIE miejsca jej użycia i zdecyduj: czy to
faktycznie wymaga zmiany (czy koncept „gracz podstawowy dla trudności" ma pozostać
zawsze `ownerId===0`/`HUMAN_OWNER_PRIMARY` niezależnie od hot-seatu — sensowne, bo
mnożnik trudności per fotel to osobna decyzja produktowa, nie coś do rozstrzygnięcia
milcząco w tym temacie) — jeśli dojdziesz do wniosku że TRZEBA to zmienić i wymagałoby
to zmiany sygnatury eksportowanej funkcji używanej w wielu miejscach — STOP,
DECISION_REQUIRED, nie zgaduj.

## GOAL

1. Dodaj (jeśli jeszcze nie istnieje po Etapach 0-2) minimalny alias `isHuman(ownerId):
   boolean` w `main.ts`, cienki wrapper na `isHumanOwner(humanSeats, ownerId)` z
   `game/human-owners.ts` — dla czytelności w miejscach z tego zadania.
2. Dodaj `playerStateByHuman`-style scaffold: minimalną strukturę mapującą
   `ownerId → { skarbiec, nauka, era, zbadane, praca }` (albo per-pole osobne mapy,
   wedle tego co lepiej pasuje po przeczytaniu kodu) z jednym wpisem dla
   `HUMAN_OWNER_PRIMARY` wskazującym na TE SAME pola/obiekty co dziś (`player`,
   `playerPracaPool`) — zero kopii, identyczny wzorzec do `exploredByHuman` z Etapu 2.
3. Przepisz osiem funkcji-akcesorów wymienionych w GENEZIE: warunek `ownerId === 0` →
   `isHuman(ownerId)`, odczyt/zapis pola gracza → przez nowy scaffold zamiast
   bezpośrednio przez `player.X`/luźną zmienną (poza jednym wyjątkiem: zachowaj
   bezpośredni zapis `_lastPraca` w `setOwnerPracaPool` jako osobną linię, nie
   przenoś go do scaffoldu).
4. Rozstrzygnij `isPlayerOwner` z `difficulty-cost.ts` wg wytycznych w GENEZIE.

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz twierdzenia „behawioralny no-op" bez dowodu: dla KAŻDEJ z ośmiu funkcji pokaż
wynik PRZED i PO dla ownerId=0 (gracz) oraz co najmniej dwóch dodatnich ownerId (AI) —
identyczne wartości. Zakaz zakładania że `isPlayerOwner` w `difficulty-cost.ts` można
bezpiecznie zignorować BEZ przeczytania wszystkich jej wywołań — może się okazać że
jest już poprawnie ograniczona do kontekstu, w którym hot-seat nigdy jej nie dotknie
(a wtedy jawnie to uzasadnij w raporcie, nie milcz).

## BINARNE KRYTERIUM SUKCESU

- Osiem funkcji-akcesorów przepisanych zgodnie z GOAL, zero zmiany zachowania dla
  `humanSeats = [HUMAN_OWNER_PRIMARY]` (dzisiejszy jedyny stan).
- `isPlayerOwner` w `difficulty-cost.ts` — jawna decyzja udokumentowana w raporcie
  (zostaje bez zmian z uzasadnieniem, ALBO zmieniona, ALBO DECISION_REQUIRED).
- Dowód no-op: dla każdej z ośmiu funkcji, wywołanie z ownerId=0 i ≥2 dodatnimi
  ownerId, wynik identyczny przed/po (wartości liczbowe/zbiory, nie tylko typ).
- Bramki: `difficulty-cost-test.cjs`, `wealth-test.cjs`, `ai-major-economy-test.cjs`,
  `ai-praca-podzial-tura1-seed-test.cjs`, `ai-praca-split-parity-test.cjs` — zielone i
  identyczne liczbowo przed/po (`git stash`/`stash pop` albo dwa checkouty).
- 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test,
  combat-test) zielone.
- `tsc --noEmit` czysto.

## ALLOWLISTA

- `gra/src/main.ts` — wyłącznie zmiany opisane w GOAL (osiem funkcji + nowy scaffold +
  alias `isHuman`).
- `gra/src/game/difficulty-cost.ts` — wyłącznie jeśli GOAL pkt 4 rozstrzygnie że zmiana
  jest bezpieczna i nie wymaga zmiany sygnatury; w przeciwnym razie zostaw nietknięty.
- Nowa/rozszerzona bramka (np. `gra/tools/hotseat-etap3-akcesory-test.cjs`).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1/**`

Zakazane bezwzględnie: zmiana `game/human-owners.ts` (kontrakt z Etapu 0 zostaje),
`gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i
`git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap3`, gałąź
`autobot/R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1`, baza jawnie `origin/main` (commit
`8bb30795` w chwili założenia, może być nowszy przy starcie pracy — potwierdź
`git log -1` PRZED pracą, SS2b). **UWAGA konkurencji plików:** w tej samej chwili może
być aktywny inny temat dotykający `main.ts` w NIEPOWIĄZANYM regionie (np.
`R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1`, region wojny wymuszonej) — to nie blokuje
pracy w tym worktree (izolowany), tylko integrację orkiestrator zsekwencjonuje ręcznie.

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Dozwolone rozbicie na scaffold/migrację (jak w Etapie 2), jeśli uczciwie
uzasadnione. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian widocznego zachowania gry przy jednym fotelu człowieka.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Zero zmian sygnatur eksportowanych funkcji publicznych bez DECISION_REQUIRED.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.
