import { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { useCallback, useMemo, useState } from "react";
import { FormData } from "../types";
import { getTemplates, getWidgets } from "../rjsf";
import { Box } from "@mui/material";

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

  const sanitizedData = useMemo(() => {
    if (!props.defaultData.spec.template.spec.containers) {
      return props.defaultData;
    }
    // TODO: Don't directly update the received object!
    props.defaultData.spec.template.spec.containers =
      props.defaultData.spec.template.spec.containers.map((container: any) => ({
        ...container,
        env: container.env.map((item: any) => {
          if ("value" in item) {
            if (/{{secrets\.[a-zA-Z_][a-zA-Z0-9_]*}}/.test(item.value)) {
              return {
                name: item.name,
                value: "******",
              };
            }
            return item;
          }
          /* valueFrom should be sanitized. */
          return {
            name: item.name,
            value: "******",
          };
        }),
      }));
    return props.defaultData;
  }, [props.defaultData]);

  return (
    <Box mt={2}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={sanitizedData}
        validator={validator}
        onChange={handleOnChange}
        onError={log("errors")}
        showErrorList={false}
        liveValidate
        widgets={widgets}
        templates={templates}
      >
        <></>
      </Form>
    </Box>
  );
};

export default ApplicationForm;
