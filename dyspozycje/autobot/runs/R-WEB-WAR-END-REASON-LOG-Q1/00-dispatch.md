# R-WEB-WAR-END-REASON-LOG-Q1 — powód końca wojny (i wybuchu) zapisany w grze i pokazany w „Wydarzeniach na świecie”

DOMAIN: GAME (log + tekst wpisu; zgłoszenie właściciela: „wojny kończą się szybciej niż po 40 turach”, luki L1/L3/L7 z analizy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main (SHA podaje orkiestrator po FALI 908). Wdrożenie jako FALA po FC PASS.

## Kontekst
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (P1–P21, sekcja 7a tabela), gra/src/game/diplo-world-news.ts (FALA 905/907: wpis o wojnie/pokoju bez powodu), setDiploRelation (gra/src/main.ts ~12245, 63 wywołania, bez parametru powodu), console.log w ścieżkach AI↔AI (P10 pokój wymuszony, P11 oferta zmęczenia, P12 auto-pokój po 2 miastach, P20 prośba o pokój). Dziś nie da się zmierzyć ani pokazać graczowi PRZYCZYNY końca wojny.
## Zadanie
1. Wprowadź lekki kontekst „powód zmiany relacji” (np. modułowa zmienna ustawiana tuż przed wywołaniem setDiploRelation/finalizePeaceTreatyBetween/declareWar… i zerowana po, albo opcjonalny parametr tylko w ścieżkach pokoju/wojny) BEZ zmiany sygnatury 63 wywołań. Kody powodów: pokoj_wymuszony_zmeczenie, oferta_zmeczenia, auto_pokoj_dwa_miasta, prosba_o_pokoj_ai, pokoj_z_propozycji, pokoj_po_rozejmie, rozejm_wygasl, wojna_epoki, wypowiedzenie_ai, wypowiedzenie_gracza, zdobycie_miasta/bunt, inny.
2. Zasil wpisy „Wydarzenia na świecie” (okno dyplomacji + dziennik) polskim opisem powodu, np. „Pokój wymuszony po 40 turach wojny”, „Pokój po zdobyciu 2 miast”, „Wojna epoki” — tylko dla par bez gracza i odkrytych cywilizacji (zasady widoczności jak dotąd). Dla pary z graczem: jeśli istniejący wpis ma miejsce na podtytuł, dopisz powód tylko tam, gdzie wołający go zna; bez zmian logiki.
3. Log diagnostyczny dla pomiarów: window.__diploWarEndLog (tylko pod ?civTest=1, tablica {tura, a, b, rodzaj, powod, turyWojny, zmeczenie, miastaZmienione}) — do przyszłych pomiarów (nie zmienia gry).
4. Zapis/wczytanie: powód wpisu zapisany razem z wpisem listy (migracja: brak pola = bez powodu).
5. Testy: czerwone po cofnięciu: powód trafia do wpisu dla co najmniej P10, P12, P20, wypowiedzenia AI; brak powodu = wpis jak dotąd; civTest log; zapis/wczytanie.
## Allowlista
gra/src/main.ts (TYLKO miejsca ustawiające powód i budowa wpisu), gra/src/game/diplo-world-news.ts, gra/src/ui/diploListHud.ts (tylko wyświetlenie powodu), gra/tools/diplo-world-news-test.cjs, nowy gra/tools/war-end-reason-log-test.cjs, testy wskazane grepem, dyspozycje/autobot/runs/R-WEB-WAR-END-REASON-LOG-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki wojny/pokoju/dyplomacji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; era-war-end-like-classic zielony; diplo-world-news zielony; truce-end-war-notice zielony; hud-me-literal-zero zielony; hotseat e-source 77/0; bramki-tmpdir PASS=18; testy gra/tools/*peace*test.cjs, *war-weariness*test.cjs. Zacommituj i zwróć SHA.
## Binarne kryterium
Wpisy „Wydarzenia na świecie” zawierają powód dla głównych ścieżek (P10, P11, P12, P20, wypowiedzenia); log civTest istnieje; zapis/wczytanie działa; testy zielone, mutacja czerwona.
