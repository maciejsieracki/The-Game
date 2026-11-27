# Testy live: bramka „Zakończ turę” w ?playtest=mapa (R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1, runda 1)

> **STATUS DOKUMENTU (runda 3, kandydat 9d6b8e89f→obrona r3):** wiążące są WYŁĄCZNIE sekcje „Runda 2 (R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1, baza 5c187d3be)” oraz „Runda 3 (obrona, zarzuty Evaluatora)” na końcu pliku.
> Sekcje „Ustalenia o haku i bramce”, „Inwentaryzacja (105 plików…)” i „Podsumowanie grep” (rundy 1) oraz „Runda 2 (obrona): pomiar PRZED/PO…” (linie ok. 129–240) są NIEAKTUALNE i zostają tylko jako historia. Ich tezy skorygowano poniżej.
> Korekty tez rundy 1 (stan kandydata 9d6b8e89f):
> - Hak `__nnsMeasureDebug` NIE jest dostępny tylko pod `?civTest=1` w sensie „brak innej drogi”; jest on pod `?civTest=1` (tak jest w kodzie) i przepięte testy (forced-war, sidepanel, era-change-toast) dodają `civTest=1`. Teza „nie da się bez zmiany gra/src” była FAŁSZYWA dla tych testów: przepięcie wykonano bez zmian w gra/src.
> - `prepareEndTurnGate` JEST wpięty w 3 testy (forced-war-player-target-live-test, sidepanel-diplo-dismiss-real-render-test, era-change-toast-live-test) oraz w `live-nns-gate-smoke-test.cjs`. Teza „0 trafień” dotyczyła stanu sprzed rundy 2.
> - Kolumna „blokuje ekran powitalny” w inwentaryzacji rundy 1 i 2 to HIPOTEZA z grep, a nie wynik uruchomienia.

Kandydat (baza): c2749691b686f4ece6b2cb5e35b3438d0427c365 (origin/main). Inwentaryzacja: `grep -c` na plikach `gra/tools/*-live-test.cjs` (105 plików).

## Ustalenia o haku i bramce

- `gra/tools/_live-ready.cjs` eksportuje `prepareEndTurnGate`, który korzysta z `window.__nnsMeasureDebug` (`gateInfo`, `setPlayerTreasury`, `setPlayerGranary`). Wg raportu FC LIVEGATE (`dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/50-final-control-claude.md`) hak ten jest dostępny tylko pod `?civTest=1`.
- [KOREKTA r3] `forced-war-player-target-live-test.cjs` po przepięciu używa `?playtest=mapa&civTest=1`; `prepareEndTurnGate` działa bez zmian w `gra/src`. Strażnik `__nnsMeasureDebug` w `gra/src/main.ts` (blok civTest) zweryfikowano wierszem kodu w rundzie 3.
- [KOREKTA r3] Stan z rundy 1 ("0 trafień") był sprzed przepięć rundy 2. Obecnie `prepareEndTurnGate` jest w 3 testach *-live-test/real-render oraz w `live-nns-gate-smoke-test.cjs`.

## Inwentaryzacja (105 plików *-live-test.cjs)

Kolumna „blokuje ekran powitalny” to NIE ZMIERZONO dla każdego wiersza (wymaga uruchomienia testu). Kolumny closeCivWelcome i prepareEndTurnGate to liczba wystąpień w pliku wg grep. Tryb URL to parametry znalezione w pliku wg grep.

| plik | blokuje ekran powitalny | ma closeCivWelcome | ma prepareEndTurnGate | tryb URL (grep) |
|---|---|---|---|---|
| R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| ai-general-war-campaign-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| ai-trade-wiring-e2e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| ambush-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| army-auto-recruit-general-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| army-panel-general-label-multiselect-live-test.cjs | NIE ZMIERZONO | 3 | 0 | brak parametru w grep |
| autoclear-priority-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| battle-banner-retreat-overlap-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-damage-colors-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-hud-tempo-minimap-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| battle-large-return-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-manual-control-multicycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-manual-full-roster-pointer-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-manual-melee-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-manual-queued-order-lifecycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-pace-equal-line-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| battle-player-always-blue-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-save-disabled-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| battle-side-colors-3d-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| battle-skip-siege-parity-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=oblezenie |
| build-request-obywatele-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| city-clears-forest-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| city-founding-limit-greyed-fullgame-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| city-founding-limit-greyed-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| city-panel-refresh-at-turn-start-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| city-ro-loop-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| city-state-offensive-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| city-state-start-units-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa playtest=miasto |
| civ-music-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| civ-welcome-screen-brand-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| defeat-last-city-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| defeat-screen-summary-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplo-aggressor-marker-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplo-aggressor-ui-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplo-forced-peace-d2-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplo-nap-trust-30-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplo-peace-auto-stale-offer-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplo-respect-military-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplo-treaty-payment-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplo-truce-ai-table-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| diplo-truce-live-test.cjs | NIE ZMIERZONO | 2 | 0 | civTest=1 playtest=mapa |
| diplo-truce-saveload-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| diplo-war-peace-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplomacy-border-era-penalty-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplomacy-city-cession-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplomacy-direct-negotiation-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplomacy-relacje-ai-ai-audiencja-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplomacy-relation-deal-text-consistent-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplomacy-relation-value-mismatch-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| diplomacy-sensible-deals-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| diplomacy-trade-era-saveload-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| dyplo-mapa-odkrycie-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| dyplo-sojusz-widocznosc-ciagla-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| empire-recruit-all-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| empire-recruit-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| end-turn-block-event-live-test.cjs | NIE ZMIERZONO | 2 | 0 | civTest=1 |
| end-turn-gate-live-test.cjs | NIE ZMIERZONO | 2 | 0 | civTest=1 |
| era-change-toast-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| events-one-turn-lifetime-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| forced-war-iron-player-target-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| forced-war-player-no-contact-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| forced-war-player-target-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| forced-war-r9-no-auto-end-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| forced-war-trojstronna-domino-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa |
| fort-outpost-territory-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| hotseat-etap6d-podetap-a-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| hotseat-etap6d-podetap-b-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| hotseat-etap6d-podetap-e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| hud-zetony-ekonomia-brutto-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| improvement-build-highlight-lifecycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| improvement-growth-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| interaction-latency-vs-citycount-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| map-controls-behind-panels-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| march-multiturn-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| mgla-sciezka-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| minimap-viewport-rect-follow-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| minimapa-ikona-robotnik-kolor-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| minimapa-pasek-narzedzi-reorganizacja-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| open-panel-refresh-after-tech-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| perf-endturn-ai-phase-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-endturn-render-hud-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-endturn-render-progress-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-large-empire-stress-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-late-game-interaction-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-late-game-interaction-r2-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=stress |
| perf-long-session-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| praca-global-default-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| praca-pula-100-budynki-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| rebel-city-notification-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| rebel-protection-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| resource-ledger-realpath-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| saveload-hud-cache-hotseat-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| saveload-praca-pool-hotseat-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| saveload-praca-pool-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| scout-start-units-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| siege-auto-breach-replay-e2e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=oblezenie |
| siege-badge-zorder-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| siege-surrender-forecast-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| stadnina-kon-koszt-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| starting-army-first-city-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |
| test-hook-setcitylimit-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 |
| trade-route-remove-stock-flow-live-test.cjs | NIE ZMIERZONO | 0 | 0 | civTest=1 playtest=mapa |
| war-era-counter-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| war-rules-multiwar-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa |
| wyrab-wycinka-nazwa-live-test.cjs | NIE ZMIERZONO | 0 | 0 | brak parametru w grep |

## Podsumowanie grep

- Pliki z closeCivWelcome: 12 (army-panel-general-label-multiselect, diplo-truce-ai-table, diplo-truce, diplo-truce-saveload, end-turn-block-event, end-turn-gate, era-change-toast, forced-war-iron-player-target, forced-war-player-no-contact, forced-war-player-target, forced-war-r9-no-auto-end, forced-war-trojstronna-domino).
- Pliki z prepareEndTurnGate w *-live-test.cjs: 0.
- Pomiary PRZED/PO na ekranie powitalnym oraz pomiar poziomu maksymalnego w tym przebiegu: NIE ZMIERZONO.

## Runda 2 (obrona): pomiar PRZED/PO i inwentaryzacja grep

Kandydat obrony: 47dec7e3a. ZMIERZONO: forced-war-player-target-live-test.cjs (jedyny test przepięty w tej rundzie). PRZED = plik z 47dec7e3a bez zmian: rc=1, "fast-forward: endTurn #1 nie ustabilizował się". PO = przepięcie (?civTest=1 + prepareEndTurnGate przed endTurn w advanceTurnBySettledEndTurn i w kroku C): 12 pass, 0 fail, rc=0. NIE ZMIERZONO: sidepanel-diplo-* (plik o takiej nazwie nie istnieje; są sidepanel-diplo-dismiss-real-render-test.cjs), pozostałe testy przepięte, osobna mutacja czerwono-zielona (para PRZED/PO różni się całym zestawem zmian: civTest + przepięcie).

| plik | blokuje ekran powitalny | ma closeCivWelcome (liczba) | ma prepareEndTurnGate (liczba) | uwagi |
|---|---|---|---|---|
| R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| ai-general-war-campaign-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| ai-trade-wiring-e2e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| ambush-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| army-auto-recruit-general-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| army-panel-general-label-multiselect-live-test.cjs | NIE ZMIERZONO | 3 | 0 | grep; ekran NIE ZMIERZONO |
| autoclear-priority-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| battle-banner-retreat-overlap-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-damage-colors-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-hud-tempo-minimap-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| battle-large-return-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-manual-control-multicycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-manual-full-roster-pointer-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-manual-melee-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-manual-queued-order-lifecycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-pace-equal-line-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| battle-player-always-blue-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-save-disabled-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| battle-side-colors-3d-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| battle-skip-siege-parity-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| build-request-obywatele-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| city-clears-forest-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-founding-limit-greyed-fullgame-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-founding-limit-greyed-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-panel-refresh-at-turn-start-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-ro-loop-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-state-offensive-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| city-state-start-units-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| civ-music-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| civ-welcome-screen-brand-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| defeat-last-city-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| defeat-screen-summary-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-aggressor-marker-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-aggressor-ui-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-forced-peace-d2-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-nap-trust-30-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-peace-auto-stale-offer-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-respect-military-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-treaty-payment-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-truce-ai-table-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-truce-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-truce-saveload-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplo-war-peace-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-border-era-penalty-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-city-cession-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-direct-negotiation-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-relacje-ai-ai-audiencja-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-relation-deal-text-consistent-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-relation-value-mismatch-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-sensible-deals-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| diplomacy-trade-era-saveload-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| dyplo-mapa-odkrycie-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| dyplo-sojusz-widocznosc-ciagla-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| empire-recruit-all-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| empire-recruit-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| end-turn-block-event-live-test.cjs | NIE ZMIERZONO | 2 | 0 | grep; ekran NIE ZMIERZONO |
| end-turn-gate-live-test.cjs | NIE ZMIERZONO | 2 | 0 | grep; ekran NIE ZMIERZONO |
| era-change-toast-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| events-one-turn-lifetime-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| forced-war-iron-player-target-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| forced-war-player-no-contact-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| forced-war-player-target-live-test.cjs | NIE ZMIERZONO | 2 | 5 | ZMIERZONE: PRZED padl na endTurn #1, PO 12/0 (civTest + prepareEndTurnGate) |
| forced-war-r9-no-auto-end-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| forced-war-trojstronna-domino-live-test.cjs | NIE ZMIERZONO | 2 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| fort-outpost-territory-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| hotseat-etap6d-podetap-a-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| hotseat-etap6d-podetap-b-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| hotseat-etap6d-podetap-e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| hud-zetony-ekonomia-brutto-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| improvement-build-highlight-lifecycle-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| improvement-growth-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| interaction-latency-vs-citycount-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| map-controls-behind-panels-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| march-multiturn-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| mgla-sciezka-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| minimap-viewport-rect-follow-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| minimapa-ikona-robotnik-kolor-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| minimapa-pasek-narzedzi-reorganizacja-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| open-panel-refresh-after-tech-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-endturn-ai-phase-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-endturn-render-hud-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-endturn-render-progress-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-large-empire-stress-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-late-game-interaction-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-late-game-interaction-r2-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| perf-long-session-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| praca-global-default-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| praca-pula-100-budynki-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| rebel-city-notification-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| rebel-protection-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| resource-ledger-realpath-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| saveload-hud-cache-hotseat-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| saveload-praca-pool-hotseat-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| saveload-praca-pool-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| scout-start-units-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| siege-auto-breach-replay-e2e-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| siege-badge-zorder-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| siege-surrender-forecast-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| stadnina-kon-koszt-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| starting-army-first-city-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| test-hook-setcitylimit-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |
| trade-route-remove-stock-flow-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| war-era-counter-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| war-rules-multiwar-live-test.cjs | NIE ZMIERZONO | 0 | 0 | playtest=mapa; ekran NIE ZMIERZONO |
| wyrab-wycinka-nazwa-live-test.cjs | NIE ZMIERZONO | 0 | 0 | grep; ekran NIE ZMIERZONO |

## Runda 2 (R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1, baza 5c187d3be)

Pomiary wykonane na tym samym bundlu (src gry bez zmian względem c2749691b; zmieniono tylko pliki testów). Surowe wyjścia: `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1/logi/`. Czasy to wall-clock sesji (limit 280 s z dispatchu).

| Test | PRZED (rc, wynik, czas) | PO (rc, wynik, czas) | Dowód / zmiana |
|---|---|---|---|
| forced-war-player-target-live-test | rc=1, `endTurn #1 nie ustabilizował się`, 147 s (`PRE-forced-war-player-target.txt`) | rc=0, 12 pass / 0 fail, 364 s (`POST2-forced-war-player-target-full.txt`) | przepięcie na prepareEndTurnGate (z 5c187d3be). Pierwsza próba PO (`POST-forced-war-player-target.txt`) ubita timeoutem 285 s w A2, bez błędu gry. Przebieg PO przekracza limit 280 s |
| sidepanel-diplo-dismiss-real-render-test | rc=1, 33 pass / 4 fail (A6, A7, B6, B7: endTurn nie wykonał się), 286 s (`PRE-sidepanel-diplo-dismiss.txt`) | rc=0, 35 pass / 0 fail, 133 s (`POST-sidepanel-diplo-dismiss.txt`) | zmiana: `?civTest=1` + `prepareEndTurnGate` w `endTurnAndSettle` |
| era-change-toast-live-test (zamiast diplo-truce, patrz niżej) | rc=1, FAIL C/D/E: endTurn nie wykonany, komunikat „Nie można zakończyć tury. Spichlerz państwa…”, 144 s (`PRE-era-change-toast.txt`) | rc=1 na późniejszym etapie: C, D, E PASS (era 1→2, toast „Nowa epoka” widoczny); F: karta technologii pusta (`sections:0`), Escape timeout, 85 s (`POST-era-change-toast.txt`) | zmiana: `?civTest=1` + `prepareEndTurnGate` przed endTurn w sekcji C |

Wniosek: forced-war i sidepanel przechodzą z bramki „Zakończ turę” na dalszy etap (oba zielone po zmianie). era-change-toast przechodzi bramkę i zalicza sekcje C–E. Jego fail w F nie jest skutkiem tej zmiany: ta sama pusta karta technologii występuje już w PRE (`PRE-era-change-toast.txt`, sekcja F). Nie został zbadany w tej rundzie.

### Mutacja czerwono-zielona (sidepanel)

- Mutant: kopia testu z wyłączonym tylko wywołaniem `prepareEndTurnGate` (reszta, w tym `?civTest=1`, bez zmian): `MUTANT-sidepanel-bez-przepiecia.txt`, rc=1, 33 pass / 4 fail (A6/A7/B6/B7 jak w PRE).
- Przywrócony test (PO): rc=0, 35 pass / 0 fail. Czerwono→zielono potwierdzone na tym samym teście.

### Diplo-truce (odrzucony jako 3. test)

- PRZED: 27 pass / 1 fail. Fail w L2f–L2h: `endUntilTurn: nie osiągnięto tury 11`, stan tura 9, `inProgress:false` (`PRE-diplo-truce.txt`).
- Próba 1: zamknięcie okna Civpedia (`.civ-wiki-hub.open .wh-close`) w `endOneTurn`. Bez efektu, ten sam stan (`POST-diplo-truce.txt`).
- Próba 2: `prepareEndTurnGate` w `endOneTurn`. Bramka NNS zwraca `blokada:false`, ale `canEnd:false` (`POST2-diplo-truce.txt`, błąd „bramka … nadal zamknięta”).
- Diagnoza z `TRUCE_DEBUG=1` (`DEBUG-diplo-truce-blocker.txt`): po L2f0b gra wielokrotnie loguje `[EndTurn] blocked: preBattleOpen {pending:false}`. Blokadą jest otwarte okno PRZEDBITEWNE (`isPreBattleOpen()`), a nie bramka NNS. Hook `flushBattles` nie pomaga, bo wymaga `hasPendingAutoPreBattle()`. Zamknięcie wymaga nowego haka w `main.ts` albo rozstrzygnięcia okna przez test, poza zakresem tego tematu. Zmiany w `diplo-truce-live-test.cjs` cofnięto (plik wraca do stanu z 5c187d3be).

### Poziom maksymalny (zasada właściciela 2026-11-26)

- Żaden z trzech testów nie ustawia w sobie Dyplomacji, Kosztów jednostek, Kultury i religii ani rozmiaru mapy. Używają domyślnego bootstrapu `?playtest=mapa` (+ `civTest=1` tam, gdzie dodano). NIE ZMIERZONO na poziomie maksymalnym (Dyplomacja Trudna, Koszty jednostek Wysoki ×4, Kultura i religia trudny, największa mapa). W tych testach nie znaleziono parametrów URL ani haków do podniesienia tych ustawień.
- Poziomy „maksimum” wg kreatora gry (do zweryfikowania w osobnym temacie): Dyplomacja i wojna: Trudna; Koszty jednostek: Wysoki ×4; Kultura i religia: trudny.

### Inwentaryzacja (105 plików `*-live-test.cjs`)

Kolumna „blokuje ekran powitalny” jest wypełniona z kodu (grep), nie z uruchomienia:
- „NIE (kod: helper closeCivWelcome obecny)”: test wywołuje `closeCivWelcome`, więc ekran powitalny jest zamykany przed testem.
- „prawdopodobnie TAK (kod: ?playtest=mapa bez closeCivWelcome)”: test startuje na mapie playtest i nie zamyka ekranu. To hipoteza, nie wynik pomiaru.
- „NIE ZMIERZONO (kod: brak ?playtest=mapa)”: test nie używa tej ścieżki, brak danych.

Z grep: 105 plików; 55 z hipotezą „prawdopodobnie TAK”. Pełna tabela (plik | blokuje | closeCivWelcome | prepareEndTurnGate | civTest): `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1/logi/INWENTARYZACJA-grep-r2.txt`.

Uruchomione w tej rundzie: 4 testy live (forced-war, sidepanel, era-change-toast, diplo-truce). Pozostałe: NIE ZMIERZONO.

Kolumna `prepareEndTurnGate` w plikach testów: po zmianach tej rundy wystąpienia w 3 plikach (forced-war, sidepanel, era-change-toast). Pozostałe testy: 0.

## Runda 3 (obrona, zarzuty Evaluatora; kandydat 9d6b8e89f)

### Zarzut 1: poziom maksymalny (PRZYJĘTY, pomiar wykonany na ścieżce kreatora)

- Hak `window.__settingsLive` istnieje (`gra/src/main.ts`, blok `?civTest=1`, `startNewGame` = realny `doStartGame`). Poprzednie zdanie obrony rundy 2 „żaden test nie ma haka do podniesienia ustawień” było NIEPRAWDZIWE. Używa go 5+ testów `verify-live-*` (np. `verify-live-diplo-war-level-test.cjs`).
- Maksimum wg kreatora (`gra/src/ui/newGameFlow.ts`): Dyplomacja i wojna `trudna` (kary ×3, bonusy ÷3); Koszty jednostek `wysoki` (×4); Kultura i religia `trudny`; poziom trudności `Trudny` (`difficulty: 'hard'` w echo); rozmiar mapy: najwyższy w menu `Super Huge` (`ROZMIAR_MENU_LABELS` w `gra/src/map/generator.ts`). Max wzrostu surowców: „Wzrost surowców z epoką” to ustawienie WŁ./WYŁ., przyjęto WYŁ. (wartość domyślna, bez skali). Liczba przeciwników: w kreatorze `rivals` 2 (nie znaleziono wyższej wartości przy tej ścieżce).
- Runner: `gra/tools/live-playtest-gate-max-measure.cjs` (nowy plik, allowlista `live-playtest-gate-*.cjs`). Uruchomienie: `LIVE_WORK=<katalog poza repo> node tools/live-playtest-gate-max-measure.cjs`.
- Wynik (surowe: `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1/logi/MAX-live-playtest-gate-r3.txt`): echo ustawień potwierdza `diplomacyWarLevel: trudna`, `kulturaReligiaLevel: trudny`, `kosztJednostekPace: wysoki`, `difficulty: hard`. `prepareEndTurnGate` ustawia skarbiec 5000 i spichlerz 999 (gate nie jest przyczyną). Mimo to `canEnd: false` w turze 1.
- PRZYCZYNA (zmierzona, nie hipoteza): log konsoli gry: 10× `[EndTurn] blocked: awaitingFirstPlayerCity`. Przy świeżej grze z `startNewGame` gracz musi najpierw założyć miasto. Bramka skarbca/spichlerza nie jest tu blokadą.
- Wniosek: pomiar bramki na maksimum wymaga stanu z założonym pierwszym miastem (scenariusz `?playtest=mapa` to dostarcza, ale przy domyślnych ustawieniach). Połączenie: maksymalne ustawienia kreatora + założone miasto NIE ZOSTAŁO zmierzone w tej rundzie. Oznaczone NIE ZMIERZONO (do osobnego tematu: hak zakładania pierwszego miasta w civTest albo wywołanie akcji osadnika).
- Testy live objęte tematem (forced-war, sidepanel, era-change-toast) dalej działają na `?playtest=mapa` z domyślnymi ustawieniami tego scenariusza; ich przepięcie nie zmienia tego faktu.

### Zarzut 2: czas forced-war (PRZYJĘTY, wyjątek zgłoszony, test NIE skrócony)

- forced-war-player-target-live-test po przepięciu: 364 s (runda 2 operatora, `POST2-forced-war-player-target-full.txt`) i 457 s (pomiar Evaluatora, maszyna współdzielona). Limit z dispatchu: 280 s. Przekroczenie PRZYJĘTE i zgłoszone jako wyjątek limitu czasu. Skrócenie testu wymagałoby osłabienia kroków (zakazane) albo osobnego tematu (rozbicie scenariusza). Decyzję o wyjątku/rozbiciu podejmuje orkiestrator.

### Zarzut 4: era-change-toast, sekcja F i Escape (PRZYJĘTY, przyczyna NIEZBADANA)

- PRE (`logi/PRE-era-change-toast.txt`): C/D/E FAIL (bramka); Escape OK, ale karta technologii pusta (`sections:0`), więc wynik Escape w PRE jest wątpliwy.
- PO (`logi/POST-era-change-toast.txt`): C/D/E PASS; F FAIL (`sections:0`, jak w PRE); Escape FAIL; TimeoutError na `[data-act=tree]`.
- Przyczyna FAIL Escape w PO NIE ustalona. Nie twierdzę, że jest to wyłącznie skutek sekcji F. Era-change-toast NIE jest zaliczany jako test zmieniający wynik PRZED→PO w całości (zmienia się tylko do sekcji E).

### Zarzut 3: sprzeczne sekcje (PRZYJĘTY)

- Dokument oznaczony na początku (STATUS); sekcje rundy 1 i obrony rundy 2 oznaczone jako nieaktualne i skorygowane w miejscach sprzecznych (patrz wyżej).
- Kolumna „blokuje ekran powitalny” = hipoteza z grep (55 „prawdopodobnie TAK”), nie wynik uruchomienia.

### Zarzut 5: pełne bramki (uruchomione przez obronę, patrz raport 30-obrona-claude.md)
