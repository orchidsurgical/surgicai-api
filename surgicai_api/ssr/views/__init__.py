from functools import wraps

from flask import current_app as app
from flask import flash, g, redirect, request, url_for

from surgicai_api.models import User, UserType
from surgicai_api.services.authentication import decode_jwt_token


def check_jwt(view_method=None, require_admin=False):
    """
    Decorator to check if the user is authenticated via JWT.
    If the user is not authenticated, redirect to the login page.
    If require_admin is True, also check if the user is an admin.
    """
    assert view_method is None or callable(view_method)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            jwttoken = request.cookies.get("jwt")
            if not jwttoken or not (payload := decode_jwt_token(jwttoken)):
                return redirect(url_for("ssr.login.login", next=request.path))
            user_id = payload.get("user_id")
            session = g.db
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                flash("User not found", "danger")
                return redirect(url_for("ssr.login.logout"))

            g.user = user
            g.hijacker_id = payload.get("hijacker_id")

            if require_admin and user.user_type != UserType.ADMIN:
                flash("Access denied.", "danger")
                return redirect(url_for("ssr.home.home"))

            return func(*args, **kwargs)

        return wrapper

    return decorator(view_method) if view_method else decorator
