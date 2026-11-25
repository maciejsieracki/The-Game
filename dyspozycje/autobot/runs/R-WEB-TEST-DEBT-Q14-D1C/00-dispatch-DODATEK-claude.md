# R-WEB-TEST-DEBT-Q14-D1C — 6 czerwonych testów z D1 + pin Konnicy (ustalić regułę, naprawić testy, kandydatów błędów gry opisać)

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main a0939760d657bdee5db36e2f586fce2c820f95dd. Bez deployu: zero zmian w gra/src i gra/data (błędy gry TYLKO opisać jako kandydatów R-WEB-* z minimalnym odtworzeniem i cytatem obowiązującej reguły).

## Kontekst
Raport Q14-D1 (git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1/10-operator-claude.md, UWAGI-1/2/4/5/7/8) zostawił 6 testów czerwonych jako „kandydat błędu gry” lub NIE-ZMIERZONO. Dla każdego ustal OBOWIĄZUJĄCĄ regułę (przewodnik docs/PORADNIK-GRACZA/, decyzje w dyspozycje/autobot/KOLEJKA-WEB.md i dyspozycje/REJESTR-PROSB-I-ZADAN.md, dane gra/data) i sklasyfikuj.
## Zadanie (6 testów + 1 pin; paczki, commit po każdym)
1. building-detail-card-entitycard-migration-test.cjs (52/3): karta budynku — „Praca (jednorazowo)” nie kończy się na „pkt Pracy”, „Przyrost za poziom” +10 pkt Pracy/poziom, brak playerFacingNote(def.uwagi) (gra/src/ui/…/buildingAdapter.ts). Ustal, czy reguła UI (przewodnik/decyzje o kartach) wymaga tych elementów; STARY-PIN → popraw test z powołaniem na commit/decyzję; BŁĄD-GRY → zostaw czerwony i opisz.
2. civ-matrix-greece-test.cjs (323/6): agresja 0,75 vs 0,8 (resolveArchetypeAggression w civ-ai-data.ts używa dip_agresja_archetyp jako bazy) i decideAIDiplomacy nie zwraca wojny na easy/normal/hard. Ustal obowiązującą regułę (git log -S ograniczony do gra/src gra/data gra/tools).
3. autoimprove-pasture-irrigation-q2-test.cjs (14/3, (e) starved=3, faza wzrostu 24 tury): bisect narzędziem tools/autoimprove-pasture-irrigation-q2-bisect.cjs; wpływ FAL 883/890.
4. city-state-alliance-test.cjs (73/1, strong: drugi strażnik nie wychodzi): ai.ts ~5405–5415 (homeGuardCount/minFieldArmyBeforeSend); czy to efekt garnizonu min. 1 (FALA 857) → STARY-PIN, czy błąd.
5. cluster-plan-name-test.cjs (2/4, seed 202): ZANIM zaczniesz sprawdź, czy polar (generator) jest już w main (grep w origin/main: commit R-WEB-MAP-POLAR); jeśli nie — NIE-ZMIERZONO z notą „po POLAR A1”, nie zgaduj.
6. bramki-tmpdir-unikalnosc-test.cjs (171 trafień stałej nazwy pod os.tmpdir()): to higiena; napraw tylko jeśli mieści się w allowliście tools/ i nie zmienia zachowania testów (zamiana stałej nazwy na unikalną per-proces), w paczkach po 20 plików; inaczej NIE-ZMIERZONO z liczbą plików.
7. unit-context-card-test.cjs:152,167 pinuje „Konnica Moc pola = 49” — przepnij na 98 (decyzja właściciela 2026-11-22, units.json fieldPower 98), z komentarzem R-WEB-TEST-DEBT-Q14.
Klasyfikacja: STARY-PIN (popraw test do obowiązującej reguły, komentarz 'R-WEB-TEST-DEBT-Q14' + commit/decyzja, asercji nie osłabiaj, mutacja czerwona na bieżącym kodzie) / HARNESS / BŁĄD-GRY (minimalne odtworzenie + cytat reguły; test zostaje czerwony; BEZ pytania właściciela — zgłoś jako kandydata) / NIE-ZMIERZONO (tylko po wyczerpaniu dowodu, z konkretną notą). ZAKAZ statusu BLOCK bez blokady technicznej.
## Allowlista
gra/tools/{building-detail-card-entitycard-migration,civ-matrix-greece,autoimprove-pasture-irrigation-q2,city-state-alliance,cluster-plan-name,bramki-tmpdir-unikalnosc,unit-context-card}-test.cjs; dla pkt 6 także pliki gra/tools/*.cjs w których jest stała nazwa tmpdir (tylko zamiana nazwy); dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1C/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki (>120 s). Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN. Zacommituj i zwróć SHA.
## Binarne kryterium
Każdy z 7 punktów ma klasyfikację z dowodem; naprawione testy zielone solo (surowe wyjście) z mutacją czerwoną; kandydaci błędów gry opisani (odtworzenie + cytat reguły); bramki zielone.
