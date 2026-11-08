STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB). Analiza i propozycja treści, kod gry bez zmian.
TEMAT: R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1
GOAL: Rozstrzygnąć zarzuty Z1–Z5 po Obronie. Przeprowadzić trzeci, niezależny turniej (DODATEK 1 pkt 4). Oznaczyć TOP 5 w CSV jako FINALNE. Samodzielnie sprawdzić bramki i allowlistę.

## ZMIANY-COMMIT
- Baza FC: commit Obrony e8f25ce4a (gałąź `r-web-tech-cards-obrona`, linia 57b916eb7 → 85be851ae → 163f82323 → e8f25ce4a).
- Commit FC na gałęzi `r-web-tech-cards-fc` (SHA podaje raport końcowy). Wszystkie pliki są w allowliście:
  - `narzedzia/fc_final.py` (nowy): własne oceny FC 0–5 z uzasadnieniem każdej oceny, dla 15 odkryć;
  - `narzedzia/gen.py`:
    - trzeci turniej i wynik FINALNY;
    - nowa kolumna CSV `Status_TOP5`;
    - plik `turnieje/FC-trzeci-turniej.md`;
    - przy remisie w wyborze zdania „aby…” rozstrzyga ta sama kolejność co w pojedynku: SKALA, ZASIĘG, NOWA MECHANIKA;
  - `narzedzia/techdata.py`: dwie korekty faktów (niżej);
  - `odkrycia-top5.csv`, `turnieje/*.md` (wygenerowane) i `ANALIZA-KART-ODKRYC.md` (nagłówek, §5, §9 Q7, §11);
  - ten raport.
- Zmiany w `gra/**`, `gra-robocza` i `WERSJE.md`: 0. Nie było push.

## ORZECZENIA (zarzuty Evaluatora)
- **Z1 (CRLF) — ODDAL.** Obrona już to naprawiła (`lineterminator='\n'`). Sprawdziłem samodzielnie: `git diff --check 57b916eb7 HEAD` nic nie zwraca, a `file` pokazuje „UTF-8 (with BOM)” bez CRLF.
- **Z2 (ziarnistość, Prawo) — ODDAL.** Dispatch każe wypisać „pełną listę efektów”, a NIE_USTALONO dopuszcza dopiero przy mniej niż 5 efektach. Własny turniej FC dla Prawa dał ten sam wynik, kolejność 5/5. Dowody: `economy.ts:1225-1249`, `society-params.json:795,809`. Sposób pokazania na karcie zostaje w Q1.
- **Z3 (Top1 = droga badań albo cud) — ODDAL.** Obrona rozstrzygnęła to regułami R-K1 i E1. Turniej FC potwierdził Top1 dla Łowiectwa, Mistycyzmu, Religii i Inżynierii. Dla Oblężnictwa wynik jest inny (niżej).
  - Część zarzutu przechodzi **DO DECYZJI CZŁOWIEKA (Q7)**: Matematyka i Obróbka żelaza. Żaden kandydat nie spełnia tam E1, a różnice punktowe są minimalne:
    - Matematyka: cuda narodowe 38 pkt, droga badań 37 pkt;
    - Obróbka żelaza: Posąg Peruna 35, droga badań 32, jednostki narodowe 25.
  - To realny wybór produktowy (wariant A, B albo C w §9 Q7). W CSV oznaczyłem je jako `FINALNE-WARUNKOWE`.
- **Z4 (Koło, wódz-Rydwan) — ODDAL.** Obrona już to dodała. Dowody sprawdziłem: `generals.ts:71-73`, `main.ts:7304-7307`. FC daje kolejność 5/5.
- **Z5 (CMZ Wojskowość i Brązownictwo) — ODDAL.** Obrona poprawiła treść, a zdania zgadzają się z `production.ts:1075-1076`.
- Żaden zarzut nie ma orzeczenia NAPRAW.

## TRZECI TURNIEJ FC (`turnieje/FC-trzeci-turniej.md`)
- **Zakres (15 odkryć):**
  - sporne po Obronie: Prawo, Łowiectwo, Mistycyzm, Religia, Matematyka, Inżynieria, Oblężnictwo, Obróbka żelaza, Koło;
  - próbka zgodnych: Waluta/Mennica, Wymiana, Brązownictwo, Żegluga, Wojskowość, Budownictwo.
- **Zgodność Obrona → FC:** zbiór 66/66; identyczna kolejność w 14/15 odkryciach.
- **Jedyna zmiana — Oblężnictwo:** Top1 to teraz Katapulta (34 pkt), a Warsztat oblężniczy spada na Top2 (33 pkt).
  - Badanie Oblężnictwa wymaga Koszar (`tech.json`, „wymagany budynek: Koszary”).
  - Koszary dają już tę samą ścieżkę parametrów +20% (`unit-building-bonuses.ts:23-33`), więc NOWA MECHANIKA Warsztatu to 1, a nie 3.
  - Katapulta jako jedyna burzy mury zza linii (zasięg 6, wallAttack 16, `units.json:3482-3505`).
  - W CMZ Katapulta jest teraz pierwsza. Zdanie o Warsztacie: „+10% (z Koszarami razem +30%)” zamiast mylącego „razem do +50%” (Akademia wojskowa wymaga dopiero Sztuki wojennej).
- **Korekta faktu — Łowiectwo:** Obóz łowiecki daje także +1 Pracy (`terrain-improvements.json:155-160`; Praca jest naliczana w `turn-economy.ts:223`).
- **Pozostałe 17 odkryć:** FINALNE bez trzeciego turnieju (zgodność Operator/Evaluator co najmniej 3/5).

## TESTY (= WERYFIKACJA, wykonane samodzielnie)
- Generator (`python3 -I narzedzia/gen.py <worktree>`) przechodzi:
  - asercję 32/32;
  - `check_ev` dla każdego `plik:linia`;
  - asercję pełnej listy kandydatów FC.
  Wynik: 157 kandydatów, 374 pojedynki, 0 pozycji powyżej 72 znaków.
- Pomiary w kodzie, wszystkie ZGODNE:
  - Mennica ×1,50 (normal) w `econ-params.json:585-591`; liczona w `economy.ts:948-955` przed suwakami;
  - bramka handlu `TRADE_TECH='Wymiana'` (`trade-routes.ts:1093`);
  - `EMBARK_TECH='Żegluga'` (`embarkation.ts:25`);
  - bramka Koszar (`production.ts:1075-1076`);
  - drogi ×3 i ×5 (`road-movement.ts:14,29`);
  - limit wodzów (`generals.ts:2-4`);
  - korupcja −30% na budynek (`economy.ts:1225-1249`);
  - Prawo: Trybunał 17, Pretorium 38 (`society-params.json`);
  - konwersja religijna: Świątynia 4, Kamienne kręgi 2;
  - Mury, Cytadela, Baszta: 200/100/100 (`miasto-params.json:79-92`, `city-defense.ts:60-73`);
  - Cytadela jest osobnym budynkiem obok Murów (`buildings.json:1498`).
- `git diff --check 57b916eb7 HEAD` nic nie zwraca.
- `git diff --name-only 57b916eb7 HEAD` daje 0 plików poza allowlistą i 0 w `gra/**`.
- `origin/main` (2339b3dab) od bazy 57b916eb7 nie zmienia nic w `karty-odkryc/**` ani w `runs/<ID>/**`, więc nie ma konfliktu.
- Buildu i testów gry nie uruchamiałem, bo to temat dokumentacyjny.

## BLOKADY
Brak blokad technicznych. Na właściciela czekają pytania ABC Q1–Q7 z §9 analizy; Q7 dotyczy już tylko Matematyki i Obróbki żelaza.

## RUNDY
1/5

## NASTĘPNY KROK
- Orkiestrator integruje do `main` commit FC (zawiera całą linię Operator → Obrona → FC).
- Kolejność względem `origin/rust-port/parity-v2`: bez zależności, bo zmiany obejmują tylko `dyspozycje/**`.
- Potem pytania ABC Q1–Q7 do właściciela.
- Następnie osobne tematy: wdrożenie kart odkryć, a dalej budynki (TOP3 → TOP 5).

## DEPLOY/PUSH
NIE WYKONANO
