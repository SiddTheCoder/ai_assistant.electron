
# Every Electron request lands here → selects correct utility.

from utils.app_utils import open_app
from utils.file_utils import read_file, write_file, delete_file
from utils.keyboard_mouse_utils import mouse_click, type_text

def execute_action(payload):
    action = payload.get("action")

    if action == "OPEN_APP":
        return open_app(payload)

    if action == "READ_FILE":
        return read_file(payload["path"])

    if action == "WRITE_FILE":
        return write_file(payload["path"], payload["content"])

    if action == "DELETE_FILE":
        return delete_file(payload["path"])

    if action == "CLICK":
        return mouse_click(payload)

    if action == "TYPE":
        return type_text(payload)

    return {"error": "Unknown action"}
