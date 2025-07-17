import email
import json
import os
import smtplib
from abc import ABC, abstractmethod
from datetime import datetime

from surgicai_api.emails.template_registrar import render_subject, render_template


class EmailHandler(ABC):
    """
    A base meta EmailHandler class.

    :param config:
        A dictionary of configuration options. Usually, this is the Flask
        application configuration dictionary. The `setup_config` method
        should get the needed config vars and save them to the instance.
    :type config: dict
    """

    def __init__(self, config):
        try:
            self.setup_config(config)
        except Exception as e:
            raise RuntimeError(f"Unable to configure email handler: {str(e)}")

    @abstractmethod
    def setup_config(self, config):
        pass

    @abstractmethod
    def send_raw_email(self, address, message, subject=None, source=None):
        pass

    @abstractmethod
    def send_email(self, address, email_key, **options):
        pass

    def get_content(self, email_key, **options):
        """
        Gets and renders out the template for the email type.
        Note: `email_key` must be registered in the `template_registrar`
        module.
        """
        return render_template(email_key, **options)

    def get_subject(self, email_key, **options):
        """
        Gets the subject for the email type.
        Note: `email_key` must be registered in the `template_registrar`
        module.
        """
        return render_subject(email_key, **options)


class NoopEmailHandler(EmailHandler):
    def setup_config(self, config):
        pass

    def send_raw_email(self, address, message, subject=None, source=None):
        print(f"Email silenced:\n\t{address}\n\t{subject}\n\t{message}")

    def send_email(self, address, email_key, **options):
        print(f"Email silenced:\n\t{address}\n\t{email_key} (type)")


class LocalEmailHandler(EmailHandler):
    """
    Handles emails by writing them to a folder on the local machine.

    Config params:
    * "EMAIL_DIR_PATH" (str) - A directory path where local emails
        should be written on the local machine.
    """

    def setup_config(self, config):
        self.dir_path = config.get("EMAIL_DIR_PATH")
        if not os.path.exists(self.dir_path):
            os.makedirs(self.dir_path)

    def send_raw_email(self, address, message, subject=None, source=None):
        email_file_name = f"{address}:{subject}:{datetime.now().isoformat()}"
        email_file = os.path.join(self.dir_path, email_file_name)
        with open(email_file, "w") as f:
            f.write(f"Subject: {subject}\n\n")
            f.write(message)

    def send_email(self, address, email_key, **options):
        content = self.get_content(email_key, **options)
        subject = self.get_subject(email_key, **options)
        email_file_name = f"{address}:{email_key}:{datetime.now().isoformat()}"
        email_file = os.path.join(self.dir_path, email_file_name)
        with open(email_file, "w") as f:
            f.write(f"Subject: {subject}\n\n")
            f.write(content)


class SQSEmailHandler(EmailHandler):
    """
    Handles emails by sending them to an SQS queue.

    Config params:
    * "EMAIL_QUEUE_URL" (str) - The URL of the SQS queue to send emails to.
    """

    def setup_config(self, config):
        self.queue_url = config.get("EMAIL_QUEUE_URL")

    def send_raw_email(self, address, message, subject=None, source=None):
        from surgicai_api.extensions import boto

        subject = subject or "Surgicai Cloud Notification"
        source = source or "Surgicai Surgical <contact@surgicai.com>"

        boto.client.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(
                {
                    "destination": address,
                    "subject": subject,
                    "body": message,
                    "source": source,
                }
            ),
            MessageAttributes={
                "Subject": {"DataType": "String", "StringValue": subject},
                "Source": {"DataType": "String", "StringValue": source},
                "Address": {"DataType": "String", "StringValue": address},
            },
        )

    def send_email(self, address, email_key, **options):
        content = self.get_content(email_key, **options)
        subject = self.get_subject(email_key, **options)
        self.send_raw_email(address, content, subject=subject)
