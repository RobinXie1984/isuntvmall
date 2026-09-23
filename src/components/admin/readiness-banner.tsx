export function ReadinessBanner({ readiness }: { readiness: { supabase: boolean; stripe: boolean; admin: boolean; siteUrl: boolean } }) {
  const ready = Object.values(readiness).every(Boolean);
  return (
    <div className={`readiness-banner ${ready ? "ready" : ""}`}>
      <strong>{ready ? "已具备上线配置" : "仍在演示配置"}</strong>
      <div><span className={readiness.supabase ? "ok" : ""}>Supabase</span><span className={readiness.stripe ? "ok" : ""}>Stripe</span><span className={readiness.siteUrl ? "ok" : ""}>站点网址</span><span className={readiness.admin ? "ok" : ""}>后台密码</span></div>
    </div>
  );
}
