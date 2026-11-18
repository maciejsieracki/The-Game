STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CIV-WELCOME-SCREEN-Q1
GOAL: ekran „Odkryłeś nową cywilizację” raz przy pierwszym kontakcie + przycisk „O cywilizacji” w audiencji; Esc/tło = Zamknij; kolejka okien; bez surowych ID.
ZMIANY/COMMIT: kandydat 846ea43c34a7175ed3d09e7eed8c6a21aa197fb5 (potomek bazy c8b0e498b: `git merge-base --is-ancestor` = tak). Diff vs baza: 7 plików (main.ts +78/-3, civWelcomeLogic.ts, civWelcomeScreen.ts, diplomacyAudience.ts +15, civ-welcome-screen-test.cjs, 2 raporty). Wszystko w allowliście; brak zmian w civ-intro-texts.json/civs.json/units.json/showForcedPeaceModal. `git diff --check` czysty. Flaga „raz” = istniejące diplomaticDiscoveryPopupShown (już zapisywane w meta), więc save.ts bez zmian — zgodne z celem. integration_sha = 846ea43c34a7175ed3d09e7eed8c6a21aa197fb5.

TESTY (surowe wyniki, ZMIERZONO na kandydacie):
- npm ci --ignore-scripts exit 0; tsc --noEmit exit 0
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
- civ-welcome-screen-test: OK 309 asercji
- Mutacje na kopiach civWelcomeLogic.ts (pliki usunięte po teście): (1) bramka „raz” → return true: exit 1 (1 FAIL); (2) zamiana pul powitań przyjazne/nieprzyjazne: exit 1 (30 FAIL); (3) usunięta migracja starego zapisu: exit 1 (1 FAIL). Wszystkie czerwone.
- Chromium (headless, /opt/pw-browsers/chromium-1194), prawdziwy komponent civWelcomeScreen.ts + prawdziwe dane (bundle esbuild, poza repo, /tmp/fcw): rzymianie/przyjazne i egipt/nieprzyjazne — zrzuty OBEJRZANE (/tmp/fcw/friendly-rzymianie.png, /tmp/fcw/hostile-egipt.png): nazwa, rys historyczny, plusy/minusy z „+ N więcej” w tooltipie, jednostka, styl, religia, powitanie z podpisem, przyciski Audiencja/Zamknij; po polsku, bez surowych ID. Esc → onClose, klik w tło → onClose, „Audiencja” → onAudience, „Zamknij” → onClose, druga instancja → false; brak błędów konsoli/pageerror (viewport 1024x700 i 390x700). Medalion pusty w harnessie, bo ścieżka portretu jest względna (brak serwera zasobów) — NIE ZMIERZONO z zasobami.
- NIE ZMIERZONO: pełna gra w Chromium (realny pierwszy kontakt, klawisz końca tury przy otwartym ekranie, muzyka przywitania, kolejka z bitwą/wydarzeniem). Okablowanie main.ts potwierdzone tylko tsc + asercje źródłowe + przegląd diffu.
- 5 bramek referencyjnych zielone na kandydacie, więc porównanie z bazą dla czerwonych nie było potrzebne.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Pokój wymuszony w kolejce: ODDAL. tryOpenNextFirstContactCard() czeka (ponowienie 400 ms), gdy w DOM jest .civ-diplo-modal-overlay; to pokrywa przypadek „okno już otwarte”. Pozostaje wąski przypadek okna otwartego PO ekranie (ekran 9650 nad oknem 500, Esc okna pokoju blokuje Esc ekranu) — gracz zamyka ekran przyciskiem/tłem, nie jest uwięziony; poprawka wymagałaby zmiany showForcedPeaceModal (zakaz dispatchu). Uwaga: równoległy temat FPAUTOOPEN (okno pokoju samo na starcie tury) zwiększa szansę tego zbiegu — do sprawdzenia przy jego integracji.
2. hideCivWelcomeScreen nieużywana: ODDAL (naprawione w 846ea43c3: wywołanie w resetDiplomaticDiscoveryUiState, obejmuje reset/nową grę/wczytanie).
3. Podpis władcy: DO DECYZJI CZŁOWIEKA (niewiążące). Kod = dispatch (leaderName wg epoki). Ale audiencja używa leaderNameForOwnerId (pula, indeks wśród właścicieli tej samej cywilizacji — main.ts ~36438), więc przy dwóch właścicielach tej samej cywilizacji imię w powitaniu może różnić się od imienia na karcie audiencji otwieranej przyciskiem „Audiencja”.
4. Brak testu DOM: ODDAL. Dodano asercje źródłowe okablowania; przyciski/Esc/tło sprawdziłem w Chromium (wyżej). Test DOM w repo nadal nie istnieje (dług niskiego priorytetu).
5. Miejsce przycisku „O cywilizacji”: DO DECYZJI CZŁOWIEKA (niewiążące) — jest na karcie rozmówcy w audiencji (allowlista pozwala tylko na diplomacyAudience.ts); czy dodać też do listy dyplomacji — decyzja produktowa. Brak zrzutów z pełnej gry opisany wyżej.

Żaden zarzut nie wymaga NAPRAW.

BLOKADY: brak blokujących.
RUNDY: FC 1/5 (kandydat po obronie r1).
NASTĘPNY KROK: integracja orkiestratora 846ea43c3 (sprawdź `merge-base --is-ancestor` względem aktualnego main i `diff --stat`; main mógł pójść naprzód o FPAUTOOPEN/FPSENT — konflikty w main.ts rozwiązać przez Workflow). Pytania ABC do właściciela: (a) podpis władcy: wódz wg epoki czy imię z karty audiencji (zalecenie: spójnie z audiencją — leaderNameForOwnerId); (b) przycisk „O cywilizacji” też w liście dyplomacji?; (c) akceptacja ograniczenia z pokojem wymuszonym otwartym po ekranie.
UWAGI-DLA-ORKIESTRATORA: sprzątnąć /tmp/fcw, /tmp/fc-*.log, node_modules w gra/ worktree FC, /tmp/cwsb-* z Operatora. Weryfikacja na żywo w pełnej grze (pierwszy kontakt + muzyka + koniec tury) zalecana po deployu na ROBOCZĄ.
DEPLOY/PUSH: NIE WYKONANO
