# R-WEB-TEST-DEBT-Q14-D1B — ai4-popyt-obywatele-test (17 FAIL, STARY-PIN Q2)

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main (cand z args; FALA 893). Bez deployu.

## Kontekst
Z raportu FC Q14-D1: gra/tools/ai4-popyt-obywatele-test.cjs ma 17 FAIL; STARY-PIN przełączników Q2 usuniętych 2026-11-04 (nieprzepisany), dodatkowo kandydaci BŁĄD-GRY Z1h/infrastruktura i Z2d (wyjątek złożowy). Raport D1: dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1/10-operator-claude.md (git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:...).

## Zadanie
Dla każdego z 17 FAIL: pierwsza linia FAIL, przyczyna z dowodem (git log -S na pinowanej wartości/przełączniku; decyzje w dyspozycje/autobot/KOLEJKA-WEB.md i REJESTR-PROSB-I-ZADAN.md), klasyfikacja STARY-PIN (przepisz do obowiązującej reguły, komentarz 'R-WEB-TEST-DEBT-Q14' + commit, asercji NIE osłabiaj; pokaż mutację czerwoną na bieżącym kodzie) / HARNESS / BŁĄD-GRY (tylko z minimalnym odtworzeniem i cytatem obowiązującej reguły; test zostaje czerwony) / NIE-ZMIERZONO (tylko po wyczerpaniu dowodu). Paczki po 5, commit po każdej. ZAKAZ BLOCK bez blokady technicznej.

## Allowlista
gra/tools/ai4-popyt-obywatele-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1B/**.
## Zakazy
gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev, zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki (zawieszanie >120 s — zawężaj do gra/src gra/data). Dysk ≥ 4 GB; po bramkach usuń node_modules.
## Bramki
tsc --noEmit 0; logic 213; tech-tree 20; research 33; unit-replace 21; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN. Zacommituj i zwróć SHA.
## Binarne kryterium
Każdy z 17 FAIL ma klasyfikację z dowodem; naprawione grupy zielone solo (surowe wyjście); asercje nie osłabione; bramki zielone.
