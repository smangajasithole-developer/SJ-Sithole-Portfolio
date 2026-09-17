from django.db import models
from django.contrib.auth.models import User

# ==============================
# MODELS.PY
# Replace ONLY the Profile model with this safe version
# ==============================

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        default='images/user icon.png'
    )

    first_name = models.CharField(max_length=50, blank=True)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)

    job_title = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    availability = models.BooleanField(default=True)

    resume = models.FileField(
        upload_to='resumes/',
        blank=True,
        null=True
    )

    resume_preview = models.ImageField(
        upload_to='resume_previews/',
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username


class About(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    heading = models.CharField(max_length=200, default="ABOUT ME")
    subheading = models.CharField(max_length=200, blank=True)

    paragraph1 = models.TextField(blank=True)
    paragraph2 = models.TextField(blank=True)

    years_experience = models.CharField(max_length=20, blank=True)
    projects_completed = models.CharField(max_length=20, blank=True)
    certifications = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username

class Skill(models.Model):
    CATEGORY_CHOICES = [
        ('technical', 'Technical Skills'),
        ('other', 'Other Skills'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    name = models.CharField(
        max_length=100
    )

    icon = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    show_icon = models.BooleanField(
        default=True
    )

    show = models.BooleanField(
        default=True
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='technical'
    )

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children'
    )

    heading = models.CharField(
        max_length=2,
        choices=[
            ('h1', 'H1'),
            ('h2', 'H2'),
            ('h3', 'H3'),
            ('h4', 'H4'),
            ('h5', 'H5'),
            ('h6', 'H6'),
        ],
        default='h3'
    )

    display_type = models.CharField(
        max_length=20,
        choices=[
            ('title', 'Bold'),
            ('bullet', 'Bullet'),
            ('plain', 'Plain')
        ],
        default='bullet'
    )

    order = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.name



class Project(models.Model):
    PROJECT_TYPE_CHOICES = [
        ('link', 'Link'),
        ('file', 'File/Media')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tech = models.TextField(blank=True)

    project_type = models.CharField(
        max_length=10,
        choices=PROJECT_TYPE_CHOICES,
        default='link'
    )

    url = models.URLField(blank=True)

    thumbnail = models.ImageField(
        upload_to='project_thumbnails/',
        blank=True,
        null=True
    )

    file = models.FileField(
        upload_to='project_media/',
        blank=True,
        null=True
    )

    is_featured = models.BooleanField(default=True)

    # CASE STUDY FIELDS
    problem = models.TextField(blank=True)
    approach = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    solution = models.TextField(blank=True)
    outcome = models.TextField(blank=True)
    what_i_learned = models.TextField(blank=True)

    def __str__(self):
        return self.title



class Contact(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)

    # NEW FIELDS
    github_name = models.CharField(max_length=100, blank=True)
    github_url = models.URLField(blank=True)

    linkedin_name = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(blank=True)

    def __str__(self):
        return self.user.username





# models.py

from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):

    DOCUMENT_TYPE_CHOICES = [
        ('cv', 'CV / Resume'),
        ('certificate', 'Certificate'),
        ('academic', 'Academic Record'),
        ('id', 'ID Document'),
        ('other', 'Other Supporting Document'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES
    )

    # MAIN TITLE
    title = models.CharField(max_length=255, blank=True)

    # NEW FIELDS
    place_obtained = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    # FILE
    file = models.FileField(upload_to='documents/')

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.document_type}"



# ============================================
# CONTACT MESSAGE MODEL
# ============================================

class ContactMessage(models.Model):

    name = models.CharField(max_length=100)

    email = models.EmailField()

    company = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    message = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    is_read = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f"{self.name} - {self.email}"








