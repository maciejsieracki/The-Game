STATUS: PASS
DOMAIN: GAME
TEMAT: R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1
GOAL: Wiersz „Wpływ Relacji na deal” dla propozycji POKOJU ma pokazywać REALNĄ Relację
użytą do wyliczenia modyfikatora PW, nie stałe „Relacja 100”, bez ruszania `canAccept`.

PRZYCZYNA (potwierdzona źródłowo): `buildPlayerSide`/`buildPartnerSide` wewnątrz
`computePeaceAcceptanceSides()` (`gra/src/game/diplomacy-acceptance-points.ts`) budowały
`AcceptanceSideBalance` bez pola `relCurrent`. UI (`diplomacyAcceptanceBalance.ts:140,633`)
czyta `side.relCurrent ?? my?.relCurrent ?? 100` — dla pokoju zawsze `undefined` → zawsze 100.

NAPRAWA: dodane `relCurrent: relTotal,` w obu builderach (linie przy `relationModLabel`/
`treatyEffectivePn: partnerTreatyPw`), analogicznie do `computeSideBalance()` (linia 342:
`relCurrent: relTotal`), która ustawia TĘ SAMĄ wartość dla obu ról — `relTotal` jest
parametrem współdzielonym, nie zależy od roli player/partner.

UZASADNIENIE decyzji player vs partner (zażądane w dispatchu, nie zgadywane): partner PW
faktycznie jest liczone na bazie bez modyfikatora relacji (`partnerTreatyPw` w
`treatyPwForRole(..., 'partner')` — patrz dyspozycja), ALE analogiczna, już zintegrowana
funkcja `computeSideBalance()` i tak ustawia `relCurrent: relTotal` IDENTYCZNIE dla obu ról
(nie ma rozróżnienia player/partner przy tym polu — rozróżnienie jest tylko przy `modPct`/
`modLabel`, `treatyRole === 'player'`). Zachowano ten sam wzorzec: obie strony pokazują
realną relację 29, nie 100 — bo `relCurrent` to pole informacyjne „jaka relacja jest w tej
negocjacji”, nie „czy modyfikator zastosowano do tej strony” (to osobno komunikuje
`relationModLabel`, ustawiane WYŁĄCZNIE po stronie player, nietknięte tą zmianą).

LICZBY PRZED/PO (scenariusz relSigned=-71 → relTotal=29, treatyBase=500, `pokoj`,
`computePlayerAcceptanceSides('pokoj', {}, 29, false)`):
- PRZED: my.relCurrent=undefined, their.relCurrent=undefined → UI fallback → wyświetlane 100
- PO:    my.relCurrent=29, their.relCurrent=29 → UI wyświetla 29 (zgodnie z kryterium ~29)

`canAccept`/bramka bilansu PW dla pokoju NIETKNIĘTA — zero zmian w `peaceAccepted`,
`asymBalance`, `accepted` (P-DYPLO-BILANS-GATE runda 4 zostaje bez zmian).

ZMIANY/COMMIT: `gra/src/game/diplomacy-acceptance-points.ts` (2 linie, `buildPlayerSide`/
`buildPartnerSide`), nowy `gra/tools/dyplo-rel-current-etykieta-test.cjs` (bramka
diagnostyczna, node, bez przeglądarki — `computePlayerAcceptanceSides` to czysta logika).
SHA: patrz commit w tej gałęzi (worktree `/home/user/wt-dyplo-relacja-etykieta`).

TESTY:
1. `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) — czysto, 0 błędów.
2. `node tools/dyplo-rel-current-etykieta-test.cjs` (z `gra/`) — 5/5 PASS, w tym kontrola
   nietautologiczna (mutacja W LOCIE cofająca dokładnie te 2 dodane linie → `relCurrent`
   wraca do `undefined`, potwierdzając że test faktycznie zależy od naprawy, nie przechodzi
   niezależnie od stanu kodu).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
