STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza; zero zmian w gra/src, gra/data, testach)
TEMAT: R-WEB-DIPLO-WAR-TEMPER-SETTING-NEGATIVE-PARAMS-LIST-Q1
GOAL: lista parametrów ujemnych i dodatnich dyplomacji per poziom ustawienia "Dyplomacja i wojna" (ŁATWA x1 / NORMALNA kary x2, bonusy /2 / TRUDNA kary x3, bonusy /3)
ZMIANY/COMMIT: poprawki w tej samej rundzie; pliki: dyspozycje/analizy/NASTAWIENIE-SWIATA-PARAMETRY-UJEMNE.md, dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-TEMPER-SETTING-NEGATIVE-PARAMS-LIST-Q1/30-obrona-claude.md. SHA: patrz pole sha w StructuredOutput.
TESTY: NIE URUCHOMIONO (dokument; brak zmian kodu). Weryfikacja: grep/sed/cat na kandydacie cc86623628 — wyniki w odpowiedziach poniżej.
BLOKADY: brak. NIE ZMIERZONO: wpływ mnożników na rozgrywkę i liczbę sojuszy AI↔AI.
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Final Control (Sonnet)
DEPLOY/PUSH: NIE WYKONANO

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. Dodano §3.2a: `pokoj` dZ +5 (diplomacy.ts:939–940), `trybut_oferta_przyjeta` +5 (:1051–1053), `wymiana_tech_gratis` +5 (:1056–1058); ÷2 = 2,5, ÷3 = 1,67; wymagany ten sam argument przepięcia co kary.
2. PRZYJMUJĘ. Dodano §3.6: p7 wymianaZaufanieNaKrok 0,5 (÷2 0,25 / ÷3 0,17), wymianaMaxPerTura 5 (2,5 / 1,67) — DZIELIĆ; wymianaSufitZaufania 60 — NIE dzielić (sufit, diplomacy-tick-war-brake.ts:88); progi PN i czas — NIE mnożyć (§2.6).
3. PRZYJMUJĘ. Dodano do §2.6: war-weariness (wagaZmeczenia 0,5, wagaSily 0,5, wagaStrat 0,3, tolerancjaZmeczenia 0,5, wagaStratMiasta 0,1) — wagi desperacji AI o pokoju, nie kary; NIE mnożyć; osobna decyzja ABC nr 8. Progi i czas z tego pliku w §2.6.
4. PRZYJMUJĘ (uzupełnione). §5.7: zeroZaufaniaAktywna (false, tylko dane/testy; jedyny parametr liczbowy zeroZaufaniaProgTur 5 = czas; efekt w kodzie NIE ZWERYFIKOWANO); koalicjaAntyLiderAktywna (false; kary z zerwanie_relacja/zaufanie już w §2.4; liderProgPrzewagi 1,5 = próg). Przy obu OFF brak kumulacji.
5. PRZYJMUJĘ. Klamra granicaMax: spójnie „działa tylko przy flagach ON” (harderPairDeltas wołane wyłącznie przy ON). Tabela §2.1 poprawiona na „klamra −6 → −12 / −18 (mnożnik PO klamrze)”, zgodnie z §5.1. ABC 5(a) poprawione z „flaga OFF”. Wiersz AI przemianowany na `ekspansja_heurystyka_granica_kara` (ai-params.json:428, użycie ai.ts:1478).
6. PRZYJMUJĘ i ZWERYFIKOWANO. progSojuszKaraAllySkok: diplomacy.ts:248 → allyWPenalty (:729) → allyW = clamp(allyW − adj.allyWPenalty, 0, 1) (:1434), w funkcji od l.1290. cityStateDifficultyOverride: odczyt raw w newGameFlow.ts:416–421, domyślna :280, użycie :1773–1775; zapis do SaveGame NIE ZWERYFIKOWANO.
7. ODRZUCAM (z dowodem arytmetycznym, §5.8). min(N/(100k), 5/k) = (1/k)·min(N/100, 5): oba limity są ÷k względem bazy, więc łącznie ÷k, NIE ÷k² ani ÷9. Przykład Trudna N=1000: baza 5, po zmianie 1,67 = 5/3. Dodano zalecenie: zmieniać oba parametry jednakowo. Oszacowanie sojuszy AI↔AI dla Normalnej dodane w §5.9 (wyliczenie arytmetyczne, NIE ZMIERZONO).

ZMIANY W DOKUMENCIE (skrót)
- §2.1 wiersze granicaMax i ai_city (naprawa nazwy i wartości klamry)
- §2.6 nowe wiersze: war-weariness (wagi, progi, czas), tick p7 (progi PN, czas)
- §3.2a (nowa): bonusy sztywne w kodzie
- §3.6 (nowa): p7 bonus wymiany
- §5.7, §5.8, §5.9 (nowe)
- §7 ABC 8 (nowe); ABC 5(a) poprawione
- §8 weryfikacja: 2 pozycje zmienione z NIE ZWERYFIKOWANO na ZWERYFIKOWANO (częściowo)

UWAGI-DLA-ORKIESTRATORA
- Komentarz w diplomacy-tick-params.json mówi, że bonus p7 jest domyślnie aktywny (DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true wg komentarza), a pole flagaDomyslna = false nie jest czytane. Nie zweryfikowano w kodzie diplomacy-tick-war-brake.ts:7 poza odczytem komentarza.
- Zarzut 4 rozszerzony tylko w zakresie wartości z danych; efekt zeroZaufania w kodzie wymaga osobnego przeglądu.
