FROM python:3.11-slim

ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Uvicorn with improved resilience settings:
# --workers: 2 workers for better concurrency handling
# --loop: uvloop for better performance (if available)
# --timeout-keep-alive: 30s to prevent connection leaks
# --access-log: enable access logs for monitoring
CMD ["uvicorn", \
     "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--timeout-keep-alive", "30", \
     "--access-log"]
