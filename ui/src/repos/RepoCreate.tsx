import RepoForm from "./RepoForm";
import { useState } from "react";
import { Crumbs } from "../Crumbs";
import { createRepo } from "../requests/repos";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { FormikValues } from "formik";
import { useNavigate } from "react-router-dom";
import { RepoCreate as RepoCreateType } from "../types";
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";

const formDefaults = {
  url: "",
  branch: "",
  ssh_private_key: "",
};

const RepoCreate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formValid, setFormValid] = useState(false);
  const [formValues, setFormValues] = useState<RepoCreateType>();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleCreate = () => {
    if (formValid && formValues) {
      setLoading(true);
      createRepo(formValues)
        .then((createResp: any) => {
          enqueueSnackbar("Created", {
            variant: "success",
          });
          navigate(`/repos/${createResp.id}`);
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values as RepoCreateType);
  };

  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={[
            {
              label: "repos",
              path: "/repos",
              current: false,
              icon: "code",
            },
            {
              label: "new",
              path: `/repos/new`,
              current: true,
            },
          ]}
        />
        <Actions>
          <LoadingAction
            disabled={!formValid}
            loading={loading}
            onClick={handleCreate}
            color="inherit"
            icon="save"
          >
            Create
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      <RepoForm
        repoId={0}
        initialValues={formDefaults}
        formValid={setFormValid}
        handleValueUpdate={handleValueUpdate}
      />
    </>
  );
};

export default RepoCreate;
