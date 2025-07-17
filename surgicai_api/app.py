import os

from flask import Flask, g, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from surgicai_api import config
from surgicai_api.ssr.router import ssr_router

app = Flask(__name__, template_folder="ssr/templates")
app.config.from_object(config.Config)

# Register the SSR router
app.register_blueprint(ssr_router)

# Set up the database connection
engine = create_engine(app.config["DATABASE_URL"])
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
app.SessionLocal = SessionLocal


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
