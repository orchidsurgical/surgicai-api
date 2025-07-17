from surgicai_api.emails.handler import EmailHandler


def _import_handler_class(class_string):
    parts = class_string.split(".")
    source = ".".join(parts[0:-1])
    klass = parts[-1]
    handler_module = __import__(source, fromlist=[klass])
    handler_class = getattr(handler_module, klass)
    return handler_class


class Emails:
    """A Flask extension to provide email handling."""

    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        # Get and import the handler class from the settings string
        try:
            self._handler_class = _import_handler_class(
                app.config["EMAIL_HANDLER_CLASS"]
            )
        except KeyError as e:
            raise RuntimeError(
                "Failed to initialize Email extension. Try setting the "
                "`EMAIL_HANDLER_CLASS` var in Flask configuration."
            )
        except (ImportError, AttributeError) as e:
            raise RuntimeError(
                f"Failed to initialize Email extension. Could not "
                f"import {app.config['EMAIL_HANDLER_CLASS']}"
            )

        # Ensure the email handler class is of the correct type
        if not issubclass(self._handler_class, EmailHandler):
            raise TypeError(
                "EMAIL_HANDLER_CLASS must be a subclass of "
                "orchid.emails.handler.EmailHandler"
            )

        # Instantiate the handler with the options
        try:
            self.handler = self._handler_class(app.config)
        except Exception as e:
            raise RuntimeError(f"Failure to configure email handler: {str(e)}")

    def send_raw_email(self, address, message, subject=None, source=None):
        """Send a raw email via the initialized handler."""
        return self.handler.send_raw_email(
            address, message, subject=subject, source=source
        )

    def send_email(self, address, email_key, **template_options):
        """Send an email via the initialized handler."""
        return self.handler.send_email(address, email_key, **template_options)
