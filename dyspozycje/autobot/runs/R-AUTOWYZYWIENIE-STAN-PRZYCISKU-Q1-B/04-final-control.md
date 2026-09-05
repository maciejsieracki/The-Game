# R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — Final Control (sędzia §3c), runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B
MODEL+EFFORT: Sonnet 5, effort high
GOAL: stan przełącznika wyżywienia czytelny bez klikania — aktywny świeci, nieaktywny
wygaszony. GOAL, ID i licznik rund zgodne w 01/02/03 (§16b pkt 1-2, 5).

ZMIANY-COMMIT: `4b0aeec5` + `c4653cce`, baza `bec25312` (= `merge-base origin/main HEAD`).
Allowlista dotrzymana: `cityPanel.ts` (26 linii), nowa bramka, katalog runu. **`empire-food.ts`
i `main.ts` — ZERO zmian.** Węzeł A `empire-food.ts` jest już w `origin/main` (+342/−100),
a gałąź B go nie dotyka, więc `merge --no-ff` go nie cofnie. Diff to wyłącznie CSS +
`classList`/`dataset`; `onCityAutoWyzywienieChange` i `onToggle` nietknięte — **logika
przełączania niezmieniona**. `git diff --check` czysty.

TESTY (własne, sekwencyjne): nowa bramka **90/90** · `tsc --noEmit` 0 błędów · pięć
referencyjnych 213/19/33/13/6 · panel miasta 29/83/35/12/37/637 · panel imperium
25/96/25/53/33. **Parytet czerwonych** po cofnięciu `cityPanel.ts` do bazy: 57/3, 6/2, 25/3 —
identyczne, pre-istniejące. Doszły **dwie niezadeklarowane przez nikogo**
(`empire-panel-moc-scroll-preserve` 38/9, `empire-panel-miasto-obywatele-content` 113/2) —
parytet ten sam, też pre-istniejące. Kryterium 3: na cofniętym `cityPanel.ts` bramka daje
39/25, exit 1.

**Własne mutacje — bramka mierzy RÓŻNICĘ, nie obecność klasy.** (a) obie połówki dostają
`active` → exit 1, 20 FAIL w blokach (B)/(C), diagnostyka `{"auto":true,"ind":true}`;
(b) reguła `.hbtn.off` obecna, ale wizualnie pusta → exit 1, 13 FAIL, blok (E) SEDNO
(`getComputedStyle` w żywym Chromium) dla **wszystkich trzech** kontrolek.

**Inwentaryzacja — szukałem sam.** `appendIndywidualneToggle`: 3 wywołania (`cityPanel.ts:4511`,
`:4975`, `:5223`) + `autoBtn` `:5180` = cztery. Jedyny inny `classList.add('active')` w pliku to
`cs-manager` `:11496` (piąta, zarejestrowana osobno); `cs-rename`/`cs-artview` to akcje bez
stanu. **Szóstej nie ma.**

**Wizualnie (§9 poz. 6b).** W trybie auto „Auto Wyżywienie" świeci, trzy „Indywidualne"
wygaszone; w trybie indywidualnym odwrotnie. Na `przed-miasto-auto.png` stan WYŁ jest nie do
odróżnienia od zwykłego przycisku — różnica czytelna bez znajomości kodu. Drzewo przywrócone,
`git status` pusty.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

**1 → ODDAL.** Orzekam wobec kryterium **UCHYLONEGO**. Potwierdziłem sam:
`empireDetailPanel.ts:172-187` renderuje jednorazową AKCJĘ `civ-emp-autofeed-btn`, bez odczytu
stanu i bez `aria-pressed`/`active`/`off`; `EmpireFoodCityUiRow` (`empireDetailTypes.ts:531-539`)
nie niesie `autoWyzywienie`; zrzut pokazuje jeden przycisk. Dwa stany nie istnieją, więc
identyczny md5 jest **dowodem tego faktu**; blok (G) pinuje to 5/5. Nie `DO DECYZJI CZŁOWIEKA`
— ECHO właściciela („2+3") i osobny temat są dowodem rozstrzygającym (§3c pkt 3).

**2 → ODDAL.** Zarzut trafny, **naprawiony w tej samej rundzie**: 57/57 → **90/90**; bloki (C2)
pokrywają Skarbiec+Nauka i Pracę na realnych builderach, (D) XOR na 8 stanach. Moje mutacje
czerwieniły te bloki, więc pokrycie jest realne, nie deklarowane.

**3 → ODDAL.** Nota opisuje **realną** wadę: `cs-manager` (`:9871`) czyta trwały stan
`isAutoManageEnabled` (`:11495`, źródło `main.ts:6598`, utrwalany `:27250`), a gałąź `else`
(`:11499`) robi tylko `classList.remove('active')`. Nienaprawianie (C-025) i niewpisywanie
do rejestru spoza allowlisty jest **prawidłowe** wg §14; wpis jest już na `origin/main:5053`
(§16b pkt 6).

**4 → ODDAL.** `wc -w`: `01-operator.md` **604 → 402** słowa, ze śladem korekty (§13b pkt 2).

**AGREGAT (§16b pkt 8): zero `NAPRAW`, zero `DO DECYZJI CZŁOWIEKA` → `PASS`.**

## NOTY (poza allowlistą — ręką orkiestratora, nie zmieniają agregatu)

- **N4.** `buildModeHud.ts:562,570,624,640,646` — pięć przełączników w konwencji „tylko
  `.active`"; przypadek słabszy niż `cs-manager` (bazowy `.civ-build-hbtn` już przygaszony,
  każdy niesie `aria-pressed`), ale warty dopisania do
  `R-ZARZADCA-AUTOMATYCZNY-STAN-PRZYCISKU-Q1`.
- **N5.** Dwie czerwone bramki z pola TESTY nie figurują w żadnym raporcie ani rejestrze.
- **N6.** Limit §11 („ok. 400 słów"): `02-evaluator.md` 542, ten raport 501 — w obu wypadkach
  `PASS-WITH-NOTES`, nie `FAIL`; zgłaszam też własne przekroczenie, nie tylko cudze.
