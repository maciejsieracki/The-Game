STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TOOLTIP-RESOURCES-LINE-DEDUP-Q1
GOAL: linia „Surowce / zasoby” tooltipu heksu bez zdublowanych etykiet (Kon · Koń), zero zmian logiki gry.

PRZED (pomiar, Chromium + prawdziwy buildHexContextTooltipHtml, era 3):
- złoże konia (zloze='kon') + Stadnina: "Kon · Koń" (dubel; „Kon” = fallback capitalize w labelForHex, resource-access.ts ~l.84, brak klucza `kon` w ZLOZE_LABEL; „Koń” = SUROWIEC_KEY_LABEL.kon przez labelsForImprovementUnlock)
- złoże konia bez ulepszenia (zloze='kon'): "Kon" (niepolska etykieta)
- nakładka zloze_konia (bez pola zloze) + Stadnina: "Koń" (OK)
- kopalnia miedzi: "Ruda miedzi · Ruda" (dubel ogólny/doprecyzowany; źródło: unlock `ruda` z hexContextTooltip.ts collectResourceLabels)
- kopalnia żelaza "Ruda żelaza", cyny "Ruda cyny", kamieniołom "Kamień": OK
- tartak (las): "Drewno · Las (drewno)" (dubel; źródło: hexContextTooltip.ts `push('Las (drewno)')`)

ZMIANY/COMMIT (SHA poniżej w sekcji końcowej):
- gra/src/game/resource-access.ts: ZLOZE_LABEL + `kon: 'Koń'` (tylko etykieta).
- gra/src/ui/hexContextTooltip.ts collectResourceLabels: dedup po znormalizowanym kluczu (bez diakrytyk i ł), pominięcie etykiety ogólnej gdy jest już doprecyzowana ("Ruda" przy "Ruda miedzi"), pominięcie "Las (drewno)" gdy jest "Drewno".
- gra/tools/hex-tooltip-resources-line-dedup-test.cjs (NOWY, 28 asercji).
- Raport + logi gate-*.txt. Logika gry nietknięta.

PO: Koń · Koń->"Koń"; "Ruda miedzi"; tartak "Drewno"; reszta bez zmian.

TESTY:
- Nowy test: RED na starym kodzie 22 passed / 6 failed (gate-red.txt EXIT=1); GREEN 28/0.
- Mutacja (usunięcie pętli prefiksowej): 27/1 (kopalnia miedzi) -> test zabija mutanta.
- Regresje PRZED vs PO identyczne: hex-tooltip-mozliwe-ulepszenia-zloze 73/1 (znane czerwone), heks-panel-tooltip-warstwa 18/1 (znane), dyplo-warunek-niespelniony-czerwony-tooltip exit 1 (PRZED też 1), hud-tooltip-body-mounted-panels timeout 124 (PRZED też 124); zielone bez zmian: hex-tooltip-unlock-label-dedup 28/0, improvement-production-text 19/0, stadnina-kopalnia-cyny 29/0, pozostałe *tooltip* exit 0. Brak plików *resource-access*test* w tools/.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Pozostałe testy repo poza zakresem: NIE_ZMIERZONO.

BLOKADY: brak. (Niezwiązane: dyplo-warunek... i hud-tooltip-body-mounted... czerwone/timeout także przed zmianą.)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
