STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/instrumentacja; bez zmian w gra/src i gra/data)
TEMAT: R-WEB-ALLIANCE-REMOVAL-PATH-Q1
GOAL: ustalić, którą ścieżką znikają sojusze AI↔AI (umowy 1–13 i 1–19 w turze 66, seed 4242); lista ścieżek usuwania z plik:linia; log utrat; klasyfikacja. Obrona rundy 1: zarzuty 1–6 odpowiedziane (PRZYJĘTE/ODRZUCONE z dowodem).
ZMIANY-COMMIT: pliki nowe: dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md; runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/30-obrona-claude.md; runs/.../runner-hook-AA.diff; runs/.../dane/ (seed4242-harder0-base8f7b4981.jsonl.gz, seed4242-harder0.alliance-log.txt, seed4242-harder0.run.log, seed4242-harder0.summary.json, vite-build.log, SHA256SUMS.txt). Kod gry: brak zmian w repo (gra/ w kandydacie 4ba7b5d38 identyczne z 8f7b4981f). SHA czubka: w polu sha.
TESTY:
- tsc --noEmit (kopia kandydata 4ba7b5d38 z gra/ poza repo, npm ci --ignore-scripts): exit 0.
- logic-test.cjs (ta sama kopia): LOGIC OK (213/213).
- ai-test.cjs (ta sama kopia): ai-test: 297 passed, 0 failed.
- Bieg instrumentowany: seed 4242, --harder 0, ciągły (resumed:false), tury 2–67, rows 66, wallSec 547. Log: 96 wpisów [AA-REMOVE] (hak działa).
- Wynik: pary AI 1-13 i AI 1-19 NIE zawarły sojuszu (brak sojusz_aiai_1_13/1_19 w logu) -> zdarzenie z ALLY66 nie odtworzone. W t62–66 brak utraty sojuszu AI 1. Jedyny sojusz AI 1 w biegu: sojusz_aiai_1_16_t30, usunięty t55 przez odmowa-sojuszu-finalize (poza oknem).
- Umowy AI 1 w t60–67: wyłącznie umowa_szlakow kończące termin (expireTreaties) i eliminateOwner 1-26 t66 (umowa szlakow).
BLOKADY:
- Zdarzenie ALLY66 (1-13 t40 / 1-19 t58) nie wystąpiło na bazie 8f7b4981f: ścieżka dla tych par = NIE ZMIERZONO (brak zdarzenia).
- Nie zweryfikowano różnicy kodu między bazą ALLY66 (b610e71a wg dispatchu) a 8f7b4981f; logi ALLY66 nie zawierają SHA.
- Wzorzec podmiany sojuszu (1-13 t33->t40, 1-19 t33->t58 w logu ALLY66) nie do odtworzenia na tym biegu; hipoteza (wygaśnięcie terminu sojusz_pelny + ponowne podpisanie) niezweryfikowana.
- Pytanie ABC #103 (status 'sojusz' po zniknięciu umowy): opisane w analizie, NIE zadane (zgodnie z dispatchem).
- Stary bieg seed4242-harder1 (dane/) nie jest dowodem dla wniosku.
RUNDY: 2/5 (runda 1: 10-operator-claude.md; ta runda: obrona 30-obrona-claude.md)
ODPOWIEDZI NA ZARZUTY:
1. (hak martwy) PRZYJĘTE i naprawione: runner-hook-AA.diff dopisuje wiersze [AA- do <TAG>.alliance-log.txt; patch gry w runs/.../instrumentacja-AA-REMOVE.patch (poprzednia runda: hak tylko w ai-economy). Dowód: 96 wpisów [AA-REMOVE] w dane/seed4242-harder0.alliance-log.txt.
2. (brak logu utrat AI 1 t62–66 z klasyfikacją) PRZYJĘTE: bieg powtórzony z hakiem; zdarzenie nie wystąpiło; klasyfikacja = NIE ZMIERZONO dla ALLY66 (nie 'zgodne z regułą'). Analiza sekcja 'Wyniki biegu'.
3. (harder 1 zamiast 0; segmentacja) PRZYJĘTE: ten bieg harder 0, ciągły, resumed:false (summary.json). Stary harder1 pozostawiony jako artefakt, nieużywany w wniosku.
4. (wzorzec podmiany sojuszu niezbadany) PRZYJĘTE jako NIE ZBADANE: w tym biegu pary nie tworzą sojuszu; hipoteza wpisana jako niezweryfikowana w analizie.
5. (SHA256SUMS niezgodne) PRZYJĘTE: SHA256SUMS.txt przeliczony dla plików obecnych w dane/; 'sha256sum -c' -> wszystkie OK (7/7).
6. (bramki logic/ai-test nie uruchomione) PRZYJĘTE: uruchomione na kandydacie, wyniki w TESTY (tsc 0; 213/213; 297/0).
NASTĘPNY KROK: (a) orkiestrator decyduje, czy powtórzyć bieg na bazie ALLY66 (b610e71a, jeśli dostępna) albo na 8f7b4981f z innym ziarnem, by złapać zdarzenie utraty sojuszu; (b) pytanie ABC #103 — orkiestrator (nie zadawane tutaj).
DEPLOY/PUSH: NIE WYKONANO
