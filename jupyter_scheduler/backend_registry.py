import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Type

from jupyter_scheduler.backends import BackendConfig, DescribeBackend
from jupyter_scheduler.environments import EnvironmentManager
from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.scheduler import BaseScheduler

logger = logging.getLogger(__name__)


def import_class(class_path: str) -> Type:
    """Import a class from a fully qualified path like 'module.submodule.ClassName'."""
    module_path, class_name = class_path.rsplit(".", 1)
    module = __import__(module_path, fromlist=[class_name])
    return getattr(module, class_name)


@dataclass
class BackendInstance:
    """A running backend with its configuration and initialized scheduler."""

    config: BackendConfig
    scheduler: BaseScheduler


class BackendRegistry:
    """Registry for storing, initializing, and routing to scheduler backends."""

    def __init__(self, configs: List[BackendConfig], default_backend: str):
        self._configs = configs
        self._backends: Dict[str, BackendInstance] = {}
        self._default = default_backend
        self._extension_map: Dict[str, List[str]] = {}

    def initialize(
        self,
        root_dir: str,
        environments_manager: EnvironmentManager,
        db_url: str,
        config: Optional[Any] = None,
    ):
        """Instantiate all backends from configs."""
        for cfg in self._configs:
            try:
                instance = self._create_backend(cfg, root_dir, environments_manager, db_url, config)
                self._backends[cfg.id] = instance

                # Build extension map for auto-selection
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
        """Create a backend instance from configuration."""
        scheduler_class = import_class(cfg.scheduler_class)

        # Use backend-specific db_url if provided, otherwise use global
        backend_db_url = cfg.db_url or global_db_url

        # Create SQL tables only if backend uses default SQLAlchemy storage.
        # Backends with custom database_manager_class handle their own storage.
        if backend_db_url and cfg.database_manager_class is None:
            create_tables(backend_db_url)

        # Instantiate the scheduler
        scheduler = scheduler_class(
            root_dir=root_dir,
            environments_manager=environments_manager,
            db_url=backend_db_url,
            config=config,
            backend_id=cfg.id,
        )

        # Override execution_manager_class if specified in config
        if cfg.execution_manager_class:
            scheduler.execution_manager_class = import_class(cfg.execution_manager_class)

        return BackendInstance(config=cfg, scheduler=scheduler)

    def get_backend(self, backend_id: str) -> Optional[BackendInstance]:
        """Get a backend by ID, or None if not found."""
        return self._backends.get(backend_id)

    def get_default(self) -> BackendInstance:
        """Get the default backend."""
        if self._default not in self._backends:
            raise KeyError(f"Default backend '{self._default}' not found in registry")
        return self._backends[self._default]

    def get_for_file(self, input_uri: str) -> BackendInstance:
        """Auto-select backend by file extension (highest priority wins), or return default."""
        ext = ""
        if "." in input_uri:
            ext = input_uri.rsplit(".", 1)[-1].lower()

        candidates = self._extension_map.get(ext, [])
        if candidates:
            candidate_instances = [self._backends[bid] for bid in candidates]
            return max(candidate_instances, key=lambda b: b.config.priority)

        return self.get_default()

    def list_backends(self) -> List[DescribeBackend]:
        """Return backend descriptions for API/UI consumption."""
        return [
            DescribeBackend(
                id=b.config.id,
                name=b.config.name,
                description=b.config.description,
                file_extensions=b.config.file_extensions,
                output_formats=b.config.output_formats,
                is_default=b.config.is_default,
            )
            for b in self._backends.values()
        ]

    def list_backend_instances(self) -> List[BackendInstance]:
        """Return all backend instances."""
        return list(self._backends.values())

    def __len__(self) -> int:
        return len(self._backends)

    def __contains__(self, backend_id: str) -> bool:
        return backend_id in self._backends
