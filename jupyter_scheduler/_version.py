import json
from pathlib import Path

__all__ = ["__version__"]

version_info = (1, 9, 0, "", "")
__version__ = ".".join(map(str, version_info[:3])) + "".join(version_info[3:])
