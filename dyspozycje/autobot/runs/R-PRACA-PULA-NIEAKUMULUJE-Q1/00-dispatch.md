# 00-dispatch — R-PRACA-PULA-NIEAKUMULUJE-Q1

STATUS: DISPATCHED
TEMAT: R-PRACA-PULA-NIEAKUMULUJE-Q1
GOAL: Naprawić brak akumulacji bieżącej Pracy w globalnej Puli Pracy i usunąć rozjazd między panelem imperium, panelem miasta, suwakiem oraz trwałym stanem po turze.
KRYTERIA KOŃCA: przy 0/100 i 50/50 część przeznaczona do puli faktycznie zwiększa pulę; część budynkowa trafia do kolejki budowy; wartości `+9`, `8 +9`, `Praca w mieście` i stan po kolejnej turze są spójne; utrzymanie ulepszeń odejmowane jest w poprawnym momencie; save/load i AI/MP nie regresują; test regresji z reprodukcją z obrazów.
ALLOWLISTA: ustalić po reconie; preferowane `gra/src/game/**`, `gra/src/ui/**` i jeden celowany test w `gra/tools/**`; artefakty tego runu. Nie rozszerzać zakresu na suwak/automatyzację bez dowodu związku.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300; nie pracować w starym katalogu Civ.
PLAN TESTÓW: reprodukcja 0/100, 50/50 i 100/0; test akumulacji przez co najmniej dwie tury; test utrzymania ulepszeń; panel imperium vs panel miasta; player/AI/MP; save/load; tsc z właściwego `gra/node_modules`.
ABC: brak na tym etapie — zgłoszony błąd ma jednoznaczny oczekiwany efekt; ABC tylko jeśli recon ujawni konflikt kanonu lub balansu.
DEPLOY/PUSH: NIE WYKONANO
