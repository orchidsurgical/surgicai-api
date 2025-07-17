from flask import Blueprint, g, render_template, request

from surgicai_api.ssr.views import check_jwt

home_bp = Blueprint("home", __name__)


@home_bp.route("/dashboard", methods=["GET"])
@check_jwt
def home():
    return render_template("home.html", user=g.user)
