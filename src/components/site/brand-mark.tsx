import Link from "next/link";

export function BrandMark() {
  return (
    <Link className="brand-mark" href="/" aria-label="SunTV Mall 首页">
      <span className="brand-sun">阳</span>
      <span><strong>SunTV</strong><small>LIVE COMMERCE</small></span>
    </Link>
  );
}
