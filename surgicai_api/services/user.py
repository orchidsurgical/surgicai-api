from werkzeug.security import generate_password_hash

from surgicai_api.models import Template, User, UserType


def create_user(
    session,
    email,
    password,
    user_type=UserType.SURGEON,
    prefix=None,
    first_name=None,
    last_name=None,
):
    """
    Create a new user with the given email, password, and user type.
    Returns the created User object.
    """
    password = generate_password_hash(password)
    user = User(
        email=email,
        password=password,
        user_type=user_type,
        prefix=prefix,
        first_name=first_name,
        last_name=last_name,
    )
    session.add(user)
    session.flush()

    # Create the default template for the user
    with open("surgicai_api/services/default_template.txt", "r") as f:
        template_text = f.read()
    template = Template(
        name="Default Template",
        title="Operative Note",
        text=template_text,
        owner_id=user.id,
    )
    session.add(template)
    session.flush()

    return user
