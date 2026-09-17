from pathlib import Path

from django.core.management.base import BaseCommand
from myApp.models import Profile, Project, Document


class Command(BaseCommand):
    help = "Check database-referenced media files before Cloudinary migration"

    def handle(self, *args, **options):
        media_root = Path("media")

        self.stdout.write("\n--- PROFILE ---")

        for profile in Profile.objects.all():
            fields = {
                "profile_photo": profile.profile_photo.name,
                "resume": profile.resume.name,
                "resume_preview": profile.resume_preview.name,
            }

            for field_name, name in fields.items():
                if not name:
                    continue

                local_name = name
                if local_name.startswith("media/"):
                    local_name = local_name[6:]

                path = media_root / local_name

                status = "EXISTS" if path.is_file() else "MISSING"

                self.stdout.write(
                    f"{field_name}: {name} -> {status}"
                )

        self.stdout.write("\n--- PROJECTS ---")

        for project in Project.objects.all():
            fields = {
                "thumbnail": project.thumbnail.name,
                "file": project.file.name,
            }

            for field_name, name in fields.items():
                if not name:
                    continue

                local_name = name
                if local_name.startswith("media/"):
                    local_name = local_name[6:]

                path = media_root / local_name

                status = "EXISTS" if path.is_file() else "MISSING"

                self.stdout.write(
                    f"{field_name}: {name} -> {status}"
                )

        self.stdout.write("\n--- DOCUMENTS ---")

        for document in Document.objects.all():
            name = document.file.name

            if not name:
                continue

            local_name = name
            if local_name.startswith("media/"):
                local_name = local_name[6:]

            path = media_root / local_name

            status = "EXISTS" if path.is_file() else "MISSING"

            self.stdout.write(
                f"file: {name} -> {status}"
            )

        self.stdout.write("\n--- END CHECK ---\n")