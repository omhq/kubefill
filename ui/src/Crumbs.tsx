import { Typography, Box, styled, Breadcrumbs } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";
import { Link } from "react-router-dom";

const CrumbText = styled(Typography)`
  font-size: 14px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

export interface ICrumb {
  label: string;
  path: string;
  current: boolean;
}

export interface ICrumbsProps {
  crumbs: ICrumb[];
}

export const Crumbs: FunctionComponent<ICrumbsProps> = (props: ICrumbsProps): ReactElement => {
  const { crumbs } = props;
  return (
    <div role="presentation">
      <Box maxWidth="lg">
        {crumbs.length > 0 && (
          <Breadcrumbs aria-label="breadcrumb">
            {crumbs.slice(0, -1).map((crumb, index) => (
              <StyledLink key={index} to={crumb.path}>
                {crumb.label}
              </StyledLink>
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
