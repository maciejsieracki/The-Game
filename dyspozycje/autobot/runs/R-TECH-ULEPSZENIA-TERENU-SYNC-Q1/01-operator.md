# 01-operator — R-TECH-ULEPSZENIA-TERENU-SYNC-Q1

```text
STATUS: PASS
TEMAT: R-TECH-ULEPSZENIA-TERENU-SYNC-Q1
GOAL: Naprawić dwa potwierdzone bugi karty odkrycia technologii
      (gra/src/ui/techDiscoveryNotice.ts), sekcja „Ulepszenia terenu":
      Bug A (dane, tech.json — 4 rozbieżności nazw vs terrain-improvements.json)
      i Bug B (kod — improvementIconSvg() dostaje polską etykietę zamiast
      ImprovementKey, cichy fallback do imp-farm dla ~13 technologii).
ZMIANY/COMMIT: f70f7b91416d0de3dcff03a7885082d4e5336a0c
  (branch autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1)
  - gra/data/tech.json (wyłącznie 4 pola "Odblokowuje ulepszenie terenu")
  - gra/src/ui/techDiscoveryNotice.ts (import terrain-improvements.json,
    mapa IMPROVEMENT_NAME_TO_KEY, wywołanie improvementIconSvg zmapowanym kluczem)
  - gra/tools/technology-discovery-card-visual-test.cjs (rozszerzenie o sekcję [4])
TESTY:
  - npm run typecheck (tsc --noEmit): 0 błędów.
  - node tools/technology-discovery-card-visual-test.cjs: 48 PASS, 0 FAIL
    (było 17/17 PASS przed rozszerzeniem; sekcja [4] dodaje 31 nowych asercji
    pokrywających Bug A + Bug B dla min. 5 technologii: Brązownictwo,
    Murarstwo, Oswojenie zwierząt, Wojskowość, Rolnictwo — zgodnie z zadaniem).
BLOKADY: brak.
NASTĘPNY KROK: Evaluator (Sonnet 5, effort High) na branchu
  autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1, commit f70f7b9.
DEPLOY/PUSH: NIE WYKONANO
```

## KROK 0 — synchronizacja worktree

`git log --oneline -3` na starcie pokazywał HEAD na innym branchu
(`worktree-agent-a0fa29299e386edd4`), starszy niż `3f02f72`. Zweryfikowano
`git merge-base --is-ancestor HEAD 3f02f72` → tak (HEAD był przodkiem
`3f02f72`, nie odwrotnie) → wykonano `git merge --ff-only 3f02f72` (fast-forward,
bez konfliktów). Następnie `git checkout autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`
— branch istniał już w repo i wskazywał na dokładnie ten sam commit `3f02f72`
(zero diff), więc dalsza praca poszła na tym branchu, zgodnie z izolacją z
`00-dispatch.md`.

## Bug A — dane (tech.json)

Zweryfikowano programowo (Node, iteracja po `tech.json` + budowa mapy
`nazwa -> klucz` z `terrain-improvements.json`), że PRZED poprawką dokładnie
4 pozycje w całym `tech.json` nie miały pokrycia w kanonie
`terrain-improvements.json` — dokładnie te wskazane w tabeli `00-dispatch.md`,
żadnych innych:

- Murarstwo → `"Kopalnia"` (widmo)
- Oswojenie zwierząt → `"Bydło"` (dryf nazwy vs `nazwa: "Trzoda"` w rekordzie `bydlo`)
- Brązownictwo → `"Popalnia brązu"` (widmo, brak jakiegokolwiek pokrycia)
- Wojskowość → `"Fort / umocnienia"` (dryf nazwy vs `nazwa: "Fort"` w rekordzie `fort`)

Naprawa (wyłącznie pole `Odblokowuje ulepszenie terenu`, 4 rekordy):

| Technologia | Przed | Po |
|---|---|---|
| Brązownictwo | `"Popalnia brązu"` | `null` |
| Murarstwo | `"Kopalnia, Kamieniołom, Posterunek (Strażnica)"` | `"Kamieniołom, Posterunek (Strażnica)"` |
| Oswojenie zwierząt | `"Bydło, Owce, Lama"` | `"Trzoda, Owce, Lama"` |
| Wojskowość | `"Fort / umocnienia"` | `"Fort"` |

Po poprawce: 0 rozbieżności w całym pliku (zweryfikowane skryptowo, patrz sekcja
[4] w teście oraz `NASTĘPNY KROK` niżej). `gra/data/terrain-improvements.json`
nietknięty (zero diff — potwierdzone `git status` / `git diff --check`).

Uwaga informacyjna: `Hutnictwo żelaza` (pole `null`, mimo istniejącego rekordu
`kopalnia_zelaza` z `tech: "Hutnictwo żelaza"`) świadomie NIE naprawione —
jawnie poza zakresem tego tematu wg `00-dispatch.md`.

## Bug B — kod (techDiscoveryNotice.ts) i wybór podejścia

**Wybrane podejście: mapa nazwa→ImprovementKey (osobno od Bug A), NIE
przebudowa sekcji na iterację `terrain-improvements.json` filtrowaną po `tech`.**

Uzasadnienie wyboru (świadomie mniejsze ryzyko / mniejszy diff):

1. Filtrowanie `terrain-improvements.json` po polu `tech === Technologia` (wzorzec
   sekcji Budynki/Jednostki) automatycznie ujawniłoby też przypadek
   `Hutnictwo żelaza` → `kopalnia_zelaza` (`tech: "Hutnictwo żelaza"`), który
   `00-dispatch.md` **jawnie** oznacza jako poza zakresem tego tematu. Zmiana
   architektoniczna „naprawiłaby" go przy okazji, co byłoby rozszerzeniem
   zakresu bez autoryzacji.
2. To samo podejście dla `Brązownictwo` pokazałoby `Kopalnia miedzi` i
   `Kopalnia cyny` (oba mają `tech: "Brązownictwo"` w `terrain-improvements.json`)
   zamiast wymaganego w kryteriach końca „pole puste, sekcja znika". Kryterium 1
   dopuszcza też wariant „pokazuje wyłącznie realne pozycje", więc to nie
   byłoby formalnie błędne, ale rozjeżdża się z jednoznaczną instrukcją Bug A
   („po usunięciu pole staje się puste/null... co jest poprawnym zachowaniem").
3. `posterunek` ma w `terrain-improvements.json` `tech: "-"` (brama AND w
   kodzie: Obróbka drewna + Murarstwo, `IMPROVEMENT_MULTI_TECH_REQ`) — prosty
   filtr po polu `tech` NIE złapałby go dla żadnej z tych dwóch technologii,
   mimo że dziś (po Bug A) `tech.json` poprawnie go wymienia dla obu. Odtworzenie
   tej bramki AND w nowej architekturze sekcji byłoby dodatkową logiką i
   dodatkowym ryzykiem regresji, nieporuszaną przez ten temat.
4. Mapa nazwa→klucz to zmiana lokalna (1 stała + 1 linia wywołania), zero zmian
   kontraktu funkcji `buildBody`/`improvementsBody`, zero zmian zachowania dla
   innych sekcji.

Implementacja: `techDiscoveryNotice.ts` importuje teraz
`gra/data/terrain-improvements.json` (ten sam kanon, `B1-tech-MACIEJ-2026-06-29`)
i buduje raz, na poziomie modułu, odwrotną mapę `IMPROVEMENT_NAME_TO_KEY`
(`nazwa gracza -> ImprovementKey`, czytając pole `nazwa` z każdego rekordu
obiektu, którego klucz = `ImprovementKey` — dokładnie ten wzorzec z
`buildModeHud.ts`, gdzie `ImprovementKey` jest importowany z
`../render/improvements` i przekazywany do `improvementIconSvg` wprost).
Wywołanie zmieniono z `improvementIconSvg(name)` na
`improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name)` — fallback na samą
nazwę zachowuje stare (bezpieczne, bez wyjątku) zachowanie dla
nierozpoznanej etykiety, gdyby kiedyś w przyszłości pojawiła się rozbieżność
nazw poza tymi 4 z Bug A.

## Weryfikacja programowa (zamiast osobnego jednorazowego skryptu)

Zamiast tworzyć nowy plik, rozszerzono istniejący
`gra/tools/technology-discovery-card-visual-test.cjs` o sekcję `[4]`
(31 nowych asercji, zero regresji w sekcjach [1]–[3]) weryfikującą programowo:

- Brązownictwo: pole `null`/puste → sekcja znika (`count === 0`).
- Murarstwo: `"Kopalnia"` usunięte, `"Kamieniołom"` i `"Posterunek (Strażnica)"`
  zostają (dokładnie 2 pozycje).
- Oswojenie zwierząt: `"Bydło"` usunięte, `"Trzoda"` obecne.
- Wojskowość: `"Fort / umocnienia"` usunięte, `"Fort"` obecne.
- Globalnie: 0 rozbieżności nazw w całym `tech.json` vs `terrain-improvements.json`
  (18 pozycji ulepszeń terenu sprawdzonych łącznie w całym pliku).
- Bug B: dla wszystkich 18 pozycji, zmapowany `ImprovementKey` ma WŁASNY wpis w
  `improvement-icon-map.json` (nie fallback `_default`) — 0 fallbacków.
- Punktowa weryfikacja różnych ikon (nie wszystkie `imp-farm`) dla 5 technologii:
  Rolnictwo→Farma→`imp-farm`, Oswojenie zwierząt→Trzoda→`imp-pasture`,
  Murarstwo→Kamieniołom→`imp-quarry`, Wojskowość→Fort→`imp-fort`,
  Waluta→Kopalnia złota→`imp-mine` — z jawną kontrolą testu, że poza Rolnictwem
  żadna oczekiwana ikona nie jest `imp-farm` (inaczej test nie odróżniłby
  naprawy od starego cichego bugu).
- Asercje na źródle: wywołanie `improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name)`
  i import `terrain-improvements.json` faktycznie obecne w `techDiscoveryNotice.ts`.

Wynik: **48 PASS, 0 FAIL** (17 oryginalnych + 31 nowych).

## Testy — dokładne wyniki

```
$ cd gra && npm install   # brak node_modules na starcie worktree
added 69 packages, ... (bez błędów instalacji)

$ npm run typecheck
> tsc --noEmit
(brak wyjścia = 0 błędów)

$ node tools/technology-discovery-card-visual-test.cjs
... (48 linii PASS, patrz output pełny w logu sesji)
48 PASS, 0 FAIL
```

## Kontrola zakresu (allowlista)

`git status --short` po commicie kodu pokazuje wyłącznie:
```
gra/data/tech.json
gra/src/ui/techDiscoveryNotice.ts
gra/tools/technology-discovery-card-visual-test.cjs
```
`git diff --check` — brak problemów białych znaków. Zero zmian w
`gra/data/terrain-improvements.json`, `main.ts`, `unitInfoCard.ts`,
`sidePanelHud.ts`, `bottomBarHud.ts` ani jakiejkolwiek innej karcie.

## Pełny diff plików produkcyjnych (commit f70f7b9)

Patrz commit `f70f7b91416d0de3dcff03a7885082d4e5336a0c` na branchu
`autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` — `git show f70f7b9` albo
`git diff 3f02f72 f70f7b9 -- gra/data/tech.json gra/src/ui/techDiscoveryNotice.ts gra/tools/technology-discovery-card-visual-test.cjs`.

Skrót zmian (bez treści testu, patrz plik dla pełnej sekcji [4]):

```diff
--- a/gra/data/tech.json
+++ b/gra/data/tech.json
@@ Murarstwo
-      "Odblokowuje ulepszenie terenu": "Kopalnia, Kamieniołom, Posterunek (Strażnica)"
+      "Odblokowuje ulepszenie terenu": "Kamieniołom, Posterunek (Strażnica)"
@@ Oswojenie zwierząt
-      "Odblokowuje ulepszenie terenu": "Bydło, Owce, Lama"
+      "Odblokowuje ulepszenie terenu": "Trzoda, Owce, Lama"
@@ Brązownictwo
-      "Odblokowuje ulepszenie terenu": "Popalnia brązu",
+      "Odblokowuje ulepszenie terenu": null,
@@ Wojskowość
-      "Odblokowuje ulepszenie terenu": "Fort / umocnienia"
+      "Odblokowuje ulepszenie terenu": "Fort"

--- a/gra/src/ui/techDiscoveryNotice.ts
+++ b/gra/src/ui/techDiscoveryNotice.ts
@@
 import techData from '../../data/tech.json';
 import buildingsData from '../../data/buildings.json';
 import unitsData from '../../data/units.json';
+import terrainImprovementsData from '../../data/terrain-improvements.json';
 import { pushOverlay, popOverlay } from './escapeOverlayStack';
 import { techIconSvg } from './techIcons';
 import { buildingIconSvg, unitIconSvg, improvementIconSvg } from './icons/brandAssets';
+import type { ImprovementKey } from '../render/improvements';
@@
+const IMPROVEMENT_NAME_TO_KEY: Record<string, ImprovementKey> = (() => {
+  const map: Record<string, ImprovementKey> = {};
+  for (const [key, row] of Object.entries(terrainImprovementsData as Record<string, { nazwa?: string }>)) {
+    if (key.startsWith('_')) continue;
+    const nazwa = row?.nazwa;
+    if (typeof nazwa === 'string' && nazwa) map[nazwa] = key as ImprovementKey;
+  }
+  return map;
+})();
@@ buildBody()
   const improvementsBody = improvementNames.map(name => unlockItemRow({
-    icon: improvementIconSvg(name),
+    icon: improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name),
     title: name,
   })).join('');
```

(Pełny diff, w tym rozszerzenie testu wizualnego, w commicie i w logu sesji
Operatora — powyżej pełny tekst wygenerowanego `git diff`.)
