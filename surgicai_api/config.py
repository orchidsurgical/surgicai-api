from environs import Env

env = Env()
env.read_env()


class Config:
    DEBUG = env.bool("DEBUG", default=False)
    SECRET_KEY = env.str("SECRET_KEY", default="your-secret-key")
    DATABASE_URL = env.str("DATABASE_URL", default="sqlite:///./test.db")
    ENVIRONMENT = env.str("ENVIRONMENT", default="dev")

    JWT_ALGORITHM = env.str("JWT_ALGORITHM", default="HS256")
    JWT_EXP_DELTA_SECONDS = env.int("JWT_EXP_DELTA_SECONDS", default=43200)


config = Config()
