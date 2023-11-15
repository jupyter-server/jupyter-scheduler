from importlib import metadata

# expose Pydantic v1 API, regardless of Pydantic version in current env

try:
    from pydantic.v1 import *
except ImportError:
    from pydantic import *
