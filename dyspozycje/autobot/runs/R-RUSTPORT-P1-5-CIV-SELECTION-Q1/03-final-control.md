STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-5-CIV-SELECTION-Q1
GOAL: Ekran wyboru cywilizacji w żywym Chromium, pin main=edb8fb56.
RUNDY: 1/5 (3 zarzuty — braki dowodowe, nie błędy merytoryczne — Obrona uzupełniła zrzutami+DOM,
Final Control ODDAL)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-5-CIV-SELECTION.md`, 4 zrzuty (Kamień 8 kart, Brąz 14,
Żelazo 15, dowód kliknięcia Grecy).

Liczby cywilizacji per epoka potwierdzone wizualnie i przez `civs.json`: Kamień 8, Brąz 14, Żelazo 15
(kumulacyjnie, zgodnie z P1.4). Klik zmienia wybór (dowód DOM: before=Rzymianie, after=Grecy).
Doprecyzowanie: "bez przewijania" dotyczy tylko siatki kart — cały ekran przewija się wewnątrz
kontenera (`overflow: auto`, `scrollHeight` 5731 przy `clientHeight` 900).

BLOKADY: brak. 404 w konsoli (niepotwierdzona hipoteza `/favicon.ico`) odłożone do P1.16.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
