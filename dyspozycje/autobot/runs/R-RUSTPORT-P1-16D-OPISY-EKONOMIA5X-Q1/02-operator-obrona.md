STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-EKONOMIA5X-Q1
GOAL: Status z dowodem na edb8fb56 dla AUDYT-OPISY §2c, §2e, §3 oraz P1-16 §9.5 (bez Akademii). Obrona zarzutow Evaluatora, runda 1/5, tura obrony.
ZMIANY/COMMIT: zaktualizowany plik dyspozycje/rust-port/p1/P1-16D-OPISY-EKONOMIA5X.md (sekcje 1, 2.1, 2.2, 3, 7, 8, 9); ten raport. Brak commita. gra/** nietkniete.
TESTY: nie uruchamiano (zakaz w temacie). Dowody: git show/grep/log/diff na edb8fb56 i e401c1c2, 9175f031; python3 -I na JSON (kopie w scratchpadzie).

OBRONA:
1 -> PRZYJMUJE. Teza "48 z 49" falszywa. Pinowy gra/src/data/wikiBundle.json, kategoria Jednostki: 49 wpisow, 31 z jawnym N× materialem w wikiS/wikiM/full, 18 bez (lista w pliku §2.1). Rozbieznosc z zarzutem (27 vs 31) jest w liczeniu regexem; obie wartosci obalaja 48.
2 -> PRZYJMUJE. Pelna tabela 31 wierszy w pliku §2.1 (wiki vs units.json, stosunek, zgodnosc materialu). Stosunek dokladnie 5: 10 wierszy (nie 1). Materiał dosłownie niezgodny: 12 wierszy (3x stal, 1x galera, 7x kon, 1x bydlo), nie 1. Stosunek != 5: 21 wierszy.
3 -> PRZYJMUJE. Recenzje sa na pinie: audyt edb8fb56 §3, tabela "Recenzowane z werdyktem" = 10 wierszy (linie 96-105), "Skatalogowane, BEZ recenzji" = 17 wierszy (linie 111-127), linia 90: "10 z 27". Status D: liczba recenzji ZWERYFIKOWANA = 10.
4 -> PRZYJMUJE. Wyjasnienie bylo bez dowodu; uzupelnione mapowaniem: 28 funkcji build*(Detail|Tooltip)*Card w cityPanel.ts, 26 z nich ma nazwe w pinowym audycie (grep, kazda 1+ trafien), 2 nie maja (buildBuildingDetailCardViaEntityCard l. 7537, buildUnitDetailCardViaEntityCard l. 7861) — sa to pelne funkcje z wlasnym renderem, nie cienkie wrappery (poprawione slowo). Plus resUsageDetailsHtml = 29. Audyt: 27 wierszy = 25 wierszy z 26 funkcjami + 1 wiersz resUsage + 1 wiersz inline ("Religia — szczegoly (wariant fallback)" @3789-3805, bez funkcji). Roznica 27/29 = dokladnie 2 warianty ViaEntityCard.
5 -> PRZYJMUJE. buildKulturaDetailCard zaczyna sie w cityPanel.ts:3836, nastepna funkcja renderKultura l. 3992; l. 3718 to buildSurowceDetailCard. Literal "Religia — parametry (normal)" l. 3927 jest wewnatrz buildKulturaDetailCard. Poprawione w pliku §3.
6 -> PRZYJMUJE. Porownanie bylo z zlym poziomem. Poprawnie: spichlerz (poz. 1): wiki "koszt od 20 pracy, bez kosztu surowcowego" vs dane drewno 40 — rozjazd. spichlerz_ii (poz. 2): wiki "10× cegla" vs dane drewno 40 + kamien 50 — brak cegly w danych. Status NADAL ISTNIEJE, bez porownania x5 (materialy rozne). Poprawione w pliku §1.
7 -> PRZYJMUJE. Zrodlo wiki podane pelna sciezka: gra/src/data/wikiBundle.json (uzyte). Kopia gra-robocza/srcKopiaMaster/data/wikiBundle.json NIEUZYTA (inna wersja: generated 2026-07-03 vs 2026-09-05). P1-16-EDGE-CASES.md §9.3 przeczytany: wiersze 6a i 8c dotycza innych fraz ("Mnoznik % dotyczy", "+1/poziom"); nie zawiera przeliczenia x5 dla pozostalych haseł Budynki. Akademia pozostaje wykluczona zgodnie z dispatchem (sprawdzona w §9.5 i w wierszu akademia_wojskowa §1).
8 -> PRZYJMUJE. Przyczyna zbadana. Wartosc 50 ustawil e401c1c2 (2026-08-12). Wartosc 200 wprowadzil 9175f031 (2026-09-09, "Integracja Hermes PR #135 H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1"), po e401c1c2. W tym commicie: kamieniolom — wartosc i uwaga zmienione na "bazowo 200/turę, skalowana +50% za epoke"; tartak — tylko wartosc zmieniona, uwaga nadal "×5 → 50/turę (było 10/turę)" (sprzecznosc wewnatrz wpisu). _meta nieaktualny (nadal 50). Status NADAL ISTNIEJE; czy 200 jest zamierzone — decyzja wlasciciela danych.

NASTEPNY KROK: Final Control (Sonnet 5.5 medium) — rozstrzygniecie zarzutow 1-8 wg powyzszej tabeli obrony; plik deliverable i ten raport jako dowod.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
