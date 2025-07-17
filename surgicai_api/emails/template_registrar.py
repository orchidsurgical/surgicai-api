import os

from jinja2 import Environment, FileSystemLoader

EMAIL_TEMPLATE_REGISTRAR = {
    "confirm_email": {
        "subject": "Confirm your email address",
        "template": "confirm_email.html",
    },
}

dir_path = os.path.dirname(os.path.realpath(__file__))
template_dir = os.path.join(dir_path, "templates")

ENVIRONMENT = Environment(loader=FileSystemLoader(template_dir))


def get_template(key):
    try:
        file_path = EMAIL_TEMPLATE_REGISTRAR[key]["template"]
        return ENVIRONMENT.get_template(file_path)
    except KeyError:
        raise RuntimeError(f"Unable to find template corresponding to key {key}.")


def get_subject(key):
    try:
        return EMAIL_TEMPLATE_REGISTRAR[key]["subject"]
    except KeyError:
        raise RuntimeError(f"Unable to find subject corresponding to key {key}.")


def render_template(key, **kwargs):
    template = get_template(key)
    return template.render(**kwargs)


def render_subject(key, **kwargs):
    subject = get_subject(key)
    return subject.format(**kwargs)
