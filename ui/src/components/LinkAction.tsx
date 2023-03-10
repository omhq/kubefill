import { Button, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useScreenSize } from "../hooks";

const Root = styled(Button)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  text-transform: none;

  & a {
    color: inherit;
    text-decoration: none;
  }
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
        <Root size="small" variant="outlined">
          <Link style={anchorStyle} to={to}>
            {children}
          </Link>
        </Root>
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
