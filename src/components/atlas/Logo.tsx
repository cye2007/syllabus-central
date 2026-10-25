import logo from "@/assets/syllaview-logo.png";
import icon from "@/assets/syllaview-icon.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return compact ? (
    <img src={icon} alt="SyllaView" width={340} height={376} className="h-7 w-auto rounded-none" />
  ) : (
    <img src={logo} alt="SyllaView" width={1396} height={376} className="h-7 w-auto rounded-none" />
  );
}
