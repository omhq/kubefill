import * as Yup from "yup";

export const CreateValidationSchema = Yup.object({
  url: Yup.string()
    .matches(
      /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?$/,
      "Enter an SSH URL, like git@github.com:user/repo.git"
    )
    .required("Input required"),
  branch: Yup.string().required("Input required"),
  ssh_private_key: Yup.string().required("Input required"),
});

export const UpdateValidationSchema = Yup.object({
  url: Yup.string()
    .matches(
      /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?$/,
      "Enter an SSH URL, like git@github.com:user/repo.git"
    )
    .required("Input required"),
  branch: Yup.string().required("Input required"),
});
