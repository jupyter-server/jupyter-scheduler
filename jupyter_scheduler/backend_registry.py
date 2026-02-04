import logging
from typing import Any, Dict, List, Optional, Type

from jupyter_scheduler.backends import BackendConfig, DescribeBackendResponse
from jupyter_scheduler.environments import EnvironmentManager
from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.pydantic_v1 import BaseModel

logger = logging.getLogger(__name__)


def import_class(class_path: str) -> Type:
    """Import a class from a fully qualified path like 'module.submodule.ClassName'."""
    module_path, class_name = class_path.rsplit(".", 1)
    module = __import__(module_path, fromlist=[class_name])
    return getattr(module, class_name)


class BackendInstance(BaseModel):
    """A running backend with its configuration and initialized scheduler."""

    config: BackendConfig
    scheduler: Any  # BaseScheduler at runtime, but Any to support test mocks


class BackendRegistry:
    """Registry for storing, initializing, and routing to scheduler backends."""

    def __init__(
        self,
        configs: List[BackendConfig],
        legacy_job_backend: str,
        preferred_backends: Optional[Dict[str, str]] = None,
    ):
        self._configs = configs
        self._backends: Dict[str, BackendInstance] = {}
        self._legacy_job_backend = legacy_job_backend
        self._preferred_backends = preferred_backends or {}
        self._extension_map: Dict[str, List[str]] = {}

    def initialize(
        self,
        root_dir: str,
        environments_manager: EnvironmentManager,
        db_url: str,
        config: Optional[Any] = None,
    ):
        """Instantiate all backends from configs."""
        seen_ids = set()
        for cfg in self._configs:
            if cfg.id in seen_ids:
                raise ValueError(f"Duplicate backend ID: '{cfg.id}'")
            if ":" in cfg.id:
                raise ValueError(f"Backend ID cannot contain ':': '{cfg.id}'")
            seen_ids.add(cfg.id)

        for cfg in self._configs:
            try:
                instance = self._create_backend(cfg, root_dir, environments_manager, db_url, config)
                self._backends[cfg.id] = instance

                for ext in cfg.file_extensions:
                    ext_lower = ext.lower().lstrip(".")
                    if ext_lower not in self._extension_map:
                        self._extension_map[ext_lower] = []
                    self._extension_map[ext_lower].append(cfg.id)

                logger.info(f"Initialized backend: {cfg.id} ({cfg.name})")
            except Exception as e:
                logger.error(f"Failed to initialize backend {cfg.id}: {e}")
                raise

    def _create_backend(
        self,
        cfg: BackendConfig,
        root_dir: str,
        environments_manager: EnvironmentManager,
        global_db_url: str,
        config: Optional[Any] = None,
    ) -> BackendInstance:
        """Import scheduler class, instantiate it, and return a BackendInstance.

        Creates database tables if not found and backend uses default SQLAlchemy storage.
        """
        scheduler_class = import_class(cfg.scheduler_class)

        backend_db_url = cfg.db_url or global_db_url

        # Create SQL tables only if backend uses default SQLAlchemy storage.
        # Backends with custom database_manager_class handle their own storage.
        if backend_db_url and cfg.database_manager_class is None:
            create_tables(backend_db_url)

        scheduler = scheduler_class(
            root_dir=root_dir,
            environments_manager=environments_manager,
            db_url=backend_db_url,
            config=config,
            backend_id=cfg.id,
        )

        if cfg.execution_manager_class:
            scheduler.execution_manager_class = import_class(cfg.execution_manager_class)

        return BackendInstance(config=cfg, scheduler=scheduler)

    def get_backend(self, backend_id: str) -> Optional[BackendInstance]:
        """Return a backend with matching ID, None if none is found."""
        return self._backends.get(backend_id)

    def get_legacy_job_backend(self) -> BackendInstance:
        """Get the backend for routing legacy jobs (UUID-only IDs from pre-3.0).

        Raises:
            KeyError: If the configured legacy_job_backend ID is not found.
        """
        if self._legacy_job_backend not in self._backends:
            raise KeyError(f"Legacy job backend '{self._legacy_job_backend}' not found in registry")
        return self._backends[self._legacy_job_backend]

    def get_for_file(self, input_uri: str) -> BackendInstance:
        """Auto-select backend by file extension. Prefers configured backend, else alphabetical.

        Raises:
            ValueError: If no backend supports the file extension.
        """
        ext = ""
        if "." in input_uri:
            ext = input_uri.rsplit(".", 1)[-1].lower()

        candidate_ids = self._extension_map.get(ext, [])
        if not candidate_ids:
            raise ValueError(f"No backend supports file extension '.{ext}'")

        # 1. Check explicit preference for this extension
        preferred_id = self._preferred_backends.get(ext)
        if preferred_id and preferred_id in candidate_ids:
            return self._backends[preferred_id]

        # 2. Otherwise return min by name (first alphabetically)
        candidate_instances = [self._backends[bid] for bid in candidate_ids]
        return min(candidate_instances, key=lambda b: b.config.name)

    def describe_backends(self) -> List[DescribeBackendResponse]:
        """Return backend descriptions sorted alphabetically by name. Frontend uses first as default."""
        backends_sorted = sorted(self._backends.values(), key=lambda b: b.config.name)
        return [
            DescribeBackendResponse(
                id=b.config.id,
                name=b.config.name,
                description=b.config.description,
                file_extensions=b.config.file_extensions,
                output_formats=b.config.output_formats,
            )
            for b in backends_sorted
        ]

    @property
    def backends(self) -> List[BackendInstance]:
        """Return all backend instances."""
        return list(self._backends.values())

    def __len__(self) -> int:
        return len(self._backends)

    def __contains__(self, backend_id: str) -> bool:
        return backend_id in self._backends
