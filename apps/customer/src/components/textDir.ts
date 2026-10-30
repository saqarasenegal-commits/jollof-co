import type { Lang } from "@jollofco/core";
import type { TextStyle } from "react-native";

/** Right-to-left text for Arabic. */
export const textDir = (lang: Lang): TextStyle =>
  lang === "ar"
    ? { writingDirection: "rtl", textAlign: "right" }
    : { writingDirection: "ltr", textAlign: "left" };
