STATUS: FAIL (częściowo: zakres 2 zrobiony i zmierzony; zakres 1 NIE domknięty w tej rundzie; zakres 3 bez zmian zgodnie z dispatchem)
DOMAIN: GAME (testy; bez zmian w gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q14-B
GOAL: Runda 3/5 — (1) przepisać dyplo-bilans runda2 (6 FAIL) i runda3 (17 FAIL) do reguły kierunkowej bramki pokoju (e253e64a6/e27418db7); (2) przepisać A3 w ai-ai-treaty-live-proof-wiring-test do dopłaty D przy SOJUSZU z mutacją czerwoną; (3) ai-army-composition-per-civ i hud-moc-warstwa nietknięte.
BAZA: 27a4680758b9fe7058ec06fdb326901e5fbdbabc (detach, worktree wf_0aba166e-f71-1). Operator HAIKU 5.5.

ZMIANY/COMMIT (allowlista):
- gra/tools/ai-ai-treaty-live-proof-wiring-test.cjs: A3 przepisana. Akceptuje dopłatę D AI↔AI zalogowaną przy SOJUSZU (linia "Sojusz … (pełny, bezterminowy), dopłata N ¤ od …") LUB przy NAP (opcjonalnie). Asercja A1, A2, A4 bez zmian; żadna asercja nie osłabiona (poprzednia wymagała wyłącznie NAP z dopłatą = STARY-PIN wobec FALI 892).
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-B/10-operator-claude.md (ten raport).
- Brak zmian w gra/src, gra/data, wiki, docs, gra/tools/dyplo-*, ai-army-composition-per-civ, hud-moc-warstwa, climate-band-test.

ZAKRES 2 — A3 (wynik zmierzony):
- Dane: istniejący przebieg live ziarno 4242, 60 tur (out2, wykonany w poprzedniej rundzie, resumed=false, endTurn=60, wallSec=246, pageerror 0). Ścieżka: .../scratchpad/q14b-live/out2/seed4242.{jsonl,wiring.log,events.log}.
- Analizator po zmianie (surowo): "Wiring ziarno 4242: wiersze=59, linie NAP=0, dopłaty(log)=0 ¤ ..." | "OK A1 (rows 59)" | "OK A2 (min 0, owner 22, negCount 0)" | "OK A3 dopłata D AI↔AI zalogowana ... {"nap":0,"napD":[],"sojusze":2,"sojuszD":[966,431],"dopl":2}" | "OK A4 []" | "Wynik: 4 OK / 0 FAIL", exit 0.
- MUTACJA (na kopii wyniku, bez zmiany kodu gry): z seed4242.wiring.log usunięto wszystkie fragmenty ", dopłata N ¤ od …" (sed). Wynik: "dopłata w mutancie: 0" | "FAIL A3 ... {"nap":0,"napD":[],"sojusze":2,"sojuszD":[0,0],"dopl":0}" | "Wynik: 3 OK / 1 FAIL", exit 1. Asercja jest czerwona bez dopłaty D.
- NIE ZMIERZONO: ŚWIEŻY przebieg live (dispatch: "rób świeży przebieg"). Nie zbudowano nowego bundle vite w tej rundzie (dist z poprzedniej rundy); analizator uruchomiony na wyniku z poprzedniej, wykonanej od zera sesji live (resumed=false). Mutacja wykonana na kopii logu, NIE przez usunięcie dopłaty z kodu toru (brak świeżego przebiegu live).
- Uwaga merytoryczna: w 60 turach tor zapisał 0 linii NAP AI↔AI; decyzja właściciela "NAP AI↔AI zostaje" nie została tu zweryfikowana w zachowaniu (NIE ZMIERZONO, czy NAP zawiera się w dłuższym przebiegu).

ZAKRES 1 — dyplo-bilans runda2 / runda3 (NIE DOMKNIĘTE w tej rundzie):
- Surowe wyniki na bazie 27a4680: runda2 = "PODSUMOWANIE: 18 PASS / 6 FAIL"; runda3 = "PODSUMOWANIE: 10 PASS / 17 FAIL". Test ma dwa pliki-mutacje (bundle esbuild z pluginem) — needle są zakotwiczone w kodzie sprzed e253e64a6/e27418db7.
- Klasyfikacja WSTĘPNA (bez przepisania asercji, bez mutacji wykonanej w tej rundzie):
  * runda2 (0e) — mutacja: oczekiwane 2, kod daje 1 (needle pola pwBalance w case 'pokoj'): HARNESS/needle.
  * runda2 (5-REGRESJA/PLAYER), (5-KONTROLA/PLAYER) — pin stanu e253e64a6 (bez bramki w obu kierunkach); rzeczywisty kod ma kierunkową bramkę (accepted:false, "Brakuje 554 PW") dla gracza-autora: STARY-PIN do re-pinu.
  * runda2 (6-setup) — brak fixtur dla 4 typów komend (oferuj_miasto_za_pokoj, zada_miasto_za_pokoj, zaproponuj_wymiane_cykliczna, zaproponuj_przemarsz): HARNESS (test-only).
  * runda2 (1-PRZED), (2-PRZED) — dowody błędu rundy 2 nie odtwarzalne na kodzie bieżącym (jak w obronie rundy 2): STARY-PIN historyczny do przepisania jako pin historyczny albo jawnego usunięcia.
  * runda3 (0a), (0b) — needle mutacji (FIXED_NEEDLE, PRE_R4_BLOCK, pluginSwap) nie pasują do bieżącego case 'pokoj' (ok. diplomacy-proposals.ts:1791 i :3027 w kodzie gry): HARNESS.
  * runda3 (1-PRZED-*), (2-PRZED-*) — kod rundy 2 jako punkt odniesienia; wartości (accepted:true przy ujemnym pwBalance) dają się czytać jako pin przed bramką: STARY-PIN/HARNESS (do przepisania na mutację kontrolną).
  * runda3 (1-PO-zla), (1-PO-bardzoDobra), (2-PO-zla), (2-PO-bardzoDobra), (3b-*) — oczekiwania rundy 4 (canAccept false/accepted true dla gracza-proponenta) rozjechane z regułą e27418db7 (kierunkowa: gracz-autor z pwBalance<0 -> accepted:false, AI-autor pomijany). Obecny wynik gracza-autora (accepted:false przy -554) ZGADZA się z regułą kierunkową; oczekiwanie w teście jest odwrotne: STARY-PIN.
  * runda3 (3c), (4a), (4b) — kontrole nietautologiczne i PROOF zależne od needle (jak wyżej): HARNESS/STARY-PIN.
- Nie wykonano: przepisania asercji, nowych wartości z powołaniem na commit, mutacji czerwonych na bieżącym kodzie, commitów paczek po 5 FAIL. Wymaga osobnego dispatchu Operatora z pełnym czasem na pliki dyplo-bilans-*-runda2/3-test.cjs (≈1150 linii, dwa bundle-plugin).
- BŁĄD-GRY: nie stwierdzono (wszystkie niezgodności klasyfikowane jako STARY-PIN/HARNESS wstępnie; kod gry nie zmieniany).

ZAKRES 3 — bez zmian (zgodnie z dispatchem):
- ai-army-composition-per-civ: DECYZJA_WŁAŚCICIELA, nie ruszane.
- hud-moc-warstwa: 26/2 (BŁĄD-GRY kandydat: literał 0 w gra/src main.ts:3140 i :24044; kod gry NIE zmieniany).

BRAMKI:
- npm ci w gra/ (worktree): wykonane, 71 pakietów.
- A3 analizator: 4 OK / 0 FAIL (exit 0) na wyniku live; mutacja: 3 OK / 1 FAIL (exit 1). Surowo powyżej.
- tsc --noEmit, logic-test, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing, ai-ai-alliance-surcharge: NIE PONOWIONO w tej rundzie — brak zmian w gra/src i gra/data; zmieniony jest wyłącznie plik testu live (A3). NIE ZMIERZONO w tej rundzie.
- dyplo runda2 18/6, runda3 10/17: bez zmian (zakres 1 nie wykonany).

BLOKADY:
- Zakres 1 (dyplo runda2/3): nie domknięty; wymaga osobnego dispatchu (patrz wyżej).
- ai-army-composition-per-civ: decyzja właściciela (ABC).
- hud-moc-warstwa: BŁĄD-GRY kandydat (R-WEB-HUD-ME-MIGRATION-Q1, poza tym tematem).

UWAGI-DLA-ORKIESTRATORA:
1. Dispatch wymagał świeżego przebiegu live dla A3; nie wykonano (brak nowego bundle w tej rundzie). Analizator uruchomiony na przebiegu z poprzedniej rundy. Jeśli owner wymaga świeżego dowodu, potrzebny osobny krok: build bundle poza repo + runner z --turns 60 --seed 4242.
2. Dyplo runda2/3 wymaga osobnego dispatchu Operatora (zakres pracy > jedna runda).
3. Brak nowych sesji/zadań tworzonych przez Operatora (zakaz respektowany).

TESTY (surowe):
- ai-ai-treaty-live-proof-wiring-test (analizator, wynik poprzedniej sesji live, po zmianie A3): "Wynik: 4 OK / 0 FAIL", exit 0.
- ai-ai-treaty-live-proof-wiring-test (mutacja bez dopłaty D na kopii logu): "Wynik: 3 OK / 1 FAIL", exit 1.
- dyplo-bilans-gate-n-e1-reprodukcja-runda2-test: "=== PODSUMOWANIE: 18 PASS / 6 FAIL ===" (bez zmian).
- dyplo-bilans-gate-n-e1-reprodukcja-runda3-test: "=== PODSUMOWANIE: 10 PASS / 17 FAIL ===" (bez zmian).

RUNDY: 3/5 (zakres 2 zrobiony; zakres 1 do osobnego dispatchu)
NASTĘPNY KROK: (a) osobny dispatch Operatora na dyplo runda2/3 (re-pin do e27418db7 + mutacje na bieżących needle); (b) opcjonalnie świeży przebieg live A3 (ziarno 4242, 60 tur) po zbudowaniu bundle poza repo; (c) Evaluator rundy 3 po (a)/(b).
DEPLOY/PUSH: NIE WYKONANO
