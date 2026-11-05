import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible


@deconstructible
class MaxFileSizeValidator:
    """Rejects uploads larger than MAX_IMAGE_UPLOAD_MB (read at validation time)."""

    def __call__(self, file):
        limit_mb = settings.MAX_IMAGE_UPLOAD_MB
        if file and file.size > limit_mb * 1024 * 1024:
            raise ValidationError(
                f"Image is too large ({file.size / (1024 * 1024):.1f} MB). Maximum size is {limit_mb} MB.",
                code="file_too_large",
            )

    def __eq__(self, other):
        return isinstance(other, MaxFileSizeValidator)


validate_image_extension = FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])
validate_image_size = MaxFileSizeValidator()

IMAGE_VALIDATORS = [validate_image_extension, validate_image_size]

_PHONE_ERROR = "Enter a valid 10-digit Indian mobile number."


def normalize_phone(value):
    """
    Normalise an Indian mobile number to +91XXXXXXXXXX.
    Accepts "9515289991", "+91 95152 89991", "091-9515289991", etc.
    """
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) != 10 or digits[0] not in "6789":
        raise ValidationError(_PHONE_ERROR, code="invalid_phone")
    return f"+91{digits}"

