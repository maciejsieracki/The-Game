# R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1 — domknięcie luk bramki unikalnych nazw tmp i asercji cluster-plan-name

DOMAIN: INFRA (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main a80b9bbfad91fc0740da6c8207ddf2ad86a4e1da. Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst (raport FC CLUSTERPLAN: runs/R-WEB-TEST-DEBT-CLUSTERPLAN-Q1/50-final-control-claude.md)
1. gra/tools/bramki-tmpdir-unikalnosc-test.cjs: luki — zapis stałej nazwy pod korzeniem tmp przechodzi (exit 0) w formach: template literal `${T}/stala` i `[T,'stala'].join('/')` (baza sprzed wyjątku odczytu flagowała każdy goły zapis).
2. gra/tools/cluster-plan-name-test.cjs: mutant rivalIndex+1→+2 w gra/src/game/cluster-spawn.ts nie jest wykrywany (6/0). Brak dowodu, czy clusterRivalFromPool zależy od wartości indeksu.
## Zadanie
1. Bramka: domknij obie formy (i pokrewne: konkatenacja przez .concat, path.resolve(T,'stala'), path.posix.join) tak, by zapis stałej nazwy = FAIL, odczyt readdir = dozwolony; samotest o nowe fixture'y (każda forma z asercją ≥1 trafienia + fixture odczytu bez trafienia); bramka na realnym drzewie bez fałszywych trafień (PASS).
2. cluster-plan-name: zbadaj w gra/src/game/cluster-spawn.ts, czy wartość rivalIndex wpływa na wynik clusterRivalFromPool (kod + eksperyment na kopii poza repo). Jeśli TAK — dopisz asercję, która wykrywa mutant +2 (mutacja czerwona). Jeśli NIE (indeks niezależny od wartości) — udokumentuj i oznacz mutant równoważny (nie wykrywalny z zasady), bez nowej asercji.
Commit po każdym punkcie. ZAKAZ BLOCK bez blokady technicznej.
## Allowlista
gra/tools/bramki-tmpdir-unikalnosc-test.cjs, gra/tools/cluster-plan-name-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data (mutacje tylko na kopii poza repo), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; usuń node_modules/logi z /tmp.
## Bramki
tsc 0; logic 213; ai-test 297/0; bramki-tmpdir PASS; cluster-plan-name 6/0 (lub więcej z nową asercją). Zacommituj i zwróć SHA.
## Binarne kryterium
Obie luki bramki dają FAIL w samoteście, bramka PASS na drzewie; mutant rivalIndex wykryty albo udokumentowany jako równoważny z dowodem; bramki zielone.
