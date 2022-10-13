import json
from pathlib import Path

__all__ = ["__version__"]

version_info = (0, 4, 2, "", "")
__version__ = ".".join(map(str, version_info[:3])) + "".join(version_info[3:])
