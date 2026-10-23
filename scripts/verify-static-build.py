"""Verify committed static build hashes before publishing."""
import hashlib
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1] / "dist"
manifest = json.loads((root / "data-app-build.json").read_text())
for kind in ("html", "snapshot"):
    entry = manifest[kind]
    data = (root / entry["path"]).read_bytes()
    assert len(data) == entry["bytes"], f"{kind}: byte count differs"
    assert hashlib.sha256(data).hexdigest() == entry["sha256"], f"{kind}: hash differs"
print("HTML and complete data snapshot verified.")
