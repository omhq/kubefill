import { styled } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { ReactElement } from "react";

const Title = styled(Typography)`
  font-size: 14px;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export const TitleFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: TitleFieldProps<T, S, F>
): ReactElement => {
  const { id, title } = props;

  return (
    <Title id={id} variant="h5">
      {title}
    </Title>
  );
};
