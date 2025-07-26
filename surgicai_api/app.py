import os

import sentry_sdk
from flask import Flask, g, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from surgicai_api import config
from surgicai_api.api.router import api_bp
from surgicai_api.extensions import boto, cors, emails
from surgicai_api.ssr.router import ssr_router

sentry_sdk.init(
    dsn="https://0d6d4023f74f98baf21d844d7d22e3eb@o4506482510135296.ingest.us.sentry.io/4509735028391936",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Set the environment to differentiate between dev and prod
    environment=os.getenv("ENVIRONMENT", "dev"),
)

app = Flask(
    __name__,
    template_folder="ssr/templates",
    static_folder="ssr/static",
    static_url_path="/static",
)
app.config.from_object(config.Config)

# Register the routers
app.register_blueprint(ssr_router)
app.register_blueprint(api_bp, url_prefix="/api/v1")

# Set up the database connection
engine = create_engine(app.config["DATABASE_URL"])
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
app.SessionLocal = SessionLocal

# Register extensions
def register_extensions(app: Flask):
    """Register Flask extensions."""
    # Here you can register any Flask extensions you need
    cors.init_app(app)
    emails.init_app(app)


register_extensions(app)


@app.context_processor
def inject_user():
    """Make user and hijacker information available in templates."""
    return {
        "user": getattr(g, "user", None),
        "hijacker_id": getattr(g, "hijacker_id", None),
    }


@app.before_request
def create_session():
    g.db = SessionLocal()


@app.teardown_request
def remove_session(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@app.route("/healthcheck")
def healthcheck():
    return jsonify({"status": "ok"})
