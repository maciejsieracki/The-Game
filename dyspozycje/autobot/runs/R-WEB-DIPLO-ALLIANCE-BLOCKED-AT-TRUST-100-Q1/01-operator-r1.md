STATUS: DECISION_REQUIRED (GOAL: próg = polityka) + PASS (DODATEK 1: błąd spójności emblematu naprawiony)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-BLOCKED-AT-TRUST-100-Q1
GOAL: ustalić co blokuje sojusz przy Zaufaniu 100 / Respekcie 48; pokazać powód; ujednolicić emblemat "Sojusz" z listą sojuszy
ZMIANY/COMMIT: gra/src/game/diplomacy.ts (+relationTierDisplay), gra/src/main.ts (3 miejsca tieru UI + hasAllianceDealBetween, import), gra/tools/diplo-alliance-gate-test.cjs (nowy); SHA: commit "R-WEB-DIPLO-ALLIANCE-BLOCKED-AT-TRUST-100-Q1 r1" na gałęzi worktree (SHA w odpowiedzi końcowej)

## 1. Diagnoza GOAL (Zaufanie 100, Respekt 48, Relacja 148/200, Pakt o nieagresji, wojna Sumer-Egipt)
Relacja = Zaufanie*mnoznikZaufania + Respekt*mnoznikRespektu (relationScore) = 100+48 = 148.

| warunek (diplomacy-proposals.ts case sojusz_*, diplomacy-locks.ts case '3') | wartość | wynik |
|---|---|---|
| Wiarygodność >= wiarygodnoscProgSojuszMin | próg 0 | OK |
| Zaufanie >= minZ (progSojuszZaufanie 91, po ulgach/karach siły) | 100 | OK |
| Relacja >= max(progUmowaMinRelacja 151, progSojuszRelacja 151 - ulga + kara + delta agresora) | 148 < 151 | BLOKADA (jedyna pewna w tym scenariuszu) |
| Hegemon (milRatio <= progSojuszHegemonMilRatio 0.42) | brak danych ze zrzutu | NIE_ZMIERZONO |
| Za słaby proponent (milRatio<0.5, respekt<=, score<151) | j.w. | NIE_ZMIERZONO |
| willingnessAlly >= progSojuszWillingnessMin 0.68 | nieznane | NIE_ZMIERZONO |
| Czas paktu NAP, wspólny wróg, wojna AI z trzecią stroną, limit sojuszy, bramka epoki/techu, cooldown | brak takiej bramki w kodzie sojuszu | nie blokują |

Wniosek: blokada NIE jest błędem kodu — to zamierzony próg Relacji 151 (twarda podłoga progUmowaMinRelacja, premia siły jej NIE obniża). Brakuje 3 pkt; przy +8,3/turę próg zostanie osiągnięty w następnej turze (o ile Zaufanie nie spadnie). Wojna Sumeru z Egiptem sojuszu NIE blokuje.

UI już pokazuje powód po polsku (diplomacy-locks.ts dualGate): "zablokowana — wymaga Relacji 151 (masz 148)" — potwierdza to test (A). Luka (nie naprawiana, brak danych/poza zakresem): blokady siłowe (hegemon / słaby proponent / gotowość) wychodzą dopiero jako odpowiedź na propozycję, nie w kafelku.

DECISION_REQUIRED (progi wyłącznie w data/diplomacy.json; ABC zadaje orkiestrator):
- A) zostawić 151 (rekomendacja: gracz dochodzi do progu w 1 turę; sojusz ma być nagrodą)
- B) obniżyć progSojuszRelacja i progUmowaMinRelacja do ~146 — wcześniejszy sojusz, ale progUmowaMinRelacja jest wspólny dla wszystkich dobrowolnych umów (wpływ na AI i balans)
- C) Zaufanie ponad progSojuszZaufanie obniża wymagany próg Relacji (np. -3 za każde 5 pkt) — nowy parametr + zmiana w silniku

## 2. DODATEK 1 (emblemat SOJUSZ vs "Sojusze: brak")
Źródło prawdy sojuszu = activeDeals (traktat sojusz_pelny / sojusz_defensywny / SojuszWojskowy). Listy "Sojusze" i "W sojuszu z" liczy dealPartnerIdsForOwner z activeDeals; bramki wojny/handlu/ruchu też opierają się na activeDeals. Emblemat i "Relacja: Sojusz" brały tier z relationTier(rel), który zwracał 4 ("Sojusz") także dla samego score >= 151 bez traktatu oraz dla nieaktualnego rel.status='sojusz'. To był BŁĄD wyświetlania: osiągnięty próg sojuszu pokazywał się jako sojusz. W silniku sojuszu nie było.
Naprawa: relationTierDisplay(rel, hasAllianceDeal) — tier 4 tylko przy aktywnym traktacie sojuszu (wojna zawsze 0). main.ts: 3 miejsca (lista dyplomacji, podsumowanie pary, audiencja) używają go z hasAllianceDealBetween (activeDeals). Emblemat = lista = silnik. Przy score >= 151 bez sojuszu: "Przyjazny".
Czy sojusz został zawarty? Brak dowodu; "Sojusze: brak" zgadza się z silnikiem.

## TESTY
- node tools/diplo-alliance-gate-test.cjs: 12 PASS / 0 FAIL (lock 148 vs 151 + komunikat PL, odblokowanie przy 151, relationTierDisplay 6 przypadków, main.ts bez surowego relationTier i 3 użycia relationTierDisplay).
- diplomacy-locks-test.cjs, diplomacy-test.cjs: NIE_URUCHOMIONE (brak gra/node_modules w worktree). typecheck: NIE_ZMIERZONO (brak zależności). Zmiana addytywna, relationTier nietknięty.

BLOKADY: DECISION_REQUIRED (próg 151); orkiestrator/Evaluator uruchamia typecheck i testy dyplomacji w środowisku z node_modules.
UWAGA PROCESOWA: w kontekście pojawiła się wiadomość o niezanikających jednostkach z 0 HP — to inny temat (BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD, #142), adresowany do orkiestratora; nie wykonywane tutaj.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (typecheck + testy dyplomacji + ocena diagnozy); ABC właściciela ws. progu
DEPLOY/PUSH: NIE WYKONANO
