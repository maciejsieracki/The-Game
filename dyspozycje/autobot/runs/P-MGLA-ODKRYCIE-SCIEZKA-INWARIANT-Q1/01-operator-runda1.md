# P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 — raport Operatora, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`
MODEL+EFFORT: Opus 5, effort high (Operator)
GOAL: ustanowić INWARIANT, po którym czwartego/piątego miejsca odkrywania mgły wzdłuż
ścieżki nie da się dodać niezauważenie; naprawić miejsca znalezione inwentaryzacją.

## ZMIANY/COMMIT

Baza `20f9993d`, gałąź `autobot/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`. Allowlist-only.

| Ścieżka | Co |
|---|---|
| `gra/src/main.ts` | helper `revealAlongPathForStack` (przy `refreshFog`); odkrycie per-krok w haku `onAfterStep` przy `runScoutsAutoExplore` (CZWARTE miejsce) |
| `gra/tools/mgla-sciezka-inwariant-test.cjs` | NOWA bramka — GOAL 3, inwariant (a)+(b) |
| `gra/tools/mgla-sciezka-rzeka-test.cjs` | NOWA bramka — GOAL 4, scenariusz rzeczny |
| `dyspozycje/autobot/runs/.../dowody/GOAL1-inwentaryzacja.md` | tabela GOAL 1 |

`gra/src/game/visibility.ts` — BEZ ZMIAN (funkcje już istniały i były pokryte).
`gra/tools/mgla-teleport-koniec-tury-test.cjs` — BEZ ZMIAN (16/16 bez regresu).

## GOAL 1 — inwentaryzacja (przed naprawami)

Pełna tabela: `dowody/GOAL1-inwentaryzacja.md`. 47 trafień / 21 miejsc logicznych.
Komenda: `grep -rnE '\.(q|r)[[:space:]]*=[^=>]' gra/src --include=*.ts`
plus 4 komendy wykluczające wzorce pośrednie (compound assign, `Object.assign`, spread,
podmiana elementu tablicy) — wszystkie ZERO trafień.

## GOAL 2 — naprawa

**CZWARTE miejsce: `scout-auto-explore.ts:234-235`** (`advanceScoutAutoExplore`, pętla
`while (unit.ruchLeft > 0)`). Zwiadowca z auto-eksploracją przechodzi kilkanaście heksów
w jednej turze; jedynym odkryciem był `refreshFog()` PO całej pętli, czyli wyłącznie
z pozycji końcowej. Własne `workingExplored` modułu to `new Set(explored)` — kopia
lokalna, porzucana; służy tylko wyborowi celu.

Naprawa w `main.ts` (moduł `scout-auto-explore.ts` jest poza allowlistą): hak `onAfterStep`
jest wołany po KAŻDYM kroku, więc `revealAlongPathForStack([u], [{ q: u.q, r: u.r }])`
w tym haku jest równoważne odkryciu wzdłuż całej ścieżki.

**Wspólny helper — wprowadzony, ale NIE zastąpił trzech istniejących wywołań.** Powód
konkretny, nie ogólnikowy: `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` (SEKCJA D,
linie 190-211) kontraktuje DOSŁOWNY tekst `addExplored(explored,
computeVisibleAlongPath(pathHexes|result.movePath, map, unitSight(su)))` wewnątrz
konkretnych bloków `main.ts`. Ten plik **leży poza allowlistą** tematu, więc zamiana tych
trzech wywołań na `revealAlongPathForStack(...)` zczerwieniłaby bramkę, której nie wolno
mi dotknąć = natychmiastowy FAIL.

Rzecz osobna, ważniejsza: **wspólny helper i tak nie jest zabezpieczeniem** — nie zmusza
autora piątego miejsca, żeby go zawołał. Strukturalną gwarancję daje wyłącznie bramka
z GOAL 3. Blok [4] bramki pilnuje, że helper nie zostanie wydrążony.

## GOAL 3 — inwariant: `gra/tools/mgla-sciezka-inwariant-test.cjs` (24/24)

Wariant **(a)+(b)** z dispatchu. Rdzeń: skan negatywny CAŁEGO `gra/src` tą samą komendą
co GOAL 1 — każde trafienie musi mieć wpis w tabeli `KLASYFIKACJA` z jawną klasą
i uzasadnieniem. Nowy zapis pozycji jednostki ⇒ blok [1] czerwony.

- [1] skan negatywny + zakaz martwych wpisów + wymóg niepustego uzasadnienia
- [1b] strażnik pokrycia (anty-ślepota): ≥300 plików, >1 mln znaków, obowiązkowe pliki
- [2] okno odkrycia: każdy zapis klasy `WIELOHEKS-ODKRYWA` w `main.ts` ma odkrycie
      w oknie −5/+45 linii ⟵ **detektor mutacji**
- [3] czwarte miejsce: hak `onAfterStep` faktycznie odkrywa
- [4] integralność helpera (liczy wystąpienia, nie samą obecność)
- [5] nietautologiczność skanera na źródle syntetycznym (4 przypadki, w tym brak
      fałszywych alarmów na komentarzach i na `==`/`===`)

## GOAL 4 — scenariusz rzeczny: `gra/tools/mgla-sciezka-rzeka-test.cjs` (14/14)

Bramka **behawioralna** na PRAWDZIWYM kodzie (bundlowane `advanceScoutAutoExplore`,
`terrainMoveCost`, `computeVisibleAt` — zero reimplementacji formuły, C-046). Korytarz
z rzeką wzdłuż `r === 0`, teren identyczny wszędzie (Wzgórza+Las), zwiadowca 12 MP.
Blok [B] **odtwarza bug** na prawdziwym kodzie (heksy pośrednie poza `explored`),
blok [C] dowodzi naprawy, blok [D] wiąże to ze wpięciem w `main.ts`.

## TESTY

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` (5.9.3) | ZIELONE (exit 0) |
| `mgla-sciezka-inwariant` (NOWA) | 24/24 |
| `mgla-sciezka-rzeka` (NOWA) | 14/14 |
| `mgla-teleport-koniec-tury` | 16/16 — bez regresu |
| logic | 213/213 |
| tech-tree | 19/19 |
| research | 33/33 |
| unit-replace | 13/13 |
| combat | 6/6 |
| `mgla-odkrycie-wzdluz-sciezki` | 16 pass / **1 fail — PRE-EXISTING**, identycznie na bazie `20f9993d` przed jakąkolwiek moją zmianą |

### Dowód nietautologiczności (Tryb trzeci) — 5 mutacji, każda osobno

Mutacja = usunięcie jednej linii, uruchomienie bramki, przywrócenie.
Stan czysty: **24 pass / 0 fail**.

| Mutacja | Usunięta linia | Wynik bramki |
|---|---|---|
| M1/3 `applyMarchSegmentInstant` | `:22545` `…computeVisibleAlongPath(result.movePath…)` | **22 pass / 2 fail** |
| M2/3 koniec tury w animacji | `:27720` `…computeVisibleAlongPath(anim.pathHexes…)` | **22 pass / 2 fail** |
| M3/3 koniec animacji (renderLoop) | `:32480` `…computeVisibleAlongPath(pathHexes…)` | **22 pass / 2 fail** |
| M4 czwarte miejsce (zwiadowca) | `:27773` `revealAlongPathForStack([u], …)` | **22 pass / 2 fail** |
| M5 wydrążenie helpera | `:9733` korpus helpera | **22 pass / 2 fail** |

Bramka czerwienieje dla KAŻDEGO z trzech historycznych miejsc osobno — nie tylko dla jednego.

### Dowód kluczowy — wykrycie PIĄTEGO miejsca

Do `main.ts` wstrzyknięto hipotetyczne piąte miejsce w dokładnie tym kształcie, jaki miały
wszystkie trzy historyczne bugi:

```ts
function piateMiejsceHipotetyczne(u: RuntimeUnit, dest: { q: number; r: number }): void {
  u.q = dest.q; u.r = dest.r; refreshFog();
}
```

Wynik: **23 pass / 1 fail** — `[1] … -- ["src/main.ts:11671 u.q = dest.q;",
"src/main.ts:11672 u.r = dest.r;"]`. Przywrócono; 24/24.

## BLOKADY

Brak blokujących. Dwie noty:

1. **PRE-EXISTING FAIL poza allowlistą (C-058 — zapisuję, nie zgaduję i nie naprawiam):**
   `mgla-odkrycie-wzdluz-sciezki-test.cjs` ma 1 fail już na bazie `20f9993d` — asercja
   `static: currentVisible() nadal liczy WYLACZNIE z biezacej pozycji jednostek`. Regex
   asercji rozjechał się z `main.ts` po wcześniejszych integracjach. Plik poza allowlistą
   ⇒ nie dotykam. Kandydat na osobny temat `PROCESS`/`GAME`.
2. Ta sama bramka kontraktuje dosłowny tekst trzech wywołań w `main.ts` — to ona blokuje
   pełne przejście na wspólny helper (patrz GOAL 2). Gdyby właściciel chciał domknąć
   helper, trzeba objąć ten plik allowlistą w osobnym temacie.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — ponumerowane zarzuty wg `R-PROC-AUTOBOT.md` §16a.

DEPLOY/PUSH: NIE WYKONANO
