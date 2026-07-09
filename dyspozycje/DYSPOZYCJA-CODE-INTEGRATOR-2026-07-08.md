# DYSPOZYCJA STARTOWA — INTEGRATOR w Claude Code (od MASTERA, 2026-07-08)

Jesteś INTEGRATOREM projektu The Game (Civ). Pracujesz natywnie na folderze Civ
(to jest repo git — GitHub Desktop działa na nim; origin: github.com/maciejsieracki/The-Game).

## 1. Wejście w rolę (zanim cokolwiek zrobisz)
- Przeczytaj `dyspozycje/START-TU.md`, potem OGON `dyspozycje/_handoff/KANAL-PRACA.md` —
  obowiązkowo wpisy z 2026-07-08: [11:00], [11:10], [11:25], [11:45] (przejęcie roli przez Ciebie)
  oraz [17:15 PL z 2026-07-06] (tryb oszczędny).
- Potwierdź przejęcie WPISEM w kanale: format `## [HH:MM PL, 2026-07-08] INTEGRATOR-CODE → MASTER`,
  append WYŁĄCZNIE po ostatniej linii pliku; po zapisie zweryfikuj, że ostatni cudzy wpis nadal istnieje
  (reguła anty-kolizyjna [15:05]). Nigdy nie nadpisuj cudzych wpisów.

## 2. Środowisko builda (jednorazowo)
- `node_modules` i dev-server POZA OneDrive (np. `C:\dev\civ`) — npm install tam, NIE w folderze Civ.
- Źródła edytujesz w repo: `gra-robocza/srcKopiaMaster/` (drzewo produkcyjne).
- Build: vite singlefile (konwencje i skrypty w `gra-robocza/tools/`; manifest `ROBOCZA-MANIFEST.json`);
  stempel: zamień `CIV-BUILD-STAMP-PENDING` na `YYYY-MM-DD HH:MM · md5[0:12]` (czas polski);
  wynik = `gra-robocza/Gra-ROBOCZA.html` + kopie PLAYTEST + regeneracja huba + wpis do `dyspozycje/WERSJE.md`.

## 3. Zadanie D3 (proste)
Usuń zbędny `refreshFog()` przy otwarciu panelu miasta. Spec: `dyspozycje/KURSOR-3-DYSPOZYCJE-WYDAJNOSC.md`
+ `dyspozycje/DO-KURSORA-wydajnosc-mapa-miasto.md`. Z Dysp. 3 robimy TYLKO refreshFog (reszta anulowana po D1
— decyzja MASTERA [11:10] pkt 4). Najpierw zweryfikuj, że nic nie zależy od tego wywołania.
Bramki: `tsc --noEmit` = 0 błędów, vite build OK. Potem: deploy + stempel + WERSJE + wpis w kanale +
poproś Macieja o test (wejście do miasta na dużej mapie; mgła bez artefaktów).

## 4. Zadanie D2 (trudne — pełna ostrożność, DOPIERO po werdykcie Macieja z D3)
Frustum culling terenu (pan/zoom klatkuje, bo `frustumCulled=false` → GPU rysuje ~320k pryzm co klatkę).
KRYTYCZNA HISTORIA (B0.6): `frustumCulled=false` było ŚWIADOMYM fixem znikającego/„zalanego" lądu
(domyślne bounding sphere InstancedMesh nie obejmują instancji). Samo przestawienie na `true` przywróci buga.
Wymagania:
- policz poprawny `boundingSphere`/`boundingBox` PER CHUNK z realnych pozycji instancji, dopiero potem `frustumCulled=true`;
- dodaj przełącznik awaryjny `?culling=0` (wyłącza culling w runtime, do porównania na żywo);
- ZAKAZ ABSOLUTNY: żadnych zmian w generatorze mapy / kolejności `rand()` / niczym wpływającym na hash mapy.
Bramki jak w D3. Deploy OSOBNY od D3 (efekt ma być przypisywalny).
Test Macieja: F9 → draw calls przy panie wyraźnie spadają; szybki pan/zoom bez dziur i znikających chunków.

## 5. Zasady stałe
- Commit lokalny po każdej domkniętej zmianie (opis po polsku, bez dat). **PUSH robi wyłącznie Maciej** (GitHub Desktop).
- Publikacja bundli do `gra-robocza` = wyłącznie Ty (Cowork-integrator stoi w odwodzie — [11:45]).
- Tryb oszczędny: krótkie meldunki (fakty + CZEKAM-NA), zero tematów poza kolejką, zero zbędnych audytów.
- Nie edytujesz `ui/**` (lane UX). Pytania do Macieja: w czacie + wpis w kanale.
- Dev-server możesz odpalać Maciejowi do szybkiego oglądu, ale WERDYKTY playtestów zapadają na bundlu z `gra-robocza`.

## 6. NIE ruszać (zaparkowane, czekają na osobny „start" Macieja)
Audyt bonusów terenowych w bitwie · gęstość ujść głównych (wymaga zgody na zmianę hasha) ·
persystencja kreatora new-game · wizualne domknięcie rzek-render.

## Kolejność teraz
1) Wejście w rolę + wpis potwierdzający w kanale. 2) Środowisko. 3) D3 → deploy → prośba o test.
4) STOP — czekasz na werdykt Macieja. 5) D2 po jego zgodzie.
