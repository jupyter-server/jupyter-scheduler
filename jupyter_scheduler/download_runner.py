import asyncio

import traitlets
from jupyter_server.transutils import _i18n
from traitlets.config import LoggingConfigurable

from jupyter_scheduler.download_manager import DownloadManager
from jupyter_scheduler.job_files_manager import JobFilesManager


class BaseDownloadRunner(LoggingConfigurable):
    """Base download runner, this class's start method is called
    at the start of jupyter server, and is responsible for
    polling for downloads to download.
    """

    def __init__(self, config=None, **kwargs):
        super().__init__(config=config)

    downloads_poll_interval = traitlets.Integer(
        default_value=3,
        config=True,
        help=_i18n(
            "The interval in seconds that the download runner polls for downloads to download."
        ),
    )

    def start(self):
        raise NotImplementedError("Must be implemented by subclass")


class DownloadRunner(BaseDownloadRunner):
    """Default download runner that maintains a record and a queue of initiated downloads , and polls the queue every `poll_interval` seconds
    for downloads to download.
    """

    def __init__(
        self, download_manager: DownloadManager, job_files_manager: JobFilesManager, config=None
    ):
        super().__init__(config=config)
        self.download_manager = download_manager
        self.job_files_manager = job_files_manager

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
            await asyncio.sleep(self.downloads_poll_interval)
