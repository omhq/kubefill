import { Typography, Box, styled, Breadcrumbs, useTheme, useMediaQuery, Icon } from "@mui/material";
import { truncate } from "lodash";
import { FunctionComponent, ReactElement } from "react";
import { Link } from "react-router-dom";

const CrumbText = styled(Typography)`
  font-size: 12px;
  padding: 0;
  margin: 0;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  font-size: 12px;

  &:hover {
    text-decoration: underline;
  }
`;

export interface ICrumb {
  label: string;
  path: string;
  current: boolean;
  icon?: string;
}

export interface ICrumbsProps {
  crumbs: ICrumb[];
}

export const Crumbs: FunctionComponent<ICrumbsProps> = (props: ICrumbsProps): ReactElement => {
  const { crumbs } = props;
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const renderCrumb = (crumb: ICrumb) => {
    if (smallScreen) {
      if (crumb.icon) {
        return (
          <Icon sx={{ mt: 0.7 }} fontSize="small">
            {crumb.icon}
          </Icon>
        );
      }
      return truncate(crumb.label, {
        length: 12,
      });
    }
    return crumb.label;
  };

  return (
    <div role="presentation">
      <Box maxWidth="lg">
        {crumbs.length > 0 && (
          <Breadcrumbs aria-label="breadcrumb">
            {crumbs.slice(0, -1).map((crumb, index) => (
              <StyledLink key={index} to={crumb.path}>
                {renderCrumb(crumb)}
              </StyledLink>
            ))}
            <CrumbText color={crumbs[crumbs.length - 1].current ? "text.primary" : ""}>
              {renderCrumb(crumbs[crumbs.length - 1])}
            </CrumbText>
          </Breadcrumbs>
        )}
      </Box>
    </div>
  );
};
