# 00-dispatch — R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1

TEMAT: R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1
GOAL: gdy blokujący paski „N karta(-y) wymaga(ją) decyzji" nad przyciskiem „Zakończ turę"
znika po wykonaniu decyzji, elementy w tym obszarze (przycisk „Wykonaj", pasek ostrzeżenia,
przycisk „Zakończ turę") NIE mają na siebie nachodzić/kolidować wizualnie.

## Zgłoszenie właściciela (2026-08-21, dwa zrzuty ekranu)

> Gdy się to wykona, to to znika, a nie powinno się na siebie najeżdżać. To się dzieje
> głównie wtedy, kiedy blokuje dalszą turę jakieś inne działanie. Na przykład trzeba
> wybudować budynki w mieście, albo jakieś miasto jest bez budynku.

Zrzut 1: pasek „⚠ 1 karta wymaga decyzji. WYKONAJ [1] Pokaż →" widoczny NAD złotym
przyciskiem „⚠ ZAKOŃCZ TURĘ" (oba w stanie „aktywne ostrzeżenie" — złota obwódka/ikona).
Zrzut 2 (po wykonaniu decyzji): pasek ostrzeżenia zniknął, ale w jego miejscu widać PUSTY,
wyszarzony prostokąt „WYKONAJ" (przycisk disabled bez odznaki liczby) — sam przycisk
„ZAKOŃCZ TURĘ" wrócił do normalnego (nie-ostrzegawczego) złotego stanu. Poniżej widać
etykietę tury („TURA 1 · 4000 P.N.E" lub podobną).

## Zakres kodu (punkt startowy recon — NIE zakładaj przyczyny, zweryfikuj)

`gra/src/ui/bottomBarHud.ts`, funkcja `render()` (linia ~181-236):
- Przycisk „Wykonaj" (`.wykonaj`, `data-wykonaj`) jest renderowany ZAWSZE, niezależnie od
  `wykOn` (`blocking > 0`) — gdy `wykOn` jest `false`, przycisk nadal istnieje w DOM, tylko
  z atrybutem `disabled` i bez klasy `.on`/odznaki liczby (linie 220-223). To może być
  ŚWIADOME (miejsce zarezerwowane w layoucie), ale zweryfikuj czy to jest zamierzone, czy
  to właśnie ten „pusty prostokąt" ze zrzutu 2, który zgłasza właściciel jako problem.
- `.et-hint` (pasek „N karta wymaga decyzji... Pokaż →", linie 206-212) jest renderowany
  WARUNKOWO (`showBlockSignal`) — gdy znika, `hintHtml = ''`. CSS: `position:absolute;
  bottom:calc(100% + ${HUD_GAP_PX}px)` (linia ~108) — pozycjonowany względem `.civ-bottom-bar`
  poza normalnym flow. Sprawdź czy usunięcie tego elementu z DOM (przy zmianie stanu z
  zablokowane→odblokowane) powoduje jakikolwiek problem z layoutem sąsiednich elementów
  (np. czy kontener `.civ-bottom-bar`/`.et-wrap` ma jawnie ustawioną wysokość zależną od
  obecności `.et-hint`, co mogłoby powodować „skok"/nachodzenie przy zniknięciu).
- Sprawdź też CSS przejść/animacji (`transition`) na tych elementach — jeśli jest animacja
  fade-out/slide, a element jest USUWANY Z DOM w trakcie (nie po zakończeniu animacji),
  to może dawać wizualny efekt „nachodzenia" w trakcie przejścia z jednego stanu do drugiego.
- `blockingHintText()`/`getBlockingTitles()`/`getBlockingCount()` (przekazywane przez
  `config`, wywoływane z `main.ts` lub `hud.ts`) — sprawdź jak często/kiedy `render()` jest
  wywoływane relatywnie do zmiany stanu blokady (np. czy jest re-render z opóźnieniem, przez
  co przez chwilę stary i nowy stan mogą się nałożyć).

## Reprodukcja

Scenariusz z zgłoszenia: miasto wymaga zbudowania budynku / jest bez budynku → karta
blokująca koniec tury → gracz wykonuje wymaganą akcję (np. buduje budynek) → karta znika.
Jeśli w tym środowisku dostępny jest skill `run` (uruchomienie gry w przeglądarce) — użyj go
do faktycznego odtworzenia scenariusza i zrobienia zrzutów PRZED i PO wykonaniu decyzji,
zamiast zgadywać z samego kodu. Jeśli nie masz takiej możliwości w tym środowisku, opisz to
jawnie w raporcie i oprzyj wniosek na dokładnej analizie DOM/CSS (jaki dokładnie stan DOM
powstaje bezpośrednio po zniknięciu `.et-hint`, klatka po klatce jeśli to możliwe).

## Ograniczenia

- Nie zmieniaj logiki WYKRYWANIA blokady (`getBlockingCount`/`canEndTurn` itp.) — to jest
  czysto wizualny/layoutowy problem przejścia między stanami, nie zmiana zasad blokowania
  końca tury.
- Zakres plików prawdopodobnie ograniczony do `gra/src/ui/bottomBarHud.ts` (markup + CSS) —
  jeśli recon wskaże że przyczyna leży gdzie indziej (np. w częstotliwości wywołań render()
  z `main.ts`), zgłoś to jawnie zamiast rozszerzać zakres bez potwierdzenia.

## Branch

`autobot/R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1` (z `main`).
