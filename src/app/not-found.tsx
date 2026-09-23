import Link from "next/link";

export default function NotFound() {
  return <div className="shell page-space"><div className="empty-state"><span className="empty-icon">404</span><h1>这一页不在播</h1><p>内容可能已经下架，或链接写错了。</p><Link className="button" href="/">回到首页</Link></div></div>;
}
