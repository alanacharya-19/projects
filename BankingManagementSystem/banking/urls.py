from rest_framework.routers import DefaultRouter

from accounts.views import BankAccountViewSet
from customers.views import CustomerViewSet
from transactions.views import TransactionViewSet

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("accounts", BankAccountViewSet, basename="account")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = router.urls
