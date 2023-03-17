import { CSSProperties, ReactElement } from "react";
import Grid from "@mui/material/Grid";
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { styled } from "@mui/material";

const GridContainer = styled(Grid)`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const GridItem = styled(Grid)`
  overflow: auto;
  display: flex;
  flex-direction: row;
  column-gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing(1)};
`;

const ActionsGrid = styled(Grid)`
  display: flex;
  flex-direction: row;
  column-gap: ${({ theme }) => theme.spacing(1)};
`;

const Content = styled("div")`
  flex-grow: 1;
`;

const btnStyle: CSSProperties = {
  flex: 1,
  fontWeight: "bold",
  minWidth: 0,
};

/** The `ArrayFieldItemTemplate` component is the template used to render an
 * item of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component.
 */
export const ArrayFieldItemTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: ArrayFieldTemplateItemType<T, S, F>
): ReactElement => {
  const {
    children,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
    uiSchema,
    registry,
  } = props;
  const { MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;

  return (
    <GridContainer container={true} alignItems="center">
      <GridItem item={true} xs={true}>
        <Content>{children}</Content>

        {hasToolbar && (
          <ActionsGrid item={true}>
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                style={btnStyle}
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </ActionsGrid>
        )}
      </GridItem>
    </GridContainer>
  );
};
