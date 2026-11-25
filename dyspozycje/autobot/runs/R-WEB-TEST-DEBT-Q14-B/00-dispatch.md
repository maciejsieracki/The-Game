# R-WEB-TEST-DEBT-Q14-B — kategoria B (10 testów) + Konnica 98 (wiki i piny) + garnizon min. 1 nie „wręcz”

DOMAIN: GAME (testy + jeden wyjątek wiki) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main f96787fb70da4086f9b25487cc4b6c62a2127610 (FALA 892). Deploy tylko jeśli zmienia się wiki (patrz niżej) — decyduje orkiestrator.

## Kontekst
Dług testowy po temacie R-WEB-TEST-DEBT-Q13 (LIMIT-5-EXCEEDED, zgoda właściciela na otwarcie Q14 po decyzjach 1–3: ‘realizuj po kolei’ 2026-11-25). Stan 156 pozycji po Q13 r5: git show origin/main:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q13/43-stan-156-r5.md (tabela: kat B/D/E, plik testu, pierwsza linia FAIL, nota). Skrypty pomocnicze tamże: sweep-one.sh (jeden test z timeoutem), categorize2.cjs. Od Q13 weszły FALE 889–892 (m.in. darmowe utrzymanie jednostek AI t1–40, wojny epoki bez blokady sojuszem, dopłata D 0,5) — NAJPIERW uruchom każdy swój test SOLO i sekwencyjnie na bazie (cd gra && node tools/<plik>), bo część mogła zazielenieć lub zmienić przyczynę; wynik surowy do tabeli w raporcie.
Zasady napraw: (1) klasyfikuj KAŻDY test: STARY-PIN (test pinuje wartość/regułę zastąpioną decyzją właściciela lub danymi — popraw test do obowiązującego stanu, z komentarzem ‘R-WEB-TEST-DEBT-Q14’ i powołaniem na zmianę/decyzję; asercji NIE osłabiaj ani nie usuwaj), HARNESS (test czyta tekst main.ts/źródła i zgnił po refaktorze — zaktualizuj dopasowanie, zachowując moc dowodową; pokaż mutację czerwoną tam gdzie to możliwe), BŁĄD-GRY (kod gry łamie obowiązującą regułę — NIE poprawiaj kodu gry, zostaw test czerwony, opisz w UWAGI-DLA-ORKIESTRATORA jako kandydata R-WEB-*), OBCIĄŻENIE/CZAS (przejdzie solo — odnotuj), NIE-ZMIERZONO (nie wiesz — napisz tak, nie zgaduj). (2) Zero zmian w gra/src i gra/data (wyjątek tylko tam, gdzie wskazano wprost w zadaniu). (3) NIE ruszaj gra/tools/climate-band-test.cjs ani testów generatora map (osobny temat polar A1 w toku). (4) Bramki muszą zostać zielone. (5) Testy live/Chromium: tylko gdy Chromium działa, z MEASURE_CHROME_ARGS="--mute-audio"; SIGSEGV = ponów odcinek, potem NIE ZMIERZONO.

## Decyzje właściciela (wiążące, 2026-11-22)
- Konnica fieldPower = 98 jak w gra/data/units.json: popraw WIKI (49→98; znajdź źródło wiki Konnicy w gra/ i regenerację gra/.../wikiBundle.json przez node tools/bundle-wiki-for-game.cjs — to jedyny dozwolony wyjątek zmiany spoza gra/tools) oraz piny: hud-moc-warstwa-test.cjs:168, moc-ranking-rozjazd-test.cjs:145, mur-paradoks-test.cjs (jeśli jeszcze czerwony).
- Garnizon min. 1 w mieście AI NIE liczy się jako „wręcz” w pomiarze składu armii: ai-army-composition-per-civ-test.cjs — dopasuj do tej reguły (jeśli fixture z Q13 liczył garnizon jako wręcz, cofnij to założenie w teście; progi tabeli właściciela nietknięte).

## Zadanie
Kategoria B z 43-stan-156-r5.md: ai-player-parity-fixes, dyplo-bilans-gate-n-e1-reprodukcja-runda2 i runda3, granice-relacja-dyplomatyczna, hotseat-etap6d-podetap-e-source, hud-moc-warstwa, march-attack-queue-persist, moc-ranking-rozjazd, naval-water-access-gate, war-epoch-player-first-main-guard; plus wojna-wymuszona-parowanie-test.cjs (czerwony od bazy: S2, S7, TypeError — reguła DEFER-NOT-CANCEL vs test; sklasyfikuj i napraw test do obowiązującej reguły albo zgłoś błąd gry); plus ai-army-composition-per-civ i mur-paradoks wg decyzji wyżej; plus pozycje A/E z listy, których nie dotyka paczka D (ai-ai-treaty-live-proof-wiring-test: kat A ‘Brak katalogu wyniku’ — zbadaj).

## Allowlista
gra/tools/*-test.cjs wymienionych testów, wiki Konnicy + gra/.../wikiBundle.json (tylko Konnica 49→98; opisz dokładnie), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-B/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data (poza wyjątkami z zadania), osłabianie/usuwanie asercji, rm/rmdir/unlink plików repo, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; npm ci w gra/ w swoim worktree (usuń node_modules po bramkach). Testy uruchamiaj SEKWENCYJNIE (jeden proces naraz — maszyna ma 4 rdzenie i inne tematy pracują równolegle).

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; ai-test (297/0 po Q13) zielony; era-war/forced-war/diplomacy testy tematów FALA 891/892 zielone (era-war-pairing-alliance-test 19/0, ai-ai-alliance-surcharge ALL GREEN). ZACOMMITOWAĆ (git add tylko allowlista) i zwrócić SHA.

## Binarne kryterium
PRAWDA: każda pozycja B + wymienione dodatkowe ma status zielony (z uzasadnieniem re-pinu) albo jawny status BŁĄD-GRY/NIE-ZMIERZONO z przyczyną; Konnica w wiki = 98; żadna asercja nie osłabiona; bramki zielone.

## DODATEK rundy 3/5 (orkiestrator, 2026-11-25) — BAZA = 27a4680758b9fe7058ec06fdb326901e5fbdbabc (potomek f96787fb7; Konnica 98 wiki+piny, parity/granice/hotseat/wojna-wymuszona zielone — NIE RUSZAJ)
Runda 2: Evaluator FAIL (zarzuty 1,2), FC FAIL. Zakres tej rundy (TYLKO to):
1. dyplo-bilans-gate-n-e1-reprodukcja-runda2-test (6 FAIL) i -runda3-test (17 FAIL): przepisz needle/oczekiwane wartości do reguły po e253e64a6/e27418db7 (kierunkowa bramka pokoju; case 'pokoj' w diplomacy-proposals.ts ~2051-2117). Dla każdego FAIL: przyczyna z dowodem (git log -S), klasyfikacja STARY-PIN/HARNESS/BŁĄD-GRY; stare piny pokaż jako mutację czerwoną na bieżącym kodzie (mutacja przez kopię pliku, nie git checkout). Nie osłabiaj asercji; gdzie reguła zmieniła oczekiwanie (np. pwBalance -554/+554/0, accepted=false dla autora) zapisz nową wartość z powołaniem na commit. Paczki po 5 FAIL, commit po każdej paczce.
2. ai-ai-treaty-live-proof-wiring A3 (decyzja orkiestratora): dopłata D obowiązuje przy SOJUSZU (FALA 892, ai-ai-treaty-params.json), nie przy NAP — owner potwierdził 'NAP AI↔AI zostaje', ale dopłata dotyczy sojuszu. Przepisz A3 tak, by akceptowało dopłatę D przy sojuszu (NAP z dopłatą opcjonalny), z mutacją czerwoną (usunięcie dopłaty z toru → A3 czerwone). Przebieg live ziarno 4242, 60 tur; SIGSEGV Chromium przy wznowieniu — rób świeży przebieg.
3. ai-army-composition-per-civ (10 FAIL) — NIE RUSZAJ, czeka na decyzję właściciela (ABC). main.ts literał 0 (:3140, :24044) — NIE RUSZAJ gra/src (osobny temat R-WEB-HUD-ME-MIGRATION-Q1); hud-moc-warstwa zostaje 26/2 jako BŁĄD-GRY kandydat.
4. ZAKAZ statusu BLOCK bez blokady technicznej.
