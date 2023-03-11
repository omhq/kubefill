import { CircularProgress, Icon, IconButton, styled } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export interface ILoadingActionIconProps {
  loading: boolean;
  onClick: () => void;
  icon: string;
}

const ActionsContainer = styled("div")`
  padding: 5px 7px;
  display: flex;
  align-items: center;
`;

export const LoadingActionIcon: FunctionComponent<ILoadingActionIconProps> = (
  props: ILoadingActionIconProps
): ReactElement => {
  const { loading, onClick, icon } = props;
  return (
    <>
      {!loading && (
        <IconButton size="small" disabled={loading} onClick={onClick}>
          <Icon fontSize="small">{icon}</Icon>
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
