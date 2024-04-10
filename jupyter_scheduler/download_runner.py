import asyncio

from jupyter_scheduler.download_manager import DownloadManager
from jupyter_scheduler.job_files_manager import JobFilesManager


class BaseDownloadRunner:
    def start(self):
        raise NotImplementedError("Must be implemented by subclass")


class DownloadRunner(BaseDownloadRunner):
    def __init__(
        self,
        download_manager: DownloadManager,
        job_files_manager: JobFilesManager,
        poll_interval: int = 5,
    ):
        self.download_manager = download_manager
        self.job_files_manager = job_files_manager
        self.poll_interval = poll_interval

    async def process_download_queue(self):
        while not self.download_manager.queue.empty():
            download = self.download_manager.queue.get()
            cache = self.download_manager.record_manager.get(download.job_id)
            if not cache or not download:
                continue
            await self.job_files_manager.copy_from_staging(cache.job_id)
            self.download_manager.record_manager.delete_download(cache.download_id)

    async def start(self):
        self.download_manager.populate_queue()
        while True:
            await self.process_download_queue()
            await asyncio.sleep(self.poll_interval)
