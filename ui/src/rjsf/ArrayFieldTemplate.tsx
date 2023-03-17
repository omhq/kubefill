import { styled } from "@mui/material";
import { Box, Grid } from "@mui/material";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { ReactElement } from "react";

const GridContainer = styled(Grid)`
  display: flex;
  flex-direction: column;
`;

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export const ArrayFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: ArrayFieldTemplateProps<T, S, F>
): ReactElement => {
  const {
    canAdd,
    disabled,
    idSchema,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<"ArrayFieldDescriptionTemplate", T, S, F>(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate", T, S, F>(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate", T, S, F>(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );

  /* Button templates are not overridden in the uiSchema */
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  return (
    <Box>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        idSchema={idSchema}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <GridContainer container={true} key={`array-item-list-${idSchema.$id}`}>
        {items &&
          items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
          ))}
        {canAdd && (
          <Grid container={true} justifyContent="flex-end">
            <Grid item={true}>
              <AddButton
                className="array-item-add"
                onClick={onAddClick}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        )}
      </GridContainer>
    </Box>
  );
};
