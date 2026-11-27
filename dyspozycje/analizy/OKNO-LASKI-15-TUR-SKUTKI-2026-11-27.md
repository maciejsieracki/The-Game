# Okno łaski 15 tur — skutki na AI, przeżycie gracza po oknie, rozbieżności tekstów

Temat: R-WEB-GRACE15-EFFECTS-Q1 (tag GRACE15FX). Data pomiaru: 2026-11-27.
Baza kodu PO: `fc7d74290` (FALA 935, origin/main). Baza kodu PRZED: `3b23b2d4f` (FALA 934, ostatni commit przed oknem łaski).
Zmiana między bazami w `gra/src` = 78 linii w 4 plikach (ta sama reguła okna łaski), zero innych zmian gry.

Dane surowe: `dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/` (JSONL spakowany gzip, logi odczytu ustawień `run.txt`, zestawienia `zestawienie-*.txt`).
Narzędzia (nowe, tylko odczyt wyników i harness pomiaru): `gra/tools/grace15fx-run.cjs` (kopia `aibal2-measure-run.cjs` z jedną zmianą: poziom barbarzyńców z `--barb`) oraz `gra/tools/grace15fx-summary.cjs`.

## 0. Warunki pomiaru (maksimum)

Ustawienia nowej gry, identyczne we wszystkich biegach (readback w `run.txt`):

| Ustawienie | Wartość | Uwaga |
|---|---|---|
| Trudność | Trudny (`difficulty: hard`) | maksimum |
| Dyplomacja i wojna | trudna | maksimum |
| Kultura i religia (gracz / AI) | trudny / trudny | maksimum |
| Koszty jednostek | wysoki (`kosztJednostekPace`) | maksimum |
| Barbarzyńcy | **trudny** (parametr `--barb`, przekazany do `startNewGame`) | maksimum dispatchu |
| Miasta-państwa | 1 | jak w AIBAL2; nie jest zmierzone jako maksimum (brak wskazania w dispatchu) |
| Wzrost surowców z epoką | wyłączony | jak w AIBAL2 |

Uwaga: readback (`__settingsLive.getSettings`) nie zawiera pola poziomu barbarzyńców. Wartość `trudny` została przekazana w wywołaniu `startNewGame`, ale NIE ZWERYFIKOWANO jej odczytem z gry.

Gracz: pasywny (bez zakupów, bez zmian podatku). Harness dosypuje 200 złota i 200 żywności, gdy bramka „Zakończ turę” zablokuje turę (`bypass`). Te dosypki są widoczne w danych i zmieniają wygląd skarbca (patrz §2).

Ziarna: 4242 i 7 (dispatch: 4242 i 7; FC używał 778899 — nie powtarzano). Tury: 1–60.

Biegi:

| Etykieta | Kod | Barbarzyńcy | Ziarno | Rola |
|---|---|---|---|---|
| A-s4242, A-s7 | 3b23b2d4f (PRZED) | trudny | 4242, 7 | porównanie: bez okna łaski |
| B-s4242, B-s7 | fc7d74290 (PO) | trudny | 4242, 7 | wynik FALI 935 |
| Akn-s4242 | 3b23b2d4f (PRZED) | normalny | 4242 | kontrola: wpływ poziomu barbarzyńców |

Dane PRZED z AIEMPTY/AIBAL2 (poprzednie biegi) NIE są porównywalne 1:1: używały barbarzyńców `normalny` i starszego kodu. Dlatego zrobiono czysty A/B na tym samym harnessie.

## 1. Pytanie 1 — skutek na AI (tury 30 i 60)

Liczniki: `civs` = cywilizacje AI z miastem lub jednostką; `miasta`, `jedn` = suma miast i jednostek wojskowych AI; `puste` = miasta AI z zerową załogą (jak `aiempty-analyze.cjs`).

| Bieg | t30 civs | t30 miasta | t30 jedn | t30 puste | t60 civs | t60 miasta | t60 jedn | t60 puste | t60 skarb AI (suma) |
|---|---|---|---|---|---|---|---|---|---|
| A-s4242 (PRZED, trudny) | 12 | 87 | 134 | 59 (67,8%) | 12 | 165 | 182 | 123 (74,5%) | 2536 |
| B-s4242 (PO, trudny) | 14 | 89 | 151 | 43 (48,3%) | 13 | 178 | 163 | 139 (78,1%) | 8288 |
| A-s7 (PRZED, trudny) | 13 | 86 | 124 | 43 (50,0%) | 11 | 170 | 134 | 141 (82,9%) | 9204 |
| B-s7 (PO, trudny) | 14 | 99 | 160 | 43 (43,4%) | 13 | 180 | 186 | 125 (69,4%) | 9648 |
| Akn-s4242 (PRZED, normalny) | 14 | 94 | 149 | 16 (17,0%) | 14 | 174 | 173 | 55 (31,6%) | 8851 |

Wnioski (dwa ziarna + kontrola; mała próba, bez przedziałów ufności):

1. Okno łaski zmienia rozwój AI tylko częściowo i niejednoznacznie. W t30 puste miasta AI spadają (ziarno 4242: 67,8% → 48,3%; ziarno 7: 50,0% → 43,4%). W t60 nie ma kierunku: 4242 rośnie (74,5% → 78,1%), 7 spada (82,9% → 69,4%). Liczba miast AI w t60 jest wyższa po oknie (4242: 165 → 178; 7: 170 → 180).
2. Dominujący czynnik to poziom barbarzyńców, nie okno łaski. Ten sam kod PRZED (3b23b2d4f), ziarno 4242: barbarzyńcy `trudny` dają 67,8% pustych w t30 i 74,5% w t60; barbarzyńcy `normalny` dają 17,0% i 31,6%. Wartości „normalny” są zbliżone do wcześniejszego zakresu 32–47% z AIEMPTY (t60, maksimum poza barbarzyńcami). Ten skok do 70–80% przy barbarzyńcach trudnych jest zgodny z tym, że barbarzyńcy wyzerowują załogi miast AI. NIE ZMIERZONO bezpośrednio: JSONL nie zawiera pól barbarzyńców, więc mechanizm (zabijanie załóg czy zdobywanie miast) to hipoteza.
3. W t60 puste miasta AI zwykle mają skarbiec ≥ 4 Pn (tabela REASONS w `zestawienie-grace15fx.txt`): w A-s4242, A-s7 i B-s7 wszystkie puste miasta są przy skarbcu ≥ 4 Pn, w B-s4242 15 pustych miast należy do właścicieli ze skarbcem < 4 Pn. Brak pieniędzy nie tłumaczy więc większości pustych miast. Przyczyna pozostaje NIE ZMIERZONO.
4. Cywilizacje AI przeżywają w obu wariantach (11–14). Brak sygnału, że okno łaski wymusza wcześniejszą eliminację AI.

Kiedy barbarzyńcy działają (dane pośrednie, NIE ZMIERZONO bezpośrednio):
- Gracz traci jedyne miasto w A (PRZED): t16 (ziarno 4242), t29 (ziarno 7).
- Gracz w B (PO) traci miasto w t42 (4242) i t48 (7). Oba momenty pokrywają się z wyzerowaniem skarbca gracza (§2). Czy to barbarzyńcy, czy bankructwo, NIE ROZSTRZYGNIĘTO.
- Miasta AI w B: spadki liczby miast AI w t38, t43, t46 (4242) i brak spadków (7) w t1–60. W A: t19 i t55 (4242), t50, t55, t59 (7). Przyczyn (bunt, podbój, barbarzyńcy) nie rozróżniono.
- „Pierwszy atak na AI” z logu gry: NIE ZMIERZONO (brak logu zdarzeń barbarzyńców w danych wyjściowych harnessu).

## 2. Pytanie 2 — przeżycie gracza po oknie łaski (pasywny gracz, t1–30)

Ziarno 4242 (PO), tura: skarbiec po turze (`dosypka` = zasilenie harnessu) — prognoza netto skarbca (`hud.skarbiecRate`) — blokada bramki przed „Zakończ turę”:

| Tura | 1–15 | 16 | 17 | 18 | 19–30 |
|---|---|---|---|---|---|
| Skarbiec po turze (rekord) | 3 → 29 (+2/t) | 31 | 217 (po dosypce; przed dosypką 17) | 203 | 189 → 35 (−14/t) |
| Dosypka harnessu | 0 | 0 | +200 | 0 | 0 |
| Prognoza netto (`skarbiecRate`) | +2 | −14 | −14 | −14 | −14 |
| Blokada bramki (przed dosypką) | nie | nie | **tak** | nie | nie |
| Miasta / jednostki gracza | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |

Skarbiec gracza wyzerowuje się w t42 (miasto znika w t42).

Ziarno 7 (PO): blokada w t18 (skarbiec przed dosypką 5, prognoza −13). Miasto gracza przeżywa do t46, skarbiec 0 w t48.

Obserwacje:
- Okno łaski działa: wydatek na utrzymanie jednostek = 0 do t15 (`utrzymanieJednostekPieniadz` = 0), od t16 = 16/turę. Miasto gracza przeżywa 26–32 tury po oknie (PRZED: ginie w t16 i t29).
- Brama skarbca blokuje „Zakończ turę” przy prognozie ujemnej i niskim skarbcu. Dane wskazują granicę: projekcja 3 (4242, t17) zablokowana; projekcja 5 (7, t17) nie. Dokładna reguła NIE ZMIERZONO (lista warunków bramki w kodzie nie była analizowana).
- Bez dosypki harnessu gracz zostałby zablokowany w każdej turze od t17 do czasu podniesienia podatku lub rozwiązania jednostki. Ten scenariusz NIE ZMIERZONO na żywo.
- Skarbiec pasywnego gracza wyzerowuje się w t42 (4242) i t48 (7); miasto znika w tej samej turze. Mechanizm NIE ZMIERZONO.

Gracz aktywny (dispatch, pkt 2): zakup Łucznika/Oszczepnika w panelu miasta, ustawienie podatku, odczyt tura × (Skarb, prognoza, blokada, atak) — NIE ZMIERZONO. Harness nie ma automatyzacji zakupu jednostki ani suwaka podatku, a dispatch zakazuje hak zmieniających stan (zakup/suwak tylko klikiem). Zbudowanie klikanego biegu nie zmieściło się w jednej rundzie. Ta część wymaga osobnego tematu.

## 3. Pytanie 3 — rozbieżności tekstów gry z oknem łaski

Przeszukano wiki (`gra/src/data/wikiBundle.json`, wpisy poradnik i encyklopedia) oraz napisy UI (grep po `barbarzy`, `utrzym`, `bramk`). Nie przeglądano wszystkich podpowiedzi UI (tooltipów) poza tym grepem.

Rozbieżności (lista; nic nie poprawiono):

1. **poradnik/14-ai-zagrozenia (plik `14-ai-zagrozenia.md`), §90.2 Agresja** — „atakują, gdy twoja jednostka lub miasto jest w zasięgu”. Brak wyjątku dla tur 1–15. Sprzeczne przez przemilczenie.
2. **poradnik/14-ai-zagrozenia, §90.3 tabela „Faza gry”** — wiersz „Wczesna | Zwiadek bez eskorty”. Sugeruje zagrożenie barbarzyńców we wczesnej fazie, a okno łaski wyłącza ruch do t15. Rozbieżność treściowa.
3. **poradnik/14-ai-zagrozenia, §90.1 Obozy — spawn** — „Co X tur obóz może wypuścić jednostkę”. Brak informacji o starcie spawnu po t16 (w kodzie: `barbarians.ts`, funkcja okna łaski, domknięcie tury 15). Przemilczenie.
4. **poradnik/00-jak-czytac, linia 18** — „Tura przeciwników — sztuczna inteligencja i barbarzyńcy wykonują ruchy”. Ogólna reguła, nieprawdziwa w turach 1–15 dla barbarzyńców.
5. **poradnik/03-pasek-zasobow, linia 155** — „Po kliknięciu: rozliczenie ekonomii, ruch AI, barbarzyńcy, następna tura”. Ta sama uwaga co pkt 4 (drobna).
6. **poradnik/08-ekonomia-imperium, linia 28** — „Utrzymanie jednostek: Wojsko w polu i w garnizonach”. Brak wyjątku dla gracza w turach 1–15 (utrzymanie 0). Przemilczenie.
7. **poradnik/14-ai-zagrozenia, tabela poziomów (linie 45–49)** — opisuje bonusy AI, nie gracza. Nie ma tu sprzeczności; brak informacji o jednostce startowej gracza na Trudnym (+1 Wojownik z FALI 935).

Zgodne (bez zmian): poradnik/03-pasek-zasobow linia 116 („im wyżej, tym bardziej AI i barbarzyńcy są rozbudowani”) — nie dotyczy okna.

Stan wiki: wiki jest oparty na buildzie z 2026-09-05; FALA 935 jej nie uwzględnia. To zależy od decyzji właściciela, czy wiki zmienić (NIE poprawiono).

## 4. Zastrzeżenia i NIE ZMIERZONO

- Dwa ziarna, bez powtórzeń i przedziałów ufności. Kierunek w t60 jest niestabilny; nie wolno tego traktować jako wyniku balansu.
- Poziom barbarzyńców: tylko maksimum (`trudny`) w biegach A/B; kontrola `normalny` tylko dla A i jednego ziarna.
- Trzecie ziarno (778899) i ziarno 42 nie były uruchamiane.
- Brak logu zdarzeń barbarzyńców: pierwszy atak na gracza/AI jest wnioskiem z liczników, nie z logu.
- Gracz aktywny NIE ZMIERZONO (§2).
- Miasta-państwa = 1 (jak w AIBAL2), bez testu innych wartości.
- Odczyt ustawienia barbarzyńców NIE ZWERYFIKOWANO w readbacku gry.
- Próba zbudowania bazy 3b23b2d4f: wykonano (archiwum `git archive` do katalogu tymczasowego, bundle vite, bez zmian w repo).

## 5. Dla pytania ABC do właściciela (dane, nie rekomendacja balansu)

Fakty, które mogą wejść do pytania (bez zmiany balansu z tego dokumentu):
- Okno łaski przedłuża życie pasywnego gracza z 16/29 tur do 42/48 tur i daje mu pierwsze 15 tur bez kosztów utrzymania jednostek.
- Po oknie gracz pasywny nie ma źródła dochodu i wyczerpuje skarbiec w ok. 26–32 tury.
- Dla AI wpływ okna jest mały i niejednoznaczny; dominuje poziom barbarzyńców (17% → 68% pustych miast w t30 na tym samym kodzie).

Pytanie do właściciela po tym pomiarze (proponowane w §8 dispatchu): co dalej po t16 — czy gracz ma mieć czas na reakcję (podatek, obrońca), i czy wiki/teksty mają opisać okno łaski.
