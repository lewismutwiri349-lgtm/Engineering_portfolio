import json
from pathlib import Path
path = Path('projects.json')
data = json.loads(path.read_text(encoding='utf8'))
if not isinstance(data, list):
    raise SystemExit('Expected a list at root of projects.json')
preserve_ids = {
    'esp32-iot-automation',
    'ansys-fluent-fluid-flow',
    'product-design-and-development-course-certification',
    'neo6m-rocket-recovery',
}
removed = 0
for item in data:
    if isinstance(item, dict) and 'tags' in item and item.get('id') not in preserve_ids:
        item.pop('tags', None)
        removed += 1
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
print(f'Removed tags from {removed} records; preserved {len(preserve_ids)} exception records')
