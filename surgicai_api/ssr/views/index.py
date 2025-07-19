from flask import Blueprint, g, render_template, request

from surgicai_api.ssr.views import check_jwt

index_bp = Blueprint("index", __name__)


@index_bp.route("/", methods=["GET"])
def index():
    # Render the index page
    return render_template("index.html")
