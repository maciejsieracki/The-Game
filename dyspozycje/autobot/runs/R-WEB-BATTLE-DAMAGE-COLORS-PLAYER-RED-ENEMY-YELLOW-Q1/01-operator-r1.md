STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DAMAGE-COLORS-PLAYER-RED-ENEMY-YELLOW-Q1
GOAL: Na polu bitwy straty GRACZA = czerwone, straty PRZECIWNIKA = żółte (pływające liczby obrażeń, ekran wyniku „Twoje straty"/„Straty wroga", szczegóły bitwy zniszczonych jednostek). Kolory w jednym miejscu (tokeny w battleHudTheme.ts).
BAZA: origin/main = bb92c8c90 (po BATTLE-SKIP); worktree wf_890a1f08-cac-1 od tej bazy.
ZMIANY/COMMIT:
  - gra/src/battle/battleHudTheme.ts: tokeny BATTLE_LOSS_PLAYER (#e5484d), BATTLE_LOSS_PLAYER_TEXT (#ff7070), BATTLE_LOSS_PLAYER_BG, BATTLE_LOSS_ENEMY (#ffd54a), BATTLE_LOSS_ENEMY_TEXT (#ffd54a), BATTLE_LOSS_ENEMY_BG; funkcja battleLossTextColor(isPlayerUnit).
  - gra/src/battle/battleScene.ts: _spawnDamageLabel kolor wg _isPlayerSide(ru.side) (wcześniej stały #ff4444).
  - gra/src/battle/manualBattle.ts: _spawnDamageLabel ru.side === 'player' ? czerwony : żółty (wcześniej #ff4444) + import tokenów.
  - gra/src/battle/endScreen1E.ts: „Twoje straty" = BATTLE_LOSS_PLAYER_TEXT (czerwony), „Straty wroga" = BATTLE_LOSS_ENEMY_TEXT (żółty) (wcześniej niebieski/czerwony).
  - gra/src/ui/postBattleSummary.ts: zniszczona jednostka, obwódka/tło i tekst straty wg strony (gracz czerwony, przeciwnik żółty).
  - gra/tools/battle-damage-colors-test.cjs: NOWY test strukturalny (27 checków, w tym kontrast WCAG).
  Poza zakresem (NIE ZMIENIANE): kolory stron na mapie, jednostkach 3D i kartach dowódców (tożsamość strony, nie straty); pasek „after" HP w szczegółach (pozostałe HP, nie straty); znacznik „-dmg (mur)" pomarańczowy (straty muru); zielony pasek HP nad jednostką.
  Zakazy nienaruszone: brak zmian WERSJE.md, gra-robocza/, brak build/dev, brak git add -A, brak push/deploy.
TESTY:
  - node gra/tools/battle-damage-colors-test.cjs: 27 PASS / 0 FAIL, exit 0.
  - Kontrast WCAG (liczony w teście): czerwony gracz 6.14–7.22:1, żółty przeciwnik 11.69–13.76:1 na tłach #0a0d14, #12202e, #1a1a1a (próg AA 4.5).
  - tsc --noEmit --ignoreDeprecations 6.0 (bez node_modules): brak błędów w nowych tokenach i linijkach; pozostałe błędy (TS2307 i implicit any z braku node_modules, np. three) są środowiskowe.
  - Regresje: r-bitwa-kolory-gracz-przeciwnik-q1-test PASS (26); r-bitwa-etykieta-tozsamosc-strony-zrodlo-test PASS (38); end-details-hp-test PASS 5/5.
  - bitwa-podsumowanie-dispose-test: NIE_ZMIERZONO, brak node_modules/esbuild w worktree (build zakazany w gra/).
  - Wizualna weryfikacja w Chromium (liczby obrażeń, ekran wyniku): NIE_ZMIERZONO, brak buildu vite (zakaz npm run build/dev w gra/).
BLOKADY: brak node_modules w worktree (środowisko); wizualny dowód w grze NIE_ZMIERZONO.
ZAŁOŻENIA (luki w dispatchu rozstrzygnięte przez operatora):
  1. „Paski utraconego HP" rozumiane jako tekst i obwódka strat w szczegółach bitwy (postBattleSummary). Pasek „after" (pozostałe HP) zostaje w kolorze strony, bo to nie są straty.
  2. Kolor strat zależy od strony jednostki (gracz/przeciwnik), nie od strony z kamery. W AI-vs-AI „gracz" = playerControlSide z BattleScene, jak w reszcie UI.
  3. Odcienie: #ff7070 (tekst gracza, już używany w szczegółach) i #ffd54a (żółty z ROUTED/morale). Bez nowych magicznych wartości w logice.
  4. Obwódki i tła strat w endScreen1E i postBattleSummary są zapisane jako rgba literały obok tokenów BG (zgodnie z istniejącym stylem tych plików). Tekst i kolory liczb idą z tokenów.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kod + test strukturalny). Wizualna weryfikacja w Chromium po buildzie w środowisku z node_modules (NIE_ZMIERZONO tutaj).
DEPLOY/PUSH: NIE WYKONANO
