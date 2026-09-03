TEMAT: R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI)
ŚCIEŻKA: gra/src/ui/diplomacyAcceptanceBalance.ts, gra/src/ui/diplomacyAudience.ts
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, ze zrzutami ekranu)
Zaobserwowane: pakt o nieagresji odrzucany mimo rosnącego "Bilans (netto)" (+130→+414 w
kolejnych próbach dokładania do koszyka). "Znowu jakiś regres z handlem." Po wyjaśnieniu przez
orkiestratora (patrz RECON): "OK, to takie niespełnione warunki powinny świecić się na czerwono,
żeby gracz wiedział, że nie ma możliwości podpisania deala. Powinna też być ta informacja, kiedy
najedzie się na 'przyjmij', dlaczego nie można przyjąć." Dodatkowo: "skoro jest taka kara 110
plus 20, to daje 130, to w ogóle kwestia paktu, a nie agresji, w ogóle nie powinna być w opcjach
do wyboru."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
**To NIE jest regresja bilansu PW** (osobno potwierdzone, żaden kod bilansu PW nie zmienia się w
tej rundzie). Blokada paktu o nieagresji jest w pełni poprawna i zamierzona: próg Relacji dla
`case 'nap'` (`gra/src/game/diplomacy-proposals.ts:1036-1044`) — `napThreshold =
progNapRelacja(110) + napExpansionSurcharge(20 gdy obie strony >2 miasta) - napEase(słodzik z
koszyka)`. To ZUPEŁNIE INNY mechanizm niż "Bilans (netto)" pokazywany w panelu (ten liczy się z
kosztów PW pozycji koszyka, nie z Relacji) — dwie niepowiązane liczby, obie widoczne jednocześnie,
myląco.

- `verdictHtml()` (`diplomacyAcceptanceBalance.ts:484-537`) zwraca `{tone:'no', html:'Nie
  spełnia warunków: ' + reason}` — TA gałąź już istnieje i poprawnie niesie treść komunikatu
  (widoczną na zrzucie: "Relacja zbyt niska na pakt (wymagana ≥ 130; +20 za ekspansję przy
  granicy — dołóż do oferty lub podnieś Relację)").
- Renderowane jako `<div class="da-pn-bal-verdict no">` w trzech miejscach
  (`diplomacyAcceptanceBalance.ts:673,745,868`) — klasa CSS `no` istnieje, ale dzisiejszy kolor
  (bursztynowy/pomarańczowy wg zrzutu) nie sygnalizuje wystarczająco mocno "to jest blokada, nie
  ostrzeżenie".
- Przycisk "Przyjmij" (znajdź dokładną lokalizację w `diplomacyAcceptanceBalance.ts` lub
  `diplomacyAudience.ts` — grep "Przyjmij" w obu plikach) nie ma dziś atrybutu `title`/tooltip
  gdy `disabled` — brak wyjaśnienia przy najechaniu myszą.
- Lista "Możliwe umowy" (`diplomacyAudience.ts:1695+`, `visible.length` linia 1790) pokazuje
  WSZYSTKIE dostępne akcje dyplomatyczne jako klikalne kafelki bez rozróżnienia czy BAZOWY próg
  (przed uwzględnieniem słodzika z koszyka) jest w ogóle osiągalny.

GOAL
1. **Kolor blokady na czerwony.** Zmień styl `.da-pn-bal-verdict.no` (i analogiczne klasy `no`
   używane w tym samym kontekście blokady twardej, NIE dla stanów `wait`/informacyjnych) na
   wyraźnie czerwony (border+tekst), odróżnialny od stanu `ok` (zielony) i `wait` (dzisiejszy
   neutralny/bursztynowy zostaje dla `wait`, jeśli taki stan istnieje osobno — zbadaj czy `no` i
   `wait` dzielą dziś ten sam kolor bursztynowy, co byłoby częścią problemu).
2. **Tooltip na przycisku "Przyjmij".** Gdy przycisk jest `disabled` z powodu niespełnionych
   warunków, dodaj atrybut `title` z DOKŁADNIE tym samym tekstem co komunikat blokady (reason z
   `responderPreview`/`blockReason`) — gracz najeżdżający myszą na wyłączony przycisk widzi
   dlaczego.
3. **Lista "Możliwe umowy" — sygnalizacja niedostępności.** Dla akcji typu `nap` (i analogicznych
   z twardym progiem Relacji, np. `sojusz_pelny`/`granice`/`wasal` jeśli mają podobny wzorzec —
   zbadaj, nie zgaduj), gdy BAZOWY próg (bez żadnego słodzika w koszyku, bo koszyk jeszcze nie
   istnieje na etapie wyboru z listy) nie jest osiągalny przy dzisiejszej Relacji — NIE ukrywaj
   całkowicie kafelka (słodzik może obniżyć próg już PO dodaniu do koszyka — całkowite ukrycie
   ukryłoby tę możliwość), ale oznacz go wizualnie jako "wymaga wyższej Relacji" (np. wyszarzenie
   częściowe + mały label/ikona ostrzeżenia, klikalny nadal, ale z jasnym sygnałem PRZED
   kliknięciem, nie dopiero po zbudowaniu całego koszyka).

KRYTERIA KOŃCA (binarne)
1. Żywy test Chromium: scenariusz z zrzutów właściciela (Relacja 112, próg NAP 130) — komunikat
   blokady w panelu negocjacji jest wizualnie CZERWONY (sprawdź faktyczny kolor obliczony,
   `getComputedStyle`, nie tylko nazwę klasy CSS).
2. Ten sam scenariusz: najechanie myszą na przycisk "Przyjmij" (disabled) pokazuje tooltip z
   treścią zawierającą "Relacja zbyt niska na pakt" (lub aktualny dokładny reason).
3. Scenariusz z Relacją WYSTARCZAJĄCĄ (≥ progu) — kolor `ok` (zielony) bez zmian, zero regresji.
4. Lista "Możliwe umowy" z NAP niedostępnym (Relacja poniżej bazowego progu) pokazuje wyraźny
   sygnał wizualny PRZED dodaniem do koszyka — żywy dowód (zrzut/DOM), nie tylko kod.
5. `tsc --noEmit` czysty, istniejące testy dyplomacji/negocjacji (grep
   `gra/tools/*dyplo*-test.cjs`, `gra/tools/diplomacy-*-test.cjs`,
   `gra/tools/diplomacy-negotiation-table-test.cjs`) nadal zielone, 5 bramek referencyjnych
   zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/diplomacyAcceptanceBalance.ts (kolor, tooltip).
- gra/src/ui/diplomacyAudience.ts (sygnalizacja niedostępności w liście "Możliwe umowy").
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: gra/src/game/diplomacy-proposals.ts (progi Relacji/logika `evaluateProposal`
— ZERO zmian, próg NAP 110+20 zostaje dokładnie taki sam, to WYŁĄCZNIE UI), zmiana jakiejkolwiek
liczby/progu/formuły bilansu PW, dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-dyplo-warunek-niespelniony-czerwony, gałąź
autobot/R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 (kolor czerwony) za spełnione przez samo dopisanie klasy CSS bez
weryfikacji `getComputedStyle` w żywym Chromium — zmiana w arkuszu stylów może nie dotrzeć do
elementu z innych powodów (specificity, inny selektor nadpisujący). Zakaz założenia że
tooltip/title działa bez faktycznego sprawdzenia w DOM że atrybut jest obecny NA WYŁĄCZONYM
przycisku w momencie gdy warunki nie są spełnione (nie tylko w kodzie źródłowym).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
