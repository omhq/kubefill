import { useEffect } from "react";
import {
  Box,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { FormikValues, useFormik } from "formik";
import { CreateValidationSchema, UpdateValidationSchema } from "./ValidationSchemas";
import { RepoCreate } from "../types";

type RepoFormParams = {
  repoId: number;
  initialValues: RepoCreate;
  formValid: (valid: boolean) => void;
  handleValueUpdate: (values: FormikValues) => void;
};

const RepoForm = ({ repoId, initialValues, formValid, handleValueUpdate }: RepoFormParams) => {
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validateOnMount: true,
    validationSchema: repoId ? UpdateValidationSchema : CreateValidationSchema,
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
      <FormControl error={!!formik.touched?.url && !!formik.errors?.url} fullWidth sx={{ mb: 2 }}>
        <InputLabel htmlFor="name">Repository URL</InputLabel>
        <OutlinedInput
          required
          error={!!formik.touched?.url && !!formik.errors?.url}
          id="url"
          name="url"
          label="Repository URL"
          value={formik.values?.url}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched?.url && formik.errors?.url && (
          <FormHelperText id="url-error-text">
            <>{formik.errors?.url}</>
          </FormHelperText>
        )}
      </FormControl>

      <FormControl
        error={!!formik.touched?.branch && !!formik.errors?.branch}
        fullWidth
        sx={{ mb: 2 }}
      >
        <InputLabel htmlFor="branch">Branch</InputLabel>
        <OutlinedInput
          required
          error={!!formik.touched?.branch && !!formik.errors?.branch}
          id="branch"
          name="branch"
          label="Branch"
          value={formik.values?.branch || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched?.branch && formik.errors?.branch && (
          <FormHelperText id="name-error-text">
            <>{formik.errors?.branch}</>
          </FormHelperText>
        )}
      </FormControl>

      <FormControl
        error={!!formik.touched?.ssh_private_key && !!formik.errors?.ssh_private_key}
        fullWidth
        sx={{ mb: 2 }}
      >
        <TextField
          required
          error={!!formik.touched?.ssh_private_key && !!formik.errors?.ssh_private_key}
          id="ssh_private_key"
          name="ssh_private_key"
          label="SSH private key data"
          fullWidth
          multiline
          rows={10}
          value={formik.values?.ssh_private_key}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched?.ssh_private_key && formik.errors?.ssh_private_key && (
          <FormHelperText id="ssh-private-key-error-text">
            <>{formik.errors?.ssh_private_key}</>
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default RepoForm;
