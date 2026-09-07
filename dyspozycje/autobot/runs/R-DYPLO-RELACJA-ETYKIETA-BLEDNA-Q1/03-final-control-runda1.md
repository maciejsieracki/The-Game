STATUS: PASS
DOMAIN: GAME
TEMAT: R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1
GOAL: Wiersz „Wpływ Relacji na deal" dla POKOJU pokazuje realną relację użytą do modyfikatora
PW, nie stałe „Relacja 100", bez ruszania `canAccept`.

ROLA: Final Control — niezależna kontrola wyrywkowa commitów Operatora (6845b72d) i
Evaluatora (0443074c), worktree `/home/user/wt-dyplo-relacja-etykieta`, gałąź
`autobot/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1`. Evaluator zwrócił PASS bez zarzutów — poniżej
własna, niezależna weryfikacja, nie ślepe zatwierdzenie.

WERYFIKACJA PUNKTÓW ZLECENIA:

(a) `relCurrent` = ta sama wartość co modyfikator PW — POTWIERDZONE źródłowo (odczyt kodu,
nie tylko raport). `computePeaceAcceptanceSides()` (`diplomacy-acceptance-points.ts:192-292`)
liczy `playerTreatyPw = treatyPwForRole(treatyBase, relTotal, 'player')` (linia 200) i
`partnerTreatyPw = treatyPwForRole(treatyBase, relTotal, 'partner')` (linia 201) z parametru
`relTotal`. Diff Operatora dodaje wyłącznie `relCurrent: relTotal,` w `buildPlayerSide`
(linia 257) i `buildPartnerSide` (linia 276) — identyczny parametr wejściowy, zero drugiej
ścieżki/przeliczenia. Dla scenariusza ze zrzutu (relSigned=-71 → relTotal=29, treatyBase=500):
playerTreatyPw = round(500×0,29) = 145 (zgadza się z „145 PW" ze zrzutu), relCurrent (obie
strony) = 29 — zgodne z kryterium końca (~29, nie 100).

(b) `canAccept`/bramka bilansu PW dla pokoju NIETKNIĘTA — POTWIERDZONE dwutorowo:
  - `git diff <merge-base> HEAD -- gra/src/ui/diplomacyAcceptanceBalance.ts` → PUSTY diff,
    plik w ogóle nie występuje w commitach tego tematu.
  - Odczyt na żywo (HEAD): `canAccept = blockReason == null` (linia 379); wyjątek dla pokoju
    `row.responderPreview.pwBalance < 0 && blockReason == null && row.uiActionId !== '10'`
    (linia 366) — blokada jest bezwarunkowo pomijana dla `uiActionId==='10'` (pokój),
    dokładnie jak w kanonie P-DYPLO-BILANS-GATE runda 4. Bez zmian.

(c) Diff wyłącznie allowlista — POTWIERDZONE niezależnie. `git merge-base HEAD origin/main`
= `3f7c68e3` (zgodne z deklaracją Operatora/Evaluatora o rebase). `git diff --stat 3f7c68e3
HEAD -- .`:
  - `gra/src/game/diplomacy-acceptance-points.ts` | 2 +
  - `gra/tools/dyplo-rel-current-etykieta-test.cjs` | 141 +++...
  - 3 pliki raportów w `dyspozycje/autobot/runs/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1/`
  Zero innych plików. `git diff --check 3f7c68e3 HEAD -- .` — czysto (brak whitespace errors).
  Zgodne z allowlistą co do litery.

(d) Testy uruchomione SAMODZIELNIE (nie tylko odczytane z raportów):
  1. `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) — 0 błędów, exit 0.
  2. `node tools/dyplo-rel-current-etykieta-test.cjs` — 5/5 PASS, exit 0 (w tym kontrola
     nietautologiczna zweryfikowana odczytem wyjścia).
  3. WSZYSTKIE pozostałe istniejące bramki `gra/tools/dyplo-*.cjs` +
     `granice-relacja-dyplomatyczna-test.cjs` uruchomione SAMODZIELNIE — UWAGA METODOLOGICZNA:
     raport Evaluatora mówi „10 plików", ale faktyczny stan `gra/tools/` to 15 plików
     pre-egzystujących (14 `dyplo-*.cjs` + `granice-relacja-dyplomatyczna-test.cjs`, nie
     licząc nowego `dyplo-rel-current-etykieta-test.cjs`) — Evaluator w swoim raporcie
     6 z nich w ogóle nie wymienił i (wg dostępnych dowodów) nie uruchomił:
     `dyplo-karta-decyzji-bilans-skrot-real-render-test.cjs`,
     `dyplo-mapa-odkrycie-live-test.cjs`, `dyplo-pakt-ekspansja-granica-test.cjs`,
     `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`,
     `dyplo-sojusz-widocznosc-ciagla-live-test.cjs`,
     `dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs`. Uruchomiłem te 6 SAMODZIELNIE
     (kolejno, nie równolegle — dwa pierwsze uruchomienia równoległe dały fałszywy crash
     Playwright „Target page, context or browser has been closed" z powodu współdzielenia
     zasobów Chromium; powtórzone sekwencyjnie dały wynik miarodajny):
       - `dyplo-pakt-ekspansja-granica-test.cjs` — 26/26 PASS
       - `dyplo-karta-decyzji-bilans-skrot-real-render-test.cjs` — 4/4 PASS
       - `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` — 23 PASS, 0 FAIL
       - `dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs` — 76 pass, 0 fail
       - `dyplo-sojusz-widocznosc-ciagla-live-test.cjs` — 38 pass, 0 fail
       - `dyplo-mapa-odkrycie-live-test.cjs` — 9 pass, 1 fail (patrz niżej — zweryfikowano
         jako przedistniejące, niezwiązane z tym tematem)
     Dodatkowo powtórzyłem SAMODZIELNIE (nie tylko zaufałem raportowi Evaluatora) 8 bramek,
     które Evaluator już uruchomił: `dyplo-bilans-gate-n-e1-reprodukcja-test.cjs` (22/22),
     `-runda2-test.cjs` (24/24), `-runda3-test.cjs` (27/27),
     `dyplo-handel-oferta-ai-blokowana-test.cjs` (20/20 OK),
     `dyplo-kara-granica-realna-test.cjs` (10/10 OK),
     `dyplo-karta-decyzji-bilans-skrot-test.cjs` (13/13 PASS),
     `dyplo-karta-duplikat-komunikat-test.cjs` (15/15 PASS),
     `granice-relacja-dyplomatyczna-test.cjs` (52/52 PASS) — wszystkie wyniki identyczne z
     raportem Evaluatora.

  WERYFIKACJA PRZEDISTNIEJĄCEGO CZERWONEGO STANU (REGUŁA PRZECIW SAMOOSZUKIWANIU — nie ufać
  zapewnieniu Evaluatora, zweryfikować osobiście):
  a) `dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` na HEAD (0443074c): 22/26 PASS —
     zgodne z raportem Evaluatora. Utworzyłem OSOBNY `git worktree add /tmp/verify-base-fc
     3f7c68e3` (baza SPRZED tego tematu, node_modules dowiązany symlinkiem, usunięty po
     weryfikacji razem z worktree), uruchomiłem TEN SAM test na bazie: 22/26 PASS —
     IDENTYCZNY wynik. Porównałem listę FAIL linia-po-linii (`diff` treści FAIL między
     bazą a HEAD) — bit-identyczne (4 te same asercje o progu paktu nieagresji/„Pakt
     nieagresji na 15 tur" vs oczekiwane „Relacja zbyt niska…"+próg 130), zero różnicy.
     POTWIERDZONE: to defekt przedistniejący, NIE regresja wprowadzona tym tematem.
  b) DODATKOWO, poza zakresem żądanym wprost w zleceniu, ale wykryte przy uruchamianiu
     WSZYSTKICH bramek (punkt d): `dyplo-mapa-odkrycie-live-test.cjs` dał 9 pass, 1 fail na
     HEAD (test 5 „Umowa szlaków": `{"ok":false,"stage":"click","clickRes":{"clicked":false,
     "disabled":true}}`). Ten test nie był wspomniany w raporcie Evaluatora (patrz uwaga
     metodologiczna wyżej), więc zweryfikowałem SAMODZIELNIE tą samą metodą (osobny worktree
     `/tmp/verify-base-fc2` @ `3f7c68e3`, sekwencyjnie, nie równolegle) — na bazie: 9 pass,
     1 fail, TA SAMA nazwa testu, TEN SAM komunikat błędu. POTWIERDZONE: przedistniejący,
     niezwiązany z `computePeaceAcceptanceSides`/etykietą Relacji, nie blokuje tego tematu.
     Oba worktree weryfikacyjne (`/tmp/verify-base-fc`, `/tmp/verify-base-fc2`) usunięte po
     użyciu (`git worktree remove --force`); żadne pozostałości nie trafiły do repo.

  Uwaga dot. artefaktów pobocznych: uruchomienie bramek `*-real-render-test.cjs`/`*-live-
  test.cjs` (Playwright, realne zrzuty) nadpisało w drzewie roboczym istniejące pliki PNG w
  `dyspozycje/autobot/runs/{P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1,R-DYPLO-MAPA-ODKRYCIE-PRZY-
  TRAKTACIE-Q1,R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1,R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1,
  R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1}/dowody/` (binarnie inne, treściowo te same
  dowody innych, już zamkniętych tematów — poza allowlistą tego tematu). Odrzucone przez
  `git checkout -- <te ścieżki>` PRZED tym commitem — `git status` czysty, zero zmian poza
  tym raportem.

ZARZUTY: brak.

ZMIANY/COMMIT: bez zmian w kodzie gry (Final Control nie modyfikuje `gra/`) — wyłącznie
ten raport, allowlista `dyspozycje/autobot/runs/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1/*`.
Zweryfikowane commity: `6845b72d` (Operator), `0443074c` (Evaluator).

TESTY: patrz sekcja (d) wyżej — tsc czysto; nowa bramka 5/5; wszystkie 15 pre-egzystujących
bramek `gra/tools/dyplo-*.cjs`+`granice-relacja-dyplomatyczna-test.cjs` uruchomione
samodzielnie (nie tylko 9 z raportu Evaluatora); jedyne dwa czerwone wyniki
(`dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` 22/26,
`dyplo-mapa-odkrycie-live-test.cjs` 9/10) zweryfikowane jako bit-identyczne z bazą
`3f7c68e3` sprzed tego tematu — nie regresja.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only) → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
