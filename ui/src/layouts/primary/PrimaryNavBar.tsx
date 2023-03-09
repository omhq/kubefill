import { AppBar, Box, Toolbar, styled, useTheme } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";
import { Link } from "react-router-dom";
import { Actions, LinkAction } from "../../components";

const StyledSvg = styled("svg")`
  width: 32px;
  height: 32px;
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

const StyledToolbar = styled(Toolbar)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const PrimaryNavBar: FunctionComponent = (): ReactElement => {
  const theme = useTheme();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <StyledToolbar>
          <Link to="/">
            <StyledSvg
              width="270"
              height="270"
              viewBox="0 0 270 270"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M26.0711 110.924C22.1658 107.019 22.1658 100.687 26.0711 96.7817L96.7817 26.071C100.687 22.1658 107.019 22.1658 110.924 26.071L144.866 60.0132C148.771 63.9184 148.771 70.2501 144.866 74.1553L74.1554 144.866C70.2501 148.771 63.9185 148.771 60.0132 144.866L26.0711 110.924Z"
                fill="#2697EC"
              />
              <rect
                x="118.736"
                y="109.654"
                width="120"
                height="68.0015"
                rx="10"
                transform="rotate(-45 118.736 109.654)"
                fill="#F38432"
              />
              <rect
                x="27.3326"
                y="202.095"
                width="120"
                height="68.0015"
                rx="10"
                transform="rotate(-45 27.3326 202.095)"
                fill="#2E6DE5"
              />
            </StyledSvg>
          </Link>
          <Actions>
            <LinkAction
              anchorStyle={{ color: theme.palette.primary.contrastText }}
              to="/applications"
            >
              Applications
            </LinkAction>
            <LinkAction anchorStyle={{ color: theme.palette.primary.contrastText }} to="/repos">
              Repos
            </LinkAction>
            <LinkAction anchorStyle={{ color: theme.palette.primary.contrastText }} to="/settings">
              Settings
            </LinkAction>
          </Actions>
        </StyledToolbar>
      </AppBar>
    </Box>
  );
};
