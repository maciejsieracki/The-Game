# R-WEB-TEST-DEBT-WARS-PINS-Q1 — trzy czerwone testy wojen/pokoju na main: przepięcie przestarzałych pinów wg decyzji właściciela

DOMAIN: GAME (dług testowy w obszarze wojen; testy tylko) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 8c8e98dd4bfdadf9a77dcea24fa1c7ca312b15a1. Bez deployu (zmiany tylko w gra/tools).

## Kontekst
W obszarze wojen, który właśnie zmieniamy (FALE 906–909), trzy testy są czerwone na main od dawna (potwierdzone na bazach 18eefa311 i 60986fe85, zgłaszane przez Evaluatorów jako pre-existing): 
(1) gra/tools/forced-war-iron-test.cjs — 2 FAIL (53/2), asercje „sojusz blokuje wojnę Żelaza” — decyzja właściciela 2026-11-22 (R-WOJNA-EPOKA-SOJUSZ-NIE-BLOKUJE-Q1, FALA 891): sojusz formalny NIE blokuje wojny epoki, tylko preferencja pary bez sojuszu (gra/src/game/war-rules-multiwar.ts isWarTreatyBlocked, forced-war-common.ts assignForcedWarPairings);
(2) gra/tools/era-war-bronze-player-target-test.cjs — asercja S5 (sojusz) z tego samego powodu;
(3) gra/tools/diplo-forced-peace-pending-test.cjs — r2-3 (1 FAIL z 40, regex na main.ts, pada na bazie).
## Zadanie
Dla każdego: ustal przyczynę (stary pin vs błąd gry; zacytuj regułę/decyzję i commit zmieniający regułę: git log -S), przepisz asercję na AKTUALNĄ regułę (np. „sojusz NIE blokuje wojny epoki; para bez sojuszu jest preferowana”) albo, jeśli to błąd gry, NIE naprawiaj — zgłoś (kandydat R-WEB-*) i zostaw test czerwony z opisem. Każda zmiana z mutacją (przywrócenie starej reguły w kopii → test czerwony) i uzasadnieniem w raporcie (lista plik:linia przed/po). Zakaz osłabiania: asercja musi pinować nową regułę równie ściśle.
## Allowlista
gra/tools/forced-war-iron-test.cjs, gra/tools/era-war-bronze-player-target-test.cjs, gra/tools/diplo-forced-peace-pending-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-WARS-PINS-Q1/**.
## Zakazy
gra/src, gra/data, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie.
## Bramki
tsc 0; trzy testy zielone (albo uczciwie czerwone z kandydatem BŁĄD-GRY); war-rules-multiwar-main-guard 21/0; forced-war bronze/stone/iron main-guard (22/15/36); era-war-end-like-classic 17/0; era-war-start-at-entry 32/0; wszystkie gra/tools/*forced-war*test.cjs i *era-war*test.cjs bez live (porównaj z bazą — brak nowych czerwonych). Zacommituj i zwróć SHA.
## Binarne kryterium
Każdy z 3 testów: zielony z asercją pinującą aktualną regułę i mutacją czerwoną, albo opisany jako błąd gry z minimalnym odtworzeniem; brak nowych czerwonych testów w rodzinie wojen.
