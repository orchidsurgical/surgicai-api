from flask import Blueprint, g, render_template, request

from surgicai_api.ssr.views import check_jwt

home_bp = Blueprint("home", __name__)


@home_bp.route("/dashboard", methods=["GET"])
@check_jwt
def home():
    return render_template("dashboard.html")


@home_bp.route("/editor/<string:note_id>/", methods=["GET"])
@check_jwt
def editor(note_id):
    return render_template("editor.html", note_id=note_id)


@home_bp.route("/preferences", methods=["GET"])
@check_jwt
def preferences():
    return render_template("preferences.html")


@home_bp.route("/templates", methods=["GET"])
@check_jwt
def templates():
    return render_template("templates.html")


@home_bp.route("/template_editor/<string:template_id>/", methods=["GET"])
@check_jwt
def template_editor(template_id):
    return render_template("template_editor.html", template_id=template_id)
