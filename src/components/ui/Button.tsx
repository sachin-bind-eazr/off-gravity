import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Common = {
  variant?: "primary" | "secondary" | "outline" | "ghost-on-dark";
  size?: "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  className?: string;
  children: ReactNode;
};
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;
type AsLink = Common & { href: string; disabled?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common | "href">;
export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth, loading, leadingIcon: L, trailingIcon: T, className = "", children } = props;
  const cls = `og-btn og-btn--${variant}${size === "lg" ? " og-btn--lg" : ""}${fullWidth ? " og-btn--full" : ""} ${className}`.trim();
  const inner = (
    <>
      {loading ? <Loader2 size={18} strokeWidth={1.75} className="og-btn__spin" aria-hidden /> : L && <L size={18} strokeWidth={1.75} aria-hidden />}
      <span>{children}</span>
      {T && !loading && <T size={18} strokeWidth={1.75} aria-hidden />}
    </>
  );
  if (props.href !== undefined) {
    const { href, disabled, variant: _v, size: _s, fullWidth: _f, loading: _l, leadingIcon: _a, trailingIcon: _b, className: _c, children: _d, ...a } = props;
    const off = disabled || loading;
    const ext = /^(https?:|mailto:|tel:)/.test(href);
    const common = { className: cls, "aria-disabled": off || undefined, "aria-busy": loading || undefined, ...a };
    return ext ? <a href={href} {...common}>{inner}</a> : <Link href={href} {...common}>{inner}</Link>;
  }
  const { variant: _v, size: _s, fullWidth: _f, loading: _l, leadingIcon: _a, trailingIcon: _b, className: _c, children: _d, type = "button", disabled, ...b } = props;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...b}>
      {inner}
    </button>
  );
}

export default Button;
