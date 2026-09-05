# P-MILICJA-OBRONA-CYWILNA-Q1 — dispatch

TEMAT: `P-MILICJA-OBRONA-CYWILNA-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5 high; Evaluator — Sonnet 5 high; Final Control — Sonnet 5 high.

## WYZWALACZ (właściciel)

> „Wybudowanie garnizonu mogłoby włączać tę funkcję, że przy obronie miasta, które nie ma
> żadnego wojska, miałaby być obrona cywilna; trzeba byłoby zobaczyć, co tam było i czy to
> w ogóle szkodzi."

**ECHO właściciela (AskUserQuestion, 2026-09-05):** „Garnizon włącza milicję, bez niego
miasto pada". Wiążące: budynek Garnizon daje dwa skutki naraz — porządek wewnątrz
oraz to, że miasta nie da się przejąć bez walki. **Bez Garnizonu miasto bez wojska
NADAL pada bez bitwy** — to jest kara za brak budynku, nie defekt.

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym)

**A. Milicja JUŻ ISTNIEJE i jest kompletna.** `makeMilitia` (`gra/src/game/siege.ts:478-499`)
buduje syntetyczną jednostkę z ludności miasta:
- liczebność `floor(populacja × MILITIA_POP_FRACTION)`
- statystyki jako ułamek `STONE_WARRIOR` (Wojownik epoki kamienia) × `MILITIA_STRENGTH_FRACTION`
- pula HP proporcjonalna do liczebności
- `progDezercji: null` — **nie ucieka**
- `unbreakable: true` — **walczy do końca**

`effectiveGarrison` (`siege.ts:505-513`) wystawia ją **automatycznie**, gdy prawdziwy
garnizon jest pusty.

**B. LUKA — decyzja „czy w ogóle będzie bitwa" zapada PRZED wystawieniem milicji.**
`hasCityDefenders` (`gra/src/game/siegeDefenders.ts:24-29`):

```
if ((city.garnizon ?? 0) > 0) return true;
return defenderUnitsNearCity(city, units).length > 0;
```

Komentarz nad funkcją mówi wprost: *„Ludność / populacja BEZ garnizonu ≠ obrońcy"*.
`canCaptureCityWithoutBattle` (`:32-37`) to jej zaprzeczenie.

**Skutek: miasto bez wojska jest zdobywane BEZ ŻADNEJ BITWY.** Milicja jest w kodzie,
ale w tej ścieżce nigdy się nie odpala.

## GOAL

**Budynek `garnizon` w mieście sprawia, że `hasCityDefenders` zwraca `true`**, więc miasto
nie może zostać przejęte bez walki, a do obrony staje milicja z `effectiveGarrison`.

```
if ((city.garnizon ?? 0) > 0) return true;
if (<miasto ma budynek 'garnizon'>) return true;      // ← NOWE
return defenderUnitsNearCity(city, units).length > 0;
```

**Zachowaj `unbreakable: true`** — Garnizon oznacza, że ci ludzie mają dowódców i się nie
rozbiegną. Nie dodawaj progu ucieczki.

**Bez Garnizonu zachowanie BEZ ZMIAN** — miasto bez wojska nadal pada bez bitwy.

## ZALEŻNOŚĆ

Budynek `garnizon` powstaje w `R-BUDYNEK-GARNIZON-NOWY-Q1`. **Ten temat dispatchowany jest
PO jego integracji.** Jeśli w bazie nie ma rekordu `garnizon` w `buildings.json` —
zatrzymaj się z `BLOCK` i powiedz to wprost, zamiast tworzyć budynek samodzielnie.

## KRYTERIA KOŃCA (binarne)

1. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
2. Nowa bramka `gra/tools/milicja-obrona-cywilna-test.cjs`:
   - a) miasto **z** budynkiem `garnizon`, **bez** jednostek → `hasCityDefenders === true`
     i `canCaptureCityWithoutBattle === false`;
   - b) miasto **bez** budynku, bez jednostek → `hasCityDefenders === false` (zachowanie
     niezmienione — asercja regresyjna);
   - c) `effectiveGarrison` dla miasta z budynkiem i bez jednostek zwraca **niepustą** listę
     z Milicją;
   - d) milicja zachowuje `unbreakable === true` i `progDezercji === null`;
   - e) miasto z budynkiem i pop 0 → brak milicji (`makeMilitia` zwraca `null`), więc
     `hasCityDefenders` nadal `true` z tytułu budynku, ale obrońcy są puści — **opisz
     w raporcie, co się wtedy dzieje w szturmie**; jeśli to prowadzi do zawieszenia albo
     błędu, zgłoś jako blokadę.
3. Bramki rodziny oblężenia/szturmu — **ZNAJDŹ SAM**
   (`ls gra/tools/ | grep -Ei "siege|oblez|szturm|capture|zdobyc|defend|milic"`),
   uruchom WSZYSTKIE, podaj wyniki. Czerwona → sprawdź parytet na czystej bazie PRZED
   zgłoszeniem jako regres.
4. Pięć bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — zmiana zachowania miasta BEZ Garnizonu.** ECHO właściciela jest jawne:
bez budynku miasto nadal pada bez bitwy. Kuszące jest „naprawienie" tego przy okazji,
bo wygląda jak defekt. To nie jest defekt, to jest kara. Asercja 2b pilnuje dokładnie tego.

**Tryb drugi — dotknięcie balansu milicji.** `MILITIA_POP_FRACTION`,
`MILITIA_STRENGTH_FRACTION` i `STONE_WARRIOR` to liczby balansu. **Nie ruszasz ich.**
Jeśli uznasz, że milicja jest za słaba lub za silna — to jest `DECISION_REQUIRED`,
nie Twoja decyzja.

**Tryb trzeci — test na mocku zamiast na realnej ścieżce.** Bramka ma sprawdzać funkcje
`hasCityDefenders` / `canCaptureCityWithoutBattle` / `effectiveGarrison` z prawdziwego
modułu, nie własną kopię logiki.

**Tryb czwarty — test tautologiczny.** Cofnij dodany warunek, uruchom, pokaż że bramka
czerwienieje, przywróć, potwierdź czysty `git status`.

## ALLOWLISTA

- `gra/src/game/siegeDefenders.ts`
- `gra/src/game/siege.ts` (**wyłącznie** jeśli konieczne dla przekazania listy budynków;
  **ZAKAZ zmiany liczb balansu milicji**: `MILITIA_POP_FRACTION`,
  `MILITIA_STRENGTH_FRACTION`, `STONE_WARRIOR`)
- `gra/tools/milicja-obrona-cywilna-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-MILICJA-OBRONA-CYWILNA-Q1/**`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/buildings.json`
(trzyma go `R-BUDYNEK-GARNIZON-NOWY-Q1`), `gra/data/society-params.json`,
`gra/src/game/society-breakdown.ts`, `gra/src/ui/cityPanel.ts` (trzyma je temat szczęścia),
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-milicja`, gałąź `autobot/P-MILICJA-OBRONA-CYWILNA-Q1`,
baza jawnie `origin/main` na SHA z założenia — potwierdź `git log -1` PRZED pracą.

C-001: zakaz `npm run build`/`dev` w `gra/`. Jedyna dozwolona kompilacja:
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` poza repo, z unikalnym sufiksem.

## GRANICE

- **Nie zmieniasz balansu milicji** ani statystyk Wojownika.
- **Nie zmieniasz zachowania miasta bez Garnizonu.**
- Nie integrujesz, nie deployujesz, nie pushujesz do origin.

## OBIEG

Operator → Evaluator → (Obrona, jeśli zarzuty) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja — ręką orkiestratora.
