import { useEffect, useRef } from "react";

// Shared building blocks for admin pages. Styles live in app/styles/admin-ui.css.

export function Card({ title, meta, actions, children, flush = false, style }) {
  return (
    <div className="cc-card" style={style}>
      {(title || actions) && (
        <div className="cc-card__head">
          {title && <h2>{title}</h2>}
          {meta && <span className="cc-card__meta">{meta}</span>}
          {actions && <div className="cc-card__actions">{actions}</div>}
        </div>
      )}
      {flush ? <div className="cc-card__flush">{children}</div> : <div className="cc-card__body">{children}</div>}
    </div>
  );
}

export function Badge({ tone, children }) {
  return <span className={`cc-badge${tone ? ` cc-badge--${tone}` : ""}`}>{children}</span>;
}

export function StatusBadge({ active }) {
  return active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>;
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className="cc-switch"
      role="switch"
      aria-checked={checked ? "true" : "false"}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    />
  );
}

export function TextField({ id, label, value, onChange, type = "text", placeholder, help, error, ...rest }) {
  return (
    <div className="cc-field">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className="cc-input"
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error ? <span className="cc-error">{error}</span> : help ? <span className="cc-help">{help}</span> : null}
    </div>
  );
}

export function TextArea({ id, label, value, onChange, placeholder, help, ...rest }) {
  return (
    <div className="cc-field">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea id={id} className="cc-textarea" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...rest} />
      {help && <span className="cc-help">{help}</span>}
    </div>
  );
}

export function SelectField({ id, label, value, onChange, options, placeholder, help, style }) {
  return (
    <div className="cc-field" style={style}>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} className="cc-select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {help && <span className="cc-help">{help}</span>}
    </div>
  );
}

export function Checkbox({ id, checked, onChange, label, help }) {
  return (
    <label className="cc-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <strong>{label}</strong>
        {help && <><br /><span className="cc-muted">{help}</span></>}
      </span>
    </label>
  );
}

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  // Keep the latest onClose without re-running the effect, so callers can pass inline functions.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current?.(); };
    document.addEventListener("keydown", onKey);
    // Focus the first form field when the modal opens; fall back to the first button.
    const body = ref.current?.querySelector(".cc-modal__body");
    const first = body?.querySelector("input, select, textarea") || ref.current?.querySelector(".cc-modal__foot button");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="cc-scrim" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} className={`cc-modal${wide ? " cc-modal--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="cc-modal__head">
          <h2>{title}</h2>
          <button type="button" className="cc-iconbtn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="cc-modal__body">{children}</div>
        {footer && <div className="cc-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, children, confirmLabel = "Delete", destructive = true, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="cc-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className={`cc-btn ${destructive ? "cc-btn--critical-solid" : "cc-btn--primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function Chevron() {
  return (
    <svg className="cc-chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackButton({ onClick, label = "Back" }) {
  return (
    <button type="button" className="cc-iconbtn" aria-label={label} onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function Thumb({ src, alt }) {
  return src ? <img className="cc-thumb" src={src} alt={alt || ""} /> : <span className="cc-thumb" aria-hidden="true" />;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="cc-empty">
      <strong style={{ color: "var(--cc-fg)" }}>{title}</strong>
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}
