# Convertit le guide Markdown en HTML pagine, pret a imprimer en PDF.
# Couvre uniquement la syntaxe reellement utilisee dans le document :
# titres, regles, listes, tableaux, blocs de code, citations, emphase.
import io
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
lines = io.open(src, encoding='utf-8').read().split('\n')


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def inline(t):
    t = esc(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])', r'<em>\1</em>', t)
    t = re.sub(r'(?<![\w_])_([^_\n]+)_(?![\w_])', r'<em>\1</em>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'(?<!["=>])(https?://[^\s<)]+)', r'<a href="\1">\1</a>', t)
    return t


out = []
i = 0
n = len(lines)

while i < n:
    line = lines[i]

    # bloc de code
    if line.startswith('```'):
        i += 1
        buf = []
        while i < n and not lines[i].startswith('```'):
            buf.append(esc(lines[i]))
            i += 1
        i += 1
        out.append('<pre>' + '\n'.join(buf) + '</pre>')
        continue

    # tableau : une ligne | ... | suivie d'une ligne de separation
    if line.startswith('|') and i + 1 < n and re.match(r'^\|[\s:|-]+\|$', lines[i + 1]):
        header = [c.strip() for c in line.strip('|').split('|')]
        i += 2
        rows = []
        while i < n and lines[i].startswith('|'):
            rows.append([c.strip() for c in lines[i].strip('|').split('|')])
            i += 1
        html = ['<table><thead><tr>']
        html += ['<th>' + inline(c) + '</th>' for c in header]
        html.append('</tr></thead><tbody>')
        for r in rows:
            html.append('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in r) + '</tr>')
        html.append('</tbody></table>')
        out.append(''.join(html))
        continue

    # citation
    if line.startswith('> '):
        buf = []
        while i < n and lines[i].startswith('> '):
            buf.append(inline(lines[i][2:]))
            i += 1
        out.append('<blockquote>' + ' '.join(buf) + '</blockquote>')
        continue

    # liste a puces (avec sous-niveau eventuel)
    if re.match(r'^\s*- ', line):
        buf = []
        while i < n and re.match(r'^\s*- ', lines[i]):
            buf.append('<li>' + inline(re.sub(r'^\s*- ', '', lines[i])) + '</li>')
            i += 1
        out.append('<ul>' + ''.join(buf) + '</ul>')
        continue

    # liste numerotee
    if re.match(r'^\d+\. ', line):
        buf = []
        while i < n and re.match(r'^\d+\. ', lines[i]):
            buf.append('<li>' + inline(re.sub(r'^\d+\. ', '', lines[i])) + '</li>')
            i += 1
        out.append('<ol>' + ''.join(buf) + '</ol>')
        continue

    # titres
    m = re.match(r'^(#{1,4}) (.*)$', line)
    if m:
        lvl = len(m.group(1))
        out.append('<h%d>%s</h%d>' % (lvl, inline(m.group(2)), lvl))
        i += 1
        continue

    # regle horizontale
    if line.strip() == '---':
        out.append('<hr/>')
        i += 1
        continue

    # paragraphe
    if line.strip():
        buf = [line]
        i += 1
        while i < n and lines[i].strip() and not re.match(r'^(#{1,4} |\s*- |\d+\. |\||>|```|---)', lines[i]):
            buf.append(lines[i])
            i += 1
        # Les retours a la ligne du source sont intentionnels (bloc d'en-tete,
        # listes de champs) : on les conserve plutot que de tout agglomerer.
        out.append('<p>' + '<br/>'.join(inline(b) for b in buf) + '</p>')
        continue

    i += 1

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", Calibri, Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.55; color: #24292f; margin: 0;
}
h1 { font-size: 23pt; margin: 0 0 4pt; color: #0b2e59; letter-spacing: -0.3pt; }
h2 { font-size: 14pt; margin: 20pt 0 7pt; color: #0b2e59; padding-bottom: 3pt;
     border-bottom: 1px solid #d7dde3; page-break-after: avoid; }
h3 { font-size: 11.5pt; margin: 13pt 0 4pt; color: #1a1a1a; page-break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10pt 0 3pt; color: #444; page-break-after: avoid; }
p { margin: 6pt 0; text-align: justify; }
ul, ol { margin: 6pt 0 6pt 0; padding-left: 20pt; }
li { margin: 2.5pt 0; }
hr { border: 0; border-top: 1px solid #e3e8ed; margin: 14pt 0; }
code { font-family: Consolas, "Courier New", monospace; font-size: 9pt;
       background: #f2f4f7; padding: 1pt 4pt; border-radius: 3px; color: #10243e; }
pre { font-family: Consolas, "Courier New", monospace; font-size: 8.4pt; line-height: 1.38;
      background: #f7f9fb; border: 1px solid #e3e8ed; border-left: 3px solid #1f4e8c;
      padding: 8pt 10pt; white-space: pre; overflow: visible;
      page-break-inside: avoid; margin: 8pt 0; }
pre code { background: none; padding: 0; }
blockquote { margin: 9pt 0; padding: 7pt 11pt; background: #f4f8fd;
             border-left: 3px solid #1f4e8c; color: #28415e; page-break-inside: avoid; }
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; margin: 9pt 0; font-size: 9.3pt;
        page-break-inside: avoid; }
th { background: #eef2f7; color: #0b2e59; font-weight: 600; text-align: left;
     border: 1px solid #d7dde3; padding: 5pt 7pt; }
td { border: 1px solid #e3e8ed; padding: 5pt 7pt; vertical-align: top; }
tr:nth-child(even) td { background: #fbfcfd; }
a { color: #1f4e8c; text-decoration: none; }
strong { color: #10243e; }
.cover-sub { font-size: 12pt; color: #4a5a6a; margin-top: 0; }
"""

html = (
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>'
    '<title>BoutikPro — Guide de Présentation Client</title>'
    '<style>' + CSS + '</style></head><body>'
    + '\n'.join(out) +
    '</body></html>'
)
io.open(dst, 'w', encoding='utf-8', newline='').write(html)
print('HTML genere : %d blocs' % len(out))
