STATUS: PASS
DOMAIN: GAME
ROLE: Operator
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
RUN: attempt-20260913
GOAL: Audyt 15 cywilizacji, rozdział nazw stolic od nazw państw-miast oraz naprawa potwierdzonej ścieżki fallback bez puli.
BASE HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
HEAD: 0b95694b73c429d01d8b65942235f2863947f986
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs
PROFILE: the-game-bugs
PROVIDER: openai-codex
MODEL: gpt-5.6-luna
ALLOWLIST:
- gra/data/civs.json
- gra/data/city-names-pools.json (audyt bez zmiany)
- gra/src/game/city-names-pool.ts (audyt bez zmiany)
- gra/src/game/civ-names.ts
- gra/src/game/display-names.ts (audyt bez zmiany)
- gra/tools/civ-names-test.cjs
- dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/**

CHANGES:
- Potwierdzona wada: `playerStartCityName()` i `foreignCapitalCityName()` bez argumentu `pools` czytały `nazwyKlastra[0]`, czyli pierwszą nazwę z puli państw-miast. Dla Greków dawało to `Sykion` zamiast `Ateny`; analogicznie Chińczycy dostawali `Qin` zamiast `Xi'an`.
- `gra/src/game/civ-names.ts:49-53,62-74,101-113` dodaje odczyt `nazwyMiast[0]` na tej ścieżce, pozostawiając fallback do `nazwyKlastra[0]` tylko dla niekompletnego eksportu legacy.
- `gra/data/civs.json:2248-2250,2414-2417` synchronizuje lustro regularnych nazw Asyrii (`Aszur`, `Ninive`) i Fenicjan (`Byblos`, `Sydon`, `Tyr`) z pulą kanoniczną.
- `gra/tools/civ-names-test.cjs` jest jednym ukierunkowanym testem regresyjnym: sprawdza pełne lustro oraz oba fallbacki stolicy dla wszystkich 15 cywilizacji, a także zachowanie nazw rywali.
- Nie zmieniono `city-names-pools.json`, generatora puli ani `display-names.ts`.

AUDYT PUL (skrypt; n/e/d = elementy/puste/duplikaty w jednej liście; kolizja = MC∩MP w tej samej cywilizacji):
ID          | Cywilizacja | miasta_cywilizacji | miasta_panstwa | MC∩MP | nazwyMiast | lustro MC
------------|--------------|--------------------|-----------------|-------|------------|----------
grecy       | Grecy        | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
rzymianie   | Rzymianie    | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
chinczycy   | Chińczycy    | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
inkowie     | Inkowie      | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
zulusi      | Zulusi       | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
egipt       | Egipt        | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
sumer       | Sumerowie    | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
celtowie    | Celtowie     | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
germanie    | Germanie     | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
harappa     | Harappa      | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
hetyci      | Hetyci       | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
slowianie   | Słowianie    | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
babilonia   | Babilonia    | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
asyria      | Asyria       | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK
fenicjanie  | Fenicjanie   | 100/0/0            | 10/0/0         | 0     | 100/0/0    | TAK

Nazwy cywilizacji są osobnym skalarem `Cywilizacja`: 15 wpisów, 0 pustych, 0 duplikatów; `ikonaId`: 15 wpisów, 0 pustych, 0 duplikatów. Globalnie MC ma 1500 slotów, 1381 nazw unikalnych, 94 powtarzające się nazwy (119 powtórzeń); MP ma 150/150/0. Globalne przecięcie MC×MP to 3 nazwy (`Bit-Jakin`, `Bit-Dakkuri`, `Bit-Amukani`), wszystkie `asyria:MC` × `babilonia:MP`; nie są to kolizje w obrębie jednej cywilizacji i nie zostały usuwane bez kontraktu.

PRZEPŁYW GRECY:
- `gra/src/data/loader.ts:19,421` ładuje `city-names-pools.json` jako `data.cityNamesPools`; `civs.json` dostarcza `ikonaId=grecy`, `Cywilizacja=Grecy` i lustro `nazwyMiast`.
- `gra/src/map/cluster-spawn.ts:227,410` przekazuje pule do `playerStartCityName`; `:354` przekazuje je do `foreignCapitalCityName`; `:357-358` przekazuje je do `clusterRivalCityName`.
- Kanoniczne źródło stolicy to `miasta_cywilizacji[0]=Ateny`; nazwy państw-miast pozostają osobną listą, z `miasta_panstwa[0]=Sykion`, a rywale testowo dają `Fliunt`, `Trojzena`, `Maroneja` dla obsługiwanych indeksów.
- `city-names-pool.ts:94-97,159-162` wybiera kapitał z MC; `:105-142` wybiera rywali z MP; `:213-258` obsługuje kolejne miasta, sugestię gracza i founding AI z MC oraz sufiks po wyczerpaniu.
- Bez puli `civ-names.ts:62-74,101-113` czyta `nazwyMiast[0]`, a `:76-91` utrzymuje rywali na `nazwyKlastra`. `:126-130` czyta wyłącznie nazwę cywilizacji `Grecy`.

TESTY/DOWODY:
- Przed poprawką test regresyjny no-pool zakończył się exit 1, reprodukując pomieszanie MC z MP.
- `nazwy-miast-rozlaczne-pule-test.cjs`: 9 passed, 0 failed.
- `city-names-pool-test.cjs`: 12 passed, 0 failed.
- `city-names-pools-test.cjs`: 6 passed, 0 failed.
- `civ-names-test.cjs`: 66 passed, 0 failed.
- `display-names-test.cjs`: 27 passed, 0 failed.
- `mapa-etykieta-stolicy-test.cjs`: 47 passed, 0 failed.
- `tsc --noEmit`: exit 0; użyto czasowego symlinku do istniejących lokalnych zależności, bez instalacji, następnie symlink usunięto.
- `git diff --check`: PASS.
- `gra` build/dev: NIE WYKONANO — procedura repozytorium zakazuje `npm run build`/`npm run dev` w `gra/`; dostępny typecheck przeszedł.

ZMIANY/COMMIT: brak nowego commitu; zmiany są w bieżącym worktree, zgodnie z zakazem integracji/push.
BLOKADY: brak blokady produktu lub INFRA.
RUNDY: 2/5 bieżącej rundy operatora.
NASTĘPNY KROK: Evaluator czyta ten worktree, niezależnie sprawdza raport, diff, testy oraz pełne liczniki; potem kieruje do Obrony/Final Control.
DEPLOY/PUSH/PR/MERGE: NIE WYKONANO

ARTEFAKTY:
- `01-operator-evidence.md` — pełne komendy i wyniki audytu.
- `progress.json` — stan próby.
- `journal.md` — dziennik operatora.
REPORT SHA256: b287d881a8bfea08b56b8cb20a3d7418a3a79d8bf9b969581504bcd2194d0d24
EVIDENCE SHA256: c05c9d2bdc8829e06bc2b447a57bdf74e42bd38a6dc60a7ef158ad51055d21db
PROGRESS SHA256: ffc8d26674f74edab64b55e38791b1efa27678ba0d0a5f989477832ca1fad930
JOURNAL SHA256: 8fdb869f49c729001e2b3c54e502ab23ef23818b66832488358d9abf27eb0036
REPORT HASH CONVENTION: `REPORT SHA256` is SHA-256 of this file with literal `<REPORT_SHA256>` retained.
TRANSITION RECEIPT: `transition-receipt.json` in this attempt directory.
