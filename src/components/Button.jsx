import { twMerge } from "tailwind-merge";

export default function Button({ className, children, ...props }) {
  return (
    <button
      className={twMerge(
        "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}