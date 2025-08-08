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

    AWS_ACCESS_KEY_ID = env.str("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = env.str("AWS_SECRET_ACCESS_KEY", default="")
    AWS_REGION = env.str("AWS_REGION", default="us-east-1")
    AWS_DEFAULT_REGION = env.str("AWS_DEFAULT_REGION", default="us-east-1")
    TRANSCRIBE_ROLE_ARN = env.str("TRANSCRIBE_ROLE_ARN", default="")

    EMAIL_HANDLER_CLASS = env.str("EMAIL_HANDLER_CLASS", default=None)
    EMAIL_QUEUE_URL = env.str("EMAIL_QUEUE_URL", default=None)

    OPENAI_API_KEY = env.str("OPENAI_API_KEY", default=None)


config = Config()
