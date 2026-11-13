# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: przepisać gra/tools/diplo-war-peace-sim-test.cjs tak, by sprawdzał zatwierdzone zachowanie kodu (3 FAIL na bazie: S3, S4b, M_TUR), bez osłabiania asercji.
BAZA: a99445016 (origin/main), wykonano `git checkout --detach a99445016`.
ZMIANY-COMMIT: brak zmian w kodzie i w teście. Zatrzymanie zgodnie z dispatchem (diagnoza wskazała błąd w KODZIE gry, allowlista nie pozwala go naprawić). Commit zawiera wyłącznie ten raport.

## Wynik bazowy (surowe wyjście, bez zmian w repo)

`node tools/diplo-war-peace-sim-test.cjs` na a99445016: `diplo-war-peace-sim-test: 19 pass / 3 fail`.
FAIL: S3, S4b, M_TUR. Zgodne z dispatchem.

## Diagnoza każdego z trzech scenariuszy

| Scenariusz | Przyczyna starego FAIL | Zatwierdzona reguła (dispatch) | Propozycja asercji |
|---|---|---|---|
| S3 (tury 7-9, silna AI, bez utraty) | Test oczekuje powodu „czuje się silniejsze", a kod zwraca „Pokój i rozejm dostępne po 10 pełnych turach wojny" (bramka `peaceProposalBlocked`, `PEACE_PROPOSAL_MIN_WAR_TURNS = 10`, `diplomacy-peace-proposal-timing.ts`). Kolejność bramek jest poprawna: najpierw czas wojny, potem siła. | „pierwsze propozycje pokoju od tury 10"; silniejsza AI odrzuca bez limitu czasu | Tury 7-9: powód „po 10 pełnych turach wojny" (odrzucenie czasowe). Od tury 10: powód „militarnie silniejsza" (już sprawdza S3b/S3c). Test-side, bez zmiany kodu. |
| S4b (kontrola, tura 8, bez utraty) | Ta sama przyczyna: tura 8 < 10, więc kod zwraca bramkę czasu. | jw. | Kontrolę przenieść na turę 10 (`pvs[9]`) i sprawdzać „militarnie silniejsza". Test-side. |
| M_TUR (mutant: `aiPeaceTimeOk = true`) | Dwa powody. (1) `isTooEarly` szuka regexu `/za wcześnie/`, a kod pisze „po 10 pełnych turach wojny", więc `earlyViolations` zawsze wychodzi 0 i asercja S7b jest pusta. (2) Mutant rzeczywiście składa propozycję w turze 1 (potwierdzone w wyjściu FAIL: `t:1`, „tury wojny=1"). | „AI nie proponuje pokoju przed 10 turą" | Regex poprawić na `/za wcześnie|po 10 pełnych turach/`. Wtedy M_TUR i S7b stają się czytelne, ale patrz sekcja BŁĄD KODU poniżej. |

## BŁĄD KODU GRY (wymaga decyzji właściciela)

Po poprawieniu regexu (diagnostyczna kopia testu w `gra/tools/`, usunięta po użyciu; repo czyste) baza pokazuje:

- `earlyViolations`: 12 naruszeń (rw 0.2 i 0.5, lost 0 i 1, tury 7, 8, 9). AI składa `zaproponuj_pokoj` w turach 7-9, a ocena tej samej propozycji przez `evaluateProposal` zwraca „dostępne po 10 pełnych turach wojny".
- Źródło: `ai.ts` ~l.7019 `aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny` (dla zulusi minTurWojny = 7, potwierdzone wyjściem S1: `[7,10,13,...]`). Bramka AI używa profilu cywilizacji, a bramka gracza (`PEACE_PROPOSAL_MIN_WAR_TURNS = 10`) jest globalna. Obie działają, ale się nie zgadzają.
- Sprzeczność z zatwierdzoną regułą „pierwsze propozycje pokoju od tury 10": AI proponuje w turze 7, zanim reguła na to pozwala.
- Test S7b („AI nigdy nie proponuje pokoju w stanie 'za wcześnie'") miał to wykrywać, ale przez błędny regex był pusty. Naprawa regexu ujawnia błąd w kodzie, a nie w teście.
- Zgodność z S1 (test oczekuje propozycji od tury minTurWojny, czyli 7) jest rozbieżna z regułą „od tury 10". Ten sam konflikt, dwa miejsca.

Decyzja wymagana (ABC, do właściciela):
- A) Podnieść AI do tury 10: `aiPeaceTimeOk` = `max(minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)` albo wprost 10. Zmiana w `ai.ts` (poza allowlistą). Test S1 zmienić na tury 10,13,16... Mutant M_TUR nadal wykrywany (pierwsza propozycja w turze 1).
- B) Zostawić minTurWojny per cywilizacja i zmienić bramkę gracza na profil (usunąć globalne 10). Zmiana w `diplomacy-proposals.ts` i `diplomacy-peace-proposal-timing.ts`, też poza allowlistą. Zmienia też zachowanie gracza.
- C) Uznać rozbieżność za zamierzoną i zapisać ją w regule (np. „AI może proponować od minTurWojny, gracz od 10"). Wtedy S7b jest błędnym oczekiwaniem i trzeba go przepisać.

Rekomendacja Operatora: A. Jedna reguła, zgodna z zatwierdzeniem „od tury 10", najmniejsza zmiana (jedna linia w `ai.ts`).

## Plan po decyzji (do wykonania w następnej rundzie)

1. Test-side (nie zależy od decyzji): poprawić regex `isTooEarly` na `/za wcześnie|po 10 pełnych turach/`; S3 i S4b przepisać jak w tabeli; M_TUR zostawić jako mutant pierwszej propozycji (`weakSchedule[0].t === 1`).
2. Zależnie od decyzji A/B/C: zmienić S1 i S7b, albo zostawić S7b jako wykrywający błąd (wtedy test jest czerwony do naprawy kodu, co jest właściwe).
3. Mutanty: dodać mutant „AI proponuje w turze 7" (żeby S7b/S1 wykrywały częściową naprawę) po decyzji.
4. Bramki (tsc 0, 5 bramek, diplomacy-test 149/0, ai-test 297/0): NIE_ZMIERZONO w tej rundzie, bo nie zmieniono kodu ani testu. Zostaną uruchomione po wdrożeniu poprawki.

## TESTY (ta runda)

- `node tools/diplo-war-peace-sim-test.cjs` (baza a99445016): 19 pass / 3 fail (S3, S4b, M_TUR), zgodnie z dispatchem.
- Diagnostyka z poprawionym regexem (kopia tymczasowa): earlyViolations 12 (t=7,8,9), consistencyViolations 0, weakSchedule [7,10,13,16,19,22,25,28], midFirstT 7, strongFirstT null, playerVsStrong tury 7-9 „po 10 pełnych turach", tury 10+ „militarnie silniejsza".
- Kopia tymczasowa `tools/_tmp-diag-warpeace.cjs` usunięta; `git status` czysty.
- `node_modules` w `gra/` zainstalowane przez `npm ci` na potrzeby testu (ignorowane przez git); do usunięcia po pracy.

## BLOKADY

- Błąd w kodzie gry (ai.ts minTurWojny 7 vs gracz 10): wymaga decyzji właściciela A/B/C. Zgodnie z dispatchem nie zmieniam kodu.
- Bez tej decyzji nie da się osiągnąć „22/22 bez FAIL" bez osłabienia asercji S7b, czego dispatch zakazuje.

## RUNDY

1/5. Zatrzymanie: DECISION_REQUIRED (nie FAIL, nie BLOCK).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazuje `00-dispatch.md` na origin/main, ale plik jest tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Treść odczytano z gałęzi.
- Zadanie #352 w rejestrze właściciela („dług testowy sim") jest powiązane z tym błędem kodu. Decyzja A/B/C dotyczy też #372 („bramka pokoju AI liczy słabość respektem, nie siłą militarną").
- Sprawdzić, czy dla propozycji AI do gracza `evaluateProposal` powinien w ogóle stosować bramkę 10 tur (obecnie stosuje). To część decyzji B/C.

## NASTĘPNY KROK

Decyzja właściciela A/B/C dotycząca bramki pokoju AI w turach 7-9. Po decyzji: runda 2 (Operator Haiku) z tabelą z sekcji „Plan po decyzji".

DEPLOY/PUSH: NIE WYKONANO
