# R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1 — ile naprawdę trwają wojny i czym się kończą (zgłoszenie właściciela: „pokój wymuszony miał być po ok. 40 turach, w grze go nie widzę, wojna kończy się znacznie szybciej”)

DOMAIN: GAME (pomiar) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main b610e71a62f68c5c3052d456facc0deebd86af72. Bez deployu, zero zmian w gra/src i gra/data (instrumentacja tylko w kopii poza repo / w runnerze).

## Kontekst (kod i parametry, odczytane przez orkiestratora; NIE ZMIERZONO w grze)
gra/data/war-weariness-params.json: poziom zmęczenia wojną = min(1, turyWojny/40 + 0,1 × liczba miast, które zmieniły właściciela (obu stron)); 100% = pokój wymuszony. Straty bitewne NIE wchodzą do poziomu; wchodzą do „desperacji” przegrywającego (wagaZmeczenia 0,5, wagaSily 0,5, wagaStrat 0,3×min(1, straty/3)); stopień > 0 → przegrywający składa ofertę miast: od tury wojny 3 (ofertaOdTurWojny), bez utraty miasta od tury 6; zwycięzca MUSI przyjąć ofertę, gdy przegrywający ma ≤3 miasta po ≥1 utracie lub ≥3 utraty w tej wojnie (ochronaMaxMiast, ochronaUtratyWojny); cena pokoju = 6000 PN × (1−L); chęć pokoju od 50%, wyjście awaryjne od 80% po 3 odrzuceniach; po pokoju karencja 40 tur (100 dla chronionego). Wojny wymuszone epoki (forced-war-*.ts): „2 miasta → wymuszony pokój + 20 tur karencji” (osobny mechanizm).
## Zadanie
1. Zbuduj bundle POZA repo (vite --outDir w /tmp, wyjątek C-001) i zrób bieg ciągły seed 4242 (autopilot gracza, flagi domyślne) do t120 (jeśli 10 min nie starcza — odcinki z --stop-at; wznawianie ma ponawianie startu), z logiem KAŻDEJ wojny: strony, typ (naturalna/epoki/wymuszona), tura startu i końca, czas trwania, powód końca (pokój wymuszony przy 100% / oferta przegrywającego przyjęta / przyjęcie obowiązkowe / pokój przez ultimatum/dyplomację / wygaśnięcie / eliminacja strony / inne), liczba miast zmieniających właściciela, poziom zmęczenia w chwili końca. Instrumentacja w kopii (worktree poza repo), nie w gra/src repo.
2. Powtórz na seed 7. Jeden Chromium naraz.
3. Wynik: tabela wszystkich wojen (seed × wojna) + rozkład czasu trwania (mediana, min, maks) osobno dla wojen naturalnych i epoki + liczba wojen zakończonych każdym powodem; ile wojen dobiegło do 100% (wymuszony pokój po ≈40 turach) vs ile skończyło się wcześniej i dlaczego (miasta, oferta przegrywającego od tury 3/6, ochrona ≤3 miasta, wojna epoki 2 miasta).
4. Dokument dyspozycje/analizy/WOJNY-CZAS-TRWANIA-POWODY-KONCA-2026-11-25.md + dane jsonl.gz + SHA256 w runs/…/dane/. Wątpliwość o grze (czy czas trwania zgodny z decyzją właściciela „40 tur do 100%”) opisz jako DECISION_REQUIRED z jednym zdaniem per wariant — nie koduj.
## Allowlista
nowy gra/tools/war-duration-measure.cjs, patch instrumentacji jako .patch w runs/…/, dyspozycje/analizy/…, dyspozycje/autobot/runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data w repo, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Jeden Chromium; po pracy zabij WŁASNE procesy po PID i usuń worktree/bundle/logi z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0 (kod gry bez zmian w repo). Zacommituj i zwróć SHA.
## Binarne kryterium
Tabela wojen z powodami końca i czasem trwania dla seed 4242 i 7; odpowiedź liczbowa „ile wojen dobiega do pokoju wymuszonego przy 100% i po ilu turach”; dane z SHA256; repo bez zmian w gra/src.
