import { copy } from "@/ui/copy";

export function DemoNotice() {
  return (
    <div className="bg-notice text-notice-ink" data-testid="demo-notice">
      <p className="wrap py-2 text-center text-[0.8125rem] leading-snug">{copy.demoNotice}</p>
    </div>
  );
}
