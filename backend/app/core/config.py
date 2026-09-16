from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "MyMonitorXX API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    ENVIRONMENT: str = "production"
    DEV_MODE: bool = False
    
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mymonitorxx"
    
    FIREBASE_CREDENTIALS_PATH: str = "firebase_credentials.json"
    FIREBASE_PROJECT_ID: str = "moniterxx"
    
    # Production CORS Lockdown: Strictly authorize the production deployment domain
    CORS_ORIGINS: str = "https://mypcdod-lgtm.github.io"
    
    CAMPUS_NAME: str = "Central Engineering Campus"
    DEFAULT_LATITUDE: float = 12.9716
    DEFAULT_LONGITUDE: float = 77.5946
    DEFAULT_CHECKIN_RADIUS_METERS: float = 60.0

    @property
    def cors_origins_list(self) -> List[str]:
        if self.ENVIRONMENT.lower() == "development" or self.DEV_MODE:
            # Allow localhost in local development environment
            dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"]
            configured = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
            return list(set(dev_origins + configured))
        # Strictly enforce production domain
        return ["https://mypcdod-lgtm.github.io"]

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env", "../backend/.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
