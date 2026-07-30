from pathlib import Path

root = Path('.')
files = []
for pattern in ['*.html', '*.json', '*.js', '*.md', '*.xml', '*.txt']:
    files.extend(root.glob(pattern))
for path in root.rglob('*'):
    if path.is_file() and path.suffix.lower() in {'.html', '.json', '.js', '.md', '.xml', '.txt'}:
        if path not in files:
            files.append(path)

for path in files:
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    original = text
    text = text.replace('(cad, cam, cae, robotics, embedded, manufacturing, ...)', '(dfma, fea, cfd, robotics, embedded, manufacturing, ...)')
    text = text.replace('renderCategory("cadProjects", ["cad", "cam", "cae"]);', 'renderCategory("cadProjects", ["dfma", "fea", "cfd"]);')
    text = text.replace('loadCategoryGrid("cadProjects", ["cad", "cam", "cae"]);', 'loadCategoryGrid("cadProjects", ["dfma", "fea", "cfd"]);')
    text = text.replace('loadCategoryGrid("cadProjects", ["cad"]);', 'loadCategoryGrid("cadProjects", ["dfma"]);')
    text = text.replace('loadCategoryGrid("camProjects", ["cam"]);', 'loadCategoryGrid("camProjects", ["fea"]);')
    text = text.replace('loadCategoryGrid("caeProjects", ["cae"]);', 'loadCategoryGrid("caeProjects", ["cfd"]);')
    text = text.replace('"category": "cad"', '"category": "dfma"')
    text = text.replace('"category": "cam"', '"category": "fea"')
    text = text.replace('"category": "cae"', '"category": "cfd"')
    text = text.replace('"category": "CAD"', '"category": "DFMA"')
    text = text.replace('"category": "CAM"', '"category": "FEA"')
    text = text.replace('"category": "CAE"', '"category": "CFD"')
    text = text.replace('"title": "CAD', '"title": "DFMA')
    text = text.replace('"title": "CAM', '"title": "FEA')
    text = text.replace('"title": "CAE', '"title": "CFD')
    text = text.replace('"tags": [\n      "CAD"', '"tags": [\n      "DFMA"')
    text = text.replace('"tags": [\n    "CAD"', '"tags": [\n    "DFMA"')
    text = text.replace('"tags": [\n      "CAE"', '"tags": [\n      "CFD"')
    text = text.replace('"tags": [\n    "CAE"', '"tags": [\n    "CFD"')
    text = text.replace('"tags": [\n      "CAM"', '"tags": [\n      "FEA"')
    text = text.replace('"tags": [\n    "CAM"', '"tags": [\n    "FEA"')
    text = text.replace('cad | cam | cae', 'dfma | fea | cfd')
    text = text.replace('CAD / CAM / CAE', 'DFMA / FEA / CFD')
    text = text.replace('CAD • CAM • CAE', 'DFMA • FEA • CFD')
    text = text.replace('CAD · CAM · CAE', 'DFMA · FEA · CFD')
    if text != original:
        path.write_text(text, encoding='utf-8')
