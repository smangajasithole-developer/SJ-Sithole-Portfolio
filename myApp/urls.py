# =========================================================
# IMPORTS
# =========================================================

from django.urls import path
from . import views


# =========================================================
# URL PATTERNS
# =========================================================

urlpatterns = [

    # -----------------------------------------------------
    # PUBLIC PAGES
    # -----------------------------------------------------

    path('', views.home, name='home'),


    # -----------------------------------------------------
    # DASHBOARD
    # -----------------------------------------------------

    path('dashboard/', views.dashboard, name='dashboard'),


    # -----------------------------------------------------
    # PROFILE / ABOUT
    # -----------------------------------------------------

    path('profile/', views.profile, name='profile'),
    path('about/', views.about, name='about'),


    # -----------------------------------------------------
    # SKILLS
    # -----------------------------------------------------

    path('skills/', views.skills, name='skills'),
    path('skills/edit/<int:id>/', views.edit_skill, name='edit_skill'),
    path('skills/delete/<int:id>/', views.delete_skill, name='delete_skill'),


    # -----------------------------------------------------
    # PROJECTS
    # -----------------------------------------------------

    path('projects/', views.projects, name='projects'),
    path('projects/edit/<int:id>/', views.edit_project, name='edit_project'),
    path('projects/delete/<int:id>/', views.delete_project, name='delete_project'),


    # -----------------------------------------------------
    # DOCUMENTS
    # -----------------------------------------------------

    path('documents/', views.documents, name='documents'),
    path('documents/delete/<int:doc_id>/', views.delete_document, name='delete_document'),
    path('documents/edit/', views.edit_document, name='edit_document'),
    path('documents/replace/', views.replace_document, name='replace_document'),


    # -----------------------------------------------------
    # CONTACT / MESSAGES
    # -----------------------------------------------------

    path('contact/', views.contact, name='contact'),
    path('messages/', views.messages, name='messages'),
    path("send-message/", views.send_message, name="send_message"),


    # -----------------------------------------------------
    # AUTHENTICATION
    # -----------------------------------------------------

    path('admin_login/', views.admin_login, name='admin_login'),
    path('logout/', views.logout_user, name='logout'),
]