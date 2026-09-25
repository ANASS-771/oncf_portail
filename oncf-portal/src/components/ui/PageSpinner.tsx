interface PageSpinnerProps {
  message?: string;
}

export default function PageSpinner({ message = 'Chargement...' }: Readonly<PageSpinnerProps>) {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{message}</span>
    </div>
  );
}
