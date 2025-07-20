import pyotp


class MFAService(ModelService):

    model = MFA

    def verify_code(self, mfa, code, error_klass=AuthenticationError):
        if mfa.last_code == code:
            raise error_klass({"code": "The code has already been used."})

        if not pyotp.TOTP(mfa.secret).verify(code):
            raise error_klass({"code": "The code is invalid."})

        mfa.last_code = code
        self.session.flush()

    def generate_uri(self, mfa):
        return pyotp.totp.TOTP(mfa.secret).provisioning_uri(
            mfa.user.email, issuer_name="Orchid Surgical Cloud"
        )

    def create(self, user):
        return super().create(user_id=user.id)

    def delete(self, user):
        return super().delete(user.mfa)

    def setup_mfa(self, user):
        user.mfa.secret = pyotp.random_base32()
        self.session.flush()

    def enable_mfa(self, user):
        user.mfa.is_enabled = True
        self.session.flush()

    def disable_mfa(self, user):
        user.mfa.secret = None
        user.mfa.is_enabled = False
        self.session.flush()
