# AUDYT: rozejm (czasowy) vs pokój stały — R-WEB-DIPLO-TRUCE-VS-PEACE-OPTIONS-AUDIT-Q1

Baza: aeb52465e (origin/main). Audyt read-only: zero zmian w gra/, WERSJE.md, bez deploy/push.
Luka dispatchu: dodatek orkiestratora `00-dispatch-DODATEK-claude.md` NIE istnieje na gałęzi
`claude/sprawdzenie-funkcjonalnosci-ek4ra0` (ani na origin/main). ZAŁOŻENIE: zakres = 4 punkty dispatchu z origin/main.

Legenda: ZMIERZONO (kod przeczytany, linia podana) / NIE_ZMIERZONO (nie sprawdzono w kodzie lub w przeglądarce).

## 1. Czy gracz może zaproponować AI rozejm (z długością) i pokój stały — UI audiencji i powiadomienia

ZMIERZONO:
- Stół negocjacyjny ma przełącznik „Pokój | Rozejm” i wybór czasu rozejmu 5 / 10 / 15 tur (domyślnie 10):
  `gra/src/ui/diplomacyTradeBasket.ts` ~843–860. Wybór trafia do payloadu `rodzaj='rozejm'`, `turns=5|10|15` (~1200–1204).
- Stałe: `TRUCE_DURATION_OPTIONS = [5,10,15]`, `TRUCE_DEFAULT_TURNS = 10` (`gra/src/game/diplomacy-peace-lock.ts`).
- Obie opcje wymagają wojny co najmniej `PEACE_PROPOSAL_MIN_WAR_TURNS = 10` pełnych tur
  (`gra/src/game/diplomacy-peace-proposal-timing.ts:2`; bramka `gra/src/game/diplomacy-proposals.ts:1126`).
  Rozejm bez wojny odrzucany (~1132).
- Audiencja `gra/src/ui/diplomacyAudience.ts` korzysta z tego samego stołu (import `diplomacyTradeBasket`).
- Kontroferta na rozejm otwiera się w trybie rozejmu z tą samą długością (`main.ts` ~21357–21360).
- Karta propozycji AI: `main.ts` ~21145 → `Rozejm na ${formatTurCountAcc(p.turns ?? 10)}`.
  Tekst AI: `diplomacy-proposals.ts` ~1995 („Proponujemy rozejm — na czas ustalony w propozycji…”).

NIE_ZMIERZONO: czy karta w skrzynce (`pendingDiplomacyInbox`) pokazuje `reason` (tekst rozejmu po wygaśnięciu); brak uruchomienia przeglądarki (read-only).

## 2. Kiedy AI proponuje rozejm, a kiedy pokój stały

ZMIERZONO (`gra/src/game/ai.ts` ~7095–7150; `aiTruceOrPeaceMode` w `diplomacy-peace-lock.ts`).
Warunki wejścia: wojna z graczem, brak „poczucia siły”, bramka czasu wojny, `rw <= progPokojSlabosc` lub sygnały pokoju.
Kolejność w `aiTruceOrPeaceMode`:
1. zmęczenie wojną `warWearinessFraction(turnsAtWar, zmeczenieT) >= 1` → POKÓJ;
2. `willingnessPeace >= 0.7` → POKÓJ;
3. Zaufanie `>= 60` → POKÓJ;
4. słabsze AI (`rw <= progPokojSlabosc`) → ROZEJM;
5. inaczej `aiPeaceProposalKind(turnsAtWar)`: wojna < 20 tur → ROZEJM, >= 20 → POKÓJ (`AI_ROZEJM_DO_TUR = 20`).
Progi 1 / 0.7 / 60 są w kodzie oznaczone jako ZAŁOŻENIE orkiestratora (do ABC).
AI proponuje rozejm bez wybranej przez gracza długości → domyślnie `TRUCE_DEFAULT_TURNS` (10), `diplomacy-proposals.ts` ~2081–2083.

## 3. Co się dzieje po końcu rozejmu i czym pokój różni się od rozejmu

ZMIERZONO:

| Aspekt | Rozejm (5/10/15) | Pokój stały |
|---|---|---|
| Status relacji | `pokoj` + `truceUntilTurn` (main.ts ~12064–12085) | `pokoj` |
| Zaufanie | 0 (`peaceFinalizeTrustEvent`, peace-lock) | +5 (`applyDiploEventTracked 'pokoj'`) |
| Blokada wypowiedzenia wojny | brak (`peaceUntilTurn` = undefined, N1) | 10 tur (`PEACE_TREATY_LOCK_TURNS`, `startPeaceTreatyLock`) |
| Wypowiedzenie w trakcie | dozwolone, ale = złamanie: kara jak za pakt NAP (`main.ts` ~12315–12350, `zlamanie_paktu_nap`) | zablokowane do końca karencji (`isPeaceTreatyLocked`, main.ts ~11952) |
| Po wygaśnięciu | `truceEndTickPair`: wojna bez kary; druga strona (nie-inicjator) dostaje OFERTĘ pokoju stałego | — |
| Oferta po rozejmie | gracz: wpis w skrzynce, timeout = kolejna tura = wojna; AI: od razu wg siły (`truceEndAiAccepts`: adresat akceptuje, gdy proponujący ≤ 80% jego armii M) | — |

Wynik: po rozejmie wojna wraca automatycznie, chyba że druga strona zaakceptuje pokój stały.

NIE_ZMIERZONO: cooldown po wznowionej wojnie poza karą za złamanie — nie znaleziono osobnego cooldownu w tym przepływie.

## 4. Luki względem postulatu właściciela

L1 (UI, istotna): relacja po rozejmie pokazuje etykietę „Pokój” identycznie jak po pokoju stałym.
`gra/src/game/diplomacy-display.ts` ~312 (`contactEstablished → 'Pokój'`). Pole `truceUntilTurn` nie jest czytane w żadnym pliku `gra/src/ui/` (grep: 0 trafień). Gracz nie widzi, że to rozejm ani kiedy wygasa.

L2 (UI/treść, niespójność): napis „runda 1/3” z zrzutu właściciela POCHODZI Z KODU. ZMIERZONO (odpowiedź na poprzednią wersję tego punktu, poprawka po Evaluatorze): `gra/src/main.ts:19057` buduje subtitle powiadomienia jako `negotiationSummary(n, true) + ' (runda ${n.round}/${NEGOTIATION_MAX_ROUNDS})'`, a `NEGOTIATION_MAX_ROUNDS = 3` (`gra/src/game/diplomacy-proposals.ts:2485`). Powiadomienie ma `blocking: true`, stąd „WYMAGA DECYZJI”. Licznik w powiadomieniu pokazuje się od rundy 1 (np. „1/3”), natomiast karta audiencji pokazuje „Kontroferta r/max” dopiero od rundy 2 (`gra/src/ui/diplomacyAudience.ts:1968–1971`, `visible = r.round > 1 ? … : expLabel`). Obie formy liczą tę samą wartość `round`, ale różnie ją eksponują — to jest luka do decyzji (ujednolicić czy zostawić).

L3 (do potwierdzenia): asymetria akceptacji pokoju po rozejmie. Adresat AI akceptuje tylko, gdy proponujący jest co najmniej o 20% słabszy (`truceEndAiAccepts`). Kod podaje to jako decyzję właściciela z 2026-11-10. Przy rozejmie z AI do gracza gracz decyduje sam. Do potwierdzenia przez właściciela, czy to ma być reguła docelowa.

L4 (drobne): komunikat wygaśnięcia dla gracza (`truceEndTickPair` → `enqueueOffer`, reason „Rozejm wygasł — propozycja pokoju stałego (odmowa = wojna)”, `gra/src/game/diplomacy-peace-lock.ts:283`) TRAFIA do gracza: subtitle powiadomienia pendingDiplomacyInbox to `diploPendingTitle(p.cmdType) + ' — ' + p.reason` (`gra/src/main.ts:19043–19045`), czyli reason jest wyświetlany (ZMIERZONO w kodzie budującym zdarzenie; renderowanie listy zdarzeń nie sprawdzone w przeglądarce). Komunikat nie podaje długości rozejmu ani numeru tury wygaśnięcia. Generyczny tytuł karty to `diploPendingTitle('zaproponuj_pokoj')`.

Zgodne z postulatem: dwa tryby (rozejm z wyborem 5/10/15, pokój stały), wybór przez gracza na stole, wybór przez AI wg pozycji, automatyczny powrót do wojny i oferta pokoju po wygaśnięciu.

## 5. Propozycja minimalnych zmian (do ABC, bez implementacji)

P1 (L1): w `diplomacy-display.ts` (lub przy etykiecie relacji w UI) pokazać „Rozejm do tury N” gdy `truceUntilTurn` jest ustawione; „Pokój” zostaje dla pokoju stałego. Zmiana UI, bez zmian reguł.
P2 (L3): potwierdzić regułę akceptacji po rozejmie (80%/20%) albo zmienić na symetryczną.
P3 (L2/L4): ujednolicić licznik rund (powiadomienie `main.ts:19057` vs karta audiencji `diplomacyAudience.ts:1968–1971`) i dopisać długość rozejmu / turę wygaśnięcia do komunikatu z `truceEndTickPair`. Źródło zrzutu „runda 1/3” jest już znane (`main.ts:19057`).

## 6. Pytania ABC do właściciela (propozycja)

A) Czy pokazywać na relacji „Rozejm do tury N” (P1)? Rekomendacja: TAK.
B) Czy reguła akceptacji pokoju po rozejmie (proponujący ≥20% słabszy) ma zostać, czy być symetryczna? Rekomendacja: zostawić, potwierdzić jako decyzję właściciela.
C) Licznik rund „runda 1/3” w powiadomieniu (od rundy 1, `main.ts:19057`) i „Kontroferta 2/3” na karcie audiencji (od rundy 2) — ujednolicić, czy zostawić? Rekomendacja: ujednolicić na jedną formę (np. zawsze „runda n/3”), bo źródło zrzutu jest już znane (zrzut pochodzi z powiadomienia `main.ts:19057`).
