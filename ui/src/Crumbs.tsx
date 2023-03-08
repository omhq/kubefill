import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import { Box, styled } from "@mui/material";

const CrumbText = styled(Typography)`
  font-size: 14px;
`;

export interface ICrumb {
  label: string;
  path: string;
  current: boolean;
}

export interface ICrumbsProps {
  crumbs: ICrumb[];
}

export const Crumbs = (props: ICrumbsProps) => {
  const { crumbs } = props;
  return (
    <div role="presentation">
      <Box maxWidth="lg">
        {crumbs.length > 0 && (
          <Breadcrumbs aria-label="breadcrumb">
            {crumbs.slice(0, -1).map((crumb, index) => (
              <Link key={index} underline="hover" color="inherit" href={crumb.path}>
                {crumb.label}
              </Link>
            ))}
            <CrumbText color={crumbs[crumbs.length - 1].current ? "text.primary" : ""}>
              {crumbs[crumbs.length - 1].label}
            </CrumbText>
          </Breadcrumbs>
        )}
      </Box>
    </div>
  );
};
