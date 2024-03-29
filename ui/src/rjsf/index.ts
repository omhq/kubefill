import { generateTemplates, generateWidgets } from "@rjsf/mui";
import { ArrayFieldItemTemplate } from "./ArrayFieldItemTemplate";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";
import { ArrayFieldTitleTemplate } from "./ArrayFieldTitleTemplate";
import { BaseInputTemplate } from "./BaseInputTemplate";
import { DescriptionFieldTemplate } from "./DescriptionFieldTemplate";
import { FieldTemplate } from "./FieldTemplate";
import { AddButton, MoveDownButton, MoveUpButton, RemoveButton } from "./IconButtons";
import { ObjectFieldTemplate } from "./ObjectFieldTemplate";
import { TitleFieldTemplate } from "./TitleFieldTemplate";

const originalWidgets = generateWidgets();
const originalTemplate = generateTemplates();

export const getWidgets = () => ({
  ...originalWidgets,
});

export const getTemplates = () => ({
  ...originalTemplate,
  ArrayFieldTitleTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
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
