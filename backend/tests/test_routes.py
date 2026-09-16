import sys
sys.path.insert(0, 'backend')
from app.main import app

print(f"SUCCESS: Loaded {app.title} v{app.version}")
print(f"Total registered routes: {len(app.routes)}")
for r in app.routes:
    methods = getattr(r, 'methods', None)
    m_str = ','.join(methods) if methods else 'WS'
    path = getattr(r, 'path', getattr(r, 'prefix', str(r)))
    print(f"  [{m_str}] {path}")


