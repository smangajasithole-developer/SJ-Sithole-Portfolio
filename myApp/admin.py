from django.contrib import admin

from .models import *

from .models import Profile, About, Skill, Project, Contact, Document

admin.site.register(Profile)
admin.site.register(About)
admin.site.register(Skill)
admin.site.register(Project)
admin.site.register(Contact)

admin.site.register(Document)

# ============================================
# CONTACT MESSAGE ADMIN
# ============================================

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "email",
        "company",
        "created_at",
        "is_read"
    )

    list_filter = (
        "is_read",
        "created_at"
    )

    search_fields = (
        "name",
        "email",
        "company",
        "message"
    )

    ordering = (
        "-created_at",
    )