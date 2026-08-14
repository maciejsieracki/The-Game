# ZGŁOSZENIA CZEKAJĄCE NA ODNOWĘ LIMITU

**To jest KATEGORIA 6 raportu (Maciej, 2026-08-14): „taka, którą zajmiemy się w pierwszej
kolejności, jak się odnowi limit."** Przy haśle `raport` doliczyć tę listę jako 6. kategorię, obok
istniejących 5 z `CLAUDE.md` §10.

**Cel tego pliku (Maciej, 2026-08-14):** osobna warstwa, NIE to samo co „odłożone jako rozwojowe"
w `PYTANIA-OTWARTE.md`/`BACKLOG-PRZYSZLOSC.md`. Od 2026-08-14 limit sesji jest praktycznie
zjedzony. Zasada na czas do odnowy limitu (**przyszła środa**):

- **Każde nowe zgłoszenie Macieja trafia TU** — samo zarejestrowanie, BEZ dispatchu subagenta,
  bez Operatora/Evaluatora, bez kodu.
- **Wyjątek: Maciej mówi wprost, że zgłoszenie jest KRYTYCZNE** („będę za każdym razem mówił, czy
  to jest błąd krytyczny, czy może coś tylko zapisałem" — jego słowa, 2026-08-14). Tylko
  wtedy dispatch od razu, normalnym trybem AutoBot (Operator→Evaluator), tak jak do tej pory.
  Domyślnie — bez tego wyraźnego słowa — zgłoszenie NIE jest krytyczne, zostaje tutaj.
- Po odnowie limitu: przejść ten plik od góry, każdy punkt przepuścić przez zwykły cykl
  (rejestracja pełna w `PYTANIA-OTWARTE.md` jeśli tego wymaga + dispatch), a wpis tutaj oznaczyć
  jako przeniesiony/zamknięty.

Format wpisu: data, cytat zgłoszenia (jeśli był), krótki kontekst jeśli już coś ustalono, status.

---

## P-CS-PRODUKCJA-JEDNOSTEK-REGRES-USTAWIENIA-Q1 (2026-08-14)

**Zgłoszenie (cytat):** „Jeszcze jedna rzecz jest do sprawdzenia. Trzeba zobaczyć czy nie ma
jakiegoś regresu, jeżeli chodzi o państwa-miasta, bo zaczęły produkować mniej jednostek, chociaż
ustawiony jest najtrudniejszy poziom gry. W sensie poziom gry jest normalny, ale najtrudniejszy
poziom, jeżeli chodzi o Państwa-miasta. Sprawdź czego to może wynikać, może jakiś regres.
Przerzuciliśmy ostatnio ustawienia do oddzielnych ustawień, może wtedy coś umknęło, jest nie
podłączone."

**Stan:** zarejestrowany PEŁNY opis + hipoteza + plan rekonesansu w `PYTANIA-OTWARTE.md`
(sekcja `P-CS-PRODUKCJA-JEDNOSTEK-REGRES-USTAWIENIA-Q1`) — status tam poprawiony na „przeniesione
tutaj, czeka na limit", NIE dispatchowany, zero kodu tknięte. Gdy limit się odnowi: dispatch wg
planu już opisanego w `PYTANIA-OTWARTE.md`.

**STATUS: CZEKA NA ODNOWĘ LIMITU (nie krytyczne — Maciej nie oznaczył jako krytyczne).**

---

## P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE — runda 2 (2026-08-14)

**Stan:** Evaluator (Opus 5) zwrócił **FAIL** dla `9e25ea77`+`5ed4e083` (pełny werdykt w
`PYTANIA-OTWARTE.md`, commit `6bdf7967`). Atak jednostka→jednostka z dystansu **działa poprawnie**
(nie cofać). Trzy powody FAIL: **F1** — AI nadal wymaga adiacencji przy ataku na miasto, gracz już
nie (złamany parytet); **F2** — zdobycie PUSTEGO miasta z dystansu daje `capture_empty` zamiast
zgłoszonego „ataku"; **F3** — zwycięski atakujący z dystansu TELEPORTUJE SIĘ na heks celu (do 6
heksów dla Katapulty), bez sprawdzania przejezdności terenu — nieprojektowana zmiana mechaniki,
zgłoszenie wprost rezerwowało to pytanie dla Ciebie.

**Pytanie do Ciebie, gdy wrócimy do tematu — `P-BITWA-ATAK-DYSTANS-TELEPORT-Q1`:** czy zwycięski
atakujący z dystansu ma (A) teleportować się na heks celu tak jak dziś, (B) zostać na swoim
miejscu bez żadnego ruchu, czy (C) przesunąć się tylko o 1 heks jak dawniej mimo ataku z dystansu?
Rekomendacja robocza: B (najbliżej „łucznik strzela z daleka i zostaje na miejscu", zero ryzyka
nielegalnego ruchu przez nieprzejezdny teren) — ale to nie jest pilne, wystarczy odpowiedzieć przy
odnowie limitu.

**STATUS: CZEKA NA ODNOWĘ LIMITU (Evaluator FAIL, runda 2 wymagana — nie krytyczne).**
