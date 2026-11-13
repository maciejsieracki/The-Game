# Diagnoza — R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1

Data: 2026-11-10. Odczyt tylko. Baza `main` / `origin/main` = `cb17ba921`; podczas odczytu status repo pokazywał `main...origin/main` bez zmian. Przy zapisie raportu pojawiły się równoległe, niezwiązane zmiany `gra/src/ui/sciencePicker.ts` i `gra/tools/science-picker-eta-real-render-test.cjs`; pozostawiłem je nietknięte. Nie ma `AGENTS.md` w repozytorium. Wpis w `REJESTR-PROSB-I-ZADAN.md` podaje zgłoszenie jako kolejkujące (#9442), a run zawiera na razie tylko dispatch (`00-dispatch.md`). W `docs/obieg/REJESTR-DECYZJI.md` nie ma osobnej decyzji dla tego nowego ID.

## Co już działa

- Rdzeń AI wykonuje bezpośredni atak, gdy widoczna i możliwa do zaatakowania jednostka wroga jest w zasięgu; ta gałąź poprzedza wejście na sąsiednie miasto (`gra/src/game/ai.ts:3673-3682, 4200-4245`). Przy zwykłym marszu na miasto jednostka przechwytuje najbliższą jednostkę wroga tylko wtedy, gdy jest bliżej od miasta i najwyżej 3 heksy od niej (`ai.ts:4327-4378`). Flankująca jednostka zamyka się na najbliższy widoczny oddział (`ai.ts:4280-4300`).
- Planer wojenny W1/W2 jest już zintegrowany i aktywny: `warAllInContextFor` tworzy kontekst dla wojen z innymi cywilizacjami, a `decideAITurn` nakłada `applyWarAllInCapitalToCommands` na rozkazy ruchu (`main.ts:34215-34273`, `ai.ts:4460-4465`). Dla każdej własnej grupy wybierana jest najbliższa jednostka wroga w promieniu; przy braku takiej jednostki grupa kontynuuje cel miasta (`warAllInCapital.ts:789-803`, wybór najbliższego w `war-rules-multiwar.ts:435-458`). Obecna wartość `engageRadiusHexes` to 10 heksów (`data/war-rules-params.json:12`).
- Przy wielu wojnach W2 rozdziela całe własne grupy proporcjonalnie do liczebności wojsk przeciwników. `enemyStrength` jest sumą liczby jednostek bojowych danego właściciela, nie ich mocy (`main.ts:34248-34272`; alokacja `warAllInCapital.ts:768-787`).
- Obrona domu już nadpisuje ofensywne rozkazy jako ostatnia warstwa: P2 zwalcza wroga na własnym terytorium, P1 próbuje odbić własne utracone miasto, potem pozostaje ofensywa rdzenia (`ai.ts:3484-3487, 3523-3527`). Jednostki utrzymujące relewantne oblężenie są wyłączone z puli, którą obrona domu może przejąć (`ai.ts:3592`, `ai-war-home-defense.ts:259-265`).
- Kampania wodza i pięć pełnych tur zbiórki to istniejąca, osobna funkcja. Rejestr potwierdza ją jako zintegrowaną po teście 31/31 i teście produkcyjnego końca tury 24/24: pierwsza ofensywna tura ruszyła 4/4 jednostkami. Nie należy ponownie wdrażać tej zmiany (`REJESTR-PROSB-I-ZADAN.md:44-52`; `R-AI-GENERAL-WAR-5TURN-ATTACK-Q1/05-integration.md`).

## Dlaczego wciąż możliwe jest mijanie się

Obecny cel kontaktu W1 to najbliższy **pojedynczy heks jednostki**, a nie największe zgrupowanie wroga; własne jednostki są rozbijane na grupy przez istniejące planowanie. Nie ma etapu wybierającego największą własną armię ani największą wrogą armię. Nie ma też bramki „atakuj tylko przy stosunku mocy ≥ X” dla walki polowej. Istniejąca `aiUnitCombatStrength` liczy moc z aktualnym HP, ale używa jej obrona domu (`ai.ts:3493-3521`), a nie wybór ofensywnego celu W1.

W1 korzysta z promienia w heksach od kotwicy, nie z kosztu trasy ani liczby tur ruchu; więc nowy warunek „osiągalny w ≤ N ruchach” nie jest obecnie spełniony tym samym parametrem. Co więcej, `main.ts:34255-34272` przekazuje do W1 heksy wszystkich wojennych jednostek przeciwnika bez zastosowania `visibleHexes`, podczas gdy rdzeń filtrowany jest mgłą (`ai.ts:3673-3682`). To jest różnica do jawnego rozstrzygnięcia implementacyjnego względem wymogu zachowania wiedzy AI zgodnie z mgłą.

W zwykłej gałęzi celów miast wybór miasta może poprzedzić przechwycenie: atak jednostki wroga przechodzi pierwszy tylko w bezpośrednim zasięgu; później nie-flankująca jednostka wraca do miasta, chyba że najbliższy wrogi oddział znajduje się bliżej i w granicy 3 heksów (`ai.ts:4200-4245, 4327-4378`). To tłumaczy, dlaczego rezultat zależy od tego, czy nakładka W1 ma aktywny kontekst, składania grup i geometrii trasy.

## Parametry i decyzje

- Istniejący zatwierdzony W1 z `R-WEB-WAR-RULES-MULTIWAR-Q1` ustala „najbliższą armię” w promieniu zaangażowania; bieżąca wartość parametru wynosi 10 heksów. Stary dispatch opisywał 10–12 jako przykład i „blisko” jako 2–3 tury. Nie jest to zatwierdzona wartość nowego parametru liczby ruchów N ani gwarancja osiągalności trasą.
- Nie znalazłem zaakceptowanego progu stosunku mocy armii polowej. Progi obrony domu są inne: atak obronny 0,8/0,6 z histerezą; odbicie miasta 1,0/0,8 (`ai-war-home-defense.ts:40-60`). Nie należy przepisywać ich jako prógu ofensywnego ani wyprowadzać z nich nowego balansu.
- Wymóg właściciela „największa armia na największą armię” jest już zapisany jako kierunek produktu w nowym dispatchu i rejestrze. Definicja rozstrzygająca remisy i „największa” (moc zamiast liczby, sposób grupowania, czy wyłącznie główne armie) wymaga dopięcia do dispatchu przed kodem, jeśli nie jest jawnie określona przez właściciela.
- W dispatchu bieżącego zadania obrona własnego miasta pod bezpośrednim oblężeniem ma mieć pierwszeństwo. Istniejące P2 reaguje na wrogów na własnym terytorium i utracone miasta; nie znalazłem odrębnego jawnego warunku „własne miasto aktualnie pod oblężeniem” wyprzedzającego wybór celu głównej armii. Potrzebne jest potwierdzenie zakresu: czy wyjątek dotyczy wszystkich jednostek AI, czy tylko armii/sił pozostających w zasięgu obrony; mechanizm P2 może już pokrywać część przypadków.

## Wersja i zakres dalszych prac

HEAD zawiera FALĘ 610: commit `36e52cc82` zmienia wyłącznie `WERSJE.md` i artefakty `gra-robocza` (manifest, HTML, START); commit `cb17ba921` potwierdza odczyt publikacji oraz dispatch ETA. Nie ma tam zmiany `gra/src` ani reguły targetowania. Bieżący kod źródłowy na `main` nadal zawiera wcześniejsze zatwierdzone W1/W2 i pięcioturową kampanię wodza.

Następny krok po zatwierdzeniu brakujących parametrów/reguł: użyć osobnej gałęzi/worktree wskazanego przez właściciela repozytorium; zachować W1/W2, obronę domu i kampanię wodza; zmienić selekcję kontaktu tak, by główna własna grupa wybierała największe znane i osiągalne zgrupowanie wrogie, stosowała jawny próg mocy, a po odrzuceniu celu wracała do istniejącej selekcji miasta. Utrzymać bez zmian ataki bezpośrednie, flankowanie, pozostałe grupy W2 i reguły gracza. Przed kodem potrzebne są zatwierdzone wartości/definicje dla N i progu mocy oraz jasna kolejność wobec oblężenia.

Nie odtwarzano scenariusza ani nie uruchamiano testów w tej rundzie; wykonana została wyłącznie statyczna diagnoza z aktualnego `main`. Nie zmieniano logiki gry.
