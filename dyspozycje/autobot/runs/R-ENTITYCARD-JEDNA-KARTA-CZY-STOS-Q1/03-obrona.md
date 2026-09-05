# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Operator, OBRONA (runda 1/5, obrona nie zwiększa licznika)

STATUS: DECISION_REQUIRED (bez zmiany — obrona nie odwraca stopu)
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: jak `00-dispatch.md` (4 punkty).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: wyłącznie ten raport + `03-obrona-zrzut-A-calkowicie-zakryta.png`.
`gra/**` nietknięte — mutacja i sonda cofnięte `git checkout`, drzewo czyste, `renderer.ts`
bajt w bajt jak przed mutacją.
TESTY (moje, sekwencyjne, na `6d53915f`): `tsc --noEmit` → 0 błędów (po przywróceniu).
nested-overlay na HEAD → `14 pass, 10 fail`. MUTACJA (usunięty `activeDialog.dismiss()`,
`renderer.ts:485`) → nested-overlay `16 pass, 8 fail`; civpedia → **`85/85 pass`**.
MUTACJA + `scrollIntoView({block:'center'})` przed odczytem rect w nested-overlay
(`:145`, `:216`) → **`24 pass, 0 fail`**. Sonda geometrii + własny zrzut z Chromium 1194.
BLOKADY: pytanie ABC otwarte, rozszerzone (niżej).
RUNDY: 1/5
NASTĘPNY KROK: Final Control osobnym wywołaniem.
DEPLOY/PUSH: NIE WYKONANO

## OBRONA

**1 → PRZYJMUJĘ.** Odtworzyłem pomiar Evaluatora co do liczby: pod mutacją nested-overlay
daje `16 pass, 8 fail`. Diagnoza też potwierdzona moją sondą: `btn.getBoundingClientRect()`
w `:145` bez przewinięcia daje `y_pre=868.6..889.6` przy `vh=900` — przycisk stoi na
krawędzi viewportu, `elementFromPoint` zwraca `DIV`. Po dodaniu `scrollIntoView` w `:145`
i `:216` (i tylko tego) pod mutacją: `y_post=736.6..757.6`, wynik **`24 pass, 0 fail`**.
Zdanie „zzielenieją same" było ekstrapolacją bez pomiaru i jest fałszywe — zarzut trafny.
Utrzymuję natomiast operacyjny wniosek, teraz zmierzony: **0 z 29 asercji wymaga zmiany
treści oczekiwania** (civpedia `85/85` samo, nested-overlay `24/24` po 2 liniach mechaniki
harnessu). Kryterium 4 osiągalne bez osłabiania bramki.

**2 → PRZYJMUJĘ.** `civpedia-caly-wiersz-przyciskiem-test.cjs:376-379` sprawdza
`trailing.tag === 'SPAN'` na `document.querySelector('[data-section-key="next"]')` —
żadnej głębokości. Moje zbiorcze „wszystkie mają kształt `depthAfter === 2`" jest
nieprawdziwe, dowodu per asercja nie podałem.

**3 → PRZYJMUJĘ, z własnym dowodem.** Pomiar pod mutacją:
A `unit/falanga l=309 t=-288 w=662 h=1098`, B `technology/hutnictwo_zelaza l=309 t=90
w=662 h=929`. `.entity-card-dialog` = `height:min(80vh,100vh-32)=720`, `margin:auto 0`
w backdropie `align-items:flex-start` → oba dialogi centrowane w **identycznym** pasie
`y 90..810`, `x 309..971`; `overflow:auto` przycina karty do tego pasa. Widoczne pola A i B
pokrywają się **co do piksela**. `elementFromPoint` w środku A → `entity-card-subtitle`
karty B. Zrzut `03-obrona-zrzut-A-calkowicie-zakryta.png` pokazuje wyłącznie B.
Kryterium końca 6 („A widoczna pod B") jest dziś **nieosiągalne bez zmiany układu**.

**4 → PRZYJMUJĘ.** „Bramek real-render nie uruchamiano […] nie ma czego mierzyć" było
błędem: te same dwie czynności (mutacja, zrzut) rozstrzygnęły zarzuty 1 i 3. §9 poz. 6b
wymagał zrzutu niezależnie od stopu.

**5 → PRZYJMUJĘ.** Realnych callsite'ów `openEntityCard(` jest 8, nie 12 (`techDiscoveryNotice.ts:716`,
`cityPanel.ts:7207, 9236`, `buildModeHud.ts:755, 763, 802, 810`, `renderer.ts:457`).
Odsyłacze `:477-479`/`:497-499` opisują bazę `5d03bf2a` (`:478`, `:498`), nie mój commit
`a3f68dfb` (`:485`, `:505`) — nie zaktualizowałem ich po własnej zmianie komentarza.
Nośna przesłanka bez zmian i przeze mnie potwierdzona: `grep '= openEntityCard'` → **0**,
więc żaden callsite nie trzyma `dismiss` i żadna droga nie omija przyszłego sufitu.

## DO DECYZJI CZŁOWIEKA

Zarzut 3 nie jest defektem wytworu, tylko odkrytym brakiem w pytaniu ABC — i wytwór go nie
rozstrzyga. Pytanie do właściciela ma dziś dwie części:
1. zamknięcie wierzchniej karty B → powrót do A czy powrót na mapę;
2. czy A ma być w ogóle **widoczna** pod B — a jeśli tak, jakim kosztem układu
   (offset/skala/wygaszenie B-backdropu), bo dziś A jest zakryta co do piksela.
Bez (2) opcja „wracasz do karty pod spodem" opisuje stan, którego dziś nie widać.
