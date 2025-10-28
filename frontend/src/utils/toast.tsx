import { toast as reactToastify } from 'react-toastify';

interface ErrorToastProps {
  message: string;
}

function ErrorToastContent({ message }: ErrorToastProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    reactToastify.success('Error message copied to clipboard', { autoClose: 2000 });
  };

  return (
    <div
      onClick={handleCopy}
      className="cursor-pointer hover:opacity-90 transition-opacity"
      title="Click to copy error message"
    >
      {message}
    </div>
  );
}

export const toast = {
  success: (message: string) => reactToastify.success(message),
  error: (message: string) => reactToastify.error(<ErrorToastContent message={message} />),
  info: (message: string) => reactToastify.info(message),
  warning: (message: string) => reactToastify.warning(message),
};
