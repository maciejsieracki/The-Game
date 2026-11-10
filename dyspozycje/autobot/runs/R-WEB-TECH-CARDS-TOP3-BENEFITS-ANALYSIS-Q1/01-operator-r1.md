STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — analiza i propozycja treści, bez zmian w kodzie gry
TEMAT: R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1
GOAL: Dla 32/32 odkryć ustalić z dowodem `plik:linia` realne korzyści, wybrać turniejem TOP 5 (Top1 = GŁÓWNA KORZYŚĆ, blok zaraz po Rysie historycznym) i przepisać „Co możesz teraz zrobić” w schemacie CZYNNOŚĆ → KORZYŚĆ (dispatch + DODATEK 1 + DODATEK 2).

ZMIANY-COMMIT:
- 85be851ae — `dyspozycje/analizy/karty-odkryc/`: `ANALIZA-KART-ODKRYC.md`, `odkrycia-top5.csv` (UTF-8 BOM, `;`, 32 wiersze, kolumny dispatchu i dodatków, w tym Top1_GLOWNA…Top5, Kandydaci, Wynik_turnieju, Co_mozesz_zrobic_OBECNIE/PROPOZYCJA, Pewnosc_CMZ), `turnieje/*.md` (32 pliki + README), `narzedzia/gen.py` + `techdata.py` (generator i dane turnieju).
- Raport (ten plik) w osobnym commicie, którego SHA podaje orkiestrator z `git log`.
- ZAŁOŻENIE: plik ma nazwę `odkrycia-top5.csv`, bo DODATEK 2 pkt 1 każe zamienić Top3 na Top5. Plik `.xlsx` nie powstał, bo w środowisku nie ma `openpyxl` (`ModuleNotFoundError`).
- Poza allowlistą nic nie zmieniłem. `gra/**`, `gra-robocza`, `WERSJE.md` nietknięte (`git show --stat 85be851ae`: 37 plików, wszystkie w `dyspozycje/analizy/karty-odkryc/`).

TESTY (= WERYFIKACJA):
- Kompletność 32/32: generator przerywa pracę, jeśli zbiór odkryć różni się od `tech.json` (assert). Każdy wiersz ma Top1–Top5 albo jawne `NIE_USTALONO` z dowodem kompletności. 18/32 odkryć ma ≥ 5 realnych efektów, 14/32 mniej (wypisane w Uwagach).
- Turniej: 156 kandydatów, 370 pojedynków (każdy z każdym), każdy pojedynek z uzasadnieniem odwołującym się do kryterium. Kryteria i wagi: SKALA 3, NOWA MECHANIKA 3, BRAK ZASTĘPNIKA 2, ZASIĘG 2, ODCZUWALNOŚĆ 2, CZYTELNOŚĆ 1.
- Dowody: każdy przywołany `plik:linia` zweryfikowany przez generator (`check_ev`: plik istnieje, linia ≤ długość pliku). Kluczowe linie sprawdziłem ręcznie (`sed -n`).
- Mennica: realny współczynnik **×1,50 normal / ×1,62 easy / ×1,38 hard** (`gra/data/econ-params.json:585-591`), liczony w `gra/src/game/economy.ts:952-955` na podatku miejskim przed podziałem suwakami (`:962-967`). Działa w każdym mieście, gdy jedna Mennica stoi w stolicy (`:644-653`). Warunki to Targowisko i Złoto (`building-resource-gate.ts:75-76,119`), Mennica zużywa 1 Złota na turę (`zloto-access.ts:31`). Dziś karta pokazuje tylko „Mennica: pieniadz +2”.
- `git diff --check`: czysto. Nie uruchamiałem builda ani testów gry (temat dokumentacyjny, zakaz `npm run build` w `gra/`).

BLOKADY: brak. Uwagi do decyzji to pytania ABC Q1–Q7 w `ANALIZA-KART-ODKRYC.md` §9 (format TOP 5, karty z mniej niż 5 efektami, wiersz „Nie oznacza”, efekty martwe, źródło ulepszeń, sekcja Cuda, Top1 jako droga badań lub cud-wyścig). Zadaje je orkiestrator.

Najważniejsze ustalenia:
- „Co możesz teraz zrobić” opiera się na 5 szablonach i 95 wystąpieniach na 32 kartach (`technologyAdapter.ts:147,154,160,166,173` = `techDiscoveryNotice.ts:213-225`). T1–T4 to masło maślane (np. „Zbuduj Koszary, jeśli spełniasz ich wymagania”, choć Koszary nie mają wymagań; „Przygotuj Fort na odpowiednim złożu”, choć Fort nie wymaga złoża). T5 to zastrzeżenie bez wartości.
- Karty nie pokazują kluczowych mechanik: Wymiana jest bramką całego handlu (`trade-routes.ts:1093`), Żegluga daje zaokrętowanie (`embarkation.ts:25`), bez Koszar nie ma rekrutacji wojska Brązu i Żelaza (`production.ts:1071-1076`), awans epoki daje +1 wodza (`generals.ts:2-4`).
- Efekty martwe: Astronomia (Biblioteka poz. 6 przy `maksPoziom` 2), Teatr (suppressed), Lazaret (brak w danych), Wielka odlewnia i Wielka Kuźnia (epoka 4). Brakujące ulepszenia: Kopalnie miedzi, cyny i żelaza oraz Stadnina.
- TOP3 budynków: 43/43 wypełnione (komentarz „0/42” w `buildingAdapter.ts:234` jest nieaktualny). 47/129 pozycji powtarza wymagania, a TOP3 Mennicy nie wspomina o mnożniku.
- 5 najgorszych kart: Astronomia, Waluta, Wojskowość, Wymiana, Brązownictwo (cytaty w §8). Propozycja układu: sekcja `top5` na indeksie 2, a renderer sam postawi przed nią Rys historyczny (§7).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — ślepy turniej 32/32 (bez zaglądania do Top1–Top5 Operatora), macierz zgodności na 5, próbka ≥ 8 wierszy z kodu (w tym Waluta/Mennica).
DEPLOY-PUSH: NIE WYKONANO
