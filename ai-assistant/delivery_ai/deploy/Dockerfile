# Dockerfile para IA Liza Delivery
FROM python:3.11-slim

# Metadados
LABEL maintainer="Liza Delivery AI Team"
LABEL description="Container para IA de atendimento de delivery"
LABEL version="1.0.0"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cria usuário não-root
RUN useradd --create-home --shell /bin/bash liza

# Define diretório de trabalho
WORKDIR /app

# Copia requirements primeiro (para cache do Docker)
COPY requirements.txt .

# Instala dependências Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia código da aplicação
COPY . .

# Cria diretórios necessários
RUN mkdir -p logs checkpoints temp data

# Define permissões
RUN chown -R liza:liza /app

# Muda para usuário não-root
USER liza

# Expõe portas
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando padrão
CMD ["python", "app.py"]