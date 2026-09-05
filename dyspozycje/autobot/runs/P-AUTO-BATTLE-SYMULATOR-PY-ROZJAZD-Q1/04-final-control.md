# P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — Final Control, runda 1/5

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1
MODEL+EFFORT: Sonnet 5, effort high
GOAL: `gra/tools/auto-battle-power.py` liczy to samo, co runtime TS
`gra/src/game/auto-battle-power.ts` na tym samym zestawie parametrów, a rozjazd
nie może się powtórzyć po cichu (zgodny co do słowa z `00-dispatch.md`).

## ZMIANY/COMMIT

HEAD `355f61f8` na bazie `5d03bf2a`. `git diff --name-status`: 5 plików, wszystkie
w allowliście (`.py`, nowa bramka, 3 raporty runu). **`gra/src/game/auto-battle-power.ts`
md5 `29848f09…` i `gra/data/auto-battle-params.json` md5 `d37d3113…` — identyczne z bazą
(§9, reguła „zakaz naprawy przez zmianę strony TS").** Żaden `gra/data/*` nie ruszony → brak
śladu `npm run build` (C-001). `00-dispatch.md` w `5d03bf2a`, GOAL i ID stałe we wszystkich
raportach; runda Obrony nie zwiększyła licznika (§16b pkt 5).

## TESTY (uruchomione przeze mnie, nie przepisane)

Bramka parytetu **150/0** · `tsc --noEmit` exit 0 · auto-battle-power 14/0 ·
monotoniczność 43/0 · logic 213/213 · tech-tree 19/19 · research 33/33 ·
unit-replace 13/13 · combat 6/6.
Kryterium 1 (sumy z `--resolve-json`): `0.3873 / 0.3656 / 0.3372 / 0.3045 / 0.2650 / 0.2300`.

Mutacja z zarzutu (`floor_pct = (L_MIN*1.2)/max(1,ratio)`) w **obu stanach bramki**:
wersja sprzed obrony (`c309fe88`) → **126 pass, 0 fail** (ślepa); wersja po obronie →
**134 pass, 16 fail**. Czerwienieją niezależnie oba elementy poprawki: suma
(`r=41821: TS=0.05 py=0.06`) i tolerancja względna (`lossDefPct r=41821:
TS=1.1955716…e-6 py=1.4346859…e-6`). Mutacje rundy 1 nadal czerwone: podłoga na
jednostce 108/42, podłoga przed zaokrągleniem 126/24.
Realność obu źródeł: tymczasowa mutacja **samego TS** (`p.L_MIN*1.2/sizeUnits`) → 134/16
z odwróconym znakiem różnicy, więc bramka bundluje żywy runtime, nie kopię; podmiana
`L_MAX` 0,42→0,30 w JSON → 144/6, czerwienieje wyłącznie kotwica, parytet zielony —
parametry czytane z pliku po obu stronach, nic nie zaszyte. Oba pliki przywrócone,
md5 zgodne, `git status` czysty.
Fałszywe czerwone od `REL_TOL=1e-9` — sonda własna, 2442 pomiary (podstawy 0,5–999,7,
`r` 1→1e6, progi 1863–1866, remisy, zera, obie orientacje): **maxAbs = 0, maxRel = 0,
0 rozjazdów werdyktu, 0 naruszeń tolerancji względnej**.

## BLOKADY

Brak.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora, potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

**1 → ODDAL.** Zarzut był trafny co do faktu — potwierdziłem go własną mutacją: bramka
sprzed obrony dawała 126/0 dokładnie tam, gdzie miała chronić. Obrona go PRZYJĘŁA i
domknęła w tej samej rundzie, a poprawka jest nośna i sprawdzona bezpośrednio w wytworze:
ta sama mutacja daje teraz 134/16, defekt łapią dwie niezależne asercje (suma składu
`lossPct × r` oraz zgodność co do bitu), bez fałszywych czerwonych na 2442 pomiarach.
W wytworze nie ma już czego naprawiać, więc `NAPRAW` (powrót do Operatora) byłby pusty;
nie ma też pytania o intencję, którą musiałby rozstrzygać właściciel.
