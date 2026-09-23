"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "无法登录。");
      setBusy(false);
      return;
    }
    router.replace("/admin/products");
    router.refresh();
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <span className="eyebrow">OPERATOR CONSOLE</span>
      <h1>SunTV Mall 运营入口</h1>
      <p>一个小后台：上货、排直播、看订单。</p>
      {!configured && <p className="notice warning">先在部署环境设置 ADMIN_PASSWORD 与至少 32 位的 ADMIN_SESSION_SECRET。</p>}
      <input type="text" name="username" value="operator" autoComplete="username" readOnly hidden />
      <label><span>运营密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-block" type="submit" disabled={!configured || busy}>{busy ? "正在验证…" : "进入后台"}</button>
    </form>
  );
}
