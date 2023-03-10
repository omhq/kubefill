import { Button, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useScreenSize } from "../hooks";

const StyledLink = styled(Link)`
  text-decoration: none;
`;

interface IStyleButtonProps {
  selected: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (propName) => propName !== "selected",
})<IStyleButtonProps>`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  text-transform: none;

  background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};

  &:hover {
    background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};
  }
`;

export interface ILinkActionProps {
  to: string;
  children?: ReactNode;
  anchorStyle?: any;
  icon: string;
  selected?: boolean;
}

export const LinkAction: FunctionComponent<ILinkActionProps> = (
  props: ILinkActionProps
): ReactElement => {
  const { to, selected, anchorStyle, children, icon } = props;
  const size = useScreenSize();

  return (
    <>
      {size !== "sm" && (
        <StyledLink style={anchorStyle} to={to}>
          <StyledButton
            size="small"
            variant="outlined"
            style={{ ...anchorStyle }}
            selected={Boolean(selected)}
          >
            {children}
          </StyledButton>
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
