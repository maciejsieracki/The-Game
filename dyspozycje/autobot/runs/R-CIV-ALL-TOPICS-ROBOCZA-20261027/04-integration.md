STATUS: DEPLOYED — REMOTE-READBACK-PASS
DOMAIN: GAME
TEMAT: R-CIV-ALL-TOPICS-ROBOCZA-20261027
GOAL: Opublikować zatwierdzony, ograniczony pakiet testowy Robocza na aktualnym main.
READY_FOR_DEPLOY: WYSTAWIONE przez orkiestratora po Final Control PASS-WITH-NOTES i weryfikacji exact package.
ŹRÓDŁO: main 92d124b721dbd4405b4547301751499316b9ec4c. Commit publikacji: fc18c02efd5359844c2439217e8855d549417d0a.
BUNDLE: `gra-robocza/Gra-ROBOCZA.html`; MD5 `2f4d87176ffcfc2aa6cdf44e3e562981`; SHA-256 `38526ae35906328b1e2a76c4158f28795c04c7ad945ad9d03a452993e023d692`; 69,998,033 B.
READBACK: przypięte raw GitHub odczyty bundle’a, manifestu i START.html zakończone sukcesem; bundle bajt-w-bajt zgodny z lokalnym plikiem i manifestem; START wskazuje bundle oraz jego skrócony MD5; origin/main = fc18c02e. Zewnętrzny hosting gry nie był badany.
TESTY: w `01-operator.md`; verify-robocza-bundle = VERIFY OK; smoke Chromium dwa canvasy, HUD i menu, bez pageerror.
OGRANICZENIA: test wydajności i pełny scenariusz 100 tur/save-load nie były wykonane; optymalizacja zasobów pozostaje w wydaniu. To wydanie testowe ROBOCZA, bez promocji KANON/FINALNA.
DEPLOY/PUSH: WYKONANO; raport i wpis WERSJE.md dopięte po readbacku release commit. Manifest post-publish aktualizuje status oraz przypięte adresy readbacku; bundle pozostaje niezmieniony.
