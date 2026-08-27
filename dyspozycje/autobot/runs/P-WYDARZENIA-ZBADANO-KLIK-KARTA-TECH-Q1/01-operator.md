# 01-operator — P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1

STATUS: W TOKU (diagnoza)
DOMAIN: GAME
TEMAT: P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1
MODEL+EFFORT: Opus 5, effort high
RUNDY: 1/5
BAZA: `origin/main` w SHA `0ad2c20a` (SHA z dispatchu; jest przodkiem dzisiejszego
`origin/main`=`8d0eafac`, którego jedyne zmiany w `gra/` to dwa równoległe tematy w
rejonach `main.ts` ~`:913` i ~`:19352` — poza moimi rejonami).

## 1. DIAGNOZA (A) — czym JEST karta „Zbadano: <tech>"

**ODPOWIEDŹ: to NIE jest dedykowany `SidePanelEvent`. To generyczny hint końca tury
(`eot-hint-<tura>-<i>`) z `showHintMessage`.** Karta MA `data-id` i technicznie jest
w zasięgu `onEventClick`, ale jej id nie niesie ŻADNEGO identyfikatora technologii,
więc żadna gałąź `onEventClick` jej nie obsługuje — klik jest no-opem.

Łańcuch, ze ścieżkami i numerami linii (baza `0ad2c20a`):

| # | Miejsce | Co robi |
|---|---|---|
| 1 | `gra/src/main.ts:26193` | `let msg = doneIconHtml + 'Zbadano: ' + done.id + ' (-' + done.koszt + ' nauki)'` |
| 2 | `gra/src/main.ts:26195` | `if (!eraAdvanced) showHintMessage(msg, 3500)` — **jedyne** wyjście tego komunikatu |
| 3 | `gra/src/main.ts:12118-12122` | `showHintMessage` → `if (shouldDeferEotEvents(endTurnInProgress)) { deferredEotHints.push({msg, durationMs}); return; }` — w fazie EOT komunikat NIE jest toastem, tylko wchodzi do generycznej kolejki |
| 4 | `gra/src/game/eot-event-defer.ts:6-9` | `DeferredEotHint = { msg, durationMs }` — kolejka z definicji **gubi kontekst**: żadnego `techId` |
| 5 | `gra/src/game/eot-event-defer.ts` (`deferredHintsToSidePanelEvents`) | `id: 'eot-hint-' + turn + '-' + i`, `title: ''`, `subtitle: msg` po stripie HTML, `kind:'info'` |
| 6 | `gra/src/game/side-panel-event-link.ts` (`LINK_BY_PREFIX`) | `eot-hint-` **świadomie poza tablicą** (audyt P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1) → `sidePanelEventLinkFor` = `null` |
| 7 | `gra/src/ui/sidePanelHud.ts:720-721`, `:351` | brak linku → klasa `sp-no-link` + `cursor:default`, zero CTA |

**Pomiar w ŻYWEJ, zbudowanej grze** (artefakt `vite build` z `0ad2c20a`, `?playtest=mapa`,
karta zainscenizowana dokładnie tak, jak produkuje ją krok 5):

```text
data-id            : eot-hint-12-0
tekst karty        : "ℹ️WydarzenieZbadano: Rolnictwo (-40 nauki)✕"   ← 1:1 zrzut właściciela
.sp-goto-cta       : null            (brak afordancji)
klasa sp-no-link   : true
cursor             : default
role / tabindex    : null / null     (poza kolejnością Tab)
linkFor('eot-hint-12-0') : null
REALNY page.mouse.click (hit-test potwierdzony: elementFromPoint → ta karta):
  → civ-tech-discovery-notice-host: BRAK
  → openViews(): wszystkie false
```

Czyli: karta ze zrzutu właściciela to **hint**, a nie zdarzenie z tożsamością — i już dziś
jawnie deklaruje brak celu (`sp-no-link`, `cursor:default`), zgodnie z konwencją audytu.
Naprawa musi **dać temu zdarzeniu tożsamość** (własne id z identyfikatorem technologii),
a nie „podpiąć handler do `eot-hint-*`" — po id hintu nie da się odzyskać technologii.

## 2. DIAGNOZA (B) — dlaczego karta ulepszenia jest „pod spodem"

**ODPOWIEDŹ: karta ulepszenia ląduje w INNYM hoście o NIŻSZYM `z-index` (520 < 940).
Karta technologii NIE jest zamykana** — zostaje w DOM, widoczna, i to ONA przykrywa
kartę ulepszenia.

| # | Miejsce | Co robi |
|---|---|---|
| 1 | `gra/src/ui/techDiscoveryNotice.ts:226` | host karty technologii: `#civ-tech-discovery-notice-host{position:fixed;inset:0;z-index:940;display:flex;...}` |
| 2 | `gra/src/ui/techDiscoveryNotice.ts:660` | wiersz „Szczegóły →" dostaje `linkTo:{kind:'improvement'}` |
| 3 | `gra/src/ui/entityCards/renderer.ts:328-338` | delegowany listener `renderEntityCard` łapie klik PIERWSZY (`stopImmediatePropagation`) i woła `openEntityCard(kind, id, {mode:'dialog'})` |
| 4 | `gra/src/ui/entityCards/renderer.ts:343-364` (`openDialog`) | tworzy **osobny** `.entity-card-backdrop` i wkłada go do `document.body` |
| 5 | `gra/src/ui/entityCards/renderer.ts:438-440` (`ENTITY_CARD_CSS`) | `.entity-card-backdrop{position:fixed;inset:0;z-index:520;...}` — **520 < 940** |

Nigdzie na tej ścieżce nie ma wywołania `close()` karty technologii — potwierdzone
pomiarem, nie lekturą.

**Pomiar `getBoundingClientRect()` OBU kart naraz** (żywe Chromium, viewport 1600×1000,
realny klik myszą w „Szczegóły →" karty „Łowiectwo"):

```text
#civ-tech-discovery-notice-host : x=0    y=0     1600×1000  position=fixed  z-index=940
  .entity-card „Łowiectwo"      : x=470  y=323.5  660×352.9 position=relative z=auto  ← OTWARTA
.entity-card-backdrop (nowy)    : x=0    y=0     1600×1000  position=fixed  z-index=520
  .entity-card „Obóz łowiecki"  : x=583  y=353.7  434×292.5 position=static  z=auto

document.elementFromPoint(środek karty „Obóz łowiecki")
   → SECTION.entity-card-section  ·  closestCard = "Łowiectwo"
```

Obie karty mają niezerową powierzchnię i leżą w viewporcie, ale karta ulepszenia jest
**w całości zasłonięta** przez kartę technologii — hit-test w jej własnym środku trafia
w kartę „Łowiectwo". To dokładnie „pojawia się pod spodem" ze zgłoszenia.

Konsekwencja dla naprawy: to **nie** jest „karta zamykana przed otwarciem", więc naprawą
NIE jest przywracanie karty technologii, tylko **wspólny host / wspólny układ** dla obu kart.

Zrzuty diagnostyczne (przed naprawą): `/tmp/diag-A-przed.png`, `/tmp/diag-B-przed.png`.
