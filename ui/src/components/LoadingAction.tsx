import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { styled } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";
import { LoadingActionIcon } from "./LoadingActionIcon";

const Root = styled(LoadingButton)`
  text-transform: none;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
`;

export interface ILoadingActionProps extends LoadingButtonProps {
  icon?: string;
  lgOnly?: boolean;
  iconColor?: string;
}

export const LoadingAction: FunctionComponent<ILoadingActionProps> = (
  props: ILoadingActionProps
): ReactElement => {
  const { children, icon, iconColor, ...otherProps } = props;

  return (
    <>
      {icon ? (
        <LoadingActionIcon
          icon={icon}
          onClick={otherProps.onClick as () => void}
          loading={Boolean(otherProps.loading)}
          iconColor={iconColor}
        />
      ) : (
        <Root
          size="small"
          variant="outlined"
          disabled={"disabled" in otherProps ? otherProps.disabled : otherProps.loading}
          {...otherProps}
        >
          {children}
        </Root>
      )}
    </>
  );
};
