import bptAsset from "@/assets/bpt-logo.png.asset.json";
import flowsyncAsset from "@/assets/flowsync-logo.png.asset.json";

export function BptLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={bptAsset.url}
      alt="BPT - The Bullets Stop Here"
      className={`h-9 w-auto object-contain ${className}`}
    />
  );
}

export function FlowSyncLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={flowsyncAsset.url}
      alt="FlowSync - Move Forward. Together."
      className={`h-10 w-auto object-contain ${className}`}
    />
  );
}