import { CircularProgress, Icon, IconButton } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export interface ILoadingActionIconProps {
  loading: boolean;
  onClick: () => void;
  icon: string;
}

export const LoadingActionIcon: FunctionComponent<ILoadingActionIconProps> = (
  props: ILoadingActionIconProps
): ReactElement => {
  const { loading, onClick, icon } = props;
  return (
    <>
      {!loading && (
        <IconButton disabled={loading} onClick={onClick}>
          <Icon fontSize="small">{icon}</Icon>
        </IconButton>
      )}
      {loading && <CircularProgress size={16} />}
    </>
  );
};
