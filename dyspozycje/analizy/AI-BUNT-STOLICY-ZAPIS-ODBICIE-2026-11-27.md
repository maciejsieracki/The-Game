# AI-BUNT-STOLICY — zapis/wczytanie, odbicie, Mennica/Pałac, skarbiec, bieg 21 tur (R-WEB-AI-CAPITAL-REBEL-SAVE-Q2, tag CAPREBEL2)

Data: 2026-11-27. Baza kodu: `b7830f1de` (origin/main). Runda 2 (obrona Operatora, Haiku 5.5).
Kontynuacja `AI-BUNT-STOLICY-SKUTKI-2026-11-27.md` (CAPREBEL).

Surowe dane (`dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/dane/`):
- Skarbiec (runda 1): `capital-bunt-s{4242,7,778899}-10t.txt`, `capital-ctl-s{4242,7,778899}-10t.txt`
- Zapis/wczytanie (runda 2): `caprebel2-sl-s4242.txt`
- Odbicie (runda 2): `caprebel2-odb-s4242.txt`
- Mennica/Pałac (runda 2): `caprebel2-men-s4242.txt`
- Bieg 21 tur po buncie (runda 2, 4 wywołania): `caprebel2-long-s4242-c1.txt` … `caprebel2-long-s4242-c4.txt`

Narzędzie: `gra/tools/caprebel2-live.cjs` (nowe; tryby `sl`, `odb`, `men`, `long`). Bundle live zbudowany poza repo (esbuild przez `tools/test-hook-setcitylimit-live-bundle.cjs`, katalog w scratchpad, usunięty po pracy). `gra/src` bez zmian.

## Ustawienia (poziom maksymalny)

Start przez `__settingsLive.startNewGame` z `MAX_PARAMS` (jak runda 1): Trudny, kultura i religia trudny, koszty jednostek Wysoki ×4, dyplomacja wojenna trudna, wzrost surowców z epoką ON, zwycięstwo WŁĄCZONE. Wymuszenie buntu: `__rebelNotifyTestDebug.forceRevoltEligible(stolica)`. Ziarno 4242 (właściciel 13, stolica city16). Maksimum uznane jak w rundzie 1. Nie zmierzono innych poziomów.

## Tabela pozycji

| Pozycja | Wynik | NIE ZMIERZONO / próba |
|---|---|---|
| 1. Zapis PRZED buntem → wczytanie → ten sam przebieg; zapis PO buncie → wczytanie | ZMIERZONO, CZĘŚCIOWO. Stolica po wczytaniu zapisu przed buntem = city16, po wczytaniu zapisu po buncie = city17 (jak przed zapisem); ponowny bunt po wczytaniu daje city17, skarbiec 16 (jak pierwszy bieg). Digest (`__detHarness.digest`) NIE jest tożsamy: pre len 31837 vs wczytany len 38767; bieg po buncie len 41686 vs ponowny len 44416; zapis po buncie len 41686 vs wczytany len 44453. Różnica ~7 tys. znaków utrzymuje się także bez pola `podzialPracy` (30246 vs 37176). Przyczyny nie zbadano. | Nie zbadano, czy różnica digestu to brak pełnej odtwarzalności zapisu czy wyłącznie inna reprezentacja stanu po wczytaniu. Kandydat do osobnej diagnozy, nie błąd potwierdzony. |
| 2. Odbicie zbuntowanego miasta; czy stolica AI wraca do starego miasta | NIE ZMIERZONO (próba wykonana, odrzucona przez regułę gry). Hak `__ledgerRealPathDebug.cession(city16, rebel, AI)` zwrócił `false`; ostrzeżenie gry: „Stolicy nie można oddać w pokoju”. Odbicie przez podbój nie ma haka. Po buncie jawny wpis `capitalCityIdByOwner` pozostaje `null` przed i po buncie (`explicitCapitalNow` = null w każdym wierszu), więc w tym biegu nie powstał stary wpis do „odtworzenia”. | Powrót stolicy po odbiciu przez podbój nie zmierzony. Opis z kodu: `capitalCityIdForOwner` (`gra/src/main.ts` ~40158) zwraca jawny wpis tylko, gdy miasto nadal należy do właściciela (`c.ownerId === ownerId`), w przeciwnym razie najstarsze miasto właściciela. Stary wpis wskazujący city16 ożyłby więc dopiero, gdyby city16 wróciło do AI (np. podbojem). Zostaje do zmierzenia po dodaniu ścieżki podboju do haka testowego. |
| 3. Mennica / Pałac w stolicy po buncie | ZMIERZONO (1 bieg, ziarno 4242). Przed buntem `adminSetup` (hak `window.__civTest.adminSetup`) postawił Mennicę i Pałac w city16 (właściciel 13). Po buncie: nowa stolica city17 nie ma żadnego budynku w turach 2–4 (`capNowBuildings` = []). Mennica i Pałac zostały w city16, które przeszło na frakcję buntowniczą (`ownerId` −99; `mennicaAnyCities` = city16/−99). `mennicaWCapitalOwner` = false, `orphanMennicaOwner` = [] (osierocona Mennica liczy się tylko dla miast właściciela, więc tu jej nie widać). | Mennica nie wraca do AI ani nie powstaje w nowej stolicy w tych turach. Wpływ na skarbiec (Mennica w stolicy) nie zmierzony osobno. |
| 4. Skarbiec: ≥ 3 ziarna, 10 tur, bunt vs kontrola | ZMIERZONO (runda 1, bez zmian). Liczby z surowych plików `capital-*-10t.txt`. Patrz tabela poniżej. | Korupcja AI NIE ZMIERZONO: w kodzie nie ma haka odczytu korupcji (`grep -i "corrupt\|korupc"` w `gra/src/main.ts` nie zwraca żadnej funkcji testowej, tylko 3 komentarze). Odczyt wymagałby nowego haka w `gra/src` (zakazane). |
| 5. Bieg ≥ 20 tur po buncie | ZMIERZONO. 21 tur po buncie (tury 2–22, ziarno 4242), wykonane w 4 wywołaniach z zapisem stanu między nimi (`snapshotJson` → plik poza repo → `restoreJson`). Wszystkie 21 tur zakończyły się (`nieSettled` = 0), `pageerror` = 0, `gameOver` = false, właściciel nie wyeliminowany. | Trwałość stanu między wywołaniami nie była niezależnie potwierdzona (patrz pozycja 1, digest). |
| Błędy konsoli | Każde wywołanie zgłosiło dokładnie jeden `console.error: Failed to load resource: net::ERR_FILE_NOT_FOUND`. Najbardziej prawdopodobne źródło: `Gra-LIVE.html` odwołuje się do `main.css`, którego bundle testowy nie tworzy. Nie zidentyfikowano w tej rundzie. Brak pageerror. | — |
| Bramki | `tsc --noEmit` rc=0. `ai-city-rebellion-gate-test.cjs` PASS=37 FAIL=0. `ai-city-rebellion-news-test.cjs` PASS 24/0. | logic 213 i ai-test 297/0: NIE ZMIERZONO w tej rundzie (brak skryptu npm; nie zidentyfikowano polecenia uruchomienia). |

## Skarbiec właściciela AI (liczby z surowych danych, tury 1–11, runda 1)

Tura 1 to stan przed wymuszeniem (0 w każdym biegu). Kolumny: tura 2 … tura 11.

| Ziarno | Właściciel | Bieg | t2 | t3 | t4 | t5 | t6 | t7 | t8 | t9 | t10 | t11 | Stolica |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4242 | 13 | bunt | 16 | 17 | 18 | 19 | 22 | 9 | 2 | 8 | 15 | 22 | city16 → city17 od t2 |
| 4242 | 13 | kontrola | 9 | 5 | 88 | 63 | 72 | 81 | 143 | 150 | 158 | 166 | city16 |
| 7 | 22 | bunt | 13 | 3 | 5 | 7 | 11 | 15 | 15 | 7 | 15 | 19 | city25 → city26 od t2 |
| 7 | 22 | kontrola | 7 | 14 | 21 | 28 | 37 | 30 | 48 | 56 | 64 | 72 | city25 |
| 778899 | 13 | bunt | 13 | 15 | 17 | 3 | 7 | 11 | 23 | 31 | 87 | 95 | city15 → city16 od t2 |
| 778899 | 13 | kontrola | 8 | 16 | 24 | 32 | 26 | 36 | 54 | 64 | 75 | 87 | city15 |

Różnica bunt − kontrola w turze 11: ziarno 4242 −144; ziarno 7 −53; ziarno 778899 +8. Trajektorie rozchodzą się od tury 2, więc różnic nie wolno czytać jako czystego efektu stolicy. Kierunek nie jest stały między ziarnami.

## Bieg 21 tur po buncie (ziarno 4242, runda 2)

Skarbiec właściciela 13 (jedno miasto city17 do t9; od t10 drugie miasto, nowe miasta AI powstają w biegu):

| Tura | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Skarbiec | 16 | 17 | 18 | 19 | 22 | 9 | 12 | 15 | 6 | 0 | 7 | 14 | 21 | 24 | 29 | 30 | 31 | 44 | 17 | 28 | 38 |
| Miasta właściciela | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |

Stolica (`capitalNow`) = city17 w każdej z 21 tur.

Stolica pozostaje city17 przez wszystkie 21 tur. Od tury 10 AI ma drugie miasto (city18), które sama założyła. Skarbiec spada do 0 w turze 11 i odbija. Nie przypisuję tych wahań bezpośrednio do buntu, bo bieg kontrolny 21-turowy nie był wykonany.

## Wnioski ostrożne

1. Zapis i wczytanie: wynik gry (stolica, liczba miast, skarbiec) zgodny przed/po wczytaniu. Digest stanu nie jest tożsamy. Traktuję to jako otwarte pytanie techniczne, nie jako potwierdzony błąd.
2. Odbicie przez treaty zablokowane regułą gry (stolicy nie można oddać w pokoju). Powrót stolicy do starego miasta nie zmierzony; opis mechanizmu z kodu w tabeli.
3. Mennica i Pałac zostają w starym mieście, które przechodzi do buntowników. Nowa stolica bez budynków w turach 2–4.
4. Bieg 21 tur bez błędów gry, bez zawieszenia tury, bez eliminacji.
5. Skarbiec: różnice bunt − kontrola zmieniają znak między ziarnami; nie wnioskuję o balansie.

## Pytanie do właściciela

Brak nowego pytania. Decyzja o sukcesji po buncie (A: najstarsze miasto, B: jak przy podboju z relokacją, C: stolica bez efektów przez N tur) pozostaje w `AI-BUNT-STOLICY-SKUTKI-2026-11-27.md`. Ten pomiar jej nie rozstrzyga.

## Ustawienia runnera

Nowe narzędzie: `gra/tools/caprebel2-live.cjs`. Runner `caprebel-capital-live.cjs` bez zmian.
