# R-WEB-ELIMINATED-RELATION-CLOSE-Q1 — wojna z wyeliminowanym właścicielem zostaje w relacji „wojna” (luka L5 z WARENDP)

DOMAIN: GAME (pomiar + ewentualna naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 76c0fbc6b55816399ccbe8d6ac5c3240b99e70ee. Wdrożenie jako FALA tylko jeśli zmiana w gra/src i FC PASS.

## Kontekst
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (L5, P16): eliminateOwner (gra/src/main.ts ~40109–40260) nie wywołuje setDiploRelation — relacja pary z martwym ownerem zostaje 'wojna'; sprzątanie tylko przez pomocnicze pętle (prunePendingF… — sprawdź nazwę). NIE ZBADANO: czy zostawiona relacja wojny wpływa na liczniki i limity (countActiveWarsForOwner ~26032 iteruje allPowerOwnerIds() — czy ta lista zawiera wyeliminowanych? limity wojen: 1 wojna epoki / 1 naturalna / maks. wojen, sojusze i obowiązki sojuszu, wartość „stan wojny” w UI/AI, zmęczenie wojny, tick AI↔AI).
## Zadanie
1. Zbadaj w kodzie i testem źródłowym/behawioralnym (jak w gra/tools/war-rules-*-test.cjs): po eliminacji cywilizacji B, czy para (A,B) nadal liczy się jako wojna w: countActiveWarsForOwner*, warTypesForOwner, bramkach limitu wojen, tickAiAiWarWeariness, buildAllianceWarObligationCtx, UI listy wojen/dyplomacji, nowym wymuszeniu wojny epoki. Dla każdego: plik:linia, wynik (wpływa / nie wpływa) z dowodem.
2. Jeśli którykolwiek licznik/limit nadal widzi martwego właściciela (błąd): napraw minimalnie (zamknięcie relacji w eliminateOwner na 'neutralni'/'pokoj' albo filtr wyeliminowanych w licznikach — wybierz mniej inwazyjne, uzasadnij), dodaj test (czerwony przed naprawą na mutancie, zielony po) i zwróć kod.
3. Jeśli nic nie wpływa: bez zmiany kodu; dokument dyspozycje/analizy/ELIMINACJA-RELACJA-WOJNY-2026-11-25.md z dowodami i klasyfikacją „bez wpływu (porządkowe)”; test strażnik nie jest wymagany.
## Allowlista
gra/src/main.ts (TYLKO miejsca wskazane w zadaniu), nowy gra/tools/eliminated-relation-*-test.cjs, dyspozycje/analizy/ELIMINACJA-RELACJA-WOJNY-*.md, dyspozycje/autobot/runs/R-WEB-ELIMINATED-RELATION-CLOSE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana reguł gry poza zamknięciem martwej relacji/filtrem, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie (git add <ścieżki tematu>).
## Bramki
tsc 0 (jeśli zmiana src); logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0; bramki-tmpdir PASS=18; wszystkie testy gra/tools/*war*test.cjs i *eliminat*test.cjs dotykające zmienionych funkcji (przeskanuj grep po nazwach funkcji w tools/*.cjs wycinających main.ts do vm; stuby ME() jeśli potrzebne). Zacommituj i zwróć SHA.
## Binarne kryterium
Dla każdego licznika/limitu: wpływa/nie wpływa z plik:linia; przy wpływie naprawione z testem czerwonym na mutancie; bramki zielone.
