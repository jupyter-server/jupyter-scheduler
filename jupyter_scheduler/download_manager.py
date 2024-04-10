from dataclasses import dataclass
from datetime import datetime
from multiprocessing import Queue
from typing import List, Optional

from jupyter_scheduler.orm import Downloads, create_session, generate_uuid
from jupyter_scheduler.pydantic_v1 import BaseModel
from jupyter_scheduler.utils import get_utc_timestamp
from jupyter_scheduler.pydantic_v1 import BaseModel


class DescribeDownload(BaseModel):
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


class DownloadRecordManager:
    def __init__(self, db_url):
        self.session = create_session(db_url)

    def put(self, download: DescribeDownload):
        with self.session() as session:
            new_download = Downloads(**download.dict())
            session.add(new_download)
            session.commit()

    def get(self, job_id: str) -> Optional[DescribeDownload]:
        with self.session() as session:
            download = session.query(Downloads).filter(Downloads.job_id == job_id).first()

        if download:
            return DescribeDownload.from_orm(download)
        else:
            return None

    def get_tasks(self) -> List[DescribeDownload]:
        with self.session() as session:
            return session.query(Downloads).order_by(Downloads.download_initiated_time).all()

    def delete_download(self, download_id: str):
        with self.session() as session:
            session.query(Downloads).filter(Downloads.download_id == download_id).delete()
            session.commit()

    def delete_job_downloads(self, job_id: str):
        with self.session() as session:
            session.query(Downloads).filter(Downloads.job_id == job_id).delete()
            session.commit()


class DownloadManager:
    def __init__(self, db_url: str):
        self.record_manager = DownloadRecordManager(db_url=db_url)
        self.queue = Queue()

    def download_from_staging(self, job_id: str):
        download_initiated_time = get_utc_timestamp()
        download_id = generate_uuid()
        download_cache = DescribeDownload(
            job_id=job_id,
            download_id=download_id,
            download_initiated_time=download_initiated_time,
        )
        self.record_manager.put(download_cache)
        download_task = DownloadTask(
            job_id=job_id,
            download_id=download_id,
            download_initiated_time=download_initiated_time,
        )
        self.queue.put(download_task)

    def delete_download(self, download_id: str):
        self.record_manager.delete_download(download_id)

    def delete_job_downloads(self, job_id: str):
        self.record_manager.delete_job_downloads(job_id)

    def populate_queue(self):
        tasks = self.record_manager.get_tasks()
        for task in tasks:
            download_task = DownloadTask(
                job_id=task.job_id,
                download_id=task.download_id,
                download_initiated_time=task.download_initiated_time,
            )
            self.queue.put(download_task)
