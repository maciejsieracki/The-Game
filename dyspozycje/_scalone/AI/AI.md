## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-AI**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/AI-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do AI-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES: Excel Status-projektu-The-Game.xlsx -> zakladka Civ-AI (Status="Zrobione"->zielony) + "Status wg grup" (filtr Task=Civ-AI).
KANAL: czytasz dyspozycje/AI.md; piszesz dyspozycje/AI-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: tylko swoje pliki. Tylko Grupa F rusza main.ts + publikuje kanon. Build: `npx vite build --outDir /tmp/civ-dist` -> cp do celu. NIGDY npm run build / export-data.py.
PLIKI KODU: src/game/ai.ts, victory.ts, barbarians.ts (nowy)
PANEL STEROWANIA (Excele dla Maciej): AI-parametry.xlsx -> ai-params.json

---
## PLAN DZIALANIA
[ ] 1. ai.ts: decyzje rywali (ruch/zakladanie/atak/budowa) -- dopracowac pod wpiecie.
[ ] 2. victory.ts: warunki zwyciestwa (dominacja typu + nauka/statek).
[ ] 3. barbarians.ts (NOWY): neutralni wrogowie -- spawn obozow, agresja, ruch ku graczowi + test.
[ ] 4. Wspolczynniki -> AI-parametry.xlsx (panel Maciej) + targeted export ai-params.json.
(Wpiecie w petle tury: Grupa F.)

## DO ZROBIENIA TERAZ
Zacznij od pkt 3 (barbarians.ts -- nowy plik, bezpieczny), rownolegle przegladaj ai.ts/victory.ts.

## HISTORIA
- ai.ts + victory.ts gotowe (niewpiete). barbarians.ts do napisania (przejete z Civ-LOGIKA).

## WERDYKT MASTERA [2026-06-22 21:45] -- barbarians ZIELONE + spawn-konsument
barbarians.ts ISTNIEJE i przechodzi test (barbarians-test 53/0) -> pkt 3 ZROBIONY. Skup sie na pkt 1 (ai.ts: decyzje rywali co ture -- ruch / zakladanie wg klastra typu / atak / produkcja / badania) i pkt 2 (victory.ts: dominacja typu par.8d + nauka/statek + ekran konca). Trudnosc Easy/Normal/Hard -> AI-parametry.xlsx.
SPAWN KLASTROW (konsument): osadnicy AI ekspanduja w obrebie SWOJEGO typu wg Spec-generator-mapy.md "0.1" (klaster do 10 miast/typ, min_dystans 9). MAPA rozmieszcza startowo, Ty rozwijasz w turach. Wpiecie: SILNIK.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
KOREKTA ZAKRESU (wazne): AI = STRATEGICZNA inteligencja komputera NA MAPIE — osadnictwo, ekspansja, priorytety budowy, kiedy/kogo atakowac, ruch armii, poscig za zwyciestwem, skalowanie trudnosci. Taktyka BITWY NIE Twoja (to UNITS). Charakter/profil cywilizacji CZYTASZ z DANE (civs.json, blok Profil AI) — nie definiujesz u siebie. START (dzial byl pusty): (1) barbarzyncy, (2) AI rywala (klaster ~9 tego samego typu), (3) domkniecie warunkow zwyciestwa. Technika: fan-out research wzorcow (pilot 2, Haiku) + loop-until-done na testach (max 3).


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Grupa F.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJA MACIEJ: 7A potwierdzone
AI = STRATEGIA komputera NA MAPIE (bitwa-taktyka = UNITS). Profil charakteru cyw. CZYTASZ z DANE/civs.json (po dodaniu bloku). Start (gdy ruszysz): barbarzyncy + AI rywala (klaster ~9 typu) + domkniecie zwyciestwa.


## [2026-06-24] SCALONE -> CYWILIZACJE
Dzial AI polaczony w CYWILIZACJE (dane: arkusz AI-zachowanie; kod: ai.ts/barbarians.ts/victory.ts). Kanal: dyspozycje/CYWILIZACJE.md. Tu juz nie pracujemy.
