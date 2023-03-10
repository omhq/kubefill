import { TextFieldProps, TextField as MuiTextField } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export type TTextFieldProps = TextFieldProps & {};

export const TextField: FunctionComponent<TTextFieldProps> = (
  props: TTextFieldProps
): ReactElement => {
  const { ...otherProps } = props;

  return <MuiTextField size="small" variant="outlined" {...otherProps} />;
};
