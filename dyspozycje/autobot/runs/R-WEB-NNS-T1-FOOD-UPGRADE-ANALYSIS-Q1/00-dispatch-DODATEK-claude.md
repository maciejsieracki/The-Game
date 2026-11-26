# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## (a) Bramka NNS w turze 1
Fakty z rejestru: dyspozycje/REJESTR-PROSB-I-ZADAN.md (szukaj R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1, R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1, „t57 endTurn”, LIVEWELCOME): w teście t57 endTurn przy domyślnych ustawieniach (bypass 0) bramka NNS blokuje turę 1 (89 s), z bypass 1 tury 1–56 przechodzą w 250 s. Kod: gra/src/game/no-negative-stocks.ts (NNS_WOLNE_TURY = 10: okres wolny tur 1–10 dla gracza), decideEndTurnGate, nnsGateForPlayer, main.ts.
Ustal: (1) czy zasada „gracz wolny od bramki w turach 1–10” obowiązuje w kodzie dla domyślnej gry i czy blokada tury 1 w tym teście wynika z błędu kodu, z ustawienia testu (podatki 0?) czy z zamierzenia; (2) w jakich realnych warunkach gracz widzi blokadę „Zakończ turę” w turach 1–10 (zrzut/odczyt kodu, nie żywa gra jeśli Chromium niestabilny — NIE ZMIERZONO z powodem); (3) 2–3 warianty zachowania dla gracza opisane skutkiem dla gry po polsku (bez nazw plików w opisie wariantu) z za/przeciw.
## (b) Koszt ulepszeń w żywności vs autoimprove
Fakty: FALA 878 (koszt ulepszeń wg epoki właściciela, decyzja 2026-11-19 B); gra/tools/autoimprove-pasture-irrigation-q2*.cjs (e) wynik 14/3: z flagą koszt ulepszeń wg epoki true: starved 3, pula startowa 340; z false: starved 0, pula 300; bisect bdae76b7e → 141a2bc56. Ustal: czym jest „głodowanie” w tym teście (które miasta/ile ludności/ile tur), czy to skutek zamierzonej zmiany kosztu (miasto płaci żywność za ulepszenie), czy błąd kolejności (autoimprove spala żywność ponad zapas); jaki jest realny wpływ na grę (AI i gracz z autoulepszaniem); 2–3 warianty z skutkiem dla gry po polsku.
## Wynik
dyspozycje/analizy/NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md + runs/R-WEB-NNS-T1-FOOD-UPGRADE-ANALYSIS-Q1/10-operator-claude.md; wszystkie liczby ZMIERZONO/NIE ZMIERZONO.
## Allowlista
dyspozycje/analizy/NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-NNS-T1-FOOD-UPGRADE-ANALYSIS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu, osłabianie asercji (zmiana dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt — wypisz w raporcie), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 6 GB; usuń node_modules po bramkach.
## Bramki / kryterium
Brak bramek kodu; git diff --name-only wyłącznie allowlista; dokument zawiera (a) i (b) z faktami, odpowiedziami na pytania 1–3 oraz wariantami po polsku.
