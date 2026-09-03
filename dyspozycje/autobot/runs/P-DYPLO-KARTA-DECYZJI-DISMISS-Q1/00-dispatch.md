TEMAT: P-DYPLO-KARTA-DECYZJI-DISMISS-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/sidePanelHud.ts (renderer kart blokujących + handler kliknięcia)
MODEL+EFFORT: claude-sonnet-5, effort high (mała, dobrze zlokalizowana zmiana UI, ale
wymaga żywej weryfikacji zachowania backendu który już istnieje)

WYZWALACZ (dosłownie od właściciela, dwa zrzuty panelu bocznego "Wydarzenia")
"Na propozycjach dyplomatycznych powinna być też możliwość wyłączenia tej propozycji,
czyli że nie, że jesteśmy niezainteresowani. Tylko chodzi o to, żeby można było ją
wyłączyć, ewentualnie do niej wrócić, jeżeli się da." + "Jak widzisz, część wydarzeń da
się usunąć, to są informacyjne, a propozycji się nie da. Propozycje handlowe też powinny
się usuwać jak wszystkie inne."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- Taksonomia pełna: `SidePanelEventKind` = `'science'|'culture'|'city'|'unit'|'enemy'|
  'info'|'diplo'` (`sidePanelHud.ts:29`); realnie używane: `city`, `diplo`, `enemy`,
  `info`, `science`. Centralny punkt zbierania: `collectTurnEvents()`
  (`main.ts:13649-13726`).
- Karty `kind:'diplo', blocking:true` powstają w DWÓCH miejscach: `pendingDiplomacyInbox`
  (`main.ts:13700-13708`, propozycje przychodzące) i `negotiationTable`
  (`main.ts:13713-13723`, kontroferty/negocjacje czekające na gracza) — `id` = surowe ID
  encji domenowej (`p.id`/`n.id`), bez własnego prefiksu typu.
- **KLUCZOWE ODKRYCIE: backend JUŻ obsługuje dokładnie ten przypadek.**
  `handleSidePanelEventDismiss` (`main.ts:19544-19617`), ostatnia gałąź (linia
  19613-19616, komentarz: "Propozycja pokoju / negocjacje / inne dyplo — ukryj do końca
  tury (✕ nie usuwa propozycji z inboxu; wraca w następnej turze, jeśli nadal
  aktualna)") robi `dismissedSidePanelEventIds.add(id)` — IDENTYCZNY mechanizm jak dla
  buntu, czyszczony co turę (`.clear()`, `main.ts:20586` i `26857`).
  `pendingDiplomacyInbox`/`negotiationTable` SAME W SOBIE nie są dotykane —
  `collectOpenDiploProposalQueue()` (`main.ts:13828-13841`) filtruje przez
  `dismissedSidePanelEventIds`, więc propozycja zostaje osiągalna np. ze Stołu
  Negocjacji w panelu audiencji, mimo że karta panelu bocznego znika.
- **Brakuje WYŁĄCZNIE warstwy UI**: `sidePanelHud.ts:653-685` (renderer blokujących
  kart) nie generuje przycisku ✕/odłóż dla kart `diplo` w ogóle — tylko zawsze "Otwórz
  →" i warunkowo (`isIgnorableRevoltEvent`, linia 433-435, dopasowanie po prefiksie
  `'revolt-'`) przycisk "Zignoruj — bunt potrwa dalej" dla buntów. `config.onEventDismiss`
  jest dziś wołany z blokujących kart WYŁĄCZNIE przez `data-sp-ignore` (linia 822),
  którego widoczność steruje `isIgnorableRevoltEvent`.
- Wzorzec do skopiowania 1:1: dokładnie ta sama para (predykat widoczności przycisku +
  wywołanie `config.onEventDismiss?.(ev.id)`) już istnieje dla buntu — trzeba dodać
  analogiczny predykat dla `kind==='diplo'`.

GOAL
1. Dodaj predykat `isDeferrableDiploEvent(ev)` w `sidePanelHud.ts` (analogicznie do
   `isIgnorableRevoltEvent`): `ev.blocking === true && ev.kind === 'diplo'`.
2. W rendererze blokujących kart (linie ok. 653-685) dodaj drugi przycisk — dla kart
   spełniających `isDeferrableDiploEvent` — z etykietą jasno komunikującą "odłożenie",
   nie "odrzucenie" (np. "Odłóż na później" — właściciel wprost odróżnił to od
   formalnego odrzucenia, które ma konsekwencje reputacyjne opisane wcześniej w tej
   sesji), wołający `data-sp-ignore="<id>"` — REUŻYWAJĄC istniejący handler
   (`el.querySelectorAll('[data-sp-ignore]')`, linia 817), nie tworząc nowego atrybutu
   ani nowej ścieżki JS.
3. Zero zmian w `main.ts` — `handleSidePanelEventDismiss` już poprawnie obsługuje
   `kind==='diplo'` (gałąź opisana w RECON) — WYŁĄCZNIE jeśli recon Operatora w locie
   potwierdzi że ta gałąź faktycznie trafia zarówno dla wpisów z `pendingDiplomacyInbox`,
   jak i z `negotiationTable` (mogą mieć różne prefiksy/kształt id — sprawdź oba
   scenariusze, nie zakładaj że jeden reprezentuje oba).
4. Po kliknięciu "Odłóż na później": karta znika z blokującej kolejki panelu bocznego
   NATYCHMIAST (ta sama tura), propozycja NADAL widoczna i osiągalna w panelu audiencji
   dyplomatycznej ("Możliwe umowy"/"Stół negocjacji"), i wraca do panelu bocznego w
   KOLEJNEJ turze jeśli nadal aktualna (dokładnie zachowanie buntu, dziedziczone z
   istniejącego mechanizmu czyszczenia co turę).
5. Zero zmian w logice akceptacji/odrzucenia (`handleNegotiationReject`,
   `handleNegotiationAccept`, cooldown, konsekwencje reputacyjne) — "odłóż" to WYŁĄCZNIE
   ukrycie karty, nie interakcja z samą propozycją.

KRYTERIA KOŃCA (binarne)
1. Żywy render w headless Chromium: karta "Dyplomacja: X" (propozycja przychodząca LUB
   kontroferta na stole) pokazuje przycisk "Odłóż na później" obok "Otwórz →".
2. Kliknięcie przycisku: karta znika z panelu bocznego w TEJ turze; propozycja nadal
   widoczna w panelu audiencji dyplomatycznej (sprawdzone na żywo, nie tylko czytanie
   stanu).
3. Test: po zakończeniu tury (koniec tury gracza), jeśli propozycja nadal aktualna, karta
   WRACA do panelu bocznego — dokładnie ten sam mechanizm co bunt.
4. Zero regresji: karty buntu nadal mają WYŁĄCZNIE swój dotychczasowy przycisk "Zignoruj
   — bunt potrwa dalej" (nie dublują się z nowym przyciskiem), pozostałe typy blokujących
   kart (`city`/prod-empty) bez zmian.
5. Zero regresji na istniejących testach panelu bocznego (znajdź reconem, np.
   side-panel-*-test.cjs w gra/tools/).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/sidePanelHud.ts — WYŁĄCZNIE nowy predykat, renderer blokujących kart
  (przycisk), i (jeśli konieczne — potwierdź reconem) rozszerzenie istniejącego
  listenera `[data-sp-ignore]`.
- Nowy lub rozszerzony test w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana
`main.ts` (poza wyjątkiem opisanym w GOAL 3, jeśli recon wykaże realną potrzebę — w
takim wypadku WYŁĄCZNIE minimalna poprawka z jasnym uzasadnieniem w raporcie), zmiana
logiki odrzucenia/akceptacji propozycji, zmiana zachowania karty buntu.

IZOLACJA
worktree /home/user/wt-dyplo-karta-dismiss, gałąź autobot/P-DYPLO-KARTA-DECYZJI-DISMISS-Q1,
baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-karta-dismiss --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2/3 za spełnione bez żywego testu obu źródeł kart diplo
(`pendingDiplomacyInbox` I `negotiationTable` osobno) — nie zakładać że jeden test
pokrywa oba, bo mają różną budowę `id`. Zakaz uznania że main.ts nie wymaga zmian bez
faktycznego, żywego sprawdzenia że `handleSidePanelEventDismiss` poprawnie obsługuje
OBA kształty id.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
