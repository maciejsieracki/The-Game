# R-WEB-DIPLO-CIVPEDIA-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: INTEGRATION_PENDING
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DIPLO-CIVPEDIA-Q1
GOAL: Civpedia i poradnik opisują dyplomację zgodnie z obecnym stanem kodu; test wartości wykrywa rozbieżności także w prozie i tabelach opisowych.
BAZA: c851ee3dc815a5fdd1e5a316f482ca05797d725d (kandydat z zarzutami)

## ZMIANY / COMMIT
- Zarzut 1 (test nie pilnuje liczb w prozie i tabelach opisowych): PRZYJĘTY. Commit poprawki: patrz sekcja „SHA” poniżej.
  - Zmieniony plik: `gra/tools/diplo-civpedia-values-test.cjs` (w allowlistcie). Dodano sekcję 3d (sprawdzenie prozy) i sekcję 4d (samo-testy mutacji prozy).
  - Sekcja 3d sprawdza: wiersze „Sąsiedztwo granicą, Kamień/Brąz/Żelazo” w tabeli „Zmiany na turę” (`zaufanie.md`) względem `diplomacy.json:params.ekspansjaGranica*_zaufanie_perTura`; zdania „po zawarciu rozejmu Zaufanie pary wynosi **N**” i „po pokoju — **N**” (`zaufanie.md`) względem `rozejm_zaufanie_ustawienie` / `pokoj_zaufanie_ustawienie`; zdania „Zawarcie rozejmu/pokoju ustawia Zaufanie pary na **N**” (`rozejm-pokoj.md`) względem tych samych kluczy.
  - Żadnego hasła ani JSON nie zmieniono w tej poprawce (hasła były zgodne z kodem; brakowało strażnika).
- Zarzut 2 (wiersze religii ±0,5 w `gra/data/diplomacy.json` l.442-455 i l.742-749): ODRZUCONY w zakresie zmiany pliku JSON. Dowód:
  - `gra/data/diplomacy.json` l.26-27: `wspolnaReligia_zaufanie_perTura: 0`, `odmiennaReligia_zaufanie_perTura: 0` (wartości operacyjne).
  - `gra/src/game/diplomacy.ts` l.158-160: ta sama wartość 0 w kodzie.
  - Wiersze l.442-455 i l.742-749 to tabele opisowe („Zmiana: +0.5 (max +15)”, „Δ Zaufanie/turę: 0.5”), nieczytane przez kod; zmiana ich poza allowlistą (JSON balansu) jest zakazana przez dispatch (zakres: docs, wikiBundle.json, test).
  - Hasła nie powołują się na te wiersze; `zaufanie.md` l.58 wprost mówi, że klucze w JSON mają wartość 0.
  - Rozbieżność zostaje ZGŁOSZONA do orkiestratora jako osobny temat (wyrównanie tabel opisowych w `diplomacy.json` do wartości 0), poza tym tematem.

## TESTY (surowe wyniki, ta runda)
- `node gra/tools/diplo-civpedia-values-test.cjs` po poprawce: `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 150`, exit 0.
- Ręczna mutacja (przywrócona `git checkout`): `zaufanie.md` Żelazo −5 → −6 w tabeli prozy: test CZERWONY (`WYNIK: CZERWONY — 3 z 130 sprawdzeń niezgodnych`, w tym `proza „Sąsiedztwo, Żelazo” = −6`); ta sama mutacja `wynosi **10**` → `**11**`: CZERWONY (3 z 130). Przed poprawką obie mutacje przechodziły (zarzut Evaluatora).
- `git diff --check`: exit 0.
- Pozostałych bramek (tsc, logic 213/213, admin-panstwo, tech-tree, research, unit-replace, combat) nie uruchamiano ponownie: poprawka dotyczy wyłącznie pliku testu, który nie jest wejściem żadnej z nich; wynik Evaluatora dla kandydata c851ee3dc: zielone.
- `wikiBundle.json`: nie zmieniany (hasła bez zmian).

## BLOKADY
- Brak. Rozbieżność z zarzutu 2 jest poza zakresem tematu (zob. wyżej).

## RUNDY
2/5 (odpowiedź na zarzuty rundy 2 Evaluatora; werdykt Evaluatora: PASS-WITH-NOTES).

## NASTĘPNY KROK
Ponowna ocena Evaluatora kandydata (commit poprawki w tej gałęzi, bazowany na c851ee3dc). Orkiestrator decyduje o integracji; Operator nie integruje.

## DEPLOY/PUSH: NIE WYKONANO
