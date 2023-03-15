import { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { useState } from "react";
import { TextField } from "../components";
import { FormData } from "../types";

const ApplicationForm = ({
  defaultData,
  schema,
  uiSchema,
  handleFormChange,
}: {
  defaultData: any;
  schema: any;
  uiSchema: any;
  handleFormChange: (data: FormData) => void;
}) => {
  const [data, setData] = useState<FormData>(defaultData);
  const handleOnChange = (data: IChangeEvent) => {
    setData(data.formData);
    handleFormChange(data.formData);
  };

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
      widgets={{ TextWidget: TextField as any }}
    />
  );
};

export default ApplicationForm;
