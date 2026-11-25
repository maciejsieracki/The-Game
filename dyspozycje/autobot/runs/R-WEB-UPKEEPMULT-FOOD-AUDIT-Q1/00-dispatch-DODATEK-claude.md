# R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1 — audyt konsumpcji żywności po UPKEEPMULT/UPKEEPPACE (czy zgadza się z decyzją właściciela)

DOMAIN: GAME (pomiar/analiza) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main ee0f73c325a7a35597c7211f8aad8636190d741b. Bez deployu, zero zmian w gra/src i gra/data. Błąd → tylko opis kandydata R-WEB-*; wątpliwość o grze → DECISION_REQUIRED.

## Kontekst
Z LIVEWELCOME (runs/R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1/10-operator-claude.md, 30-obrona-claude.md): w diplo-truce-live test gracza pada w t5 blokadą końca tury (NNS: żywność/Spichlerz, „zabraknie 135”) mimo bufora 999 żywności; trzeba było dosypywać zasoby. Zdecydowane przez właściciela: FALA 883 (UPKEEPMULT: żywność jednostek 4/16/64, kurs 0,2), FALA 887 (UPKEEPPACE: ustawienie „Koszty jednostek” mnoży utrzymanie; w domyślnej grze ×2), FALA 890 (AI: darmowe utrzymanie jednostek wojskowych w turach 1–40), FALA 875 (żywność jednostek ×1/×2/×4). Nie wiadomo, czy konsumpcja żywności w grze zgadza się z tymi decyzjami (NIE ZMIERZONO wzoru po UPKEEPMULT).
## Zadanie
1. Z kodu (gra/src/game/…upkeep…, economy…, production…; rejestr FAL 875/883/887/890; dyspozycje/analizy/KOSZTY-JEDNOSTEK-STAN-2026-11-20.md, POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md) wypisz DOKŁADNY wzór konsumpcji żywności przez jednostki: składniki, mnożniki (UPKEEPMULT 4/16/64 × kurs 0,2 × „Koszty jednostek” ×1/×2/×4), epoki, darmowe t1–40 dla AI; zacytuj decyzje właściciela z rejestru.
2. Zmierz na żywo w grze (hak ?civTest=1 __settingsLive: startNewGame z domyślnymi ustawieniami, seed 4242; gracz buduje/ma 5–10 jednostek; kilka tur): faktyczne zużycie żywności przez jednostki na turę na jednostkę (Kamień/Brąz/Żelazo, ustawienie ×1/×2/×4) vs wzór z pkt 1; tabela. Zbuduj bundle POZA repo (vite --outDir w /tmp, wyjątek C-001); jeden Chromium; limit 10 min na bieg.
3. Odpowiedz na pytanie: czy bufor 999 żywności w teście rozejmu w t5 jest niewystarczający zgodnie z wzorem (STARY-PIN testu, gra poprawna), czy zużycie jest wyższe niż wynika z decyzji (BŁĄD-GRY: kandydat z minimalnym odtworzeniem i cytatem decyzji)? NIE ZMIERZONO z konkretnym powodem, jeśli się nie da.
4. Dokument dyspozycje/analizy/AUDYT-ZYWNOSC-JEDNOSTEK-2026-11-25.md + dane jsonl.gz + SHA256 w runs/…/dane/.
## Allowlista
nowy gra/tools/upkeep-food-audit.cjs, dyspozycje/analizy/AUDYT-ZYWNOSC-JEDNOSTEK-2026-11-25.md, dyspozycje/autobot/runs/R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (bundle: vite --outDir poza repo), zmiana gra/src i gra/data, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Jeden Chromium naraz; po pracy zabij WŁASNE procesy po PID; usuń bundle/logi/node_modules z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0 (kod gry bez zmian). Zacommituj (dokument, narzędzie, dane) i zwróć SHA.
## Binarne kryterium
Wzór z cytatami decyzji; tabela zużycia PRZED(wzór)/PO(pomiar) per epoka i ustawienie; werdykt STARY-PIN / BŁĄD-GRY / NIE ZMIERZONO z dowodem; dane z SHA256; bramki zielone.
