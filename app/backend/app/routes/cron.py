"""Gerencia jobs de cron do host via arquivo em /etc/cron.d (bind-mount)."""
import os
import re
import uuid
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/cron", tags=["cron"])

HEADER = (
    "# Gerenciado pela aplicacao Observabilidade - nao edite manualmente\n"
    "SHELL=/bin/bash\n"
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n"
)

MACROS = {
    "@reboot",
    "@yearly",
    "@annually",
    "@monthly",
    "@weekly",
    "@daily",
    "@midnight",
    "@hourly",
}

JOB_META_RE = re.compile(r"^# job:(\S+) name:(.*)$")
USER_RE = re.compile(r"^[a-z_][a-z0-9_-]*$")
DISABLED_PREFIX = "#DISABLED "


class CronJobIn(BaseModel):
    name: str
    schedule: str
    user: str = "root"
    command: str
    enabled: bool = True


class CronJob(CronJobIn):
    id: str


def _validate(job: CronJobIn) -> None:
    for field, val in [
        ("nome", job.name),
        ("agendamento", job.schedule),
        ("usuário", job.user),
        ("comando", job.command),
    ]:
        if "\n" in val or "\r" in val:
            raise HTTPException(400, f"O campo '{field}' não pode conter quebras de linha")

    if not job.name.strip():
        raise HTTPException(400, "O nome não pode ser vazio")
    if not job.command.strip():
        raise HTTPException(400, "O comando não pode ser vazio")

    schedule = job.schedule.strip()
    if schedule.startswith("@"):
        if schedule not in MACROS:
            raise HTTPException(400, f"Macro de agendamento inválida: {schedule}")
    elif len(schedule.split()) != 5:
        raise HTTPException(
            400,
            "A expressão cron deve ter 5 campos (min hora dia mês dia-semana) ou uma macro (@daily, @hourly, ...)",
        )

    if not USER_RE.match(job.user):
        raise HTTPException(400, "Usuário inválido")


def _parse_content_line(content: str):
    """Divide a linha em (schedule, user, command)."""
    if content.startswith("@"):
        parts = content.split(None, 2)
        schedule = parts[0]
        user = parts[1] if len(parts) > 1 else "root"
        command = parts[2] if len(parts) > 2 else ""
        return schedule, user, command
    parts = content.split(None, 6)
    if len(parts) < 7:
        return None
    return " ".join(parts[:5]), parts[5], parts[6]


def _read_jobs() -> List[CronJob]:
    path = settings.cron_file
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    jobs: List[CronJob] = []
    pending = None  # (id, name)
    for line in lines:
        meta = JOB_META_RE.match(line)
        if meta:
            pending = (meta.group(1), meta.group(2))
            continue
        if pending is None:
            continue
        enabled = True
        content = line
        if content.startswith(DISABLED_PREFIX):
            enabled = False
            content = content[len(DISABLED_PREFIX):]
        parsed = _parse_content_line(content.strip())
        if parsed:
            schedule, user, command = parsed
            jobs.append(
                CronJob(
                    id=pending[0],
                    name=pending[1],
                    schedule=schedule,
                    user=user,
                    command=command,
                    enabled=enabled,
                )
            )
        pending = None
    return jobs


def _write_jobs(jobs: List[CronJob]) -> None:
    path = settings.cron_file
    parent = os.path.dirname(path)
    if parent and not os.path.isdir(parent):
        raise HTTPException(
            500,
            f"Diretório de cron não encontrado: {parent}. Verifique o bind-mount de /etc/cron.d no docker-compose.",
        )

    content = HEADER + "\n"
    for job in jobs:
        content += f"# job:{job.id} name:{job.name}\n"
        line = f"{job.schedule} {job.user} {job.command}"
        if not job.enabled:
            line = DISABLED_PREFIX + line
        content += line + "\n"

    tmp = path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp, path)
        os.chmod(path, 0o644)
    except PermissionError:
        raise HTTPException(
            500,
            "Sem permissão para escrever o arquivo de cron. O backend precisa rodar como root com /etc/cron.d montado.",
        )
    except OSError as e:
        raise HTTPException(500, f"Erro ao escrever o arquivo de cron: {e}")


@router.get("", response_model=List[CronJob])
def list_jobs():
    return _read_jobs()


@router.post("", response_model=CronJob)
def create_job(job: CronJobIn):
    _validate(job)
    jobs = _read_jobs()
    new_job = CronJob(id=uuid.uuid4().hex[:8], **job.model_dump())
    jobs.append(new_job)
    _write_jobs(jobs)
    return new_job


@router.put("/{job_id}", response_model=CronJob)
def update_job(job_id: str, job: CronJobIn):
    _validate(job)
    jobs = _read_jobs()
    updated = None
    for idx, existing in enumerate(jobs):
        if existing.id == job_id:
            updated = CronJob(id=job_id, **job.model_dump())
            jobs[idx] = updated
            break
    if updated is None:
        raise HTTPException(404, "Job não encontrado")
    _write_jobs(jobs)
    return updated


@router.post("/{job_id}/toggle", response_model=CronJob)
def toggle_job(job_id: str):
    jobs = _read_jobs()
    toggled = None
    for existing in jobs:
        if existing.id == job_id:
            existing.enabled = not existing.enabled
            toggled = existing
            break
    if toggled is None:
        raise HTTPException(404, "Job não encontrado")
    _write_jobs(jobs)
    return toggled


@router.delete("/{job_id}")
def delete_job(job_id: str):
    jobs = _read_jobs()
    remaining = [j for j in jobs if j.id != job_id]
    if len(remaining) == len(jobs):
        raise HTTPException(404, "Job não encontrado")
    _write_jobs(remaining)
    return {"message": "Job removido"}
