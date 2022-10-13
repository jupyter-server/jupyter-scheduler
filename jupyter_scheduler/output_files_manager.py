import os
from multiprocessing import Process
from typing import Dict, List, Optional, Type

import fsspec

from jupyter_scheduler.models import DescribeJob
from jupyter_scheduler.orm import Job
from jupyter_scheduler.scheduler import BaseScheduler
from jupyter_scheduler.utils import resolve_path


class OutputFilesManager:
    scheduler = None

    def __init__(self, scheduler: Type[BaseScheduler]):
        self.scheduler = scheduler

    def copy_from_staging(self, job_id: str, redownload: Optional[bool] = False):
        staging_paths = self.scheduler.get_staging_paths(job_id)
        job = self.scheduler.get_job(job_id)

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

    def download(self):
        for output_format in self.output_formats:
            input_filepath = self.staging_paths[output_format]
            output_filename = os.path.basename(input_filepath)
            output_dir = resolve_path(self.output_prefix, self.root_dir)
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_filepath = os.path.join(output_dir, output_filename)
            if self.redownload or not os.path.exists(output_filepath):
                with fsspec.open(input_filepath) as input_file:
                    with fsspec.open(output_filepath, mode="wb") as output_file:
                        output_file.write(input_file.read())
