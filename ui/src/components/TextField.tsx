import { TextFieldProps, TextField as MuiTextField } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";

export type TTextFieldProps = TextFieldProps & {};

export const TextField: FunctionComponent<TTextFieldProps> = (
  props: TTextFieldProps
): ReactElement => {
  const {
    id,
    disabled,
    label,
    name,
    size = "small",
    onBlur,
    onChange,
    onFocus,
    placeholder,
    required,
    value,
    fullWidth,
    multiline,
    rows,
    error,
    type,
  } = props;

  return (
    <MuiTextField
      InputLabelProps={{ shrink: true, style: { fontSize: 13 } }}
      InputProps={{ style: { fontSize: 13 } }}
      size="small"
      variant="outlined"
      disabled={disabled}
      id={id}
      label={label}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      required={required}
      value={value}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      error={error}
      type={type}
    />
  );
};
