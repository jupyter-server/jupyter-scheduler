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
        poll_interval: int = 10,
    ):
        self.download_manager = download_manager
        self.job_files_manager = job_files_manager
        self.poll_interval = poll_interval

    # def add_download(self, job_id: str):
    #     download_initiated_time = get_utc_timestamp()
    #     download_id = generate_uuid()
    #     download_cache = DescribeDownloadCache(
    #         job_id=job_id,
    #         download_id=download_id,
    #         download_initiated_time=download_initiated_time,
    #     )
    #     self.download_cache.put(download_cache)
    #     download_task = DownloadTask(
    #         job_id=job_id,
    #         download_id=download_id,
    #         download_initiated_time=download_initiated_time,
    #     )
    #     self.download_queue.put(download_task)

    # def delete_download(self, download_id: str):
    #     self.download_cache.delete_download(download_id)

    # def delete_job_downloads(self, job_id: str):
    #     self.download_cache.delete_job_downloads(job_id)

    async def process_download_queue(self):
        print("\n\n***\nDownloadRunner.process_download_queue isempty")
        print(self.download_manager.queue.isempty())
        while not self.download_manager.queue.isempty():
            download = self.download_manager.queue.get()
            print(download)
            cache = self.download_manager.cache.get(download.job_id)
            print(cache)
            if not cache or not download:
                continue
            await self.job_files_manager.copy_from_staging(cache.job_id)
            self.download_manager.cache.delete_download(cache.download_id)

    # def populate_queue(self):
    #     tasks = self.download_manager.cache.get_tasks()
    #     for task in tasks:
    #         download_task = DownloadTask(
    #             job_id=task.job_id,
    #             download_id=task.download_id,
    #             download_initiated_time=task.download_initiated_time,
    #         )
    #         self.download_manager.queue.put(download_task)

    async def start(self):
        self.download_manager.populate_queue()
        while True:
            await self.process_download_queue()
            await asyncio.sleep(self.poll_interval)
