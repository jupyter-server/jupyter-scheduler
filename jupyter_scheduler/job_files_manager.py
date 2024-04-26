import os
import random
import tarfile
from multiprocessing import Process
from typing import Dict, List, Optional, Type

import fsspec
from jupyter_server.utils import ensure_async

from jupyter_scheduler.exceptions import SchedulerError
from jupyter_scheduler.scheduler import BaseScheduler


class JobFilesManager:
    scheduler = None

    def __init__(self, scheduler: Type[BaseScheduler]):
        self.scheduler = scheduler

    async def copy_from_staging(self, job_id: str, redownload: Optional[bool] = False):
        job = await ensure_async(self.scheduler.get_job(job_id, False))
        staging_paths = await ensure_async(self.scheduler.get_staging_paths(job))
        output_filenames = self.scheduler.get_job_filenames(job)
        output_dir = self.scheduler.get_local_output_path(model=job, root_dir_relative=True)

        p = Process(
            target=Downloader(
                output_formats=job.output_formats,
                output_filenames=output_filenames,
                staging_paths=staging_paths,
                output_dir=output_dir,
                redownload=redownload,
                include_staging_files=job.package_input_folder,
            ).download
        )
        p.start()


class Downloader:
    def __init__(
        self,
        output_formats: List[str],
        output_filenames: Dict[str, str],
        staging_paths: Dict[str, str],
        output_dir: str,
        redownload: bool,
        include_staging_files: bool = False,
    ):
        self.output_formats = output_formats
        self.output_filenames = output_filenames
        self.staging_paths = staging_paths
        self.output_dir = output_dir
        self.redownload = redownload
        self.include_staging_files = include_staging_files

    def generate_filepaths(self):
        """A generator that produces filepaths"""
        output_formats = self.output_formats + ["input"]
        for output_format in output_formats:
            input_filepath = self.staging_paths[output_format]
            output_filepath = os.path.join(self.output_dir, self.output_filenames[output_format])
            if not os.path.exists(output_filepath) or self.redownload:
                yield input_filepath, output_filepath
        if self.include_staging_files:
            staging_dir = os.path.dirname(self.staging_paths["input"])
            for file_relative_path in self.output_filenames["files"]:
                input_filepath = os.path.join(staging_dir, file_relative_path)
                output_filepath = os.path.join(self.output_dir, file_relative_path)
                if not os.path.exists(output_filepath) or self.redownload:
                    yield input_filepath, output_filepath

    def download_tar(self, archive_format: str = "tar"):
        archive_filepath = self.staging_paths[archive_format]
        read_mode = "r:gz" if archive_format == "tar.gz" else "tar"

        with fsspec.open(archive_filepath) as f:
            with tarfile.open(fileobj=f, mode=read_mode) as tar:
                tar.extractall(self.output_dir)

    def download(self):
        # ensure presence of staging paths
        if not self.staging_paths:
            return

        # ensure presence of output dir
        output_dir = self.output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if "tar" in self.staging_paths:
            self.download_tar()
        elif "tar.gz" in self.staging_paths:
            self.download_tar("tar.gz")
        else:
            filepaths = self.generate_filepaths()
            for input_filepath, output_filepath in filepaths:
                try:
                    with fsspec.open(input_filepath) as input_file:
                        with fsspec.open(output_filepath, mode="wb") as output_file:
                            output_file.write(input_file.read())
                except Exception as e:
                    pass


class JobFilesManagerWithErrors(JobFilesManager):
    """
    Use only for testing exceptions, not to be used in production

    This uses the default `JobFilesManager`, but randomly
    raises the `SchedulerError` to help view/test errors in the
    UI. To use this, specify the fully classified class name at
    at start up or add to one of the server config files.

    Usage
    -----
    >> jupyter lab --SchedulerApp.job_files_manager_class=jupyter_scheduler.job_files_manager.JobFilesManagerWithErrors
    """

    def _should_raise_error(self, probability=0.5):
        return random.random() < probability

    async def copy_from_staging(self, job_id: str, redownload: Optional[bool] = False):
        if self._should_raise_error():
            raise SchedulerError("Failed copy_from_staging because of a deliberate exception.")
        else:
            return super().copy_from_staging(job_id, redownload)
