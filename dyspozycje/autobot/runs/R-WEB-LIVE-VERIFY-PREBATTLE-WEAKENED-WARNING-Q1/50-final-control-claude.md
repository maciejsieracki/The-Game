STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1
GOAL: zmierzyc na zywo (Chromium, realny atak z mapy) ostrzezenie o oslabieniu w oknie przed bitwa: glod wojska, deficyt zlota, brak kary, strona barbarzyncow, mieszczenie w viewport, zrzuty.
ZMIANY/COMMIT: kandydat 04706c109 jest potomkiem 807ecebdd (faktyczny origin/main). Naglowek zadania podaje baze fee3c17c9, ktora NIE jest przodkiem kandydata (starsza) - diff liczony vs 807ecebdd. Diff: 20 plikow, wylacznie gra/tools/live-verify-prebattle-weakened-q1.cjs + runs/<ID>/** (raporty, evidence, shots). gra/src, gra/data, wikiBundle, balans, WERSJE.md nietkniete. Allowlista OK. git diff --check czysty. Ten raport: commit nad 04706c109.
TESTY (wlasne, surowe wyjscie):
- tsc --noEmit: exit 0.
- build poza repo: vite build --outDir /tmp/civ-pbfc-dist OK (29,85 s).
- narzedzie z kandydata w Chromium (/opt/pw-browsers/chromium, HTTP): SUMMARY total 92, failed 0, exit 0; 8/8 przebiegow: turnAfterEnd=2, selectionMethod=klik (bez fallbacku haka), victoryOverlayRemoved=[] (hak suppressVictory dziala), pageErrors 0.
- none: brak .pb-weak (1280x800, 1024x640). hunger: "Oslabieni: glod wojska -25% (poza pancerzem)", strona pb-you. gold: "deficyt zlota -25%", pb-you. hunger-stack (12 jednostek): glod -25%, 8 widocznych + "+N wiecej", w viewport. Strona foe bez ostrzezenia we wszystkich. Karta .pb-weak h=139 (1280) / 152 (1024), w viewport.
- Zrzuty wlasne obejrzane (hunger-1024x640, none-1280x800): pokazuja okno "Rozstawienie bitwy" (nie ekran ZWYCIESTWO); ostrzezenie w karcie dowodcy gracza tylko w scenariuszu z kara.
- Bramki referencyjne logic/tech-tree/research/unit-replace/combat: nieuruchamiane - diff nie dotyka gra/src ani gra/data.
ZARZUTY: 1 (zrzuty z ZWYCIESTWO) ODDAL - naprawione. 2 (zly element pomiaru) ODDAL - mierzona karta .pb-weak i jej rodzic .pb-cmd. 3 (strona barbarzyncow) ODDAL - foeHasWeak=false w 6/6 przebiegow z kara, DOM po ataku z mapy. 4 (brak asercji/kodu wyjscia) ODDAL - asercje z econ-params (0,75 -> 25%), kod wyjscia 1 przy bledzie. 5 (klik/flagi/turnAfterEnd) ODDAL z adnotacja - klik 8/8, turnAfterEnd=2 8/8 (u mnie tez); zrodlo kary wnioskowane z roznicy none vs hunger/gold i tekstu, flag isArmyHungry/isGoldDeficit nie odczytano. Zadnego NAPRAW; zadnej decyzji czlowieka.
BLOKADY: brak. NIE_ZMIERZONO: odczyt flag kary w silniku; karta wyzsza niz viewport (przewijanie, FALA 711); kara po stronie barbarzyncow/AI (zmierzono tylko brak ostrzezenia po ich stronie); przyczyna pierwotnego turnAfterEnd=1 w run3.
UWAGI-DLA-ORKIESTRATORA: (1) W oknie przed bitwa w karcie dowodcy widac surowe ID "Matrix:walka_atak_piechota" / "Matrix:walka_pancerz_piechota" oraz "plytkie_morze" w tytule - potencjalny defekt R-WEB-UI-RAW-IDS (poza zakresem, nie naprawiano; moze byc artefaktem mapy testowej). (2) Obrona zglosila, ze przy 12 jednostkach w 1024x640 dolna lista wojsk gracza jest przyslonieta oknem "Rozstawienie bitwy" - kandydat na osobny temat UI. (3) Naglowek zadania: baza fee3c17c9 != origin/main 807ecebdd.
RUNDY: FC 1/1 (temat: runda 1/5, obrona r1 przyjeta).
NASTEPNY KROK: integracja (tylko narzedzie + dokumentacja, bez deployu gry); sprzatanie worktree.
DEPLOY/PUSH: NIE WYKONANO
