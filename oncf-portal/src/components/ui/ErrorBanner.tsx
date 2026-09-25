interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message = 'Erreur de chargement des données.', onRetry }: Readonly<Props>) {
  return (
    <div className="error-banner">
      <span className="error-banner__message">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="error-banner__retry">
          Réessayer
        </button>
      )}
    </div>
  );
}
