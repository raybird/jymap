"""依既有事件標記產生待查盤點；建立日期：2026-10-30。"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--date', required=True, help='盤點日期 YYYY-MM-DD')
args = parser.parse_args()
source = ROOT / 'webapp/src/assets/data/events.json'
events = json.loads(source.read_text())
rows = []
for event in events:
    tags = event['tags']
    placeholder = any('佔位' in tag for tag in tags)
    year_pending = '年代待考' in tags
    location_pending = '位置待考' in tags or '定位待考' in tags
    dynasty_pending = '朝代待考' in tags
    rows.append({
        'id': event['id'], 'novel': event['novel'], 'title': event['title'],
        'year': event['year'], 'dynasty': event['dynasty'],
        'priority': 'P1' if placeholder else 'P2' if year_pending else 'P3' if location_pending else None,
        'yearPlaceholder': placeholder, 'yearPending': year_pending,
        'dynastyPending': dynasty_pending, 'locationPending': location_pending,
        'inferredYear': '推算年份' in tags,
        'approximateLocation': '約略定位' in tags,
        'versionDifference': '版本差異' in tags,
    })
counts = {key: sum(bool(row[key]) for row in rows) for key in (
    'yearPlaceholder', 'yearPending', 'dynastyPending', 'locationPending',
    'inferredYear', 'approximateLocation', 'versionDifference')}
counts['pendingEvents'] = sum(row['priority'] is not None for row in rows)
result = {'checkedOn': args.date, 'source': str(source.relative_to(ROOT)),
          'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'totalEvents': len(rows), 'counts': counts, 'events': rows}
out = ROOT / f'docs/analysis/{args.date}-event-uncertainty-inventory.json'
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'file': str(out.relative_to(ROOT)), 'total': len(rows), **counts}, ensure_ascii=False))
print('作品 | 總數 | 年代待考 | 年份佔位 | 朝代待考 | 位置待考')
for novel in dict.fromkeys(row['novel'] for row in rows):
    group = [row for row in rows if row['novel'] == novel]
    print(' | '.join([novel, str(len(group))] + [str(sum(row[k] for row in group)) for k in (
        'yearPending', 'yearPlaceholder', 'dynastyPending', 'locationPending')]))
