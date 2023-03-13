import { Button, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";

const StyledLink = styled(Link)`
  text-decoration: none;
`;

interface IStyledIconButtonProps {
  selected: boolean;
}

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (propName) => propName !== "selected",
})<IStyledIconButtonProps>`
  background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};

  &:hover {
    background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};
  }
`;

interface IStyledButtonProps {
  selected: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (propName) => propName !== "selected",
})<IStyledButtonProps>`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  text-transform: none;

  background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};

  &:hover {
    background-color: ${({ selected }) => (selected ? "#ffffff28" : undefined)};
  }
`;

const StyledIcon = styled(Icon)`
  font-display: block;
`;

export interface ILinkActionProps {
  to: string;
  children?: ReactNode;
  anchorStyle?: any;
  icon?: string;
  selected?: boolean;
  iconColor?: string;
}

export const LinkAction: FunctionComponent<ILinkActionProps> = (
  props: ILinkActionProps
): ReactElement => {
  const { to, selected, anchorStyle, children, icon, iconColor } = props;

  return (
    <>
      {!icon ? (
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
      ) : (
        <Link style={{ color: "unset", ...anchorStyle }} to={to}>
          <StyledIconButton color="inherit" size="small" selected={Boolean(selected)}>
            <StyledIcon fontSize="small" style={{ color: iconColor }}>
              {icon}
            </StyledIcon>
          </StyledIconButton>
        </Link>
      )}
    </>
  );
};
