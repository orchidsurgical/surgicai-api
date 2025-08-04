from flask import Blueprint, g, render_template, request

from surgicai_api.models import UserType
from surgicai_api.ssr.views import check_jwt

management_bp = Blueprint("management", __name__)


@management_bp.route("/management", methods=["GET"])
@check_jwt
def management():
    """
    Management page for the SSR.
    """
    if g.user.user_type not in [UserType.ADMIN, UserType.ORGANIZATION]:
        return render_template("403.html"), 403

    return render_template("management_dashboard.html", user=g.user)
