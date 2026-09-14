from myApp.models import Profile

for p in Profile.objects.all():
    if p.full_name and not p.first_name:
        parts = p.full_name.strip().split()

        if len(parts) == 1:
            p.first_name = parts[0]

        elif len(parts) == 2:
            p.first_name = parts[0]
            p.last_name = parts[1]

        else:
            p.first_name = parts[0]
            p.middle_name = " ".join(parts[1:-1])
            p.last_name = parts[-1]

        p.save()

print("Done")