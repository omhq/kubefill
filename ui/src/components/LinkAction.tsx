import { Button, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useScreenSize } from "../hooks";

const StyledLink = styled(Link)`
  text-decoration: none;
`;

const Root = styled(Button)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  text-transform: none;
`;

export interface ILinkActionProps {
  to: string;
  children?: ReactNode;
  anchorStyle?: any;
  icon: string;
}

export const LinkAction: FunctionComponent<ILinkActionProps> = (
  props: ILinkActionProps
): ReactElement => {
  const { to, anchorStyle, children, icon } = props;
  const size = useScreenSize();

  return (
    <>
      {size !== "sm" && (
        <StyledLink style={anchorStyle} to={to}>
          <Root size="small" variant="outlined" style={anchorStyle}>
            {children}
          </Root>
        </StyledLink>
      )}
      {size === "sm" && (
        <Link style={{ color: "unset", ...anchorStyle }} to={to}>
          <IconButton color="inherit" size="small">
            <Icon fontSize="small">{icon}</Icon>
          </IconButton>
        </Link>
      )}
    </>
  );
};
