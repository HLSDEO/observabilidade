#!/usr/bin/env python3
"""Script para enviar logs de teste para validar o backend"""

import requests
import json
from datetime import datetime, timedelta
import time

API_URL = "http://localhost:8000/api"

def send_log(log_data):
    """Enviar um log para o backend"""
    response = requests.post(f"{API_URL}/logs", json=log_data)
    if response.status_code == 201:
        print(f"✓ Log enviado: {log_data['identifier']}")
        return response.json()
    else:
        print(f"✗ Erro ao enviar log: {response.status_code} - {response.text}")
        return None

def generate_test_logs():
    """Gerar logs de teste"""
    base_time = datetime.utcnow()
    logs = []

    # Simular 50 logs com diferentes tipos, sources e identificadores
    municipios = ["municipio-0", "municipio-1", "municipio-2", "municipio-3", "municipio-4"]
    unidades = ["unidade-0", "unidade-1", "unidade-2"]
    types = ["error", "success", "warning", "info"]
    environments = ["dev", "hom", "prod"]

    for i in range(50):
        log_type = types[i % len(types)]
        status_code = "500" if log_type == "error" else "200"

        log_data = {
            "start": (base_time - timedelta(hours=i // 10, minutes=i % 60)).isoformat() + "Z",
            "end": (base_time - timedelta(hours=i // 10, minutes=i % 60) + timedelta(seconds=5)).isoformat() + "Z",
            "source": "robo-contratos",
            "type": log_type,
            "identifier": f"contrato-{1000 + i}",
            "data": f"Log de teste número {i} - tipo {log_type}",
            "location": "ProcessadorContratos.processar()",
            "environment": environments[i % len(environments)],
            "status_code": status_code,
            "identifier_2": municipios[i % len(municipios)],
            "identifier_3": unidades[i % len(unidades)],
        }
        logs.append(log_data)

    return logs

def main():
    print("=" * 60)
    print("Script de Teste - Enviando Logs")
    print("=" * 60)

    try:
        # Gerar logs
        logs = generate_test_logs()
        print(f"\nGerando {len(logs)} logs de teste...")

        # Enviar logs
        print("\nEnviando logs para o backend...")
        for log in logs:
            send_log(log)
            time.sleep(0.1)  # Pequeno delay para não sobrecarregar

        print("\n" + "=" * 60)
        print("✓ Todos os logs foram enviados!")
        print("=" * 60)

        # Testar queries
        print("\nTestando agregação (count de erros por município)...")
        query_data = {
            "source": "robo-contratos",
            "aggregation": "count",
            "filters": {"type": "error"},
            "groupBy": ["identifier_2"],
            "from_": (datetime.utcnow() - timedelta(hours=24)).isoformat() + "Z",
            "to": datetime.utcnow().isoformat() + "Z",
        }

        # Nota: O FastAPI usa _fields_ como corpo, mas requests vai enviar como JSON
        # Vou usar a rota sem underscores
        response = requests.post(
            f"{API_URL}/queries/aggregate",
            json={
                "source": "robo-contratos",
                "aggregation": "count",
                "filters": {"type": "error"},
                "groupBy": ["identifier_2"],
            },
        )

        if response.status_code == 200:
            print(f"✓ Agregação: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"✗ Erro na agregação: {response.status_code} - {response.text}")

    except requests.exceptions.ConnectionError:
        print("✗ Erro: Não foi possível conectar ao backend em http://localhost:8000")
        print("  Certifique-se de que o backend está rodando!")
    except Exception as e:
        print(f"✗ Erro: {e}")

if __name__ == "__main__":
    main()
