# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: INFRA
TEMAT: `R-REPO-SPRZATANIE-SREDNIE-Q1`
GOAL: Usunąć z repo **591,8 MB w 4096 plikach śledzonych**, których obecna gra nie
potrzebuje, tak żeby **gra dalej działała identycznie** i wszystkie bramki były zielone.
Historii NIE przepisujemy w tym temacie — to osobna, autoryzowana bramka po integracji.

## Wyzwalacz — ECHO właściciela

> „wykasowałbym wszystko na dysku i na git co nie jest nam potrzebne w obecnej grze
> i wyczyścił git"

Właściciel wybrał wariant **średni** (AskUserQuestion, 2026-08-26): pochodne + `docs/ux`
+ archiwa. Wariant był mu pokazany z konkretną listą ścieżek — poniżej ta sama lista.

## DO USUNIĘCIA — dokładnie te ścieżki, nic więcej

| Ścieżka | Plików | MB | Dlaczego wolno |
|---|---|---|---|
| `gra-robocza/Gra-ROBOCZA-PLAYTEST-*.html` | 8 | 280,3 | **Pochodne.** Generuje je `gra-robocza/tools/sync-playtest-bundles.cjs` z głównego bundla. Odtwarzalne jedną komendą. |
| `gra-kanon/` | 606 | 107,0 | Zamrożona stara wersja, nietykana od 2026-08-17. **UWAGA: 8 narzędzi się do niej odwołuje — patrz niżej.** |
| `docs/ux/` | 2928 | 177,5 | Eksporty z Claude Design. **Zweryfikowane: 6 referencji w `gra/src/` to WYŁĄCZNIE komentarze nagłówkowe, zero importów.** Ikony mają własną kopię w `gra/src/ui/icons/brand/` (71 plików). |
| `docs/archiwum-czatow/` | 51 | 13,4 | Archiwum korespondencji. |
| `_archiwum/` | 19 | 8,2 | Archiwum. |
| `_backup/` | 484 | 5,4 | Backup. |
| `gra-robocza/tools — kopia/` | — | — | Dosłownie katalog „kopia" — duplikat `gra-robocza/tools/`. |

**RAZEM: 591,8 MB.**

## CZEGO NIE WOLNO TKNĄĆ — naruszenie = natychmiastowy FAIL

1. **`gra-robocza/Gra-ROBOCZA.html`** — to JEST gra. Zostaje bez zmian, md5 `04a7adcb`
   ma się zgadzać przed i po.
2. **`gra/src/**` i `gra/data/**`** — zero zmian. Ten temat nie dotyka kodu gry.
   `git diff --stat` na tych ścieżkach ma być PUSTY.
3. `gra-robocza/START.html`, `gra-robocza/ROBOCZA-MANIFEST.json`, `dyspozycje/**`,
   `docs/decyzje/**`, `docs/master/**`, `docs/encyklopedia/**`.
4. Zakaz `npm run build`/`dev` w `gra/`, zakaz `npx`, zakaz `git add -A`,
   zakaz aktualizacji `WERSJE.md`. `R-PROC-AUTOBOT.md` §9 w całości obowiązuje.

## PROBLEM DO ROZWIĄZANIA — zależności od `gra-kanon/`

Osiem narzędzi odwołuje się do `gra-kanon/`:
`gra/tools/bramka-test-publish.ps1`, `sync-kanon-to-robocza.ps1`, `compare-units-kanon.cjs`,
`publish-finalna-snapshot.ps1`, `cleanup-retention.ps1`, `audyt-abc-handoff.ps1`,
`publish-kanon-snapshot.ps1`, `check-pole-bundle.cjs` — plus `dyspozycje/autobot/playbook.json`.

Operator MA to rozstrzygnąć **jawnie, z uzasadnieniem per narzędzie**, a nie po cichu
zostawić martwe ścieżki. Dla każdego z ośmiu: czy narzędzie jest jeszcze używane (dowód:
czy któraś bramka albo procedura je woła), a jeśli nie — usunąć razem z `gra-kanon/`
i dopisać do listy zmian. Jeśli TAK jest używane — NIE kasować `gra-kanon/` i zgłosić to
jako BLOCK z konkretną nazwą narzędzia i miejscem wywołania. **Zostawienie narzędzia,
które po tej zmianie wywala się na brakującej ścieżce, to FAIL.**

Analogicznie `docs/ux`: sześć komentarzy w `gra/src/` będzie wskazywać w pustkę. To NIE
jest powód do niekasowania (komentarz nie łamie builda), ale Operator ma je **zaktualizować
tak, żeby nie kłamały** — np. wskazać na `gra/src/ui/icons/brand/`, gdzie leży realna kopia.
To jedyny dozwolony wyjątek od zakazu dotykania `gra/src` i **wyłącznie w komentarzach**;
zero zmian w kodzie wykonywalnym, `tsc` i bramki mają to potwierdzić.

## Kryteria sukcesu

1. Wszystkie ścieżki z tabeli usunięte, **żadna spoza tabeli**. Dowód: `git diff --stat`
   od `git merge-base`, przejrzany pozycja po pozycji.
2. `md5sum gra-robocza/Gra-ROBOCZA.html` = `04a7adcba9c0d6df1490c6842ba46f96` po zmianie.
3. `git diff --stat origin/main HEAD -- gra/src gra/data` — **pusty poza komentarzami**
   z akapitu o `docs/ux` (jeśli Operator je poprawił; wtedy diff pokazuje wyłącznie linie
   komentarza, co Evaluator ma zweryfikować naocznie).
4. `tsc --noEmit` 0 błędów. **5 bramek referencyjnych zielonych** wobec wartości §6:
   logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
5. **Bramki tematów zamkniętych w tej serii nadal zielone** (dowód, że sprzątanie niczego
   nie podcięło): `praca-jeden-podzial-kontrakt-test` 634/0, `praca-jeden-podzial-real-render-test`
   36/0, `ai-jednostki-tylko-zakup-test` 44/0, `build-panel-ulepszenia-scroll-real-render-test`
   43/0, `dyplo-pakt-ekspansja-granica-test` 26/0, `praca-cap-migracja-luka-test` 11/0,
   `zelazo-zrzuty-25-jednostek-render` 61/0.
6. **Żadne narzędzie w `gra/tools/` nie wywala się na brakującej ścieżce** — dowód
   z faktycznego uruchomienia tych, które da się uruchomić bez Windowsa (`.cjs`),
   i z analizy dla `.ps1`.
7. Zmierzony rozmiar: ile MB faktycznie ubyło z plików śledzonych (przed/po).

## Izolacja

Gałąź `autobot/R-REPO-SPRZATANIE-SREDNIE-Q1` od `origin/main`, osobny worktree per rola.

## Allowlista

Ścieżki z tabeli „DO USUNIĘCIA" (kasowanie) + `gra/tools/*` (usunięcie martwych narzędzi)
+ `dyspozycje/autobot/playbook.json` (jeśli wskazuje na `gra-kanon`) + komentarze w sześciu
plikach `gra/src` wymienionych wyżej + raporty runu.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. Commituj cząstkowe
postępy w trakcie. Kasowanie 4096 plików — używaj `git rm`, NIE `rm` + `git add -A`
(§9: zakaz `git add -A`). Brak dowodu zgłaszaj jako brak dowodu (§13a), nigdy jako zielone.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: Opus 5 High dla wszystkich trzech ról (temat destrukcyjny, koszt błędu wysoki).
`opts.model` jawnie na KAŻDYM wywołaniu `agent()` (C-062).

## PO INTEGRACJI — osobna bramka, NIE część tego tematu

Przepisanie historii (`git filter-repo`) i force-push. To akcja klasy deploy: wykonuje ją
wyłącznie orkiestrator po zgodzie właściciela. Operator/Evaluator/Final Control **nie
pushują i nie przepisują historii**.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
