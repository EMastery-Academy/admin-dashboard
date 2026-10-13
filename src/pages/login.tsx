import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminAuth } from "@/lib/auth/store";
import { ApiError } from "@/lib/api/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/kit";

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="ma-login">
      <div className="ma-panel">
        <span className="ma-brandmark">
          <svg width="34" height="15" role="img" aria-label="ماستري أكاديمي">
            <use href="/sprite.svg#ma-mark" />
          </svg>
          <span>{t("ماستري أكاديمي", "Mastery Academy")}</span>
        </span>
        <h1>{t("تسجيل الدخول", "Sign in")}</h1>
        <p className="ma-muted">
          {t("لمشرفي لوحة الإدارة فقط. حسابات العملاء لا تعمل هنا.", "Back-office admins only. Customer accounts don't work here.")}
        </p>
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
                  ? t("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Wrong email or password.")
                  : err instanceof Error
                    ? err.message
                    : t("فشل تسجيل الدخول.", "Sign-in failed."),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="ma-fieldblock">
            <label className="ma-label" htmlFor="email">
              {t("البريد الإلكتروني", "Email")}
            </label>
            <input
              className="ma-input"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="ma-fieldblock">
            <label className="ma-label" htmlFor="password">
              {t("كلمة المرور", "Password")}
            </label>
            <input
              className="ma-input"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <div className="ma-alert ma-alert--danger" role="alert">
              <div>
                <p className="ma-alert__title">{error}</p>
              </div>
            </div>
          ) : null}
          <Button kind="primary" block type="submit" disabled={busy} label={busy ? t("جارٍ الدخول…", "Signing in…") : t("دخول", "Sign in")} />
        </form>
      </div>
    </div>
  );
}
