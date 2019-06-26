from unittest import TestCase
from webserver import base64_string_encode, base64_string_decode


class TestBase64Funcs(TestCase):
    def test_base64_string_encode(self):
        result = base64_string_encode("abcdefg")
        self.assertEqual(result, "YWJjZGVmZw==")

    def test_base64_string_decode(self):
        result = base64_string_decode("VGVzdGluZzEyMw==")
        self.assertEqual(result, "Testing123")
