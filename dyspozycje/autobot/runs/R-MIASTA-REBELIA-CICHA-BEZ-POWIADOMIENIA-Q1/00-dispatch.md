TEMAT:  R-MIASTA-REBELIA-CICHA-BEZ-POWIADOMIENIA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat LOGIKI GRY/POWIADOMIEŃ (nie czysto wizualny,
ale wymaga żywej reprodukcji scenariusza w grze) — Operator Sonnet 5
effort=high / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5
effort=high.

## WYZWALACZ
Właściciel, dwa kolejne zrzuty (mapa z podpisanymi cywilizacjami + panel
relacji z Sumerami, "Pakt nieagresji", PRZYJAZNY): "Nie wiem, jak to się
stało, ale inna cywilizacja przejmuje moje miasta, tak by nie wypowiadała
mi wojny. Nie jestem w stanie wojny z tą cywilizacją [...] Albo jest jakiś
bug, albo to jest jeszcze może przejęcie kulturalno-religijne [...] Daj
znać co jest grane." Doprecyzowanie: "właśnie że to własnie Sumerowie mi
zajęli te miasta a miałem z nimi pakt więc żadnej wojny oficjalnie nie
było, jest jakiś bug z tym i musisz to znaleźć i naprawić."

## RECON (wykonany, nie powtarzaj — wniosek NIE jest jeszcze potwierdzony
## żywą reprodukcją, tylko śledzeniem kodu, Operator MUSI to zweryfikować)

**Odrzucone hipotezy:** (a) "przejęcie kulturalno-religijne" — NIE istnieje
w kodzie żaden mechanizm zmieniający właściciela miasta na tej podstawie
(kultura/religia dziś realnie wpływają wyłącznie na zamieszki/niezadowolenie).
(b) Bezpośredni bug w bramce paktu nieagresji (`hasTreaty`) — sprawdzona
funkcja (`diplomacy-treaties.ts:223-235`) używa `pairKey(a,b)`,
symetrycznej dla obu kierunków argumentów — brak oczywistej asymetrii.

**Najbardziej prawdopodobne wyjaśnienie (do potwierdzenia żywo):**
DWUETAPOWY, CICHY proces niewymagający złamania paktu:
1. Miasto GRACZA (`city.ownerId === 0`) z długotrwałym niskim porządkiem/
   wysokim ryzykiem buntu przekracza próg `revoltGrace` (`main.ts:27417-
   27438`, funkcja `updateRevoltGrace`) i dostaje `city.ownerId =
   REBEL_FACTION_OWNER_ID` — miasto STAJE SIĘ NIEZALEŻNE (frakcja
   rebeliancka, NIE gracz, NIE żadna cywilizacja AI). Jedyny ślad tego
   zdarzenia: `console.log(`[Rebelia] Tura ${turn} ${city.name} → frakcja
   rebeliantów`)` — deweloperski log w konsoli przeglądarki, KOMPLETNIE
   niewidoczny w normalnej rozgrywce. Brak `showHintMessage`/toastu/modala.
2. Miasto rebelianckie (już NIE gracza) zostaje później zdobyte przez
   sąsiednią cywilizację AI (tu: Sumerowie) zwykłą ścieżką bojową —
   `runCapitalCapturePlunder` (`main.ts:24497-24504`) jawnie obsługuje
   `oldOwner === REBEL_FACTION_OWNER_ID` jako osobny, prawidłowy przypadek
   ("odbicie miasta rebelianckiego"). To NIE wymaga wojny między Sumerami
   a graczem — miasto nie należy już do gracza w chwili zdobycia.

Złożenie: gracz nigdy nie widzi (1) — miasto "znika" z jego imperium bez
żadnego komunikatu w grze — a potem widzi tylko (2), czyli już obce miasto
należące do Sumerów, z którymi ma nietknięty pakt. Subiektywne wrażenie:
"Sumerowie zabrali mi miasto bez wojny" — mechanicznie poprawne (pakt
nigdy nie został złamany), ale DOŚWIADCZENIE gracza jest złe, bo etap (1)
jest kompletnie niewidoczny.

**Precedens w tym samym pliku pokazujący jak TO POWINNO wyglądać:**
inne wypowiedzenia wojny/zdarzenia mają prawdziwy komunikat w grze, np.
`main.ts:9317` (`showHintMessage('⚔ ' + ... + ' wypowiada wojnę
(ultimatum)', 4500)`) i `main.ts:28089` (analogicznie dla miasta-państwa).
Bunt/rebelia (`main.ts:27436`) i przejęcie stolicy w wyniku rebelii NIE
mają odpowiednika.

## GOAL
Krok 1 (obowiązkowy PRZED zmianą kodu): żywo zreprodukuj CAŁY łańcuch
zdarzeń w symulacji — miasto gracza z celowo obniżonym porządkiem aż do
przekroczenia progu buntu → potwierdź że `city.ownerId` faktycznie zmienia
się na `REBEL_FACTION_OWNER_ID` BEZ żadnego komunikatu w warstwie UI (nie
tylko konsoli) → potwierdź że sąsiednia AI może następnie zdobyć to miasto
bez wpływu na relację/pakt gracz↔ta AI. Jeśli którykolwiek krok się NIE
potwierdzi (np. jednak istnieje jakiś komunikat UI, którego recon nie
znalazł, albo mechanizm działa inaczej) — zgłoś to jawnie zamiast zakładać.

Krok 2: dodaj realny, widoczny w grze komunikat (analogiczny do
`showHintMessage`/toastu używanego przy innych zdarzeniach dyplomatycznych/
buntu w tym pliku — dobierz wzorzec, nie wymyślaj nowego stylu) w DWÓCH
momentach: (a) gdy miasto GRACZA traci status wskutek buntu i staje się
rebelianckie (`main.ts:27429-27437`) — komunikat jasno mówiący że miasto
się zbuntowało/usamodzielniło, NIE że zostało "podbite przez wroga"; (b)
jeśli miasto rebelianckie należące wcześniej do gracza zostaje przejęte
przez inną cywilizację (rozszerzenie istniejącej obsługi w
`runCapitalCapturePlunder`/miejscu wołającym) — komunikat informujący
gracza który konkretnie sąsiad przejął dawne jego miasto, żeby uniknąć
dokładnie tego zamieszania co w zgłoszeniu ("czy to bug, czy pakt złamany").
Zero zmian w SAMEJ logice buntu/przejęcia — wyłącznie warstwa powiadomień.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód (symulacja/test w `gra/tools/`, node): miasto gracza z
   obniżonym porządkiem PRZEKRACZA próg buntu i `city.ownerId` zmienia się
   na `REBEL_FACTION_OWNER_ID` — potwierdzone bezpośrednio.
2. Żywy dowód PRZED poprawką: to zdarzenie NIE generuje żadnego wpisu w
   strukturze zdarzeń/UI dostępnej graczowi (tylko `console.log`).
3. Żywy dowód PO poprawce: to samo zdarzenie generuje realny, widoczny
   komunikat w grze (sprawdzony w strukturze zdarzeń/UI, nie tylko w
   kodzie źródłowym — jeśli to wymaga żywego Chromium, użyj
   `page.screenshot()`).
4. Żywy dowód: przejęcie dawnego miasta gracza (już rebelianckiego) przez
   sąsiednią AI generuje komunikat identyfikujący tę AI, PO poprawce.
5. Żywy dowód braku regresu: normalne zdobycie miasta w wyniku wojny
   (gracz↔AI, AI↔AI) nadal działa i komunikuje się jak dotychczas — nowe
   komunikaty nie duplikują ani nie zastępują istniejących.
6. Żywy dowód braku regresu: `runCapitalCapturePlunder` i logika eliminacji
   (`R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI`, guard `REBEL_FACTION_
   OWNER_ID` na linii 24504) działają identycznie jak dziś.
7. Diff ograniczony do plików w ALLOWLIŚCIE.
8. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy buntu/rebelii/przejęcia miasta w `gra/tools/`
   (znajdź po nazwie, np. `*rebel*`, `*revolt*`, `*capital-capture*`,
   `*city-capture*`) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE punkty wywołania powiadomień przy zmianie
`city.ownerId` na/z `REBEL_FACTION_OWNER_ID` — zero zmian w logice
`updateRevoltGrace`/progach buntu/`runCapitalCapturePlunder` poza samym
dodaniem wywołania powiadomienia), nowy/rozszerzony plik testowy w
`gra/tools/`. Jeśli komunikat wymaga nowego komponentu UI (nie samego
`showHintMessage`) — dozwolone WYŁĄCZNIE dodanie, nie przebudowa
istniejących paneli zdarzeń; udokumentuj wybór. Zakazane bezwzględnie:
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-MIASTA-REBELIA-CICHA-BEZ-POWIADOMIENIA-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz zakładania że hipoteza z RECON jest poprawna bez żywej reprodukcji
całego łańcucha (Krok 1) — jeśli mechanizm działa inaczej niż opisano,
powiedz to wprost i zbadaj RZECZYWISTĄ przyczynę zamiast na siłę potwierdzać
gotową hipotezę. Zakaz zmiany logiki buntu/progu ryzyka — właściciel prosi
o WIDOCZNOŚĆ zdarzenia, nie o zmianę częstotliwości/warunków buntu. Zakaz
uznania kryterium 3/4 za spełnione bez potwierdzenia że komunikat realnie
trafia do gracza (nie tylko do wewnętrznej struktury danych, którą nic nie
renderuje).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5) → Evaluator (Sonnet 5, zarzuty, lista może być pusta) →
Operator (Obrona, Sonnet 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
