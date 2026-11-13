STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1
GOAL: Plakietka oblezenia ZAWSZE pokazuje liczbe tur do poddania sie miasta (odmiana PL, tooltip, "—" gdy zapasy nie male), bez zmiany logiki kapitulacji.

ZMIANY/COMMIT: SHA w komunikacie zwrotnym orkiestratora (commit tej rundy, jawny git add; PUSH NIE).
- NOWY gra/src/game/siege-surrender-forecast.ts: czyste turnsUntilSiegeSurrender(city, ctx), siegeConsumptionPerTurn, pluralTurPl, siegeSurrenderBadgeText, siegeSurrenderTooltip.
- gra/src/main.ts (tylko dane/render plakietki: refreshSiegeHtmlLabels/updateSiegeHtmlLabels): linia "poddanie za N tur" w .civ-siege-html-label, tooltip, odswiezanie co klatke gdy zmienia sie tekst; hak testowy __siegeBadgeTestDebug wylacznie przy ?civTest=1.
- NOWE testy: gra/tools/siege-surrender-forecast-test.cjs, gra/tools/siege-surrender-forecast-live-test.cjs.
- Dowody: evidence/*.png (po ~205 KB, <=300 KB, paleta 48 kolorow).
Poza allowlista: brak zmian.

POMIAR PRZED: plakietka = main.ts refreshSiegeHtmlLabels (klasa civ-siege-html-label, tekst "OBLEZENIE" + nazwa miasta); widocznosc: kazde city.oblegane (wlasne i wroga) - bez zmian. Zuzycie oblezonego miasta/tura = ludnosc + garnizon (turn-economy.ts, podloga 0); liczba oblegajacych NIE wplywa (potwierdzone testem). Kapitulacja: zapasy<=0 -> pending, nastepny koniec tury -> przejecie.
NIE_ZMIERZONO: osobny wplyw spichlerza/handlu/Milicji (prognoza bierze biezace zapasy z getCityFood i odswieza sie co klatke); osobny test hot-seat per fotel i mgly wojny (widocznosc bez zmian wzgledem dotychczasowej plakietki).

SEMANTYKA: pending -> 1 ("poddanie za 1 ture"); zapasy M>0, zuzycie Z>0 -> ceil(M/Z)+1; zapasy 0 bez pending -> 2; zuzycie 0 -> null ("poddanie: —").

TESTY (logi gate-*.txt, kazdy z linia EXIT=):
- gate-red.txt EXIT=1 (RED: brak modulu).
- gate-unit.txt EXIT=0: 56/56 (jednostkowe, symulacja 360 scenariuszy == prognoza, odmiana PL, 8/8 mutacji wywraca testy, round-trip zapisu).
- gate-live.txt EXIT=0: 10/10 Chromium (?civTest=1, prawdziwy render, realny endTurn).
- gate-tsc.txt EXIT=0 (tsc --noEmit czysty).
- Regresje: gate-regresje-przed-9-niezielonych.txt (9 niezielonych PRZED: hud-moc-warstwa, hud-obywatele-chip, hud-skarbiec, hud-tooltip-body-mounted-panels, sidepanel-hud-deadzone, siege-blockade-no-recruit-reinforce, siege-tower-breach-everywhere, tech-discovery-badge-diorama, trade-routes-hud-filter) vs gate-regresje-po.txt: te same 9 niezielone PO, zero nowych; reszta EXIT=0.
- git diff --check: czysto.

BLOKADY: brak. 9 niezielonych regresji istnieje na main przed zmiana (dlug poza zakresem).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (runda 1); po wdrozeniu orkiestrator notuje REPIN Rust (plakietka oblezenia, UI).
DEPLOY/PUSH: NIE WYKONANO
