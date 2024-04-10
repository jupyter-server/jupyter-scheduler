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
            download_record = self.download_manager.record_manager.get(download.download_id)
            if not download_record:
                continue
            await self.job_files_manager.copy_from_staging(download.job_id, download.redownload)
            self.download_manager.delete_download(download.download_id)

    async def start(self):
        self.download_manager.populate_queue()
        while True:
            await self.process_download_queue()
            await asyncio.sleep(self.poll_interval)
