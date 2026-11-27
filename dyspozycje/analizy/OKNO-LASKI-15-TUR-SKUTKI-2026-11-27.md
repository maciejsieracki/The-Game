# Okno łaski 15 tur — skutki na AI, przeżycie gracza po oknie, rozbieżności tekstów

Temat: R-WEB-GRACE15-EFFECTS-Q1 (tag GRACE15FX). Data pomiaru: 2026-11-27. Wersja dokumentu: runda 2 (obrona Operatora, odpowiedź na zarzuty Evaluatora 1–7).
Baza kodu PO: `fc7d74290` (FALA 935, origin/main). Baza kodu PRZED: `3b23b2d4f` (FALA 934, ostatni commit przed oknem łaski).
Zmiana między bazami w `gra/src` = 78 linii w 4 plikach (ta sama reguła okna łaski), zero innych zmian gry. Runda 2 nie zmienia `gra/src` (diff = 0).

Dane surowe: `dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/` (JSONL spakowany gzip, logi odczytu ustawień `run.txt`, zestawienia `zestawienie-*.txt`). Dane biegów aktywnego gracza: `dane/aktywny/` (`econ-active.jsonl.gz`, logi `econ-p1-s4242-r1.txt`, `econ-p2-s7-r1.txt`, zestawienie `zestawienie-active.txt`).

Narzędzia (nowe, allowlista `gra/tools/grace15fx-*.cjs`):
- `gra/tools/grace15fx-run.cjs` (kopia `aibal2-measure-run.cjs`, zmiana: poziom barbarzyńców z `--barb`) — pomiar AI, pasywny gracz z dosypkami (bypass).
- `gra/tools/grace15fx-summary.cjs` — zestawienie AI t30/t60.
- `gra/tools/grace15fx-active-live.cjs` (runda 2) — kopia `realdef-econ-live.cjs` na mapie Standardowej (1 rywal, 15 typów cywilizacji, 1 miasto-państwo, jak pomiar AI). Polityki: `p1` = zakup obrońcy klikiem w panelu miasta; `p2` = zakup + suwak podziału Handlu 100% Pieniądz (klik w UI, bez haków zmieniających stan). Bez dosypek: runner zatrzymuje się na bramce tury.

## 0. Warunki pomiaru (maksimum)

Ustawienia nowej gry, identyczne we wszystkich biegach (readback w `run.txt` i `settingsReadback` w JSONL):

| Ustawienie | Wartość | Uwaga |
|---|---|---|
| Trudność | Trudny (`difficulty: hard`) | maksimum |
| Dyplomacja i wojna | trudna | maksimum |
| Kultura i religia (gracz / AI) | trudny / trudny | maksimum |
| Koszty jednostek | wysoki (`kosztJednostekPace`) | maksimum |
| Barbarzyńcy | **trudny** (parametr `--barb`, przekazany do `startNewGame`) | maksimum dispatchu |
| Miasta-państwa | 1 | jak w AIBAL2; nie zmierzone jako maksimum (brak wskazania w dispatchu) |
| Wzrost surowców z epoką | wyłączony | jak w AIBAL2 |
| Mapa | Standardowy (biegi AI i aktywne) | biegi AI z `grace15fx-run.cjs`, aktywne z `grace15fx-active-live.cjs` |

Readback `__settingsLive.getSettings` NIE zawiera pola poziomu barbarzyńców (zwraca: `diplomacyWarLevel`, `kulturaReligiaLevel`, `kulturaReligiaLevelAI`, `wzrostSurowcowZEpoka`, `kosztJednostekPace`, `difficulty`). Wartość `trudny` została przekazana w `startNewGame`, a NIE odczytana z gry. Odczyt wymagałby hooka tylko do odczytu w `gra/src/main.ts` (poza zakresem tego tematu) — zgłoszone orkiestratorowi.
Pośredni dowód, że ustawienie działa: ten sam kod, ziarno 4242, barbarzyńcy `trudny` vs `normalny` dają inne liczby pustych miast AI (§1, wiersz Akn). Nie jest to odczyt ustawienia.

Gracz w biegach AI (B): pasywny, bez zakupów. Harness dosypuje **200 złota ORAZ 200 żywności** (bypass), gdy bramka „Zakończ turę” blokuje turę. Liczba dosypek w biegach B (z `bypass.applied` w JSONL i `dosypki` w `run.txt`):
- B-s4242: 2 dosypki (tury 17 i 33), łącznie +400 złota i +400 żywności.
- B-s7: 3 dosypki (tury 18, 33 i 48). Dosypka w turze 48 nastąpiła po utracie miasta (bez wpływu na wynik).

Ziarna: 4242 i 7 (dispatch). FC używał 778899 — nie powtarzano. Tury: 1–60 (biegi AI).

Biegi AI:

| Etykieta | Kod | Barbarzyńcy | Ziarno | Rola |
|---|---|---|---|---|
| A-s4242, A-s7 | 3b23b2d4f (PRZED) | trudny | 4242, 7 | porównanie: bez okna łaski |
| B-s4242, B-s7 | fc7d74290 (PO) | trudny | 4242, 7 | wynik FALI 935 |
| Akn-s4242 | 3b23b2d4f (PRZED) | normalny | 4242 | kontrola: wpływ poziomu barbarzyńców |

Dane PRZED z AIEMPTY/AIBAL2 NIE są porównywalne 1:1 (inny kod, barbarzyńcy `normalny`). Dlatego zrobiono czysty A/B na tym samym harnessie.

Zrozumienie zapisu tury w JSONL (sprawdzone arytmetyką na danych, nie założone): rekord tury N to stan na początku tury N, po ewentualnej dosypce tej tury. Przykład B-s4242: t16 skarbiec 31, drenaż −14, t17 = 31 − 14 + 200 = 217.

## 1. Pytanie 1 — skutek na AI (tury 30 i 60)

Liczniki: `civs` = cywilizacje AI z miastem lub jednostką; `miasta`, `jedn` = suma miast i jednostek wojskowych AI; `puste` = miasta AI z zerową załogą (definicja z `aiempty-analyze.cjs`).

| Bieg | t30 civs | t30 miasta | t30 jedn | t30 puste | t60 civs | t60 miasta | t60 jedn | t60 puste | t60 skarb AI (suma) |
|---|---|---|---|---|---|---|---|---|---|
| A-s4242 (PRZED, trudny) | 12 | 87 | 134 | 59 (67,8%) | 12 | 165 | 182 | 123 (74,5%) | 2536 |
| B-s4242 (PO, trudny) | 14 | 89 | 151 | 43 (48,3%) | 13 | 178 | 163 | 139 (78,1%) | 8288 |
| A-s7 (PRZED, trudny) | 13 | 86 | 124 | 43 (50,0%) | 11 | 170 | 134 | 141 (82,9%) | 9204 |
| B-s7 (PO, trudny) | 14 | 99 | 160 | 43 (43,4%) | 13 | 180 | 186 | 125 (69,4%) | 9648 |
| Akn-s4242 (PRZED, normalny) | 14 | 94 | 149 | 16 (17,0%) | 14 | 174 | 173 | 55 (31,6%) | 8851 |

Wnioski (dwa ziarna + kontrola; mała próba, bez przedziałów ufności):

1. Zmiana między A i B łączy TRZY reguły okna łaski naraz: (a) barbarzyńcy nie wykonują tury w t1–15, (b) brak kosztu utrzymania jednostek gracza w t1–15, (c) jednostka startowa gracza na Trudnym. Różnicy nie da się przypisać jednej regule. Moc wniosku o wpływie okna jest niska, zwłaszcza że n = 2 ziarna.
2. Okno łaski zmienia rozwój AI niejednoznacznie. W t30 puste miasta AI spadają (ziarno 4242: 67,8% → 48,3%; ziarno 7: 50,0% → 43,4%). W t60 kierunek się odwraca: 4242 rośnie (74,5% → 78,1%), 7 spada (82,9% → 69,4%). Liczba miast AI w t60 jest wyższa po oknie (4242: 165 → 178; 7: 170 → 180).
3. Dominujący czynnik to poziom barbarzyńców, nie okno łaski (ten sam kod PRZED, ziarno 4242: `trudny` 67,8% / 74,5%; `normalny` 17,0% / 31,6%). NIE ZMIERZONO bezpośrednio: JSONL nie zawiera pól barbarzyńców, więc mechanizm (zabijanie załóg, zdobywanie miast) jest hipotezą.
4. W t60 puste miasta AI zwykle mają skarbiec ≥ 4 Pn (tabela REASONS w `zestawienie-grace15fx.txt`): w A-s4242, A-s7 i B-s7 wszystkie puste miasta są przy skarbcu ≥ 4 Pn; w B-s4242 15 pustych miast należy do właścicieli ze skarbcem < 4 Pn. Brak pieniędzy nie tłumaczy większości pustych miast. Przyczyna NIE ZMIERZONO.
5. Cywilizacje AI przeżywają w obu wariantach (11–14). Brak sygnału, że okno łaski wymusza wcześniejszą eliminację AI.

Barbarzyńcy wokół miasta gracza, t1–16 (aktywne biegi, pole `foreignNear` z odczytu harnessu, §2A): w obu biegach aktywnych w turach 1–16 w promieniu odczytu nie było żadnej obcej jednostki (`barbN` = 0 w każdej turze). To jedyny bezpośredni odczyt obecności barbarzyńców w danych tego tematu i obejmuje wyłącznie t1–16.

Kiedy miasto gracza ginie (dane pośrednie, NIE ZMIERZONO przyczyny bezpośrednio):
- A (PRZED): miasto gracza ginie w t16 (4242) i t29 (7).
- B (PO): miasto gracza ginie w t42 (4242) i t48 (7). Szczegóły w §2.
- Miasta AI w B: spadki liczby miast AI w t38, t43, t46 (4242) i brak spadków (7). W A: t19 i t55 (4242), t50, t55, t59 (7). Przyczyn (bunt, podbój, barbarzyńcy) nie rozróżniono.
- „Pierwszy atak na AI” z logu gry: NIE ZMIERZONO (brak logu zdarzeń barbarzyńców w danych harnessu).

## 2. Pytanie 2 — przeżycie gracza po oknie łaski

### 2.1. Gracz pasywny (B), dane z dosypkami

Dane z JSONL (rekord tury N = stan na początku tury N po dosypce):

| Tura | B-s4242 skarbiec | B-s4242 miasto | B-s7 skarbiec | B-s7 miasto | Uwaga |
|---|---|---|---|---|---|
| 15 | 29 | 1 | 28 | 1 | koniec okna (utrzymanie jednostek = 0) |
| 16 | 31 | 1 | 31 | 1 | utrzymanie jednostek 16 Pn/turę startuje |
| 17 | 217 (17 + dosypka 200) | 1 | 18 | 1 | B-s4242: dosypka; bramka zablokowana przed dosypką |
| 18 | 203 | 1 | 205 (18 − 13 + dosypka 200) | 1 | B-s7: dosypka 200, bramka zablokowana |
| 32 | 7 | 1 | 13 | 1 | |
| 33 | 193 (7 − 14 + dosypka 200) | 1 | 199 (dosypka 200) | 1 | 2. dosypka B-s4242; 2. zablokowana bramka (B-s7 też) |
| 41 | 81 | 1 | 87 | 1 | |
| 42 | **0** | **0** | 73 | 1 | B-s4242: miasto utracone przy 81 Pn w skarbcu |
| 47 | — (miasto utracone już w t42) | 0 | **3** | 1 | B-s7: ostatnia tura z miastem |
| 48 | 0 | 0 | 0 (+200 dosypka po utracie) | 0 | B-s7: miasto utracone |

Interpretacja (poprawiona w rundzie 2):
- B-s4242: miasto utracone na końcu tury 41 mimo skarbca 81 Pn (drenaż −14 mógł być pokryty). Utrata miasta NIE jest zatem skutkiem wyczerpania skarbca. Przyczyna NIE ROZSTRZYGNIĘTA (kandydaci: barbarzyńcy, bunt; dane nie zawierają zdarzeń). Skarbiec wyzerowany w tej samej turze jest konsekwencją utraty miasta, nie jej przyczyną.
- B-s7: na końcu tury 47 skarbiec wynosił 3 Pn, a drenaż −14 Pn wyprowadziłby go poniżej zera. Ta sekwencja zgadza się z bankructwem, ale nie jest tym potwierdzona (brak zapisu reguły utraty miasta w danych). Dosypka z tury 48 nastąpiła już po utracie miasta.
- „Przeżycie 26–32 tury po oknie” z poprzedniej wersji dokumentu NIE JEST wynikiem gry: wynika z dosypek harnessu (B-s4242: +400 Pn i +400 żywności przed utratą miasta; B-s7: +400 Pn i +400 żywności przed utratą miasta, trzecia dosypka po utracie bez wpływu). Bez dosypki bramka tury blokuje koniec tury (dane B: zablokowany w t17 i t33 przed dosypką), więc pasywny gracz w ogóle nie przechodzi tury bez ręcznego zasilania. Przy samym drenażu skarbiec schodzi poniżej zera około t32–33 (B-s4242: 7 Pn w t32). Ten scenariusz NIE ZMIERZONO na żywo.

### 2.2. Gracz aktywny (dispatch pkt 2) — NIE ZMIERZONO w całości; częściowy pomiar t1–16

Runda 2 zbudowała klikany bieg (`gra/tools/grace15fx-active-live.cjs`, polityki p1/p2, klik zakupu w panelu miasta przez zakładkę „Jednostki do rekrutacji”, klik zamknięcia „Wróć na mapę”, suwak podziału Handlu 100% Pieniądz). Bieg zatrzymuje się na bramce tury; nie ma dosypek.

Wyniki (maksimum, Standardowy, 1 rywal, barbarzyńcy trudny; pliki `dane/aktywny/`):

**Ziarno 4242, polityka p1 (zakup klikiem, bez suwaka).** ZAKUP NIEMOŻLIWY: drewno = 0 przez tury 1–16 (zasoby miasta: tylko glina, 13 → 195). Oba wiersze jednostek wymagają drewna (Wojownik 13, Rydwan 25), więc kupno nie jest możliwe i harness nie wykonał kliku. Skarbiec 0 → 31 (+2/turę), bramka tury zablokowana w t16 (Spichlerz, żywność: „zabraknie 4”; prognoza żywności −16/turę przed autokorektą racji). Wynik: zatrzymanie w t16.

**Ziarno 7, polityka p2 (zakup Łucznika w t5 + suwak Handlu 100% Pieniądz w t1).** Zakup klikiem: t5, Łucznik (12 Pn), panel zamknięty realnym przyciskiem. Suwak: prognoza skarbu +2 → +5/turę (`taxProbe`). Skarbiec 0 → 68 w t16, drewno 45. Bramka tury zablokowana w t16: Spichlerz państwa (żywność), „po zakończeniu tury zabraknie 16”, prognoza żywności −30/turę. Wynik: zatrzymanie w t16.

Tabela aktywnego gracza t1–16 (zestawienie `dane/aktywny/zestawienie-active.txt`):

| Tura | 4242/p1 skarbiec | 4242 spichlerz | 4242 blokada | 7/p2 skarbiec | 7/p2 spichlerz | 7/p2 blokada | 7/p2 zakup |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | nie | 0 | 0 | nie | — |
| 5 | 9 | 0 | nie | 20 | 0 | nie | **Łucznik (klik)** |
| 10 | 19 | 0 | nie | 33 | 0 | nie | — |
| 15 | 29 | 0 | nie | 58 | 0 (żywność +2 w t15) | nie | — |
| 16 | 31 | 0 | **TAK** (żywność) | 68 | 2 | **TAK** (żywność, −30) | — |

Obserwacje:
- Blokada w t16 w OBU aktywnych biegach ma przyczynę żywnościową (Spichlerz), a nie skarbową. Skarbiec w t16 wynosi 31 i 68 Pn. Dispatch zakładał „bramkę skarbca”; komunikat gry tego nie potwierdza (§3).
- Źródło: od t16 każdy wojownik/łucznik kosztuje 16 złota i 16 żywności na turę (`utrzymanieJednostekPieniadz` = 16, `zywnoscArmiiTura` = 16). Miasto startowe ma zerową produkcję żywności w t1–15 i zerowy Spichlerz (`projFood` = 0), więc pierwsza jednostka po oknie od razu powoduje deficyt.
- Dźwignie, które komunikat bramki wymienia: „obniżka racji żywności: +12 żywności/turę” oraz „rozwiązanie jednostek: +16”. Harness ich nie używa (brak kliku w tym temacie). Dlatego gracz aktywny w tym harnessie zatrzymuje się w t16. Czy ruch racji/rozwiązanie jednostki przeżyje t17–30: NIE ZMIERZONO.
- Zakup Łucznika (ziarno 7) i suwak Handlu (100% Pieniądz) działają klikiem i poprawiają skarbiec, ale nie usuwają deficytu żywności.

## 3. Pytanie 3 — rozbieżności tekstów gry z oknem łaski

Przeszukano wiki (`gra/src/data/wikiBundle.json`, wpisy poradnik i encyklopedia) oraz napisy UI (grep po `barbarzy`, `utrzym`, `bramk`). Komunikat bramki zaobserwowano w grze (live, w danych aktywnych biegów): „Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 4 (16). Pomogą: podatek złota …; obniżka racji żywności …; rozwiązanie jednostek …”. Komunikat wskazuje SPICHLERZ (żywność), nie skarbiec.

Pełny przegląd tooltipów utrzymania i komunikatów bramki w UI NIE został wykonany (odnaleziono sekcję „Koszty i utrzymanie” w `unitInfoCard.ts`, ale jej treści nie czytano). Lista poniżej jest więc kompletna tylko dla wiki (grep), nie dla UI.

Rozbieżności (lista; nic nie poprawiono):

1. **poradnik/14-ai-zagrozenia, §90.2 Agresja** — „atakują, gdy twoja jednostka lub miasto jest w zasięgu”. Brak wyjątku dla tur 1–15. Sprzeczne przez przemilczenie.
2. **poradnik/14-ai-zagrozenia, §90.3 tabela „Faza gry”** — wiersz „Wczesna | Zwiadek bez eskorty”. Sugeruje zagrożenie barbarzyńców we wczesnej fazie, a okno łaski wyłącza ruch do t15. Rozbieżność treściowa.
3. **poradnik/14-ai-zagrozenia, §90.1 Obozy — spawn** — „Co X tur obóz może wypuścić jednostkę”. Brak informacji o zasadzie tur 1–15 (obozy i spawn dopiero od domknięcia t16 — założenie implementacji). Przemilczenie.
4. **poradnik/00-jak-czytac, linia 18** — „Tura przeciwników — sztuczna inteligencja i barbarzyńcy wykonują ruchy”. Ogólna reguła, nieprawdziwa w turach 1–15 dla barbarzyńców.
5. **poradnik/03-pasek-zasobow, linia 155** — „Po kliknięciu: rozliczenie ekonomii, ruch AI, barbarzyńcy, następna tura”. Ta sama uwaga co pkt 4 (drobna).
6. **poradnik/08-ekonomia-imperium, linia 28** — „Utrzymanie jednostek: Wojsko w polu i w garnizonach”. Brak wyjątku dla gracza w turach 1–15 (utrzymanie 0). Przemilczenie.
7. **poradnik/14-ai-zagrozenia, tabela poziomów (linie 45–49)** — opisuje bonusy AI, nie gracza. Brak informacji o jednostce startowej gracza na Trudnym (+1 Wojownik z FALI 935).
8. **Komunikat bramki (UI, live)** — mówi o Spichlerzu (żywności), a dispatch i poprzednia wersja dokumentu mówiły o „bramce skarbca”. To rozbieżność między założeniem tematu a tekstem gry, nie między tekstem a regułą okna. Do decyzji właściciela, czy wiki/komunikat mają wyjaśniać, że po t16 pierwszym wąskim gardłem jest żywność.

Zgodne (bez zmian): poradnik/03-pasek-zasobow linia 116 („im wyżej, tym bardziej AI i barbarzyńcy są rozbudowani”) — nie dotyczy okna.

Stan wiki: oparty na buildzie z 2026-09-05; FALA 935 nie jest w niej uwzględniona. Decyzja o zmianie wiki należy do właściciela (NIE poprawiono).

## 4. Zastrzeżenia i NIE ZMIERZONO

- Dwa ziarna (4242, 7), bez powtórzeń i przedziałów ufności. Kierunek w t60 jest niestabilny; nie wolno tego traktować jako wyniku balansu. Ziarno 778899 i 42 nie były uruchamiane.
- Poziom barbarzyńców: tylko maksimum (`trudny`) w biegach A/B; kontrola `normalny` tylko dla A i jednego ziarna. Odczyt ustawienia barbarzyńców NIE ZWERYFIKOWANY w grze (§0).
- Brak logu zdarzeń barbarzyńców: pierwszy atak na gracza/AI jest wnioskiem z liczników, nie z logu. Jedyny bezpośredni odczyt obecności obcych jednostek przy mieście gracza: `foreignNear` w turach 1–16 (aktywne biegi), zero.
- Gracz aktywny: zbudowany klik (p1/p2) i pomiar t1–16 — wykonano. Pomiar t17–30 NIE ZMIERZONO: bieg zatrzymuje się na bramce żywności w t16; zakupu drewna nie ma na ziarnie 4242.
- Gracz aktywny z dźwigniami żywnościowymi (obniżka racji, rozwiązanie jednostki) NIE ZMIERZONO — wymaga osobnego tematu z klikiem tych kontrolek.
- Miasta-państwa = 1 (jak w AIBAL2), bez testu innych wartości.
- Przyczyna utraty miasta pasywnego gracza (B-s4242 t41→42, B-s7 t47→48): NIE ROZSTRZYGNIĘTA. Brak zapisu zdarzeń w danych.
- Próba zbudowania bazy 3b23b2d4f: wykonano (archiwum `git archive` do katalogu tymczasowego, bundle vite, bez zmian w repo).
- Testy bramek rundy 2 (bez zmian w `gra/src`): `npx tsc --noEmit` exit 0; `logic-test` LOGIC OK (213/213); `ai-test` 297 passed, 0 failed; `early-grace-15-test` 33 passed, 0 failed.

## 5. Dla pytania ABC do właściciela (dane, nie rekomendacja balansu)

Fakty, które mogą wejść do pytania (bez zmiany balansu z tego dokumentu):
- Okno łaski zwalnia gracza z kosztów utrzymania jednostek w t1–15. Od t16 pierwsza jednostka kosztuje 16 złota i 16 żywności na turę.
- Od t16 (aktywne biegi, Trudny, Standardowy) blokadą tury jest żywność (Spichlerz), nie skarbiec. Skarbiec w t16 wynosi 31–68 Pn.
- Pasywny gracz nie przechodzi tury bez ręcznego zasilenia (bramka blokuje koniec tury); przeżycie po oknie w poprzedniej wersji dokumentu było artefaktem dosypek.
- Dla AI wpływ okna jest mały i niejednoznaczny; dominuje poziom barbarzyńców (17% → 68% pustych miast w t30 na tym samym kodzie).

Pytanie do właściciela po tym pomiarze: co dalej po t16 — czy gracz ma mieć czas na reakcję (racja żywności, rozwiązanie jednostki, obrońca wymagający drewna), i czy wiki/komunikat bramki mają opisać okno łaski oraz to, że pierwszym wąskim gardłem jest żywność.
