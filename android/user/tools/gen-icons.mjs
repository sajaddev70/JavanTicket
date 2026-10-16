// Generates LucideIcons.kt (path data of the lucide icons the web user site imports) for the Android app.
// Usage: node gen-icons.mjs <lucide-react esm dir> <output .kt>
import fs from "node:fs";
import path from "node:path";

const [, , esmDir, out] = process.argv;
const NAMES = "Armchair ArrowLeft ArrowRight ArrowUpDown Banknote BarChart3 Building2 CalendarDays CalendarPlus CalendarX2 Check ChevronDown ChevronLeft ChevronRight CircleAlert CircleCheck CircleHelp CircleX Clock Copy CreditCard Crosshair Heart Home Hourglass House Images Info Landmark Layers LayoutGrid List Loader2 Lock LogIn LogOut Mail MapPin Menu Mic Minus Moon Pencil Percent Phone Plus Printer Receipt ReceiptText RefreshCw RotateCcw Save ScanLine Search Send Share2 ShieldCheck ShoppingCart SlidersHorizontal Smartphone Sparkles Sun Tag Ticket TimerOff TriangleAlert Undo2 UserPlus UserRound Users WifiOff X".split(" ");

const index = fs.readFileSync(path.join(esmDir, "lucide-react.mjs"), "utf8");
function fileOf(name) {
  for (const line of index.split("\n")) {
    const m = line.match(/^export \{ (.+) \} from '\.\/icons\/(.+)\.mjs';$/);
    if (m && m[1].split(", ").some((p) => p === `default as ${name}`)) return m[2];
  }
  throw new Error(`no icon ${name}`);
}

const n = (v) => Number(v);
function toPath(tag, a) {
  switch (tag) {
    case "path":
      return a.d;
    case "circle":
      return `M${n(a.cx) - n(a.r)} ${a.cy}a${a.r} ${a.r} 0 1 0 ${2 * n(a.r)} 0a${a.r} ${a.r} 0 1 0 ${-2 * n(a.r)} 0`;
    case "ellipse":
      return `M${n(a.cx) - n(a.rx)} ${a.cy}a${a.rx} ${a.ry} 0 1 0 ${2 * n(a.rx)} 0a${a.rx} ${a.ry} 0 1 0 ${-2 * n(a.rx)} 0`;
    case "line":
      return `M${a.x1} ${a.y1}L${a.x2} ${a.y2}`;
    case "polyline":
    case "polygon": {
      const pts = a.points.trim().split(/[\s,]+/);
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      return tag === "polygon" ? d + "Z" : d;
    }
    case "rect": {
      const x = n(a.x ?? 0), y = n(a.y ?? 0), w = n(a.width), h = n(a.height);
      const rx = Math.min(n(a.rx ?? a.ry ?? 0), w / 2), ry = Math.min(n(a.ry ?? a.rx ?? 0), h / 2);
      if (!rx) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + rx} ${y}h${w - 2 * rx}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${h - 2 * ry}a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${-(w - 2 * rx)}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}v${-(h - 2 * ry)}a${rx} ${ry} 0 0 1 ${rx} ${-ry}Z`;
    }
    default:
      throw new Error(`unsupported ${tag}`);
  }
}

const entries = [];
for (const name of NAMES) {
  const src = fs.readFileSync(path.join(esmDir, "icons", `${fileOf(name)}.mjs`), "utf8");
  const start = src.indexOf("const __iconData = ") + "const __iconData = ".length;
  // __iconData is plain JS data ({ name, size, node: [[tag, attrs], ...], aliases? }); evaluate it in isolation.
  const elements = Function(`"use strict"; return (${src.slice(start, src.indexOf("\n};", start) + 2)});`)().node;
  const paths = elements.map(([tag, attrs]) => toPath(tag, attrs));
  entries.push({ name, file: fileOf(name), paths });
}

const kt = `package com.devs.nisha_user.core.designsystem.icon

// GENERATED from lucide-react ${JSON.parse(fs.readFileSync(path.join(esmDir, "../../package.json"), "utf8")).version} (ISC license) by gen-icons.mjs:
// the same stroke icons the web user site imports, as SVG path data on a 24×24 grid. Do not edit by hand.

/** Path data of one lucide icon (stroke icons: round caps and joins, no fill). */
class LucidePaths internal constructor(val name: String, val paths: List<String>)

object Lucide {
${entries.map((e) => `    /** lucide "${e.file}" */\n    val ${e.name} = LucidePaths("${e.file}", listOf(${e.paths.map((p) => JSON.stringify(p)).join(", ")}))`).join("\n")}
}
`;
fs.writeFileSync(out, kt);
console.log(`wrote ${entries.length} icons to ${out}`);
