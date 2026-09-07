STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1

ZMIANY-COMMIT: Zweryfikowano samodzielnie (HEAD `0418ed7f`). Diff dokładnie 2 pliki,
+39/-3: `gra/src/main.ts` (2 linie) — `main.ts:10908` `!rep || rep.ownerId !== 0` →
`!rep || !isHuman(rep.ownerId)` wewnątrz `promptMergeIfCoLocated`; `main.ts:28907`
`ownerId === 0` → `isHuman(ownerId)` wewnątrz pętli auto-racjonowania.
`gra/tools/hotseat-etap3-akcesory-test.cjs` (+38, sekcje 7-8 + importy sentineli).
Wszystko w allowlist; `git diff --check` czyste; zero `git add -A`.

TESTY (uruchomione samodzielnie, identyczne z raportem Operatora): `npx tsc --noEmit`
0 błędów. `hotseat-etap1-ownerid-test` 14/14, `hotseat-etap3-akcesory-test` 64/64
(rozszerzona, było 52), `hotseat-human-owners-test` 29/29, `army-merge-colocated-test`
4/4, `army-merge-bounce-test` 4/4, `army-merge-separate-return-test` 16/16,
`army-merge-separate-return-mainguard-test` 73/73, `army-merge-stackgroupid-test`
11045/11045 (fuzz), `merge-decor-no-regress-test` 49/49, `empire-food-b5-test` 28/28.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control

ZARZUTY: brak

Szczegóły weryfikacji (nie zarzuty, dowód pracy):

(a) Semantyka obu podmian poprawna: `isHuman` (main.ts:10296, `return
isHumanOwner(humanSeats, ownerId)`) jest w zasięgu leksykalnym obu miejsc.
`humanSeats.humanOwnerIds = [HUMAN_OWNER_PRIMARY]`, `HUMAN_OWNER_PRIMARY = 0` — więc
`isHuman(id) === (id === 0)` dla całej domeny dziś, matematycznie.
`promptMergeIfCoLocated`: guard dotyczy „czy przenoszona jednostka należy do fotela
człowieka". `pendingAutoRationForNextTurn`: guard dotyczy „czy ten owner to fotel
człowieka, więc pokaż mu notyfikację HUD" — właściwe pytania.

(b) Zero próby przebudowy struktury `triggerPlayerEndTurn()` — potwierdzone (tylko 2
linie zmienione w main.ts).

(c) Dowód no-op realny: sekcje 7-8 rozszerzonej bramki testują `isHuman(id)===(id===0)`
dla pełnej domeny `[0, 1, 2, 42, BARBARIAN_OWNER_ID=-1, REBEL_FACTION_OWNER_ID=-99]`,
sentinele potwierdzone jako realnie osiągalne wartości ownerId.

(d) Świeży grep potwierdza dokładnie 2 miejsca zapisu zmienione i trzecie
(`deferredPlayerUnitRevealIds.add`, main.ts:30095, `if (city.ownerId===0)`) —
świadomie pominięte przez Operatora, odpowiada udokumentowanemu w recon „Ryzyko #4"
z INNĄ rekomendacją naprawy (struktura keyowana ownerem, nie prosta podmiana warunku)
— zgadzam się z decyzją pozostawienia poza tą rundą, nie jest to ten sam typ pracy.

(e) Wszystkie bramki uruchomione samodzielnie, wyniki identyczne z raportem Operatora.

DEPLOY/PUSH: NIE WYKONANO
