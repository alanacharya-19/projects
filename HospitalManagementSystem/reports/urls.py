from django.urls import path

from reports import views

app_name = 'reports'

urlpatterns = [
    path('', views.ReportIndexView.as_view(), name='index'),
    path('financial/', views.FinancialReportView.as_view(), name='financial'),
    path('financial/export/', views.FinancialExportView.as_view(), name='financial_export'),
    path('clinical/', views.ClinicalReportView.as_view(), name='clinical'),
    path('clinical/export/', views.ClinicalExportView.as_view(), name='clinical_export'),
    path('operations/', views.OperationsReportView.as_view(), name='operations'),
    path('operations/export/', views.OperationsExportView.as_view(), name='operations_export'),
]
