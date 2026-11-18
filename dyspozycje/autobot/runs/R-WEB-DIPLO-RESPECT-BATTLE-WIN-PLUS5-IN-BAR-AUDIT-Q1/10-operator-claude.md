STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-BATTLE-WIN-PLUS5-IN-BAR-AUDIT-Q1
GOAL: Ustalić, czy „Wygrana bitwy (historia) +5” wchodzi do paska Respektu gracza (A), znika po ticku (B) czy wchodzi jednorazowo (C).
ZMIANY-COMMIT: brak zmian kodu gry; dodany tylko ten raport. Baza b2d5b4e51e7f02105c073628370a4b9a086c33fa (origin/main). SHA commita: patrz pole sha w odpowiedzi.
TESTY: NIE ZMIERZONO. Brak pomiaru w runtime (bez build/Chromium i bez gry z bitwami). Bramki (tsc, logic-test, tech-tree, research, unit-replace, combat, testy respektu) nie uruchamiane: brak zmian kodu, brak node_modules w gra/.

WYNIK ANALIZY KODU (NIE pomiar, wniosek z czytania kodu):
1. Zdarzenie wygrana_bitwa (diplomacy.ts:1009) dodaje +5 do rel.respekt przez applyDiploEventTracked (main.ts:13268–13277).
2. Pasek Respektu w panelu („Respekt X / 100”, diplomacyAudience.ts:2418 i main.ts:27289) liczy się z objectivePowerForOwnerEffective (computeRespekt) + respektMilOffset (main.ts:3079–3080). Nie czyta rel.respekt.
3. relacjaTotal w audiencji (main.ts:27045–27047, 27336) też nie czyta rel.respekt: to zaufanie + objectiveRespektPctTowardEffective.
4. Tick AI (main.ts:45396–45399) nadpisuje rel.respekt wartością respektZKorektaMilitarna(computeRespekt(...), respektMilOffset), więc +5 zapisane między turami przepada przy następnym ticku.
5. Wpis „Wygrana bitwy (historia) +5” w „ZA CO CIĘ LUBIĄ” pochodzi z recordDiploFactor (applyDiploEventTracked). Panel pokazuje więc przyczynę, która nie wchodzi do paska.

Wniosek wstępny: hipoteza B (+5 nie wchodzi do paska Respektu i jest nadpisywane w ticku). Wymaga pomiaru N bitew z tickiem przed potwierdzeniem.

RACHUNEK ZRZUTU (4 wygrane, Respekt 87, Relacja 115, Zaufanie 28): przy kodzie wyżej +20 z wygranych nie wchodzi do Respektu 87 ani do Relacji 115 (Relacja = Zaufanie 28 + Respekt 87 = 115, zgodnie z formułą). Liczba 87 = computeRespekt(moc) + ewentualnie +15 (przewaga militarna, jeśli aktywna). Bazy mocy nie znam z tego zrzutu, więc rozbicie 87 jest NIE ZMIERZONO.

POPRAWKA: nie wdrożona. Naprawa (dodanie sumy +5 z wygranych do formuły paska) zmieniłaby widoczny Respekt o +5 za każdą wygraną, czyli +20 po czterech wygranych. Według zasad tematu to przekracza „kilka punktów”, więc wymagana decyzja właściciela.

DECISION_REQUIRED — pytanie ABC (po polsku):
A) (rekomendowane) Naprawić: dodać do formuły paska sumę +5 za wygrane bitwy z obcięciem [0,100], bez zmiany +15/−10/+5 i progów. Pasek i Relacja wzrosną o +5 za każdą wygraną.
B) Zostawić jak jest i zmienić tylko panel: usunąć wpis „Wygrana bitwy +5” z listy przyczyn, bo nie wchodzi do paska.
C) Zostawić bez zmian i potwierdzić, że +5 jest celowo tylko etykietą historii bojowej.

BLOKADY: brak pomiaru runtime (wymagany przed wdrożeniem); decyzja właściciela (pytanie ABC wyżej).
RUNDY: 1/5. Ostatni werdykt: brak (Operator). Decyzja wymagana: tak.
NASTĘPNY KROK: właściciel wybiera A/B/C; przy A — osobny temat z testem przed/po, mutacją i pomiarem 3 tur po bitwie.
DEPLOY/PUSH: NIE WYKONANO
