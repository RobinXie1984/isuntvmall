"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="shell page-space"><div className="empty-state"><span className="empty-icon">!</span><h1>暂时没有接上信号</h1><p>请稍后再试；如果问题持续，请联系运营人员。</p><button className="button" type="button" onClick={reset}>重新加载</button></div></div>;
}
