# R-WEB-TMPDIR-LAST-2-Q1 — dwa ostatnie trafienia bramki unikalnych nazw tmp (po Q15)

DOMAIN: INFRA (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 7fb6e24a363c58e2af4288a3724274d367f36fb2. Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst
bramki-tmpdir-unikalnosc-test.cjs: PASS=2 FAIL=1, 2 trafienia stałej nazwy pod os.tmpdir(): gra/tools/resource-ledger-realpath-mutation-test.cjs:64 (kopie civ-ledger-mut-backup-* wprowadzone w Q15: przywracanie po SIGTERM/SIGKILL i sprzątanie osieroconych po martwym pid) i gra/tools/save-load-deserialize-fields-audit.cjs:52. Przed Q15 bramka miała 0 trafień (FALA TMPDIR, main 7249e6b0c).
## Zadanie
Napraw OBA trafienia tak, by bramka dała PASS=3 FAIL=0, bez zmiany zachowania testów: nazwa zawiera unikalny znacznik (wzorzec jak w gra/tools/_tmp-unique.cjs), a zachowanie odzyskiwania po ubiciu w realpath-mutation pozostaje poprawne (odzysk po SIGKILL szuka kopii po wzorcu glob, nie po stałej nazwie; odzysk nadpisuje main.ts TYLKO gdy plik == zapisana zmutowana wersja — zachowaj). Dowody: bramka tmpdir PASS=3; realpath: ubicie dziecka vite (PID dziecka) → md5 main.ts == HEAD, brak kopii w /tmp; save-load-deserialize-fields-audit z --dist (bundle vite --outDir poza repo) exit 0. Mutacja: przywrócenie stałej nazwy → bramka czerwona.
## Allowlista
gra/tools/resource-ledger-realpath-mutation-test.cjs, gra/tools/save-load-deserialize-fields-audit.cjs, dyspozycje/autobot/runs/R-WEB-TMPDIR-LAST-2-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (bundle: vite --outDir poza repo), zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Jeden Chromium naraz; po pracy zabij WŁASNE procesy po PID; usuń bundle/logi/node_modules z /tmp; przywróć śledzone pliki zmienione przez test (git checkout -- ścieżka). Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0; bramki-tmpdir-unikalnosc PASS=3. Zacommituj i zwróć SHA.
## Binarne kryterium
bramka tmpdir zielona (0 trafień); dowody ubicia i audytu z --dist; mutacja czerwona; bramki zielone.
