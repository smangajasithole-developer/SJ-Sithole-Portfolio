from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/', views.profile, name='profile'),
    path('about/', views.about, name='about'),
    path('projects/', views.projects, name='projects'),

    path('skills/', views.skills, name='skills'),
    path('skills/edit/<int:id>/', views.edit_skill, name='edit_skill'),
    path('skills/delete/<int:id>/', views.delete_skill, name='delete_skill'),

    path('projects/edit/<int:id>/', views.edit_project, name='edit_project'),
    path('projects/delete/<int:id>/', views.delete_project, name='delete_project'),

    path('documents/', views.documents, name='documents'),
    path('documents/delete/<int:doc_id>/', views.delete_document, name='delete_document'),
    path('documents/edit/', views.edit_document, name='edit_document'),
    path('documents/replace/', views.replace_document, name='replace_document'),

    path('contact/', views.contact, name='contact'),

    path('admin_login/', views.admin_login, name='admin_login'),
    path('logout/', views.logout_user, name='logout'),

    path('messages/', views.messages, name='messages'),
    path("send-message/", views.send_message, name="send_message"),
]