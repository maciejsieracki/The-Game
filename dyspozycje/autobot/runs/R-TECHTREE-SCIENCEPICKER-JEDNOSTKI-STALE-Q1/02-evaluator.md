STATUS: PASS

TEMAT: R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1

GOAL: `techTreeView.ts` (hover-karta węzła drzewka technologii) i `sciencePicker.ts`
(tooltip badań) mają pokazywać KOMPLETNĄ i POPRAWNIE OZNACZONĄ listę jednostek
odblokowywanych przez daną technologię, czytaną z `units.json`'s pola `Tech`
(jak `entityCards/technologyAdapter.ts`), nie z osadzonego, niekompletnego
tekstu `tech.json`'s pola „Odblokowuje budynek".

ZMIANY/COMMIT: Zweryfikowano `git diff --stat 72ba63b7 22dac60a` w worktree
`/home/user/The-Game/.claude/worktrees/wf_25ac16e0-dc7-1` (bez tworzenia nowego
worktree). Diff ograniczony dokładnie do: NOWY `gra/src/ui/techUnlockParse.ts`,
zmieniony `gra/src/ui/techTreeView.ts`, zmieniony `gra/src/ui/sciencePicker.ts`,
NOWY `gra/tools/tech-unlock-units-test.cjs`, `.../01-operator.md`. ZERO zmian w
`gra/data/tech.json` i `gra/src/ui/entityCards/technologyAdapter.ts` (potwierdzone
bezpośrednio w `git diff --stat`, nie tylko przez test operatora). Przeczytano
pełny diff treści (nie tylko stat) — logika `unitsUnlockedByTech()` w
`techUnlockParse.ts` odpowiada dokładnie wzorcowi z `entityCards/technologyAdapter.ts:100`
(`unitsData.filter(u => u.Tech === tech['Technologia'])`) — potwierdzone
bezpośrednim odczytem obu plików. `git status` w worktree czysty przed i po
weryfikacji (bez artefaktów Evaluatora pozostawionych w repo).

TESTY:
- `npx tsc --noEmit` → czyste, exit 0.
- `node tools/tech-unlock-units-test.cjs` → 41 pass, 0 fail (uruchomione
  niezależnie, nie tylko odczytane z raportu operatora).
- Regresje uruchomione niezależnie: `tech-tree-test.cjs` 19/19,
  `technology-discovery-card-visual-test.cjs` 48/48, `building-tech-gate-test.cjs`
  89/89, `tech-tempo-test.cjs` 15/15 — wszystkie PASS.
- `science-hub-test.cjs` (dodatkowo uruchomiony, nie wymieniony w raporcie
  operatora): 5 pass, 2 fail (`engine available=4 (>=5)`, `hub unlocked=4 (>=5)`).
  Zweryfikowano przez `git archive 72ba63b7` do katalogu tymczasowego (bez
  tworzenia worktree) i ponowne uruchomienie tego samego testu na kodzie SPRZED
  zmian operatora: te same 2 FAIL z identyczną treścią. Test nie zależy od
  `techTreeView.ts`/`sciencePicker.ts` (bunduje tylko `playerState.ts` +
  `scienceHubSnapshotLogic.ts`). Wniosek: pre-istniejąca usterka baseline,
  niezwiązana z tym tematem — NIE jest regresją wprowadzoną przez ten diff.
  Rekomendacja: zarejestrować osobno w PYTANIA-OTWARTE/rejestrze (poza
  zakresem tego tematu), nie blokować tego PASS.

- KRYTYCZNA, SAMODZIELNA weryfikacja runtime (nie tylko czytanie źródła):
  zbudowano oba pliki (`techTreeView.ts`, `sciencePicker.ts`) esbuildem do CJS
  (stub tylko dla `icons/brandAssets.ts`'s `import.meta.glob` i `?raw` — udokumentowany
  defekt harnessu, sam mechanizm zastąpienia ikon SVG, ZERO wpływu na logikę
  jednostek/budynków), z tymczasowo dopisanymi eksportami wewnętrznych funkcji
  (`buildTreeNodes`/`unlockChips` z techTreeView.ts; `buildNodes`/`buildTooltipHTML`
  z sciencePicker.ts — dopisane WYŁĄCZNIE do zbudowanego bundla w scratchpadzie,
  nie do plików źródłowych w repo) i faktycznie wywołano ten kod dla Brązownictwa:
  * `techTreeView.ts::buildTreeNodes()` → `node.odblokujeJednostki.length === 20`
    (lista: Włócznik...Gwardzista z champi); `unlockChips(node)` renderuje
    dokładnie 20 chipów klasy `ch u`, zero literalnego tekstu "Jednostki:" w HTML.
  * `sciencePicker.ts::buildNodes()` → `node.odblokujeJednostki.length === 20`;
    `node.odblokujeBudynek === "Odlewnia brązu, Kuźnia brązu"` (2 pozycje, czyste).
    `buildTooltipHTML(node, 'od')` → sekcja "Odblokowuje budynki:" zawiera
    dokładnie 2 `<li>` ("Odlewnia brązu", "Kuźnia brązu"), ZERO segmentu
    "Jednostki:" wewnątrz; nowa sekcja "Odblokowuje jednostki:" zawiera
    dokładnie 20 `<li>`.
  * Kontrola różnicowa (ten sam harness na kodzie SPRZED zmian, `git archive
    72ba63b7`): `techTreeView.ts` (stary) → `odblokujeJednostki.length === 12`
    (brakuje m.in. "Strażnik bram Harappy", "Taran okuty"...); `sciencePicker.ts`
    (stary) → `odblokujeBudynek === "Odlewnia brązu; Kuźnia brązu; Jednostki:
    Włócznik, ..., Wojownik szekelesz"` — jedna, brudna pozycja pod
    "budynki", DOKŁADNIE zgłoszony bug. Różnica 12→20 i brudny→czysty string
    potwierdza, że to prawdziwa naprawa, nie tylko zmiana kosmetyczna w kodzie
    martwym.
  * Scratch bundle/entry pliki usunięte po teście, `git status` w worktree
    czysty (sprawdzone).

BLOKADY: brak (nowa usterka `science-hub-test.cjs` jest pre-istniejąca,
potwierdzona baseline — nie blokuje tego tematu, ale wymaga osobnego zgłoszenia
właścicielowi/rejestrowi, patrz TESTY wyżej).

NASTĘPNY KROK: Final Control.

DEPLOY/PUSH: NIE WYKONANO.
