STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1 (CAPREBEL)
GOAL: skutki buntu stolicy AI przy >=2 miastach (pomiar + analiza; zmiany gra/src tylko read-only hak)
ZMIANY/COMMIT: kandydat 970258409021acf1db85e3709fdf99e4524816f1; baza 659e2d01c jest przodkiem (merge-base --is-ancestor OK). diff --stat: 8 plikow, +301/-0, wszystkie w allowliscie (gra/src/main.ts +20 tylko blok civTest __capRebelReadTestDebug, read-only; gra/tools/caprebel-capital-live.cjs; analiza; runs/**). Brak zmian gra/data, WERSJE.md, logiki gry.
TESTY (wlasne, surowe wyjscie, worktree detached na kandydacie, npm ci):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0
- ai-test 297/0; rebellion-gate 37/0; rebellion-news 24/0
- Zywych biegow nie powtarzalem; sprawdzilem dane surowe (bunt 5t: city16->city17, errors [], gameOver false, wygrana ON) i odwolania do kodu (capitalCityIdForOwner fallback ~40158, relokacja ~40332/40370, zapis/kasowanie ~40788, serializacja ~52694, transferCityToRebelFactionWithLedger ~41819) - zgodne z dokumentem.
OCENA ZARZUTOW (bez etykiet rol):
1 (Mennica/Palac NIE ZMIERZONO): ODDAL - uzasadnione. Hak zapisu (budowa) poza allowlista (dopuszczony jeden hak read-only); udokumentowana proba naturalna 2x5 tur; dalsza praca = osobny temat. Uwaga.
2 (skarbiec/korupcja): ODDAL - runner czyta skarbiec, doc uczciwie pisze ze efekt nie jest wyodrebniony (1 ziarno). Uwaga.
3 (zwyciestwo, gameOver null): NAPRAWIONO - wygrana ON, gameOver z __defeatTestDebug.isGameOver = false w kazdym wierszu.
4 (-99): NAPRAWIONO - poprawna interpretacja (ID frakcji), doc skorygowany; wojny AI<->frakcja NIE ZMIERZONO z podanym powodem.
5 (zapis/wczytanie): CZESCIOWO - opis kodu poprawiony i zgodny z kodem; round-trip NIE ZMIERZONO (brak biegu z zapisem) - uwaga.
6 (bunt vs podboj): NAPRAWIONO - wiersz (a2) i ryzyko starego wpisu jawnego opisane z kodu; PODEJRZANE + DECISION_REQUIRED.
7 (poziom maksymalny): NAPRAWIONO - wzrostSurowcowZEpoka:true (ON), uzasadnienie w doc.
8 (procedura): NAPRAWIONO - ai-test/combat/unit-replace uruchomione, zielone (potwierdzone tez przeze mnie).
Zaden zarzut nie wymaga FAIL: zadanie to pomiar, a pozycje niezmierzone maja udokumentowana probe/powod, co spelnia binarne kryterium dispatchu.
BLOKADY: brak blokad technicznych. NIE ZMIERZONO: Mennica/Palac, wyodrebniony efekt stolicy (skarbiec/korupcja), round-trip zapisu po buncie, podboj/odbicie stolicy, wojny AI<->frakcja, biegi >6 tur.
RUNDY: 2/5 (FC runda 2)
NASTEPNY KROK: integracja orkiestratora (zmiana gra/src to tylko hak testowy; deploy wg orkiestratora).
UWAGI-DLA-ORKIESTRATORA: (1) rozwazyc temat z hakiem ZAPISU civTest (Mennica, korupcja) i wieloma ziarnami; (2) DECISION_REQUIRED polityka nowej stolicy po buncie (A/B/C w doc) - pytanie do wlasciciela wg ZASAD ABC; (3) ryzyko: po buncie jawny wpis stolicy zostaje, odbicie miasta moze przywrocic stara stolice (kod, niezmierzone).
DEPLOY/PUSH: NIE WYKONANO
