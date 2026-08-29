# 03 — FINAL CONTROL (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`
MODEL+EFFORT: Opus 5, effort high

GOAL: usunąć z panelu trybu budowy zdublowany blok **warstwy (a)**
(`CityPodzialPracy.procentBudynki`) i udostępnić tam **warstwę (c)**
(`UlepszeniaEmpirePolicy.pracaAutoPercent` / `City.ulepszeniaPracaPercent`) niezależnie
od trybu. Zgodny co do zdania z `00-dispatch.md`; ID i licznik rund (1/5) identyczne
u Operatora i Evaluatora — brak cichego resetu (§16b poz. 1, 2, 5).

ZMIANY/COMMIT: worktree `/home/user/wt-fc-warstwa` (detached), baza `420d4b22`,
`git merge-base origin/main HEAD` = `136e664c` (§9 poz. 9). 9 plików, wszystkie
w allowliście: `gra/src/ui/buildModeHud.ts`, `gra/src/main.ts` (13 linii, tylko
podpięcie kontraktu), 5× `gra/tools/*`, 2 raporty runu. `empireDetailPanel.ts`,
`cityPanel.ts`, `gra/data/**`, `WERSJE.md`, `gra-robocza/**` — 0 linii.
`git diff --check` czysty, zero sekretów. Próbny merge do aktualnego `origin/main`
(`0ad2c20a`): `git merge-tree --write-tree` → drzewo `f2708177`, **0 konfliktów**;
`origin/main` od merge-base ruszył wyłącznie 4 pliki `00-dispatch.md` — zero kolizji.

TESTY (uruchomione moją ręką w moim worktree): tsc 0 · logic 213/213 ·
tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 · kontrakt 637/0 ·
real-render 37/0 · ai-zakup 44/0 · scroll 43/0 · dyplo 26/26 · cap-migracja 11/0 ·
praca-split-ui 25/0 · slider-max 13/0 · żelazo-zrzuty **61/0** (`--out
/tmp/civ-shots-fc-zelazo`, bez `--no-shots`) · nowa bramka tematu 28/0 ·
vite build `/tmp/civ-dist-fc` OK (forma C-001).

## Trzeci, niezależny ogląd — panel w żywym Chromium, oczami właściciela

Własny harness (scratchpad, repo nietknięte), geometria **produkcyjna**: `position:fixed`,
270 px, `overflow-y:auto`, **bez** nadpisania `style.cssText`, lista typów niepusta,
dwa miasta. Zrzuty: `/tmp/civ-shots-fc-warstwa/FC-reczny.png`, `FC-auto.png`
oraz kadry ×3 `ZOOM-reczny.png`, `ZOOM-auto.png` — **obejrzane, nie tylko zapisane**.

- **Czy widać wybór trybu?** TAK: rząd `Żywność · Surowce · Infra · Zrówn. · Ręczny`
  pod nagłówkiem „Automatyzacja ulepszeń terenu", aktywny podświetlony.
- **Czy widać procent na pracę automatyczną?** TAK, **w obu trybach**. Suwak
  **warstwy (c)** (`pracaAutoPercent`) w prostokącie panelu, `max=100`,
  **topmost w `elementFromPoint`**.
- **Czy etykieta mówi, czym ten procent JEST, bez czytania kodu?** TAK:
  „Z puli imperium na pracę automatyczną: 33%".
- **Czy zniknął mylący blok warstwy (a)?** TAK: 0 wystąpień markupu
  (`civ-build-global-split` / `data-praca-empire-split` / `data-praca-split-scope`),
  a słowa „Podział Pracy" i „Budynki" **nie występują w tekście panelu w ogóle**.
- **Sprawdzenie odwrotne realną myszą:** `tryb:'auto'` — klik zapisuje (82);
  `tryb:'reczny'` — ten sam klik **nie zapisuje nic** (pole martwe, nie tylko wyszarzone).
  To samo dla lokalnego pola warstwy (c) (`City.ulepszeniaPracaPercent`) przy override.
  Zero błędów konsoli/pageerror.

Cztery zaktualizowane bramki sprawdzone plik po pliku: każda ma przy asercji zapis
„co pilnowała / dlaczego przestało być prawdą / co pilnuje teraz", kontrolę negatywną
na mutancie, i żadna nie jest wyłączona ani rozluźniona (bilans 634→637, 36→37, 11→13).
Zgłoszenie §13a Operatora (fałszywie zielona asercja `:156` trafiająca w komentarz)
potwierdzam — poprawka liczy na źródle ze zdjętymi komentarzami.

## Ocena uwag Evaluatora wobec §3b

Wszystkie trzy są **kosmetyczne** — żadna nie dotyka GOAL, dowodu, zakresu, granic §9
ani gotowości do integracji:

1. `main.ts:4808 procentPuliImperiumForOwner()` — **potwierdzam martwe** (jedyne
   wystąpienia: definicja `:4808` i import `:192`; zero wywołań). Poza allowlistą
   tematu (`main.ts` tylko `~:19352-19359`) — słusznie nietknięte.
2. `main.ts:19391` — **potwierdzam**: komentarz nad handlerem warstwy (c) nazywa ją
   „pole (b)". Sam komentarz, bez wpływu na zachowanie; poza allowlistą.
3. Asercja kontraktu jako regex po źródle — **odtworzyłem dowód behawioralny
   niezależnie** (hit-test i realna mysz wyżej), więc to uwaga o sile asercji,
   nie luka w dowodzie.

**Znalezisko własne (nowe, do tej samej listy):** przy włączonym „Własne ustawienia
tego miasta" nad suwakiem **warstwy (c)** miasta stoi nagłówek „Ustawienia miasta —
**lokalny split**" i nota „…nie zmienia globalnego **podziału całej puli Pracy
imperium**" (`buildModeHud.ts:605-607`). Tekst jest **prawdziwy** i nie renderuje
warstwy (a), ale używa słownika warstwy (a) tuż nad polem warstwy (c) — dokładnie
tego skojarzenia, które wywołało zgłoszenie. Sekcja jest opt-in (nie widać jej na
domyślnym ekranie ze zrzutu właściciela), tekst jest sprzed tego tematu
(`7db10f23`), a dispatch p.3 celował w nazwy `getEmpirePracaSplit*`, nie w ten
nagłówek — dlatego **kosmetyczne, nie odesłanie**.

**Drugie znalezisko własne:** w `tryb:'auto'` nic na ekranie nie mówi, co dzieje się
z resztą (67%) — „reszta puli zostaje na prace ręczne" żyje tylko w tooltipie
(`title`). W trybie ręcznym nota to mówi wprost. Zdanie właściciela ma dwie połowy
(„ile ma iść do automatycznej pracy, a ile ma być zostawione w puli na inne prace
ręczne") — druga połowa jest w trybie auto niewidoczna bez najechania myszą.
Kryterium twarde dispatchu („etykieta musi rozróżniać warstwę (c) od (a) bez czytania
kodu") jest spełnione, więc **kosmetyczne** — ale warte osobnego wpisu.

## BLOKADA PROCEDURALNA (§16b poz. 4 i 6) — do wykonania przez orkiestratora

`R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1` **nie ma żadnego wpisu**
w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (sprawdzone `grep` po ID i po słowach —
0 trafień), a cztery uwagi kosmetyczne wyżej **nie są zapisane jako osobny temat**.
§3b mówi wprost: `PASS-WITH-NOTES` kończy proces wyłącznie wtedy, gdy uwagi kosmetyczne
zostały zapisane w rejestrze. Rejestr jest **poza allowlistą tego tematu**, więc nie jest
to zadanie dla Operatora ani dla mnie — to krok integracji. Bez niego nie wolno
wystawić `READY_FOR_DEPLOY`.

BLOKADY: brak technicznych. Jedna proceduralna, wyżej — wpis do rejestru przy integracji.
Save/load bez zmiany schematu (żadne pole nie zmienia nazwy ani zakresu); parytet
gracz/AI/MP nietknięty (zmiana wyłącznie w warstwie UI panelu gracza).

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, `git merge --no-ff` od
merge-base `136e664c`) **plus** wpis do `REJESTR-PROSB-I-ZADAN.md`: status tematu
+ 4 uwagi kosmetyczne jako osobne pozycje. Dopiero potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO (wypchnięta wyłącznie gałąź tematu).

**GOTOWOŚĆ DO INTEGRACJI: TAK** — GOAL osiągnięty i sprawdzony trzecią, niezależną ręką
w żywym Chromium w obu trybach; allowlista, granice §9 i próbny merge czyste; wszystkie
bramki zielone. Warunek jedyny i wykonywany przez orkiestratora w kroku integracji:
dopisanie tematu i czterech uwag kosmetycznych do `REJESTR-PROSB-I-ZADAN.md` (§3b, §16b poz. 4 i 6).
