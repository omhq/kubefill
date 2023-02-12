import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";

export type Crumb = {
  label: string;
  path: string;
  current: boolean;
};

export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div role="presentation">
      <Box sx={{ mt: 8 }} maxWidth="lg">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
            {crumbs.slice(0, -1).map((crumb, index) => (
              <Link key={index} underline="hover" color="inherit" href={crumb.path}>
                {crumb.label}
              </Link>
            ))}
            <Typography color={crumbs[crumbs.length - 1].current ? "text.primary" : ""}>
              {crumbs[crumbs.length - 1].label}
            </Typography>
          </Breadcrumbs>
        )}
      </Box>
    </div>
  );
}
