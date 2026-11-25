# R-WEB-HUD-ME-MIGRATION-Q1 — dokończyć migrację literału 0 → ME() w HUD (2 linie)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main (cand z args; FALA 893). Wdrożenie jako FALA 894 po FC (zmiana gra/src).

## Kontekst
Q14-B ujawnił (hud-moc-warstwa-test 26/2 po zaostrzeniu wzorca tylko ME()): gra/src/main.ts:3140 (objectiveRespektPctTowardEffective: objectivePowerForOwnerEffective(0)) i main.ts:24044 (buildHudState: const power = objectivePowerForOwnerEffective(0)) używają literału 0 zamiast ME() — pozostałość migracji hotseat. W grze 1-graczowej ME()=0, więc zmiana jest semantycznie neutralna; w hotseat HUD/respekt pokazują moc właściciela 0 zamiast aktywnego gracza.
## Zadanie
Zamień literał 0 na ME() w obu miejscach (sprawdź też sąsiednie wystąpienia objectivePowerForOwnerEffective(0) i obliczenia respektu w tym samym bloku — grep po main.ts; zmieniaj tylko te, które są podstawieniem gracza aktywnego, każde uzasadnij w raporcie). hud-moc-warstwa-test ma być 28/0 BEZ zmiany asercji (wzorzec tylko ME()). Dodaj test strażnika w gra/tools/ (np. hud-me-literal-zero-test.cjs): fail, gdy w main.ts w tych funkcjach wystąpi objectivePowerForOwnerEffective(0); pokaż mutację (przywrócenie 0) → czerwony.
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-moc-warstwa-test.cjs (tylko jeśli konieczne, bez osłabiania), nowy gra/tools/hud-me-literal-zero-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-MIGRATION-Q1/**.
## Zakazy
jak w innych tematach web (gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev, git add -A, push, spawn/create_*/send_later, run_in_background); nie zmieniaj logiki gry poza podstawieniem ME(). Dysk ≥ 4 GB; po bramkach usuń node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace 21; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; moc-ranking-rozjazd 19/0; era-war-pairing 19/0; hotseat testy (hotseat-etap6d-podetap-e-source 77/0, granice 52/0). Zacommituj i zwróć SHA.
## Binarne kryterium
hud-moc-warstwa 28/0 bez zmiany asercji; nowy test czerwony na mutacji; bramki zielone; diff main.ts = podstawienia ME() z uzasadnieniem.
