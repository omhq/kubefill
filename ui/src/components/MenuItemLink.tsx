import { MenuItem, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";

const StyledLink = styled(Link)`
  width: 100%;
  text-decoration: none;
  color: inherit;
`;

export interface IMenuItemLinkProps {
  to: string;
  children?: ReactNode;
}

export const MenuItemLink: FunctionComponent<IMenuItemLinkProps> = (
  props: IMenuItemLinkProps
): ReactElement => {
  const { to, children } = props;

  return (
    <MenuItem>
      <StyledLink to={to}>{children}</StyledLink>
    </MenuItem>
  );
};
