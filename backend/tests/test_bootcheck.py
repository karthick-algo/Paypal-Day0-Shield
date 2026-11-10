import os
import tempfile
import unittest

from app.bootcheck import validate

HASH = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$aGFzaGhhc2hoYXNoaGFzaA"


def good_env(data_dir):
    return {
        "APP_ENV": "production", "PAYPAL_ENV": "sandbox", "DATA_DIR": data_dir,
        "SECRET_KEY": "x" * 48, "ADMIN_USERNAME": "admin", "ADMIN_PASSWORD_HASH": HASH,
        "ALLOWED_HOSTS": "day0-shield.onrender.com", "PAYPAL_CLIENT_ID": "id",
        "PAYPAL_SECRET": "s", "PAYPAL_WEBHOOK_ID": "w", "LLM_API_KEY": "k", "LLM_MODEL": "m",
        "MAX_REFUND_OFFER_USD": "25", "MAX_ACTIONS_PER_MINUTE": "10", "MAX_DAILY_WRITES": "100",
    }


class BootcheckTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.env = good_env(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def errs(self, **over):
        env = {**self.env, **over}
        return validate(env, check_toolkit=False)

    def test_good_config_passes(self):
        self.assertEqual(self.errs(), [])

    def test_acceptance_3_each_refusal(self):
        cases = {
            "missing SECRET_KEY": {"SECRET_KEY": ""},
            "PAYPAL_ENV=live": {"PAYPAL_ENV": "live"},
            "non-sandbox base url": {"PAYPAL_BASE_URL": "https://api-m.paypal.com"},
            "empty ADMIN_PASSWORD_HASH": {"ADMIN_PASSWORD_HASH": ""},
            "ALLOWED_HOSTS=*": {"ALLOWED_HOSTS": "*"},
        }
        for name, over in cases.items():
            with self.subTest(name):
                self.assertTrue(self.errs(**over), name)

    def test_more_refusals(self):
        for over in [
            {"SECRET_KEY": "short"}, {"SECRET_KEY": "changeme"},
            {"ADMIN_PASSWORD_HASH": "plaintext-password"},
            {"PAYPAL_MCP_URL": "https://mcp.paypal.com/http"},
            {"DEBUG": "true"}, {"FORCE_HTTPS": "false"}, {"ALLOWED_HOSTS": ""},
            {"MAX_REFUND_OFFER_USD": "0"}, {"MAX_ACTIONS_PER_MINUTE": "abc"},
            {"MAX_DAILY_WRITES": ""}, {"LLM_MODEL": ""}, {"PAYPAL_WEBHOOK_ID": ""},
            {"DATA_DIR": "/nonexistent-dir-xyz"}, {"EXECUTION_MODE": "weird"},
        ]:
            with self.subTest(over):
                self.assertTrue(self.errs(**over))

    def test_sandbox_mcp_url_allowed(self):
        self.assertEqual(self.errs(PAYPAL_MCP_URL="https://mcp.sandbox.paypal.com/http"), [])

    def test_errors_never_contain_secret_values(self):
        out = " ".join(self.errs(SECRET_KEY="short-but-secret-value"))
        self.assertNotIn("short-but-secret-value", out)

    def test_secret_file_variant(self):
        path = os.path.join(self._tmp.name, "sk")
        with open(path, "w") as fh:
            fh.write("y" * 40 + "\n")
        env = {**self.env, "SECRET_KEY": "", "SECRET_KEY_FILE": path}
        self.assertEqual(validate(env, check_toolkit=False), [])

    def test_sqlite_perms_tightened(self):
        db = os.path.join(self._tmp.name, "app.db")
        open(db, "w").close()
        os.chmod(db, 0o644)
        self.assertEqual(self.errs(), [])
        if os.name != "nt":
            self.assertEqual(os.stat(db).st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
