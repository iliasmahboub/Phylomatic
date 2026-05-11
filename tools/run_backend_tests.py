"""Run the backend test suite with deterministic pytest plugin loading."""

from __future__ import annotations

import os
import subprocess
import sys


def main() -> int:
    """Run pytest while avoiding unrelated globally installed plugins."""
    env = os.environ.copy()
    env["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"

    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "-p",
        "pytest_asyncio.plugin",
        "backend/tests/",
        *sys.argv[1:],
    ]
    return subprocess.call(cmd, env=env)


if __name__ == "__main__":
    raise SystemExit(main())
