import { darken, AppBar, Toolbar, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";

const StyledAppBar = styled(AppBar)`
  background-color: ${({ theme }) => darken(theme.palette.background.paper, 0.03)};
  color: ${({ theme }) => theme.palette.getContrastText(theme.palette.background.paper)};
`;

const StyledToolbar = styled(Toolbar)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => `
    ${theme.breakpoints.down("md")} {
      margin: 0px;
    }
  `}
`;

export interface IWorkspaceNavBarProps {
  children?: ReactNode;
}

export const WorkspaceNavBar: FunctionComponent<IWorkspaceNavBarProps> = (
  props: IWorkspaceNavBarProps
): ReactElement => {
  const { children } = props;
  return (
    <StyledAppBar position="static" elevation={0}>
      <StyledToolbar>{children}</StyledToolbar>
    </StyledAppBar>
  );
};
