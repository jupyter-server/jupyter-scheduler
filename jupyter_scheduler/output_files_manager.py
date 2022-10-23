import os
import tarfile
from multiprocessing import Process
from typing import Dict, List, Optional, Type

import fsspec
from jupyter_server.utils import ensure_async

from jupyter_scheduler.scheduler import BaseScheduler
from jupyter_scheduler.utils import resolve_path


class OutputFilesManager:
    scheduler = None

    def __init__(self, scheduler: Type[BaseScheduler]):
        self.scheduler = scheduler

    async def copy_from_staging(self, job_id: str, redownload: Optional[bool] = False):
        staging_paths = await ensure_async(self.scheduler.get_staging_paths(job_id))
        job = await ensure_async(self.scheduler.get_job(job_id, False))
        output_filenames = self.scheduler.get_output_filenames(job)

        p = Process(
            target=Downloader(
                output_formats=job.output_formats,
                output_prefix=job.output_prefix,
                output_filenames=output_filenames,
                staging_paths=staging_paths,
                root_dir=self.scheduler.root_dir,
                redownload=redownload,
            ).download
        )
        p.start()


class Downloader:
    def __init__(
        self,
        output_formats: List[str],
        output_prefix: str,
        output_filenames: Dict[str, str],
        staging_paths: Dict[str, str],
        root_dir: str,
        redownload: bool,
    ):
        self.output_formats = output_formats
        self.output_prefix = output_prefix
        self.output_filenames = output_filenames
        self.staging_paths = staging_paths
        self.root_dir = root_dir
        self.redownload = redownload

    def generate_filepaths(self):
        """A generator that produces filepaths"""
        output_dir = resolve_path(self.output_prefix, self.root_dir)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        for output_format in self.output_formats:
            input_filepath = self.staging_paths[output_format]
            output_filename = self.output_filenames[output_format]
            output_filepath = os.path.join(output_dir, output_filename)
            if not os.path.exists(output_filepath) or self.redownload:
                yield input_filepath, output_filepath

    def download_tar(self, archive_format: str = "tar"):
        archive_filepath = self.staging_paths[archive_format]
        read_mode = "r:gz" if archive_format == "tar.gz" else "tar"
        with fsspec.open(archive_filepath) as f:
            with tarfile.open(fileobj=f, mode=read_mode) as tar:
                filepaths = self.generate_filepaths()
                for input_filepath, output_filepath in filepaths:
                    input_file = tar.extractfile(member=input_filepath)
                    with fsspec.open(output_filepath, mode="wb") as output_file:
                        output_file.write(input_file.read())

    def download(self):
        if not self.staging_paths:
            return

        if "tar" in self.staging_paths:
            self.download_tar()
        elif "tar.gz" in self.staging_paths:
            self.download_tar("tar.gz")
        else:
            filepaths = self.generate_filepaths()
            for input_filepath, output_filepath in filepaths:
                with fsspec.open(input_filepath) as input_file:
                    with fsspec.open(output_filepath, mode="wb") as output_file:
                        output_file.write(input_file.read())
