STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1
GOAL: panel "Rekrutacja — cała cywilizacja" wewnątrz panelu armii nad wodzem; przycisk REKRUTACJA usunięty z górnego menu; brak osobnego okna.
ZMIANY/COMMIT: kandydat 6ce1183ef (kod końcowy 05f649925; potomek bazy 50f607fe3: merge-base --is-ancestor OK). Do integracji: SHA commita raportu FC (potomek 6ce1183ef). `git merge-tree --write-tree origin/main 6ce1183ef` (origin/main = b97287c88): bez konfliktów. diff --check czysty. Poza allowlistą: brak.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Regresja po wczytaniu/nowej grze (KRYTYCZNY): ODDAL (naprawione obroną). resetEmpireRecruitPanelSession nie zeruje panelCfg; empire-recruit-all-live-test 29/0 (w tym zapis/wczytanie L15-L19).
2. Licznik/komunikat po "Rekrutuj wszystkie": ODDAL (naprawione: liveHost). all-live L13 PASS. Komunikat w DOM nie asertowany osobno (NIE_ZMIERZONO); z kodu: render na podłączonym hoście.
3. Proces testów live: ODDAL. Uruchomione przeze mnie: all-live 29/0, army-auto-recruit-general-live 17/0, map-controls-behind-panels-live exit 0. live-verify-w18-w24 nie zmieniony przez kandydata (NIE URUCHOMIONO).
4. map-controls: wiersz "rekrutacja-imperium" = N/A (panel samodzielny nie istnieje). Sekcja leży w panelu armii, wiersz "armia" mierzony i OK. ODDAL jako dług testu (martwy wiersz), nie blokuje.
TESTY (surowe, własne uruchomienie): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0; empire-recruit-in-army-panel 13/0 (live, Chromium przez HTTP); empire-recruit-all 31/0; affordability 17/0; empire-recruit-live 23/0; no-inner-scroll 18/0; real-render 29/0; army-auto-recruit-general-ui 11/0; hud-topbar-layout-a 144/0; hud-topbar-one-row 140/0; hud-panels-below-banner 130/0. Zrzut operatora (armia-rekrutacja-na-gorze.png) obejrzany: sekcja na górze panelu armii, brak przycisku w pasku. Mutant panelCfg=null: wg Obrony czerwony (nie powtarzany).
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) usunąć martwy wiersz rekrutacja-imperium z map-controls-behind-panels-live-test; (b) cztery testy hud-* nadal przekazują nieużywane onOpenEmpireRecruit (nieszkodliwe); (c) Civpedia/poradnik: nie sprawdzano wzmianek o przycisku REKRUTACJA; (d) potrzebna REPIN Rust UI; (e) integrując na origin/main (b97287c88) zrób merge i ponów tsc.
RUNDY: FC 1/5
NASTĘPNY KROK: integracja orkiestratora, build poza repo, deploy ROBOCZA wg zasad.
DEPLOY/PUSH: NIE WYKONANO
