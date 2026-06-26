FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

EXPOSE 7860

CMD ["uv", "run", "uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "7860"]