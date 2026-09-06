# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Operator, runda 2/5

MODEL+EFFORT: **Opus 5, effort high** · 2026-09-06 · worktree `/home/user/wt-ai-adiacencja`, gałąź
`autobot/P-AI-…-Q1`. Guard §2b: `merge-base --is-ancestor acd672fb HEAD` OK, drzewo czyste przed pracą.
Mutacje przez KOPIĘ pliku, nigdy `git checkout`; po każdej `git diff --quiet` zielone.

STATUS: PASS
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem;
jednostka nie traci tury bez efektu.

## F1 — wpięcie `unitIsCivilian` jest teraz pilnowane ZACHOWANIEM, nie napisem

Dziura potwierdzona własnym przebiegiem: przed poprawką M3 zostawiała **84/84, exit 0**.

Asercja na sam ciąg byłaby asercją na ZAPIS. Blok A5 **wycina przekazywane WYRAŻENIE**
z okna źródła `main.ts` i **uruchamia je** (`new Function`) na dwóch jednostkach tego samego
świata: `A5e` pole przekazywane, `A5f` wyrażenie liczy się z samej jednostki, `A5g` dla CYWILA
`true`, `A5h` dla BOJOWEJ `false`. Stała ani wartość niezależna od jednostki nie przejdzie.

| Mutacja `main.ts` | Wynik | Faile |
|---|---|---|
| **M3 powtórzona: `unitIsCivilian: false`** | **87/88, exit 1** | **1** — `A5g` |
| M3b: `true` | 87/88, exit 1 | 1 — `A5h` |
| M3c: `u.ownerId === 1` (zależne, lecz od złej rzeczy) | 87/88, exit 1 | 1 — `A5h` |
| M3d: pole usunięte | 85/88, exit 1 | 3 — `A5e/A5g/A5h` |

Asercje **84 → 88** (kryterium 2). Kod produkcyjny NIETKNIĘTY — jedyna zmiana rundy to
`gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`, +28/-0.

## F2 — pełny diff `gra/src/game/ai-city-capture-executor.ts` (runda 1, `022b82aa..HEAD`)

```diff
@@ -40,6 +40,13 @@ export interface ExecuteAiCityMoveOptions {
   cities: readonly AiCityMoveCity[];
   cityBuiltIds: readonly string[];
   hasCityDefenders: boolean;
+  /**
+   * Czy jednostka wykonująca rozkaz jest cywilna (osadnik/robotnik/zwiadowca).
+   * Cywil NIE przejmuje miasta (`tryAutoCaptureEmptyCityAt` wymaga kotwicy
+   * niecywilnej), więc nie wolno mu też wejść na heks obcego miasta — inaczej
+   * parkuje w cudzym mieście i traci turę bez efektu (parytet z graczem).
+   */
+  unitIsCivilian: boolean;
   targetVisible: boolean;
   canOccupyCityHex: boolean;
   blockedKeys: Set<string>;
@@ -84,6 +91,7 @@ export function executeAiCityMove(
       destinationCity,
       opts.cityBuiltIds,
       opts.hasCityDefenders,
+      opts.unitIsCivilian,
     );
 
   if (!canEnterEmptyCity && !opts.canOccupyCityHex) {
```

To CAŁOŚĆ: `8 insertions(+), 0 deletions(-)`, w tym 6 linii komentarza. Pole w interfejsie
i przekazanie argumentu — dokładnie to, co wymusza `tsc` po dodaniu wymaganego parametru
`unitIsCivilian` do `canAiEnterEmptyEnemyCity`. Zero logiki własnej.

## Kryterium 4 — asercja negatywna „miasto BRONIONE" zielona i NIETAUTOLOGICZNA

Zielona: `K4-BRONIONEa/b/c/d` w 88/88. Nietautologiczna — mutacja M9 (`city-hex-movement.ts`:
usunięte `if (hasDefenders) return false;`) czerwieni `K4-BRONIONEc` (`moved` → `true`),
`K4-BRONIONEd` (pozycja `5,4` → `5,5`) i `K8c` — **3 faile, exit 1**. To samo mierzy wewnętrznie
`K8d` (MUT-6: 2 czerwone). Po M9 bramka przerywa po wypisaniu faili na kotwicy własnego mutanta —
oddalony `F4`; exit ≠ 0, więc **bez fałszywej zieleni**. Poza zakresem ratyfikacji.

## TESTY (uruchomione przeze mnie, każdy exit 0)

`tsc --noEmit` → **exit 0, 0 linii**. Bramka tematu **88/88**.
Referencyjne: logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13**
· combat **6/6**.
Gracz i barbarzyńcy (wspólna funkcja przejęcia): city-hex-movement **13/13** · first-player-city
**16/16** · capital-capture **86/86** · map-attack-city **13/13** · post-capture-law **25/25** ·
city-limit-conquered **15/15** · ai-city-capture-integration **14/14** · ai-fog **8/8** ·
barbarians **213/213** · barb-city-behavior **178/178** · barb-city-owner-contract **3/3**
— **komplet identyczny z pomiarem Final Control z rundy 1**, zero rozluźnienia.
`barbarians.ts` NIETKNIĘTY (§2b); `git status --short` po pracy: bramka + ten raport.

## BLOKADY

Brak. Otwarte obowiązki integracji z rundy 1: wpis bramki do tabeli §6 `R-PROC-AUTOBOT.md`,
korekta `REJESTR-PROSB-I-ZADAN.md:5722` (F3), rejestracja F4 jako osobnego tematu.

ZMIANY/COMMIT: `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` (+28/-0) — allowlista pkt 4;
raport rundy 2. Kod gry nietknięty.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator, runda 2/5
DEPLOY/PUSH: NIE WYKONANO
