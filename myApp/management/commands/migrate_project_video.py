from pathlib import Path

import cloudinary.uploader

from django.core.management.base import BaseCommand
from myApp.models import Project


class Command(BaseCommand):
    help = "Migrate the existing project video to Cloudinary"

    def handle(self, *args, **options):
        project = Project.objects.get(id=5)

        local_path = (
            Path("media")
            / "project_media"
            / "4a08440eb2d5400ca8a1723c0ad93cd2.mp4"
        )

        if not local_path.is_file():
            self.stdout.write(
                self.style.ERROR(
                    f"File not found: {local_path}"
                )
            )
            return

        self.stdout.write(
            f"Uploading: {local_path}"
        )

        try:
            result = cloudinary.uploader.upload(
                str(local_path),
                resource_type="video",
                folder="project_media",
            )

            secure_url = result.get("secure_url")
            public_id = result.get("public_id")

            self.stdout.write(
                self.style.SUCCESS(
                    f"Upload successful.\n"
                    f"Public ID: {public_id}\n"
                    f"URL: {secure_url}"
                )
            )

            project.file = public_id
            project.save(update_fields=["file"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Project '{project.title}' updated successfully."
                )
            )

            self.stdout.write(
                "\nLocal video was NOT deleted."
            )

        except Exception as exc:
            self.stdout.write(
                self.style.ERROR(
                    f"Upload failed: {exc}"
                )
            )