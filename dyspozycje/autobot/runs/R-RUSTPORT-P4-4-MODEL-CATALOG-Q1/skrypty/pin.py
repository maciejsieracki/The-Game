"""Wspólny dostęp do pinu web `edb8fb56` (tylko odczyt: git show / git grep / git ls-tree).

Uruchamiaj skrypty z katalogu repo (dowolny worktree): `python3 -I <ścieżka>/skrypty/<skrypt>.py`.
Żaden skrypt nie zapisuje w repo; ewentualne pliki pośrednie trafiają do katalogu podanego jako argument.
"""
import os
import re
import subprocess
import posixpath

PIN = 'edb8fb56'
ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True,
                      cwd=os.getcwd()).stdout.strip()


def sh(*a):
    return subprocess.run(list(a), cwd=ROOT, capture_output=True, text=True).stdout


def show(path):
    return sh('git', 'show', f'{PIN}:{path}')


def ls(prefix):
    return sh('git', 'ls-tree', '-r', '--name-only', PIN, '--', prefix).split()


def render_files():
    return ls('gra/src/render')


def outside_three():
    out = sh('git', 'grep', '-l', '-E', "from ['\"]three", PIN, '--', 'gra/src').split()
    return [l.split(':', 1)[1] for l in out if '/render/' not in l]


def inventory_files():
    return render_files() + outside_three()


IMP_RE = re.compile(r"(?:from|import)\s*\(?\s*['\"](\.{1,2}/[^'\"]+)['\"]")


def strip_comments(s):
    """Usuwa komentarze /* */ i // (bez parsowania stringów — wystarcza do importów)."""
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return re.sub(r'(^|[^:\'"])//[^\n]*', r'\1', s)


def import_graph():
    """{plik: set(plików importowanych)} dla wszystkich gra/src/**/*.ts na pinie (komentarze pominięte)."""
    allf = [f for f in ls('gra/src') if f.endswith('.ts')]
    g = {}
    for f in allf:
        s = strip_comments(show(f))
        deps = set()
        for m in IMP_RE.findall(s):
            p = posixpath.normpath(posixpath.join(posixpath.dirname(f), m))
            if p.endswith('.js'):
                p = p[:-3]
            if not p.endswith('.ts'):
                p += '.ts'
            if p != f:
                deps.add(p)
        g[f] = deps
    return g
