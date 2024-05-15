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
                    include_staging_files=None,
                )


@pytest.fixture
def staging_dir_with_notebook_job(static_test_files_dir, jp_scheduler_staging_dir):
    staging_dir = jp_scheduler_staging_dir / "job-1"
    job_filenames = ["helloworld-1.ipynb", "helloworld-1.html", "helloworld.ipynb"]

    staged_job_files = []
    staging_dir.mkdir()
    for job_filename in job_filenames:
        staged_job_file = shutil.copy2(static_test_files_dir / job_filename, staging_dir)
        staged_job_files.append(staged_job_file)

    return staged_job_files


@pytest.fixture
def staging_dir_with_tar_job(static_test_files_dir, jp_scheduler_staging_dir):
    staging_dir = jp_scheduler_staging_dir / "job-2"
    job_tar_file = static_test_files_dir / "helloworld.tar.gz"

    staging_dir.mkdir()
    staged_tar_file = shutil.copy2(job_tar_file, staging_dir)

    return staged_tar_file


@pytest.fixture
def downloader_parameters(
    staging_dir_with_notebook_job,
    staging_dir_with_tar_job,
    request,
    jp_scheduler_output_dir,
):
    job_1_ipynb_file_path, job_1_html_file_path, job_1_input_file_path = (
        staging_dir_with_notebook_job
    )
    job_2_tar_file_path = staging_dir_with_tar_job
    index = request.param
    parameters = [
        {
            "output_formats": ["ipynb", "html"],
            "output_filenames": {
                "ipynb": "job-1/helloworld-out.ipynb",
                "html": "job-1/helloworld-out.html",
                "input": "job-1/helloworld-input.ipynb",
            },
            "staging_paths": {
                "ipynb": job_1_ipynb_file_path,
                "html": job_1_html_file_path,
                "input": job_1_input_file_path,
            },
            "output_dir": jp_scheduler_output_dir,
            "redownload": False,
        },
        {
            "output_formats": ["ipynb", "html"],
            "output_filenames": {
                "ipynb": "job-2/helloworld-1.ipynb",
                "html": "job-2/helloworld-1.html",
                "input": "job-2/helloworld.ipynb",
            },
            "staging_paths": {
                "tar.gz": job_2_tar_file_path,
                "ipynb": "job-2/helloworld-1.ipynb",
                "html": "job-2/helloworld-1.html",
                "input": "job-2/helloworld.ipynb",
            },
            "output_dir": jp_scheduler_output_dir,
            "redownload": False,
        },
    ]
    return parameters[index]


@pytest.mark.parametrize("downloader_parameters", [0, 1], indirect=True)
def test_downloader_download(downloader_parameters):
    output_formats, output_filenames, staging_paths, output_dir = (
        downloader_parameters["output_formats"],
        downloader_parameters["output_filenames"],
        downloader_parameters["staging_paths"],
        downloader_parameters["output_dir"],
    )
    downloader = Downloader(**downloader_parameters)
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
