## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-DYPLOMACJA**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/DYPLOMACJA-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do DYPLOMACJA-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES: Excel `Status-projektu-The-Game.xlsx` (folder Civ) -> zakladka **Civ-DYPLOMACJA** (odhaczasz kroki: Status="Zrobione" -> zielony) + "Status wg grup" (filtr Task=Civ-DYPLOMACJA). [zakladka dodana do Excela po jego zamknieciu]
KANAL: czytasz dyspozycje/DYPLOMACJA.md; piszesz dyspozycje/DYPLOMACJA-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: tylko swoje pliki. Tylko Civ-SILNIK rusza main.ts + publikuje kanon. Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly pada na blokadzie OneDrive dist/) -> cp do celu. NIGDY npm run build / export-data.py.
PLIKI KODU (Twoj lane): src/game/diplomacy.ts
PANEL STEROWANIA (Excele dla Maciej): Dyplomacja.xlsx -> diplomacy.json

---
## PLAN DZIALANIA
[ ] 1. Model dyplomacji (diplomacy.ts juz istnieje): Relacja = Zaufanie + Respekt, progi, reakcje. Dopracowac/utrzymac.
[ ] 2. Wspolczynniki -> Dyplomacja.xlsx (panel dla Maciej), targeted export diplomacy.json.
[ ] 3. Zasady dyplomacji w jednym miejscu (ten task) -- spojne z PROJEKT-GRY-master.
(Wpiecie + panel dyplomacji: Civ-SILNIK + Civ-UI.)

## DO ZROBIENIA TERAZ
Czekaj na sygnal "start". Potem pkt 1.

## HISTORIA
- (nowy task; diplomacy.ts gotowy, niewpiety)

## START — ZIELONE: masz wolna reke (diplomacy.ts nie jest teraz wpinany). Dopracuj model w diplomacy.ts + parametry w Dyplomacja.xlsx. Po gotowosci zglos -> SILNIK wepnie pozniej (krok 5).


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
DECYZJA: zalozenia (a)+(b) ZAAKCEPTOWANE (start Relacji 50; §3.1 0..200 ma pierwszenstwo). RESPEKT: wejscia czytasz z DANE (blok Profil cyw.) — NIE definiuj u siebie, NIE licz podwojnie. NASTEPNY KROK: kontrakt 'co dokladnie czyta Respekt' (lista wejsc) -> handoff do mastera. Potem standby na wpiecie.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJA MACIEJ: re-analiza (a)/(b) przez TOURNAMENT
Nie finalizuj od razu zalozen. Przeanalizuj je PONOWNIE technika TOURNAMENT (pairwise, MAX 6 rund, max 12 subagentow): zestaw warianty (start Relacji 50 vs 60 vs inny; clamp 0..200 vs osobny clamp ujemny dla drobnych) i wylon najlepszy wg jawnej rubryki (spojnosc ze Spec, grywalnosc, brak martwych galezi progow). Raport: rekomendacja + uzasadnienie -> handoff do mastera. Backup przed kazda zmiana.


## [2026-06-24] SCALONE -> CYWILIZACJE
Ten dzial polaczony w jeden: CYWILIZACJE (DANE+DYPLOMACJA). Kanal: dyspozycje/CYWILIZACJE.md + CYWILIZACJE-DO-MASTERA.md. Tu juz nie pracujemy.
