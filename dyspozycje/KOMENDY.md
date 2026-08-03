# KOMENDY MACIEJA — jedyny słownik wyzwalaczy (v3, 2026-08-03; + NUMER/ABC/DEPLOY)

Maciej pisze TYLKO te słowa (oraz decyzje `ID + A|B|C`). Każdy czat rozumie je
identycznie. ZASADA NADRZĘDNA: każda komenda MUSI popchnąć flow do przodu — kończy
się wpisem w kanale ze stopką `CZEKAM-NA: <następne ogniwo>`, żeby od razu było
wiadomo, komu Maciej pisze następne słowo. Informowanie Macieja to tylko echo.

## DECYZJE TEMATÓW (Maciej 2026-08-03) — nadrzędne wobec „start = koduj”

Pełny kanon: [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md).

| Hasło / forma | Co robi agent |
|---|---|
| *(nowy case / bug / zmiana w czacie)* | **Nadaj ID** → wpis w `REJESTR-PROSB-I-ZADAN.md` → **propozycja ± ABC** → **STOP** (bez kodu gry) |
| **`<ID> A`** / **`<ID> B`** / **`<ID> C`** (np. `42 A`, `R-STAWKI B`) | ECHO → zapis decyzji → **implementacja + commit** · **bez deployu** |
| **`deploy`** / **deploy do robocza** / **publish robocza** | Build + `gra-robocza/` + `WERSJE.md` + kanał (runbook handoff §6) |
| **`działaj` / `wdrażaj`** | = zgoda na wdrożenie **bieżącego** otwartego ID w wątku (jak litera A przy jednym temacie); nadal **bez deployu** |

## KOMENDY

| Komenda | Co robi czat, który ją dostał |
|---|---|
| **start** | WYKONUJE kolejkę **już zdecydowanych** tematów (po `ID+litera`) z kanału. Nie omija procedury NUMER→ABC. Na końcu wpis `CZEKAM-NA:`. („działaj" = stary synonim zgody na kod, nie na deploy) |
| **master** | SYNC + PRZEKAZANIE W GÓRĘ: czyta kanał i swoją kolejkę → **dopisuje WPIS „→ MASTER" do KANAL-PRACA.md**: co GOTOWE do wpięcia, co w toku, co blokuje + `CZEKAM-NA: MASTER`. To wyzwala MASTERA: on z meldunku NATYCHMIAST robi zadania dla następnego ogniwa (nowy wpis-kolejka). Czat NIE wykonuje przy tym pracy. |
| **raport** | (głównie do MASTERA) Pełny stan ZAWSZE w 3 sekcjach z numerowanymi podpunktami — **A** = ZROBIONE/odhaczone (A1, A2, …), **B** = CZĘŚCIOWO (B1, B2, … — co konkretnie brakuje), **C** = WYMAGA DZIAŁANIA (C1, C2, … — u kogo wisi i jakie słowo to rusza). Każdy temat = osobny podpunkt. Na końcu: „pierwszy ruch: …" + stempel aktualnej wersji. |
| **sprawdź** | Czyta kanał TERAZ → weryfikuje ostatni meldunek → odpowiada co się zmieniło i CO DALEJ (kto następny). |
| **OK / BUG: opis** | Werdykt playtestu (do MASTERA). OK → MASTER pakuje wersję do DO-KANONU i wskazuje następną robotę. BUG → MASTER **nadaje ID** + zadanie w rejestrze + ABC / dyspozycja — **bez auto-fixu**. |
| **deploy** | Publish ROBOCZA (patrz tabela DECYZJE TEMATÓW). |
| **zabezpiecz** | (przed zamknięciem aplikacji) Czat robi natychmiastowy zrzut roboczych plików swojego sandboxa do `gra-robocza\_sandbox\<ROLA>\` + aktualizuje `STAN-SANDBOXA.md` (co było w /tmp + JEDNA komenda odtworzenia) + wpis w kanale „SANDBOX ZABEZPIECZONY: [lista]". Po restarcie „start" najpierw odtwarza z tego stanu. |

**PUSH (GitHub Desktop, robi tylko Maciej):** zawsze na hasło MASTERA („zrób Push").
Summary dyktuje MASTER przy każdej prośbie (opis CO weszło, np. „rzeki — ujścia
wodospadem"; BEZ daty/godziny — git stempluje czas i autora automatycznie).

## DZIEŃ MACIEJA (z procedurą NUMER→ABC)

1. Case w czacie → agent daje **ID** + ABC / propozycję.
2. Maciej: **`ID A`** (lub B/C) → agent commituje kod.
3. Gdy chce w grze: **`deploy`** → ROBOCZA + md5 w `WERSJE.md`.
4. Playtest: **OK** albo **BUG: …** (BUG = nowe ID, znowu od kroku 1).

## GDZIE CO JEST (dla czatów)
Kolejka i meldunki: `_handoff/KANAL-PRACA.md` · wersje: `WERSJE.md` · role:
`ROLE-I-ZAKRESY-2026-07-06.md` · reguły: `OBIEG-KOMUNIKACJI-2026-07-06.md` (§7, §8) ·
**procedura decyzji:** `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
