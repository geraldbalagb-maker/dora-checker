from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    anthropic_api_key: str
    frontend_url: str = "http://localhost:3000"

    # Stripe — optional so the app boots even without billing configured
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
