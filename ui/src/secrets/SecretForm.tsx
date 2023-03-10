import { useEffect } from "react";
import {
  Box,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
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
      <FormControl error={!!formik.touched?.name && !!formik.errors?.name} fullWidth sx={{ mb: 2 }}>
        <InputLabel htmlFor="name">Name</InputLabel>
        <OutlinedInput
          required
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
      </FormControl>

      <FormControl
        error={!!formik.touched?.value && !!formik.errors?.value}
        fullWidth
        sx={{ mb: 2 }}
      >
        <InputLabel htmlFor="name">Value</InputLabel>
        <OutlinedInput
          required
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
      </FormControl>
    </Box>
  );
};

export default SecretForm;
