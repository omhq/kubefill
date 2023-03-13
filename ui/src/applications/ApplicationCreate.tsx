import ApplicationForm from "./ApplicationForm";
import { useEffect, useState } from "react";
import { Crumbs } from "../Crumbs";
import { createApplication } from "../requests/applications";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { fetchRepos } from "../requests/repos";
import { FormikValues } from "formik";
import { useNavigate } from "react-router-dom";
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";
import { styled } from "@mui/material";
import { Container } from "@mui/system";

const FormContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  max-width: 800px;
`;

const formDefaults = {
  name: "",
  manifest_path: "",
  repo_id: "",
};

const ApplicationCreate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formValid, setFormValid] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Partial<any>>();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleCreate = () => {
    if (formValid && formValues) {
      setLoading(true);
      createApplication(formValues)
        .then((createResp: any) => {
          enqueueSnackbar("Created", {
            variant: "success",
          });
          navigate(`/applications/${createResp.id}`);
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

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      });
  }, [enqueueSnackbar]);

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values);
  };

  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={[
            {
              label: "apps",
              path: "/",
              current: false,
            },
            {
              label: "new",
              path: `/applications/new`,
              current: true,
            },
          ]}
        />
        <Actions>
          <LoadingAction disabled={!formValid} loading={loading} onClick={handleCreate}>
            Create
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      <FormContainer sx={{ mt: 2 }} maxWidth={false}>
        <ApplicationForm
          repos={repos}
          initialValues={formDefaults}
          formValid={setFormValid}
          handleValueUpdate={handleValueUpdate}
        />
      </FormContainer>
    </>
  );
};

export default ApplicationCreate;
