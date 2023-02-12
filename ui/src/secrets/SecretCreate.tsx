import SecretForm from "./SecretForm";
import { useEffect, useState } from "react";
import { Crumb, Crumbs } from "../Crumbs";
import SecretCreateBar from "./SecretCreateBar";
import { createApplicationSecret, fetchApplication } from "../requests/applications";
import Drawer from "../globals/Drawer";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { FormikValues } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicationFull, SecretCreate as SecretCreateType } from "../types";

const SecretCreate = () => {
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [loading, setLoading] = useState<boolean>(false);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [formValid, setFormValid] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>();
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
    if (application?.app) {
      setCrumbs([
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
      ]);
    }
  }, [application]);

  useEffect(() => {
    setFormDefaults({
      name: "",
      value: "",
    });
  }, []);

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
      <Drawer
        child={<SecretCreateBar create={handleCreate} formValid={formValid} loading={loading} />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {formDefaults && (
              <SecretForm
                secretId={0}
                initialValues={formDefaults}
                formValid={setFormValid}
                handleValueUpdate={handleValueUpdate}
              />
            )}
          </>
        }
      />
    </>
  );
};

export default SecretCreate;
