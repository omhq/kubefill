import { useEffect, useState } from "react";
import { fetchJob, deleteJob } from "../requests/jobs";
import { useNavigate, useParams } from "react-router-dom";
import { Crumb, Crumbs } from "../Crumbs";
import { ApplicationFull } from "../types";
import { fetchApplication } from "../requests/applications";
import Logs from "./Logs";
import Drawer from "../globals/Drawer";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import JobBar from "./JobBar";
import { useSnackbar } from "notistack";
import { getErrorMessage, getServerPort } from "../requests/utils";
import { WS_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;

const getUniqueID = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + "-" + s4();
};

const Job = () => {
  const { jobId, appId } = useParams<{ jobId: string; appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [job, setJob] = useState<any>();
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
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
    if (application?.app && job) {
      setCrumbs([
        {
          label: "applications",
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
      ]);
    }
  }, [application, job]);

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
        `ws://${DOMAIN}${PORT ? `:${PORT}` : ""}/${WS_PATH}?id=${uniqueId}`
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

      <Drawer
        child={<JobBar deleting={deleting} del={handleDelete} />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {job && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ p: 1 }}>{job.name}</Box>

                  <Box sx={{ p: 1 }}>
                    {job.phase && (
                      <>
                        {job.phase === "Running" && (
                          <>
                            <Chip label={job.phase} color="warning" variant="outlined" />
                          </>
                        )}

                        {job.phase === "Succeeded" && (
                          <>
                            <Chip label={job.phase} color="success" variant="outlined" />
                          </>
                        )}

                        {job.phase === "Failed" && (
                          <>
                            <Chip label={job.phase} color="error" variant="outlined" />
                          </>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
                <Logs ws={ws} job={job} />
              </>
            )}
          </>
        }
      />
    </>
  );
};

export default Job;
