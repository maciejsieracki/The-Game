STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-POJECIA-Q1
GOAL: Pełny audyt 10 haseł CivPedii „Pojęcia/Miasto/Nauka/Ekonomia" wobec kodu i danych gry na pinie edb8fb56. Każde twierdzenie liczbowe ze statusem i dowodem, plus jawna lista niedokończonych.
ZMIANY/COMMIT: Zmieniony wyłącznie `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-POJECIA.md` (własny plik tematu, allowlista) oraz ten plik runu. Brak commita. Pliki gra/ i inne P1-16* nietknięte.
TESTY: Brak testów (audyt read-only). Odczyt przez `git show edb8fb56:...`. Wynik po obronie: 151 twierdzeń: ZGODNE 73, ROZJAZD 56, NIEZWERYFIKOWANE 22 (poprzednio 138: 70/49/19). `git diff --check` czysty.
BLOKADY: (1) 22 twierdzenia NIEZWERYFIKOWANE (§11 audytu). (2) `porzadek_ryzyko_buntu_t1` = 0,03 przy opisie „~5%" w JSON. (3) Martwe klucze JSON: `spichlerz_pojemnosc_zapasow_panstwa`, `armia_odklad_bez_spichlerza`, `szczescie_luksus_na_mieszkanca`. (4) Suwak żywności: wiki 70/30, kod Wyżywienie 4/6 — decyzja właściciela. (5) Nazwa „Umowa Handlowa" (wiki) vs „Umowa Szlaków" (kod) — decyzja właściciela; wartości zaufania −10/−15 zgodne.
RUNDY: 1/5 (obrona w tej samej rundzie)
NASTĘPNY KROK: Evaluator weryfikuje zmienione wiersze (§1, §2, §3, §5, §8, §10) i §11 na pinie edb8fb56, potem Final Control. Decyzji właściciela wymagają: SzMax i tabela podatków (Szczęście), 70/30 (Suwak żywności), wymóg/nazwa Umowy (Szlaki).
DEPLOY/PUSH: NIE WYKONANO

OBRONA:
1 -> PRZYJMUJE. Świątynia +1 był wpisany jako ZGODNE mimo adnotacji „nie zweryfikowana". Po sprawdzeniu zmieniono na ROZJAZD: ryczałt +1 (`BUILDING_HAPPINESS_BASE_PER_BUILDING` = 1) plus `baza.zadowolenie` = 2 z `buildings.json` daje ≈ +3 na poz. 1 (wg docstringu `economy.ts` ~l. 527–530). Dowód: audyt §8, wiersz „Świątynia +1".
2 -> PRZYJMUJE. Zarzut trafny: kod ma `gra/src/game/diplomacy-penalty-preview.ts:168`, `pushLine(lines,'zaufanie', isTrade ? -10 : -15, …)`, a `isHandelTreatyKind` (l. 65–68) obejmuje `RodzajTraktatu.UmowaSzlakow`. Wiki `wikiM` podaje −10 / −15 wprost. Wiersz wartości zmieniono na ZGODNE. Nazwa („Umowa Handlowa" vs „Umowa Szlaków") zostaje jako ROZJAZD. Opis Relacji −15 w `diplomacy.json` akcja 5 dodano jako NIEZWERYFIKOWANE. §11 pkt 10 poprawiono.
3 -> PRZYJMUJE. Sprawdzono `wikiM`/`full` i dopisano brakujące wiersze: Bogactwo próg 1→2 (ZGODNE); Bunt „7% → skrajny, 2 tury grace" (ROZJAZD: grace normal = 3, `porzadek_grace_tur_bunt`); Bunt „Naprawa w 3 turach, kary znikają od razu" (NIEZWERYFIKOWANE); Porządek „10 tur przy 0,95" (ZGODNE); Suwak handlu 20/20/60 suma (ZGODNE), „dużo szczęścia" = +3,3 pkt wg kodu (NIEZWERYFIKOWANE, jakościowe), 80/10/10 = −7,8 pkt (NIEZWERYFIKOWANE); Szczęście scenariusze 50%→6%, Teatr→11%, koniec wojny→28%, cel 50% (wszystkie ROZJAZD: SzMax normal Brąz = 50, nie 18; wojna −5, nie −3; cel 50% = netto ≥25). Dowód: `szczescie_max_epoka`, `szczescie_kara_wojna` w `society-params.json` na edb8fb56.
4 -> PRZYJMUJE. Sprawdzono: pole `historia` jest puste (`''`) we wszystkich 10 hasłach w `gra/src/data/wikiBundle.json` na edb8fb56. Dopisano jako pkt 4 w §0 „Uwagi wstępne". Zakres `historia` = 0 twierdzeń, zamknięty.
