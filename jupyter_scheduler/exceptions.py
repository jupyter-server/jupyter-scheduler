class SchedulerError(Exception):
    """Generic class for catching all exceptions
    that are not defined here
    """

    pass


class InputUriError(Exception):
    def __init__(self, input_uri: str):
        self.input_uri = input_uri

    def __str__(self):
        return f"Input path '{self.input_uri}' does not exist."


class IdempotencyTokenError(Exception):
    def __init__(self, idempotency_token: str):
        self.idempotency_token = idempotency_token

    def __str__(self):
        return f"Job with Idempotency Token '{self.idempotency_token}' already exists."
