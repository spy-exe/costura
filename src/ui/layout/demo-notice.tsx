import { copy } from "@/ui/copy";

export function DemoNotice({ text = copy.demoNotice }: { text?: string }) {
  return (
    <div className="bg-notice text-notice-ink" data-testid="demo-notice">
      <p className="wrap py-2 text-center text-[0.8125rem] leading-snug">{text}</p>
    </div>
  );
}
