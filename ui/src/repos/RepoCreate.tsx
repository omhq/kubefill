import RepoForm from "./RepoForm";
import { useEffect, useState } from "react";
import { Crumb, Crumbs } from "../Crumbs";
import RepoCreateBar from "./RepoCreateBar";
import { createRepo } from "../requests/repos";
import Drawer from "../globals/Drawer";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { FormikValues } from "formik";
import { useNavigate } from "react-router-dom";
import { RepoCreate as RepoCreateType } from "../types";

const RepoCreate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [formValid, setFormValid] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>();
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

  useEffect(() => {
    setCrumbs([
      {
        label: "repos",
        path: "/",
        current: false,
      },
      {
        label: "new",
        path: `/repos/new`,
        current: true,
      },
    ]);

    setFormDefaults({
      url: "",
      branch: "",
      ssh_private_key: "",
    });
  }, []);

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values as RepoCreateType);
  };

  return (
    <>
      <Drawer
        child={<RepoCreateBar create={handleCreate} formValid={formValid} loading={loading} />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {formDefaults && (
              <RepoForm
                repoId={0}
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

export default RepoCreate;
