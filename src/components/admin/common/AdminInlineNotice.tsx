type AdminInlineNoticeProps = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

export function AdminInlineNotice({ tone, message }: AdminInlineNoticeProps) {
  return (
    <div className={`admin-inline-notice admin-inline-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message}
    </div>
  );
}
