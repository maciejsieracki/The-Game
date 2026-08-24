# RAPORT — Final Control, runda 1/5

```
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T1
GOAL: Zbudować dwa nowe, dedykowane modele 3D — Konnica lancowa asyryjska i
      Konnica łucznicza asyryjska (Żelazo, Asyria) — zamiast generycznego
      fallbacku `case 'konnica'`, historycznie uzasadnione. Zgodny z
      00-dispatch.md — bez rozjazdu (potwierdzone niezależnie).
ZMIANY/COMMIT: własny, trzeci worktree `/home/user/wt-fc-ZELAZO-T1`
      (origin/autobot/ZELAZO-T1-Q1, detach, c41acac7). `git diff
      <merge-base da776f8d>..c41acac7 --stat` = dokładnie 3 pliki, wszystkie
      w allowliście, `+1471/-0`, `git diff --check` czyste. `units.ts`:
      wyłącznie 2 importy + 2 gałęzie dispatchu PRZED `case 'konnica'`
      (~linia 3202, nietknięty). Zero sekretów w diffie.
TESTY (uruchomione przeze mnie od zera, trzeci niezależny komplet):
  - `tsc --noEmit` (v5.9.3, symlink node_modules z main): 0 błędów.
  - `vite build` (binarka bezpośrednio, `--outDir /tmp/civ-zelazo-fc-dist`):
    OK 30.5s; bundle niesie „assyrian lancer"/„assyrian horse archer" po 1×;
    `data/units.json` md5 identyczne przed/po (bez efektu ubocznego).
  - 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
    unit-replace 13/13, combat 6/6 — zgodne z punktem odniesienia.
  - Real-render Operatora, uruchomiony przeze mnie samodzielnie: 25/25 PASS,
    w tym (A1-A4) łucznik=łuk/kołczan/ZERO lancy, lancer=lanca+tarcza/ZERO
    łuku, (D0-D5) dowód nietautologiczności (mutacja w locie czerwieni
    dokładnie asercje A1-A4, obie jednostki spadają na meshCount fallbacku),
    (E1-E4) proporcje potwierdzone (0.869/0.863×HEX_R wys., 0.435×HEX_R
    promień, minY=0). Przeczytałem cały skrypt testowy — asercje mierzą
    realną strukturę Three.js (nazwane mesh, bounding box), nie treść źródła.
  - `units.json`: potwierdzone bezpośrednio z pliku — lancowa Atak
    dystansowy=0/Uwagi „lanca+tarcza", łucznicza Atak dystansowy=6/Zasięg=2/
    Uwagi „łuk kompozytowy", obie Epoka=Żelazo, Kultura=Asyria,
    Tech=Hutnictwo żelaza. Zgodne z twierdzeniami obu raportów.
  - Historia (Z1-Z9): brak strzemion i sztywnego siodła poprawne dla
    Neo-Asyrii (900-600 p.n.e.), przejście par jeźdźców→samodzielnych
    łuczników konnych na reliefach Aszurbanipala udokumentowane, konie
    nisejskie/Media-Urartu poświadczone klasycznie — bez anachronizmów
    wykrytych.
BLOKADY:
  1. **Naruszenie granicy §9 poz. 6(b), potwierdzone niezależnie.**
     `00-dispatch.md` wprost: „Model/effort: Opus 5 High dla Operatora i
     Evaluatora (temat czysto wizualny, §5a)". ECHO właściciela w
     `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md` (rejestr, wiersz
     `R-ZELAZO-MODELE-BRAKUJACE-Q1`): „wszystkie 6 dostają nowe, dedykowane,
     historycznie uzasadnione modele **w stylu serii Opus 5**" — dosłowna
     prośba właściciela, nie tylko odczyt §5a. Dodatkowo (rząd 2 źródeł,
     `docs/archiwum-procesu/PAKIET-2-...md:216-237`): historyczna, osobna
     reguła „modele 3D jednostek i cała praca w `gra/src/render/**` idą na
     Opus 5" — cytat Macieja: „Sonnet sobie z tym nie poradzi" — którą §5a
     wprost NIE zastępuje („obie mogą obowiązywać jednocześnie"). Operator
     i Evaluator oboje uruchomieni jako Sonnet 5 zamiast Opus 5 — potwierdzone
     przez nich środowiskiem wykonawczym, nie z pamięci. §9 nagłówek:
     naruszenie = natychmiastowy FAIL niezależnie od jakości reszty pracy.
  2. Drugorzędne: `01-operator.md`/`02-evaluator.md` nie zapisane w
     `dyspozycje/autobot/runs/<ID>/` (tylko `00-dispatch.md` na dysku) —
     do uzupełnienia przy zamknięciu rundy, nie blokuje samo w sobie.
RUNDY: 1/5 (zużyta).
NASTĘPNY KROK: Runda 2, TEN SAM ID i TA SAMA gałąź (`autobot/ZELAZO-T1-Q1`),
      Operator + Evaluator dispatchowani JAWNIE na Opus 5 High (parametr
      `model` dostępny w narzędziu dispatchu — gap C-061 dotyczy `effort`,
      nie `model`, więc to jest naprawialne bez decyzji właściciela).
      Biorąc pod uwagę zmierzoną wysoką jakość istniejącej pracy — Operator
      rundy 2 MOŻE zweryfikować/dopracować istniejący
      `zelazo-konnica-asyryjska-opus5.ts` na Opus 5 zamiast zaczynać od
      zera (§3a: „precyzyjna poprawka, nie zlecenie od nowa"), pod warunkiem
      że raport jawnie potwierdzi model wykonawczy. Osobno: zarejestrować
      temat PROCESS o dyscyplinie ustawiania `model` przy dispatchu Ścieżki B
      (rekomendacja obu ról, zasadna — to nie pierwszy taki incydent, C-061).
DEPLOY/PUSH: NIE WYKONANO. Gotowość do integracji: **NIE**.
```

## Uzasadnienie werdyktu (nie mikro-fix)

Ocena `PASS-WITH-NOTES` obu ról jest technicznie w pełni potwierdzona — GOAL,
dowód (25/25 real-render + dowód nietautologiczności), 5 bramek referencyjnych
i `tsc`/`vite build` są zielone na moim własnym, trzecim, niezależnym
uruchomieniu. Problemem nie jest jakość wytworu, tylko że nota Operatora i
Evaluatora dotyka wprost granicy nienaruszalnej §9 poz. 6(b) — a §3b jest
jednoznaczny: taka nota **nie kończy procesu** i wraca „dokładnie jak przy
FAIL". To nie jest przypadek `DECISION_REQUIRED` w duchu C-054, bo naprawa
NIE wymaga decyzji właściciela — parametr `model` (w odróżnieniu od `effort`,
faktycznego gapu C-061) jest dostępny w narzędziu dispatchu; to jest błąd
doboru parametru przy dispatchu, poprawialny w kolejnej rundzie tego samego
ID. Nie jest to też mikro-fix, który mógłbym zaaplikować sam — wymaga
faktycznego ponownego wykonania roli Operator/Evaluator na właściwym modelu,
czyli pełnej rundy 2.