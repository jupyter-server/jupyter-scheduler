import os
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, root_validator

Tags = List[str]
EnvironmentParameterValues = Union[int, float, bool, str]

EMAIL_RE = ""
SCHEDULE_RE = ""


class RuntimeEnvironment(BaseModel):
    """Defines a runtime context where job
    execution will happen. For example, conda
    environment.
    """

    name: str
    label: str
    description: str
    file_extensions: List[str]  # Supported input file types
    output_formats: List[str]  # Supported output formats
    metadata: Optional[Dict[str, str]]  # Optional metadata
    compute_types: Optional[List[str]]
    default_compute_type: Optional[str]  # Should be a member of the compute_types list
    utc_only: Optional[bool]

    def __str__(self):
        return self.json()


class EmailNotifications(BaseModel):
    on_start: Optional[List[str]]
    on_success: Optional[List[str]]
    on_failure: Optional[List[str]]
    no_alert_for_skipped_runs: bool = True

    def __str__(self) -> str:
        return self.json()


class Status(str, Enum):
    CREATED = "CREATED"
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    STOPPING = "STOPPING"
    STOPPED = "STOPPED"

    def __str__(self):
        return self.value


"""
A string template to use for naming the output file,
this template will interpolate values from DescribeJob,
filename is a special variable, because there is no
matching attribute in DescribeJob, but probably the most
expected in the output filename. These templates are
expecting jinja2 format for attributes. Attributes that
don't follow valid filenames will be normalized.

Examples of other formats:
"{{name}}-{{timestamp}}"
"{{runtime_environment_name}}_{{filename}}_{{job_id}}"
"""
OUTPUT_FILENAME_TEMPLATE = "{{input_filename}}-{{create_time}}"


class CreateJob(BaseModel):
    """Defines the model for creating a new job"""

    input_uri: str
    input_filename: str = None
    runtime_environment_name: str
    runtime_environment_parameters: Optional[Dict[str, EnvironmentParameterValues]]
    output_formats: Optional[List[str]] = None
    idempotency_token: Optional[str] = None
    job_definition_id: Optional[str] = None
    parameters: Optional[Dict[str, str]] = None
    tags: Optional[Tags] = None
    name: str
    output_filename_template: Optional[str] = OUTPUT_FILENAME_TEMPLATE
    compute_type: Optional[str] = None

    @root_validator
    def compute_input_filename(cls, values) -> Dict:
        if not values["input_filename"] and values["input_uri"]:
            values["input_filename"] = os.path.basename(values["input_uri"])

        return values


class JobFile(BaseModel):
    """This model is used to describe the display value,
    output format, and the filepath for a single job file.
    This will include both input file used to execute the
    job and the outputs generated.

    Attributes
    ----------
    display_name : str
        Human readable display value for use in UI

    file_format : str
        System encoded value of output format, this value
        should match the output_format value passed into
        the `CreateJob` or `CreateJobDefinition`models by
        the `create_job` and `create_job_definition` APIs
        respectively

    file_path : str
        Output file path relative to the server root dir.
        This should always specify the local path within
        the JupyterLab workspace.
    """

    display_name: str
    file_format: str
    file_path: Optional[str] = None


class DescribeJob(BaseModel):
    input_filename: str = None
    runtime_environment_name: str
    runtime_environment_parameters: Optional[Dict[str, EnvironmentParameterValues]]
    output_formats: Optional[List[str]] = None
    idempotency_token: Optional[str] = None
    job_definition_id: Optional[str] = None
    parameters: Optional[Dict[str, str]] = None
    tags: Optional[Tags] = None
    name: str
    output_filename_template: Optional[str] = OUTPUT_FILENAME_TEMPLATE
    compute_type: Optional[str] = None
    job_id: str
    job_files: List[JobFile] = []
    url: str
    create_time: int
    update_time: int
    start_time: Optional[int] = None
    end_time: Optional[int] = None
    status: Status = Status.CREATED
    status_message: Optional[str] = None
    downloaded: bool = False

    class Config:
        orm_mode = True


class SortDirection(Enum):
    asc = "asc"
    desc = "desc"


class SortField(BaseModel):
    name: str
    direction: SortDirection


DEFAULT_SORT = SortField(name="create_time", direction=SortDirection.desc)

DEFAULT_MAX_ITEMS = 1000


class ListJobsQuery(BaseModel):
    job_definition_id: Optional[str] = None
    status: Optional[Status] = None
    name: Optional[str] = None
    start_time: Optional[int] = None
    tags: Optional[Tags] = None
    sort_by: List[SortField] = [DEFAULT_SORT]
    max_items: Optional[int] = DEFAULT_MAX_ITEMS
    next_token: Optional[str] = None


class ListJobsResponse(BaseModel):
    jobs: List[DescribeJob] = []
    total_count: int = 0
    next_token: Optional[str] = None


class CountJobsQuery(BaseModel):
    status: Status = Status.IN_PROGRESS


class UpdateJob(BaseModel):
    status: Optional[Status] = None
    name: Optional[str] = None
    compute_type: Optional[str] = None


class DeleteJob(BaseModel):
    job_id: str


class CreateJobDefinition(BaseModel):
    input_uri: str
    input_filename: str = None
    runtime_environment_name: str
    runtime_environment_parameters: Optional[Dict[str, EnvironmentParameterValues]]
    output_formats: Optional[List[str]] = None
    parameters: Optional[Dict[str, str]] = None
    tags: Optional[Tags] = None
    name: str
    output_filename_template: Optional[str] = OUTPUT_FILENAME_TEMPLATE
    compute_type: Optional[str] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None

    @root_validator
    def compute_input_filename(cls, values) -> Dict:
        if not values["input_filename"] and values["input_uri"]:
            values["input_filename"] = os.path.basename(values["input_uri"])

        return values


class DescribeJobDefinition(BaseModel):
    input_filename: str = None
    runtime_environment_name: str
    runtime_environment_parameters: Optional[Dict[str, EnvironmentParameterValues]]
    output_formats: Optional[List[str]] = None
    parameters: Optional[Dict[str, str]] = None
    tags: Optional[Tags] = None
    name: str
    output_filename_template: Optional[str] = OUTPUT_FILENAME_TEMPLATE
    compute_type: Optional[str] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    job_definition_id: str
    create_time: int
    update_time: int
    active: bool

    class Config:
        orm_mode = True


class UpdateJobDefinition(BaseModel):
    runtime_environment_name: Optional[str]
    runtime_environment_parameters: Optional[Dict[str, EnvironmentParameterValues]]
    output_formats: Optional[List[str]] = None
    parameters: Optional[Dict[str, str]] = None
    tags: Optional[Tags] = None
    name: Optional[str] = None
    url: Optional[str] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    output_filename_template: Optional[str] = OUTPUT_FILENAME_TEMPLATE
    active: Optional[bool] = None
    compute_type: Optional[str] = None


class ListJobDefinitionsQuery(BaseModel):
    name: Optional[str] = None
    create_time: Optional[int] = None
    tags: Optional[Tags] = None
    sort_by: List[SortField] = [DEFAULT_SORT]
    max_items: Optional[int] = DEFAULT_MAX_ITEMS
    next_token: Optional[str] = None


class ListJobDefinitionsResponse(BaseModel):
    job_definitions: List[DescribeJobDefinition] = []
    total_count: int = 0
    next_token: Optional[str] = None


class CreateJobFromDefinition(BaseModel):
    parameters: Optional[Dict[str, str]] = None


class JobFeature(str, Enum):
    job_name = "job_name"
    parameters = "parameters"
    output_formats = "output_formats"
    job_definition = "job_definition"
    idempotency_token = "idempotency_token"
    tags = "tags"
    email_notifications = "email_notifications"
    timeout_seconds = "timeout_seconds"
    retry_on_timeout = "retry_on_timeout"
    max_retries = "max_retries"
    min_retry_interval_millis = "min_retry_interval_millis"
    output_filename_template = "output_filename_template"
    stop_job = "stop_job"
    delete_job = "delete_job"
