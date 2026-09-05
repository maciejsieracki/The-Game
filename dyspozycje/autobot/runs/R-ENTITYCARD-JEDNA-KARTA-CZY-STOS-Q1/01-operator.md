# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Operator, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: `openDialog()` przestaje bezwarunkowo zamykać poprzednią kartę i egzekwuje sufit 2
(trzecia karta zamyka NAJSTARSZĄ); nowa bramka A→B→C; przegląd 29 czerwonych asercji;
naprawa martwego komentarza `renderer.ts:406-411`.
MODEL+EFFORT: Opus 5, effort high (C-052).
ZMIANY/COMMIT: `gra/src/ui/entityCards/renderer.ts` — wyłącznie komentarz (GOAL pkt 4);
ten raport. SHA w commicie rundy.
TESTY: `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów. Bramek real-render
nie uruchamiano — zachowania kodu nie zmieniono, nie ma czego mierzyć.
BLOKADY: decyzja właściciela (niżej).
RUNDY: 1/5
NASTĘPNY KROK: pytanie ABC; po ECHO runda 2 na tym samym ID i gałęzi.
DEPLOY/PUSH: NIE WYKONANO

## Dlaczego stop

Sufitu 2 nie da się wdrożyć bez rozstrzygnięcia, co znaczy zamknięcie karty wierzchniej.
Zostawienie dzisiejszego `dismiss()` **jest wyborem opcji A** — cichym, przez bezwładność.

- **A — zamknięcie B odsłania A.** Escape/klik w tło zdejmuje po jednej karcie; wyjście
  z obu to dwa gesty. Naturalne dla stosu.
- **B — zamknięcie B zamyka obie.** Jedno zamknięcie czyści ekran; karta A jest wtedy
  kontekstem pod spodem, nie miejscem powrotu.

Pytanie jest realne: bramka `entity-card-cross-links-nested-overlay-test.cjs:187-198`
**już zakłada opcję A** („Esc #1: B zdjęta, A zostaje"; „Esc #2: A też zamknięta").
Napisano ją pod stos nieograniczony, więc nie jest to decyzja właściciela.

## Rekonesans (do wykorzystania w rundzie 2)

**1. Wszystkie drogi zamykania karty — cztery, wszystkie w `renderer.ts`:** `openDialog`
:477-479 (bezwarunkowy `activeDialog.dismiss()`); `dismiss` zwracany z `openEntityCard` —
**żaden callsite go nie trzyma** (`grep '= openEntityCard'` → 0 trafień przy 12 wywołaniach);
klik w tło :497-499; Escape przez `pushOverlay` → `escapeOverlayStack` zamyka **tylko
wierzchnią** pozycję. Poza `renderer.ts` nic nie usuwa `.entity-card-backdrop` — sufit
domyka się w jednym pliku, żadna droga go nie omija.

**2. 29 czerwonych asercji: ZERO wymaga zmiany.** W obu plikach brak asercji na głębokość
> 2 (`grep '=== 3\|>= 3\|> 2'` → brak trafień); wszystkie mają kształt `depthAfter === 2`
po **jednym** kliku zagnieżdżonym, co jest zgodne z sufitem 2 — zzielenieją same.
Allowlisty na te pliki nie użyto.

**3. Zagrożenie spoza allowlisty:** `gra/tools/entity-card-single-dialog-real-render-test.cjs`
egzekwuje tezę odwrotną (K1 „dokładnie 1 backdrop, A już nie istnieje", K2a-c) i po
wdrożeniu sufitu zczerwienieje — nie ma go ani w allowliście, ani w kryteriach końca.
Osobno: jego asercja (0) w linii 155 żąda, by `git show HEAD:renderer.ts` **nie zawierał**
`activeDialog` — po scaleniu tamtej naprawy jest fałszywa, więc bramka jest strukturalnie
czerwona już na bazie 5d03bf2a. Runda 2 wymaga rozszerzenia allowlisty.

**4. GOAL pkt 4 wykonany** („niezależnie od reszty"). Komentarz opisuje teraz faktyczne
zachowanie (karta docelowa ZASTĘPUJE źródłową) z odnośnikiem do tego tematu.

## Czego nie zrobiono

Kryteria 1, 2, 3, 6 (A→B, A→B→C, nowa bramka, zrzut z Chromium) zależą od odpowiedzi —
bramka musi asertować zachowanie Escape i zamknięcia B, więc napisana teraz utrwaliłaby
mój wybór. Czerwonej bramki do repo nie dodano. Kryteria 7-8 nie mierzą nic nowego.

## Pytanie do właściciela

Gdy widzisz dwie karty naraz i zamykasz wierzchnią — chcesz **wrócić do karty pod spodem**
(wyjście z obu wymaga dwóch zamknięć), czy **od razu wrócić na mapę** (jedno zamknięcie
czyści ekran)?
