STATUS: PASS-WITH-NOTES (kod + statyczny test + bramki liczbowe; brak zrzutów Chromium)
DOMAIN: GAME (UI/render bitwy)
TEMAT: R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1
GOAL: w widoku 3D bitwy gracz = niebieski (#3a6ad0), przeciwnik = czerwony (#c84040), niezależnie od roli (atakujący/obrońca) i oblężenia.
ZMIANY-COMMIT: gra/src/battle/battleScene.ts (13 dodań, 9 usunięć); gra/tools/battle-side-colors-3d-test.cjs (nowy).

ZNALEZIONE ELEMENTY 3D STRON I DECYZJE
1. Pasek/obwódka jednostki (makeUnitBars, sideColor): już niebieski/czerwony wg playerSide. ZOSTAWIONY wynik; źródło koloru ustawione na tokeny BATTLE_PLAYER/BATTLE_ENEMY (ta sama wartość hex).
2. Model jednostki (buildUnitModel: pasy, tarcze, chorągwie, grzebienie w units.ts): tint z bu.ownerColor, czyli atakujący 0xffd54a (złoto = żółty znacznik z dispatchu), obrońca 0xc84040. ZMIENIONY w 4 miejscach tworzenia modeli 3D bitwy (obrońcy na placeOne, mur oblężniczy, _placeUnitsOneSide/ambush, reset jednostek). Tint = sideColor(strona, playerSide). Efekt: gracz niebieski w obu rolach, przeciwnik czerwony.
3. Zastępczy awatar (makeFallbackAvatar): ten sam tint, ZMIENIONY w 4 miejscach.
4. Pierścień/obwódka grupy (0xffd700: ringColor ~l.19827, mat.color ~l.20851, deploy outline ~l.17724): znaczniki GRUPY/ustawiania, nie strony. ZOSTAWIONY (do decyzji właściciela).
5. Złoto w HUD (BATTLE_GOLD) i licznik „Ty/wróg”: nie są znacznikiem 3D strony. ZOSTAWIONY.
6. Kolory cywilizacji na mapie świata / mundury: nietknięte (civ-visual.ts, render/cities.ts, palety units.ts).
7. Minimapa bitwy: nietknięta (osobny temat wg dispatchu).
8. Wieża/strzelec syntetyczny (ownerColor 0xc84040, ~l.4337): pozostawiony, to rola obrońcy w danych.
9. Kontrakt roli: bu.ownerColor pozostaje tokenem roli w danych, bo battleScene.ts (~l.7853/7871, civ-bonusy: bu.ownerColor === 0xc84040) i mapFieldBattle.ts / main.ts przekazują go jako identyfikator strony. main.ts poza allowlistą, nie zmieniano.

TESTY
- npm ci --ignore-scripts w gra/ (71 pakietów, EXIT 0). Bez npm run build/dev.
- npx tsc --noEmit: EXIT 0 (bez błędów).
- node tools/battle-side-colors-3d-test.cjs (nowy): EXIT 0, "OK (A: tokeny i sideColor dla atk/def, B: 4 modele + 4 awatary z kolorem strony, C: kontrakt roli)".
- node tools/battle-tempo-minimap-brand-test.cjs: EXIT 0, "OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)".
- node tools/battle-hp-display-test.cjs: EXIT 0, "PASS — 7 / 7".
- node tools/battle-damage-colors-test.cjs: EXIT 0, "WYNIK: 28 PASS / 0 FAIL".
- git diff --check: czysto. git diff --stat: 1 plik src (battleScene.ts) + 1 nowy test.
- Mutacja: NIE ZMIERZONO na żywo. Z logiki testu: test B pada, gdy bu.ownerColor wraca do buildUnitModel/makeFallbackAvatar; test A pada, gdy sideColor zwróci 0xffd54a lub zamieni strony.
- Kryterium (b), żywy Chromium xvfb, ≥4 zrzuty: NIE ZMIERZONO (brak uruchomionej przeglądarki w tej rundzie).
- Dług Rust (e), REPIN palety stron 3D: do dopisania przez orkiestratora.

BLOKADY
- W gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 nie istnieje 00-dispatch-DODATEK-claude.md (sprawdzone git ls-tree). Dispatch 00-dispatch.md istnieje tylko na tej gałęzi, nie na origin/main. Lukę rozstrzygnięto ZAŁOŻENIEM: zakres = 00-dispatch.md.
- Brak zrzutów Chromium (patrz NIE ZMIERZONO).

RUNDY: 1/5 (wynik PASS-WITH-NOTES)
NASTĘPNY KROK: Evaluator (SONNET): weryfikacja diffu i testu; potem FC; zrzuty Chromium dla kryterium (b) jako osobny krok.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA
- Polecenie "Zadaj pytania ABC" nie zostało wykonane przez Operatora: pytania do właściciela zadaje orkiestrator (kanał właściciela = główny czat, C-043). Pytania ABC do przekazania:
  A) Szaty jednostek (pasy/tarcze/chorągwie) w kolorze strony. OPCJA REKOMENDOWANA (zaimplementowana): niebieski gracz / czerwony przeciwnik. Alternatywa B: zostawić złoto dla atakującego jako szatę cywilizacyjną, zmienić tylko pasek i obwódkę.
  B) Pierścienie grupy 0xffd700 (ringColor, deploy outline): zostawić złote (REKOMENDOWANE, to znacznik grupy, nie strony) czy przestawić na kolor strony?
- Pliki poza repo (nie wchodzą do commita): /home/user/The-Game/.claude/worktrees/wf_4e93638e-287-1-npmci.log (log npm ci), /home/user/The-Game/.claude/worktrees/wf_4e93638e-287-1-battle-*.out (wyjścia testów), /tmp/unused (wyjście tsc, pusty; zapisane w /tmp wbrew zasadzie scratchpad). Do sprzątnięcia przez orkiestratora.
- gra/node_modules zainstalowany w worktree (ignorowany przez git). Do usunięcia przy sprzątaniu worktree.
