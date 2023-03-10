import { useTheme, useMediaQuery } from "@mui/material";

export type TScreenSize = "sm" | "md" | "lg" | "xl";

export const useScreenSize = (): TScreenSize => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const md = useMediaQuery(theme.breakpoints.down("md"));
  const lg = useMediaQuery(theme.breakpoints.down("lg"));
  const xl = useMediaQuery(theme.breakpoints.down("xl"));

  const size = (sm && "sm") || (md && "md") || (lg && "lg") || (xl && "xl");

  if (!size) {
    throw new Error("Unknown screen size detected!");
  }

  return size;
};
