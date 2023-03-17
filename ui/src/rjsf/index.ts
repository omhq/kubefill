import { generateTemplates, generateWidgets } from "@rjsf/mui";
import { TextField } from "../components";
import { ArrayFieldItemTemplate } from "./ArrayFieldItemTemplate";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";
import { ArrayFieldTitleTemplate } from "./ArrayFieldTitleTemplate";
import { DescriptionFieldTemplate } from "./DescriptionFieldTemplate";
import { FieldTemplate } from "./FieldTemplate";
import { AddButton, MoveDownButton, MoveUpButton, RemoveButton } from "./IconButtons";
import { ObjectFieldTemplate } from "./ObjectFieldTemplate";
import { TitleFieldTemplate } from "./TitleFieldTemplate";

const originalWidgets = generateWidgets();
const originalTemplate = generateTemplates();

export const getWidgets = () => ({
  ...originalWidgets,
  TextWidget: TextField as any,
});

export const getTemplates = () => ({
  ...originalTemplate,
  ArrayFieldTitleTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  FieldTemplate,
  DescriptionFieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate,
  ButtonTemplates: {
    AddButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    SubmitButton: originalTemplate.ButtonTemplates?.SubmitButton,
  },
});
