from pathlib import Path

root = Path('.')
for path in root.rglob('*'):
    if not path.is_file():
        continue
    if path.suffix.lower() not in {'.html', '.json', '.js', '.md', '.xml', '.txt'}:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    original = text
    text = text.replace('href="cad.html"', 'href="cad-cam-cae.html"')
    text = text.replace('href="cam.html"', 'href="cad-cam-cae.html"')
    text = text.replace('href="cae.html"', 'href="cad-cam-cae.html"')
    text = text.replace('"category": "cad"', '"category": "dfma"')
    text = text.replace('"category": "cam"', '"category": "fea"')
    text = text.replace('"category": "cae"', '"category": "cfd"')
    text = text.replace('"category": "CAD"', '"category": "DFMA"')
    text = text.replace('"category": "CAM"', '"category": "FEA"')
    text = text.replace('"category": "CAE"', '"category": "CFD"')
    text = text.replace('"tags": [\n      "CAD"', '"tags": [\n      "DFMA"')
    text = text.replace('"tags": [\n    "CAD"', '"tags": [\n    "DFMA"')
    text = text.replace('"tags": [\n      "CAD",', '"tags": [\n      "DFMA",')
    text = text.replace('"tags": [\n    "CAD",', '"tags": [\n    "DFMA",')
    text = text.replace('cad | cam | cae', 'dfma | fea | cfd')
    text = text.replace('cad/cam/cae', 'dfma/fea/cfd')
    text = text.replace('cad-cam-cae', 'cad-cam-cae')
    text = text.replace('(cad, cam, cae, robotics, embedded, manufacturing, ...)', '(dfma, fea, cfd, robotics, embedded, manufacturing, ...)')
    text = text.replace('loadCategoryGrid("cadProjects", ["cad", "cam", "cae"]);', 'loadCategoryGrid("cadProjects", ["dfma", "fea", "cfd"]);')
    text = text.replace('renderCategory("cadProjects", ["cad", "cam", "cae"]);', 'renderCategory("cadProjects", ["dfma", "fea", "cfd"]);')
    text = text.replace('loadCategoryGrid("cadProjects", ["cad"]);', 'loadCategoryGrid("cadProjects", ["dfma"]);')
    text = text.replace('loadCategoryGrid("camProjects", ["cam"]);', 'loadCategoryGrid("camProjects", ["fea"]);')
    text = text.replace('loadCategoryGrid("caeProjects", ["cae"]);', 'loadCategoryGrid("caeProjects", ["cfd"]);')
    if text != original:
        path.write_text(text, encoding='utf-8')
