# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: INFRA
TEMAT: `R-REPO-SCIEZKA-KANON-FINALNA-Q1`
GOAL: Odtworzyć oprzyrządowanie dwóch poziomów wydań — KANON i FINALNA — usunięte przy
sprzątaniu repo, oraz doprowadzić dokumentację do stanu zgodnego z faktami.

## Wyzwalacz — ECHO właściciela

Przy sprzątaniu repo (`R-REPO-SPRZATANIE-SREDNIE-Q1`) usunięto katalog `gra-kanon/` wraz
z ośmioma narzędziami, które Operator zbadał jako martwe (zero wywołań w bramkach, w CI,
w regułach narzędzi). Final Control oznaczył to jako **znalezisko F1, najważniejsze**:
`dyspozycje/WERSJE.md:8` nadal nazywa `publish-kanon-snapshot.ps1` i `publish-finalna-snapshot.ps1`,
a `Gra-FINALNA.html` **zostaje w repo bez żadnego narzędzia promocji**.

Pytanie do właściciela: czy KANON i FINALNA są nadal żywymi poziomami wydań?

> **Odpowiedź: „Tak, odtwórz narzędzia."**

## Fakty — zweryfikowane, punkt startowy

Wszystkie cztery skrypty są odzyskiwalne z commita `39ae5d17` (ostatni przed sprzątaniem):

| Skrypt | Linii | Rola |
|---|---|---|
| `gra/tools/publish-kanon-snapshot.ps1` | 99 | promocja ROBOCZA → KANON |
| `gra/tools/publish-finalna-snapshot.ps1` | 36 | promocja KANON → FINALNA |
| `gra/tools/cleanup-retention.ps1` | 106 | wołany przez `publish-kanon-snapshot.ps1:77` |
| `gra/tools/sync-kanon-to-robocza.ps1` | 107 | synchronizacja wsteczna |

Odtworzenie: `git show 39ae5d17:gra/tools/<nazwa>`.

## ZADANIE

1. **Odtwórz skrypty**, ale **NIE ślepo**. Każdy przeczytaj i sprawdź, czy jego założenia
   są nadal prawdziwe po sprzątaniu repo. `publish-kanon-snapshot.ps1` **odtwarza katalog
   `gra-kanon/`** przy pierwszym uruchomieniu — to jest zamierzone i zgodne z decyzją
   właściciela, ale sprawdź, czy nie zakłada istnienia czegoś, czego już nie ma.
2. **Rozstrzygnij per skrypt**, czy jest potrzebny. Właściciel potwierdził KANON i FINALNA
   jako żywe poziomy wydań — to uzasadnia dwa pierwsze i `cleanup-retention` (bo go woła
   `publish-kanon-snapshot`). `sync-kanon-to-robocza.ps1` to **synchronizacja wsteczna**,
   której właściciel wprost nie wymienił — jeśli nie znajdziesz dla niej uzasadnienia,
   **NIE odtwarzaj jej** i powiedz to wprost (§14: nie poszerzaj zakresu).
3. **Napraw martwe odwołania** w dokumentacji, wymienione jako znalezisko F1:
   `dyspozycje/WERSJE.md:8` ma być zgodny z tym, co faktycznie istnieje po tej zmianie.
4. **Nie odtwarzaj `gra-kanon/`** jako katalogu z zawartością — sprzątanie usunęło
   107 MB starych snapshotów i to zostaje usunięte. Skrypt ma go tworzyć **przy promocji**,
   nie repo ma go trzymać.
5. Pozostałe cztery narzędzia usunięte w tamtym temacie (`bramka-test-publish.ps1`,
   `audyt-abc-handoff.ps1`, `compare-units-kanon.cjs`, `check-pole-bundle.cjs`) —
   **NIE odtwarzaj bez uzasadnienia**. Final Control potwierdził niezależnie, że tor
   „Grupa F" był wycofany PRZED tamtym tematem (cele `Gra-podglad*.html` nie istniały już
   w bazie). Jeśli któreś okaże się potrzebne dla ścieżki KANON/FINALNA — odtwórz i uzasadnij.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ odtworzenia skryptu bez przeczytania go.** Skrypt sprzed sprzątania może odwoływać
  się do ścieżek, których już nie ma — przywrócenie go „bo był" da narzędzie, które wywala się
  przy pierwszym uruchomieniu. Sprawdź każdą ścieżkę w każdym skrypcie.
- **ZAKAZ uruchamiania promocji.** To narzędzia deploy-class; ten temat je **odtwarza**,
  nie używa. `gra-robocza/**`, `gra-kanon/**` i `dyspozycje/WERSJE.md` (poza punktem 3)
  pozostają nietknięte.
- Skrypty są w PowerShellu i **nie da się ich uruchomić na tej maszynie** (Linux).
  Weryfikacja jest **statyczna**: każda ścieżka, każde wywołanie zewnętrzne, każde założenie
  o istnieniu pliku — sprawdzone wobec faktycznego stanu repo. **Zgłoś to jako ograniczenie
  dowodu (§13a), nie udawaj, że przetestowałeś.**

## Kryteria sukcesu

1. Skrypty ścieżki KANON/FINALNA obecne w repo, każdy z odnotowanym uzasadnieniem
   („odtworzony, bo…") albo jawnym „nie odtworzony, bo…".
2. Dla każdego odtworzonego skryptu: **lista wszystkich ścieżek, których dotyka**, wraz
   z informacją, czy istnieją dziś w repo. Ścieżka nieistniejąca = jawna nota, nie ciche pominięcie.
3. `dyspozycje/WERSJE.md:8` zgodny ze stanem faktycznym.
4. `tsc --noEmit` 0 błędów; 5 bramek referencyjnych zielonych (skrypty PowerShell ich nie
   dotykają, ale to dowód, że nic nie wpadło przypadkiem).
5. `git status` czysty; zero zmian w `gra/src`, `gra/data`, `gra-robocza`, `gra-kanon`.

## Izolacja

Gałąź `autobot/R-REPO-SCIEZKA-KANON-FINALNA-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/tools/*.ps1` (odtworzenie) · `dyspozycje/WERSJE.md` (**wyłącznie** linia z martwymi
odwołaniami, punkt 3) · raporty runu.

**NIE ruszać:** `gra/src/**`, `gra/data/**`, `gra-robocza/**`, `gra-kanon/**`,
`dyspozycje/abc-turniej/**` (tam leżą projekty ABC czekające na właściciela).

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. NIE uruchamiać
żadnego ze skryptów promocji. Zakaz `npx`, zakaz `git add -A`. Commituj cząstkowe postępy.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: Opus 5 High dla wszystkich trzech ról. `opts.model` jawnie (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–5 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
