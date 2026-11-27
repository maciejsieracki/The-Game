# Przegrana gracza: kto i jak zdobywa jedyne miasto (tag DEFEAT)

Temat: R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT). Baza: `origin/main` = `fbd50d4e3` (ENDSTALL r1).
Zmiany gry: jeden read-only hak testowy w `gra/src/main.ts` (`__defeatTestDebug.cityThreatProbe`), bez zmian logiki, progów i danych (`gra/data/**` nietknięte).
Dane surowe (logi `*.txt`, poza repo): `scratchpad/defeat/` (runy `max`, `maxB`, `maxC`, `garrison`, `low`, `rt`, `rt2`).
Runner: `gra/tools/defeat-cause-live.cjs` (nowy). Poprawka klasyfikacji `gameOver` w `gra/tools/endstall-fortring-live.cjs` i `gra/tools/vlive3-fortring-live.cjs`.

## Wynik w czterech zdaniach

1. Jedyne miasto gracza zdobywają BARBARZYŃCY (właściciel -1) w 13 z 13 przegranych przebiegów; żaden AI ani żadna wojna nie była tu przyczyną.
2. Zdobycie następuje w fazie barbarzyńców kolejnej tury po tym, jak 1–2 „Wojownik szekelesz” podejdą na odległość 1–2 heksów od miasta. Miasto broni jedynie startowy Zwiadowca (kategoria `zwiadowca`, poza garnizonem), walka jest rozstrzygana automatycznie (otwarte podsumowanie bitwy w turze przegranej).
3. Przy wariancie „max + dwie jednostki wojskowe gracza na mieście” przegrana nie wystąpiła w 10 z 10 przebiegów (wszystkie 20 tur ukończone).
4. Round-trip po przegranej: zapis był blokowany przez otwarte podsumowanie bitwy, po jego zamknięciu zapis i odczyt działają; ślad `[Diag:load] OK tura=N miasta=1` przy `owners=[]` w ENDSTALL to miasto należące do barbarzyńców (snapshot ich pomija). Artefakt harnessu, nie błąd zapisu (szczegóły w punkcie 3).

## 1. Przyczyna utraty miasta (pkt 1 celu) — seed 4242 i 7, maksimum, FORTRING ON, gracz bierny

Ustawienia maksimum (jak w ENDSTALL): Trudny / dyplomacja „trudna” / koszty jednostek „wysoki” ×4 / kultura i religia „trudny”, mapa Mały, Rzymianie, 2 państwa-miasta. Przebieg: 20 tur, gracz bierny (bitwy zamykane trybem auto, jak w runnerze ENDSTALL), jeden fort wymuszony przy mieście.

Zmierzone przebiegi przegranej (13 z 42 przebiegów maksimum):

| Przebieg | Ziarno | Tura przegranej | Zdobywca (owner) | Obcy w promieniu 3 w turze poprzedniej | Garnizon/obrona gracza przed utratą | Podsumowanie bitwy w turze przegranej |
|---|---|---|---|---|---|---|
| r-4242-20449 | 4242 | 8 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca (poza garnizonem) | tak |
| r-7-3705 | 7 | 12 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run4-s7 | 7 | 16 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run7 | 4242 | 10 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run9 | 4242 | 9 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run12 | 7 | 9 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run14 | 4242 | 13 | barbarzyńcy (-1) | Wojownik szekelesz ×2 | Zwiadowca | tak |
| run15 | 4242 | 8 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run16 | 7 | 8 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run17 | 4242 | 13 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run19 | 4242 | 11 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run22 | 4242 | 9 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |
| run27 | 4242 | 11 | barbarzyńcy (-1) | Wojownik szekelesz ×1 | Zwiadowca | tak |

Wnioski z tabeli:
- Zdobywca: 13/13 barbarzyńcy, 0/13 AI, 0/13 państwa-miasta. Wojna wypowiedziana przed utratą: nie dotyczy (barbarzyńcy nie wypowiadają wojny; żaden AI nie zdobył miasta gracza w żadnym z 42 przebiegów maksimum).
- Źródło: w turze 5 w logu pojawiają się „nowe obozy: 2” i dwa wpisy `Spawn: Wojownik szekelesz` (w odległości kilku–kilkunastu heksów od miasta gracza); wojownicy dochodzą do miasta w ciągu ok. 3–4 tur.
- Garnizon: w każdym z 13 przypadków jedyną jednostką gracza na heksie miasta jest startowy Zwiadowca. Nie jest to jednostka wojskowa obronna i nie stoi w garnizonie. Miasto bez obrony zostaje zdobyte w jednej bitwie.
- Przebiegi bez utraty (29 z 42) kończą 20 tur. Maksimum w tym scenariuszu: utrata w turach 8–16 (mediana 10).
- Z wymienionych tur 13 przegranych ma tura przegranej przedział 8–16; to ten sam przedział, który podał ENDSTALL.

Różnica wobec ENDSTALL (15/24 = 62% na seed 4242) nie została wyjaśniona. Tu seed 4242 daje 9/31 (29%), seed 7 daje 4/11 (36%). Nie zbadano, czy różnica wynika z wersji runnera, z kolejności wywołań sondy, czy z innego bazowego commita; NIE ZMIERZONO przyczyny różnicy.

## 2. Porównanie ustawień (pkt 2 celu, 10 przebiegów na wariant)

| Wariant | Opis | Ziarno 4242 | Ziarno 7 | Razem przegranych / 10 |
|---|---|---|---|---|
| (a) maksimum | jak wyżej; wszystkie 42 przebiegi maksimum (w tym serie z sekcji 1) | 9/31 | 4/11 | 13/42 (31%) |
| (b) dolny poziom dyplomacji/kosztów/kultury | jak maksimum, ale Dyplomacja „łatwa”, Koszty jednostek „niski”, Kultura „łatwy”; poziom trudności pozostaje Trudny | 2/5 | 4/5 | 6/10 |
| (c) maksimum + 2 jednostki wojskowe gracza | dwie jednostki klonowane przez istniejący hak (`__hotSeatTestDebug.spawnTestUnitForPlayer`) na heksie miasta w turze 5/6, gdy w świecie pojawi się pierwsza jednostka wojskowa | 0/5 | 0/5 | 0/10 |

Uwagi do wariantów:
- Wariant (b) wykonano zgodnie z dispatchem (pkt 2b). Właściciel w zasadach testowania wskazał, że poziomy inne niż maksymalne nie muszą być mierzone; wynik traktuję jako informacyjny.
- Wariant (c): w starcie gry w świecie nie ma żadnej jednostki wojskowej (tylko zwiadowca i cywilne), więc hak klonujący szablon wojskowy zwracał `null`. Dlatego jednostki stawiano w pierwszej turze, w której pojawia się barbarzyńska jednostka wojskowa (tura 5/6). Są to klony wojownika barbarzyńców (ten sam typ i statystyki), a nie jednostki z pełnej produkcji gracza. Odstępstwo od „zbuduj/ustaw” z dispatchu; NIE ZMIERZONO wariantu z jednostkami budowanymi realnie przez gracza.
- W wariancie (c) w 3 z 10 przebiegów (g2, g3, g7) widziano otwarte podsumowanie bitwy w co najmniej jednej turze; miasto zostało utrzymane we wszystkich 10.
- W wariancie (b) wszystkie 6 przegranych ma tę samą przyczynę (barbarzyńcy, Zwiadowca bez garnizonu).

Wniosek liczbowy: w maksimum i w wariancie (b) utrata jedynego miasta bez obrony wojskowej występuje w ok. 30–60% przebiegów; z dwiema jednostkami obronnymi w wariancie (c) — w 0 z 10.

## 3. Round-trip po przegranej (pkt 3 celu)

Odtworzenie (`rt`, `rt2`): po przegranej w turze N (wielokrotnie: N=9, 10):
- Przed zapisem okno podsumowania bitwy było otwarte (`battle.summaryOpen = true`). Zapis był wtedy odrzucany (`saved: false`), a `[Diag:load] brak danych` oznaczał brak zapisu w slocie. Przyczyna: twarda bramka `isSaveBlockedByBattle` w `persistSaveToSlot`.
- Po zamknięciu bitwy (`clearBattles`, 1 zamknięcie) zapis się udaje (`saved: true`), `[Load] ... tura=N`, `[Diag:load] OK tura=N miasta=1`. Po wczytaniu: `tracked owner = -1` (miasto barbarzyńców), `playerOnHex = 0`, `gameOver = false`.
- Po wczytaniu jeden koniec tury przywraca przegraną (`gameOverAfter: true`, właściciel -1).

Wniosek: ślad ENDSTALL `[Diag:load] OK tura=9 miasta=1` przy `owners=[]` jest zgodny z zachowaniem gry. `miasta=` w logu to `cities.length` (wszystkie miasta, także należące do barbarzyńców), a `owners` w snapshot pomija barbarzyńców (`isAiOwner && !isBarbarian`). Jedyne miasto należało do barbarzyńców.

Werdykt: ARTEFAKT HARNESSU (bramka zapisu przy otwartym podsumowaniu bitwy + definicja snapshot). Nie stwierdzono błędu zapisu/odczytu po przegranej.

Obserwacja do oceny (nie błąd potwierdzony): po wczytaniu zapisu z przegraną stan pokazuje `gameOver = false` aż do końca tury; przegrana jest wtórnie wykrywana w tym końcu tury. Czy ekran porażki powinien wracać od razu po wczytaniu, to pytanie o zachowanie, nie o poprawność; zostawiono do decyzji orkiestratora.

## 4. Runner (pkt 4 celu)

- `gra/tools/endstall-fortring-live.cjs` i `gra/tools/vlive3-fortring-live.cjs`: gdy bramka tury jest zablokowana i `__defeatTestDebug.isGameOver() === true`, zapis to `kind: 'result', outcome: 'przegrana'` (wynik przebiegu), nie `stop/cannot-end`.
- Nowy `gra/tools/defeat-cause-live.cjs`: rejestruje na każdą turę właściciela miasta gracza, obce jednostki w promieniu 3, jednostki gracza na heksie miasta, stan bitwy i linie konsoli o bitwach/zdobyciu; wariant `max | low | garrison`; po przegranej round-trip z zamknięciem bitew i jednym końcem tury po wczytaniu.

## 5. Ograniczenia

- Liczby pochodzą z żywego Chromium, dane surowe w `scratchpad/defeat/` (poza repo). Nie zapisano wizualnej weryfikacji ekranu porażki.
- „Otwarte podsumowanie bitwy” w turze przegranej potwierdza, że walka była (auto-rozstrzygnięcie), ale nie zapisuje jej wyniku liczbowego (siły, straty). Liczebność obrońców i atakujących z logu bitwy NIE ZMIERZONO.
- Stan wojny (formalne wypowiedzenie) nie był odczytywany osobnym hakiem; dla zdobywcy barbarzyńskiego ustalenie „wojny” nie ma zastosowania.
- Wariant (c) z klonami wojskowymi barbarzyńców zamiast realnej budowy przez gracza.

## Pytanie do właściciela (jednozdaniowe, dla orkiestratora)

DECISION_REQUIRED: Przy maksymalnym ustawieniu gry, gdy gracz nie buduje obrony, jedyne miasto ginie w ok. 31% przebiegów (tury 8–16) w ataku barbarzyńców, a z dwiema jednostkami wojskowymi na mieście — w 0% przebiegów: (A) zostawić obecny balans, przy którym ten start bez obrony bywa przegrany; (B) zwiększyć obronę startową gracza (mniej przegranych, zmiana dla wszystkich ustawień); (C) zmienić zachowanie barbarzyńców w pobliżu miasta gracza w pierwszych turach (mniej przegranych bez zmiany obrony gracza). Decyzja należy do właściciela; parametrów nie zmieniono.
