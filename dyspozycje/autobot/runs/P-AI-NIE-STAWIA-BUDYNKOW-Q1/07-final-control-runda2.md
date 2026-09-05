# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Final Control, RUNDA 2

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: sędzia §3c — werdykt per zarzut do 3 par rundy 2, na wytworze, nie na raportach
ZMIANY/COMMIT: ten raport. Oceniane `9d031c77` + `9d44d235`; HEAD `07abb203`, baza
`05df297a`. Diff vs baza (`main.ts`, `empire-city-defaults.ts`, bramka, `runs/<ID>/**`)
w całości w allowliście; `ai.ts`, `owner-utils.ts`, `cities.ts`, `auto-manage.ts`
NIETKNIĘTE na całej gałęzi. (`empire-city-defaults.ts` w R2 ruszony celowo — mieszka tam
linia zarządzona w Decyzji 1; plik jest w allowliście.)
MODEL+EFFORT: Sonnet 5, effort high
RUNDY: 2/5 — R1→obrona→R2→obrona, licznik bez resetu, ID to samo we wszystkich rundach
TESTY (uruchomione samodzielnie): `tsc --noEmit` 0 błędów · `ai-buduje-budynki-test`
**42/42**; FIX 12/7/0/1 pokrycie **5/5**, MUT-A 4/1/0/0 pokrycie **2/9**, MUT-B 12/7/**1**/1
— co do jednego jak przed dołożeniem haka · referencyjne 213/213, 19/19, 33/33, 13/13, 6/6 ·
empire-city-defaults 53/0, auto-manage 45/45, barb-city-behavior 178/0,
barb-city-owner-contract 3/3 · `git diff --check` exit 0 · parytet po cofnięciu obu plików
do bazy: 287/8, 21/1, 92/1 — IDENTYCZNIE jak na HEAD, dług przed-istniejący. Drzewo
przywrócone, `git status --porcelain` pusty.
BLOKADY: brak
NASTĘPNY KROK: integracja allowlist-only ręką orkiestratora
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

**1 → ODDAL.** Nośnik usunięty realnie. `main.ts:4826-4838` nazywa dziś SEED poprawnie,
a kod to potwierdza: `:4803` woła `freshOwnerDefaultBudowaProfilForOwner(0, …)`, która dla
`ownerId >= 0` zwraca `AI_DEFAULT_BUDOWA_TRYB`. Własny `grep` po `gra/src/` — zero
pozostałych komentarzy twierdzących nieprawdę.

**2 → ODDAL.** Wnioskowanie zastąpione pomiarem. A4d/A4d-b/A4e czytają wprost
`ownerDefaultBudowaProfil` przez nowe, **wyłącznie odczytowe** pole `dumpBuildings()`,
użyte tylko na istniejących snapshotach `t0`/`tLoad` — zero dodatkowych przejęć, świat
nietknięty (dowód z kodu, niezależny od zgodności tabeli). Nietautologiczność sprawdziłem
**własną mutacją innym nośnikiem niż MUT-A/B/C bramki** (stała `AI_DEFAULT_BUDOWA_TRYB`
→ `'reczny'`, osobny build + Chromium): A4, A4d, A4d-b, A7 i A10 czerwienieją.

**3 → ODDAL.** `git diff --check` baza→HEAD: exit 0, zero trafień.

## BRAMKA JEST WERYFIKATOREM, NIE DEKORACJĄ

Mierzy wzrost `cityBuilt` w PRAWDZIWEJ pętli: realny `vite build` (C-001, `--outDir` poza
repo), realny Chromium, realne `doStartGame`/`endTurn()`, realny
`buildSaveGameSnapshot`→`restoreGameFromSave`, realne `captureViaBattle`; `dumpBuildings()`
czyta żywą mapę `cityBuilt`. Zero reimplementacji.

Po mojej mutacji bramka wskazuje palcem objaw właściciela: pokrycie 2/9 i nazwane miasta
dwóch cywilizacji trzymane 16-45 tur z ZEREM budynków (Machu Picchu, Sparta, Korynt,
Teby, Argos i dwa dalsze), wszystkie `tryb:'reczny'`. Istotne: A1/A2 (sumy imperium) zostały
ZIELONE — AI ma drugą drogę do kolejki. **Defekt łapie wyłącznie A7 (pokrycie per miasto)**
i to ona jest sednem bramki.

## DWIE ŚCIEŻKI I GWARANCJA BARBARZYŃSKA — sprawdzone osobno

SEED: gracz dostaje AUTO (`main.ts:4803`) — ECHO „gracz też startowo auto". ✔
MIGRACJA: `if (oid === 0) continue;` (`empire-city-defaults.ts:448`) — gracz zachowuje
`'reczny'`, AI i PM podnoszone; M7/M7b dowodzą, że A10 wisi na tej jednej linii. ✔
Ścieżek nie pomylono. Gwarancja barbarzyńska ma DWA nośniki (`:396` seed, `:446` migracja);
MUT-B zdejmuje OBA (sanity blokuje bieg przy zniknięciu kotwicy), M4/M5 zielone, a pod moją
mutacją A3 pozostała zielona. ✔

## POZA WERDYKTAMI (do rejestru, nie do naprawy tutaj)

1. Klauzula ownerów ujemnych w A4d-b jest **pusto-prawdziwa**: mapa w turze 0 to `[[0..11]]`,
   zero ownerów ujemnych. Nic nie osłabia (gwarancji pilnują A3/A3b/A3c + M4/M5, A4e na
   `tLoad` jest niepusta), ale opis „pomiar OBU nośników" jest tu na wyrost. Osobny temat.
2. Bramki NIE MA w tabeli §6 `R-PROC-AUTOBOT.md`. Właściciel żądał TRWAŁEGO weryfikatora, a
   niezarejestrowana bramka bywa zapominana (wzorzec `mgla-sciezka-inwariant`). Operator nie
   mógł tego zrobić (`docs/decyzje/**` zakazane, domena PROCESS, §9 pkt 4) — osobny temat.
3. `REJESTR-PROSB-I-ZADAN.md:4571` wciąż mówi „ZAREJESTROWANE, NIE DISPATCHOWANE" — do
   aktualizacji przy integracji (§16b pkt 6), poza allowlistą Operatora.

Trzy rozstrzygnięcia właściciela przyjąłem jako wiążące i nie zgłaszam ich jako defektów.

AGREGAT: zero `NAPRAW`, zero `DO DECYZJI CZŁOWIEKA`, trzy `ODDAL` → **PASS**.
