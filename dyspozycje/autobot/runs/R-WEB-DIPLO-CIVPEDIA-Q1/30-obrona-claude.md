# R-WEB-DIPLO-CIVPEDIA-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora r1)

STATUS: INTEGRATION_PENDING (kandydat do ponownej oceny Evaluatora; Operator nie integruje i nie pushuje na main)
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DIPLO-CIVPEDIA-Q1
GOAL: Civpedia i poradnik opisują dyplomację (zaufanie, respekt, relacja, wiarygodność, Moc, wypowiadanie wojny, rozejm, zmęczenie) ze WSZYSTKIMI parametrami, plusami i minusami; opis OBECNEGO stanu zweryfikowany w kodzie; zasady niewdrożone osobno.
BAZA: 119251ae49bed3e35898df752fa83b3a9e5bed60 (kandydat r1); KANDYDAT r2: f3cddc6defe1167683ab5472fc1931837ca309e4 (commit poprawek, tylko allowlista).

## ZMIANY / COMMIT
- Commit poprawek: `f3cddc6de` (7 plików, wszystkie w allowlistcie): `docs/encyklopedia/pojecia/{zaufanie,respekt,wypowiedzenie-wojny,rozejm-pokoj,wiarygodnosc}.md`, `gra/src/data/wikiBundle.json` (regeneracja skryptem `node gra/tools/bundle-wiki-for-game.cjs`), `gra/tools/diplo-civpedia-values-test.cjs`.
- `git diff --check`: czysto. Zero zmian w `gra/src/**/*.ts`, JSON balansu, WERSJE.md, indeks.md, 12-dyplomacja.md.
- `git diff --stat` względem r1: 7 plików, 137 insercji, 35 usunięć.

## TESTY (surowe wyniki, uruchomione w tej rundzie)
- `npm ci --ignore-scripts` w gra/: `added 71 packages`, exit 0 (node_modules usunięte po testach).
- `npx tsc --noEmit` (gra/): exit 0.
- `node gra/tools/diplo-civpedia-values-test.cjs`: `PASS: 114 sprawdzeń, wierszy parametrów w haśle: 148` (r1: 41 sprawdzeń, 136 wierszy).
- Mutacja martwego parametru (dopisany wiersz `| -15 | diplomacy.json:params.szpiegWykryty_zaufanie |`): `FAIL: zaufanie.md: parametr „szpiegWykryty_zaufanie” nie jest czytany w kodzie gra/src (martwy, uses=1)`, `WYNIK: CZERWONY — 1 z 115`. Po przywróceniu pliku: PASS 114.
- Mutacja liczby w prozie (wbudowana w test, sekcja 4): `Start: **20**` → `**21**` wykrywana przez `checkProzaStart`.
- `node gra/tools/admin-panstwo-panel-names-test.cjs`: `26 pass, 0 fail`.
- `node gra/tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- NIE_ZMIERZONO w r2: tech-tree-test, research-test, unit-replace-test, combat-test (nie uruchamiane ponownie: zero zmian w TS i w danych gry; wynik r1 Evaluatora bez zmian w kodzie).

## BLOKADY
Brak blokad technicznych. Luki świadome (dług, nie ukrywam):
- Test chroni liczby w tabelach Parametry oraz wiersz „Start” w zaufanie/respekt; pozostałe liczby w prozie (progi w tabelach „Progi umów” itd.) NIE są objęte testem.
- Wartości per-turowe `ctx` (dobraWolaAktywna, wspolnyWrog, wspolnaReligia, odmiennaReligia, karaWspolnaGranica) NIE zweryfikowane co do wywołań w `main.ts` (NIE_ZMIERZONO; hasło zaufanie.md opisuje je jako wpięte).

## RUNDY
Obrona r2/5 (odpowiedź na zarzuty Evaluatora r1, 1d24311). Po r2 do rozstrzygnięcia przez Evaluatora/FC.

## NASTĘPNY KROK
Evaluator r2: weryfikacja commitu f3cddc6de (zarzuty 1–9 + N1–N2 niżej); potem Final Control.

DEPLOY/PUSH: NIE WYKONANO

---

## ODPOWIEDŹ NA KAŻDY ZARZUT (PRZYJMUJĘ / ODRZUCAM z dowodem)

**Zarzut 1 — PRZYJMUJĘ.** Dowód: `gra/src/game/diplomacy.ts` ok. 944–946 (`case 'handel'`: `dZ = 0`, komentarz „D3-W1-A: brak stałego bonusu zawarcia”); ok. 995–997 (`case 'dar'`: `dZ = 0`, „D4-WYMIANA-PN … nie flat +6”); `handelZawarcie_zaufanie` tylko w definicji (`:108`), `dar_zaufanie` tylko w `:114` (grep `gra/src`). Naprawa: w `zaufanie.md` wiersze „Zawarcie umowy handlowej” i „Dar” w tabeli zdarzeń ustawione na 0 z wyjaśnieniem (zaufanie z nadmiaru/wartości PN; limit `diplomacy.json:pn_relacja.max_zaufanie_na_ture` = 5, linia 216). Wiersze `handelZawarcie_zaufanie` i `dar_zaufanie` usunięte z Parametry; przykład liczbowy przeliczony (20 + 10 = 30 po 10 turach handlu).

**Zarzut 2 — PRZYJMUJĘ.** Dowód: `diplomacy.ts:151-152` (`aktywnyPakt_zaufanie_perTura`, komentarz `@deprecated — zastąpione przez nap/sojusz/pokoj`); `computeTickZaufanieDelta` (ok. 1801–1810) używa tylko `sojusz`/`nap` w `switch` i ma komentarz „tier pokój (+1) zastąpiony dryfem z W”. Naprawa: wiersz „Aktywny pakt +1” i parametr usunięte; dodana uwaga o tierze „pokój”.

**Zarzut 3 — PRZYJMUJĘ.** Dowód: w `computeTickZaufanieDelta`: `if (ctx.aktywnyHandel) dZ += p.handel_zaufanie_perTura;` stoi przed `switch (peaceTier)`, a w `switch` tylko `sojusz` i `nap` (wyłączne tiery). Naprawa: wiersz Sojusz: „wyłączny z paktem (jeden tier); handel dodaje się osobno”; wiersz Handel: „dodaje się osobno, także przy sojuszu lub pakcie”.

**Zarzut 4 — PRZYJMUJĘ.** Dowód: grep `gra/src` po `przewaga_militarna` / `slabszy_militarnie`: tylko typ (`diplomacy.ts:875-876`), `case` (`:1017-1024`) i etykiety (`diplomacy-factors.ts:72-73`). Wywołania w grze: wyłącznie `wygrana_bitwa` (`main.ts:12491`) i `trybut_zaakceptowany` (`main.ts:25001`). Naprawa w `respekt.md`: źródła „Przewaga militarna” i „Słabszy militarnie” usunięte z tabeli obowiązujących, z Plusy/minusy i z Parametry; dopisano, że zdarzenia są w kodzie, ale nie są wywoływane. Wiersz „Dla AI” poprawiony.

**Zarzut 5 — PRZYJMUJĘ (a, b, c).**
- (a) Przesłanki AI dopisane jako sekcja „Przesłanki AI obecnie w grze” z kodu: brak wojny i brak pokoju zablokowanego / paktu (flagi `stanWojny`, `peaceLocked`, `hasNapTreaty`); okno wczesnej fazy `AI_MAJOR_EARLY_NO_WAR_TURNS = 25` (`ai.ts:6287`; wyjątek: wojna z graczem i miasta-państwa); `willingnessWar > 0`; `rw ≥ PROG_WOJNA_SILA = 0,6` (`ai.ts:6229`, obniżane o 0,12 przy podboju ≥ 4); `agresja ≥ PROG_WOJNA_AGRESJA = 0,5` (`ai.ts:6235`); relacja poniżej progu wojny (`score < progMinimalnyRelacja`, gałąź `wypowiedz_wojne`, ok. `ai.ts:7286–7312`).
- (b) Przykład przepisany zgodnie z regułą hasła: próg wojny 30 (bazaBrakDanych) → próg kryzysu 15; Relacja 18 → 14 uruchamia hamulec; Relacja 25 nie uruchamia hamulca. Hamulec liczony z wyższego progu pary.
- (c) Wzmianka „wiek gry” usunięta z Wiki-S.
- Dodatkowo: zakres progu wojny poprawiony (wzór z JSON, granice 10–70, brak danych → 30).

**Zarzut 6 — PRZYJMUJĘ.** Dopisano sekcję „Bramki pokoju (obecnie w grze)” z kodu i JSON:
- minimalny czas wojny 1–8 tur (`diplomacy-war-peace-params.json:minTurWojny`: baza 5, min 1, max 8);
- przewaga militarna > 20% (`przewagaMilitarna.prog` = 0,2): blokada do zmęczenia 0,5 (`war-weariness-params.json:zmeczenie.progChetnosci`); w `peaceBlockedByMilitaryAdvantage` bez limitu tur;
- „czuje się silniejsze”: rw ≥ 0,55 (`cenaPokoju.odrzucenieRwProg`), bez utraty miasta, do 10 tur (`cenaPokoju.odrzucenieMaxTurWojny`), `isFeelingStronger`;
- mnożnik ceny: po 20 turach (`cenaPokoju.turyBezOgraniczenAi`) bramka „czuje się silniejsze” i mnożnik siły przestają działać, mnożnik cywilizacji ograniczony do 1 (`evaluatePeaceAiGate`, `diplomacy-war-peace-profile.ts`).
Wiersze 0.20 i 20 w Parametry mają teraz opis w tekście.

**Zarzut 7 — PRZYJMUJĘ.** `wiarygodnosc.md`: nowa sekcja „Jak zmienia się Wiarygodność”:
- wygasanie: czas zapominania kara 40/80/120, nagroda 120/80/40 (łatwy/normalny/trudny), liniowo; podłoga 10% zostaje na stałe (`diplomacy-credibility.ts`, `wartoscBiezaca`);
- strumienie na turę: S1 sojusz +1, S2 NAP +0,5, S3 handel +1,2/+0,9/+0,6, S4 przemarsz +0,8/+0,6/+0,4 (`credibilityStreamWeight`, JSON `wiarygodnoscS1..S4`); strumień gaśnie do zera;
- tempo: ×(1 ± W/200) (`wiarygodnoscWzrostMult` / `wiarygodnoscSpadekMult`, amplituda 0,5);
- dryf: W × 0,03 co turę poza wojną (`zaufanieDryfOdWiarygodnosci`, `diplomacy.ts` ok. 1797);
- „Wiarygodność ≠ Zaufanie”: wyjaśnienie w tej samej sekcji.
- „Dary max +5” POTWIERDZONE (nie usunięte): `diplomacy.json:pn_relacja.max_zaufanie_na_ture = 5` (linia 216), dodany wiersz do Parametry.
- Nie opisano martwej funkcji `strumienWiarygodnoscDoZaufania` (dzielnik W/20): brak wywołań w `gra/src`.

**Zarzut 8 — PRZYJMUJĘ (dowód dostarczony).** Tabela „liczba → plik:linia” dla WSZYSTKICH 148 wierszy Parametry z ośmiu haseł jest w sekcji poniżej. Wygenerowana skryptem z tych samych wierszy, które sprawdza test; linie JSON wg dopasowania klucza, linie TS wg unikalnego tokenu. Pozycje `BRAK` (3 szt.) to elementy tablicy `progiStopni: [0.25, 0.45, 0.65]` w `war-weariness-params.json:20` — skrypt nie indeksuje tablic; wartości sprawdzone ręcznie (zgodne).

**Zarzut 9 — PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM CZĘŚĆ.**
- PRZYJĘTE: test sprawdza teraz (a) użycie każdego parametru z tabel `diplomacy.json:params.*` w `gra/src` (martwy = uses < 2; mutacja potwierdzona, patrz TESTY); (b) liczbę w prozie „Start: **N**” w zaufanie/respekt względem `params.startZaufanie` / `startRespekt` (mutacja w prozie czerwieni test). Ta kontrola ujawniła martwy parametr `szpiegWykryty_zaufanie` (N1) — usunięty.
- ODRZUCONE: „sekcja 3 porównuje z literałami, nie z hasłami” — sekcja 3 jest niezależną kontrolą wartości kluczowych z dodatku orkiestratora; powiązanie haseł z JSON/kodem robi sekcja 2 (każdy wiersz Parametry), a liczby w prozie „Start” chroni sekcja 3c.
- NIE ZROBIONE (dług, jawnie): ochrona liczb w prozie innych niż „Start” (progi w tabelach „Progi umów”) — NIE_ZMIERZONO w tym temacie.

## NOWE USTALENIA (nie było w zarzutach r1; znalezione przy weryfikacji)
- **N1 — `szpiegWykryty_zaufanie` (−15) martwy.** Brak zdarzenia `szpieg_wykryty` w `gra/src` poza `diplomacy-factors.ts`; parametr czytany 0 razy poza definicją (`diplomacy.ts:122`). Usunięty z Parametry; w `zaufanie.md` wiersz oznaczony „nie działa”.
- **N2 — zdarzenia zdefiniowane, nie wywoływane w grze:** `pomoc_sojusznikowi` (+10 zaufanie), `wspolny_wrog` (+5 zaufanie / +10 respekt), `zdrada` (−50). Grep po literale poza `diplomacy.ts` / `diplomacy-factors.ts`: brak wywołań. Oznaczone w `zaufanie.md` i `respekt.md`; wiersze w Parametry zostają jako wartość w kodzie.

## NIE_ZMIERZONO (uczciwie)
- Wywołania flag per-turowych `ctx` (dobra wola, wspólny wróg, religia, granica) w `main.ts`: nie sprawdzałem.
- Liczby w `relacja.md`, `moc-podzial.md`, `zmeczenie-wojna.md` poza tym, co pokrywa test: nie weryfikowane ponownie w tej rundzie.
- Dynamika AI i bramek pokoju na żywo: opisana z kodu, nie zmierzona w grze.

---

## TABELA: LICZBA → PLIK:LINIA (wszystkie 148 wierszy Parametry)

| Wartość | Odwołanie | Lokalizacja (plik:linia) | Hasło |
|---:|---|---|---|
| 20 | `diplomacy.json:params.startZaufanie` | `gra/data/diplomacy.json:40` | zaufanie.md |
| 30 | `diplomacy.json:params.progNapZaufanie` | `gra/data/diplomacy.json:50` | zaufanie.md |
| 90 | `diplomacy.json:params.progSojuszZaufanie` | `gra/data/diplomacy.json:32` | zaufanie.md |
| 70 | `diplomacy.json:params.progWymianaTechZaufanie` | `gra/data/diplomacy.json:33` | zaufanie.md |
| 1 | `diplomacy.json:params.handel_zaufanie_perTura` | `gra/data/diplomacy.json:19` | zaufanie.md |
| 3 | `diplomacy.json:params.sojusz_zaufanie_perTura` | `gra/data/diplomacy.json:20` | zaufanie.md |
| 2 | `diplomacy.json:params.nap_zaufanie_perTura` | `gra/data/diplomacy.json:21` | zaufanie.md |
| 1 | `diplomacy.json:params.wspolnyWrog_zaufanie_perTura` | `gra/data/diplomacy.json:25` | zaufanie.md |
| 0.5 | `diplomacy.json:params.wspolnaReligia_zaufanie_perTura` | `gra/data/diplomacy.json:26` | zaufanie.md |
| -0.5 | `diplomacy.json:params.odmiennaReligia_zaufanie_perTura` | `gra/data/diplomacy.json:27` | zaufanie.md |
| -2 | `diplomacy.json:params.ekspansjaGranica_zaufanie_perTura` | `gra/data/diplomacy.json:28` | zaufanie.md |
| -3 | `diplomacy.json:params.ekspansjaGranicaBraz_zaufanie_perTura` | `gra/data/diplomacy.json:29` | zaufanie.md |
| -4 | `diplomacy.json:params.ekspansjaGranicaZelazo_zaufanie_perTura` | `gra/data/diplomacy.json:30` | zaufanie.md |
| -2 | `diplomacy.json:params.urazyHistoryczne_zaufanie_perTura` | `gra/data/diplomacy.json:31` | zaufanie.md |
| 5 | `diplomacy.json:params.karaPrzemarszNieautoryzowany_zaufanie_perTura` | `gra/data/diplomacy.json:84` | zaufanie.md |
| 10 | `diplomacy.json:params.pomocSojusznikowi_zaufanie` | `gra/data/diplomacy.json:4` | zaufanie.md |
| 5 | `diplomacy.json:params.wspolnyWrogNawiazanie_zaufanie` | `gra/data/diplomacy.json:5` | zaufanie.md |
| -40 | `diplomacy.json:params.zlamanaPaktGracz_zaufanie` | `gra/data/diplomacy.json:7` | zaufanie.md |
| -20 | `diplomacy.json:params.zlamanaPaktAI_zaufanie` | `gra/data/diplomacy.json:8` | zaufanie.md |
| -50 | `diplomacy.json:params.zdrada_zaufanie` | `gra/data/diplomacy.json:9` | zaufanie.md |
| -15 | `kod:zerwanie-traktatu` | `gra/src/game/diplomacy.ts:1081` | zaufanie.md |
| 0.03 | `diplomacy.json:params.wiarygodnoscZaufanieDryfNa100` | `gra/data/diplomacy.json:137` | zaufanie.md |
| 1 | `diplomacy.json:params.dobraWola_zaufanie_perTura` | `gra/data/diplomacy.json:24` | zaufanie.md |
| 5 | `diplomacy.json:pn_relacja.max_zaufanie_na_ture` | `gra/data/diplomacy.json:216` | zaufanie.md |
| 30 | `diplomacy.json:params.startRespekt` | `gra/data/diplomacy.json:41` | respekt.md |
| 70 | `diplomacy.json:params.progWasalizacjaRespekt` | `gra/data/diplomacy.json:34` | respekt.md |
| 90 | `diplomacy.json:params.progWchloniecieRespekt` | `gra/data/diplomacy.json:35` | respekt.md |
| 10 | `diplomacy.json:params.trybut_respekt` | `gra/data/diplomacy.json:17` | respekt.md |
| 10 | `diplomacy.json:params.wspolnyWrogAkceptacja_respekt` | `gra/data/diplomacy.json:18` | respekt.md |
| 5 | `diplomacy.json:params.wygraBitwa_respekt` | `gra/data/diplomacy.json:16` | respekt.md |
| 100 | `kod:respekt-wzor` | `gra/src/game/diplomacy.ts:1701` | respekt.md |
| 30 | `kod:etykieta-wrogi` | `gra/src/game/diplomacy-display.ts:338` | relacja.md |
| 45 | `kod:etykieta-nieufny` | `gra/src/game/diplomacy-display.ts:341` | relacja.md |
| 60 | `kod:etykieta-neutralny` | `gra/src/game/diplomacy-display.ts:342` | relacja.md |
| 120 | `kod:etykieta-zyczliwy` | `gra/src/game/diplomacy-display.ts:343` | relacja.md |
| 200 | `kod:relacja-max` | `gra/src/game/diplomacy-display.ts:249` | relacja.md |
| 110 | `diplomacy.json:params.progNapRelacja` | `gra/data/diplomacy.json:49` | relacja.md |
| 30 | `diplomacy.json:params.progNapZaufanie` | `gra/data/diplomacy.json:50` | relacja.md |
| 130 | `diplomacy.json:params.progSojuszRelacja` | `gra/data/diplomacy.json:37` | relacja.md |
| 90 | `diplomacy.json:params.progSojuszZaufanie` | `gra/data/diplomacy.json:32` | relacja.md |
| 151 | `diplomacy.json:params.progNapBezterminowyRelacja` | `gra/data/diplomacy.json:39` | relacja.md |
| 0 | `diplomacy.json:params.progHandelRelacja` | `gra/data/diplomacy.json:51` | relacja.md |
| 100 | `diplomacy.json:handel_zloze.prog_relacja_min` | `gra/data/diplomacy.json:144` | relacja.md |
| 2.5 | `power-params.json:skladniki.jednostka_wojskowa.pkt` | `gra/data/power-params.json:31` | moc-podzial.md |
| 10 | `power-params.json:skladniki.rekrut_ekw_jednostki.pkt` | `gra/data/power-params.json:44` | moc-podzial.md |
| 2 | `kod:power-bitwy-coeff` | `gra/src/game/power-objective.ts:229` | moc-podzial.md |
| 5 | `power-params.json:skladniki.ludek.pkt` | `gra/data/power-params.json:40` | moc-podzial.md |
| 50 | `power-params.json:skladniki.miasto.pkt` | `gra/data/power-params.json:49` | moc-podzial.md |
| 1 | `power-params.json:skladniki.heks_terytorium.pkt` | `gra/data/power-params.json:53` | moc-podzial.md |
| 5 | `power-params.json:skladniki.budynki.pkt` | `gra/data/power-params.json:57` | moc-podzial.md |
| 80 | `power-params.json:skladniki.tech_zbadane.pkt` | `gra/data/power-params.json:61` | moc-podzial.md |
| 5 | `power-params.json:skladniki.ulepszenie_terenu.pkt` | `gra/data/power-params.json:65` | moc-podzial.md |
| 0.5 | `power-params.json:skladniki.kultura_imperium.pkt` | `gra/data/power-params.json:69` | moc-podzial.md |
| 25 | `power-params.json:skladniki.religia_jednosc.pkt` | `gra/data/power-params.json:73` | moc-podzial.md |
| 2 | `kod:power-zdobycze-coeff` | `gra/src/game/power-objective.ts:257` | moc-podzial.md |
| 1 | `power-params.json:mnoznikEpoki.1` | `gra/data/power-params.json:18` | moc-podzial.md |
| 200 | `war-weariness-params.json:zmeczenie.pelneTur` | `gra/data/war-weariness-params.json:5` | zmeczenie-wojna.md |
| 0.03 | `war-weariness-params.json:zmeczenie.wagaStratMiasta` | `gra/data/war-weariness-params.json:6` | zmeczenie-wojna.md |
| 30 | `war-weariness-params.json:zmeczenie.stagnacjaOdTur` | `gra/data/war-weariness-params.json:7` | zmeczenie-wojna.md |
| 0.3 | `war-weariness-params.json:zmeczenie.stagnacjaWaga` | `gra/data/war-weariness-params.json:8` | zmeczenie-wojna.md |
| 100 | `war-weariness-params.json:zmeczenie.stagnacjaSkalaTur` | `gra/data/war-weariness-params.json:9` | zmeczenie-wojna.md |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` | `gra/data/war-weariness-params.json:10` | zmeczenie-wojna.md |
| 0.8 | `war-weariness-params.json:zmeczenie.progWzajemnyPokoj` | `gra/data/war-weariness-params.json:11` | zmeczenie-wojna.md |
| 0.45 | `war-weariness-params.json:przegrywajacy.udzialWyraznie` | `gra/data/war-weariness-params.json:15` | zmeczenie-wojna.md |
| 0.5 | `war-weariness-params.json:przegrywajacy.wagaZmeczenia` | `gra/data/war-weariness-params.json:16` | zmeczenie-wojna.md |
| 0.5 | `war-weariness-params.json:przegrywajacy.wagaSily` | `gra/data/war-weariness-params.json:17` | zmeczenie-wojna.md |
| 0.3 | `war-weariness-params.json:przegrywajacy.wagaStrat` | `gra/data/war-weariness-params.json:18` | zmeczenie-wojna.md |
| 3 | `war-weariness-params.json:przegrywajacy.stratyNasycenie` | `gra/data/war-weariness-params.json:19` | zmeczenie-wojna.md |
| 0.25 | `war-weariness-params.json:przegrywajacy.progiStopni.0` | `gra/data/war-weariness-params.json:BRAK` | zmeczenie-wojna.md |
| 0.45 | `war-weariness-params.json:przegrywajacy.progiStopni.1` | `gra/data/war-weariness-params.json:BRAK` | zmeczenie-wojna.md |
| 0.65 | `war-weariness-params.json:przegrywajacy.progiStopni.2` | `gra/data/war-weariness-params.json:BRAK` | zmeczenie-wojna.md |
| 2 | `war-weariness-params.json:przegrywajacy.maxMiastNaPokoj` | `gra/data/war-weariness-params.json:23` | zmeczenie-wojna.md |
| 3 | `war-weariness-params.json:przegrywajacy.minMiastPoOddaniu` | `gra/data/war-weariness-params.json:24` | zmeczenie-wojna.md |
| 0.2 | `war-weariness-params.json:przegrywajacy.mnoznikNaOdrzucenie` | `gra/data/war-weariness-params.json:22` | zmeczenie-wojna.md |
| 3 | `war-weariness-params.json:przegrywajacy.cooldownOfertTur` | `gra/data/war-weariness-params.json:25` | zmeczenie-wojna.md |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaMaxMiast` | `gra/data/war-weariness-params.json:31` | zmeczenie-wojna.md |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaUtratyWojny` | `gra/data/war-weariness-params.json:32` | zmeczenie-wojna.md |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` | `gra/data/war-weariness-params.json:35` | zmeczenie-wojna.md |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` | `gra/data/war-weariness-params.json:36` | zmeczenie-wojna.md |
| 0.6 | `war-weariness-params.json:czlowiek.rabatCenyPokojuMax` | `gra/data/war-weariness-params.json:43` | zmeczenie-wojna.md |
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.baza` | `gra/data/diplomacy-war-peace-params.json:5` | wypowiedzenie-wojny.md |
| 5 | `diplomacy-war-peace-params.json:progWojnyRelacji.wagaProgWojny` | `gra/data/diplomacy-war-peace-params.json:6` | wypowiedzenie-wojny.md |
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.min` | `gra/data/diplomacy-war-peace-params.json:11` | wypowiedzenie-wojny.md |
| 70 | `diplomacy-war-peace-params.json:progWojnyRelacji.max` | `gra/data/diplomacy-war-peace-params.json:12` | wypowiedzenie-wojny.md |
| 30 | `diplomacy-war-peace-params.json:progWojnyRelacji.bazaBrakDanych` | `gra/data/diplomacy-war-peace-params.json:13` | wypowiedzenie-wojny.md |
| 15 | `diplomacy-war-peace-params.json:hamulecRelacji.progKryzysuMinusPunkty` | `gra/data/diplomacy-war-peace-params.json:96` | wypowiedzenie-wojny.md |
| 0.6 | `kod:ai-prog-wojna-sila` | `gra/src/game/ai.ts:6229` | wypowiedzenie-wojny.md |
| 0.5 | `kod:ai-prog-wojna-agresja` | `gra/src/game/ai.ts:6235` | wypowiedzenie-wojny.md |
| 25 | `kod:ai-early-no-war-turns` | `gra/src/game/ai.ts:6287` | wypowiedzenie-wojny.md |
| 8 | `diplomacy-war-peace-params.json:hamulecRelacji.bazaN` | `gra/data/diplomacy-war-peace-params.json:97` | wypowiedzenie-wojny.md |
| 3 | `diplomacy-war-peace-params.json:hamulecRelacji.minN` | `gra/data/diplomacy-war-peace-params.json:99` | wypowiedzenie-wojny.md |
| 7 | `diplomacy-war-peace-params.json:hamulecRelacji.maxN` | `gra/data/diplomacy-war-peace-params.json:100` | wypowiedzenie-wojny.md |
| 40 | `war-rules-params.json:delayInterCivWarsUntilTurn` | `gra/data/war-rules-params.json:3` | wypowiedzenie-wojny.md |
| 1 | `war-rules-params.json:maxConcurrentWarsStone` | `gra/data/war-rules-params.json:7` | wypowiedzenie-wojny.md |
| 1 | `war-rules-params.json:maxEraForcedWarsPerCivPerEra` | `gra/data/war-rules-params.json:10` | wypowiedzenie-wojny.md |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` | `gra/data/diplomacy.json:100` | wypowiedzenie-wojny.md |
| 1 | `diplomacy.json:params.wiarygodnoscN1KarencjaTur` | `gra/data/diplomacy.json:101` | wypowiedzenie-wojny.md |
| 5 | `kod:truce-option-min` | `gra/src/game/diplomacy-peace-lock.ts:68` | rozejm-pokoj.md |
| 15 | `kod:truce-option-max` | `gra/src/game/diplomacy-peace-lock.ts:68` | rozejm-pokoj.md |
| 10 | `kod:truce-default` | `gra/src/game/diplomacy-peace-lock.ts:71` | rozejm-pokoj.md |
| 1 | `kod:truce-ai-fatigue` | `gra/src/game/diplomacy-peace-lock.ts:125` | rozejm-pokoj.md |
| 0.7 | `kod:truce-ai-willingness` | `gra/src/game/diplomacy-peace-lock.ts:132` | rozejm-pokoj.md |
| 60 | `kod:truce-ai-trust` | `gra/src/game/diplomacy-peace-lock.ts:135` | rozejm-pokoj.md |
| 0.20 | `diplomacy-war-peace-params.json:przewagaMilitarna.prog` | `gra/data/diplomacy-war-peace-params.json:91` | rozejm-pokoj.md |
| 0 | `diplomacy-war-peace-params.json:pokojAiAi.minBilansPW` | `gra/data/diplomacy-war-peace-params.json:104` | rozejm-pokoj.md |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` | `gra/data/war-weariness-params.json:35` | rozejm-pokoj.md |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` | `gra/data/war-weariness-params.json:36` | rozejm-pokoj.md |
| 20 | `diplomacy-war-peace-params.json:cenaPokoju.turyBezOgraniczenAi` | `gra/data/diplomacy-war-peace-params.json:87` | rozejm-pokoj.md |
| 5 | `diplomacy-war-peace-params.json:minTurWojny.baza` | `gra/data/diplomacy-war-peace-params.json:46` | rozejm-pokoj.md |
| 1 | `diplomacy-war-peace-params.json:minTurWojny.min` | `gra/data/diplomacy-war-peace-params.json:52` | rozejm-pokoj.md |
| 8 | `diplomacy-war-peace-params.json:minTurWojny.max` | `gra/data/diplomacy-war-peace-params.json:53` | rozejm-pokoj.md |
| 0.55 | `diplomacy-war-peace-params.json:cenaPokoju.odrzucenieRwProg` | `gra/data/diplomacy-war-peace-params.json:74` | rozejm-pokoj.md |
| 10 | `diplomacy-war-peace-params.json:cenaPokoju.odrzucenieMaxTurWojny` | `gra/data/diplomacy-war-peace-params.json:75` | rozejm-pokoj.md |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` | `gra/data/war-weariness-params.json:10` | rozejm-pokoj.md |
| -100 | `diplomacy.json:params.wiarygodnoscSkalaMin` | `gra/data/diplomacy.json:93` | wiarygodnosc.md |
| 100 | `diplomacy.json:params.wiarygodnoscSkalaMax` | `gra/data/diplomacy.json:94` | wiarygodnosc.md |
| 40 | `diplomacy.json:params.wiarygodnoscProgWzorCnoty` | `gra/data/diplomacy.json:95` | wiarygodnosc.md |
| -40 | `diplomacy.json:params.wiarygodnoscProgWiarolomny` | `gra/data/diplomacy.json:96` | wiarygodnosc.md |
| 40 | `diplomacy.json:params.wiarygodnoscStartLatwy` | `gra/data/diplomacy.json:97` | wiarygodnosc.md |
| 20 | `diplomacy.json:params.wiarygodnoscStartNormalny` | `gra/data/diplomacy.json:98` | wiarygodnosc.md |
| 0 | `diplomacy.json:params.wiarygodnoscStartTrudny` | `gra/data/diplomacy.json:99` | wiarygodnosc.md |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` | `gra/data/diplomacy.json:100` | wiarygodnosc.md |
| -18 | `diplomacy.json:params.wiarygodnoscN2ZlamaniePaktuNap` | `gra/data/diplomacy.json:102` | wiarygodnosc.md |
| -25 | `diplomacy.json:params.wiarygodnoscN2ZlamaniePaktuSojusz` | `gra/data/diplomacy.json:103` | wiarygodnosc.md |
| -12 | `diplomacy.json:params.wiarygodnoscN3AtakWOknieKarencji` | `gra/data/diplomacy.json:104` | wiarygodnosc.md |
| -15 | `diplomacy.json:params.wiarygodnoscN4OdmowaObowiazkuSojuszu` | `gra/data/diplomacy.json:106` | wiarygodnosc.md |
| -6 | `diplomacy.json:params.wiarygodnoscN5ZerwanieTraktatCzasowy` | `gra/data/diplomacy.json:107` | wiarygodnosc.md |
| -4 | `diplomacy.json:params.wiarygodnoscN5ZerwanieHandelCzasowy` | `gra/data/diplomacy.json:108` | wiarygodnosc.md |
| -2 | `diplomacy.json:params.wiarygodnoscN6NiedotrzymanieHandluCyklicznego` | `gra/data/diplomacy.json:109` | wiarygodnosc.md |
| -2 | `diplomacy.json:params.wiarygodnoscN7NieautoryzowanyPrzemarsz` | `gra/data/diplomacy.json:111` | wiarygodnosc.md |
| 10 | `diplomacy.json:params.wiarygodnoscP1FiniszSojusz` | `gra/data/diplomacy.json:121` | wiarygodnosc.md |
| 5 | `diplomacy.json:params.wiarygodnoscP2FiniszNap` | `gra/data/diplomacy.json:122` | wiarygodnosc.md |
| 5 | `diplomacy.json:params.wiarygodnoscP2FiniszHandel` | `gra/data/diplomacy.json:123` | wiarygodnosc.md |
| 1 | `diplomacy.json:params.wiarygodnoscP3FiniszHandelCykliczny` | `gra/data/diplomacy.json:124` | wiarygodnosc.md |
| 3 | `diplomacy.json:params.wiarygodnoscP4BezWojny30Tur` | `gra/data/diplomacy.json:125` | wiarygodnosc.md |
| 20 | `diplomacy.json:params.wiarygodnoscP5PomocSojusznikowi` | `gra/data/diplomacy.json:127` | wiarygodnosc.md |
| 0.03 | `diplomacy.json:params.wiarygodnoscZaufanieDryfNa100` | `gra/data/diplomacy.json:137` | wiarygodnosc.md |
| 0 | `diplomacy.json:params.wiarygodnoscProgSojuszMin` | `gra/data/diplomacy.json:138` | wiarygodnosc.md |
| 0 | `diplomacy.json:params.wiarygodnoscProgNapMin` | `gra/data/diplomacy.json:139` | wiarygodnosc.md |
| 0.1 | `diplomacy.json:params.wiarygodnoscTrwalaPodlogaProcent` | `gra/data/diplomacy.json:134` | wiarygodnosc.md |
| 1 | `diplomacy.json:params.wiarygodnoscS1SojuszPerTure` | `gra/data/diplomacy.json:113` | wiarygodnosc.md |
| 0.5 | `diplomacy.json:params.wiarygodnoscS2NapPerTure` | `gra/data/diplomacy.json:114` | wiarygodnosc.md |
| 0.9 | `diplomacy.json:params.wiarygodnoscS3HandelPerTureNormalny` | `gra/data/diplomacy.json:116` | wiarygodnosc.md |
| 0.6 | `diplomacy.json:params.wiarygodnoscS4PrzemarszPerTureNormalny` | `gra/data/diplomacy.json:119` | wiarygodnosc.md |
| 0.5 | `diplomacy.json:params.wiarygodnoscTempoAmplituda` | `gra/data/diplomacy.json:136` | wiarygodnosc.md |
| 80 | `diplomacy.json:params.wiarygodnoscCzasZapomnieniaKaraNormalny` | `gra/data/diplomacy.json:129` | wiarygodnosc.md |
| 80 | `diplomacy.json:params.wiarygodnoscCzasZapomnieniaNagrodaNormalny` | `gra/data/diplomacy.json:132` | wiarygodnosc.md |
| 5 | `diplomacy.json:pn_relacja.max_zaufanie_na_ture` | `gra/data/diplomacy.json:216` | wiarygodnosc.md |
