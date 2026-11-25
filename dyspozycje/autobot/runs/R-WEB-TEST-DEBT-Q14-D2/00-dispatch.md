# R-WEB-TEST-DEBT-Q14-D2 — kategoria D, połowa 2/2 (50 testów ‘przyczyna NIE ZMIERZONO’, analiza po 1 teście)

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main f96787fb70da4086f9b25487cc4b6c62a2127610 (FALA 892). Bez deployu (zero zmian w gra/src i gra/data).

## Kontekst
Dług testowy po temacie R-WEB-TEST-DEBT-Q13 (LIMIT-5-EXCEEDED, zgoda właściciela na otwarcie Q14 po decyzjach 1–3: ‘realizuj po kolei’ 2026-11-25). Stan 156 pozycji po Q13 r5: git show origin/main:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q13/43-stan-156-r5.md (tabela: kat B/D/E, plik testu, pierwsza linia FAIL, nota). Skrypty pomocnicze tamże: sweep-one.sh (jeden test z timeoutem), categorize2.cjs. Od Q13 weszły FALE 889–892 (m.in. darmowe utrzymanie jednostek AI t1–40, wojny epoki bez blokady sojuszem, dopłata D 0,5) — NAJPIERW uruchom każdy swój test SOLO i sekwencyjnie na bazie (cd gra && node tools/<plik>), bo część mogła zazielenieć lub zmienić przyczynę; wynik surowy do tabeli w raporcie.
Zasady napraw: (1) klasyfikuj KAŻDY test: STARY-PIN (test pinuje wartość/regułę zastąpioną decyzją właściciela lub danymi — popraw test do obowiązującego stanu, z komentarzem ‘R-WEB-TEST-DEBT-Q14’ i powołaniem na zmianę/decyzję; asercji NIE osłabiaj ani nie usuwaj), HARNESS (test czyta tekst main.ts/źródła i zgnił po refaktorze — zaktualizuj dopasowanie, zachowując moc dowodową; pokaż mutację czerwoną tam gdzie to możliwe), BŁĄD-GRY (kod gry łamie obowiązującą regułę — NIE poprawiaj kodu gry, zostaw test czerwony, opisz w UWAGI-DLA-ORKIESTRATORA jako kandydata R-WEB-*), OBCIĄŻENIE/CZAS (przejdzie solo — odnotuj), NIE-ZMIERZONO (nie wiesz — napisz tak, nie zgaduj). (2) Zero zmian w gra/src i gra/data (wyjątek tylko tam, gdzie wskazano wprost w zadaniu). (3) NIE ruszaj gra/tools/climate-band-test.cjs ani testów generatora map (osobny temat polar A1 w toku). (4) Bramki muszą zostać zielone. (5) Testy live/Chromium: tylko gdy Chromium działa, z MEASURE_CHROME_ARGS="--mute-audio"; SIGSEGV = ponów odcinek, potem NIE ZMIERZONO.

## Zadanie
Twoja połowa: OSTATNIE 25 wierszy kategorii D (kolejność tabeli; od ok. dyplo-karta-duplikat do surrender-rekrutacja-build-gate-test i dalej do końca listy D — policz wiersze D). Pomiń climate-band-test.cjs (osobny temat) oraz wszystko z kat. B/E (inne paczki). Dla KAŻDEGO testu z Twojej połowy: uruchom solo, ustal przyczynę (diff testu vs obecny kod/dane, git log -S na pinowanej wartości, decyzje właściciela w dyspozycje/autobot/KOLEJKA-WEB.md i REJESTR), sklasyfikuj (STARY-PIN / HARNESS / BŁĄD-GRY / OBCIĄŻENIE / NIE-ZMIERZONO) i napraw tam gdzie to STARY-PIN lub HARNESS. Tabela końcowa w raporcie: test | przed | klasyfikacja | co zmieniono | po. Priorytet: testy w których przyczynę da się ustalić w kilku minutach; reszta NIE-ZMIERZONO z notą ‘co sprawdzić’. Wynik zbiorczy ma pozwolić orkiestratorowi wyciągnąć listę kandydatów BŁĄD-GRY.

## Allowlista
gra/tools/*-test.cjs testów z Twojej połowy (tylko te), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D2/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data (poza wyjątkami z zadania), osłabianie/usuwanie asercji, rm/rmdir/unlink plików repo, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; npm ci w gra/ w swoim worktree (usuń node_modules po bramkach). Testy uruchamiaj SEKWENCYJNIE (jeden proces naraz — maszyna ma 4 rdzenie i inne tematy pracują równolegle).

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; ai-test (297/0 po Q13) zielony; era-war/forced-war/diplomacy testy tematów FALA 891/892 zielone (era-war-pairing-alliance-test 19/0, ai-ai-alliance-surcharge ALL GREEN). ZACOMMITOWAĆ (git add tylko allowlista) i zwrócić SHA.

## Binarne kryterium
PRAWDA: każdy z ~25 testów ma w raporcie klasyfikację i status; naprawione testy są zielone solo (surowe wyjście), asercje nie osłabione; bramki zielone.
