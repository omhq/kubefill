import { CircularProgress, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export interface ILoadingActionIconProps {
  loading: boolean;
  onClick: () => void;
  icon: string;
  iconColor?: string;
  iconButtonSize?: "small" | "medium" | "large" | undefined;
  iconSize?: "small" | "inherit" | "medium" | "large" | undefined;
}

const ActionsContainer = styled("div")`
  padding: 5px 7px;
  display: flex;
  align-items: center;
`;

const StyledIcon = styled(Icon)`
  font-display: block;
`;

export const LoadingActionIcon: FunctionComponent<ILoadingActionIconProps> = (
  props: ILoadingActionIconProps
): ReactElement => {
  const { loading, onClick, icon, iconColor } = props;
  const iconButtonSize = props.iconButtonSize || "small";
  const iconSize = props.iconSize || "small";

  return (
    <>
      {!loading && (
        <IconButton size={iconButtonSize} disabled={loading} onClick={onClick}>
          <StyledIcon fontSize={iconSize} style={{ color: iconColor }}>
            {icon}
          </StyledIcon>
        </IconButton>
      )}
      {loading && (
        <ActionsContainer>
          <CircularProgress size={16} />
        </ActionsContainer>
      )}
    </>
  );
};
