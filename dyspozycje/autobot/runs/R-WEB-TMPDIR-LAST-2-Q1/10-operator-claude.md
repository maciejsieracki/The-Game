STATUS: PASS
DOMAIN: INFRA
TEMAT: R-WEB-TMPDIR-LAST-2-Q1
GOAL: Usunac dwa ostatnie trafienia bramki unikalnych nazw tmp (po Q15), tak by bramka tools/bramki-tmpdir-unikalnosc-test.cjs dala PASS=3 FAIL=0, bez zmiany zachowania testow.
ZMIANY/COMMIT: baza 7fb6e24a363c58e2af4288a3724274d367f36fb2 (origin/main). Zmienione pliki (allowlista):
  - gra/tools/resource-ledger-realpath-mutation-test.cjs: linia ~64 (cleanupOrphans) `const tmp = require('os').tmpdir();` -> `path.resolve(require('os').tmpdir())` z komentarzem (tylko odczyt katalogu, filtr po wzorcu z pidem; zachowanie odzysku bez zmian: nadpisanie main.ts TYLKO gdy == zapisana zmutowana wersja).
  - gra/tools/save-load-deserialize-fields-audit.cjs: linia 52 OUT_DIR `RUN_ID + '-evidence'` -> `RUN_ID + '-evidence-' + TMPDIR_RUN_ID` (require('./_tmp-unique.cjs')).
  - dyspozycje/autobot/runs/R-WEB-TMPDIR-LAST-2-Q1/ (raport + dowody).
  Brak zmian w gra/src, gra/data, WERSJE.md, manifescie, rust-port.
  SHA: patrz pole sha w odpowiedzi (commit z kodem i raportem).
TESTY:
  - bramki-tmpdir-unikalnosc-test.cjs: PRZED (base 7fb6e24a3): PASS=2 FAIL=1 (R2 realpath:64, R3 audit:52). PO: PASS=3 FAIL=0 (zmierzone dwukrotnie).
  - tsc --noEmit: exit 0 (wynik bez bledow).
  - logic-test.cjs: "LOGIC OK (213/213)" exit 0.
  - ai-test.cjs: "ai-test: 297 passed, 0 failed" exit 0.
  - save-load-deserialize-fields-audit.cjs --dist /tmp/R-WEB-TMPDIR-LAST-2-Q1-dist-h1Cm/dist (bundle vite --outDir poza repo, build exit 0, 25.29 s): exit 0, "WYNIK: ZIELONY", dowod: runs/R-WEB-TMPDIR-LAST-2-Q1/audit-evidence.json (kopia dowodu z tego przebiegu). Przeglarka: google-chrome (/usr/bin/google-chrome).
  - Ubicie w realpath-mutation (SIGKILL rodzica w trakcie mutacji m01, timeout -s KILL 15 s): main.ts zmutowany (hash 904a4f5e != HEAD af7ec00d), zostaly kopie civ-ledger-mut-backup-30504-41f46c38.ts i civ-ledger-mut-applied-30504-41f46c38.ts. Nastepny przebieg: "[recover] przywrocono main.ts z osieroconej kopii ... (pid 30504 martwy)", potem MUTACJE zabite=1, przezyly/bledy=0; po przebiegu main.ts hash == HEAD (af7ec00d6b2e26c00e73b7d261d0b4d7bb227b62), brak kopii backup/applied w /tmp. Odzysk dziala.
    UWAGA: nie ubito dziecka vite bezposrednio przez PID (kill rodzica, nie dziecka); w tym przebiegu nie wykryto osieroconego procesu vite (pgrep po "vite|civ-ledger-mut" pusty). NIE ZMIERZONO: scenariusz "ubicie samego dziecka vite" z dispatchu.
  - Mutacja "stala nazwa -> bramka czerwona": zmierzona posrednio. Bazowy kod (stala nazwa w obu plikach) daje FAIL=1 z tymi samymi trafieniami R2/R3 (wynik z pierwszego przebiegu bramki). Nie wykonano osobnej mutacji przywracajacej stala nazwe po poprawce.
  - Dowody sprzatane: bundle /tmp/R-WEB-TMPDIR-LAST-2-Q1-dist-h1Cm usunieto po zakonczeniu (patrz ponizej).
BLOKADY: brak. Nie zmierzono (patrz wyzej): bezposrednie ubicie dziecka vite przez PID; osobna mutacja z przywroceniem stalej nazwy.
RUNDY: 1/5
NASTEPNY KROK: Final Control: przeglad diffu obu plikow narzedziowych, ponowne uruchomienie bramki tmpdir (PASS=3) i realpath-kill z ubiciem dziecka vite (PID dziecka), jesli wymagane przez FC.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
  - Wynik audytu tmpdir: w tools/save-load-deserialize-fields-audit.cjs domyslny katalog dowodow jest teraz unikalny per przebieg (RUN_ID + '-evidence-<pid>-<hex>'); stare dowody pod stala nazwa nie beda nadpisywane.
  - W worktree zainstalowano gra/node_modules (npm ci) do bramek; przed zakonczeniem usuwane.
