# AutoBot dispatch — runda 3: stabilny 24px dolny margines

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 3/5
MODEL + EFFORT: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium

## WYZWALACZ
Niezależny Evaluator uruchomił test po poprawce r2 i zmierzył `box.bottom=389.552551` przy viewportcie CSS 413px, tj. dolny odstęp 23.447449px. To poniżej wymaganego 24px oraz progu testu >=23.5px. Operator zgłaszał 26/26 PASS, więc wynik nie jest powtarzalny między uruchomieniami.

## GOAL
Zapewnić stabilnie co najmniej 24 CSS px marginesu od obu krawędzi dla DPR 1.5 i viewportu 600×413, bez osłabiania testu. Zidentyfikować różnicę środowiska/roundingu, jeśli wyniki zależą od Chromium. Panel nadal ma wewnętrzny scroll, wszystkie wiersze osiągalne i oba CTA widoczne oraz klikalne.

## KRYTERIA
- Operator wykonuje ten sam test co najmniej 3 razy na produkcyjnym renderze i rejestruje surowe recty/innerHeight/DPR.
- Co najmniej 24 CSS px w każdym pomiarze; test nie obniża tolerancji.
- Niezależny Evaluator odtwarza 26/26 oraz spełnienie 24px w swoim środowisku.
- Ikony 7/7, typecheck, build, scoped diff-check PASS.

## ALLOWLISTA
- `gra/src/ui/armyMergePanel.ts`
- `gra/src/ui/armyStackHud.ts` tylko jeśli niezbędne
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`
- `gra/tools/army-split-ruch-icons-test.cjs`
- raporty tej rundy

## GRANICE
Nie obniżać 24px do testowego 23.5px; nie zmieniać viewport/DPR w sposób omijający reprodukcję. Bez commit/push/deploy.
