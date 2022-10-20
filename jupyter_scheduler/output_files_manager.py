import os
import tarfile
from multiprocessing import Process
from typing import List, Optional, Type

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
        job = await ensure_async(self.scheduler.get_job(job_id))

        p = Process(
            target=Downloader(
                output_formats=job.output_formats,
                output_prefix=job.output_prefix,
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
        staging_paths: str,
        root_dir: str,
        redownload: bool,
    ):
        self.output_formats = output_formats
        self.output_prefix = output_prefix
        self.staging_paths = staging_paths
        self.root_dir = root_dir
        self.redownload = redownload

    def download_tar(self, read_mode: str = "r"):
        input_filepath = next(iter(self.staging_paths.values()))
        with fsspec.open(input_filepath) as f:
            with tarfile.open(fileobj=f, mode=read_mode) as tar:

                output_dir = resolve_path(self.output_prefix, self.root_dir)
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)

                filenames = tar.getnames()
                for filename in filenames:
                    fileformat = os.path.splitext(filename)[-1][1:]
                    output_filepath = os.path.join(output_dir, filename)
                    if fileformat in self.output_formats and (
                        self.redownload or not os.path.exists(output_filepath)
                    ):
                        tar.extract(member=filename, path=output_dir)

    def download(self):
        if not self.staging_paths:
            return

        first_filepath = next(iter(self.staging_paths.values()))
        if first_filepath.endswith("tar"):
            self.download_tar()
        elif first_filepath.endswith("tar.gz"):
            self.download_tar("r:gz")
        else:
            for output_format in self.output_formats:
                output_dir = resolve_path(self.output_prefix, self.root_dir)
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)

                input_filepath = self.staging_paths[output_format]
                output_filename = os.path.basename(input_filepath)
                output_filepath = os.path.join(output_dir, output_filename)

                if os.path.exists(output_filepath) and not self.redownload:
                    continue

                with fsspec.open(input_filepath) as input_file:
                    with fsspec.open(output_filepath, mode="wb") as output_file:
                        output_file.write(input_file.read())
