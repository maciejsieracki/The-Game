# R-WEB-DIPLO-TRUST-NUMBERS-Q1 — DODATEK orkiestratora (runda 1)

## Decyzje właściciela (2026-11-13)
- „Po zawarciu rozejmu zaufanie rośnie do 10, a po zawarciu pokoju do 20” — ustawiane OD RAZU w chwili zawarcia (nie stopniowo). Pokój: zaufanie = 20 i zostaje; rozejm: zaufanie = 10 (po rozejmie, który kończy się pokojem, w chwili pokoju przechodzi na 20). Wartości 10 i 20 w JSON, nie w kodzie.
- „Większe kary za sąsiedztwo: 3, 4, 5 na minusie” (Kamień/Brąz/Żelazo).
- „Religię trzeba wyrzucić” — zarówno wspólna (+0,5), jak i odmienna (−0,5) przestają zmieniać zaufanie.
- Kara za sąsiedztwo jest wstrzymana, gdy między parą trwa karencja po pokoju lub rozejmie (żeby ustawione 10/20 nie zostało natychmiast zjedzone).

## Punkty wejścia (sprawdź w kodzie, numery linii orientacyjne)
- Kara za sąsiedztwo: gra/src/game/diplomacy.ts sharedBorderPenaltyForEpochs (ok. 598–607), użycie w computeTickZaufanieDelta (ok. 1790–1825), kontekst pary w gra/src/main.ts (ok. 23150–23175: karaWspolnaGranica, sharedBorderPenaltyForEpochs), wartości w gra/data/diplomacy.json (ekspansjaGranica*_zaufanie_perTura: −2/−3/−4 → −3/−4/−5).
- Religia: diplomacy.ts ok. 1817–1818, main.ts ok. 23166–23167 (wspolnaReligia/odmiennaReligia), diplomacy-factors.ts ok. 181–185, parametry religii w diplomacy.json. Usuń WPŁYW na zaufanie; jeśli etykiety czynników w UI wyświetlają religię jako przyczynę zmiany zaufania, usuń też wiersz. Nie usuwaj innych użyć religii (np. wiarygodność, jedność religii w Power).
- Zawarcie rozejmu i pokoju: znajdź miejsca ustawiające stan pokoju/rozejmu (szukaj w main.ts i diplomacy*.ts: applyPeace, setTruce, zawarcie pokoju, wojnaStartTura reset, diplomacy-peace-lock.ts, isPeaceLockedBetween ok. main.ts:11966). Dla KAŻDEJ ścieżki zawarcia (gracz↔AI, AI↔AI, pokój wzajemny przy zmęczeniu, pokój z oddaniem miast) ustaw zaufanie pary na 20 (pokój) / 10 (rozejm). Wylistuj wszystkie ścieżki w raporcie z plik:linia.
- Karencja: źródło prawdy to diplomacy-peace-lock.ts / isPeaceLockedBetween (karencja po pokoju/rozejmie, w tym 40/100 tur po pokoju wzajemnym ze zmęczenia). Kara za sąsiedztwo = 0 dopóki ta para jest objęta karencją.

## Kryteria końca (binarne)
- tsc --noEmit exit 0.
- Nowy test gra/tools/diplo-trust-numbers-test.cjs: (a) rozejm ustawia zaufanie 10; (b) pokój ustawia 20; (c) rozejm→pokój: 20; (d) kara sąsiedztwa −3/−4/−5 w Kamieniu/Brązie/Żelazie przy spełnionych warunkach; (e) w karencji kara = 0, po karencji wraca; (f) wspólna i odmienna religia dają zmianę zaufania 0; (g) mutacja (przywrócenie starych liczb lub religii) czerwieni test.
- Istniejące testy z liczbami −2/−3/−4 lub ±0,5 religii zaktualizowane TYLKO w tych asercjach; żaden test nie osłabiony poza tym.
- Pięć bramek referencyjnych: logic-test 213/213, tech-tree-test 20/0, research-test 33/0, unit-replace-test 21/21, combat-test 6/6; plus diplomacy-test.cjs i diplo-war-trust-only-test.cjs bez regresji względem bazy. Jeśli coś czerwone, sprawdź ten sam test na bazie i odróżnij regresję od długu.
- Raport w 10-operator-claude.md: lista ścieżek zawarcia pokoju/rozejmu z plik:linia i opis wpływu na istniejące progi umów (np. pakt wymaga zaufania ≥30, więc po pokoju przy 20 pakt jest niedostępny — tylko opisz).

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
