import { styled } from "@mui/material";
import Typography from "@mui/material/Typography";
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { Fragment, ReactElement } from "react";

const Description = styled(Typography)`
  font-size: 12px;
  margin: ${({ theme }) => theme.spacing(2, 0)};
`;

/** The `DescriptionField` is the template to use to render the description of
 * a field.
 *
 * @param props - The `DescriptionFieldProps` for this component.
 */
export const DescriptionFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: DescriptionFieldProps<T, S, F>
): ReactElement => {
  const { id, description } = props;
  if (description) {
    return (
      <Description id={id} variant="subtitle2">
        {description}
      </Description>
    );
  }

  return <Fragment />;
};
