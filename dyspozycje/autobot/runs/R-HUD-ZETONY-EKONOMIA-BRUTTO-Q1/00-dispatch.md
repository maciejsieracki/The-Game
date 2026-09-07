STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1
GOAL: Trzy żetony HUD (Praca, Skarbiec, Nauka) na mapie świata + nagłówki analogicznych
sekcji w panelu szczegółów imperium (`empireDetailPanel.ts`) mają pokazywać ŁĄCZNY
PRZYROST (brutto, przed odjęciem kosztów/drenaży), NIE wartość netto jak dziś. Redukcja
do finalnego wyniku netto (który faktycznie trafia do puli) ma być widoczna WYŁĄCZNIE
w rozpisce/tooltipie/szczegółach, nie na samym symbolu/nagłówku. Liczba zapasu (np.
"48" przed "+X") ZOSTAJE bez zmian — to już dziś poprawny, finalny stan puli.

ECHO WŁAŚCICIELA (żywa rozmowa 2026-09-07, wiążąca decyzja, ŚWIADOMIE ODWRACA
wcześniejszą decyzję na TO SAMO pytanie — patrz UWAGA niżej):
> "Wydaje mi się, że pule pracy i imperium UX źle pokazują, ponieważ wyświetlają
> tylko to, co przybędzie do puli po odjęciu auto-ulepszeń, a powinny pokazywać
> łączny przyrost, a dopiero później suma, która się powiększy, powinna być
> pomniejszana ale już w szczegółach i na finalnym wyniku za turę. Czyli nie
> powinienem widzieć na symbolu, na przycisku pracy, plus 22, tylko powinienem
> widzieć łącznie plus 22 i 76 jako suma a to że do puli wpadnie mniej to sobie
> gracz sprawdzi jak wejdzie w szczegóły."
Po przedstawieniu faktu, że IDENTYCZNY wzorzec (netto na żetonie, brutto w
tooltipie/panelu) obowiązuje też dla Skarbca i Nauki, i że to efekt WCZEŚNIEJSZEJ
decyzji właściciela na dokładnie to samo pytanie (rozwiązanej wtedy przez dodanie
rozpiski do tooltipu, NIE zmianę liczby na żetonie — cytat z istniejącego komentarza w
kodzie, `hud.ts:99`/`main.ts:10473-10476`: "nie powinno się tak rozliczać... a nie na
głównym żetonie") — właściciel wybrał wprost: **"Wszystkie trzy na brutto"** — zmienić
Pracę, Skarbiec I Naukę razem, dla spójności, zamiast tworzyć rozjazd między żetonami.

KONTEKST TECHNICZNY (zlokalizowany przez recon, oszczędza czas Operatorowi):
- Żeton HUD: `gra/src/ui/hud.ts`, `renderBarD1B()` (linie ok. 1039-1074) — trzy wywołania
  `chip6cHtml({..., rate: signed(s.pracaRate) / signed(s.bogactwoRate) / signed(s.naukaRate), ...})`.
  Wszystkie trzy `rate*` pola w `HudState` są DZIŚ netto (komentarz linia 819: "pracaRate
  jest już NETTO").
- Panel szczegółów: `gra/src/ui/empireDetailPanel.ts`, `renderPracaSection()` (linie ok.
  1246-1274) i analogiczne sekcje Skarbca/Nauki w tym samym pliku — czytają TĘ SAMĄ
  wartość `economy.pracaRate`/`economy.bogactwoRate`/`economy.naukaRate` z jednego
  wspólnego `HudState` budowanego raz na tick (`buildHudState()`, main.ts).
- Rozbicie brutto JUŻ ISTNIEJE częściowo, ale tylko do tooltipu: `pracaChipTitle()`
  (hud.ts, linie ok. 830-839) rekonstruuje `wplywBrutto = netto + utrzymanie +
  autoUlepszenia` — ALE **brakuje w tej sumie TRZECIEGO drenażu, "Cuda na mapie"**
  (main.ts, `_lastPracaRate -= usedPlayer`, linia ok. 30215) — ten drenaż DZIŚ nie jest
  nigdzie wystawiony jako osobne pole (w przeciwieństwie do `_lastPracaAutoUlepszeniaKoszt`,
  main.ts ok. 10467-10483). Analogiczne `skarbiecChipTitle()`/`naukaChipTitle()` — sprawdź
  ich pełną listę składników, mogą mieć własne, inne braki tego samego typu.

UWAGA — ODRĘBNY, JUŻ ZNANY BUG POZA ZAKRESEM TEGO TEMATU: main.ts komentarze przy
`P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES2-Q1`/`REGRES3-Q1` (linie ok. 10486-10525,
17057-17108) opisują niezależny problem — tabela per-miasto w panelu bywa
nadpisywana live-preview'em NASTĘPNEJ tury, podczas gdy `_lastPracaRate`/pochodne to
zamrożone wartości z OSTATNIEGO zakończonego końca tury — to dwie różne chwile czasowe
w jednym renderze, i dlatego prosta suma z tabeli miast nie zawsze zgadza się 1:1 z
`pracaRate`. NIE naprawiaj tego w tej rundzie (osobny, częściowo już załatany temat) —
jeśli utrudnia to weryfikację brutto, zrób test na świeżej turze bez live-preview
zamiast próbować naprawić timing.

ZADANIE:
1. Dodaj brakujące pole śledzące drenaż "Cuda na mapie" dla Pracy (analogicznie do
   `_lastPracaAutoUlepszeniaKoszt`) — żeby rekonstruowane `wplywBrutto` było kompletne
   i zgadzało się z faktyczną sumą z tabeli miast (skorygowaną o problem timing opisany
   wyżej, jeśli test to wymaga).
2. Sprawdź analogicznie Skarbiec i Naukę — ustal PEŁNĄ listę składników netto→brutto dla
   każdego (mogą się różnić od Pracy), dodaj brakujące pola jeśli są.
3. Zmień renderowanie WSZYSTKICH TRZECH żetonów (`hud.ts renderBarD1B`) tak, żeby główna
   liczba `+X` na żetonie pokazywała BRUTTO (nie netto). Zamień `signed(s.pracaRate)` na
   `signed(wplywBrutto)` i analogicznie dla pozostałych dwóch.
4. Zmień nagłówki analogicznych sekcji w `empireDetailPanel.ts` (Praca, Skarbiec, Nauka)
   tak samo — nagłówek "PULA IMPERIUM"/odpowiednik pokazuje brutto.
5. Rozpiska/tooltip MA nadal pokazywać PEŁNĄ ścieżkę brutto → (odejmij koszty) → netto
   (finalny wynik, który faktycznie trafia do puli) — to jest teraz JEDYNE miejsce, gdzie
   redukcja jest widoczna, zgodnie z życzeniem właściciela. Liczba zapasu ("48") ZOSTAJE
   bez zmian (to już jest poprawny, finalny stan po zastosowaniu netto).
6. Zweryfikuj ŻYWYM zrzutem (Chromium/Playwright), że po zakończeniu tury z niezerowymi
   kosztami wszystkie trzy żetony pokazują brutto, a rozpisce/panelu nadal widać
   redukcję do netto.

BINARNE KRYTERIUM SUKCESU: dla scenariusza ze zrzutu właściciela (Praca: brutto = netto
(+22) + utrzymanie (3) + auto-ulepszenia (76) + cuda-na-mapie (dociągnięte nowe pole) —
żeton pokazuje TĘ sumę, nie +22), analogicznie dla Skarbca i Nauki, potwierdzone żywym
zrzutem. Rozpiska nadal pokazuje pełną ścieżkę do netto.

ALLOWLISTA:
- `gra/src/ui/hud.ts` (renderBarD1B, pracaChipTitle/skarbiecChipTitle/naukaChipTitle)
- `gra/src/ui/empireDetailPanel.ts` (renderPracaSection i analogiczne sekcje Skarbca/Nauki)
- `gra/src/main.ts` (WYŁĄCZNIE okolice `_lastPracaRate`/`_lastPracaAutoUlepszeniaKoszt`
  i analogicznych pól dla Skarbca/Nauki, main.ts jest OGROMNY — nie ruszaj nic poza tym
  obszarem, w szczególności NIE ruszaj kodu `P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES2/3`)
- `gra/tools/*.cjs` (nowe/rozszerzone bramki)
- `dyspozycje/autobot/runs/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1/*`
Zakaz zmiany faktycznej wartości puli/zapasu ("48") — to zostaje netto, poprawne. Zakaz
naprawiania timing-bugu REGRES2/3 w tej rundzie. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania zmiany za gotową bez żywego zrzutu
pokazującego KONKRETNE liczby brutto na wszystkich trzech żetonach jednocześnie (nie
tylko Pracy) — to zmiana zachowania renderu w trzech miejscach, nie jednym.

IZOLACJA: worktree `/home/user/wt-hud-zetony-brutto`, gałąź
`autobot/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1`, baza `origin/main` @ `3f7c68e3`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
