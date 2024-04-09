from dataclasses import dataclass
from datetime import datetime
from multiprocessing import Queue
from typing import List, Optional

from jupyter_scheduler.orm import DownloadCacheRecord, create_session, generate_uuid
from jupyter_scheduler.utils import get_utc_timestamp
from jupyter_scheduler.pydantic_v1 import BaseModel


class DescribeDownloadCache(BaseModel):
    job_id: str
    download_id: str
    download_initiated_time: int

    class Config:
        orm_mode = True


@dataclass
class DownloadTask:
    job_id: str
    download_id: str
    download_initiated_time: int

    def __lt__(self, other):
        return self.download_initiated_time < other.download_initiated_time

    def __str__(self):
        download_initiated_time = datetime.fromtimestamp(self.download_initiated_time / 1e3)
        return f"Id: {self.job_id}, Download initiated: {download_initiated_time}"


class MultiprocessQueue:
    """A multiprocess-safe queue using multiprocessing.Queue()"""

    def __init__(self):
        self.queue = Queue()

    def put(self, download: DownloadTask):
        self.queue.put(download)

    def get(self) -> Optional[DownloadTask]:
        return self.queue.get() if not self.queue.empty() else None

    def isempty(self) -> bool:
        return self.queue.empty()


class DownloadCache:
    def __init__(self, db_url):
        self.session = create_session(db_url)

    def put(self, download: DescribeDownloadCache):
        with self.session() as session:
            new_download = DownloadCacheRecord(**download.dict())
            session.add(new_download)
            session.commit()

    def get(self, job_id: str) -> Optional[DescribeDownloadCache]:
        with self.session() as session:
            download = (
                session.query(DownloadCacheRecord)
                .filter(DownloadCacheRecord.job_id == job_id)
                .first()
            )

        if download:
            return DescribeDownloadCache.from_orm(download)
        else:
            return None

    def get_tasks(self) -> List[DescribeDownloadCache]:
        with self.session() as session:
            return (
                session.query(DownloadCacheRecord)
                .order_by(DownloadCacheRecord.download_initiated_time)
                .all()
            )

    def delete_download(self, download_id: str):
        with self.session() as session:
            session.query(DownloadCacheRecord).filter(
                DownloadCacheRecord.download_id == download_id
            ).delete()
            session.commit()

    def delete_job_downloads(self, job_id: str):
        with self.session() as session:
            session.query(DownloadCacheRecord).filter(DownloadCacheRecord.job_id == job_id).delete()
            session.commit()


class DownloadManager:
    def __init__(self, db_url: str):
        self.cache = DownloadCache(db_url=db_url)
        self.queue = MultiprocessQueue()

    def download_from_staging(self, job_id: str):
        download_initiated_time = get_utc_timestamp()
        download_id = generate_uuid()
        download_cache = DescribeDownloadCache(
            job_id=job_id,
            download_id=download_id,
            download_initiated_time=download_initiated_time,
        )
        self.cache.put(download_cache)
        download_task = DownloadTask(
            job_id=job_id,
            download_id=download_id,
            download_initiated_time=download_initiated_time,
        )
        self.queue.put(download_task)

    def delete_download(self, download_id: str):
        self.cache.delete_download(download_id)

    def delete_job_downloads(self, job_id: str):
        self.cache.delete_job_downloads(job_id)

    def populate_queue(self):
        tasks = self.cache.get_tasks()
        for task in tasks:
            download_task = DownloadTask(
                job_id=task.job_id,
                download_id=task.download_id,
                download_initiated_time=task.download_initiated_time,
            )
            self.queue.put(download_task)
