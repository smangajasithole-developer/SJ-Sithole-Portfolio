from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth import logout
from django.db import models
from django.views.decorators.cache import never_cache
from django.core.mail import send_mail
from django.core.files.base import ContentFile
from django.conf import settings

import pymupdf

from myApp.models import Profile
from .models import (
    Profile,
    About,
    Contact,
    Skill,
    Project,
    Document,
    ContactMessage
)


# =========================================================
# HOME PAGE
# =========================================================

def home(request):

    profile = Profile.objects.first()
    about = About.objects.first()
    contact = Contact.objects.first()

    all_skills = list(
        Skill.objects.all()
        .select_related('parent')
        .order_by('order', 'id')
    )

    skills_by_id = {
        skill.id: skill
        for skill in all_skills
    }

    children_by_parent = {}

    for skill in all_skills:
        if skill.parent_id:
            children_by_parent.setdefault(
                skill.parent_id,
                []
            ).append(skill)

    visibility_cache = {}

    def is_skill_publicly_visible(skill):
        """
        Determines whether this skill is allowed to exist publicly.

        A node's own `show` controls its name.
        A node's own `show_icon` controls its icon.

        A node remains publicly available if either its
        name OR its icon is enabled.

        However, if a parent has both `show=False` and
        `show_icon=False`, the entire child branch is hidden.
        """

        if skill.id in visibility_cache:
            return visibility_cache[skill.id]

        parent = skills_by_id.get(skill.parent_id)

        while parent:

            # Parent is completely disabled.
            if not parent.show and not parent.show_icon:
                visibility_cache[skill.id] = False
                return False

            parent = skills_by_id.get(parent.parent_id)

        visibility_cache[skill.id] = True
        return True

    for skill in all_skills:
        skill.public_visible = is_skill_publicly_visible(skill)

    for skill in all_skills:
        skill.public_children = children_by_parent.get(
            skill.id,
            []
        )

    technical_skills = [
        skill
        for skill in all_skills
        if skill.category == 'technical'
        and skill.parent_id is None
    ]

    other_skills = [
        skill
        for skill in all_skills
        if skill.category == 'other'
        and skill.parent_id is None
    ]

    projects = Project.objects.filter(is_featured=True)
    other_projects = Project.objects.filter(is_featured=False)

    cv_docs = Document.objects.filter(
        document_type='cv'
    ).order_by('uploaded_at')

    id_docs = Document.objects.filter(
        document_type='id'
    ).order_by('uploaded_at')

    certificate_docs = Document.objects.filter(
        document_type='certificate'
    ).order_by('uploaded_at')

    academic_docs = Document.objects.filter(
        document_type='academic'
    ).order_by('uploaded_at')

    other_docs = Document.objects.filter(
        document_type='other'
    ).order_by('uploaded_at')

    return render(request, 'home.html', {
        'profile': profile,
        'about': about,
        'contact': contact,

        'technical_skills': technical_skills,
        'other_skills': other_skills,

        'projects': projects,
        'other_projects': other_projects,

        'cv_docs': cv_docs,
        'id_docs': id_docs,
        'certificate_docs': certificate_docs,
        'academic_docs': academic_docs,
        'other_docs': other_docs,
    })


# =========================================================
# DASHBOARD
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def dashboard(request):
    return render(request, 'dashboard.html')


# =========================================================
# ADMIN LOGIN
# =========================================================

def admin_login(request):

    if request.method == "POST":

        email = request.POST.get("email")
        password = request.POST.get("password")

        User = get_user_model()

        try:
            user_obj = User.objects.get(email=email)

            user = authenticate(
                request,
                username=user_obj.username,
                password=password
            )

        except User.DoesNotExist:
            user = None

        if user is not None and user.is_staff:

            login(request, user)

            next_url = request.GET.get('next')

            return redirect(
                next_url if next_url else 'dashboard'
            )

        return render(request, "dashboard.html", {
            "error": "Invalid email or password"
        })

    return render(request, "dashboard.html")


# =========================================================
# LOGOUT
# =========================================================

def logout_user(request):

    request.session.flush()

    logout(request)

    response = redirect('admin_login')

    response.delete_cookie('sessionid')

    return response


def force_logout(request):

    request.session.flush()

    logout(request)

    response = redirect('admin_login')

    response.delete_cookie('sessionid')

    return response


# =========================================================
# PROFILE
# =========================================================
@never_cache
@login_required(login_url='admin_login')
def profile(request):

    profile, created = Profile.objects.get_or_create(
        user=request.user
    )

    if request.method == "POST":

        # =================================================
        # DELETE RESUME
        # =================================================

        if request.POST.get('resume_action') == 'delete':

            # Delete the actual resume file.
            if profile.resume:

                profile.resume.delete(
                    save=False
                )

                profile.resume = None

            # Delete the generated preview.
            if profile.resume_preview:

                profile.resume_preview.delete(
                    save=False
                )

                profile.resume_preview = None

            profile.save(
                update_fields=[
                    'resume',
                    'resume_preview'
                ]
            )

            return redirect('profile')

        # =================================================
        # PROFILE PHOTO
        # =================================================

        if 'profile_photo' in request.FILES:

            profile.profile_photo = request.FILES[
                'profile_photo'
            ]

        # =================================================
        # RESUME
        # =================================================

        if 'resume' in request.FILES:

            resume_file = request.FILES['resume']

            # Remove the old resume file when replacing.
            if profile.resume:

                profile.resume.delete(
                    save=False
                )

                profile.resume = None

            # Remove the old preview when replacing.
            if profile.resume_preview:

                profile.resume_preview.delete(
                    save=False
                )

                profile.resume_preview = None

            # Save the new resume.
            profile.resume = resume_file

            # =================================================
            # GENERATE FIRST PAGE PREVIEW FOR PDF
            # =================================================

            file_name = resume_file.name.lower()

            if file_name.endswith('.pdf'):

                try:

                    pdf_data = resume_file.read()

                    pdf_document = pymupdf.open(
                        stream=pdf_data,
                        filetype="pdf"
                    )

                    if pdf_document.page_count > 0:

                        first_page = pdf_document.load_page(0)

                        pixmap = first_page.get_pixmap(
                            matrix=pymupdf.Matrix(1.5, 1.5),
                            alpha=False
                        )

                        preview_data = pixmap.tobytes(
                            "png"
                        )

                        preview_name = (
                            f"{resume_file.name.rsplit('.', 1)[0]}.png"
                        )

                        profile.resume_preview.save(
                            preview_name,
                            ContentFile(preview_data),
                            save=False
                        )

                    pdf_document.close()

                except Exception:

                    # If preview generation fails,
                    # keep the uploaded resume working.
                    profile.resume_preview = None

                finally:

                    # Reset uploaded file pointer so Django
                    # can still save the actual resume file.
                    resume_file.seek(0)

        # =================================================
        # SPLIT NAMES
        # =================================================

        profile.first_name = request.POST.get(
            'first_name',
            ''
        )

        profile.middle_name = request.POST.get(
            'middle_name',
            ''
        )

        profile.last_name = request.POST.get(
            'last_name',
            ''
        )

        # Keep full_name auto generated for old live pages.
        profile.full_name = " ".join(
            filter(
                None,
                [
                    profile.first_name.strip(),
                    profile.middle_name.strip(),
                    profile.last_name.strip()
                ]
            )
        )

        # =================================================
        # OTHER PROFILE INFORMATION
        # =================================================

        profile.job_title = request.POST.get(
            'job_title',
            ''
        )

        profile.location = request.POST.get(
            'location',
            ''
        )

        profile.bio = request.POST.get(
            'bio',
            ''
        )

        profile.availability = (
            request.POST.get('availability') == 'True'
        )

        # =================================================
        # SAVE PROFILE
        # =================================================

        profile.save()

        return redirect('profile')

    return render(
        request,
        'profile.html',
        {
            'profile': profile
        }
    )
# =========================================================
# ABOUT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def about(request):

    about, created = About.objects.get_or_create(
        user=request.user
    )

    if request.method == "POST":

        about.subheading = request.POST.get(
            'subheading',
            ''
        )

        about.paragraph1 = request.POST.get(
            'paragraph1',
            ''
        )

        about.paragraph2 = request.POST.get(
            'paragraph2',
            ''
        )

        about.years_experience = request.POST.get(
            'years_experience',
            ''
        )

        about.projects_completed = request.POST.get(
            'projects_completed',
            ''
        )

        about.certifications = request.POST.get(
            'certifications',
            ''
        )

        about.location = request.POST.get(
            'location',
            ''
        )

        about.save()

        return redirect('about')

    return render(
        request,
        'about.html',
        {
            'about': about
        }
    )


# =========================================================
# SKILLS
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def skills(request):

    # =========================
    # DRAG & DROP REORDER
    # =========================

    if request.method == "POST" and request.POST.get("reorder"):

        order_ids = request.POST.getlist("order_ids")

        if order_ids:

            try:
                order_ids = [
                    int(skill_id)
                    for skill_id in order_ids
                ]

            except (TypeError, ValueError):
                return redirect("skills")

            skills_to_reorder = Skill.objects.filter(
                id__in=order_ids,
                user=request.user
            )

            skills_by_id = {
                skill.id: skill
                for skill in skills_to_reorder
            }

            if len(skills_by_id) != len(order_ids):
                return redirect("skills")

            first_skill = skills_by_id.get(
                order_ids[0]
            )

            if first_skill:

                parent_id = first_skill.parent_id

                same_parent = all(
                    skill.parent_id == parent_id
                    for skill in skills_by_id.values()
                )

                if same_parent:

                    for position, skill_id in enumerate(
                        order_ids
                    ):

                        skill = skills_by_id[skill_id]

                        if skill.order != position:

                            skill.order = position

                            skill.save(
                                update_fields=["order"]
                            )

        return redirect("skills")

    # =========================
    # UPDATE NODE
    # =========================

    if request.method == "POST" and request.POST.get("update_id"):

        update_id = request.POST.get("update_id")

        name = request.POST.get("name")
        category = request.POST.get("category")
        icon = request.POST.get("icon", "")

        show = request.POST.get("show") == "on"
        show_icon = request.POST.get("show_icon") == "on"

        skill = Skill.objects.filter(
            id=update_id,
            user=request.user
        ).first()

        if skill:

            skill.name = name
            skill.category = category
            skill.icon = icon
            skill.show = show
            skill.show_icon = show_icon

            skill.save()

        return redirect("skills")

    # =========================
    # CREATE NODE
    # =========================

    if request.method == "POST":

        name = request.POST.get("name")
        category = request.POST.get("category")
        icon = request.POST.get("icon", "")
        parent_id = request.POST.get("parent_id")

        parent = None

        if parent_id:

            parent = Skill.objects.filter(
                id=parent_id,
                user=request.user
            ).first()

        last_sibling = Skill.objects.filter(
            user=request.user,
            parent=parent
        ).order_by(
            "-order",
            "-id"
        ).first()

        next_order = (
            last_sibling.order + 1
            if last_sibling
            else 0
        )

        Skill.objects.create(
            user=request.user,
            name=name,
            category=category,
            icon=icon,
            show=True,
            show_icon=True,
            parent=parent,
            order=next_order
        )

        return redirect("skills")

    # =========================
    # ROOT NODES
    # =========================

    technical_skills = Skill.objects.filter(
        user=request.user,
        category='technical',
        parent__isnull=True
    ).prefetch_related(
        "children"
    ).order_by(
        "order",
        "id"
    )

    other_skills = Skill.objects.filter(
        user=request.user,
        category='other',
        parent__isnull=True
    ).prefetch_related(
        "children"
    ).order_by(
        "order",
        "id"
    )

    return render(
        request,
        "skills.html",
        {
            "technical_skills": technical_skills,
            "other_skills": other_skills,
        }
    )


# =========================================================
# EDIT SKILL
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def edit_skill(request, id):

    skill = Skill.objects.get(
        id=id,
        user=request.user
    )

    if request.method == "POST":

        name = request.POST.get("name")
        category = request.POST.get("category")
        icon = request.POST.get("icon", "")

        show = request.POST.get("show") == "on"
        show_icon = request.POST.get("show_icon") == "on"

        skill.name = name
        skill.category = category
        skill.icon = icon
        skill.show = show
        skill.show_icon = show_icon

        skill.save()

        return redirect("skills")

    technical_skills = Skill.objects.filter(
        user=request.user,
        category="technical",
        parent__isnull=True
    ).order_by(
        "order",
        "id"
    )

    other_skills = Skill.objects.filter(
        user=request.user,
        category="other",
        parent__isnull=True
    ).order_by(
        "order",
        "id"
    )

    return render(
        request,
        "skills.html",
        {
            "edit_skill": skill,
            "technical_skills": technical_skills,
            "other_skills": other_skills,
        }
    )


# =========================================================
# DELETE SKILL
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def delete_skill(request, id):

    skill = Skill.objects.get(
        id=id,
        user=request.user
    )

    if request.method == "POST":
        skill.delete()

    return redirect("skills")


# =========================================================
# PROJECTS
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def projects(request):

    projects = Project.objects.filter(
        user=request.user,
        is_featured=True
    )

    other_projects = Project.objects.filter(
        user=request.user,
        is_featured=False
    )

    if request.method == "POST":

        title = request.POST.get('title')
        description = request.POST.get('description')
        tech = request.POST.get('tech')
        is_featured = request.POST.get('is_featured') == 'True'
        project_type = request.POST.get('project_type')
        url = request.POST.get('url', '')

        file = request.FILES.get('file')
        thumbnail = request.FILES.get('thumbnail')

        # CASE STUDY FIELDS

        problem = request.POST.get('problem')
        approach = request.POST.get('approach')
        challenges = request.POST.get('challenges')
        solution = request.POST.get('solution')
        outcome = request.POST.get('outcome')
        what_i_learned = request.POST.get(
            'what_i_learned'
        )

        Project.objects.create(
            user=request.user,
            title=title,
            description=description,
            tech=tech,
            is_featured=is_featured,
            project_type=project_type,
            url=url if project_type == 'link' else '',
            thumbnail=(
                thumbnail
                if project_type == 'link'
                else None
            ),
            file=(
                file
                if project_type == 'file'
                else None
            ),

            # SAVE CASE STUDY DATA

            problem=problem,
            approach=approach,
            challenges=challenges,
            solution=solution,
            outcome=outcome,
            what_i_learned=what_i_learned
        )

        return redirect('projects')

    return render(
        request,
        'projects.html',
        {
            'projects': projects,
            'other_projects': other_projects
        }
    )


# =========================================================
# EDIT PROJECT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def edit_project(request, id):

    project = get_object_or_404(
        Project,
        id=id,
        user=request.user
    )

    if request.method == "POST":

        project.title = request.POST.get("title")
        project.description = request.POST.get(
            "description"
        )
        project.tech = request.POST.get("tech")
        project.url = request.POST.get("url")
        project.project_type = request.POST.get(
            "project_type"
        )
        project.is_featured = (
            request.POST.get("is_featured") == "True"
        )

        if request.FILES.get("file"):

            project.file = request.FILES["file"]

        if request.FILES.get("thumbnail"):

            project.thumbnail = request.FILES[
                "thumbnail"
            ]

        project.problem = request.POST.get("problem")
        project.approach = request.POST.get("approach")
        project.challenges = request.POST.get(
            "challenges"
        )
        project.solution = request.POST.get("solution")
        project.outcome = request.POST.get("outcome")
        project.what_i_learned = request.POST.get(
            "what_i_learned"
        )

        project.save()

        return redirect("projects")

    return render(
        request,
        "projects.html",
        {
            "edit_project": project
        }
    )


# =========================================================
# DELETE PROJECT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def delete_project(request, id):

    project = Project.objects.get(
        id=id,
        user=request.user
    )

    if request.method == "POST":
        project.delete()

    return redirect('projects')


# =========================================================
# DOCUMENTS DASHBOARD
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def documents(request):

    if request.method == "POST":

        # =================================================
        # SINGLE FILES
        # =================================================

        cv = request.FILES.get('cv')

        id_document = request.FILES.get(
            'id_document'
        )

        # =================================================
        # CERTIFICATES
        # =================================================

        certificates = request.FILES.getlist(
            'certificates'
        )

        certificate_title = request.POST.get(
            'certificate_title'
        )

        certificate_place = request.POST.get(
            'certificate_place'
        )

        certificate_description = request.POST.get(
            'certificate_description'
        )

        # =================================================
        # ACADEMIC RECORDS
        # =================================================

        academic_records = request.FILES.getlist(
            'academic_record'
        )

        academic_title = request.POST.get(
            'academic_title'
        )

        academic_place = request.POST.get(
            'academic_place'
        )

        academic_description = request.POST.get(
            'academic_description'
        )

        # =================================================
        # OTHER DOCUMENTS
        # =================================================

        other_documents = request.FILES.getlist(
            'other_document'
        )

        other_title = request.POST.get(
            'other_title'
        )

        other_description = request.POST.get(
            'other_description'
        )

        # =================================================
        # CV (ONLY ONE FILE)
        # =================================================

        if cv:

            Document.objects.filter(
                user=request.user,
                document_type='cv'
            ).delete()

            Document.objects.create(
                user=request.user,
                document_type='cv',
                title=cv.name,
                file=cv
            )

        # =================================================
        # ID (ONLY ONE FILE)
        # =================================================

        if id_document:

            Document.objects.filter(
                user=request.user,
                document_type='id'
            ).delete()

            Document.objects.create(
                user=request.user,
                document_type='id',
                title=id_document.name,
                file=id_document
            )

        # =================================================
        # CERTIFICATES
        # =================================================

        for file in certificates:

            Document.objects.create(
                user=request.user,
                document_type='certificate',
                title=certificate_title,
                place_obtained=certificate_place,
                description=certificate_description,
                file=file
            )

        # =================================================
        # ACADEMIC RECORDS
        # =================================================

        for file in academic_records:

            Document.objects.create(
                user=request.user,
                document_type='academic',
                title=academic_title,
                place_obtained=academic_place,
                description=academic_description,
                file=file
            )

        # =================================================
        # OTHER DOCUMENTS
        # =================================================

        for file in other_documents:

            Document.objects.create(
                user=request.user,
                document_type='other',
                title=other_title,
                description=other_description,
                file=file
            )

        return redirect('documents')

    # =====================================================
    # RETRIEVE DOCUMENTS
    # =====================================================

    cv_docs = Document.objects.filter(
        user=request.user,
        document_type='cv'
    ).order_by('uploaded_at')

    id_docs = Document.objects.filter(
        user=request.user,
        document_type='id'
    ).order_by('uploaded_at')

    certificate_docs = Document.objects.filter(
        user=request.user,
        document_type='certificate'
    ).order_by('uploaded_at')

    academic_docs = Document.objects.filter(
        user=request.user,
        document_type='academic'
    ).order_by('uploaded_at')

    other_docs = Document.objects.filter(
        user=request.user,
        document_type='other'
    ).order_by('uploaded_at')

    return render(
        request,
        'documents.html',
        {
            'cv_docs': cv_docs,
            'id_docs': id_docs,
            'certificate_docs': certificate_docs,
            'academic_docs': academic_docs,
            'other_docs': other_docs,
        }
    )


# =========================================================
# DELETE DOCUMENT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def delete_document(request, doc_id):

    doc = Document.objects.get(
        id=doc_id,
        user=request.user
    )

    doc.delete()

    return redirect('documents')


# =========================================================
# EDIT DOCUMENT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def edit_document(request):

    if request.method == "POST":

        doc_id = request.POST.get("doc_id")

        title = request.POST.get("title")
        place = request.POST.get(
            "place_obtained"
        )
        description = request.POST.get(
            "description"
        )

        try:

            doc = Document.objects.get(
                id=doc_id,
                user=request.user
            )

            if doc.document_type in [
                "certificate",
                "academic",
                "other"
            ]:

                doc.title = title
                doc.place_obtained = place
                doc.description = description

                doc.save()

        except Document.DoesNotExist:
            pass

    return redirect("documents")


# =========================================================
# REPLACE DOCUMENT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def replace_document(request):

    if request.method == "POST":

        doc_id = request.POST.get("doc_id")

        new_file = request.FILES.get(
            "new_file"
        )

        try:

            doc = Document.objects.get(
                id=doc_id,
                user=request.user
            )

            if new_file:

                doc.file.delete(
                    save=False
                )

                doc.file = new_file

                doc.save()

        except Document.DoesNotExist:
            pass

    return redirect("documents")


# =========================================================
# SEND CONTACT MESSAGE
# =========================================================

def send_message(request):

    if request.method != "POST":
        return redirect("home")

    name = request.POST.get("name")
    email = request.POST.get("email")
    company = (
        request.POST.get("company")
        or "Not provided"
    )
    message = request.POST.get("message")

    # SAVE TO DATABASE

    ContactMessage.objects.create(
        name=name,
        email=email,
        company=company,
        message=message
    )

    # =====================================================
    # EMAIL TO ADMIN
    # =====================================================

    admin_subject = (
        f"New Portfolio Message from {name}"
    )

    admin_message = f"""
You received a new message from your portfolio.

--------------------------
Name: {name}
Email: {email}
Company: {company}
--------------------------

Message:
{message}
"""

    send_mail(
        admin_subject,
        admin_message,
        settings.DEFAULT_FROM_EMAIL,
        [settings.DEFAULT_FROM_EMAIL],
        fail_silently=False
    )

    # =====================================================
    # CONFIRMATION EMAIL
    # =====================================================

    recruiter_subject = (
        "Message received - Smanga J Sithole Portfolio"
    )

    recruiter_message = f"""
Hi {name},

Thank you for contacting me through my portfolio.

I have successfully received your message and will respond shortly.

--------------------------
Your Message:
{message}
--------------------------

Regards,
Smanga J Sithole
Software Developer
"""

    send_mail(
        recruiter_subject,
        recruiter_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )

    return redirect("home")


# =========================================================
# MESSAGES PAGE
# =========================================================

@never_cache
@login_required
def messages(request):

    all_messages = ContactMessage.objects.all().order_by(
        "-created_at"
    )

    context = {
        "all_messages": all_messages
    }

    return render(
        request,
        "messages.html",
        context
    )


# =========================================================
# CONTACT
# =========================================================

@never_cache
@login_required(login_url='admin_login')
def contact(request):

    contact, created = Contact.objects.get_or_create(
        user=request.user
    )

    if request.method == "POST":

        # BASIC INFO

        contact.email = request.POST.get(
            'email',
            ''
        )

        contact.phone = request.POST.get(
            'phone',
            ''
        )

        contact.location = request.POST.get(
            'location',
            ''
        )

        # GITHUB

        contact.github_name = request.POST.get(
            'github_name',
            ''
        )

        contact.github_url = request.POST.get(
            'github_url',
            ''
        )

        # LINKEDIN

        contact.linkedin_name = request.POST.get(
            'linkedin_name',
            ''
        )

        contact.linkedin_url = request.POST.get(
            'linkedin_url',
            ''
        )

        contact.save()

        return redirect('contact')

    return render(
        request,
        'contact.html',
        {
            'contact': contact
        }
    )


# =========================================================
# PUBLIC SKILL VISIBILITY
# =========================================================

def is_skill_publicly_visible(skill):
    """
    A skill is publicly visible only when:
    - The skill itself is enabled.
    - Every parent/ancestor is enabled.
    """

    if not skill.show:
        return False

    parent = skill.parent

    while parent:

        if not parent.show:
            return False

        parent = parent.parent

    return True