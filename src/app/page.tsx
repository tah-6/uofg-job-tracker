import UofGJobTracker from "@/components/tracker/UofGJobTracker";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <UofGJobTracker />
    </ErrorBoundary>
  );
}
