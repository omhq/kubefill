import ApplicationForm from "./ApplicationForm";
import { useEffect, useState } from "react";
import { Crumb, Crumbs } from "../Crumbs";
import ApplicationCreateBar from "./ApplicationCreateBar";
import { createApplication } from "../requests/applications";
import Drawer from "../globals/Drawer";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { fetchRepos } from "../requests/repos";
import { FormikValues } from "formik";
import { useNavigate } from "react-router-dom";

const ApplicationCreate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [formValid, setFormValid] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>();
  const [repos, setRepos] = useState<any>();
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
    setCrumbs([
      {
        label: "applications",
        path: "/",
        current: false,
      },
      {
        label: "new",
        path: `/applications/new`,
        current: true,
      },
    ]);

    setFormDefaults({
      name: "",
      manifest_path: "",
      repo_id: "",
    });
  }, []);

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch((err) =>
        enqueueSnackbar(getErrorMessage(err), {
          variant: "error",
        })
      );
  }, [enqueueSnackbar]);

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values);
  };

  return (
    <>
      <Drawer
        child={
          <ApplicationCreateBar create={handleCreate} formValid={formValid} loading={loading} />
        }
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {repos && formDefaults && (
              <ApplicationForm
                repos={repos}
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

export default ApplicationCreate;
