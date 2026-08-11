from django.urls import path

from laboratory import views

app_name = 'laboratory'

urlpatterns = [
    path('', views.LabTestOrderListView.as_view(), name='order_list'),
    path('orders/new/', views.LabTestOrderCreateView.as_view(), name='order_create'),
    path('orders/<int:pk>/', views.LabTestOrderDetailView.as_view(), name='order_detail'),
    path('orders/<int:pk>/cancel/', views.LabTestOrderCancelView.as_view(), name='order_cancel'),
    path('items/<int:pk>/result/', views.LabTestItemResultView.as_view(), name='item_result'),
    path('items/<int:pk>/cancel/', views.LabTestItemCancelView.as_view(), name='item_cancel'),
    path('tests/', views.LabTestTypeListView.as_view(), name='type_list'),
    path('tests/add/', views.LabTestTypeCreateView.as_view(), name='type_add'),
    path('tests/<int:pk>/edit/', views.LabTestTypeUpdateView.as_view(), name='type_edit'),
    path('tests/<int:pk>/delete/', views.LabTestTypeDeleteView.as_view(), name='type_delete'),
]
