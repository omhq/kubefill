import { Button, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";

const Root = styled(Button)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};

  & a {
    color: inherit;
    text-decoration: none;
  }
`;

export interface ILinkActionProps {
  to: string;
  children?: ReactNode;
  anchorStyle?: any;
}

export const LinkAction: FunctionComponent<ILinkActionProps> = (
  props: ILinkActionProps
): ReactElement => {
  const { to, anchorStyle, children } = props;
  return (
    <Root size="small" variant="outlined">
      <Link style={anchorStyle} to={to}>
        {children}
      </Link>
    </Root>
  );
};
