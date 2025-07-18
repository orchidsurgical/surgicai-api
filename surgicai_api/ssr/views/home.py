from flask import Blueprint, g, render_template, request

from surgicai_api.ssr.views import check_jwt

home_bp = Blueprint("home", __name__)


@home_bp.route("/dashboard", methods=["GET"])
@check_jwt
def home():
    return render_template("dashboard.html", user=g.user)


@home_bp.route("/editor/<string:note_id>/", methods=["GET"])
@check_jwt
def editor(note_id):
    return render_template("editor.html", user=g.user, note_id=note_id)


@home_bp.route("/preferences", methods=["GET"])
@check_jwt
def preferences():
    return render_template("preferences.html", user=g.user)
