"""Gerencia containers Docker via socket (/var/run/docker.sock), como o Portainer.

Usa a biblioteca docker-py em vez do CLI, então não exige o binário `docker`
instalado no container — apenas o socket montado e a lib Python.

O import é resiliente: se a lib `docker` não estiver instalada, o backend
continua subindo (dashboards/cron seguem funcionando) e apenas as rotas
/docker retornam 503.
"""
import socket

from fastapi import APIRouter, HTTPException

try:
    import docker

    _DOCKER_AVAILABLE = True
    _NotFound = docker.errors.NotFound
except Exception:  # pragma: no cover
    docker = None
    _DOCKER_AVAILABLE = False

    class _NotFound(Exception):
        pass


router = APIRouter(prefix="/api/docker", tags=["docker"])

COMPOSE_LABEL = "com.docker.compose.project"

# O hostname do container == seu ID no Docker. Usado para identificar o próprio
# backend e nunca pará-lo/reiniciá-lo em ações em massa (evita auto-derrubada).
_OWN_ID = socket.gethostname()


def _is_self(container) -> bool:
    return container.id.startswith(_OWN_ID) or container.short_id == _OWN_ID


def _own_project(client) -> str:
    """Nome do projeto compose do próprio backend (ex.: 'observabilidade')."""
    try:
        c = client.containers.get(_OWN_ID)
        return (c.labels or {}).get(COMPOSE_LABEL, "")
    except Exception:
        return ""


def get_client():
    """Conecta ao Docker daemon via socket montado no container."""
    if not _DOCKER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Biblioteca 'docker' não instalada no servidor. "
            "Rode o build do backend novamente.",
        )
    try:
        client = docker.from_env()
        client.ping()
        return client
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Não foi possível conectar ao Docker daemon. "
            f"Confirme que /var/run/docker.sock está montado. Detalhe: {e}",
        )


def _format_ports(container) -> str:
    ports = (container.attrs.get("NetworkSettings", {}) or {}).get("Ports") or {}
    parts = []
    for internal, mappings in ports.items():
        if mappings:
            for m in mappings:
                parts.append(f"{m.get('HostPort')}->{internal}")
        else:
            parts.append(internal)
    return ", ".join(sorted(set(parts)))


def _serialize(container) -> dict:
    state = container.status  # running, exited, paused, created...
    if state == "running":
        status = "Up"
    elif state == "exited":
        exit_code = (container.attrs.get("State", {}) or {}).get("ExitCode", 0)
        status = f"Exited ({exit_code})"
    else:
        status = state.capitalize()

    image = (
        container.image.tags[0]
        if container.image and container.image.tags
        else (container.image.short_id if container.image else "")
    )
    labels = container.labels or {}
    return {
        "id": container.short_id,
        "name": container.name,
        "image": image,
        "status": status,
        "state": state,
        "ports": _format_ports(container),
        "project": labels.get(COMPOSE_LABEL, ""),
        "service": labels.get("com.docker.compose.service", ""),
        "self": _is_self(container),
    }


@router.get("/containers")
def get_containers():
    """Lista todos os containers."""
    client = get_client()
    try:
        containers = client.containers.list(all=True)
        data = [_serialize(c) for c in containers]
        data.sort(key=lambda c: (c["state"] != "running", c["name"]))
        return {"containers": data, "count": len(data)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compose/services")
def get_compose_services():
    """Lista apenas containers gerenciados pelo docker compose (via labels)."""
    client = get_client()
    try:
        containers = client.containers.list(
            all=True, filters={"label": COMPOSE_LABEL}
        )
        return {"services": [_serialize(c) for c in containers]}
    except HTTPException:
        raise
    except Exception as e:
        return {"services": [], "error": str(e)}


def _project_containers(client, exclude_self: bool = False):
    """Containers do projeto compose do próprio backend.

    Escopado ao projeto do backend (ex.: 'observabilidade') para que as ações
    em massa NUNCA afetem outros stacks do host (robo-contratos, obras, etc.).
    """
    project = _own_project(client)
    if project:
        label = f"{COMPOSE_LABEL}={project}"
    else:
        label = COMPOSE_LABEL
    items = client.containers.list(all=True, filters={"label": label})
    if exclude_self:
        items = [c for c in items if not _is_self(c)]
    return items


@router.post("/compose/up")
def compose_up():
    """Inicia todos os containers parados do(s) projeto(s) compose."""
    client = get_client()
    try:
        started = []
        for c in _project_containers(client):
            if c.status != "running":
                c.start()
                started.append(c.name)
        return {"message": "Serviços iniciados", "started": started}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compose/down")
def compose_down():
    """Para todos os containers do(s) projeto(s) compose."""
    client = get_client()
    try:
        stopped = []
        for c in _project_containers(client, exclude_self=True):
            if c.status == "running":
                c.stop()
                stopped.append(c.name)
        return {"message": "Serviços parados", "stopped": stopped}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compose/restart")
def compose_restart():
    """Reinicia todos os containers do(s) projeto(s) compose."""
    client = get_client()
    try:
        restarted = []
        for c in _project_containers(client, exclude_self=True):
            c.restart()
            restarted.append(c.name)
        return {"message": "Serviços reiniciados", "restarted": restarted}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/container/{container_id}/logs")
def get_container_logs(container_id: str, tail: int = 200):
    """Retorna os logs de um container."""
    client = get_client()
    try:
        c = client.containers.get(container_id)
        logs = c.logs(tail=tail).decode("utf-8", errors="replace")
        return {"logs": logs, "container_id": container_id}
    except _NotFound:
        raise HTTPException(status_code=404, detail="Container não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/container/{container_id}/start")
def start_container(container_id: str):
    client = get_client()
    try:
        client.containers.get(container_id).start()
        return {"message": f"Container {container_id} iniciado"}
    except _NotFound:
        raise HTTPException(status_code=404, detail="Container não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/container/{container_id}/stop")
def stop_container(container_id: str):
    client = get_client()
    try:
        client.containers.get(container_id).stop()
        return {"message": f"Container {container_id} parado"}
    except _NotFound:
        raise HTTPException(status_code=404, detail="Container não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/container/{container_id}/restart")
def restart_container(container_id: str):
    client = get_client()
    try:
        client.containers.get(container_id).restart()
        return {"message": f"Container {container_id} reiniciado"}
    except _NotFound:
        raise HTTPException(status_code=404, detail="Container não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
