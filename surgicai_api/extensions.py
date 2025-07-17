from flask_cors import CORS

from surgicai_api.boto import Boto
from surgicai_api.emails import Emails

CORS_ORIGINS = [
    "http://localhost:3001",
]

cors = CORS(supports_credentials=True, origins=CORS_ORIGINS)
emails = Emails()
boto = Boto()
