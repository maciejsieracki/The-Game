# R-MERGE-MAIN-RYTM-Q1 — rytm scalania gałęzi roboczej do `main` + rytm tworzenia fal ROBOCZA

**Data:** 2026-08-09 · **Decyzja:** Maciej (wariant własny, nie jedna z zaproponowanych opcji A/B/C) · **Status:** ZAMKNIĘTE, wdrożone od razu tego samego dnia.

## Sytuacja

CLAUDE.md §3 deklaruje projekt jako trunk-based na `main` („brak feature-branchy"), ale harness
sesji chmurowej (Claude Code Remote) twardo przypina rozwój i `push` wyłącznie do wyznaczonej
gałęzi roboczej, zakazując pushowania na `main` bez wyraźnej, osobnej zgody właściciela. W
praktyce main stał w miejscu przez 2 dni, podczas gdy na gałęzi narosło 85 commitów. Nie było
ustalonej reguły KIEDY scalać — dotąd działo się to ad hoc, na pojedyncze polecenie.

Osobny, powiązany problem zauważony przy okazji: tempo tworzenia nowych fal ROBOCZA było zbyt
wysokie (kilka fal dziennie), co utrudniało nadążenie z playtestem — FALA 261 nigdy nawet nie
trafiła do repo jako samodzielny bundle, bo gałąź odjechała zanim agent deployu zdążył
commitnąć.

## Decyzja

Maciej, dosłownie: *„Myślę, że zawsze można scalać poprzednią falę, a nową zostawiamy do testów.
Jeżeli robisz kolejną falę, to znowu możesz robić scalenie. Czyli zawsze będzie scalenie o jedną
falę do tyłu. Da to nam możliwość cofnięcia się i łatwiejszego zarządzania błędami."*

Doprecyzowanie (pytanie doprecyzowujące, odpowiedź przez AskUserQuestion): nowa fala ROBOCZA
powstaje **wyłącznie na wyraźne słowo „deploy"** od właściciela — nie automatycznie po
nagromadzeniu tematów ani po czasie.

### Reguła kanoniczna

1. **Rytm scalania do `main` = zawsze jedna fala ROBOCZA do tyłu.**
   - Fala N powstaje (deploy do ROBOCZA na wyraźne „deploy").
   - Fala N−1, jeśli jeszcze nie scalona, kwalifikuje się do scalenia do `main`.
   - Fala N zostaje na gałęzi roboczej **wyłącznie do testów** — nie jest scalana, dopóki nie
     powstanie fala N+1.
   - Efekt: main zawsze ma stały bufor jednej fali różnicy względem najnowszej pracy — możliwość
     cofnięcia się, jeśli błąd w najnowszej fali wyjdzie dopiero po fakcie.
2. **Nowa fala ROBOCZA wyłącznie na wyraźne słowo „deploy"** od właściciela — zaostrzenie/
   doprecyzowanie już istniejącej reguły CLAUDE.md §5 (nie nowa reguła, tylko twardsze
   egzekwowanie: zero autonomicznego tworzenia kolejnych fal w trakcie sesji, nawet przy dużym
   nagromadzeniu zamkniętych tematów AutoBot).

### Mechanika scalenia (git)

Scalenie NIE jest scaleniem całej gałęzi (jej czubka) — jest scaleniem do konkretnego commitu
oznaczającego koniec poprzedniej fali (commit deployu w `WERSJE.md`), zostawiając nowsze commity
(już należące do bieżącej, jeszcze testowanej fali) poza `main`:

```
git checkout main
git merge --no-ff <commit-deployu-poprzedniej-fali>
git push origin main
git checkout <gałąź-robocza>
```

## Wykonanie (2026-08-09, ta sama tura)

Pierwsze scalenie wg nowej reguły: `main` (`a659f4a1`, 2026-08-08) doganiony o FALA 262
(`ce69cf45`, commit deployu `75b14e86`) → merge `b137332a`, wypchnięty. FALA 263 (`89176ced`)
świadomie **nie** wchodzi w ten merge — zostaje na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`,
wejdzie do `main` dopiero przy scaleniu przy okazji kolejnej fali (FALA 264).

## Uzasadnienie

- Trzyma `main` blisko rzeczywistości, zgodnie z własną deklaracją projektu (trunk-based), bez
  nieograniczonego narastania długu jak dotąd (85 commitów za dwa dni).
- Bufor jednej fali daje praktyczną możliwość cofnięcia się (main nigdy nie zawiera najnowszej,
  jeszcze niedogranej w pełni fali).
- Ograniczenie tworzenia fal wyłącznie do słowa „deploy" zapobiega powtórce incydentu FALA 261
  (bundle zbudowany, ale nigdy niescommitowany, bo gałąź odjechała w trakcie oczekiwania na
  bramkę) i daje więcej czasu na realny playtest między falami.

## Kto wykonuje merge do main

Nie ustalono formalnie w CLAUDE.md, która sesja (chmurowa czy lokalna) wykonuje przyszłe scalenia
— pierwsze wykonała sesja chmurowa, za wyraźną zgodą właściciela udzieloną w tej samej turze.
Kolejne scalenia wymagają analogicznej, jednorazowej zgody (lub wyraźnego stwierdzenia przez
Macieja, że zgoda jest już stała/domyślna dla tego wzorca).
