# R-WEB-ALLIANCE-REPLACE-PATTERN-Q1 — dlaczego sojusze AI↔AI są podmieniane (1-13: t33→t40, 1-19: t33→t58) i co usuwa umowy w biegu harder 0

DOMAIN: GAME (analiza istniejących danych; bez długich biegów) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 8707b063b (po ALLYPATH). Zero zmian w gra/src i gra/data.

## Kontekst
ALLYPATH (runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1, dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md, dane/): bieg ciągły seed 4242, harder 0, t2–67, 96 wpisów [AA-REMOVE] (które z 8 ścieżek usunęło którą umowę, tura, strony). Zdarzenie ALLY66 (utrata 1-13 i 1-19 w t62–66) nie odtworzyło się, ale log z ALLY66 (runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane, seed4242-alliance-log-t67.txt) pokazuje wzorzec: sojusz_aiai_1_13_t33 zastąpiony przez _t40; sojusz_aiai_1_19_t33 widoczny w t53, a w t58 tylko nowy _t58; sojusze 10-19 (t64) i 7-13 (t66) powstają przy limicie 2.
## Zadanie (analiza istniejących danych — NIE uruchamiaj biegów dłuższych niż 10 min)
1. Z danych [AA-REMOVE] i logu sojuszy: dla każdej podmiany sojuszu (umowa znika, ta sama para podpisuje nową) wskaż ścieżkę usuwania (plik:linia z tabeli ALLYPATH), przyczynę (wygaśnięcie terminu? odnowienie? zerwanie przy wojnie? odmowa obowiązku?) i czy to ZGODNE z regułami (zacytuj regułę z przewodnika/rejestru/kodu).
2. Czy limit 2 sojuszy/cywilizację jest zawsze zachowany w momencie podmiany (okno bez umowy / podwójna umowa)? Dowód z logu, tura po turze dla par 1-13, 1-19, 10-19, 7-13.
3. Wynik: dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md; klasyfikacja: ZGODNE / ŁAMIE REGUŁĘ (kandydat R-WEB-* z minimalnym odtworzeniem, bez naprawy) / NIE ZMIERZONO z powodem. Pytania do właściciela NIE zadawaj — tylko opisz (decyzja → orkiestrator wg ZASAD ABC).
## Allowlista
dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-*.md, dyspozycje/autobot/runs/R-WEB-ALLIANCE-REPLACE-PATTERN-Q1/**.
## Zakazy
gra/ (poza odczytem), gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB.
## Bramki
Dokument + raport; commituj od razu (git add <ścieżki tematu>); tsc nie wymagany (brak zmian kodu), potwierdź `git diff --stat` = tylko dyspozycje/.
## Binarne kryterium
Każda podmiana sojuszu ma ścieżkę usunięcia (plik:linia), przyczynę i klasyfikację z dowodem (cytat z logu); limit 2 sprawdzony tura po turze.
