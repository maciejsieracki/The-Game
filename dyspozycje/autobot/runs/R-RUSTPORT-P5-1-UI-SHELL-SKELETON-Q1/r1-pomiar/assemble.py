import sys
head, table, out = sys.argv[1:4]
txt = open(head, encoding='utf-8').read() + '## Tabela (83 moduły)\n\n' + open(table, encoding='utf-8').read()
open(out, 'w', encoding='utf-8', newline='\n').write(txt)
print(txt.count('| BEZPOŚREDNI |'), txt.count('| PRZECHODNI |'))
