import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { FormData, ApplicationFull } from "../types";
import { fetchApplication, startJob } from "../requests/applications";
import ApplicationForm from "./ApplicationForm";
import { useParams } from "react-router-dom";
import _ from "lodash";
import { Alert, CircularProgress, Container, styled, useTheme } from "@mui/material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import {
  Actions,
  HorizontalFiller,
  LinkAction,
  LoadingAction,
  WorkspaceNavBar,
} from "../components";
import { Crumbs } from "../Crumbs";

const FormContainer = styled(Container)`
  display: flex;
  flex-direction: column;
`;

const CircularProgressContainer = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: calc(100vh - 56px - 56px);
`;

const Run: FunctionComponent = (): ReactElement => {
  const { appId } = useParams<{ appId: string }>();
  const [formData, setFormData] = useState<FormData>();
  const [cloneData, setCloneData] = useState<FormData>();
  const [application, setApplication] = useState<ApplicationFull>();
  let [loading, setLoading] = useState<boolean>(false);
  const [loadingApp, setLoadingApp] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  useEffect(() => {
    const obj = { ...cloneData };

    for (const key in formData) {
      if (key in formData) {
        _.set(obj, key, formData[key]);
      }
    }

    setCloneData(obj);
  }, [formData]);

  const handleRun = () => {
    if (application && cloneData) {
      setLoading(true);

      startJob(application.app.id, cloneData)
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
      setLoadingApp(true);
      fetchApplication(parseInt(appId)).then((data) => {
        if (data?.manifests?.data) {
          setFormData(data.manifests.data);
          setCloneData(data.manifests.data);
        }

        setApplication(data);
        setLoadingApp(false);
      });
    }
  }, [appId]);

  const theme = useTheme();

  return (
    <>
      <WorkspaceNavBar>
        {application && (
          <Crumbs
            crumbs={[
              {
                label: "applications",
                path: "/",
                current: false,
                icon: "apps",
              },
              {
                label: application.app.name,
                path: `/applications/${application.app.id}`,
                current: false,
              },
              {
                label: "run",
                path: `/applications/${application.app.id}/run`,
                current: true,
                icon: "play_arrow",
              },
            ]}
          />
        )}
        {!application && <HorizontalFiller />}

        <Actions>
          {jobId && (
            <LinkAction to={`/applications/${appId}/runs/${jobId}`} icon="list">
              Logs
            </LinkAction>
          )}

          <LoadingAction
            disabled={loading || loadingApp}
            loading={loading}
            onClick={handleRun}
            icon="play_circle"
            iconColor={theme.palette.success.main}
          >
            Run
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      {!loadingApp && (
        <FormContainer>
          {application?.manifests && (
            <ApplicationForm
              defaultData={application.manifests.data}
              schema={application.manifests.schema}
              uiSchema={application.manifests.ui_schema}
              handleFormChange={handleFormChange}
            />
          )}

          {!application?.manifests && (
            <Alert severity="warning">
              Missing manifests! Make sure a repository is connected to this app.
            </Alert>
          )}
        </FormContainer>
      )}
      {loadingApp && (
        <CircularProgressContainer>
          <CircularProgress size={22} />
        </CircularProgressContainer>
      )}
    </>
  );
};

export default Run;
