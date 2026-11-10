STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1
GOAL: Status z dowodem dla 51 haseł CivPedii „Jednostki" wobec `gra/data/units.json` na pinie `edb8fb56`.
ZMIANY-COMMIT: zaktualizowano `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md` (dodano §5 z dowodami obrony; poprawiono wiersze 2, 4, 8, 40, 41 i §0–§3). Dopisano obronę do `/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1/01-operator.md`. Brak commitów. `git diff --check` czysty.
TESTY: skrypty na danych z `git show`. Pin `edb8fb56`, przed `4c1126de`, przed `161ab227`, przed `e401c1c2`. Koszt: wiki = przed `4c1126de` dla 48/49. Siła w polu: wiki = przed `161ab227` dla 9/9. Bonusy: 25/25 jawnych bonusów z wiki zgodnych. Epoka: konflikt pól w 3 hasłach (Falanga, Hieros, Wojownik germański). Tempo: domyślne `'niski'` (x1.0). Wynik: NADAL ISTNIEJE 43, NAPRAWIONY 6 (5 jednostek + Bród), NIEROZSTRZYGNIĘTY 2 (Hieros Lochos, Manpower). Sprawdzono 51/51.
BLOKADY: brak.
RUNDY: 1/5 (druga tura Operatora w tej samej rundzie)
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje §5 i zmienione wiersze.
DEPLOY/PUSH: NIE WYKONANO

OBRONA: 1 -> PRZYJMUJE: ratio to 2×, nie ×5. §2c AUDYT dotyczy budynków. Przyczyna: commit `4c1126de` (2026-09-16, „apply half recruitment and resource upkeep costs") przepołowił koszty w `units.json`. Wiki (ostatnia zmiana `918e5993`, 2026-09-06) ma wartości sprzed tego commitu, 48/49 dokładnie.
OBRONA: 2 -> ODRZUCAM jako przyczynę: `KOSZT_JEDNOSTEK_PACE` to mnożnik runtime. Domyślne tempo gracza to `'niski'` (x1.0; `gra/src/game/playerState.ts:156`, `main.ts` `?? 'niski'`). Wiki nie deklaruje tempa. Przyczyna rozstrzygnięta jako `4c1126de`. NADAL ISTNIEJE pozostaje, bo rozjazd wiki vs pin jest potwierdzony liczbowo.
OBRONA: 3 -> PRZYJMUJE wyjaśnienie: AUDYT §5 („46/49") opisuje stan sprzed `4c1126de` i `161ab227` (oba po 2026-08-13). Dowód: wiki = pre-4c dla 48/49 kosztów i wiki = pre-161ab227 dla 9/9 siły w polu konnych/rydwanów.
OBRONA: 4 -> PRZYJMUJE: Hieros Lochos przeniesiony do NIEROZSTRZYGNIĘTY (`Epoka` Żelazo vs wiki Brąz = `Dostępna[0]` Brąz). Konflikt epoki odnotowany również dla Falangi i Wojownika germańskiego, bo wiki zgadza się tam z różnymi polami. Pozostałe 46 haseł zgodne z obydwoma polami.
OBRONA: 5 -> PRZYJMUJE: Galera ruch 4/— zgodny z wiki „4 (mapa) / — (bitwa)". Dopisane w wierszu 4. Status bez zmian.
OBRONA: 6 -> PRZYJMUJE w zakresie dowodu: 25/25 jawnych bonusów z wiki zgodnych z `units.json`. Dane mają bonus vs Mount 50 nieopisany w wiki dla Falangi, Wojownika germańskiego i Wojownika mykeńskiego (dopisane w wierszach 2, 40, 41). Status bez zmian.