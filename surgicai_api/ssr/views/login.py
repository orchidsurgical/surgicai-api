from flask import Blueprint
from flask import current_app as app
from flask import flash, redirect, render_template, request, url_for

from surgicai_api.models import User, UserType
from surgicai_api.services.authentication import (
    authenticate_user_password,
    generate_jwt_token,
)

login_bp = Blueprint("login", __name__)

REDIRECT_USER_TYPE = {
    UserType.ADMIN: "ssr.admin.admin",
    UserType.SURGEON: "ssr.home.home",
    UserType.ORG_ADMIN: "ssr.home.home",  # TODO: eventually
    UserType.BILLER: "ssr.home.home",  # TODO: eventually
}


@login_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.cookies.get("jwt"):
        return redirect(url_for("ssr.home.home"))

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = authenticate_user_password(app.SessionLocal(), email, password)
        if user:
            token = generate_jwt_token(user)
            if request.args.get("next"):
                resp = redirect(request.args.get("next"))
            else:
                resp = redirect(
                    url_for(REDIRECT_USER_TYPE.get(user.user_type, "ssr.home.home"))
                )
            resp.set_cookie("jwt", token, httponly=True, secure=True, samesite="Lax")
            return resp
        else:
            flash("Invalid email or password", "danger")
    # Handle GET request
    return render_template("login.html")


@login_bp.route("/logout")
def logout():
    flash("You have been logged out.", "info")
    resp = redirect(url_for("ssr.login.login"))
    resp.set_cookie("jwt", "", expires=0)
    return resp
