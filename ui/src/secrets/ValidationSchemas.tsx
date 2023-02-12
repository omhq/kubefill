import * as Yup from "yup";

export const CreateValidationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[^\n ]*$/, "Spaces not allowed")
    .required("Input required"),
  value: Yup.string().required("Input required"),
});

export const UpdateValidationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[^\n ]*$/, "Spaces not allowed")
    .required("Input required"),
  value: Yup.string().required("Input required"),
});
