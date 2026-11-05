"""Shared helpers for tests."""

import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image


def make_image_file(name="photo.png", size=(40, 30), fmt="PNG", content_type="image/png"):
    buffer = io.BytesIO()
    Image.new("RGB", size, (225, 6, 0)).save(buffer, format=fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


class TempMediaMixin:
    """Routes uploads to a throwaway MEDIA_ROOT for the duration of a TestCase."""

    @classmethod
    def setUpClass(cls):
        cls._media_dir = tempfile.mkdtemp(prefix="rk-test-media-")
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_dir)
        cls._media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._media_override.disable()
        shutil.rmtree(cls._media_dir, ignore_errors=True)
