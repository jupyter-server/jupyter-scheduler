import filecmp
import os
import shutil
import tarfile
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from jupyter_scheduler.job_files_manager import Downloader, JobFilesManager
from jupyter_scheduler.models import DescribeJob, JobFile


async def test_copy_from_staging():
    job = DescribeJob(
        name="job_1",
        job_id="1",
        input_filename="helloworld.ipynb",
        runtime_environment_name="env_a",
        output_formats=["ipynb", "html"],
        job_files=[
            JobFile(display_name="Notebook", file_format="ipynb"),
            JobFile(display_name="HTML", file_format="html"),
            JobFile(display_name="input", file_format="input"),
        ],
        url="scheduler/jobs/1",
        create_time=1,
        update_time=1,
    )

    staging_paths = {
        "ipynb": "1/helloworld-1.ipynb",
        "html": "1/helloworld-1.html",
        "input": "1/helloworld.ipynb",
    }
    job_filenames = {
        "ipynb": "helloworld.ipynb",
        "html": "helloworld.html",
        "input": "helloworld.ipynb",
    }
    output_dir = "jobs/1"
    with patch("jupyter_scheduler.job_files_manager.Downloader") as mock_downloader:
        with patch("jupyter_scheduler.job_files_manager.Process") as mock_process:
            with patch("jupyter_scheduler.scheduler.Scheduler") as mock_scheduler:
                mock_scheduler.get_job.return_value = job
                mock_scheduler.get_staging_paths.return_value = staging_paths
                mock_scheduler.get_local_output_path.return_value = output_dir
                mock_scheduler.get_job_filenames.return_value = job_filenames
                manager = JobFilesManager(scheduler=mock_scheduler)
                await manager.copy_from_staging(1)

                mock_downloader.assert_called_once_with(
                    output_formats=job.output_formats,
                    output_filenames=job_filenames,
                    staging_paths=staging_paths,
                    output_dir=output_dir,
                    redownload=False,
                )


HERE = Path(__file__).parent.resolve()
OUTPUTS_DIR = os.path.join(HERE, "test_files_output")


@pytest.fixture
def clear_outputs_dir():
    yield
    shutil.rmtree(OUTPUTS_DIR)
    # rmtree() is not synchronous; wait until it has finished running
    while os.path.isdir(OUTPUTS_DIR):
        time.sleep(0.01)


@pytest.mark.parametrize(
    "output_formats, output_filenames, staging_paths, output_dir, redownload",
    [
        (
            ["ipynb", "html"],
            {
                "ipynb": "job-1/helloworld-out.ipynb",
                "html": "job-1/helloworld-out.html",
                "input": "job-1/helloworld-input.ipynb",
            },
            {
                "ipynb": os.path.join(HERE, "test_staging_dir", "job-1", "helloworld-1.ipynb"),
                "html": os.path.join(HERE, "test_staging_dir", "job-1", "helloworld-1.html"),
                "input": os.path.join(HERE, "test_staging_dir", "job-1", "helloworld.ipynb"),
            },
            OUTPUTS_DIR,
            False,
        ),
        (
            ["ipynb", "html"],
            {
                "ipynb": "job-2/helloworld-1.ipynb",
                "html": "job-2/helloworld-1.html",
                "input": "job-2/helloworld.ipynb",
            },
            {
                "tar.gz": os.path.join(HERE, "test_staging_dir", "job-2", "helloworld.tar.gz"),
                "ipynb": "job-2/helloworld-1.ipynb",
                "html": "job-2/helloworld-1.html",
                "input": "job-2/helloworld.ipynb",
            },
            OUTPUTS_DIR,
            False,
        ),
    ],
)
def test_downloader_download(
    clear_outputs_dir, output_formats, output_filenames, staging_paths, output_dir, redownload
):
    downloader = Downloader(
        output_formats=output_formats,
        output_filenames=output_filenames,
        staging_paths=staging_paths,
        output_dir=output_dir,
        redownload=redownload,
    )
    downloader.download()

    assert os.path.exists(output_dir)
    for format in output_formats:
        # get path to output file corresponding to this format
        out_filepath = os.path.join(output_dir, output_filenames[format])

        # assert each output file exists
        assert os.path.exists(out_filepath)

        # assert integrity of each output file
        if "tar.gz" in staging_paths:
            with tarfile.open(staging_paths["tar.gz"]) as tar:
                input_file = tar.extractfile(member=staging_paths[format])
                input_filepath = os.path.join(output_dir, os.path.basename(staging_paths[format]))
                with open(input_filepath, "wb") as f:
                    f.write(input_file.read())
                assert filecmp.cmp(out_filepath, input_filepath)
        else:
            assert filecmp.cmp(out_filepath, staging_paths[format])
