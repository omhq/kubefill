import { styled, Typography } from "@mui/material";
import {
  ArrayFieldTitleProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from "@rjsf/utils";
import { FunctionComponent, ReactElement } from "react";

const Title = styled(Typography)`
  font-size: 14px;
  margin: 0px;
  padding: 0px;
  font-weight: 500;
`;

export const ArrayFieldTitleTemplate: FunctionComponent<ArrayFieldTitleProps> = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: ArrayFieldTitleProps<T, S, F>
): ReactElement => {
  const { title, idSchema } = props;
  const id = titleId(idSchema);

  return <Title id={id}>{title}</Title>;
};
