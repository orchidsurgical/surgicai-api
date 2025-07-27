from flask import Blueprint, g, redirect, render_template, request

from surgicai_api.ssr.views import check_jwt

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin", methods=["GET"])
@check_jwt(require_admin=True)
def admin():
    return render_template("admin.html")


@admin_bp.route("/admin/users", methods=["GET"])
@check_jwt(require_admin=True)
def admin_users():
    return render_template("admin_users.html")


@admin_bp.route("/admin/test_error", methods=["GET"])
@check_jwt
def admin_test_error():
    class TestErrorNotARealError(Exception):
        pass

    raise TestErrorNotARealError("This is a test error for admin.")
