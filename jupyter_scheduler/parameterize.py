from typing import Dict

from nbformat import NotebookNode, v4

from jupyter_scheduler.utils import find_cell_index_with_tag


def add_parameters(nb: NotebookNode, parameters: Dict[str, str]) -> NotebookNode:
    content = []

    for key, value in parameters.items():
        content.append(f"{key} = {value}")

    new_cell = v4.new_code_cell(source="\n".join(content))
    new_cell.metadata["tags"] = ["injected-parameters"]

    parameters_cell_index = find_cell_index_with_tag(nb, "parameters")
    injected_cell_index = find_cell_index_with_tag(nb, "injected-parameters")

    if injected_cell_index >= 0:
        before = nb.cells[:injected_cell_index]
        after = nb.cells[injected_cell_index + 1 :]
    elif parameters_cell_index >= 0:
        before = nb.cells[: parameters_cell_index + 1]
        after = nb.cells[parameters_cell_index + 1 :]
    else:
        before = []
        after = nb.cells

    nb.cells = before + [new_cell] + after

    return nb
