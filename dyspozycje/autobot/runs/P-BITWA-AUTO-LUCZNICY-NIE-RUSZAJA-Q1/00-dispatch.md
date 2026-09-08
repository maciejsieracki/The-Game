STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL: Zdiagnozuj i napraw przypadek, w którym w trybie AUTO bitwy ("Tryb AUTO · walka
rozstrzyga się automatycznie") łucznicy/jednostki dystansowe stoją bezczynnie mimo wydanej
dyspozycji ataku, podczas gdy piechota w tej samej armii rusza normalnie.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (zrzut ekranu bitwy polowej, dwie armie łuczników+piechoty naprzeciw
  siebie): "Często przy ataku, z nieznajomych przyczyn, rusza tylko i wyłącznie piechota, a
  łucznicy stoją z boku, choć mają dyspozycję ataku."
- Silnik bitwy: `gra/src/battle/battleScene.ts` (bardzo duży plik, >17000 linii) — tekst
  hinta "Tryb AUTO · walka rozstrzyga się automatycznie · R = ręczna" (ok. linia 3478,
  świeżo zweryfikuj) potwierdza że to dokładnie ten ekran. Świeżo zweryfikowane przez
  orkiestratora punkty zaczepienia (NIE gotowa diagnoza — do zweryfikowania świeżym
  Read/symulacją):
  - `isRanged(bu)` (ok. linia 1309) i `canShoot(ru)` (ok. linia 1346-1348, wymaga
    `ru.rangedBase && ru.ammoLeft > 0`) — jednostka bez amunicji (`ammoLeft<=0`) może być
    świadomie wstrzymywana.
  - Komentarz nad `canShoot`/definicja "PRIMARY shooter" (ok. linia 1350-1361): jednostki
    czysto dystansowe (łucznik/procarz/oszczepnik) mają ŚWIADOMIE INNE zachowanie przy braku
    amunicji niż jednostki melee z kilkoma pociskami pomocniczymi (np. Legionista z pila) —
    "PRIMARY shooter który wystrzelał amunicję COFA SIĘ za linię melee zamiast szarżować" —
    to jest UDOKUMENTOWANE, ZAMIERZONE zachowanie dla przypadku braku amunicji, NIE myl go z
    bugiem. Sprawdź czy zgłoszenie właściciela pasuje do tego przypadku (amunicja=0) czy jest
    czymś innym.
  - Zmienna `shootingEnabled` (ok. linia 16612-16613, `if (isRanged && ru.shootingEnabled
    !== false)`) — sprawdź świeżo co ustawia `shootingEnabled` na `false` i czy mogło się to
    zdarzyć niezamierzenie (np. domyślna wartość, race warunek, zła synchronizacja stanu po
    wydaniu dyspozycji ataku).
  - Istnieje dedykowany harness testowy bitwy: `gra/src/battle/testBattle.ts` — sprawdź czy
    da się go użyć (albo rozszerzyć) do headless odtworzenia sceny bez pełnego UI/Chromium.

ZADANIE:
1. Odtwórz problem z dowodem — najlepiej `testBattle.ts` (jeśli nadaje się do headless
   uruchomienia) albo żywa bitwa w Chromium: armia z mieszanką piechoty i łuczników, tryb
   AUTO, dyspozycja ataku wydana dla całej armii (lub sprawdź czy dyspozycja jest per-jednostka
   czy per-armia — zweryfikuj świeżo jak UI faktycznie przekazuje "dyspozycję ataku" do
   silnika). Prześledź per-turę bitwy: czy `isRanged`/`canShoot`/`shootingEnabled` dla
   łuczników mają wartości, które POWINNY pozwolić na ruch/strzał, a mimo to żaden komenda
   ruchu/ataku nie jest generowana.
2. Ustal DOKŁADNĄ przyczynę z dowodem — rozróżnij WYRAŹNIE między:
   a. zamierzone zachowanie (np. wyczerpana amunicja → cofnięcie za linię melee, zgodnie z
      udokumentowanym komentarzem) — jeśli to jest przyczyna, to NIE jest bug, zgłoś to wprost
      i zapytaj czy właściciel to akceptuje (może wymagać UI wyraźniej pokazującego "brak
      amunicji" zamiast wyglądać jak bezczynność);
   b. faktyczny bug (np. `shootingEnabled` ustawione błędnie, cel poza zasięgiem bez
      przeliczenia ruchu w stronę celu, kolizja/blokada ścieżki przez własne jednostki melee
      stojące na drodze, dyspozycja ataku nie propagowana do jednostek dystansowych z jakiegoś
      powodu specyficznego dla ich typu).
3. Napraw źródło problemu JEŚLI to bug, z dowodem PRZED/PO (ta sama symulacja, łucznicy
   faktycznie ruszają/strzelają zgodnie z dyspozycją ataku po naprawie).

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt (zamierzone zachowanie vs bug, z
dowodem z symulacji/trace'u). Jeśli bug — naprawiony i udowodniony PRZED/PO: łucznicy z
dyspozycją ataku i dostępną amunicją faktycznie się poruszają/strzelają w trybie AUTO. `tsc
--noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy bitwy (jeśli są, plik z
"battle"/"combat" w nazwie w `gra/tools/`) nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/battle/battleScene.ts` (WYŁĄCZNIE funkcje/logikę decyzyjną ruchu-w-trybie-AUTO dla
  jednostek dystansowych, wskazaną świeżo diagnozą — nie przepisuj całego systemu walki)
- `gra/tools/*-test.cjs` (nowa bramka dowodu jeśli da się ją sensownie napisać dla tego
  systemu — jeśli nie, opisz dlaczego w raporcie zamiast wymuszać sztuczny test)
- `dyspozycje/autobot/runs/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1/*`
Zakaz `git add -A`. Zakaz zmiany zamierzonego zachowania "brak amunicji → cofnięcie za linię
melee" — to jest udokumentowana decyzja projektowa, nie dotyczy tego tematu, chyba że
diagnoza wprost pokaże że WŁAŚNIE TO jest mylnie interpretowane jako bug (wtedy zgłoś jako
obserwację UI, nie zmieniaj logiki).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji/trace'u bitwy (nie samo czytanie kodu i domysł). Zakaz "naprawienia" przez
wymuszenie ruchu łuczników bezwarunkowo — musi to być poprawka DOKŁADNIE tej przyczyny,
zweryfikowana że nie psuje istniejącego, zamierzonego zachowania "brak amunicji".

IZOLACJA: worktree `/home/user/wt-bitwa-lucznicy-auto`, gałąź
`autobot/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1`, baza `origin/main` @ `902bfa94`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium (jeśli potrzebna): `node ./node_modules/vite/bin/vite.js build --outDir
<poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny/logiki walki, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
