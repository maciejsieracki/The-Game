# WKLEJKA — onboarding nowego agenta (tylko do kopiowania)

Ten plik nie jest dokumentacją procesu — jest **gotowym tekstem do kopiowania i wklejania**
nowemu agentowi. Pełne zasady (role, twarde bariery, format PR, tabela zakresów) są w
[`dyspozycje/PROTOKOL-WSPOLPRACA-WIELOAGENTOWA-GITHUB.md`](../PROTOKOL-WSPOLPRACA-WIELOAGENTOWA-GITHUB.md)
(`R-PROC-WIELOAGENT-GITHUB-Q1`) — ten plik tylko po niego odsyła.

---

## Zanim wkleisz — 2 kroki

1. **Jeśli to zupełnie nowy agent** (nie Hermes, nie ktoś już wpisany do tabeli §1a
   protokołu) — najpierw powiedz TEJ sesji (Orkiestratorowi): *„Nowy agent, nazwij go
   **\<NAZWA\>**, zakres: **\<domena, np. ekonomia, albo „intake" jak Hermes\>**"*.
   Orkiestrator dopisze wiersz w tabeli protokołu, zapushuje na `main` i potwierdzi Ci,
   że można jechać dalej.
2. **Skopiuj blok poniżej**, podmień `<NAZWA>` na imię tego konkretnego agenta i wklej mu
   to jako pierwszą wiadomość.

---

## BLOK DO WKLEJENIA (podmień `<NAZWA>`)

```
AKTYWACJA — protokół współpracy wieloagentowej (repo: maciejsieracki/the-game)

Zanim zrobisz cokolwiek innego w tym repozytorium, zdobądź jego świeżą kopię:
- jeśli NIE masz jeszcze lokalnej kopii:
  git clone https://github.com/maciejsieracki/The-Game.git
  cd The-Game
- jeśli już masz lokalną kopię z wcześniejszej pracy:
  cd The-Game
  git checkout main
  git pull origin main

Dopiero teraz, z tego świeżo pobranego `main`, przeczytaj W CAŁOŚCI plik:
dyspozycje/PROTOKOL-WSPOLPRACA-WIELOAGENTOWA-GITHUB.md

Twoja nazwa w tabeli "Rejestr agentów i zakresów" (§1a) tego pliku to: <NAZWA>.
Znajdź w tabeli swój wiersz — określa on Twój zakres pracy (domenę), prefiks ID
tematu i prefiks nazwy gałęzi, których masz używać.

Jeśli NIE znajdziesz w tabeli wiersza ze swoją nazwą — zatrzymaj się i zapytaj mnie,
zanim napiszesz jakikolwiek kod. Nie dopisuj się sam do tabeli.

Stosuj się do całego dokumentu dokładnie: określa on Twoją rolę, co wolno i czego
NIE wolno Ci robić (m.in. nigdy push/merge na `main`), oraz dokładny sposób
przekazania gotowej pracy (własna gałąź + Pull Request).
```

---

## Gotowy przykład — Hermes (wiersz już istnieje w protokole, można wkleić od razu)

```
AKTYWACJA — protokół współpracy wieloagentowej (repo: maciejsieracki/the-game)

Zanim zrobisz cokolwiek innego w tym repozytorium, zdobądź jego świeżą kopię:
- jeśli NIE masz jeszcze lokalnej kopii:
  git clone https://github.com/maciejsieracki/The-Game.git
  cd The-Game
- jeśli już masz lokalną kopię z wcześniejszej pracy:
  cd The-Game
  git checkout main
  git pull origin main

Dopiero teraz, z tego świeżo pobranego `main`, przeczytaj W CAŁOŚCI plik:
dyspozycje/PROTOKOL-WSPOLPRACA-WIELOAGENTOWA-GITHUB.md

Twoja nazwa w tabeli "Rejestr agentów i zakresów" (§1a) tego pliku to: Hermes.
Znajdź w tabeli swój wiersz — określa on Twój zakres pracy (domenę), prefiks ID
tematu i prefiks nazwy gałęzi, których masz używać.

Jeśli NIE znajdziesz w tabeli wiersza ze swoją nazwą — zatrzymaj się i zapytaj mnie,
zanim napiszesz jakikolwiek kod. Nie dopisuj się sam do tabeli.

Stosuj się do całego dokumentu dokładnie: określa on Twoją rolę, co wolno i czego
NIE wolno Ci robić (m.in. nigdy push/merge na `main`), oraz dokładny sposób
przekazania gotowej pracy (własna gałąź + Pull Request).
```
