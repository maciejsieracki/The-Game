STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-7-SETTINGS-VALIDATION-Q1
GOAL: Ustawienia gry i walidacja wyboru przed startem, żywy Chromium, pin main=edb8fb56.
RUNDY: 1/5 (4 zarzuty — błędne numery linii w raporcie bo cytowane z checkoutu sesji zamiast pinu,
2 mylące nazwy plików zrzutów, 3 zrzuty bajtowo identyczne z poprzednimi tematami — Obrona
skorygowała linie na pin i dodała adnotacje, Final Control ODDAL po weryfikacji)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-7-SETTINGS-VALIDATION.md`, 11 zrzutów.

Opisane opcje: Ustawienia (muzyka/efekty/język), kreator nowej gry (epoka→cywilizacja→ustawienia,
hot-seat). **Kluczowe znalezisko:** stan błędu walidacji NIE jest osiągalny w normalnym UI —
cywilizacja jest auto-wybierana, a przycisk start jest aktywny jeszcze przed świadomym wyborem gracza.
To świadomy projekt UI (brak twardej walidacji "musisz wybrać"), nie błąd — ważne dla P6/P2 (port nie
musi odtwarzać stanu błędu, którego oryginał nie ma).

3 zrzuty bajtowo identyczne z P1.3/P1.4/P1.5 (deterministyczny render tego samego stanu/pinu/viewportu
— potwierdzone, nie fałszerstwo).

BLOKADY: brak. 404 w konsoli odłożone do P1.16 (wzorem poprzednich tematów).
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
