STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1
GOAL: Panel WYDARZENIA: zakladki Dyplomacja / Wazne / Inne zamiast chipa "Inne cyw."; przycisk "Zamknij wszystkie informacyjne" nad zakladkami; usuniecie szumu u zrodla; logika gry bez zmian.
(Plik zapisany pod sciezka z zadania `01-operator-r1.md`; to jest RUNDA 2/5 po FC R1 = FAIL. Pierwotny raport R1: `01-operator-r1-pierwotny-runda1.md`.)

ZMIANY/COMMIT: SHA w sekcji "COMMIT" na dole. Baza: `29e662e2e` (kod R1 `28ad61e50`) + merge `origin/main` d3e88b7d9 (czysty).
- `gra/src/ui/sidePanelEventTabs.ts`: eventTabOf przepisany: normalizacja (male litery, bez diakrytykow, ł->l), granica POCZATKU wyrazu (`armi` nie pasuje do `farmie`), kolejnosc: kind/origin/tytul Dyplomacja -> blokujace/enemy -> propozycje/audiencje (Dyplomacja) -> braki ("brak srodkow/pokrycia/zasobow", deficyt, wyczerpany) (Wazne) -> frazy dyplomatyczne bez prefiksu (Pokoj zawarty, Rozejm, Zerwano traktat, Pokoj z:, wypowiada wojne/Wypowiedzialles wojne, sojusz, trybut) -> zagrozenia (magazyn, oblezenie, kapitulacja, glod, armia, wrog, bunt, strata, zniszczenie) -> Inne.
- `gra/src/ui/sidePanelEventFilter.ts`: `isHiddenAiAiEvent`, `relevantInfoEvents`, `tabCountsOf`.
- `gra/src/ui/sidePanelHud.ts`: (3) "Zamknij wszystkie informacyjne" i licznik naglowka wracaja do dotychczasowego zakresu = bez ukrytego handlu AI<->AI (jak dawny chip OFF); w zakladce Dyplomacja handel AI<->AI jest widoczny i objety; zakladka domyslna nie liczy AI<->AI; CSS zakladek: etykieta z ellipsis + licznik `flex:none` (koniec nachodzenia "Dyplomacja 2"), pasek ciasniejszy (R4 cutoff).
- `gra/src/game/eot-event-defer.ts`, `gra/src/main.ts` (~24754): tylko komentarze o chipie "Inne cyw.". `main.ts`: dodany odczytowy hak `__sidePanelLinkTestDebug.allEvents` (pomiar). Brak zmian logiki gry w tej rundzie.
- Testy: NOWY `sidepanel-event-tabs-classify-test.cjs` (52 przypadki z REALNYCH tekstow main.ts + negatywy + 9 mutacji); `sidepanel-events-toolbar-test` (+zakres Zamknij/naglowek), `sidepanel-notification-tabs-test`, `sidepanel-hud-deadzone-test` (klik nieaktywnej zakladki + powrot na Wazne), `sidepanel-event-header-wydarzenie-real-render-test` (karta Dyplomacja mierzona po przelaczeniu zakladki), `wyrab-wycinka-nazwa-live-test` [11] (oczekiwane uzycia 3 -> 1; dwa zniknely z gra/src z przelacznikami automatu, ODDAL zalatwiony).
- Narzedzia: `gra/tools/notif-live-measure.cjs`, `notif-live-summarize.cjs`, `notif-live-shots.cjs`.

TESTY (logi `dowody/gate-*.txt` z linia EXIT=):
- RED-first: klasyfikator R1 na nowych testach = 28 FAIL (`gate-classify-RED-r1.txt`); nowy = PASS, 9/9 mutacji wykrytych (M1 diakrytyki, M2 granice slow, M3 braki, M4 frazy dyplomacji, M5 kolejnosc, M6 zagrozenia, M7 "wrog", M8 kind/origin, M9 default).
- tsc --noEmit EXIT=0. toolbar 25/0, tabs 29/0, classify PASS, wyrab-wycinka 49/0, eot-diplomacy-header 19/19, eot-event-defer 43/43, events-defer-to-turn-start 40/0, events-one-turn-lifetime 25/0, important-event-cards (10/0 i regression PASS), elimination-toast-merge 56/0, capture-event-retention PASS, side-panel-event-link 37/0, end-turn-modal-sequencing 41/0, hud-* (13 plikow) zielone.
- ai-test: 274 pass / 20 fail = IDENTYCZNIE jak baza `origin/main` (`gate-ai-test*.txt`).
- Real-render (Chromium, vite build POZA repo `/tmp/civ-notif-out-final`): deadzone 43/0; diplo-dismiss 35 OK EXIT=0; header-wydarzenie 23/0 (baza 23/0; R1 byl TypeError); blocking-card-cutoff 46/1: jedyny fail C3 ("Otworz ->" timeout klikniecia) identyczny na bazie (baza 45/2: BB6+C3, flaky timeouty srodowiska); R4 (czerwony przy 1. wersji CSS) zielony po zacisnieciu paska.
- Czerwone tak samo na bazie (nie ze mnie): era-change-toast-defer, hud-moc-warstwa, load-fail-toast-zindex (12/3). Infra: hint-toast-zindex (timeout), end-turn-input-stability (brak chromium dla playwright), end-turn-gameplay-runtime (wymaga WORLD_GEN_DIST) — NIE_ZMIERZONO.

POMIAR PRZED/PO (realna gra, Chromium, `?civTest=1`, realny endTurn, 30 tur, ziarna 18 i 7, odczyt pelnej listy `collectTurnEvents` po kazdej turze; pliki `pomiar-*.txt`, `dowody/*.jsonl`):
- PRZED: seed 18: 63 wpisy informacyjne / 30 tur (2,10/ture, max 4); seed 7: 58 (1,93/ture, max 4). Skladniki: "Auto ulepszenia: N× (−Praca)" 30+22 wystapien (kazda tura), "Wycinka: +N Drewna" 27+16+3+1, "Auto ulepszenie: Trzoda/Farma @" 5+3, "Nowy szlak handlowy" (toast+karta) 1+1+1+1, Granice naruszone (diplo) 5, Automatycznie obnizono racje 1+1, edu "Doswiadczeni wojownicy" 2.
- PO: seed 18: 2 wpisy (0,07/ture); seed 7: 3 (0,10/ture). Zero usunietych typow w panelu; kazdy pozostaly w jednej zakladce: Granice naruszone -> Dyplomacja, obnizone racje -> Wazne.
- Inne szumiace komunikaty (ocena): "Wzrost populacji w N miastach" = 0 wystapien w panelu (toast chwilowy, nie wpis) -> BEZ zmiany; "Dobra wola", "Lupy", "Miasto-panstwo wchloniete" = 0 wystapien w 60 turach (zdarzenia rzadkie/akcje gracza) -> zostaja, klasyfikacja: Inne. "Granice naruszone" (do 5/30 tur) niesie utrate Zaufania -> zostaje (Dyplomacja). Tylko ziarna 18 i 7, brak wojny/oblezen w tych 30 turach: kategoria Wazne w grze potwierdzona zrzutem z seedem realnych tekstow, nie samoistnie.
- Zrzuty z ZYWEJ gry: `zrzut-live-zakladka-{wazne,dyplomacja,inne}.png`, geometria `live-shots-geometry.json` (przycisk nad zakladkami, brak nachodzenia licznika, h zakladek 18 px).

BLOKADY:
- NIE_ZMIERZONO: end-turn-input-stability, end-turn-gameplay-runtime, hint-toast-zindex (srodowisko, patrz wyzej); sidepanel-event-przekierowania-real-render (fixture "Nowy szlak" zostaje).
- Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle.

ZALOZENIA (bez pytan ABC): "Zamknij wszystkie informacyjne" = zakres sprzed zakladek: informacyjne bez ukrytego handlu AI<->AI, wiec w zakladce Dyplomacja takze AI<->AI; blokujace nie sa zamykane masowo. Badge zakladki Dyplomacja liczy tez AI<->AI (to, co zobaczysz po kliknieciu), naglowek nie.

RUNDY: 2/5 (po FC R1 = FAIL)
NASTEPNY KROK: Evaluator, potem Final Control; integracja po PASS.
DEPLOY/PUSH: NIE WYKONANO

COMMIT: kod+testy+raport 8a3f29ba7 (baza 29e662e2e + merge origin/main d3e88b7d9). Push: NIE.
