# AI-BUNT-STOLICY — zapis/wczytanie, odbicie, Mennica/Pałac, skarbiec (R-WEB-AI-CAPITAL-REBEL-SAVE-Q2, tag CAPREBEL2)

Data: 2026-11-27. Baza kodu: `b7830f1de` (origin/main). Runda 1/5, Operator HAIKU 5.5.
Kontynuacja `AI-BUNT-STOLICY-SKUTKI-2026-11-27.md` (CAPREBEL).

Surowe dane (`dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/dane/`):
- `capital-bunt-s4242-10t.txt`, `capital-ctl-s4242-10t.txt`
- `capital-bunt-s7-10t.txt`, `capital-ctl-s7-10t.txt`
- `capital-bunt-s778899-10t.txt`, `capital-ctl-s778899-10t.txt`

Każdy plik to pełny stdout runnera (`PREFIX=CAPREBEL-CAPITAL {...}`), w tym wiersze `rows` po każdej turze.

## Ustawienia (poziom maksymalny)

Start przez `__settingsLive.startNewGame` z `MAX_PARAMS` runnera `gra/tools/caprebel-capital-live.cjs` (bez zmian w tej rundzie): Trudny, kultura i religia trudny (gracz i AI), koszty jednostek ×4 (Wysoki), dyplomacja wojenna trudna, wzrost surowców z epoką ON, zwycięstwo WŁĄCZONE. Wymuszenie buntu: `__rebelNotifyTestDebug.forceRevoltEligible(stolica)`. Kontrola: ten sam start bez wymuszenia.

Maksimum uznane: wartości ustawień są takie same jak w rundzie CAPREBEL 2 (zob. tam). Nie zmierzono innych poziomów.

## Tabela pozycji

| Pozycja | Wynik | NIE ZMIERZONO / próba |
|---|---|---|
| 1. Zapis przed buntem → wczytanie → ten sam przebieg; zapis po buncie → wczytanie | NIE ZMIERZONO. Nie uruchomiono biegu z zapisem. Hak `__detHarness.snapshotJson/restoreJson` istnieje (`gra/src/main.ts` ~33712–33714), ale nie został użyty w tej rundzie. | Brak próby w tej rundzie (wymaga nowego skryptu `caprebel2-*.cjs`). |
| 2. Odbicie zbuntowanego miasta; czy stolica AI wraca do starego miasta | NIE ZMIERZONO. Nie użyto haka transferu miasta do odbicia. | Brak próby. Ryzyko z dispatchu i poprzedniego dokumentu (jawny wpis `capitalCityIdByOwner` może zostać nieaktualny po buncie) pozostaje niezweryfikowane. |
| 3. Mennica / Pałac w stolicy po buncie | NIE ZMIERZONO. Mennica nie powstała w żadnym wierszu (`mennicaAnyCities` = [] we wszystkich 6 biegach). | Brak próby budowy Mennicy hakiem `adminSetup`, bo to wymagało zmiany poza zakresem tego podejścia. Jedyna obserwacja: w biegu seed 7 (bunt) ostatni wiersz (tura 11) pokazuje `capNowBuildings: ["palac"]` w nowej stolicy city26. Nie sprawdzono, czy Pałac był tam przed buntem. |
| 4. Skarbiec: ≥ 3 ziarna, 10 tur, bunt vs kontrola | ZMIERZONO (patrz tabela poniżej). | — |
| 5. Długi bieg ≥ 20 tur po buncie | NIE ZMIERZONO. Najdłuższe biegi to 11 wierszy (10 tur po wymuszeniu). | Bieg 20 tur nie zmieścił się w jednym wywołaniu (limit 590 s, zakaz `run_in_background`). Biegi 10-turowe trwały 7,5–9,6 min. |
| Błędy konsoli, pageerror | Zero w 6 biegach (`errors` = []), do tury 11 po wymuszeniu. | — |
| Bramki | `tsc --noEmit` exit 0 (gra/src bez zmian). Pozostałe bramki (logic 213, ai-test 297/0, rebellion-gate 37/0, rebellion-news 24/0) NIE ZMIERZONO w tej rundzie. | gra/src nie zmieniano, więc bramki z rundy CAPREBEL pozostają aktualne. |

## Skarbiec właściciela AI (liczby z surowych danych, tury 1–11)

Tura 1 to stan przed wymuszeniem (0 w każdym biegu). Kolumny: tura 2 … tura 11.

| Ziarno | Właściciel | Bieg | t2 | t3 | t4 | t5 | t6 | t7 | t8 | t9 | t10 | t11 | Stolica |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4242 | 13 | bunt | 16 | 17 | 18 | 19 | 22 | 9 | 2 | 8 | 15 | 22 | city16 → city17 od t2 |
| 4242 | 13 | kontrola | 9 | 5 | 88 | 63 | 72 | 81 | 143 | 150 | 158 | 166 | city16 |
| 7 | 22 | bunt | 13 | 3 | 5 | 7 | 11 | 15 | 15 | 7 | 15 | 19 | city25 → city26 od t2 |
| 7 | 22 | kontrola | 7 | 14 | 21 | 28 | 37 | 30 | 48 | 56 | 64 | 72 | city25 |
| 778899 | 13 | bunt | 13 | 15 | 17 | 3 | 7 | 11 | 23 | 31 | 87 | 95 | city15 → city16 od t2 |
| 778899 | 13 | kontrola | 8 | 16 | 24 | 32 | 26 | 36 | 54 | 64 | 75 | 87 | city15 |

Różnica bunt − kontrola w turze 11: ziarno 4242 −144; ziarno 7 −53; ziarno 778899 +8.

Trajektorie rozchodzą się od tury 2 (wymuszenie buntu zmienia dalszy bieg AI). Różnic nie wolno więc czytać jako czystego efektu stolicy. Korupcji nie odczytano w tej rundzie. Ten pomiar nie wyodrębnia efektu stolicy na skarbiec.

Nowa stolica po buncie: w każdym biegu buntu to kolejne miasto właściciela, zgodnie z CAPREBEL (fallback na najstarsze pozostałe miasto).

## Wnioski ostrożne

1. Pozycje 1, 2, 3 (zapis/wczytanie, odbicie, Mennica/Pałac) oraz 5 (bieg ≥ 20 tur) nie zostały zmierzone w tej rundzie. Pozostają otwarte w kolejnej rundzie, która wymaga nowego skryptu `gra/tools/caprebel2-*.cjs`.
2. Skarbiec po buncie różni się od kontroli w każdym z trzech ziaren, ale kierunek nie jest stały (−144, −53, +8 w turze 11). Ten sam wynik na jednym ziarnie nie jest wnioskiem o balansie.
3. Brak błędów konsoli i pageerror w 6 biegach po 10 turach.

## Pytanie do właściciela

Brak nowego pytania. Decyzja o sukcesji po buncie (A: najstarsze miasto, B: jak przy podboju z relokacją, C: stolica bez efektów przez N tur) pozostaje w `AI-BUNT-STOLICY-SKUTKI-2026-11-27.md`. Ten pomiar jej nie rozstrzyga.

## Ustawienia runnera

Zmiany w `gra/tools/caprebel-capital-live.cjs`: brak. Do uruchomień użyto build `vite build` do katalogu poza repo, a po pracy katalog usunięto.
