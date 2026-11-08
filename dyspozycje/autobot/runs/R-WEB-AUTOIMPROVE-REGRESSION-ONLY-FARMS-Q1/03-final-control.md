STATUS: FAIL
DOMAIN: GAME (WEB), auto-ulepszenia terenu
TEMAT: R-WEB-AUTOIMPROVE-REGRESSION-ONLY-FARMS-Q1
GOAL: odtworzyc regres "same farmy, budzet niewydany", wskazac sprawce, naprawic, dodac test regresyjny.
ZMIANY-COMMIT: tylko ten plik (Final Control). Kod gry bez zmian. Wczesniej: 49dc115cb (Operator r1, 2 pliki w katalogu runu, zgodne z allowlista; istnieje tylko na galezi worktree-wf_12a9685d-aff-1, bez push). Baza: origin/main a61337844.

WERYFIKACJA WLASNA (FC):
- 49dc115cb: `git show --stat` = 01-operator-r1.md + repro-multicity-picker.cjs (91 wstawien), zero zmian kodu -> allowlista OK.
- Filtr bramki auto-build: gra/src/main.ts:38370-38375 (`autoImpCities`: `isAutoBuildAllowedFor(hOid)` false = brak WSZYSTKICH auto-ulepszen gracza, potem `effectiveUlepszeniaForCity(c).tryb === 'auto'` per miasto). Bramka jest binarna per gracz; nie daje trybu "tylko farmy". Flaga dotyczy ulepszen terenu, ale nie jest przyczyna objawu (gracz widzi farmy, wiec bramka jest ON). Tryb per miasto (`tryb`) to osobna os, nie zmierzona jako przyczyna.
- Trzoda/owce/lama: auto-improvements.ts:557, 1391-1395, 1865, 1957 -> wymog `onRiverHex` (= `isHexNearRiver`), "wiazaca specyfikacja" wlasciciela (R-WEB-AUTOIMPROVE-PRIORITY-Q1, ABC-B). To decyzja rozstrzygnieta, NIE luka.
- Liczb 299/46/13/30/42 FC nie odtwarzal (NIE_ZMIERZONO przez FC; brak node_modules w worktree).

ORZECZENIE PER ZARZUT:
1. Brak bisectu -> ODDAL. Obrona wykonala repro na a61337844, fb75c1631^, 51086350f^, 1c19e0aba^: identyczne {"farma":250,"bydlo":50,"irygacja":50}. Wynik negatywny, ale wykonany. Nie wykonano d7b8b7548^, dbfc45311^, e5bb46741^ (bisect ma sens dopiero na realistycznej mapie, pkt 2).
2. Repro nie odpowiada zgloszeniu (mapa bez lasow/wzgorz/drog, 1 rzeka; hipoteza wyczerpania rzek -> E5 same farmy nie sprawdzona) -> NAPRAW. To jedyna wykonalna bez zapisu wlasciciela diagnostyka i nadal nie jest zrobiona. Obrona sama przyznaje brak mapy z lasami/wzgorzami/drogami i 26 miastami. Wynik "farmy zajmuja wszystkie hexy pracujace, picks={} od t4" wskazuje na mechanizm strukturalny (wyczerpanie heksow przy rzece); trzeba go porownac przed/po d7b8b7548 (nowa definicja `onRiverHex`), 1c19e0aba/b97f9d46a na mapie z wieloma rzekami i terenem nierzecznym.
3. DECISION_REQUIRED "trzoda wymaga rzeki?" -> ODDAL. Rozstrzygniete w kodzie/specyfikacji. Zalozenie: E3/E4 tylko przy rzece obowiazuje, dopoki wlasciciel nie powie inaczej. Nie zglaszac ponownie.
4. Blokady 3/4 (irygacja vs trzoda przy malej puli, nadwyzka PCT) -> ODDAL jako DECISION_REQUIRED: decyzja #24 (budzet = twardy sufit), komentarz E4 "koszt ponad budzet = nie budujemy". Przy PCT 33 nadwyzka jest oczekiwana. Zalozenie: kolejnosc E3 przed E4 i rezerwa 30 obowiazuja.
5. Brak wyjasnienia flagi auto-build z plik:linia -> ODDAL (dostarczone wyzej: main.ts:38370-38375).
6. Brak testu autoimprove-regression-only-farms-test.cjs -> ODDAL w tej rundzie (bez odtworzonego objawu nie ma co przypinac); WYMAGANY po znalezieniu sprawcy.
7. Brak odtworzenia liczb przez Evaluatora (dysk) -> ODDAL jako uwaga; dysk obecnie 3,5 GB wolnego, esbuild/three w scratchpadzie Obrony.

DO DECYZJI CZLOWIEKA: brak realnej decyzji produktowej w tej rundzie.

BLOKADY: brak techniczny; pkt 2 do wykonania.
RUNDY: 2/5 zuzyte (Operator r1, Obrona r2); nastepna = runda 3/5, ten sam ID. Ostatni werdykt: FAIL.
NASTEPNY KROK (runda 3): (a) mapa harness: 26 miast, wiele rzek, lasy, wzgorza, drogi, miasta w roznych odleglosciach od rzek, Epoka Brazu, PCT 33 i 100, duza pula; (b) zmierzyc rozklad picks na turze i liczbe heksow pracujacych bez dostepu do rzeki; (c) jesli "same farmy" sie powtarza, bisect na d7b8b7548^, 1c19e0aba^, b97f9d46a^, fb75c1631^, e5bb46741^ z kryterium bydlo+irygacja; (d) jesli wszystkie snapshoty identyczne -> NIE_REGRES (zgodne ze specyfikacja) i pytanie ABC orkiestratora "zamierzone czy nie"; (e) jesli sprawca -> naprawa + gra/tools/autoimprove-regression-only-farms-test.cjs padajacy na kodzie sprzed naprawy.

SHA KONCOWY DO INTEGRACJI: brak (49dc115cb to wylacznie dokumentacja runu). Kolejnosc wzgledem origin/rust-port/parity-v2: bez zaleznosci (temat dotyka tylko gra/ i dyspozycje/, nie rust-port/**), integrowac dopiero po PASS.
DEPLOY/PUSH: NIE WYKONANO
