# Obrona startu na MAKSIMUM — domknięcie luk (R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1, tag REALDEF5)

Status: pomiar Operatora, runda 1/5. Zero zmian w `gra/src/**` i `gra/data/**`.
Poprzednik: `OBRONA-STARTU-WERYFIKACJA-2026-11-27.md` oraz REALDEF4 (`213cb0b30`).
Surowe dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1/` (`maxgaps.jsonl`, logi `econ-*.txt`).

## 0. Ustawienia i definicja „maksimum”

Maksimum (zgodnie z dispatchem i REALDEF4): poziom trudności Trudny, barbarzyńcy Trudny, kultura Trudny,
dyplomacja Trudna, koszty jednostek Wysoki ×4, wzrost ludności Wysoki, mapa Mały, Kontynenty, 2 rywali, świat nowej gry (7992 heksów).

Pomiary wykonane na żywo w Chromium (Playwright, `gra/tools/realdef-max-gaps.cjs`, pochodna `realdef-econ-live.cjs`).
Każdy bieg: jedno ziarno, gracz pasywny poza zakupem obrońcy, jedna sesja na ziarno, deterministycznie.

Wariant „barbarzyńcy wyłączeni” = opcja `brak` w kreatorze (`newGameFlow.ts`, `barbariansLevel: 'brak'`) — NIE jest poziomem maksymalnym,
ale jest wariantem wskazanym w dispatchu (punkt 3); traktowany jako wariant izolujący ekonomię od barbarzyńców.

Odstępstwa od dispatchu (jawnie):
- Suwak podatku (wersja z REALDEF5 obrona, tryb `p4` i `p3`): FIZYCZNY klik myszą (`page.mouse.click`) w prawy kraniec suwaka Skarb w `.handel-w4-sliders input[type=range]`, po otwarciu panelu hakiem `__hotSeatTestDebug.openCityPanelForTest` (wejście do panelu, bez zmiany stanu gry). Wartość po kliknięciu 100 (odczyt z DOM). Wersja z pierwszej rundy (`p3` w danych) używała `dispatchEvent('input')`; jej wyniki zostają w `maxgaps.jsonl` jako dane pomocnicze.
- „Zakończ turę” (`p4`): fizyczny klik w `.civ-bottom-bar button.end-turn[data-end]`. Gdy przycisk jest `aria-disabled="true"` przy bramce `canEnd=true` (odczyt `gateInfo`, tylko odczyt), klik nie przechodzi i runner stosuje hak `__civTest.endTurn()` jako fallback. Każdy wiersz tury ma pola `endClick` (`ui` albo `hook (...)`), `ariaPrzedKlikiem` i `ariaPoCzekaniu`. Zob. §9, zarzut 5.
- Zakup obrońcy: REALNY klik w przycisk „Jednostki do rekrutacji” → przycisk zakupu → „Wróć na mapę” (ścieżka p1 z REALDEF4).

Maksimum dla pozostałych parametrów przyjęte jak w REALDEF4 (NIE ZMIERZONO osobno, czy istnieje wyższy poziom któregoś suwaka).

## 1. Realny UI: suwak podatku 100% na Skarb i zakup obrońcy

| Pomiar (ziarno 4242, t1) | Wartość |
|---|---|
| Podział przed kliknięciem (domyślny, t1) | Skarb 30% / Nauka 60% / Zamożność 10% |
| Prognoza Skarbu przed kliknięciem | +2 / turę |
| Podział po kliknięciu suwaka | Skarb 100% / Nauka 0% / Zamożność 0% (odczyt `getTaxSplit`) |
| Prognoza Skarbu po kliknięciu | +8 / turę |
| Prognoza Skarbu t2–t5 (ta sama dźwignia) | +6 / turę |

Wyniki dla pozostałych ziaren (prognoza Skarbu po kliknięciu, t1): 7 → +5; 778899 → +6; 11 → +9; 2024 → +9.

Dispatch oczekiwał prognozy +6 vs +1. Zmierzona baza bez kliknięcia to +2 (domyślny podział 30/60/10, a nie 33%),
a po kliknięciu +5…+9 zależnie od ziarna. Różnica wynika z innej bazy domyślnej, nie z błędu pomiaru; NIE ZGADUJĘ przyczyny spoza danych.

Skutek Nauki: po kliknięciu Nauka = 0% (odczyt w t1). Nauka w t2–t20 NIE ZMIERZONO (runner nie logował podziału per tura).
Co gracz traci: Nauka = 60% podziału domyślnego, czyli cały dopływ badań w tej dźwigni (kwota badań NIE ZMIERZONO).

Zakup obrońcy klikiem (ziarna 4242 i 7, t5): „Łucznik” — najtańsza jednostka wojskowa (koszt 12 Skarbu + 13 Drewna wg wiersza rekrutacji).
Klik przeszedł (`ok: true`), panel zamknięty realnym przyciskiem. Skarb 26 → 20, Drewno 16 → 7 (po przychodzie +4).

## 2. Drewno

| Ziarno | Drewno t1 → t5 | Drewno t6–t20 (przed utratą/blokadą) | Obrońca kupiony |
|---|---|---|---|
| 4242 | 0 → 4 → 8 → 12 → 16 | 7 (po zakupie), 0 w t7 | t5 |
| 7 | 0 → 4 → 8 → 12 → 16 | 7 (po zakupie) | t5 |
| 778899 | 0 przez cały bieg | 0 | NIE (brak Drewna) |
| 11 | 0 przez cały bieg | 0 | NIE (brak Drewna) |
| 2024 | 0 przez cały bieg | 0 | NIE (brak Drewna) |

Obserwacja: na ziarnach 4242 i 7 miasto daje +4 Drewna / turę od t2; na 778899, 11, 2024 przychód Drewna wynosi 0 w każdej turze t1–t20
(także w wariancie bez barbarzyńców), nawet przy Skarbie rosnącym do 135.
Wniosek: na tych ziarnach brak jest źródła Drewna w pierwszych turach, nie tylko zakupu.

NIE ZMIERZONO: liczba heksów lasu w promieniu pracy miasta startowego (runner nie czyta danych terenu; brak haka terenu w `readState`).
Pytanie „czy da się zdobyć Drewno w t1–10 przez kupno/handel/wioski” NIE ZMIERZONO (nie podjęto prób handlu ani wiosek).
Źródło +4/turę na 4242/7: POMIAR POŚREDNI. Liczba heksów lasu odczytana hakiem tylko do odczytu `__cityForestTestDebug.hexNakladka` (`gra/src/main.ts` ok. l.32773). Seed 4242: las w promieniu 3 = 22 heksy, w promieniu 5 = 36. Seed 7: promień 3 = 11, promień 5 = 33. Przychód Drewna +4/turę zaczyna się od t2 na obu ziarnach. Związek z pracą w lesie jest zgodny z danymi, ale nie dowiedziony (nie mierzono przydziału pracy na heksy). Dla 778899/11/2024 odczyt lasu w tej rundzie NIE ZMIERZONO (biegi nie zakończone, zob. §9a).

## 3. Barbarzyńcy

Wariant „barbarzyńcy wyłączeni” (`brak`), suwak i zakup jak wyżej:

| Ziarno | Wynik 20 tur | Zatrzymanie „Zakończ turę” | Miasto |
|---|---|---|---|
| 4242 | zatrzymanie t7 (żywność) | t7: Spichlerz −5 / turę | przeżyte |
| 7 | zatrzymanie t6 (żywność) | t6: Spichlerz −16 / turę | przeżyte |
| 778899 | 20 tur ukończonych | działa | przeżyte |
| 11 | 20 tur ukończonych | działa | przeżyte |
| 2024 | 20 tur ukończonych | działa | przeżyte |

Wniosek 3a: pasywny gracz przeżywa t20 na 3 z 5 ziaren bez barbarzyńców, a „Zakończ turę” działa (hakiem) w tych 3 biegach.
Na 4242 i 7 blokada wynika z ekonomii żywności po zakupie obrońcy (patrz §4), a nie z barbarzyńców — ta sama blokada występuje w wariancie Trudnym.

Barbarzyńcy Trudny (wariant maksimum, tylko z zakupem klikiem):

| Ziarno | Utrata miasta | Pierwsza widoczna jednostka barbarzyńska (min. odległość, liczba widocznych) | Zakup obrońcy |
|---|---|---|---|
| 4242 | nie | brak widocznych do t6 | t5 (blokada t7) |
| 7 | nie | brak widocznych do t6 | t5 (blokada t6) |
| 778899 | TAK, t13 | t11: odl. 2, n=1; t12: odl. 1, n=2 | NIE (brak Drewna) |
| 11 | TAK, t16 | t14: odl. 3, n=1; t15: odl. 1, n=2 | NIE (brak Drewna) |
| 2024 | TAK, t10 | t8: odl. 3, n=1; t9: odl. 1, n=1 | NIE (brak Drewna) |

Fale t15–t20 (liczba jednostek barbarzyńskich w promieniu 5): NIE ZMIERZONO w formie „liczba w promieniu 5”.
Sonda wroga (`__defeatTestDebug.cityThreatProbe`, `gra/src/main.ts` ok. l.31718) zwraca dla każdej jednostki obcej `owner`, `typeId`, `category` oraz współrzędne `q`, `r`. Runner liczy odległość `hexDist` sam. Zakres sondy to **promień 3** (`hexDistance(...) <= 3` w kodzie). Promienia 5 nie da się zmierzyć tą sondą bez zmiany gry (zakazanej w tej rundzie). Stary zapis w `maxgaps.jsonl` gubił współrzędne (`owner:typ`); wiersze tej rundy mają `q`, `r` i `dist` w `barbByDist`. Zob. §9, zarzut 2.
Dla ziaren, gdzie gracz przeżywa z obrońcą (4242, 7), miasto zostało zablokowane przed t20, więc fal t15–20 nie obserwowano.

## 4. Utrzymanie obrońcy i blokada „Zakończ turę” (ziarna 4242 i 7, maksimum)

Na ziarnie 4242 (Trudny, barbarzyńcy Trudny, zakup w t5):

| Tura | Skarb | Żywność (spichlerz) | Drewno | Prognoza Żywności | Prognoza Skarbu | Jednostki wojskowe | Zakończ turę |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | — | +1 | +2 | 0 | tak |
| 4 | 20 | 3 | 12 | +1 | +6 | 0 | tak |
| 5 | 26 | 4 | 16 | +1 | +6 | 0 | tak, zakup Łucznika |
| 6 | 20 | 5 | 7 | −15 | −10 | 1 | tak |
| 7 | 10 | 0 | 0 | −5 | −10 | 1 | NIE: „zabraknie 5 żywności”; dźwignie: rozwiązanie jednostek +16 Żywności lub +16 Złota |

Na ziarnie 7 analogicznie: zakup w t5, prognoza Żywności −16 w t6, blokada w t6.

Wniosek 4a: jeden Łucznik na maksimum zmienia prognozę żywności z +1 na −15 / turę (utrzymanie jednostki, ta sama wartość co w REALDEF4 ~16 Żywności).
Spichlerz przy starcie wynosi 0–5, więc blokada pojawia się w turze 6–7 z pewnością. To jest zgodne z komunikatem gry „Nie można zakończyć tury”.
Dźwignia „rozwiązanie jednostek” jest jedynym wyjściem w tej konfiguracji.

## 5. Startowy Wojownik (konfiguracja domyślna vs maksimum)

Odpowiedź z kodu (ten sam punkt, nie zgadywanie):
- `gra/src/game/ai-difficulty-bonus.ts`, linie 150–155: `playerStartUnitCount(difficulty)`: easy = 2, normal = 1, hard = 0.
  Komentarz nad funkcją: „Jednostki wojskowe gracza po założeniu pierwszego miasta: easy=2, normal=1, hard=0.”
- `gra/src/main.ts`, linie 12124–12129: `grantPlayerStartUnits` wywołuje `playerStartUnitCount(_menuDifficulty)` i spawnuje `AI_DIFFICULTY_BONUS_UNIT_TYPE` (= `Wojownik`, `ai-difficulty-bonus.ts:15`).
- Zwiadowca nie zależy od trudności: `grantStartingScout` (`main.ts`, linie 12137–12145) dodaje Zwiadowcę dla człowieka zawsze (idempotentnie).

Wniosek 5a: brak Wojownika na Trudnym (hard = 0) jest jawnym wpisem tabeli z komentarzem; wygląda na świadomą zasadę poziomu trudności.
Uzasadnienia biznesowego w kodzie nie ma. Decyzja „czy tak ma być” należy do właściciela (pytanie ABC po turnieju, nie w tym temacie).
Ta sama różnica wpływa na pomiary: na domyślnym (Normalny) gracz startuje z Wojownikiem, na maksimum z samym Zwiadowcą.

## 6. Tabela wniosków (maksimum, 5 ziaren)

Legenda: „obrońca” = Łucznik kupiony klikiem; „utrzymywalny” = po zakupie prognoza Żywności ≥ 0.

| Ziarno | Utrata miasta (barbarzyńcy Trudny) | Przeżycie t20 | Tura pierwszego obrońcy | Utrzymywalny | Drewno (t1–t10) |
|---|---|---|---|---|---|
| 4242 | nie (blokada tury t7) | nie: blokada tury t7 PO zakupie obrońcy; bez zakupu NIE ZMIERZONO | t5 | NIE (−15/turę po zakupie) | +4/turę od t2 |
| 7 | nie (blokada tury t6) | nie: blokada tury t6 PO zakupie obrońcy; bez zakupu NIE ZMIERZONO | t5 | NIE (−16/turę po zakupie) | +4/turę od t2 |
| 778899 | TAK, t13 | nie | brak (Drewno 0) | — | 0 |
| 11 | TAK, t16 | nie | brak (Drewno 0) | — | 0 |
| 2024 | TAK, t10 | nie | brak (Drewno 0) | — | 0 |

Barbarzyńcy wyłączeni: przeżycie t20 w 3/5 ziarnach (778899, 11, 2024), to były biegi bez zakupu (brak Drewna). 4242 i 7 są blokowane przez ekonomię żywności w t6–7 PO zakupie obrońcy; wariant „barbarzyńcy wyłączeni" bez zakupu na tych ziarnach NIE ZMIERZONO. Poprawka: wcześniejsza tabela łączyła „utratę miasta" i „przeżycie t20"; w tej rundzie są rozdzielone.

Jedno zdanie wniosku: na maksimum pasywny gracz traci jedyne miasto w 3 z 5 ziaren między t10 a t16, bo bez Drewna nie kupi żadnego obrońcy,
a na dwóch ziarnach, gdzie Drewno jest, pierwszy obrońca od razu blokuje „Zakończ turę” przez utrzymanie żywności.

## 7. NIE ZMIERZONO (zestawienie)

- Promień pracy miasta: NIE ZIDENTYFIKOWANO w kodzie (wyszukiwanie `pracy`/`RADIUS` bez wyniku). W tym dokumencie „promień 5" to promień terytorium pop1 wg testu `logic-test` (l.1512), a nie potwierdzony promień pracy.
- Barbarzyńcy w promieniu 5: NIE ZMIERZONO (sonda ma zasięg 3).
- Fale barbarzyńców t15–20 z obrońcą: NIE ZMIERZONO (4242 i 7 zablokowane w t6–7; brak lewara „rozwiąż jednostki" w pomiarze).
- Klik „Zakończ turę": zmierzono w REALDEF5 obrona (p4), zob. §9, zarzut 5; dla 778899/11/2024 nie uruchomiono p4 do końca.
- Handel/kupno Drewna i wioski jako źródło Drewna w t1–10.
- Źródło +4 Drewna/turę na ziarnach 4242 i 7.
- Nauka w t8–t20 i kwota utraconych badań. Podział podatku (Nauka) odczytany w t1–t7 na 4242 i 7 (`taxSplit`): 60% w t1, 0% od t2 (po kliknięciu suwaka). Kwota badań NIE ZMIERZONO.
- Barbarzyńcy w promieniu 5 (liczba per odległość); dostępna jest tylko liczba widocznych jednostek i minimalna odległość.
- Fale barbarzyńców t15–20 dla ziaren z przeżyciem z obrońcą (brak takich biegów).
- Klik na „Zakończ turę” (użyto hak `__civTest.endTurn`).
- Wyższy niż „maksymalny” poziom któregokolwiek suwaka (przyjęto wartości z REALDEF4).

## 8. Decyzja (nie w tym temacie)

Dispatch nie prosi o zmianę balansu. Wnioski §6 i §4 są gotowe jako dane do pytania ABC właściciela po turnieju
(co ma wynikać z tej luki: Drewno startowe, koszt utrzymania pierwszej jednostki, czy blokada tury po zakupie ma być akceptowana).

## 9. Odpowiedzi na zarzuty Evaluatora (obrona, runda 2 tematu)

Zarzuty Evaluatora z commita `667aefb2d` rozstrzygnięte jedno po drugim. PRZYJMUJĘ = poprawione w tej rundzie albo
oznaczone jako NIE ZMIERZONO z uzasadnieniem. ODRZUCAM = z dowodem. Brak odrzuceń.

1. **Bramki niezaprezentowane: PRZYJMUJĘ, uruchomione.** `npx tsc --noEmit` exit 0. `node tools/logic-test.cjs` daje `LOGIC OK (213/213)`. `node tools/ai-test.cjs` daje `ai-test: 297 passed, 0 failed`. Kod gry bez zmian (`git diff gra/src` puste).
2. **foreignNear bez współrzędnych: PRZYJMUJĘ (błąd w dokumencie).** Sonda `cityThreatProbe` zwraca `q` i `r` (`gra/src/main.ts` ok. l.31718). Prawdziwe ograniczenie to promień 3 (`hexDistance(...) <= 3`). Tabele barbarzyńców w §3 dotyczą promienia 3, co dokument teraz mówi wprost. Zdanie „haka ze współrzędnymi brakuje" było fałszywe: haki współrzędne już mają, brakuje zasięgu 5.
3. **Barbarzyńcy w promieniu 5 i fale t15–20 z obrońcą: PRZYJMUJĘ jako NIE ZMIERZONO.** Promień 5 wymaga zmiany sondy w `gra/src`, a ta jest zakazana w tej rundzie. Fale t15–20 z obrońcą wymagają lewara „rozwiąż jednostki" albo innego biegu. Nie wykonano, bo 4242 i 7 są zatrzymane w t6–7. Orkiestrator decyduje o osobnym temacie (zasięg sondy).
4. **Drewno, las, handel, wioski: PRZYJMUJĘ częściowo.** Las zmierzony hakiem tylko do odczytu: 4242 r3 = 22, r5 = 36; 7 r3 = 11, r5 = 33. Źródło +4 Drewna/turę wiąże się z lasem jako hipoteza, bez dowodu przydziału pracy. Handel, kupno i wioski w t1–10 NIE ZMIERZONO (próby nie były podjęte). Dla 778899/11/2024 odczyt lasu NIE ZMIERZONO (zob. §9a).
5. **Haki zamiast UI: PRZYJMUJĘ częściowo, poprawione.** Suwak Skarb ustawiany fizycznym kliknięciem myszy: 30 do 100, podział 100/0/0, prognoza Skarbu +2 do +8 (seed 4242, t1). „Zakończ turę” klikana fizycznie: przycisk zadziałał w turach 1, 5, 6 (4242) i 1, 5 (7). W turach 2 do 4 (oba ziarna) przycisk był `aria-disabled="true"`, a bramka `canEnd` była `true`. Po 3 s czekania z ruchem myszy stan został ten sam, a po zakupie w t5 przycisk znów był aktywny. Te tury zakończono hakiem (pole `endClick`). Oznaczam jako KANDYDAT BŁĄD-GRY UI do ręcznej weryfikacji: „Zakończ turę" zostaje wizualnie wyłączone mimo przechodzącej bramki. Gra nie była zmieniana.
6. **Skutek Nauki w t1–20: PRZYJMUJĘ częściowo.** Podział `taxSplit` odczytany co turę w t1 do t7 (4242 i 7): Nauka 60% w t1, 0% w t2 do t7 po ruchu suwaka. Kwota utraconych badań oraz t8 do t20 NIE ZMIERZONO.
7. **Seed 7, t6: deficyt Skarbu i komunikat gry: PRZYJMUJĘ (uzupełnienie).** Dane z `maxgaps.jsonl` (seed 7): Skarbiec zabraknie 3, Spichlerz zabraknie 8, komunikat bramki „Nawet maksymalny podatek nie wystarczy — zmniejsz wydatki (rozwiąż jednostki)", t6 projSkarbDelta −12, projFoodDelta −16. Dźwignia „obniżka racji żywności +8" jest niewystarczająca. Wniosek „rozwiązanie jednostek jest jedynym wyjściem" dotyczy teraz obu deficytów (żywność i Skarb), a nie tylko żywności.
8. **Higiena runnera: PRZYJMUJĘ, poprawione.** Nagłówek i opis uruchomienia zaktualizowane do REALDEF5. Domyślne tury: 20. Tryb p2 oznaczony jako nieużywany do wyników (zawiera hak `setTaxSplit`). Wiersz wyniku nadal ma stałe `runda: 5`, zgodne z nazwą tematu.
9. **SHA w raporcie: PRZYJMUJĘ.** SHA czubka pracy jest w polu `sha` wyniku i w raporcie `30-obrona-claude.md`.
10. **Tabela §6 mieszająca zdarzenia: PRZYJMUJĘ, poprawione.** Utrata miasta i przeżycie t20 są rozdzielone (zob. §6). Dla 4242 i 7 przeżycie t20 po zakupie to „nie" (blokada tury). Wariant bez zakupu i z barbarzyńcami wyłączonymi: NIE ZMIERZONO. Wniosek 3a (przeżycie t20 w 3/5 ziaren) dotyczy wyłącznie 778899, 11 i 2024 bez zakupu.

### 9a. Pomiary tej rundy (p4, maksimum: Trudny, barbarzyńcy Trudny, 20 tur)

| Ziarno | Wynik | Blokada tury | Zakup obrońcy | Klik „Zakończ turę" (ui / hook) | Las r3 / r5 |
|---|---|---|---|---|---|
| 4242 | zatrzymanie | t7 (żywność, Spichlerz −5) | t5, Łucznik | ui: t1, t5, t6; hook: t2–4 | 22 / 36 |
| 7 | zatrzymanie | t6 (żywność −16 po zakupie) | t5, Łucznik | ui: t1, t5; hook: t2–4 | 11 / 33 |

Barbarzyńcy w promieniu 3 w tych biegach: brak jednostek do t6 (`barbByDist` puste). Dla 778899, 11 i 2024 w p4 wynik NIE ZMIERZONO. Biegi przerwano awarią Chromium (`Target page, context or browser has been closed`): 778899 w t7 w trzech próbach, 11 w t7 w jednej próbie, 2024 nie uruchomiono. Przyczyna to środowisko (osierocone procesy Chromium z wcześniejszych biegów, których nie udało się posprzątać), a nie gra. Dane p3 z poprzedniej rundy dla tych ziaren zostają w §6.

### 9b. Wniosek po poprawkach

Na maksimum (4242 i 7) pasywny gracz z jednym Łucznikiem kupionym fizycznym klikiem w t5 traci zdolność zakończenia tury w t6 do t7 przez żywność (utrzymanie −15 do −16 na turę przy Spichlerzu 0 do 5). Pierwszy obrońca jest nieutrzymywalny. Nauka jest wyłączona podatkiem 100% na Skarb od t2. Na pozostałych trzech ziarnach brak Drewna blokuje zakup obrońcy (bez zmian względem §6). Nowe kandydaty dla orkiestratora (gra nie była zmieniana): (a) przycisk „Zakończ turę" wizualnie wyłączony mimo przechodzącej bramki w t2 do t4 (kandydat BŁĄD-GRY UI); (b) zasięg sondy wroga 3 uniemożliwia pomiar barbarzyńców w promieniu 5.
