import os

learning_rate = os.environ.get("JUPYTER_PARAM_learning_rate", "not_set")
batch_size = os.environ.get("JUPYTER_PARAM_batch_size", "not_set")
print(f"lr={learning_rate}, batch={batch_size}")
