from django.urls import path

from billing import views

app_name = 'billing'

urlpatterns = [
    path('', views.InvoiceListView.as_view(), name='list'),
    path('new/', views.InvoiceCreateView.as_view(), name='create'),
    path('<int:pk>/', views.InvoiceDetailView.as_view(), name='detail'),
    path('<int:pk>/edit/', views.InvoiceUpdateView.as_view(), name='edit'),
    path('<int:pk>/pay/', views.InvoicePayView.as_view(), name='pay'),
    path('<int:pk>/cancel/', views.InvoiceCancelView.as_view(), name='cancel'),
    path('<int:pk>/delete/', views.InvoiceDeleteView.as_view(), name='delete'),
    path('export/', views.InvoiceExportView.as_view(), name='export'),
]
