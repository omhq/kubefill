import { TextFieldProps, TextField as MuiTextField, styled } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export type TTextFieldProps = TextFieldProps & {};

export const TextField: FunctionComponent<TTextFieldProps> = (
  props: TTextFieldProps
): ReactElement => {
  const { ...otherProps } = props;

  return (
    <MuiTextField
      InputLabelProps={{ shrink: true }}
      size="small"
      variant="outlined"
      {...otherProps}
    />
  );
};
