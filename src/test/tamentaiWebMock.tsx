import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
} from 'react';

interface ChildrenProps {
  children?: ReactNode;
}

export function Avatar({ initials, alt }: { initials?: string; alt?: string }) {
  return <span aria-hidden="true">{initials ?? alt}</span>;
}

export function Text({
  children,
  as: Tag = 'p',
}: ChildrenProps & { as?: 'div' | 'p' | 'span' | 'label' | 'small' }) {
  return <Tag>{children}</Tag>;
}

export function TitleV2({
  children,
  variant = 'h2',
}: ChildrenProps & { variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  const Tag = variant;
  return <Tag>{children}</Tag>;
}

export function Card({ children }: ChildrenProps) {
  return <div>{children}</div>;
}

export function Icon({ name }: { name: string }) {
  return <span aria-hidden="true">{name}</span>;
}

export function Button({
  children,
  type = 'button',
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function ButtonGroup({
  children,
  'aria-label': ariaLabel,
}: ChildrenProps & { 'aria-label': string }) {
  return (
    <div role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function ButtonIcon({
  'aria-label': ariaLabel,
  onClick,
  type = 'button',
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string }) {
  return (
    <button type={type} aria-label={ariaLabel} onClick={onClick}>
      {ariaLabel}
    </button>
  );
}

export function Input({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  onChangeValue,
}: {
  id?: string;
  label?: ReactNode;
  type?: string;
  value?: string;
  placeholder?: string;
  onChangeValue?: (value: string) => void;
}) {
  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChangeValue?.(event.target.value);
        }}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  options = [],
  onValueChange,
}: {
  label?: ReactNode;
  value?: string | null;
  options?: Array<{ value: string; label: string }>;
  onValueChange?: (value: string) => void;
}) {
  const fieldLabel = typeof label === 'string' ? label : undefined;

  return (
    <label>
      {label}
      <select
        aria-label={fieldLabel}
        value={value ?? ''}
        onChange={(event) => {
          onValueChange?.(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Badge({
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & ChildrenProps) {
  return <span {...props}>{children}</span>;
}

export function Spinner({
  label = 'Loading...',
  showLabel = false,
}: {
  label?: string;
  showLabel?: boolean;
}) {
  return showLabel ? <span>{label}</span> : <span aria-hidden="true" />;
}

export function Links({
  children,
  href,
  target,
  rel,
}: ChildrenProps & { href?: string; target?: string; rel?: string }) {
  return (
    <a href={href} target={target} rel={rel}>
      {children}
    </a>
  );
}

export function Checkbox({
  label,
  checked = false,
  onCheckedChange,
  'aria-label': ariaLabel,
  indeterminate = false,
  disabled = false,
}: {
  label?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
  indeterminate?: boolean;
  disabled?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        type="checkbox"
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : checked}
        onChange={(event) => {
          onCheckedChange?.(event.target.checked);
        }}
      />
    </label>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeButtonLabel = 'Fechar',
  'aria-label': ariaLabel,
}: ChildrenProps & {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  closeButtonLabel?: string;
  'aria-label'?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
    >
      <h2>{title}</h2>
      <button type="button" aria-label={closeButtonLabel} onClick={onClose}>
        {closeButtonLabel}
      </button>
      {children}
      {footer}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  closeButtonLabel = 'Fechar',
}: ChildrenProps & {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  closeButtonLabel?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true">
      <h2>{title}</h2>
      <button type="button" aria-label={closeButtonLabel} onClick={onClose}>
        {closeButtonLabel}
      </button>
      {children}
      {footer}
    </div>
  );
}

function AlertRoot({
  children,
  role,
}: ChildrenProps & { role?: string }) {
  return <div role={role}>{children}</div>;
}

function AlertSlot({ children }: ChildrenProps) {
  return <div>{children}</div>;
}

function AlertTitle({ children }: ChildrenProps) {
  return <h4>{children}</h4>;
}

function AlertDescription({ children }: ChildrenProps) {
  return <p>{children}</p>;
}

export const AlertV2 = {
  Root: AlertRoot,
  Icon: AlertSlot,
  Content: AlertSlot,
  Header: AlertSlot,
  Title: AlertTitle,
  Subtitle: AlertSlot,
  Description: AlertDescription,
  Actions: AlertSlot,
  Close: AlertSlot,
};
