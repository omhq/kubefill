import { styled } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from "@rjsf/utils";
import { ReactElement } from "react";

const Hidden = styled("div")`
  display: none;
`;

/** The `FieldTemplate` component is the template used by `SchemaField` to
 * render any field. It renders the field content, (label, description, children,
 * errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export const FieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: FieldTemplateProps<T, S, F>
): ReactElement => {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    rawErrors = [],
    errors,
    help,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate", T, S, F>(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );

  if (hidden) {
    return <Hidden>{children}</Hidden>;
  }

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <FormControl fullWidth={true} error={Boolean(rawErrors.length)} required={required}>
        {children}
        {displayLabel && rawDescription && (
          <Typography variant="caption" color="textSecondary">
            {rawDescription}
          </Typography>
        )}
        {errors}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
};
