import { useEffect } from "react";
import {
  Box,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import { FormikValues, useFormik } from "formik";
import { ValidationSchema } from "./ValidationSchema";

type ApplicationFormParams = {
  repos: any[];
  initialValues: any;
  formValid: (valid: boolean) => void;
  handleValueUpdate: (values: FormikValues) => void;
};

const ApplicationForm = ({
  repos,
  initialValues,
  formValid,
  handleValueUpdate,
}: ApplicationFormParams) => {
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,

    validateOnMount: true,
    validationSchema: ValidationSchema,
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
    <>
      <Container sx={{ mt: 4, mb: 2, p: 0 }} maxWidth="sm">
        <Box
          component="form"
          sx={{
            "& .MuiTextField-root": { width: "25ch" },
          }}
          noValidate
          autoComplete="off"
        >
          <FormControl
            error={!!formik.touched?.name && !!formik.errors?.name}
            fullWidth
            sx={{ mb: 2 }}
          >
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

            {!!formik.touched?.name && formik.errors?.name && (
              <FormHelperText id="name-error-text">
                <>{formik.errors?.name}</>
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            error={!!formik.touched?.repo_id && !!formik.errors?.repo_id}
            fullWidth
            sx={{ mb: 2 }}
          >
            <InputLabel id="repo-id-label">Repo</InputLabel>
            <Select
              required
              error={!!formik.touched?.repo_id && !!formik.errors?.repo_id}
              labelId="repo-id-label"
              id="repo_id"
              name="repo_id"
              label="Repo"
              value={formik.values?.repo_id || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              {repos.map((repo) => (
                <MenuItem key={repo.id} value={repo.id}>
                  {repo.url}
                </MenuItem>
              ))}
            </Select>

            {formik.touched?.repo_id && formik.errors?.repo_id && (
              <FormHelperText id="name-error-text">
                <>{formik.errors?.repo_id}</>
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            error={!!formik.touched?.manifest_path && !!formik.errors?.manifest_path}
            fullWidth
            sx={{ mb: 2 }}
          >
            <InputLabel htmlFor="manifest_path">Manifests path</InputLabel>
            <OutlinedInput
              required
              error={!!formik.touched?.manifest_path && !!formik.errors?.manifest_path}
              id="manifest_path"
              name="manifest_path"
              label="Manifests path"
              value={formik.values?.manifest_path || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            {formik.touched?.manifest_path && formik.errors?.manifest_path && (
              <FormHelperText id="name-error-text">
                <>{formik.errors?.manifest_path}</>
              </FormHelperText>
            )}
          </FormControl>
        </Box>
      </Container>
    </>
  );
};

export default ApplicationForm;
