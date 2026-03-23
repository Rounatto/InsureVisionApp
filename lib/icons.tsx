import type { LucideProps } from 'lucide-react';
import {
  Mail,
  Lock,
  User,
  Shield,
  CircleCheck,
  Clock3,
  House,
  Settings,
  MessageSquare,
} from 'lucide-react';

type IconProps = LucideProps;

export function EmailIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <Mail className={className} {...props} />;
}

export function LockIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <Lock className={className} {...props} />;
}

export function UserIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <User className={className} {...props} />;
}

export function ShieldIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <Shield className={className} {...props} />;
}

export function CheckCircleIcon({
  className = 'w-8 h-8',
  ...props
}: IconProps) {
  return <CircleCheck className={className} {...props} />;
}

export function ClockIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <Clock3 className={className} {...props} />;
}

export function HomeIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <House className={className} {...props} />;
}

export function SettingsIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <Settings className={className} {...props} />;
}

export function MessageIcon({
  className = 'w-[18px] h-[18px]',
  ...props
}: IconProps) {
  return <MessageSquare className={className} {...props} />;
}

/* ── Google coloured logo ────────────────────────────────── */

export function GoogleLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.3 7.3l6.3 5.2C39 37.2 44 31.2 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
