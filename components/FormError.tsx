interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 text-center">{message}</p>;
}
