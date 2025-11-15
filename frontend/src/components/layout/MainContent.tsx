import { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="h-full">{children}</div>
    </main>
  );
}
