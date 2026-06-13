from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    jwt_secret: str  # same as NEXTAUTH_SECRET - for verifying JWTs from Next.js

    # LLM (Ollama by default - no API key needed)
    llm_provider: str = "ollama"  # "ollama" | "anthropic"
    ollama_base_url: str = "http://localhost:11434"
    default_model: str = "gemma3:27b"
    anthropic_api_key: str | None = None

    # Server
    port: int = 8000

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
