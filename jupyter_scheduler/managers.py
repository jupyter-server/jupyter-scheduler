from abc import ABC, abstractmethod
from sqlite3 import OperationalError

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.orm import Base as DefaultBase
from jupyter_scheduler.orm import update_db_schema


class DatabaseManager(ABC):
    """Base class for database managers.

    Database managers handle database operations for jupyter-scheduler.
    Subclasses can implement custom storage backends (K8s, Redis, etc.)
    while maintaining compatibility with the scheduler's session interface.
    """

    @abstractmethod
    def create_session(self, db_url: str):
        """Create a database session.

        Args:
            db_url: Database URL (e.g., "k8s://namespace", "redis://localhost")

        Returns:
            Session object compatible with SQLAlchemy session interface
        """
        pass

    @abstractmethod
    def create_tables(self, db_url: str, drop_tables: bool = False, Base=None):
        """Create database tables/schema.

        Args:
            db_url: Database URL
            drop_tables: Whether to drop existing tables first
            Base: SQLAlchemy Base for custom schemas (tests)
        """
        pass


class SQLAlchemyDatabaseManager(DatabaseManager):
    """Default database manager using SQLAlchemy."""

    def create_session(self, db_url: str):
        """Create SQLAlchemy session factory."""
        engine = create_engine(db_url, echo=False)
        Session = sessionmaker(bind=engine)
        return Session

    def create_tables(self, db_url: str, drop_tables: bool = False, Base=None):
        """Create database tables using SQLAlchemy."""
        if Base is None:
            Base = DefaultBase

        engine = create_engine(db_url)
        update_db_schema(engine, Base)

        try:
            if drop_tables:
                Base.metadata.drop_all(engine)
        except OperationalError:
            pass
        finally:
            Base.metadata.create_all(engine)
