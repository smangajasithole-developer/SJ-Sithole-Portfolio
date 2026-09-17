from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from myApp.models import Profile, Project


class Command(BaseCommand):
    help = "Migrate current Portfolio media files to Cloudinary"

    def handle(self, *args, **options):
        media_root = Path("media")
        migrated = 0
        skipped = 0
        failed = 0

        def migrate_field(instance, field_name):
            nonlocal migrated, skipped, failed

            field = getattr(instance, field_name)

            if not field or not field.name:
                self.stdout.write(
                    self.style.WARNING(
                        f"SKIP: {instance.__class__.__name__} "
                        f"{field_name} has no file."
                    )
                )
                skipped += 1
                return

            name = field.name

            if name.startswith("media/"):
                local_name = name[6:]
            else:
                local_name = name

            local_path = media_root / local_name

            if not local_path.is_file():
                self.stdout.write(
                    self.style.WARNING(
                        f"SKIP: {name} does not exist locally."
                    )
                )
                skipped += 1
                return

            self.stdout.write(f"Uploading: {name}")

            try:
                with local_path.open("rb") as file_handle:
                    new_name = field.storage.save(
                        name,
                        File(file_handle)
                    )

                setattr(instance, field_name, new_name)

                instance.save(update_fields=[field_name])

                self.stdout.write(
                    self.style.SUCCESS(
                        f"SUCCESS: {name} -> {new_name}"
                    )
                )

                migrated += 1

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(
                        f"FAILED: {name}\n"
                        f"Reason: {exc}"
                    )
                )
                failed += 1

        self.stdout.write("\n=== PROFILE MEDIA ===")

        for profile in Profile.objects.all():
            migrate_field(profile, "resume")
            migrate_field(profile, "resume_preview")

        self.stdout.write("\n=== PROJECT MEDIA ===")

        for project in Project.objects.all():
            migrate_field(project, "thumbnail")
            migrate_field(project, "file")

        self.stdout.write("\n=== MIGRATION SUMMARY ===")
        self.stdout.write(f"Migrated: {migrated}")
        self.stdout.write(f"Skipped: {skipped}")
        self.stdout.write(f"Failed: {failed}")
        self.stdout.write("\nLocal files were NOT deleted.")