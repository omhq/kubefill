import { useEffect, useState } from "react";
import { fetchJob, deleteJob } from "../requests/jobs";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs } from "../Crumbs";
import { ApplicationFull } from "../types";
import { fetchApplication } from "../requests/applications";
import Logs from "./Logs";
import {
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Hidden,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { getErrorMessage, getServerPort } from "../requests/utils";
import { WS_PATH, WS_SECURE, SERVER_HOSTNAME } from "../constants";
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";

const JobContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  row-gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const JobHeader = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
  column-gap: ${({ theme }) => theme.spacing(1)};
`;

const JobName = styled(Typography)``;

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;

const getUniqueID = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + "-" + s4();
};

const colorByPhase = { Running: "warning", Succeeded: "success", Failed: "error" };

const Job = () => {
  const { jobId, appId } = useParams<{ jobId: string; appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [job, setJob] = useState<any>();
  const [deleting, setDelelting] = useState<boolean>(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const handleDelete = () => {
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (application?.app && jobId) {
      setOpen(false);
      setDelelting(true);
      deleteJob(jobId)
        .then(() => {
          enqueueSnackbar("Deleted", {
            variant: "success",
          });
          navigate(`/applications/${application.app.id}/runs`);
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        })
        .finally(() => {
          setDelelting(false);
        });
    }
  };

  useEffect(() => {
    let unsubscribed = false;

    if (jobId && appId) {
      fetchJob(parseInt(jobId)).then((data) => {
        if (!unsubscribed) {
          setJob(data);
        }
      });

      fetchApplication(parseInt(appId)).then((data) => {
        if (!unsubscribed) {
          setApplication(data);
        }
      });
    }

    return () => {
      unsubscribed = true;
    };
  }, [jobId, appId]);

  useEffect(() => {
    if (ws === null && uniqueId) {
      const PORT = getServerPort();
      const connection = new WebSocket(
        `${WS_SECURE === "true" ? `wss` : `ws`}://${DOMAIN}${
          PORT ? `:${PORT}` : ""
        }/${WS_PATH}?id=${uniqueId}`
      );

      setWs(connection);
    }

    return () => {
      if (ws) {
        ws.close();
        setWs(null);
      }
    };
  }, [ws, uniqueId]);

  useEffect(() => {
    setUniqueId(getUniqueID());

    return () => {
      setUniqueId(null);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{"Confirm delete?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>This action can't be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <WorkspaceNavBar>
        <Crumbs
          crumbs={
            application
              ? [
                  {
                    label: "apps",
                    path: "/",
                    current: false,
                  },
                  {
                    label: application.app.name,
                    path: `/applications/${application.app.id}`,
                    current: false,
                  },
                  {
                    label: "runs",
                    path: `/applications/${application.app.id}/runs`,
                    current: false,
                  },
                  {
                    label: job.id,
                    path: `/applications/${application.app.id}/runs/${job.id}`,
                    current: true,
                  },
                ]
              : []
          }
        />

        <Actions>
          <LoadingAction
            aria-label="delete"
            disabled={deleting}
            onClick={handleDelete}
            loading={deleting}
            icon="delete"
          >
            Delete
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      {job && (
        <JobContainer>
          <JobHeader>
            <JobName>{job.name}</JobName>

            {job.phase && (
              <Chip
                size="small"
                label={job.phase}
                color={(colorByPhase as any)[job.phase]}
                variant="outlined"
              />
            )}
          </JobHeader>
          <Logs ws={ws} job={job} />
        </JobContainer>
      )}
    </>
  );
};

export default Job;
