import { IconButton, IconButtonProps as MuiIconButtonProps } from "@mui/material";
import { ArrowDownward, ArrowUpward, Remove } from "@mui/icons-material";

import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils";
import { ReactElement } from "react";

export const MuiIconButton = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: IconButtonProps<T, S, F>
): ReactElement => {
  const { icon, color, uiSchema, registry, ...otherProps } = props;
  return (
    <IconButton {...otherProps} size="small" color={color as MuiIconButtonProps["color"]}>
      {icon}
    </IconButton>
  );
};

export const MoveDownButton = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: IconButtonProps<T, S, F>
): ReactElement => {
  const {
    registry: { translateString },
  } = props;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ArrowDownward fontSize="small" />}
    />
  );
};

export const MoveUpButton = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: IconButtonProps<T, S, F>
): ReactElement => {
  const {
    registry: { translateString },
  } = props;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ArrowUpward fontSize="small" />}
    />
  );
};

export const RemoveButton = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: IconButtonProps<T, S, F>
) => {
  const { iconType, ...otherProps } = props;
  const {
    registry: { translateString },
  } = otherProps;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...otherProps}
      color="error"
      icon={<Remove fontSize={iconType === "default" ? undefined : "small"} />}
    />
  );
};
