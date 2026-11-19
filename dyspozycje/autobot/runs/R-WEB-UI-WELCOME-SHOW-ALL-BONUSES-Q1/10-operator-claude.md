STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-WELCOME-SHOW-ALL-BONUSES-Q1
GOAL: Ekran powitalny nowej cywilizacji pokazuje WSZYSTKIE pozycje Plusy/Minusy bez „+ N więcej (najedź…)” i bez tooltipu.
ZMIANY-COMMIT: baza df20918b3; gra/src/ui/civWelcomeScreen.ts (listHtml bez limitu, usunięte cww-more, karta flex: .cww-body przewija się wewnątrz, stopka z przyciskami zawsze widoczna), gra/src/ui/civWelcomeLogic.ts (usunięte WELCOME_VISIBLE_PLUSES/MINUSES), gra/tools/civ-welcome-screen-test.cjs (sekcja 8: asercje źródłowe + argv[3] na kopię do mutacji), zrzuty w runie. Commit: SHA w polu sha.
TESTY: tsc --noEmit exit 0; logic-test LOGIC OK 213/213; tech-tree 20/0; research 33/0; unit-replace-test 21/21; ai-unit-replace-same-rules 45/0; combat 6/6; civ-intro-texts OK; civ-names 109/0; civ-welcome-screen-test OK 316 asercji. Mutacja (kopia z przywróconym ucinaniem): FAIL 5 asercji, exit 1. Chromium (google-chrome, build harnessu Vite poza repo, realny civWelcomeScreen.ts): rzymianie 1280x720 = Plusy 4 li, 0 .cww-more, 0 „więcej”/„najedź”; grecy (max plusy 11) 1280x720 i 480x800 = 11 li; zulusi (max minusy 6) = 6 li; przyciski widoczne (bottom 686/720, 766/800), docW = viewW (brak poziomego scrolla), błędy stron 0. Długie listy przewijają się w .cww-body (grecy: scrollH 773 > clientH 524). Gra w pełnym buildzie nie uruchamiana: NIE ZMIERZONO brand-live.
BLOKADY: brak. Konflikt z R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1 nieobserwowany: nie ruszano startDiplomacyMusic/stopDiplomacyMusic.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu i zrzutów; ewentualne uwagi do wdrożenia po Final Control.
UWAGI-DLA-ORKIESTRATORA: wzorzec „+ N więcej (najedź…)” nie występuje w gra/src poza usuniętym miejscem (grep „więcej (”, „najedź”, „aby zobaczyć”: pozostałe trafienia to nie ukrywanie treści: cityPanel.ts:6628, :10117-10122; buildModeHud.ts:187,200; empireDetailPanel.ts:3984). Test źródłowy sprawdza tylko civWelcomeScreen.ts.
DEPLOY/PUSH: NIE WYKONANO
