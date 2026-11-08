STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-DIPLO-CITY-OFFER-REJECT-OWN-COOLDOWN-Q1
GOAL: Odrzucenie oferty miasta za pokój zapisuje klucz `miasto_za_pokoj`, nie `pokoj`. Obrona odpowiada na zarzuty Evaluatora dla commita b8bd14e45.
BAZA: b8bd14e45 (kod Operatora), 2339b3dab (przodek).
ZMIANY/COMMIT: commit obrony (SHA w raporcie orkiestratora) — tylko `gra/tools/diplo-city-offer-reject-own-cooldown-test.cjs` (rozszerzony o test źródłowy okablowania main.ts) oraz ten plik. Kod gry bez zmian.

ODPOWIEDZI NA ZARZUTY
1. Okablowanie main.ts bez testu — PRZYJĘTE. Poprawka: nowa sekcja testu czyta gra/src/main.ts i sprawdza 6 miejsc: sprawdzenie cooldownu przez rejectCooldownKeyFor(workingCmd.type, converted.actionId); przekazanie cooldownKey do isOfferRejectedOnCooldown; ustawienie entry.rejectCooldownKey dla oferty miasta; zapis `entry.rejectCooldownKey ?? entry.actionId`; recordRejectedOffer(rejectKey); zapis/odczyt stołu jako całe wpisy. Mutacje: (a) usunięcie linii ustawiającej entry.rejectCooldownKey → test FAIL, exit 1; (b) zapis `entry.actionId` zamiast `rejectCooldownKey ?? actionId` → test FAIL, exit 1. Po przywróceniu main.ts (git checkout) → 28/0.
2. Odchylenie od allowlisty (diplomacy-rejection-cooldown.ts) — PRZYJĘTE jako uzasadnione. Bez rozszerzenia typu RejectCooldownKey wywołania z 'miasto_za_pokoj' nie kompilują się (tsc). Logika cooldownu bez zmian. Orkiestrator odnotowuje odchylenie przy integracji.
3. Dedup hasPendingNegotiationForPair na 'pokoj' — ODRZUCONE jako zakres tego tematu (dedup, nie cooldown). Dispatch wymagał udokumentowania i zgłoszenia — zrobione. Kandydat na osobny temat ABC: oferta miasta i zwykły pokój nadal blokują się przy oczekującej propozycji.
4. Incydent usunięcia gra/tools/.dip-* — INFORMACYJNE, przyjęte. Diff 2339b3dab..b8bd14e45 nie zawiera usunięć tych plików.

RYZYKO BRZEGOWE z notatek Evaluatora (zapis/wczytanie stołu) — ZWERYFIKOWANE, NIE JEST BŁĘDEM:
- zapis: gra/src/main.ts ~35717 `negotiationTable: negotiationTable.slice()` (całe obiekty),
- odczyt: gra/src/main.ts ~45337-45360 `negotiationTable.push(entry)` (bez przepisywania pól).
Pole rejectCooldownKey przeżywa zapis i wczytanie. Test wiring sprawdza to źródłowo.

TESTY (worktree wf_9f596371-5ac-3, po commicie obrony):
- diplo-city-offer-reject-own-cooldown-test.cjs: 28 pass / 0 fail
- diplomacy-rejection-cooldown-test.cjs: 14 pass / 0 fail
- diplomacy-proposal-test.cjs: 190/190 PASS
- tsc --noEmit: exit 0
- Mutacje: patrz pkt 1 (exit 1 w obu przypadkach).
NIE_ZMIERZONO: end-to-end odrzucenia w przeglądarce (closure handleNegotiationReject bez harnessu). Pozostałe testy regresji (ai-losing-war, ai-war-weariness, ai-test, logic) — wyniki z r1 Operatora, nie powtarzane w obronie.

BLOKADY: brak.
RUNDY: 2/5 (obrona r1)
NASTĘPNY KROK: Evaluator r2 na commicie obrony; potem Final Control (Sonnet). Orkiestrator: odnotować odchylenie allowlisty; ABC: osobny temat dedup 'pokoj' (hasPendingNegotiationForPair).
DEPLOY/PUSH: NIE WYKONANO
