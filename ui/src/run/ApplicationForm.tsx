import { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { useCallback, useState } from "react";
import { FormData } from "../types";
import { getTemplates, getWidgets } from "../rjsf";

export interface IApplicationForm {
  defaultData: any;
  schema: any;
  uiSchema: any;
  handleFormChange: (data: FormData) => void;
}

const templates = getTemplates();
const widgets = getWidgets();

const ApplicationForm = (props: IApplicationForm) => {
  const { defaultData, schema, uiSchema, handleFormChange } = props;
  const [data, setData] = useState<FormData>(defaultData);

  const handleOnChange = useCallback(
    (data: IChangeEvent) => {
      setData(data.formData);
      handleFormChange(data.formData);
    },
    [handleFormChange]
  );

  const log = (type: string) => console.log.bind(console, type);

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={data}
      validator={validator}
      onChange={handleOnChange}
      onError={log("errors")}
      showErrorList={false}
      liveValidate
      widgets={widgets}
      templates={templates}
    />
  );
};

export default ApplicationForm;
