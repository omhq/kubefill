import { useEffect } from "react";
import { Box, FormHelperText, TextField } from "@mui/material";
import { FormikValues, useFormik } from "formik";
import { CreateValidationSchema, UpdateValidationSchema } from "./ValidationSchemas";
import { SecretCreate } from "../types";

type SecretFormParams = {
  secretId: number;
  initialValues: SecretCreate;
  formValid: (valid: boolean) => void;
  handleValueUpdate: (values: FormikValues) => void;
};

const SecretForm = ({
  secretId,
  initialValues,
  formValid,
  handleValueUpdate,
}: SecretFormParams) => {
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validateOnMount: true,
    validationSchema: secretId ? UpdateValidationSchema : CreateValidationSchema,
    onSubmit: async () => null,
  });

  useEffect(() => {
    if (Object.keys(formik.errors).length) {
      formValid(false);
    } else {
      formValid(true);
    }
  }, [formik.errors, formValid]);

  useEffect(() => {
    handleValueUpdate(formik.values);
  }, [formik.values, handleValueUpdate]);

  return (
    <Box component="form" noValidate autoComplete="off">
      <Box sx={{ mb: 2 }}>
        <TextField
          required={true}
          fullWidth={true}
          error={!!formik.touched?.name && !!formik.errors?.name}
          id="name"
          name="name"
          label="Name"
          value={formik.values?.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched?.name && formik.errors?.name && (
          <FormHelperText id="name-error-text">
            <>{formik.errors?.name}</>
          </FormHelperText>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth={true}
          required={true}
          error={!!formik.touched?.value && !!formik.errors?.value}
          id="value"
          name="value"
          label="Value"
          defaultValue=""
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched?.value && formik.errors?.value && (
          <FormHelperText id="value-error-text">
            <>{formik.errors?.value}</>
          </FormHelperText>
        )}
      </Box>
    </Box>
  );
};

export default SecretForm;
