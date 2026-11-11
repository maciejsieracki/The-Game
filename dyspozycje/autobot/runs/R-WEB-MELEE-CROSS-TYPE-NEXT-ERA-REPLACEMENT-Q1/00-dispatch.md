# R-WEB-MELEE-CROSS-TYPE-NEXT-ERA-REPLACEMENT-Q1
STATUS: REGISTERED
DOMAIN: GAME

## Zgłoszenie właściciela — 2026-11-11
Grecki Wojownik mykeński nie może zostać zastąpiony częścią greckiej piechoty Żelaza, ponieważ obecna ścieżka filtruje ten sam Typ. Właściciel zleca: miecznik poprzedniej epoki może przejść na miecznika lub włócznika następnej epoki, i odwrotnie; cel to dostępna jednostka piechoty walczącej wręcz. Uwzględnić falangitów, których właściciel wskazuje jako brakujący wariant. Screenshot przedstawia Wojownika mykeńskiego×76 i ograniczoną listę zamienników.

## Cel i granice
- Rozszerzyć dozwolone przejście między typami piechoty wręcz (Swordsman/Spearman/Falangite; przed implementacją ustalić pełny zestaw faktycznych typów piechoty na danych).
- Zmiana dotyczy awansu do następnej epoki. Nie rozszerzać przy okazji reguł cofania epoki ani zastępowania w tej samej epoce.
- Zachować wymagania cywilizacji, epoki, badań (w tym Sztuki wojennej dla Żelaza), budynków, surowców i limitów jednostek specjalnych; pełny dotychczasowy koszt nowej jednostki, zachowanie doświadczenia i koszt ruchu bez zmian.
- Nie dopuścić przez wspólną kategorię do zastępowania piechoty konnicą, rydwanem, jednostką dystansową, cywilną lub oblężniczą.
- Audyt obejmuje rzeczywiste availableReplacementsFor oraz wykonanie pojedynczej i zbiorczej zamiany; nie wystarczy zmienić samej listy interfejsu.

## Weryfikacja
Actual grecki Wojownik mykeński→Falanga i inne legalne greckie jednostki wręcz Żelaza; przejścia miecznik↔włócznik/falangita w obie strony; brak niewłaściwej nacji/technologii/środków; limity elity i częściowa zbiorcza zamiana; koszt i doświadczenie; brak nowych przejść poza zakresem. Dokładna allowlista przed edycją. Osobny Operator→Evaluator→warunkowa Obrona→Final Control, Luna high; potem main/Robocza/push/readback.

## Kolejka
Zarejestrowane do realizacji w limicie czterech aktywnych tematów. Na moment rejestracji operator jeszcze nieuruchomiony; nie jest to wdrożona poprawka.

## Korekta właściciela — obowiązujący zakres, 2026-11-11
Właściciel sprawdził, że poprzednia zamiana utworzyła tylko jedną jednostkę wyjątkową i uznał istniejące zachowanie za poprawne. WYCOFANO poprzedni dopisek o zakazie zwykła↔wyjątkowa i regule wyjątkowa→wyjątkowa. Zachować dotychczasowe działanie limitów jednostek wyjątkowych; nie implementować nowego rozdzielenia ścieżek z poprzedniego commita.
Nadal wykonać pierwotne zgłoszenie: grecki Wojownik mykeński ma móc awansować na legalną grecką piechotę wręcz następnej epoki mimo innego Typ, w tym Falangę (Falangite) i Thorakites (Spearman). Zweryfikowane dane: Wojownik mykeński Klasa=Specjalna, Super-jednostka=—; Falanga/Thorakites także narodowe Specjalna bez limitu Super; Hieros Lochos Klasa=Super/Super-jednostka=TAK. Nie wymyślać nowych jednostek ani zmieniać ich Typ/statystyk w celu obejścia filtra. Istniejące limity mają nadal działać w zamianie zbiorczej.
