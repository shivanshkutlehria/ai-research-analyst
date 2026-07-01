FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.18 /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces runs containers as UID 1000, not root.
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR $HOME/app

COPY --chown=user pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY --chown=user . .
RUN uv sync --frozen --no-dev

EXPOSE 7860

CMD ["uv", "run", "--frozen", "uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "7860"]
