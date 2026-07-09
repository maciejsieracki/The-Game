# START DLA CODE — obowiązująca dyspozycja (scalona: INTEGRATOR + korekty MASTERA, 2026-07-08)

Przejmujesz projekt gry 4X „Civ" — TypeScript + Vite + Three.js, mapa heksowa, build single-file.
Repo: `https://github.com/maciejsieracki/The-Game` (gałąź `main`).

## Setup (ważne)
Sklonuj repo do ZWYKŁEGO lokalnego folderu (np. `C:\dev\civ`), NIE do OneDrive — poprzedni workflow
miał problemy z synchronizacją/dehydratacją plików na OneDrive. Potem `npm install` i postaw dev-server
z HMR, żeby pętla „zmiana → przeglądarka" była w sekundach. Struktura jest nietypowa (pozostałość po
single-file buildzie): źródło w `gra-robocza/srcKopiaMaster`, konfigi w `gra-robocza/konfigiKopiaMaster`,
dane w `gra-robocza/data — kopia`, build przez `vite-plugin-singlefile`. Pierwsze zadanie: ogarnij
`package.json`/konfig Vite i uruchom szybki dev-server (jak trzeba — dostosuj strukturę do normalnego `npm run dev`).

## Kontekst do wczytania (folder `dyspozycje/` — masz go też udostępniony na OneNecie/OneDrive)
- `DYSPOZYCJE-SESJI.md` — struktura i zasady projektu (lane: SILNIK/EKONOMIA/MAPA/UI/CYWILIZACJE).
- `_handoff/KANAL-PRACA.md` — OGON pliku, obowiązkowo wpisy z 2026-07-08: [11:00], [11:10], [11:25], [11:45].
- `REJESTR-BUGOW-PLAYTEST-2026-07-06.md` — otwarte błędy playtestu (B1–B11).
- `DO-KURSORA-wydajnosc-mapa-miasto.md`, `KURSOR-3-DYSPOZYCJE-WYDAJNOSC.md`, `DO-KURSORA-panel-miasta-i-zapis.md` — gotowe diagnozy z `plik:linia`.
- `WERSJE.md` — historia buildów.

## Stan i priorytety
1. **Wydajność:** D1 (lokalna enumeracja heksów zamiast pełnomapowych skanów przy otwarciu miasta)
   i D3 (usunięty zbędny `refreshFog`) — już w kodzie na `main`. Zostało **D2 — frustum culling terenu**
   (pan/zoom klatkuje, bo cały teren rysuje się co klatkę). UWAGA: `frustumCulled=false` na terenie to był
   ŚWIADOMY fix regresu B0.6 (złe bounding sphere → znikający/„zalany" ląd) — więc rób culling per-komórka
   z poprawnym AABB + margines i dodaj przełącznik awaryjny `?culling=0` do porównania na żywo.
   NIE samo przestawienie flagi. ZAKAZ ABSOLUTNY: żadnych zmian w generatorze mapy / kolejności `rand()` /
   niczym wpływającym na hash mapy.
2. **Panel miasta:** blok „Surowce w zasięgu" renderuje się 2–3× (double-mount w runtime) i prawdopodobnie
   zakrywa suwaki podziału handlu (Skarb/Nauka/Zamożność). Root-cause: dwa współistniejące systemy panelu
   (stary „szkielet" + nowa ramka zakładkowa). Zdiagnozuj w DevTools — szczegóły w pakiecie panelu.
3. **Reszta z rejestru:** kolejka rekrutacji na dole zamiast obok produkcji, brak przełącznika miasto→miasto,
   nadprodukcja pracy → pula cywilizacji, refund przy anulowaniu jednostki z kolejki, brak wskaźnika końca tury,
   rozjazd wyniku państwo vs miasto.

## KOREKTY MASTERA (obowiązujące — governance, żeby nie było chaosu wersji)
1. **Kanał pracy:** meldunki i pytania piszesz do `dyspozycje/_handoff/KANAL-PRACA.md` w folderze Civ
   (OneDrive — ten udostępniony), NIE w swoim klonie. Append WYŁĄCZNIE po ostatniej linii; po zapisie
   sprawdź, że ostatni cudzy wpis nadal istnieje (reguła anty-kolizyjna). Na start: wpis potwierdzający
   przejęcie roli (`## [HH:MM PL, 2026-07-08] INTEGRATOR-CODE → MASTER`).
2. **W klonie NIE commitujesz zmian w `dyspozycje/`** (te pliki żyją w folderze Civ; commitowanie ich
   z klonu = konflikty). Commitujesz kod/konfigi/tools/data.
3. **Publikacja dla playtestów:** werdykty Macieja zapadają na bundlu single-file. Po domkniętej porcji:
   build singlefile → skopiuj do `gra-robocza/` w folderze Civ (Gra-ROBOCZA.html + kopie PLAYTEST) +
   stempel (`CIV-BUILD-STAMP-PENDING` → `YYYY-MM-DD HH:MM · md5[0:12]`, czas polski) + wpis do `WERSJE.md`
   + meldunek w kanale. Dev-server = szybki ogląd roboczy, nie werdykt.
4. **Git:** commit lokalny po każdej domkniętej zmianie (opis po polsku, bez dat — git stempluje sam).
   **`git push` WYŁĄCZNIE po wyraźnym „pushuj" od Macieja w Twoim czacie** (on jest jedyną bramką publikacji do repo).
5. **Jeden wykonawca:** publikacja i kod = Ty. Cowork-INTEGRATOR i lane UX stoją w odwodzie ([11:45]) —
   wolno Ci edytować także `ui/**` w ramach zadań z rejestru.
6. **Tryb oszczędny:** krótkie meldunki (fakty + CZEKAM-NA), zero tematów poza kolejką, zero zbędnych audytów.
7. **Zaparkowane (bez osobnego „start" Macieja nie ruszać):** audyt bonusów terenowych w bitwie,
   gęstość ujść głównych (zgoda na hash!), wizualne domknięcie rzek-render.
8. **REGUŁA STAŁA — panele sterowania (od 2026-07-08):** przed KAŻDYM pushem (a najpóźniej na koniec
   dnia pracy) sprawdź, czy zmiany dotknęły danych balansu (`gra/data/*.json` albo wartości, które opisuje
   któryś panel Excel). Jeśli tak → synchronizacja GRA→EXCEL + bramka round-trip (Excel→eksporter→JSON,
   diff=0) → jedno zdanie w meldunku: „panele zsynchronizowane" / „bez zmian danych balansu".
   Excel ma NIGDY nie być starszy od gry. (Kontekst paneli: wpis kanału [16:35], 2026-07-08.)

## Zasady końcowe
Buduj/testuj lokalnie na dev-serverze, commituj do klonu. Bramka: `tsc --noEmit` = 0.
Testy wizualne robi Maciej (uruchamia grę). Zacznij od dev-servera + przeczytania powyższych docs,
potem ZAPROPONUJ KOLEJNOŚĆ (D2 / panel / rejestr) — zatwierdza Maciej.
