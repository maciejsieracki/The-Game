# Utwory muzyczne — wrzucaj tutaj

Katalog na pliki muzyczne wkompilowywane do bundla gry (Vite inline'uje je jako
base64, więc gra zostaje pojedynczym plikiem HTML i działa z `file://`).

## Jak wrzucać
Skopiuj pliki audio do tego katalogu. Nazewnictwo dowolne — kod czyta katalog,
nie polega na konkretnych nazwach.

## Epoki
- `kamien/` — muzyka epoki kamienia (aktualnie wdrażana)
- `intro/`  — muzyka ekranu wyboru cywilizacji (planowane później)

## Uwaga o wadze
Każdy plik rośnie o ~33% po zakodowaniu do base64. Bundel gry ma dziś ~10 MB.
