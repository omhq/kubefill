import { useEffect, useState } from "react";
import { FormData, ApplicationFull } from "../types";
import { fetchApplication, startJob } from "../requests/applications";
import ApplicationForm from "./ApplicationForm";
import { useParams } from "react-router-dom";
import Bar from "./Bar";
import _ from "lodash";
import { Alert, Container } from "@mui/material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";

const Public = () => {
  const { appId } = useParams<{ appId: string }>();
  const [formData, setFormData] = useState<FormData>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [loading, setLoading] = useState<boolean>(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleRun = () => {
    if (application && formData) {
      const obj = {};

      for (const key in formData) {
        if (key in formData) {
          _.set(obj, key, formData[key]);
        }
      }

      setLoading(true);

      startJob(application.app.id, obj)
        .then((resp: any) => {
          setJobId(resp.job.id);
          enqueueSnackbar("Job started", {
            variant: "success",
          });
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
    if (appId) {
      fetchApplication(parseInt(appId)).then((data) => {
        if (data?.manifests?.data) {
          setFormData(data.manifests.data);
        }

        setApplication(data);
      });
    }
  }, [appId]);

  return (
    <>
      {appId && <Bar appId={appId} run={handleRun} jobId={jobId} loading={loading} />}
      {application && (
        <>
          {application?.manifests ? (
            <Container sx={{ mt: 10, mb: 2, px: 2 }} maxWidth="md">
              <ApplicationForm
                defaultData={application.manifests.data}
                schema={application.manifests.schema}
                uiSchema={application.manifests.ui_schema}
                handleFormChange={handleFormChange}
              />
            </Container>
          ) : (
            <Container sx={{ mt: 12, mb: 2, px: 2 }} maxWidth="sm">
              <Alert severity="warning">
                Missing manifests! Make sure a repository is connected to this app.
              </Alert>
            </Container>
          )}
        </>
      )}
    </>
  );
};

export default Public;
