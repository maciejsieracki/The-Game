# R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI dyplomacji — wyłącznie prezentacja)
TEMAT: R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2
GOAL: część 2 poleceń właściciela — wyjaśnienia z okien dyplomacji do tooltipów, na planszach zostają tylko liczby, nazwy i przyciski.
BAZA: origin/main 89a5e25cc (FALA 820, Q1 wdrożone). Worktree: wf_b958c925-d62-1, tryb detached.

## KROK 0 — INWENTARZ (plansza | plik:linia | tekst widoczny dziś | decyzja)

| plansza | plik:linia | tekst widoczny (przed) | decyzja |
|---|---|---|---|
| Wojna — modal zgody | diplomacyAudience.ts:1142–1145 | lead „Nie jesteście w stanie wojny. Wybierz…”; „— bez ataku w tej turze (karencja N1)” | lead → „Wybierz działanie:”, pełny tekst i opis w title |
| Wojna — opcja ataku | :1135 | „— wojna od razu i atak w tej turze” | opis w title opcji |
| Wojna — kara (lista skutków) | penaltyBlockHtml :1105 | „Kind ±N — uzasadnienie” | liczba zostaje, uzasadnienie w title wiersza |
| Sojusz — obowiązek | :1192–1196 | „Sojusznik X wymaga, żebyś wypowiedział…”; „— kara Wiarygodności i zerwanie sojuszu” | „Wymagana wojna z: Y” widoczne; reszta w title |
| Baner stanu formalnego | formalBannerHtml :1320 | „zerwanie: kara” w podtytule | w title etykiety „Stan: …” (etykieta zawsze widoczna) |
| Wiersz relacji | relacjaTotalHtml :1669 | „(Zaufanie + Respekt)” | usunięte z widoku (już w title wiersza) |
| Wiarygodność | credibilityBarHtml :1711 | „życiorys X · bieżące Y” | w title wiersza (Rozbicie) |
| Możliwe umowy — stół | dealsColumnHtml :2039 | „dodaj kolejną umowę z listy · jeden bilans PW…” | widoczne „Na stole: N”, reszta w title |
| Aktywne traktaty | treatiesColumnHtml :2065 | „kara zerwania: X” (linia) | w title nazwy traktatu (Zerwij ma już title) |
| Karty negocjacji (WE/ONI) | renderIncoming*Card :2225, :2253 | „Użyj Edytuj, aby zmienić ilości w koszyku” | w title karty |
| Pasek akcji / SZYBKA WYMIANA | actionBarHtml | — | bez zmian (zrobione w Q1, R5) |
| Nagłówek audiencji, status, „(w wojnie zaufanie…)” | :1349 | dopisek „(w wojnie zaufanie spada do zera)” | ZOSTAJE (krótki, testy live go wymagają) |
| Pokój wymuszony (showForcedPeaceModal) | :1223 | — | POZA ZAKRESEM (zgodnie z dispatchem) |
| Pakt, Handel/szlak, Dar, Wasal, Wchłonięcie w diplomacyTradeBasket | — | — | NIE ZBADANE w tej rundzie — do Q3 |

## ZMIANY-COMMIT

- gra/src/ui/diplomacyAudience.ts — tabela powyżej (wszystko przeniesione do title, nic nie usunięte z DOM-tooltipów).
- gra/src/ui/hudTitleTooltip.ts — dodany scope `.civ-diplo-modal-overlay` (modale są na document.body; bez tego title w modalach byłby tylko natywny).
- gra/tools/diplo-all-windows-declutter-tooltips-test.cjs — nowy test: 17 asercji (brak wyjaśnień w widocznym szablonie, tooltip zawiera dawne treści, scope modali, mutacja: uzasadnienie kary wraca na widok → test czerwieni).
- dyspozycje/autobot/runs/R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2/10-operator-claude.md — ten raport.

## TESTY

- tsc --noEmit: exit 0 (surowy wynik: TSC=0).
- Nowy test: 17 pass, 0 fail.
- Q1 diplo-deal-boards-declutter-tooltips-test: 13 pass, 0 fail.
- Pełny zestaw node-owy diplo*/diplomacy*/dyplo*/wiarygodnosc (bez live): 196 zielonych (w tym nowy). 6 czerwonych — TE SAME na bazie 89a5e25c (zweryfikowane przez checkout bazy): dyplo-warunek-niespelniony-czerwony-tooltip, dyplo-karta-duplikat-komunikat, dyplo-bilans-gate-n-e1-reprodukcja (+ runda2, runda3), dyplo-pakt-ekspansja-granica. Nie są związane z tą zmianą.
- Zrzuty Chromium PRZED/PO i z widocznym tooltipem: NIE ZMIERZONO. Powód: moduł audiencji nie daje się zbundlować w node (import.meta.glob z brandAssets); żywy harness wymagałby buildu Vite poza repo, nie uruchomiony w tej rundzie.
- Dodatkowo `npm ci --ignore-scripts` w gra/ (worktree) — tylko zależności, bez `npm run build/dev`.

## BLOKADY

- Brak żywego zrzutu (patrz wyżej). Evaluator powinien to zamknąć albo wskazać, że brak zrzutu jest NIE ZMIERZONO z powodem.
- Pakt/Handel/Dar/Wasal/Wchłonięcie oraz panel PW w negocjacjach (diplomacyNegotiationModal.ts) nie zostały zinwentaryzowane — poza tą rundą.

## RUNDY

1/5

## UWAGI-DLA-ORKIESTRATORA

- Worktree ma świeżo zainstalowane gra/node_modules (npm ci, ~9 GB wolne na dysku przed startem). Nie usuwałem (dispatch zakazuje rm).
- Testy node-owe zapisują pliki PNG w dyspozycje/autobot/runs/…/dowody; po uruchomieniu przywracałem je git checkout — nie są częścią zmiany.

## NASTĘPNY KROK

Evaluator: przegląd inwentarza i tooltipów; zrzuty Chromium (jeśli dostępne) dla Wojny, Sojuszu, Możliwych umów, Aktywnych traktatów, nagłówka audiencji; decyzja, czy Pakt/Handel/Dar/Wasal wchodzą do Q3.

DEPLOY/PUSH: NIE WYKONANO
