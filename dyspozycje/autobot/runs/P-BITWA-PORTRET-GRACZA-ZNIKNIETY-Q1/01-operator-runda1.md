STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1
GOAL: Naprawić regres — portret gracza (i AI, gdy dotyczy) znika na ekranie „Wynik bitwy".

ZMIANY/COMMIT: brak zmian w `gra/` — defekt NIE reprodukuje się w scenariuszu, który
dispatch i istniejące żywe testy pokrywają (patrz niżej), więc nie było czego naprawiać
punktowo bez ryzyka naprawy nieistniejącego problemu.

TESTY: `tsc --noEmit` 0 błędów. 5 bramek referencyjnych zielone: logic 213/213,
tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6. Dodatkowo uruchomiono
(bez modyfikacji) istniejącą żywą bramkę `tools/r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs`
(Chromium/Playwright, realny build vite) na sandboxie `?playtest=walka`: 21/21 PASS,
0 błędów konsoli.

DOWOD-PRZYCZYNY: Prześledzony cały łańcuch `preBattleSideFromRoster` (civTypeForOwner,
portraitForceCultureIcon/shouldForceCultureIconForOwner) → `BattleScene` →
`_buildBattleSummaryData` → `postBattleSummary.buildCommanderCorner`/`leaderPortraitUrl`.
Zweryfikowano wszystkie 3 realne call site'y `applyMapBattleOutcomeWithSummary`
(atak gracza, atak przychodzący AI, szturm oblężniczy) — wszystkie poprawnie przekazują
`civIconId`/`isCityState`/`isBarbarian`/`era`. Assety portretów (15/15 cywilizacji ×
kamień/brąz/żelazo) obecne i zgodne z `ikonaId` z `civs.json`. Git-historycznie: ostatni
commit dotykający tych plików to `9479ccc4` (R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1,
2026-09-04) — DODAŁ tę logikę portretu (wcześniej medalion był zawsze generyczny
PB_SVG.commander, czyli faktycznie "generyczna sylwetka"), Final Control PASS-WITH-NOTES.

DOWOD-NAPRAWY-CHROMIUM: Żywy przebieg (real klik: Rzym-gracz atakuje Grecję-AI,
`?playtest=walka`, bez żadnej mutacji kodu) pokazuje PORTRET (nie sylwetkę) na OBU
medalionach — zarówno w trakcie bitwy (panel "Stan oddziałów"), jak i na dokładnie
ekranie "Wynik bitwy" (mapowe podsumowanie po "POWRÓT NA MAPĘ" — to jest ten sam ekran
co w zgłoszeniu właściciela). Zrzut: `/tmp/live-atak-2lMzqV/05-pasek-naglowka.png`
(widoczne twarze władców Rzymian/Greków, nie sylwetki). Regres NIE reprodukuje się w tym
scenariuszu na obecnym `main`.

BLOKADY: Jedyny scenariusz z owner-zgłoszenia BEZ żywego pokrycia to gracz vs
MIASTO-PAŃSTWO/barbarzyńca (zgłoszenie mówi wprost o "portrecie gracza I państwa-miasta").
Final Control rundy 3 (`9479ccc4`) już odnotował dokładnie tę samą lukę: "żaden istniejący
preset testowy nie stawia miasta-państwa/barbarzyńca jako strony bitwy" — wymaga NOWEGO
fixture'u (gracz z realną armią blisko miasta-państwa), co nie mieści się bezpiecznie
w tej rundzie bez ECHO. Możliwe też, że zrzut właściciela pochodzi sprzed deployu
`9479ccc4` i regres jest już nieaktualny.

RUNDY: 1/5
NASTĘPNY KROK: ECHO właściciela — czy zgłoszony zrzut dotyczył walki z miastem-państwem/
barbarzyńcą (nie zwykłym AI)? Jeśli tak → runda 2 buduje nowy fixture testowy dla tego
scenariusza. Jeśli nie/nie wiadomo → temat do zamknięcia jako niereprodukowalny na `main`.
DEPLOY/PUSH: NIE WYKONANO
