TEMAT: P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: nieznana z góry — recon/profiling ma ją ustalić (patrz GOAL krok 1). Prawdopodobne
kandydaci do zweryfikowania: main.ts (globalny handler odswiezenia UI po akcji gracza), panele
imperium/miasta (cityPanel.ts, empireDetailPanel.ts), gra/src/render/** (TYLKO jesli profiling
wprost wskaze render jako zrodlo — patrz MODEL+EFFORT nizej)
MODEL+EFFORT: claude-sonnet-5, effort high dla fazy RECON/PROFILOWANIE (ta runda). Jesli
profiling wskaze, ze koszt lezy w gra/src/render/** — Operator NIE implementuje naprawy sam
(stala zgoda wlasciciela na Opus 5 dla tego katalogu, R-PROC-AUTOBOT.md), tylko zatrzymuje sie
ze statusem DECISION_REQUIRED z dokladna lokalizacja i dowodem, orkiestrator dispatchuje
osobna runde na Opus 5. Jesli koszt lezy POZA render/** — Operator kontynuuje napraw na
Sonnet 5 w TEJ SAMEJ rundzie.

WYZWALACZ (dosłownie od właściciela, z `dyspozycje/PYTANIA-OTWARTE.md` sekcja
"P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1", trzy kolejne doprecyzowania tej samej sesji 2026-08-16/17)
"czym dalej w las tę gra bardziej spowalnia. Już raz o tym rozmawialiśmy i niby miała być coś
naprawione." Doprecyzowanie 1: "tutaj problem nie jest tura, bo ona leci bardzo szybko;
problemem jest, że w trakcie gry bardzo długo czeka się potem na to, żeby wejść do miasta,
zmienić miasto lub cokolwiek zrobić – trzeba kilka sekund czekać, aż to nastąpi."
Doprecyzowanie 2 (zakres szerszy): "Ale tutaj na wszystko się czeka, nawet na ruch jednostkami.
Przełączanie między jednostkami na wszystko podczas gry działa, jakby było w spowolnionym
trybie. Każda zmiana, każde kliknięcie działa bardzo powoli i trzeba odczekać zawsze kilka
sekund na reakcję." Doprecyzowanie 3 (korelacja): "tego efektu nie ma na początku gry.
Podejrzewam, że tutaj jest kwestia ilości miast; na początku jest ich mniej, a im więcej miast,
tym większe obciążenie i wszystko zaczyna spowalniać... głównie chyba chodzi o moje miasta."
Wlasciciel wczesniej (2026-08-17, AskUserQuestion) zdecydowal "Do kolejki" — NIE dispatchowac
od razu, zajac sie po odnowieniu limitu sesji razem z reszta kolejki. Ta runda AutoBot jest tym
wznowieniem (kontynuacja petli po FALI 341, na wyrazne polecenie wlasciciela "kontynuuj petle
autobot z kolejnymi zgloszeniami").

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, zapisane w PYTANIA-OTWARTE.md)
- Dwie WCZESNIEJSZE naprawy tego samego obszaru (2026-08-12, oba SCALONE): wyciek
  `styledOverlays` w `scene.ts::dispose()` (las/dzungla/szczyty/plaze/wydmy/oazy nie byly
  zwalniane przy przebudowie sceny) i brak `try/finally` w `buildScene()`. Prawdopodobnie to,
  o czym mowi Maciej jako "już raz naprawione" — zgloszenie wraca, wiec albo naprawa nie objela
  wszystkich zrodel, albo doszly nowe od tego czasu.
- Diagnostyka JUZ WYKONANA (2026-08-17), narzedzie `gra/tools/perf-long-session-live-test.cjs`
  (150 tur, checkpoint co 10, realny headless Chromium + `triggerPlayerEndTurn()`): pamiec/GPU
  BEZ oznak wycieku w zmierzonym oknie (heapUsed slope ujemny, wszystkie 17 monitorowanych
  tablic plaskie). Te dwie wczesniejsze naprawy WYGLADAJA na trzymajace w tym oknie pomiaru —
  NIE zakladac ze to nadal prawda bez ponownego uruchomienia na aktualnym HEAD (patrz GOAL
  krok 1, ten przebieg byl na STARYM commicie sprzed rewertu niepowiazanej mechaniki bitewnej).
- KLUCZOWE DOPRECYZOWANIE OBJAWU (ignoruje wczesniejsza hipoteze "stuck-turn"/pamieciowa):
  objaw NIE jest koniec tury (`endTurn` dziala szybko) ani ogolny FPS/render mapy. Jest to
  OPOZNIENIE PRZY KAZDEJ INTERAKCJI gracza w trakcie tury — otwarcie panelu miasta, przelaczanie
  jednostek, ruch jednostka, "kazda zmiana, kazde klikniecie". Nieobecne na starcie gry, rosnie z
  liczba miast GRACZA. Sugeruje WSPOLNY, kosztowny handler/funkcje wolywana po kazdej akcji
  gracza, ktorej koszt rosnie z rozmiarem stanu gry (miasta/jednostki/budynki) — NIE
  jednorazowy koszt startowy, NIE koszt GPU/pamieci.
- Recon read-only orkiestratora: grep pod katem wspolnego globalnego handlera
  (`setInterval`/`requestAnimationFrame`/`gameLoop`) w main.ts — zero trafien pod tymi
  literalnymi nazwami. Jesli wspolny mianownik istnieje, zyje pod inna nazwa lub jest
  rozproszony po wielu miejscach wolajacych ta sama kosztowna funkcje — wymaga REALNEGO
  profilowania (DevTools performance trace / `performance.now()` wokol typowych akcji), nie
  dalszego grepowania z pamieci.
- W grze istnieje panel "Test wydajnosci" (`gra/src/ui/perfTestPanel.ts`) z benchmarkiem
  sprzetu, ALE celuje w szybkosc generowania mapy/FPS renderu, NIE w pojedyncza wolna funkcje JS
  blokujaca glowny watek przy interakcji — prawdopodobnie NIE adresuje tego konkretnego objawu
  (jednowatkowy JS, wiecej RAM/GPU nie przyspiesza wolnego obliczenia).

GOAL
1. ZANIM cokolwiek zalozysz o stanie problemu: przygotuj i uruchom zywy test mierzacy czas
   miedzy typowa akcja gracza (otwarcie panelu miasta, przelaczenie zaznaczenia jednostki, ruch
   jednostka) a pelnym zakonczeniem reakcji UI, w FUNKCJI liczby miast gracza na mapie
   (np. porownaj czas tej samej akcji przy 2 miastach vs 10+ miastach gracza w tej samej sesji
   przegladarki, ta sama mapa/scenariusz). Uzyj `performance.now()` wokol typowych akcji w
   headless Chromium (Playwright), analogicznie do istniejacego `perf-long-session-live-test.cjs`
   ale mierzac PUNKT INTERAKCJI, nie koniec tury.
2. Jesli pomiar POTWIERDZA rosnacy koszt z liczba miast gracza — profiluj (DevTools performance
   trace jesli dostepne w tym srodowisku, alternatywnie recznie opakuj `performance.now()` wokol
   podejrzanych funkcji odswiezenia UI wolywanych po akcji gracza) zeby zlokalizowac KONKRETNA
   funkcje/handler odpowiedzialny za wiekszosc czasu. NIE zgadywac lokalizacji z nazwy funkcji —
   zmierzyc.
3. Gdy zrodlo zlokalizowane: jesli lezy w `gra/src/render/**` — ZATRZYMAJ SIE, nie implementuj
   naprawy, zwroc DECISION_REQUIRED z dokladna lokalizacja/dowodem/wstepna hipoteza naprawy dla
   orkiestratora (temat wymaga Opus 5 do samej naprawy, zgodnie ze stala zgoda wlasciciela).
   Jesli lezy POZA render/** (np. main.ts, panele UI w gra/src/ui/**) — zaimplementuj naprawe w
   TEJ SAMEJ rundzie (Sonnet 5 wystarcza), z zywym dowodem PRZED/PO pokazujacym realna redukcje
   czasu reakcji przy duzej liczbie miast.
4. Jesli pomiar z kroku 1 NIE potwierdza rosnacego kosztu z liczba miast (np. objaw okazuje sie
   nieodtwarzalny na aktualnym HEAD, albo wyjasniony czyms innym) — zatrzymaj sie ze statusem
   PASS-WITH-NOTES, udokumentuj dokladny wynik pomiaru (liczby, nie wrazenie), NIE zgaduj dalej
   ani nie zamykaj tematu milczeniem.
5. Osobno, krotko: powtorz `node tools/perf-long-session-live-test.cjs 150 10` na aktualnym HEAD
   (nie na starym worktree) i potwierdz/zaprzecz, czy hipoteza "stuck-turn" (tura utykajaca na
   stale) z poprzedniego, mozliwie nieaktualnego przebiegu nadal wystepuje — jesli TAK, to osobny,
   wysoki priorytet watek do zaraportowania osobno (nie mieszaj naprawy z tym tematem, chyba ze
   dzieli te sama przyczyne, co udowodnij, nie zaloz).

KRYTERIA KOŃCA (binarne)
1. Istnieje zywy, powtarzalny pomiar (liczby, nie opis) czasu reakcji typowej interakcji gracza w
   funkcji liczby miast gracza, wykonany na AKTUALNYM HEAD.
2. Jesli pomiar potwierdza rosnacy koszt: konkretna funkcja/handler odpowiedzialny za wiekszosc
   tego kosztu jest zlokalizowany z dowodem (nie zgadywaniem).
3. Jesli zrodlo POZA render/**: naprawa zaimplementowana, zywy dowod PRZED (wolno) i PO (szybko)
   na TEJ SAMEJ mierze z kroku 1.
4. Jesli zrodlo W render/**: DECISION_REQUIRED z pelna lokalizacja/dowodem, zero prob naprawy
   przez Sonnet 5 Operatora.
5. Powtorzony `perf-long-session-live-test.cjs` na aktualnym HEAD, wynik jawnie zaraportowany
   (stuck-turn potwierdzony/zaprzeczony, z liczbami).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone (jesli krok 3 wykonany — zmiana kodu).
7. Zero regresji na innych mechanizmach UI/renderu (jesli krok 3 wykonany).

ALLOWLISTA (nic poza tym)
- Nowy plik testu profilujacego w gra/tools/*-test.cjs (recon/pomiar).
- Jesli naprawa poza render/**: pliki wskazane przez profiling jako faktyczne zrodlo kosztu —
  DOKLADNY zakres do ustalenia po profilingu, nie z gory. Operator MUSI podac dokladna liste
  plikow w raporcie, zanim je zmieni, i trzymac zmiane WYLACZNIE w zlokalizowanym zrodle kosztu
  (zakaz szerokiego refaktoru "przy okazji").
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, JAKAKOLWIEK zmiana w gra/src/render/** przez
Sonnet 5 (wymaga Opus 5, osobna runda po DECISION_REQUIRED).

IZOLACJA
worktree /home/user/wt-perf-spowalnianie, gałąź autobot/P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1,
baza jawnie: origin/main (commit d144c6b2 lub nowszy jesli main ruszyl w miedzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-perf --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz zalozenia lokalizacji przyczyny z samej nazwy funkcji/pliku bez faktycznego pomiaru
czasu wykonania (`performance.now()` lub DevTools trace) — to jest DOKLADNIE ten temat, gdzie
poprzednia proba profilingu (2026-08-17) trafila na fałszywy alarm (stary worktree ze
starym kodem dajacy myslacy wrazenie regresu, ktorego nie bylo na aktualnym HEAD) — zawsze
weryfikuj na SWIEZYM `git fetch origin main` + checkout, nigdy na worktree starszym niz kilka
godzin. Zakaz uznania "problemu nie ma" na podstawie jednego, krotkiego przebiegu (np. 2 miasta,
10 tur) — objaw wlasciciela wymaga PORONANIA malej i duzej liczby miast, nie pojedynczego
pomiaru.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.
Zero prob naprawy w render/** przez Sonnet 5 — DECISION_REQUIRED zamiast tego, bez wyjatku.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora (lub eskalacja Opus 5
jesli DECISION_REQUIRED render/**) → READY_FOR_DEPLOY.
