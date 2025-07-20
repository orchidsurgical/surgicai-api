from datetime import datetime, timezone

from flask import Blueprint
from flask import current_app as app
from flask import flash, redirect, render_template, request, url_for

from surgicai_api.models import User, UserType
from surgicai_api.services.authentication import (
    authenticate_user_password,
    decode_jwt_token,
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
    if cookie := request.cookies.get("jwt"):
        if decode_jwt_token(cookie):
            # User is already logged in, redirect to home
            if request.args.get("next"):
                return redirect(request.args.get("next"))
            return redirect(url_for("ssr.home.home"))

    session = app.SessionLocal()

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = authenticate_user_password(session, email, password)
        if user:
            if request.args.get("next"):
                resp = redirect(request.args.get("next"))
            else:
                if not user.last_login:
                    # first login, redirect to preferences
                    resp = redirect(url_for("ssr.home.preferences"))
                else:
                    resp = redirect(
                        url_for(REDIRECT_USER_TYPE.get(user.user_type, "ssr.home.home"))
                    )

            # Update last_login to current UTC time
            user.last_login = datetime.now(timezone.utc)
            session.add(user)
            session.commit()

            # Generate JWT token
            token = generate_jwt_token(user)
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
