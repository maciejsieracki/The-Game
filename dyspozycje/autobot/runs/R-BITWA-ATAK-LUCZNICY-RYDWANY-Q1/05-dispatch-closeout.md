# Dispatch uzupełniający — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1

TEMAT: `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1`
RUNDA: 2/5 (uzupełniająca walidacja zgłoszonych objawów)
DATA: 2026-10-29
DOMAIN: GAME
GOAL: W bitwie ręcznej i automatycznej dystansowi skutecznie zajmują legalny zasięg, nie cofają się od celu ani nie wychodzą poza własny szyk; konnica i rydwany wykonują ruch/atak także przy doktrynie Atak, pozostając blisko skrzydeł.

## Wyzwalacz

Właściciel ponowił prośbę o dokończenie tematu: zgłasza, że łucznicy plączą się po mapie i nie strzelają, a rydwany/konnica czasem stoją bezczynnie. Poprzedni Final Control dopuścił wąską integrację z notami, lecz jawnie nie zamknął tych objawów.

## Kryteria końca

1. Test produkcyjnego planera dla Atak/Obrona/Szturm obejmuje co najmniej łuczników, oszczepników, procarzy, konnicę i rydwany na otwartym polu oraz z przeszkodami.
2. Dystansowa jednostka wybiera legalny cel w zasięgu i wykonuje strzał, gdy taki cel istnieje; poza zasięgiem podchodzi do legalnego pola w swoim ugrupowaniu, a nie oddala się od przeciwnika.
3. Konnica/rydwan otrzymuje legalny krok/atak przy Ataku i Obronie, nie jest blokowana przez linię piechoty; szturm zachowuje indywidualne natarcie.
4. Pełny Chromium test używa produkcyjnego ruchu/aktywacji i potwierdza widoczny przebieg, bez błędów konsoli.
5. Typecheck, ukierunkowane testy i kontrola zmian są zielone; wszystkie odchylenia od kontraktu są udokumentowane.

## Allowlista

`gra/src/battle/battleScene.ts` tylko jeśli produkcyjny reproduktor potwierdzi defekt; `gra/tools/` wyłącznie test/harness tematu; raporty i wpis rejestru tego ID. Bez zmian mapy kampanii, AI strategicznego, morale, statystyk ani wyboru trybu bitwy przed polem walki. Bez integracji, deployu i pushu w roli Operatora.

## Izolacja i testy

Worktree `/tmp/autobot-battle-closeout`, branch `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`, baza `origin/main` `cc2c6a50`. Operator ma najpierw sprawdzić czystość drzewa i odczytać poprzedni dispatch/FC z historii; nie zakładać, że wcześniejsze testy ze stubami dowodzą ruchu ani obrażeń.

Walidacja minimalna: nowe testy produkcyjnego routingu + istniejąca macierz doktryn, placement i formation; pełny `npm run typecheck -- --pretty false`; realny test Chromium z obserwacją kroków/strzałów i konsoli. Przy braku reprodukcji nie dodawać spekulacyjnej poprawki.

Narzędzie natywnego Kanbana nie jest dostępne w tej sesji; nie twórz fikcyjnej karty ani receipt. Kontynuacja wynika z jawnej dyspozycji właściciela w czacie; ograniczenie procesu trzeba odnotować przy końcowej kontroli.
