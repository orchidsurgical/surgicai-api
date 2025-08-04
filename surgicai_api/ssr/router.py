from flask import Blueprint

from surgicai_api.ssr.views.admin import admin_bp
from surgicai_api.ssr.views.home import home_bp
from surgicai_api.ssr.views.index import index_bp
from surgicai_api.ssr.views.login import login_bp
from surgicai_api.ssr.views.management import management_bp

ssr_router = Blueprint("ssr", __name__)
ssr_router.register_blueprint(login_bp)
ssr_router.register_blueprint(home_bp)
ssr_router.register_blueprint(admin_bp)
ssr_router.register_blueprint(management_bp)
ssr_router.register_blueprint(index_bp)
