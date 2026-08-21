# 00-dispatch — R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1 (KRYTYCZNE, P0)

TEMAT: R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1
GOAL: przyciski akcji „Rozpocznij badanie" i „Otwórz drzewo" w karcie odkrycia/podglądu
technologii (nowy system `entityCards`, wdrożony w `R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`
T3, FALA 307) MUSZĄ realnie reagować na kliknięcie — dziś (zgłoszenie właściciela, na żywo,
FALA 307) nie robią nic. To jest KRYTYCZNY regres: bez działającego przycisku „Rozpocznij
badanie" gracz nie może rozpocząć żadnego badania nigdzie w grze.

## Kontekst awarii

Właściciel zgłosił na żywo (stempel `6c1433ef` = FALA 307): kliknięcie technologii w liście
„Badania" otwiera kartę podglądu (`kind:'preview'`), ale przyciski w stopce karty
(„Rozpocznij badanie", „Otwórz drzewo") nie reagują na klik. **ROBOCZA już przywrócona do
FALI 306 jako środek natychmiastowy** (commit `186bb6da`) — kod źródłowy T1b/T3 NIE został
cofnięty na `main`, tylko wdrożony bundle. Ten dispatch ma znaleźć PRAWDZIWĄ przyczynę i
naprawić ją na `main`, żeby dało się bezpiecznie wdrożyć FALĘ 308.

## KRYTYCZNE — reprodukuj naprawdę, nie zgaduj

Ta sesja już raz miała dokładnie ten problem: Operator T3 uznał ścieżkę za sprawdzoną na
podstawie testów, które w rzeczywistości sprawdzały MARTWY kod fallbacku, nie aktywną ścieżkę
(`P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`, zarejestrowane wcześniej tego samego
dnia). To jest DOKŁADNIE ten sam rodzaj błędu materializujący się naprawdę — NIE powtórz go.

- Jeśli w tym środowisku dostępny jest skill `run` — użyj go OBOWIĄZKOWO. Uruchom grę,
  dotrzyj do panelu Badania, kliknij technologię z listy „MOŻESZ WYBRAĆ", otwórz kartę
  podglądu, kliknij „Rozpocznij badanie" i sprawdź w konsoli przeglądarki czy: (a) event
  listener w ogóle się odpala, (b) czy `config.onSelectTech`/callback faktycznie coś robi,
  (c) czy jest jakikolwiek błąd w konsoli (np. wyjątek w trakcie renderowania powodujący że
  `_legacyShowTechDiscoveryNotice` fallback się aktywuje zamiast nowej ścieżki, z inną
  strukturą DOM niż oczekiwana).
- Jeśli `run` nie jest dostępny w tym środowisku — zbuduj minimalny harness DOM (esbuild+jsdom,
  wzorem `entity-card-contract-test.cjs`/ad-hoc harnessu który napisał Final Control T3),
  który FAKTYCZNIE wywołuje `showTechDiscoveryNotice(...)` z prawdziwym `onStartResearch`
  (np. spy function) i symuluje realny klik (`button.click()` albo `dispatchEvent(new
  MouseEvent('click', {bubbles:true}))`) na przycisk „Rozpocznij badanie" — i sprawdź czy spy
  faktycznie się wywołał. NIE polegaj na czytaniu kodu i zakładaniu że `addEventListener`
  działa — to dokładnie ten sam błąd co poprzednio (kod WYGLĄDA poprawnie, ale coś w
  rzeczywistym DOM/cyklu życia to psuje).

## Znane fakty ze wstępnego przeglądu kodu (do zweryfikowania, nie do zaufania na słowo)

- `gra/src/ui/techDiscoveryNotice.ts::showTechDiscoveryNoticeViaEntityCard()` buduje
  `actions: EntityCardAction[]` z `onClick: () => { opts.onStartResearch?.(); close(); }`
  (linie ~549-560) — WYGLĄDA poprawnie.
- `gra/src/ui/entityCards/renderer.ts` (linie ~275-286) tworzy `<button>` i wywołuje
  `btn.addEventListener('click', action.onClick)` — WYGLĄDA poprawnie.
- Podejrzane miejsca do sprawdzenia mimo to:
  1. Czy `showTechDiscoveryNotice()`'s `try/catch` (linia ~495-506) łapie wyjątek i
     przełącza na `_legacyShowTechDiscoveryNotice` PODCZAS gdy nowa karta jest już częściowo
     w DOM — możliwy stan mieszany (dwie karty, albo card bez poprawnie podłączonych
     przycisków, bo wyjątek poleciał PO zbudowaniu przycisków, ale PRZED czymś innym).
  2. Czy `close()` (`popOverlay(OVERLAY_ID); host.remove();`) jest wołane w złym momencie,
     albo `host.id = HOST_ID` (stały identyfikator) powoduje kolizję z poprzednim, nie
     w pełni usuniętym hostem (`hideTechDiscoveryNotice()` przed budową nowej karty —
     sprawdź czy faktycznie usuwa STARY host zanim nowy zostanie dodany).
  3. Czy `pushOverlay`/`escapeOverlayStack.ts` w jakiś sposób blokuje pointer-events na
     zawartości karty (np. zablokowany klik przez nakładającą się warstwę tła/backdrop
     z nieprawidłowym z-index, mimo że w markupie przyciski wyglądają na klikalne).
  4. Czy funkcja `act()` w `scienceHubHud.ts` (albo `techTreeView.ts`) faktycznie przekazuje
     `onStartResearch`/`onOpenTree` do `showTechDiscoveryNotice`, czy któryś z callbacków
     jest `undefined` w praktyce (np. warunek `lockedRow ? undefined : ...` błędnie
     ewaluuje się na `undefined` dla odblokowanej technologii).

## Naprawa i dowód

Po znalezieniu prawdziwej przyczyny — napraw ją möglichst minimalnie (nie przepisuj całego
mechanizmu, jeśli przyczyna jest lokalna). **Napisz trwały test, który FAKTYCZNIE renderuje
kartę i FAKTYCZNIE klika przycisk (symulowany event, nie string-match na źródle)** —
zamknij tym samym `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1` przy okazji, jeśli
test pokrywa dokładnie ten scenariusz.

## Ograniczenia

- To jest bug, nie decyzja — nie wymaga ABC.
- Zero zmian w danych (`tech.json` itd.).
- Jeśli naprawa wymaga zmiany w `entityCards/renderer.ts` (współdzielony z T4, migracja karty
  jednostki, w toku równolegle) — zrób to, ale opisz jawnie w raporcie, żeby orkiestrator
  wiedział że T4 może potrzebować rebase/ponownej weryfikacji po tej naprawie.

## Branch

`autobot/R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` (z `main`, zawiera już T1b+T3).
