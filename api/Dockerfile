FROM python:3.11-slim

WORKDIR /app

# install tradingagents dependencies
COPY tradingagents-core/pyproject.toml tradingagents-core/pyproject.toml
COPY tradingagents-core/requirements.txt tradingagents-core/requirements.txt
RUN pip install --no-cache-dir -r tradingagents-core/requirements.txt

# install API dependencies
COPY api/requirements.txt api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# copy source
COPY tradingagents-core/ tradingagents-core/
COPY api/ api/

EXPOSE 8000
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
