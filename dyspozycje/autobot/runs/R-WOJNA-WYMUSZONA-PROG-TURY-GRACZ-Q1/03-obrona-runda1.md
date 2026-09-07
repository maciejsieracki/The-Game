STATUS: DECISION_REQUIRED
DOMAIN: GAME + INFRA
TEMAT: R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1

ZMIANY-COMMIT: BRAK COMMITU — bez zmian od rundy 1.

OBRONA:

**#1 (`forced-war-iron-main-guard-test.cjs`) → PRZYJMUJE fakt, ODRZUCAM że to mój defekt
do cichej naprawy.** Regex testu dopasowuje literalnie stary, dwuwarunkowy blok Kroku C —
z definicji nie może dopasować nowego, trzywarunkowego. To bezpośredni, zamierzony skutek
GOAL punktu 1 dispatchu, ale plik nie jest na allowliście — nie poprawiam samodzielnie.

**#2 (`forced-war-iron-mutant-probe.cjs`) → PRZYJMUJE fakt, ODRZUCAM że to mój defekt do
cichej naprawy.** Mutant `M42-main-gracz-zawsze-w-puli` (linia 407) ma w polu `find`
dokładnie stary literał trzylinijkowy, który fizycznie już nie istnieje w main.ts — sonda
nie może zaaplikować mutacji. Identyczny problem allowlisty jak #1.

**#3 i #4 → PRZYJMUJE fakt, ODRZUCAM że to prosta „poprawka testu" analogiczna do #1/#2.**
Testy opisują scenariusz wprost: bootstrap tura=1 → fast-forward AI do „pending" →
oczekiwanie że gracz zostaje wybrany jako cel W TURZE 1. Próg turn>=25 blokuje to z
definicji dla dowolnego scenariusza w turze 1 — naprawa wymaga przebudowy scenariusza
E2E (fast-forward do turn>=25 przed wywołaniem hooka testowego), co wykracza poza
literalną allowlistę i poza uprawnienia Operatora do samodzielnej decyzji.

**Rdzeń problemu:** dispatch zawiera wewnętrzną sprzeczność — kryterium „cała rodzina
forced-war-*-test.cjs zielona" koliduje z allowlistą wymieniającą z imienia tylko jeden
plik testowy, mimo że GOAL pkt 1 z definicji łamie kontrakt zakodowany w czterech innych
plikach. Wnoszę o decyzję orkiestratora: rozszerzyć allowlistę o cztery pliki, z jawnym
zakresem: #1/#2 — aktualizacja regexu/literału na nowy trzywarunkowy blok; #3/#4 —
dodanie fast-forwardu tury do >=25 przed wywołaniem `force*ForcedWarOnPlayer()`.

BLOKADY: Zarzuty #1-4 potwierdzone jako faktografia trafna, naprawa wymaga rozszerzenia
allowlisty.

RUNDY: 1/5 (obrona rundy 1; runda 2 wstrzymana do decyzji o allowliście)
NASTĘPNY KROK: Decyzja orkiestratora (patrz `00b-dispatch-runda2-allowlist.md` —
allowlista rozszerzona, autoryzacja udzielona) → runda 2.
DEPLOY/PUSH: NIE WYKONANO
