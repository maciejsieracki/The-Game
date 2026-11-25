# R-WEB-TEST-DEBT-Q14-C — decyzje właściciela 2026-11-25 wdrożone w testach (4 testy, bez zmian gry)

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 35f601ae304471593c4921a61bfecbddbb9de14a. Bez deployu (zero zmian w gra/src i gra/data).

## Decyzje (źródło: dyspozycje/REJESTR-PROSB-I-ZADAN.md, wpis „DECYZJE WŁAŚCICIELA 2026-11-25”)
1. ai-army-composition-per-civ-test.cjs: USUŃ sztywny próg „min 50% jednostek wręcz” (10 czerwonych: Sumer/Babilonia 48,3%, Asyria 46,7%, Asyria L1–L3). Zastąp zakresem 40–60% udziału jednostek wręcz (garnizon min. 1 nadal NIE liczy się jako wręcz — to już jest w teście). Zakres obowiązuje w tych samych miejscach, w których był próg 50%; komentarz z uzasadnieniem właściciela („nigdy nie trafi idealnie 50 na 50”). Mutacja: skład AI poza zakresem (np. 20% lub 80% wręcz) musi dawać czerwony test — pokaż.
2. rydwan-bierny-atak-test.cjs (4 passed / 2 failed: „wróg poza zasięgiem nie wymusza ofensywnego zbliżenia”): obowiązuje KOD (commit 64d5ac663: rydwan aktywnie zbliża się do najbliższej wrogiej jednostki w zasięgu ruchu). Przepisz asercje C/D do tego zachowania, zachowując moc dowodową; pokaż mutację (wyłączenie zbliżania w kopii źródła) → test czerwony.
3. ai-army-replacement-concentration-test.cjs (decyzja techniczna orkiestratora): próg „bez bramki > 10% marszów ze skupiska < 3” obniż do 5% (zmierzone 9,1% w mutacji, z bramką 2,5%); ZOSTAJE warunek „z bramką udział spada co najmniej o połowę”. Komentarz z pomiarem.
4. ai-move-full-range-test.cjs (decyzja techniczna): tolerancja 0,5 pp → 1,0 pp (zmierzona delta +0,9 pp przy szumie symulacji ±0,5 pp); komentarz z pomiarem i powołaniem na koszt R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1.
Kontekst: raporty dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1/ i -B/ (git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:...).

## Allowlista
gra/tools/ai-army-composition-per-civ-test.cjs, gra/tools/rydwan-bierny-atak-test.cjs, gra/tools/ai-army-replacement-concentration-test.cjs, gra/tools/ai-move-full-range-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-C/**.
## Zakazy: gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie lub usuwanie asercji (poza zakresem wprost opisanym niżej), git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later), run_in_background, git log -S nad całym repo bez ścieżki (zawiesza >120 s — zawężaj do gra/src gra/data gra/tools). Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc --noEmit 0; logic 213; tech-tree 20; research 33; unit-replace 21; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN. Zacommituj (po jednym commicie na test) i zwróć SHA czubka.
## Binarne kryterium
Cztery testy zielone solo (surowe wyjście), każda zmiana z mutacją czerwoną (poza pkt 4, gdzie wystarczy pomiar), asercje nie osłabione poza wprost opisanym; bramki zielone.
