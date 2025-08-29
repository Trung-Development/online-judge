import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert, AlertDescription } from "./ui/alert";
import {
  faCheck,
  faExclamationCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

export function OverlayWarning({ message }: { message: string }) {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <Alert variant="warning" className="mb-6">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </main>
  );
}

export function OverlayError({ message }: { message: string }) {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <Alert variant="destructive" className="mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </main>
  );
}

export function ErrorAlert({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function WarningAlert({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <Alert variant="warning" className={className}>
      <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function SuccessAlert({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <Alert variant="success" className={className}>
      <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
