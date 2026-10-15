import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminAuth } from "@/lib/auth/store";
import { ApiError } from "@/lib/api/client";
import { useT } from "@/lib/i18n";
import { Alert, Button, Field } from "@/components/ui/kit";

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="ma-login">
      <div className="ma-login__card">
        <header>
          <svg className="ma-logo" width="168" height="19" role="img" aria-label={t("ماستري أكاديمي", "Mastery Academy")}>
            <use href="#ma-logo" />
          </svg>
          <h1 className="ma-login__title">{t("تسجيل الدخول إلى لوحة الإدارة", "Sign in to the admin")}</h1>
          <p className="ma-login__lead">
            {t("لمشرفي لوحة الإدارة فقط. حسابات العملاء لا تعمل هنا.", "Back-office admins only. Customer accounts don't work here.")}
          </p>
        </header>
        <form
          className="ma-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await login({ email, password });
              navigate("/", { replace: true });
            } catch (err) {
              setError(
                err instanceof ApiError && err.status === 401
                  ? t("البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقق منهما وحاول مرة أخرى.", "Wrong email or password. Check both and try again.")
                  : err instanceof Error
                    ? err.message
                    : t("فشل تسجيل الدخول.", "Sign-in failed."),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field id="email" type="email" label={t("البريد الإلكتروني", "Email")} autoComplete="email" dir="ltr" required value={email} onChange={setEmail} />
          <Field id="password" type="password" label={t("كلمة المرور", "Password")} autoComplete="current-password" dir="ltr" required value={password} onChange={setPassword} />
          {error ? <Alert kind="danger" title={t("تعذّر تسجيل الدخول", "Couldn't sign in")}>{error}</Alert> : null}
          <Button
            kind="primary"
            block
            type="submit"
            disabled={busy}
            className={busy ? "is-loading" : undefined}
            aria-busy={busy || undefined}
            label={busy ? t("جارٍ الدخول…", "Signing in…") : t("دخول", "Sign in")}
          />
        </form>
      </div>
    </main>
  );
}
