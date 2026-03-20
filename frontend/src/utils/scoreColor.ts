export function scoreColorClass(color: string) {
  switch (color) {
    case "green":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "orange":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "red":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
