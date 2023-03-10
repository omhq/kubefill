import SecretForm from "./SecretForm";
import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { Crumbs } from "../Crumbs";
import { createApplicationSecret, fetchApplication } from "../requests/applications";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { FormikValues } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicationFull, SecretCreate as SecretCreateType } from "../types";
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";

const formDefaults = {
  name: "",
  value: "",
};

const SecretCreate: FunctionComponent = (): ReactElement => {
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [loading, setLoading] = useState<boolean>(false);
  const [formValid, setFormValid] = useState(false);
  const [formValues, setFormValues] = useState<SecretCreateType>();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleCreate = () => {
    if (appId && application && formValid && formValues) {
      setLoading(true);
      createApplicationSecret(appId, formValues)
        .then((createResp: any) => {
          enqueueSnackbar("Created", {
            variant: "success",
          });
          navigate(`/applications/${application.app.id}/secrets/${createResp.id}`);
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
    let unsubscribed = false;

    if (appId) {
      fetchApplication(parseInt(appId)).then((data) => {
        setApplication(data);
      });
    }

    return () => {
      unsubscribed = true;
    };
  }, [appId]);

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values as SecretCreateType);
  };

  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={
            application
              ? [
                  {
                    label: "applications",
                    path: "/applications",
                    current: false,
                  },
                  {
                    label: application.app.name,
                    path: `/applications/${application.app.id}`,
                    current: false,
                  },
                  {
                    label: "secrets",
                    path: `/applications/${application.app.id}/secrets`,
                    current: false,
                  },
                  {
                    label: "new",
                    path: `/applications/${application.app.id}/secrets/new`,
                    current: true,
                  },
                ]
              : []
          }
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

      <SecretForm
        secretId={0}
        initialValues={formDefaults}
        formValid={setFormValid}
        handleValueUpdate={handleValueUpdate}
      />
    </>
  );
};

export default SecretCreate;
