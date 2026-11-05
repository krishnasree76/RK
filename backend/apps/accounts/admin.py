from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from unfold.admin import ModelAdmin, StackedInline
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import CustomerProfile


class CustomerProfileInline(StackedInline):
    model = CustomerProfile
    can_delete = False
    fields = ["phone", "google_sub"]
    readonly_fields = ["google_sub"]
    verbose_name_plural = "Customer details"


# Re-register auth models with Unfold styling and the customer details inline.
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    inlines = [CustomerProfileInline]
    list_display = ["username", "full_name", "email", "phone", "sign_in_method", "is_staff", "date_joined"]
    list_select_related = ["profile"]
    search_fields = ["username", "first_name", "last_name", "email", "profile__phone"]
    ordering = ["-date_joined"]

    @display(description="Name")
    def full_name(self, obj):
        return obj.get_full_name() or "—"

    @display(description="Phone")
    def phone(self, obj):
        profile = getattr(obj, "profile", None)
        return (profile.phone if profile else None) or "—"

    @display(description="Sign-in", label={"Google": "info", "Password": "success"})
    def sign_in_method(self, obj):
        profile = getattr(obj, "profile", None)
        return "Google" if profile and profile.google_sub else "Password"


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass
