import * as Yup from "yup";

export const ValidationSchema = Yup.object({
  name: Yup.string()
    .min(4, "Name should be 4-100 chars long")
    .max(100, "Name should be 4-100 chars long")
    .required("Input required"),
  repo_id: Yup.string().required("Input required"),
  manifest_path: Yup.string().required("Input required"),
});
