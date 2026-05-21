import subprocess
import json
import os
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

DOCKER_COMPOSE_PATH = os.getenv("DOCKER_COMPOSE_PATH", "docker-compose.yml")


def run_command(cmd: list) -> dict:
    """Execute shell command and return output."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Command timeout after 30 seconds",
            "returncode": -1
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }


@router.get("/docker/containers")
def get_containers():
    """List all docker containers with their status."""
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="Failed to list containers")

        containers = []
        for line in result.stdout.strip().split('\n'):
            if line:
                container = json.loads(line)
                containers.append({
                    "id": container.get("ID", ""),
                    "name": container.get("Names", ""),
                    "image": container.get("Image", ""),
                    "status": container.get("Status", ""),
                    "state": container.get("State", ""),
                    "ports": container.get("Ports", ""),
                })

        return {"containers": containers, "count": len(containers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/docker/compose/services")
def get_compose_services():
    """Get services from docker-compose.yml."""
    try:
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=os.path.dirname(DOCKER_COMPOSE_PATH) or "."
        )

        if result.returncode != 0:
            # Return empty if compose file not found
            return {"services": []}

        services = []
        for line in result.stdout.strip().split('\n'):
            if line:
                service = json.loads(line)
                services.append({
                    "name": service.get("Name", ""),
                    "service": service.get("Service", ""),
                    "status": service.get("Status", ""),
                    "ports": service.get("Ports", ""),
                })

        return {"services": services}
    except Exception as e:
        return {"services": [], "error": str(e)}


@router.post("/docker/compose/up")
def compose_up():
    """Start docker-compose services."""
    result = run_command([
        "docker", "compose", "up", "-d"
    ])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": "Services started", "output": result["stdout"]}


@router.post("/docker/compose/down")
def compose_down():
    """Stop docker-compose services."""
    result = run_command([
        "docker", "compose", "down"
    ])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": "Services stopped", "output": result["stdout"]}


@router.post("/docker/compose/restart")
def compose_restart(service: Optional[str] = None):
    """Restart docker-compose services or specific service."""
    cmd = ["docker", "compose", "restart"]
    if service:
        cmd.append(service)

    result = run_command(cmd)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": f"Services {'restarted' if not service else f'{service} restarted'}", "output": result["stdout"]}


@router.post("/docker/compose/rebuild")
def compose_rebuild(service: Optional[str] = None):
    """Rebuild docker-compose services or specific service."""
    cmd = ["docker", "compose", "build"]
    if service:
        cmd.append(service)

    result = run_command(cmd)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": f"Services {'rebuilt' if not service else f'{service} rebuilt'}", "output": result["stdout"]}


@router.get("/docker/container/{container_id}/logs")
def get_container_logs(container_id: str, tail: int = 50):
    """Get logs from a specific container."""
    result = run_command([
        "docker", "logs", "--tail", str(tail), container_id
    ])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"logs": result["stdout"], "container_id": container_id}


@router.post("/docker/container/{container_id}/start")
def start_container(container_id: str):
    """Start a specific container."""
    result = run_command(["docker", "start", container_id])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": f"Container {container_id} started"}


@router.post("/docker/container/{container_id}/stop")
def stop_container(container_id: str):
    """Stop a specific container."""
    result = run_command(["docker", "stop", container_id])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": f"Container {container_id} stopped"}


@router.post("/docker/container/{container_id}/restart")
def restart_container(container_id: str):
    """Restart a specific container."""
    result = run_command(["docker", "restart", container_id])

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["stderr"])

    return {"message": f"Container {container_id} restarted"}


@router.get("/docker/system/info")
def get_docker_info():
    """Get Docker system information."""
    try:
        result = subprocess.run(
            ["docker", "system", "df", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return {"error": "Failed to get Docker info"}

        data = json.loads(result.stdout)
        return {
            "images": data.get("Images", []),
            "containers": data.get("Containers", []),
            "volumes": data.get("Volumes", [])
        }
    except Exception as e:
        return {"error": str(e)}
