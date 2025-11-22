# python-service/actions/open_app.py
import logging
import subprocess
import platform
import os
import shutil
import tempfile
from typing import Dict, Any, List, Optional
from difflib import get_close_matches

logger = logging.getLogger(__name__)

# Platform-specific app mappings with aliases
APP_MAPPINGS = {
    "notepad": {
        "windows": ["notepad.exe"],
        "linux": ["gedit", "kate", "nano"],
        "darwin": ["TextEdit.app"],
        "aliases": ["notepad", "text editor", "notes"],
        "supports_content": True
    },
    "vscode": {
        "windows": ["code", "Code.exe"],
        "linux": ["code"],
        "darwin": ["Visual Studio Code.app", "code"],
        "aliases": ["vscode", "vs code", "visual studio code", "code editor", "coding"],
        "supports_content": True
    },
    "chrome": {
        "windows": ["chrome.exe", r"C:\Program Files\Google\Chrome\Application\chrome.exe"],
        "linux": ["google-chrome", "google-chrome-stable"],
        "darwin": ["Google Chrome.app"],
        "aliases": ["chrome", "google chrome", "browser"],
        "supports_content": False
    },
    "whatsapp": {
        "windows": ["WhatsApp.exe"],
        "linux": ["whatsapp"],
        "darwin": ["WhatsApp.app"],
        "aliases": ["whatsapp", "whats app", "wa"],
        "supports_content": False
    },
    "spotify": {
        "windows": ["Spotify.exe"],
        "linux": ["spotify"],
        "darwin": ["Spotify.app"],
        "aliases": ["spotify", "music", "music player"],
        "supports_content": False
    },
    "telegram": {
        "windows": ["Telegram.exe"],
        "linux": ["telegram-desktop", "telegram"],
        "darwin": ["Telegram.app"],
        "aliases": ["telegram", "tg"],
        "supports_content": False
    },
    "youtube": {
        "windows": ["chrome.exe https://youtube.com"],
        "linux": ["xdg-open https://youtube.com"],
        "darwin": ["open https://youtube.com"],
        "aliases": ["youtube", "yt"],
        "is_website": True,
        "supports_content": False
    },
    "calculator": {
        "windows": ["calc.exe"],
        "linux": ["gnome-calculator", "kcalc"],
        "darwin": ["Calculator.app"],
        "aliases": ["calculator", "calc"],
        "supports_content": False
    },
    "file_explorer": {
        "windows": ["explorer.exe"],
        "linux": ["nautilus", "dolphin", "thunar"],
        "darwin": ["Finder.app"],
        "aliases": ["file explorer", "explorer", "files", "folder"],
        "supports_content": False
    }
}

def find_app_match(app_name: str) -> Optional[str]:
    """
    Find the best matching app using fuzzy matching on aliases
    """
    app_name_lower = app_name.lower().strip()
    
    # Direct match
    if app_name_lower in APP_MAPPINGS:
        return app_name_lower
    
    # Check aliases
    for app_key, app_info in APP_MAPPINGS.items():
        if app_name_lower in [alias.lower() for alias in app_info.get("aliases", [])]:
            return app_key
    
    # Fuzzy matching on all aliases
    all_aliases = []
    alias_to_app = {}
    
    for app_key, app_info in APP_MAPPINGS.items():
        for alias in app_info.get("aliases", []):
            all_aliases.append(alias.lower())
            alias_to_app[alias.lower()] = app_key
    
    matches = get_close_matches(app_name_lower, all_aliases, n=1, cutoff=0.6)
    
    if matches:
        return alias_to_app[matches[0]]
    
    return None

def get_platform_key() -> str:
    """Get the platform key for app mappings"""
    system = platform.system().lower()
    if system == "windows":
        return "windows"
    elif system == "darwin":
        return "darwin"
    else:
        return "linux"

def find_executable(app_paths: List[str]) -> Optional[str]:
    """
    Find the first available executable from a list of possible paths
    """
    for app_path in app_paths:
        # Check if full path exists
        if os.path.isfile(app_path):
            return app_path
        
        # Check if it's in PATH
        if shutil.which(app_path):
            return app_path
        
        # For macOS .app bundles
        if app_path.endswith(".app"):
            return app_path
    
    return None

def create_temp_file_with_content(content: str, app_key: str) -> Optional[str]:
    """
    Create a temporary file with content from answerDetails
    """
    try:
        # Determine file extension based on app
        extensions = {
            "notepad": ".txt",
            "vscode": ".txt",
        }
        
        ext = extensions.get(app_key, ".txt")
        
        # Create temp file
        fd, temp_path = tempfile.mkstemp(suffix=ext, prefix=f"spark_ai_{app_key}_")
        
        # Write content
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Created temp file with content: {temp_path}")
        return temp_path
        
    except Exception as e:
        logger.error(f"Failed to create temp file: {e}")
        return None

def open_single_app(
    app_name: str, 
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Open a single application with fuzzy matching and platform detection
    Now receives the full payload to access answerDetails
    """
    logger.info(f"Attempting to open: {app_name}")
    
    # Extract data from payload
    action_details = payload.get("actionDetails", {})
    answer_details = payload.get("answerDetails", {})
    query = action_details.get("query", "")
    
    # Find matching app
    matched_app = find_app_match(app_name)
    
    if not matched_app:
        logger.warning(f"No match found for: {app_name}")
        return {
            "success": False,
            "app_name": app_name,
            "error": f"Could not find an app matching '{app_name}'",
            "suggestion": "Try: vscode, chrome, notepad, whatsapp, spotify"
        }
    
    app_info = APP_MAPPINGS[matched_app]
    platform_key = get_platform_key()
    
    # Get platform-specific executable paths
    app_paths = app_info.get(platform_key, [])
    
    if not app_paths:
        return {
            "success": False,
            "app_name": app_name,
            "error": f"'{matched_app}' is not available on {platform.system()}"
        }
    
    # Find available executable
    executable = find_executable(app_paths)
    
    if not executable:
        return {
            "success": False,
            "app_name": app_name,
            "matched_as": matched_app,
            "error": f"'{matched_app}' is not installed on your system",
            "tried_paths": app_paths
        }
    
    try:
        # Check if app supports content and if we have content to write
        temp_file = None
        supports_content = app_info.get("supports_content", False)
        content = answer_details.get("content", "").strip()
        
        if supports_content and content:
            logger.info(f"App {matched_app} supports content, creating temp file...")
            temp_file = create_temp_file_with_content(content, matched_app)
        
        # Build command
        cmd_args = []
        
        # Open the application
        if platform.system() == "Windows":
            if app_info.get("is_website"):
                os.system(f"start {executable}")
            else:
                if temp_file:
                    # Open app with file
                    subprocess.Popen([executable, temp_file], shell=True)
                else:
                    subprocess.Popen([executable], shell=True)
                    
        elif platform.system() == "Darwin":  # macOS
            if executable.endswith(".app"):
                if temp_file:
                    subprocess.Popen(["open", "-a", executable, temp_file])
                else:
                    subprocess.Popen(["open", "-a", executable])
            else:
                if temp_file:
                    subprocess.Popen([executable, temp_file])
                else:
                    subprocess.Popen([executable])
                    
        else:  # Linux
            if temp_file:
                subprocess.Popen([executable, temp_file])
            else:
                subprocess.Popen([executable])
        
        logger.info(f"Successfully opened: {matched_app}")
        
        response = {
            "success": True,
            "app_name": app_name,
            "matched_as": matched_app,
            "executable": executable,
            "message": f"Opened {matched_app}"
        }
        
        if temp_file:
            response["opened_with_content"] = True
            response["temp_file"] = temp_file
            response["content_length"] = len(content)
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to open {matched_app}: {e}")
        return {
            "success": False,
            "app_name": app_name,
            "matched_as": matched_app,
            "error": str(e)
        }

def open_app(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle opening applications with support for multiple platforms
    Receives the full IAiResponsePayload from main_service
    """
    try:
        # Extract actionDetails
        action_details = payload.get("actionDetails", {})
        answer_details = payload.get("answerDetails", {})
        
        app_name = action_details.get("app_name", "").strip()
        platforms = action_details.get("platforms", [])
        query = action_details.get("query", "")
        
        logger.info(f"open_app called with app_name: {app_name}, platforms: {platforms}")
        logger.info(f"Has answer content: {bool(answer_details.get('content'))}")
        
        if not app_name and not platforms:
            return {
                "action": "open_app",
                "success": False,
                "error": "No app_name or platforms provided"
            }
        
        results = []
        
        # If platforms specified, open multiple apps
        if platforms:
            logger.info(f"Opening multiple platforms: {platforms}")
            for platform_name in platforms:
                # Pass the full payload to each app
                result = open_single_app(platform_name, payload)
                results.append(result)
        else:
            # Open single app, pass the full payload
            result = open_single_app(app_name, payload)
            results.append(result)
        
        # Determine overall success
        successful_apps = [r for r in results if r.get("success")]
        failed_apps = [r for r in results if not r.get("success")]
        
        response = {
            "action": "open_app",
            "total_attempts": len(results),
            "successful": len(successful_apps),
            "failed": len(failed_apps),
            "results": results
        }
        
        # Add summary message
        if successful_apps and not failed_apps:
            app_names = [r["matched_as"] for r in successful_apps]
            response["message"] = f"Successfully opened: {', '.join(app_names)}"
            response["success"] = True
        elif successful_apps and failed_apps:
            response["message"] = f"Opened {len(successful_apps)} apps, {len(failed_apps)} failed"
            response["success"] = True
        else:
            response["message"] = "Failed to open any applications"
            response["success"] = False
            response["errors"] = [r.get("error") for r in failed_apps]
        
        return response
        
    except Exception as e:
        logger.error(f"Error in open_app: {e}", exc_info=True)
        return {
            "action": "open_app",
            "success": False,
            "error": str(e)
        }