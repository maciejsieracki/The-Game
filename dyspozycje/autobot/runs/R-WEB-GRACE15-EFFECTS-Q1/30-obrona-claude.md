STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (tag GRACE15FX), runda 2 — obrona Operatora
GOAL: zmierzyć na maksimum skutki okna łaski 15 tur (FALA 935) na AI (t30/t60), przeżycie gracza po oknie i rozbieżności tekstów; w tej rundzie: odpowiedzieć na zarzuty 1–7 Evaluatora. Zero zmian gra/src.

ZMIANY/COMMIT:
- Nowe narzędzie (allowlista gra/tools/grace15fx-*.cjs): gra/tools/grace15fx-active-live.cjs — kopia realdef-econ-live.cjs na mapie Standardowej (1 rywal, 15 typów cywilizacji, 1 miasto-państwo), polityki p1 (zakup obrońcy klikiem) i p2 (zakup + suwak Handlu 100% Pieniądz). Tylko klik w UI, bez haków zmieniających stan.
- Dokument zaktualizowany: dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md (poprawiony §0, §2, §3, §4, §5; nowy §2.2 z tabelą aktywnego gracza t1–16).
- Dane: dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/aktywny/ (econ-active.jsonl.gz, econ-p1-s4242-r1.txt, econ-p2-s7-r1.txt, zestawienie-active.txt).
- Ten raport: dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/30-obrona-claude.md.
- Commit: patrz pole sha w StructuredOutput (czubek gałęzi po commicie tej rundy).
- gra/src: diff = 0 (zweryfikowane `git diff -- gra/src | wc -l` = 0).

ODPOWIEDZI NA ZARZUTY:
1. (tabela aktywnego gracza t1–30, binarne) PRZYJMUJĘ — wykonano częściowo. Zbudowano klikany bieg (p1/p2), 2 ziarna (4242, 7), tury 1–16. Wynik: w OBU biegach bramka tury zatrzymuje koniec t16 (przyczyna: Spichlerz/żywność, nie skarbiec). Tabela t16 wprowadzona do dokumentu §2.2. Kryterium binarne "tabela t1–30" NIE SPEŁNIONE: t17–30 NIE ZMIERZONO (patrz BLOKADY).
   Dodatkowe ustalenia: na ziarnie 4242 drewna = 0 w t1–16, więc żaden obrońca nie jest kupowalny (dispatch założył, że drewno jest na obu ziarnach — FAŁSZYWE dla 4242).
2. (dokument §2/§5: "skarbiec wyzerowuje się w t42/t48 i miasto znika (bankructwo)", "przeżywa 26–32 tury") PRZYJMUJĘ, poprawiono. Dane (JSONL, rekord tury N = stan po dosypce tury N):
   - B-s4242: na końcu tury 41 skarbiec 81 Pn (drenaż −14 pokryty), miasto utracone; rekord t42 = 0. Utrata miasta NIE jest bankructwem — przyczyna NIE ROZSTRZYGNIĘTA.
   - B-s7: na końcu tury 47 skarbiec 3 Pn, drenaż −14 Pn; sekwencja zgodna z bankructwem, ale regułę utraty miasta w danych nie potwierdzono. Dosypka z tury 48 po utracie miasta (w poprzedniej wersji dokumentu mylnie uznana za dowód).
   - "Przeżycie 26–32 tury" było artefaktem dosypek (patrz 3).
3. (druga dosypka +200 w t33 pominięta) PRZYJMUJĘ — dodano do §0 i §2.1. Liczba dosypek: B-s4242 = 2 (t17, t33); B-s7 = 3 (t18, t33, t48; t48 po utracie miasta). Każda dosypka = +200 złota ORAZ +200 żywności (poprzednia wersja pisała tylko o złocie). Bez dosypek pasywny gracz nie przechodzi tury (bramka blokuje koniec tury w t17 i t33); arytmetyka skarbca (B-s4242: 7 Pn w t32 przy −14/turę) pokazuje, że bez zasilenia skarbiec schodzi poniżej zera około t33 — jako arytmetyka, NIE zmierzone.
4. (barbarzyńcy po t16 i pierwszy atak na gracza/AI; brak logu gry) PRZYJMUJĘ częściowo. Dane: `foreignNear` (obce jednostki w pobliżu miasta gracza) w turach 1–16 obu biegów aktywnych = 0 w każdej turze (bezpośredni odczyt). Po t16: NIE ZMIERZONO (bieg zatrzymuje się w t16). Log zdarzeń barbarzyńców: NIE ZMIERZONO (harness nie zapisuje logu gry). Przyczyna utraty miasta pasywnego gracza: NIE ROZSTRZYGNIĘTA.
5. (poziom barbarzyńców 'trudny' niepotwierdzony readbackiem) PRZYJMUJĘ — NIE ZWERYFIKOWANO. Readback `__settingsLive.getSettings` nie zawiera pola barbarzyńców (zwraca diplomacyWarLevel, kulturaReligiaLevel, kulturaReligiaLevelAI, wzrostSurowcowZEpoka, kosztJednostekPace, difficulty). Odczyt wymagałby hooka tylko-odczyt w gra/src/main.ts — poza zakresem tego tematu; zgłoszone orkiestratorowi (UWAGI). Pośredni dowód (nie odczyt): ten sam kod, barbarzyńcy trudny vs normalny dają różne liczby pustych miast AI (§1).
6. (n=2, łączenie trzech reguł okna naraz) PRZYJMUJĘ — dodano w §1 punkt 1 i §4: różnica A/B nie jest przypisywalna jednej regule; moc wniosku o wpływie okna niska.
7. (pkt 3 teksty: tylko grep wiki, brak tooltipów utrzymania i komunikatu bramki w UI) PRZYJMUJĘ częściowo. Dodano odczytany live komunikat bramki (Spichlerz/żywność — sprzeczny z założeniem "bramka skarbca"; pozycja 8 w §3). Tooltipy utrzymania: NIE PRZEGLĄDNIĘTO (znaleziono tylko sekcję „Koszty i utrzymanie” w unitInfoCard.ts, jej treści nie czytano). Lista rozbieżności §3 pozostaje kompletna tylko dla wiki.

TESTY:
- Bramki (wyniki z surowego wyjścia, runda 2):
  - npx tsc --noEmit (gra/): exit 0.
  - node tools/logic-test.cjs: "LOGIC OK (213/213)".
  - node tools/ai-test.cjs: "ai-test: 297 passed, 0 failed".
  - node tools/early-grace-15-test.cjs: "early-grace-15-test: 33 passed, 0 failed".
  - node --check tools/grace15fx-active-live.cjs: OK.
  - gra/src diff = 0.
- Pomiar aktywny (maksimum: Trudny, dyplomacja trudna, kultura trudny, koszty wysoki, barbarzyńcy trudny, Standardowy, 1 rywal, 15 typów, 1 miasto-państwo; bez dosypek):
  - p1 ziarno 4242: zakup NIEMOŻLIWY (drewno 0 w t1–16); skarbiec t16 31; BLOKADA t16 (Spichlerz/żywność, prognoza żywności −16 przed autokorektą); zatrzymanie w t16.
  - p2 ziarno 7: zakup Łucznika klikiem w t5 (12 Pn, drewno 16); suwak Handlu 100% Pieniądz w t1 (prognoza skarbu +2 → +5/turę); skarbiec t16 68; BLOKADA t16 (Spichlerz/żywność, −30/turę); zatrzymanie w t16.
- Pomiar AI (runda 1, bez zmian, §1): A/B/Akn jak w dokumencie; dane w dane/.
- Dane wejściowe rundy 2 (dane/aktywny) — zestawienie-active.txt.

BLOKADY:
- Tabela aktywnego gracza t17–30: NIE ZMIERZONO. Przyczyna: blokada tury w t16 (żywność) zatrzymuje bieg; harness nie klika kontrolek racji żywności ani rozwiązania jednostek, których komunikat bramki używa jako dźwigni (+12 żywności/turę; +16). Wymaga osobnego tematu (klik racji/rozwiązania jednostki w UI, ten sam maksymalny poziom).
- Kryterium binarne z dispatchu (tabela t1–30 z ≥2 ziaren) NIE SPEŁNIONE w tej rundzie.
- Przyczyna utraty miasta pasywnego gracza (B-s4242 t41→42, B-s7 t47→48): NIE ROZSTRZYGNIĘTA; brak zapisu zdarzeń w danych.
- Odczyt ustawienia barbarzyńców w grze: NIE ZWERYFIKOWANO (wymaga hooka tylko-odczyt w gra/src — poza zakresem).
- Tooltipy utrzymania i komunikat bramki w UI (pełny przegląd): NIE PRZEGLĄDNIĘTO.
- Ziarno 778899 i 42: nie uruchamiano.

RUNDY: 2/5 (runda 1: 10-operator-claude.md; runda 2: ten raport, odpowiedź na zarzuty 1–7).

NASTĘPNY KROK:
- Orkiestrator: Evaluator ponownie na 30-obrona-claude.md. Jeśli Evaluator wymaga kryterium t1–30, potrzebny jest nowy temat: klik racji żywności / rozwiązania jednostki w panelu miasta w turze blokady (na tej samej konfiguracji maksimum), pomiar do t30 na 2 ziarnach — oraz decyzja właściciela (pytanie ABC: co dalej po t16, czy wiki/komunikat mają opisać okno łaski i to, że pierwszym wąskim gardłem jest żywność).
- Pytanie ABC NIE zadawane przez Operatora (zgodnie z zasadą: subagent nie pyta właściciela).

UWAGI-DLA-ORKIESTRATORA (znaleziska poza zakresem; nic nie utworzono, bez spawn_task):
1. Harness gra: w grze blokadę tury w t16 wywołuje Spichlerz (żywność), a nie skarbiec. Założenie dispatchu „bramka skarbca” jest błędne dla tego ustawienia; komunikat gry sam to pokazuje.
2. Hook `__settingsLive.getSettings()` nie zwraca `barbariansLevel` — readback poziomu barbarzyńców niemożliwy bez zmiany w gra/src (read-only hook); do decyzji orkiestratora.
3. Ziarno 4242 w Standardowej mapie ma zerowe drewno w pobliżu startu (zakup obrońcy niemożliwy w t1–16) — warto to uwzględnić przy doborze ziaren dla tematów obrony.
4. Harness `grace15fx-run.cjs` (poprzedni runner, także `realdef-econ-live.cjs`) zatrzymuje się na bramce tury; bez ścieżki kliku racji/rozwiązania nie da się zmierzyć t17+ dla gracza aktywnego.
5. Rozbieżność wiki (dokument §3, pkt 1–7) nadal do decyzji właściciela; nic nie poprawiano.

DEPLOY/PUSH: NIE WYKONANO
